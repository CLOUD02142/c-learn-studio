/**
 * C-Learn Studio 本地服务
 * 零依赖：只用 Node 内置模块。负责静态托管 + 调用本机 gcc 真编译真运行 + AI 代理。
 *
 * 接口一览
 *   GET  /api/health          环境自检（gcc 版本、node 版本、trace.h 是否就绪）
 *   POST /api/run             编译并运行
 *   POST /api/compile         只编译，不运行（练习题的「编译」按钮用它）
 *   POST /api/compiler        重新探测 / 手动指定 gcc 路径
 *   POST /api/ai/chat         转发到用户自己填的 OpenAI 兼容接口（可选功能）
 *   POST /api/ai/test         用一句话试探 Key 是否可用
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const START_PORT = Number(process.env.PORT || 7788);

/* 本地令牌：只发给同源页面（跨域读不到响应体），挡住"别的网站往本机端口发代码来编译"*/
const LOCAL_TOKEN = crypto.randomBytes(16).toString('hex');
const LOOPBACK_ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i;

/* 可视化埋点头文件：每次编译时丢进临时目录，用户代码 #include "trace.h" 就能用 */
const TRACE_PREFIX = '@@TR@@';
const TRACE_MAX_FRAMES = 8000;
let TRACE_HEADER_SRC = '';
try {
  TRACE_HEADER_SRC = fs.readFileSync(path.join(ROOT, 'assets', 'trace.h'), 'utf8');
} catch (e) {
  console.warn('[C-Learn] 未找到 assets/trace.h，可视化埋点将不可用');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.md': 'text/markdown; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

const CFONT = ['-finput-charset=UTF-8', '-fexec-charset=UTF-8'];

/* ---------------------------------- gcc 探测 --------------------------------- */

function findGcc() {
  if (process.env.CC && fs.existsSync(process.env.CC)) return process.env.CC;

  const candidates = [];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    candidates.push(path.join(dir, 'gcc.exe'), path.join(dir, 'gcc'));
  }

  // WinGet 安装的 MinGW / WinLibs
  const wingetRoot = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
  try {
    for (const pkg of fs.readdirSync(wingetRoot)) {
      if (!/mingw|winlibs|gcc|llvm|msys/i.test(pkg)) continue;
      const base = path.join(wingetRoot, pkg);
      candidates.push(
        path.join(base, 'mingw64', 'bin', 'gcc.exe'),
        path.join(base, 'mingw32', 'bin', 'gcc.exe')
      );
      // 有些包只有一层版本目录
      try {
        for (const sub of fs.readdirSync(base)) {
          candidates.push(
            path.join(base, sub, 'mingw64', 'bin', 'gcc.exe'),
            path.join(base, sub, 'bin', 'gcc.exe')
          );
        }
      } catch (e) { /* ignore */ }
    }
  } catch (e) { /* ignore */ }

  candidates.push(
    'C:\\mingw64\\bin\\gcc.exe',
    'C:\\MinGW\\bin\\gcc.exe',
    'C:\\msys64\\mingw64\\bin\\gcc.exe',
    'C:\\msys64\\ucrt64\\bin\\gcc.exe',
    'C:\\Program Files\\mingw-w64\\mingw64\\bin\\gcc.exe',
    'C:\\Program Files (x86)\\mingw-w64\\mingw64\\bin\\gcc.exe',
    'C:\\TDM-GCC-64\\bin\\gcc.exe'
  );

  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (e) { /* ignore */ }
  }
  return null;
}

let GCC_PATH = findGcc();
let GCC_VERSION = '';

function probeGcc() {
  return new Promise((resolve) => {
    if (!GCC_PATH) { GCC_VERSION = ''; return resolve(null); }
    execFile(GCC_PATH, ['--version'], { windowsHide: true, timeout: 8000 }, (err, stdout) => {
      if (err) { GCC_PATH = null; GCC_VERSION = ''; return resolve(null); }
      GCC_VERSION = String(stdout || '').split('\n')[0].trim();
      resolve(GCC_VERSION);
    });
  });
}

/* --------------------------------- 进程执行封装 -------------------------------- */

function runProc(file, args, { cwd, input, timeout }) {
  return new Promise((resolve) => {
    const opts = {
      cwd,
      timeout,
      maxBuffer: 8 * 1024 * 1024,
      encoding: 'utf8',
      windowsHide: true,
      env: Object.assign({}, process.env, { LANG: 'C.UTF-8' })
    };
    const child = execFile(file, args, opts, (err, stdout, stderr) => {
      resolve({
        stdout: stdout || '',
        stderr: stderr || '',
        code: err && typeof err.code === 'number' ? err.code : (err ? 1 : 0),
        killed: !!(err && err.killed),
        failed: !!err
      });
    });
    try {
      if (input) child.stdin.write(input);
      child.stdin.end();
    } catch (e) { /* 进程已退出，忽略 EPIPE */ }
  });
}

/* ---------------------------------- 诊断解析 --------------------------------- */

function parseDiagnostics(stderrText) {
  const list = [];
  const lines = String(stderrText || '').split(/\r?\n/);
  const re = /^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.*)$/i;
  for (const line of lines) {
    const m = line.match(re);
    if (!m) continue;
    const sev = m[4].toLowerCase();
    list.push({
      file: path.basename(m[1]),
      line: Number(m[2]),
      col: Number(m[3] || 1),
      severity: sev.includes('error') ? 'error' : (sev === 'warning' ? 'warning' : 'info'),
      message: m[5].trim()
    });
  }
  // 链接期错误没有行号，单独捞一手
  if (!list.some(d => d.severity === 'error')) {
    const linkRe = /^(?:.*?:\s*)?(undefined reference to .+|multiple definition of .+|ld returned \d+ exit status)/i;
    for (const line of lines) {
      const m = line.match(linkRe);
      if (!m) continue;
      list.push({ file: 'link', line: 0, col: 0, severity: 'error', message: m[1].trim(), stage: 'link' });
    }
  }
  return list;
}

/* ---------------------------- 可视化埋点分流 ---------------------------- */

/**
 * 从程序输出里把 @@TR@@{json} 行摘出来。
 * 埋点有可能和普通 printf 挤在同一行（printf 没换行，紧接着 tr_end()），
 * 所以按"前缀出现的位置"切——前缀之前的内容仍然算普通输出，不能吞。
 */
function splitTrace(text) {
  const traces = [];
  const keep = [];
  let dropped = 0;
  for (const line of String(text || '').split('\n')) {
    const at = line.indexOf(TRACE_PREFIX);
    if (at === -1) { keep.push(line); continue; }
    if (at > 0) keep.push(line.slice(0, at));
    if (traces.length >= TRACE_MAX_FRAMES) { dropped++; continue; }
    try {
      const frame = JSON.parse(line.slice(at + TRACE_PREFIX.length));
      if (frame && typeof frame === 'object' && Array.isArray(frame.views)) traces.push(frame);
      else dropped++;
    } catch (e) {
      dropped++;
    }
  }
  return { traces, stdout: keep.join('\n'), dropped };
}

/* --------------------------------- 编译 -------------------------------- */

function cleanup(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
}

/**
 * 把代码写进临时目录并调用 gcc。
 * 编译参数集中在这里，/api/run 与 /api/compile 共用，保证两边结论一致。
 */
async function compileSource(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c-learn-'));
  const srcName = 'main.c';
  const srcPath = path.join(dir, srcName);
  const exePath = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main.out');
  fs.writeFileSync(srcPath, code, 'utf8');
  // 埋点头文件跟着源码放一起，用户 #include "trace.h" 直接命中同目录
  if (TRACE_HEADER_SRC) {
    fs.writeFileSync(path.join(dir, 'trace.h'), TRACE_HEADER_SRC, 'utf8');
  }

  const ccArgs = [
    '-std=c11', '-O0', '-g0', '-Wall', '-Wextra',
    '-Wno-unused-parameter', '-Wno-unused-variable', '-Wno-sign-compare',
    ...CFONT, '-fdiagnostics-color=never',
    '-o', exePath, srcName, '-lm'
  ];

  const t0 = Date.now();
  const cc = await runProc(GCC_PATH, ccArgs, { cwd: dir, timeout: 30000 });
  const compileMs = Date.now() - t0;
  const compilerOutput = (cc.stdout || '') + (cc.stderr || '');
  const diagnostics = parseDiagnostics(cc.stderr);

  return {
    dir, exePath, compileMs, compilerOutput, diagnostics,
    ok: !(cc.failed || !fs.existsSync(exePath))
  };
}

async function handleRun(req, res) {
  let code = '';
  let stdin = '';
  let wantArgs = false;
  try {
    const raw = await readBody(req, 4 * 1024 * 1024);
    const data = JSON.parse(raw || '{}');
    code = String(data.code == null ? '' : data.code);
    stdin = String(data.stdin == null ? '' : data.stdin);
    wantArgs = !!data.args;
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: '请求体解析失败：' + e.message });
  }

  if (!code.trim()) return sendJson(res, 200, { ok: false, error: '编辑器里还是空的，先写点代码再运行吧。' });
  if (!GCC_PATH) {
    return sendJson(res, 200, {
      ok: false,
      error: '没有找到 gcc 编译器。请安装 MinGW-w64（或把 gcc.exe 所在目录加入 PATH），然后在设置里手动指定 gcc 路径。',
      noCompiler: true
    });
  }

  const cc = await compileSource(code);
  if (!cc.ok) {
    cleanup(cc.dir);
    return sendJson(res, 200, {
      ok: false,
      stage: 'compile',
      error: '编译失败',
      compileMs: cc.compileMs,
      compilerOutput: cc.compilerOutput,
      diagnostics: cc.diagnostics
    });
  }

  const t1 = Date.now();
  const run = await runProc(cc.exePath, wantArgs ? [] : [], { cwd: cc.dir, input: stdin, timeout: 5000 });
  const runMs = Date.now() - t1;
  cleanup(cc.dir);

  const out = run.stdout.replace(/\r\n/g, '\n');
  const errOut = run.stderr.replace(/\r\n/g, '\n');
  const tsplit = splitTrace(out);

  return sendJson(res, 200, {
    ok: true,
    compileMs: cc.compileMs,
    runMs,
    stdout: tsplit.stdout,
    stderr: errOut,
    exitCode: run.code,
    timedOut: run.killed,
    traces: tsplit.traces,
    traceDropped: tsplit.dropped,
    warnings: cc.diagnostics.filter(d => d.severity === 'warning'),
    compilerOutput: cc.compilerOutput
  });
}

/**
 * 只编译不运行。
 * 练习题的「编译」按钮用它——语法错不用等运行那 5 秒，警告也能单独看清楚。
 */
async function handleCompile(req, res) {
  let code = '';
  try {
    const raw = await readBody(req, 4 * 1024 * 1024);
    code = String((JSON.parse(raw || '{}').code) || '');
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: '请求体解析失败：' + e.message });
  }
  if (!code.trim()) return sendJson(res, 200, { ok: false, error: '编辑器是空的，没什么可编译的。' });
  if (!GCC_PATH) {
    return sendJson(res, 200, {
      ok: false,
      noCompiler: true,
      error: '没有找到 gcc 编译器，先装一个 MinGW-w64 吧。'
    });
  }

  const cc = await compileSource(code);
  cleanup(cc.dir);
  return sendJson(res, 200, {
    ok: cc.ok,
    stage: cc.ok ? 'ok' : 'compile',
    compileMs: cc.compileMs,
    error: cc.ok ? '' : '编译失败',
    compilerOutput: cc.compilerOutput,
    diagnostics: cc.diagnostics,
    warnings: cc.diagnostics.filter(d => d.severity === 'warning')
  });
}

/* --------------------------------- 多用例判题 -------------------------------- */

/**
 * 一次编译，跑多组输入。
 * 客户端负责比对（它手里才有 expected），服务端只负责"喂不同的 stdin 跑一遍"，
 * 这样判题规则只有一份，不会出现前后端各判一次、结论还不一样的情况。
 */
async function handleJudge(req, res) {
  let code = '';
  let cases = [];
  try {
    const raw = await readBody(req, 4 * 1024 * 1024);
    const data = JSON.parse(raw || '{}');
    code = String(data.code == null ? '' : data.code);
    cases = Array.isArray(data.cases) ? data.cases.slice(0, 8) : [];
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: '请求体解析失败：' + e.message });
  }
  if (!code.trim()) return sendJson(res, 200, { ok: false, error: '编辑器是空的' });
  if (!cases.length) return sendJson(res, 200, { ok: false, error: '没有可运行的用例' });
  if (!GCC_PATH) {
    return sendJson(res, 200, { ok: false, noCompiler: true, error: '没有找到 gcc 编译器。' });
  }

  const cc = await compileSource(code);
  if (!cc.ok) {
    cleanup(cc.dir);
    return sendJson(res, 200, {
      ok: false,
      stage: 'compile',
      error: '编译失败',
      compileMs: cc.compileMs,
      compilerOutput: cc.compilerOutput,
      diagnostics: cc.diagnostics
    });
  }

  const results = [];
  for (const c of cases) {
    const t = Date.now();
    const run = await runProc(cc.exePath, [], {
      cwd: cc.dir,
      input: String(c.stdin == null ? '' : c.stdin),
      timeout: 5000
    });
    results.push({
      note: String(c.note || ''),
      stdin: String(c.stdin == null ? '' : c.stdin),
      stdout: run.stdout.replace(/\r\n/g, '\n'),
      stderr: run.stderr.replace(/\r\n/g, '\n'),
      exitCode: run.code,
      timedOut: run.killed,
      runMs: Date.now() - t
    });
  }
  cleanup(cc.dir);

  return sendJson(res, 200, {
    ok: true,
    compileMs: cc.compileMs,
    results,
    warnings: cc.diagnostics.filter(d => d.severity === 'warning'),
    compilerOutput: cc.compilerOutput
  });
}

/* --------------------------------- 环境自检 -------------------------------- */

/**
 * 真的编译 + 运行一次最小程序。
 * 只看 `gcc --version` 是不够的——MinGW 装坏、缺 libgcc、杀软拦截都会让版本号正常但编译失败。
 */
async function handleSelfcheck(req, res) {
  const probe = '#include <stdio.h>\nint main(void){ printf("clearn-selfcheck\\n"); return 0; }\n';
  if (!GCC_PATH) {
    return sendJson(res, 200, { ok: false, stage: 'compiler', error: '没有找到 gcc' });
  }
  const cc = await compileSource(probe);
  if (!cc.ok) {
    cleanup(cc.dir);
    return sendJson(res, 200, {
      ok: false, stage: 'compile', error: '编译器无法完成最小程序的编译',
      compilerOutput: cc.compilerOutput, diagnostics: cc.diagnostics
    });
  }
  const t = Date.now();
  const run = await runProc(cc.exePath, [], { cwd: cc.dir, input: '', timeout: 8000 });
  const runMs = Date.now() - t;
  cleanup(cc.dir);
  const out = String(run.stdout || '').trim();
  return sendJson(res, 200, {
    ok: out === 'clearn-selfcheck',
    stage: out === 'clearn-selfcheck' ? 'ok' : 'run',
    compileMs: cc.compileMs,
    runMs: runMs,
    stdout: out,
    stderr: String(run.stderr || '').slice(0, 400),
    error: out === 'clearn-selfcheck' ? '' : '编译成功但运行结果不对（可能是杀毒软件拦截了新生成的 exe）'
  });
}

/* --------------------------------- AI 代理 -------------------------------- */

/**
 * 关于安全：API Key 只存在用户自己的浏览器 localStorage 里，
 * 每次请求随 body 发给本机 127.0.0.1 的服务，由服务转发到服务商。
 * 本服务不落盘、不记录、不经过任何第三方中转。
 */
function httpJsonPost(urlStr, payload, headers, timeoutMs) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(urlStr); } catch (e) {
      return resolve({ ok: false, error: '接口地址不合法：' + urlStr });
    }
    if (!/^https?:$/.test(u.protocol)) {
      return resolve({ ok: false, error: '接口地址必须以 http:// 或 https:// 开头' });
    }
    let settled = false;
    const done = (v) => { if (!settled) { settled = true; resolve(v); } };

    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const lib = u.protocol === 'http:' ? http : https;
    const req = lib.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'http:' ? 80 : 443),
      path: u.pathname + u.search,
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'Accept': 'application/json'
      }, headers || {})
    }, (r) => {
      const chunks = [];
      r.on('data', c => chunks.push(c));
      r.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = JSON.parse(text); } catch (e) { /* 有的网关会返回 HTML 错误页 */ }
        done({ ok: r.statusCode >= 200 && r.statusCode < 300, status: r.statusCode, json, text });
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      done({ ok: false, error: '请求超时（' + Math.round(timeoutMs / 1000) + ' 秒）。网络慢或接口地址不对。' });
    });
    req.on('error', (e) => done({ ok: false, error: '连不上接口：' + e.message }));
    req.write(body);
    req.end();
  });
}

function apiKeyLooksValid(key) {
  return typeof key === 'string' && key.trim().length >= 8;
}

async function handleAiChat(req, res, isTest) {
  let data = {};
  try {
    data = JSON.parse(await readBody(req, 512 * 1024) || '{}');
  } catch (e) {
    return sendJson(res, 400, { ok: false, error: '请求体解析失败' });
  }

  const baseURL = String(data.baseURL || '').trim().replace(/\/+$/, '');
  const apiKey = String(data.apiKey || '').trim() || process.env.AI_API_KEY || '';
  const model = String(data.model || '').trim();
  const messages = Array.isArray(data.messages) ? data.messages : [];

  if (!baseURL) return sendJson(res, 200, { ok: false, error: '还没填接口地址（Base URL）' });
  // 本地模型（Ollama / LM Studio / vLLM）本来就不需要 Key
  const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?/i.test(baseURL);
  if (!isLocal && !apiKeyLooksValid(apiKey)) return sendJson(res, 200, { ok: false, error: 'API Key 看起来是空的或者太短' });
  if (!model) return sendJson(res, 200, { ok: false, error: '还没填模型名' });

  const payload = {
    model,
    messages: isTest
      ? [{ role: 'user', content: '只回复两个字：可用' }]
      : messages.slice(-12),
    temperature: isTest ? 0 : Number(data.temperature == null ? 0.3 : data.temperature),
    max_tokens: isTest ? 16 : Number(data.maxTokens || 1400),
    stream: false
  };

  const url = /\/chat\/completions$/.test(baseURL) ? baseURL : baseURL + '/chat/completions';
  const headers = isLocal && !apiKey ? {} : { 'Authorization': 'Bearer ' + apiKey };
  const t0 = Date.now();
  const r = await httpJsonPost(url, payload, headers, isTest ? 20000 : 90000);
  const latencyMs = Date.now() - t0;

  if (!r.ok && !r.json) {
    const detail = String(r.text || r.error || '').slice(0, 400);
    return sendJson(res, 200, { ok: false, status: r.status, error: r.error || ('接口返回 ' + r.status), detail });
  }

  const j = r.json || {};
  if (j.error) {
    return sendJson(res, 200, {
      ok: false,
      status: r.status,
      error: (j.error && (j.error.message || j.error.code)) || '接口返回错误',
      detail: JSON.stringify(j.error).slice(0, 400)
    });
  }
  const choice = (j.choices && j.choices[0]) || {};
  const content = (choice.message && choice.message.content) ||
    (choice.delta && choice.delta.content) || j.output_text ||
    (j.choices && j.choices[0] && j.choices[0].text) || '';

  if (!String(content).trim()) {
    return sendJson(res, 200, {
      ok: false,
      status: r.status,
      error: '接口通了，但没返回内容（模型名或 max_tokens 可能不对）',
      detail: JSON.stringify(j).slice(0, 400)
    });
  }

  return sendJson(res, 200, {
    ok: true,
    content: String(content),
    model: j.model || model,
    usage: j.usage || null,
    latencyMs
  });
}

/* ---------------------------------- 静态文件 --------------------------------- */

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const filePath = path.join(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); return res.end('403');
  }
  fs.readFile(filePath, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found: ' + rel);
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

/* ----------------------------------- 工具 ---------------------------------- */

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('请求体过大')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ---------------------------------- 服务器 ---------------------------------- */

/**
 * 写接口的守卫：
 *   1. Origin 必须是本机页面（浏览器发 POST 时一定会带 Origin）
 *   2. 必须带上启动时生成的令牌
 * 目的只有一个：别让用户浏览器里随便哪个网页都能往这个端口塞 C 代码来编译执行。
 */
function guard(req, res) {
  const origin = req.headers.origin || '';
  if (origin && !LOOPBACK_ORIGIN.test(origin)) {
    sendJson(res, 403, { ok: false, error: '来源不被允许：' + origin });
    return false;
  }
  if (req.headers['x-clearn-token'] !== LOCAL_TOKEN) {
    sendJson(res, 403, { ok: false, error: '本地令牌无效，请刷新页面', needToken: true });
    return false;
  }
  return true;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (pathname === '/api/health') {
    return sendJson(res, 200, {
      ok: true,
      gcc: GCC_PATH,
      version: GCC_VERSION,
      platform: process.platform,
      node: process.version,
      trace: !!TRACE_HEADER_SRC,
      aiProxy: true,
      token: LOCAL_TOKEN,
      tokenRequired: true,
      port: Number((String((req.headers.host || '')).split(':')[1]) || START_PORT)
    });
  }
  if (req.method === 'POST' && pathname.startsWith('/api/') && !guard(req, res)) {
    return;
  }
  if (pathname === '/api/run' && req.method === 'POST') {
    return handleRun(req, res).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/compile' && req.method === 'POST') {
    return handleCompile(req, res).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/judge' && req.method === 'POST') {
    return handleJudge(req, res).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/selfcheck' && req.method === 'POST') {
    return handleSelfcheck(req, res).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/ai/chat' && req.method === 'POST') {
    return handleAiChat(req, res, false).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/ai/test' && req.method === 'POST') {
    return handleAiChat(req, res, true).catch((e) => sendJson(res, 500, { ok: false, error: String(e && e.message || e) }));
  }
  if (pathname === '/api/compiler' && req.method === 'POST') {
    return readBody(req, 1024 * 64).then((raw) => {
      const data = JSON.parse(raw || '{}');
      if (data.path) {
        GCC_PATH = String(data.path);
        probeGcc().then(() => sendJson(res, 200, { ok: !!GCC_PATH, version: GCC_VERSION }));
      } else {
        GCC_PATH = findGcc();
        probeGcc().then(() => sendJson(res, 200, { ok: !!GCC_PATH, version: GCC_VERSION }));
      }
    }).catch(() => sendJson(res, 400, { ok: false, error: 'bad request' }));
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); return res.end('Method Not Allowed');
  }
  serveStatic(req, res, pathname);
});

function listen(port, attempt) {
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < 12) {
      listen(port + 1, attempt + 1);
    } else {
      console.error('[C-Learn] 启动失败：', err.message);
      process.exit(1);
    }
  });
  server.listen(port, '127.0.0.1', () => {
    const url = `http://127.0.0.1:${port}`;
    console.log('');
    console.log('  ╔═══════════════════════════════════════════════════════╗');
    console.log('  ║   C-Learn Studio · C 语言 / 数据结构 交互学习台        ║');
    console.log('  ╚═══════════════════════════════════════════════════════╝');
    console.log('');
    console.log('   打开浏览器访问： ' + url);
    console.log('   编译器： ' + (GCC_PATH ? GCC_VERSION || GCC_PATH : '未找到 gcc（只能看教程，不能运行代码）'));
    console.log('   AI 改错： ' + (process.env.AI_API_KEY ? '已通过环境变量 AI_API_KEY 提供 Key' : '在网页「设置」里填自己的 API Key 后启用（可跳过）'));
    console.log('   按 Ctrl+C 关闭服务');
    console.log('');
    fs.writeFileSync(path.join(ROOT, '.port'), String(port), 'utf8');

    /* 端口可能是 7788 往后顺延的，所以让服务自己开浏览器，别让 启动.bat 猜。
       自动化脚本里设 CLEARN_NO_OPEN=1 就不会弹窗。 */
    if (process.env.CLEARN_NO_OPEN !== '1' && process.platform === 'win32') {
      try {
        execFile('cmd.exe', ['/c', 'start', '', url], { windowsHide: true }, () => {});
      } catch (e) { /* 打不开浏览器也不影响服务 */ }
    }
  });
}

probeGcc().then(() => listen(START_PORT, 0));
