/**
 * 内容自检脚本：把每个知识点示例、每道练习题的参考答案都真编译真运行一遍。
 * 用法： node tools/verify.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CONTENT = path.join(ROOT, 'public', 'content');

global.window = {};
const files = [
  'ch0-intro.js', 'c-basics.js', 'c-advanced.js', 'ds-linear.js',
  'ds-stack-queue.js', 'ds-string-tree.js', 'ds-graph.js',
  'ds-search-sort.js', 'exercises.js', 'ex-io.js'
];
for (const f of files) require(path.join(CONTENT, f));

const C = global.window.CURRICULUM;
console.log(`加载完成：${C.lessons.length} 个知识点，${C.exercises.length} 道练习题\n`);

let gcc = null;
function findGcc() {
  const cands = [];
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    if (d) cands.push(path.join(d, 'gcc.exe'));
  }
  cands.push('C:\\mingw64\\bin\\gcc.exe');
  try {
    const winget = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WinGet', 'Packages');
    for (const p of fs.readdirSync(winget)) {
      if (!/mingw/i.test(p)) continue;
      cands.push(path.join(winget, p, 'mingw64', 'bin', 'gcc.exe'));
    }
  } catch (e) {}
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch (e) {} }
  return 'gcc';
}
gcc = findGcc();

function buildAndRun(code, stdin) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-'));
  const src = path.join(dir, 'main.c');
  const exe = path.join(dir, 'main.exe');
  fs.writeFileSync(src, code, 'utf8');
  let compileErr = null;
  try {
    execFileSync(gcc, ['-std=c11', '-O0', '-Wall', '-Wextra', '-Wno-unused-parameter',
      '-finput-charset=UTF-8', '-fexec-charset=UTF-8', '-fdiagnostics-color=never',
      '-o', exe, 'main.c', '-lm'], { cwd: dir, stdio: 'pipe', timeout: 30000 });
  } catch (e) {
    compileErr = String(e.stderr || e.message);
  }
  let out = '', runErr = null;
  if (!compileErr) {
    try {
      out = execFileSync(exe, [], { cwd: dir, input: stdin || '', timeout: 8000, encoding: 'utf8' });
    } catch (e) {
      out = String(e.stdout || '');
      runErr = 'exit=' + (e.status == null ? 'timeout/killed' : e.status) + ' ' + String(e.stderr || '');
    }
  }
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  return { compileErr, out, runErr };
}

function norm(s) {
  return String(s || '').replace(/\r\n/g, '\n').split('\n')
    .map(l => l.replace(/[ \t]+$/, '')).join('\n').replace(/\n+$/, '').trim();
}

let lessonFail = 0, exFail = 0;

console.log('=== 知识点示例代码 ===');
for (const l of C.lessons) {
  if (!l.code || !l.code.trim()) { console.log(`  ⚠ ${l.id} 没有示例代码`); continue; }
  const r = buildAndRun(l.code, l.stdin || '');
  if (r.compileErr) {
    lessonFail++;
    console.log(`  ✗ ${l.id} (${l.title}) 编译失败`);
    console.log(r.compileErr.split('\n').slice(0, 8).map(x => '      ' + x).join('\n'));
  } else if (r.runErr) {
    lessonFail++;
    console.log(`  ✗ ${l.id} (${l.title}) 运行异常: ${r.runErr.split('\n')[0]}`);
  } else {
    const lines = r.out.split('\n').length;
    console.log(`  ✓ ${l.id}  输出 ${lines} 行`);
  }
}

console.log('\n=== 练习题参考答案 ===');
for (const e of C.exercises) {
  if (!e.solution) { console.log(`  ⚠ ${e.id} 没有答案`); continue; }
  /* 多用例题的每一组用例由 tools/verify-judge.js 逐组核对，这里只跑第一组看编译 */
  const firstCase = (Array.isArray(e.cases) && e.cases.length) ? e.cases[0] : null;
  const stdin = firstCase ? firstCase.stdin : (e.stdin || '');
  const expected = firstCase ? firstCase.expected : e.expected;
  const r = buildAndRun(e.solution, stdin || '');
  if (r.compileErr) {
    exFail++;
    console.log(`  ✗ ${e.id} (${e.title}) 编译失败`);
    console.log(r.compileErr.split('\n').slice(0, 8).map(x => '      ' + x).join('\n'));
    continue;
  }
  if (r.runErr) {
    exFail++;
    console.log(`  ✗ ${e.id} 运行异常: ${r.runErr.split('\n')[0]}`);
    continue;
  }
  if (norm(r.out) === norm(expected)) {
    console.log(`  ✓ ${e.id}  输出与 expected 一致` + (firstCase ? `（共 ${e.cases.length} 组，逐组见 verify-judge）` : ''));
  } else {
    exFail++;
    console.log(`  ✗ ${e.id} (${e.title}) 输出与 expected 不一致`);
    console.log('    --- 实际输出 ---');
    console.log(r.out.split('\n').map(x => '    | ' + x).join('\n'));
    console.log('    --- 期望输出 ---');
    console.log(String(expected).split('\n').map(x => '    | ' + x).join('\n'));
  }
}

console.log(`\n小结：知识点失败 ${lessonFail} 个，练习题失败 ${exFail} 个`);
process.exit(lessonFail + exFail > 0 ? 1 : 0);
