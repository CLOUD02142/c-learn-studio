/**
 * verify-viz.js —— 批量校验可视化演示源码
 *
 * 干三件事：
 *   1. 把 public/content/visuals.js 里的每段 C 代码真编译一遍
 *   2. 真运行一遍，把 @@TR@@ 帧解析出来
 *   3. 检查帧是否合理：有没有帧、行号是否落在源码范围内、视图是否为空
 *
 * 用法：node tools/verify-viz.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TRACE_SRC = fs.readFileSync(path.join(ROOT, 'assets', 'trace.h'), 'utf8');
const VISUALS_PATH = path.join(ROOT, 'public', 'content', 'visuals.js');
const PREFIX = '@@TR@@';
const GCC = process.env.CC || 'gcc';

function loadVisuals() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(VISUALS_PATH, 'utf8'), sandbox, { filename: 'visuals.js' });
  return sandbox.window.VISUALS || {};
}

function parseFrames(text) {
  const frames = [];
  for (const line of String(text).split(/\r?\n/)) {
    const at = line.indexOf(PREFIX);
    if (at === -1) continue;
    try { frames.push(JSON.parse(line.slice(at + PREFIX.length))); } catch (e) { /* 坏帧忽略 */ }
  }
  return frames;
}

function checkOne(id, demo) {
  const code = String(demo.code || '').replace(/^\n+/, '');
  const totalLines = code.split('\n').length;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clv-'));
  const exe = path.join(dir, process.platform === 'win32' ? 'main.exe' : 'main.out');
  fs.writeFileSync(path.join(dir, 'main.c'), code, 'utf8');
  fs.writeFileSync(path.join(dir, 'trace.h'), TRACE_SRC, 'utf8');

  const r = { id, title: demo.title, lines: totalLines, ok: false, frames: 0, problems: [] };

  try {
    execFileSync(GCC, ['-std=c11', '-O0', '-Wall', '-Wextra',
      '-Wno-unused-parameter', '-Wno-sign-compare',
      '-o', path.basename(exe), 'main.c', '-lm'],
      { cwd: dir, timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    r.problems.push('编译失败：' + String(e.stderr || e.message).split('\n').slice(0, 4).join(' | '));
    return r;
  }

  let stdout = '';
  try {
    stdout = execFileSync(exe, [], { cwd: dir, timeout: 5000, encoding: 'utf8' });
  } catch (e) {
    if (e.stdout) stdout = e.stdout;
    r.problems.push('运行异常：' + (e.killed ? '超时' : '退出码 ' + e.status));
  }

  const frames = parseFrames(stdout);
  r.frames = frames.length;

  if (!frames.length) r.problems.push('一帧都没有');

  /* 行号必须落在源码范围内，否则编辑器高亮会跑到不存在的行 */
  let badLine = 0, emptyView = 0;
  frames.forEach((f) => {
    if (!(f.line >= 1 && f.line <= totalLines)) badLine++;
    if (!f.views || !f.views.length) emptyView++;
  });
  if (badLine) r.problems.push(badLine + ' 帧的行号越界');
  if (emptyView) r.problems.push(emptyView + ' 帧没有任何视图');

  /* 每帧都得有说明文字，否则播放时下面那栏是空的 */
  const noNote = frames.filter((f) => !f.note).length;
  if (noNote) r.problems.push(noNote + ' 帧没有说明文字');

  r.ok = r.problems.length === 0;
  r.first = frames[0] && frames[0].note;
  r.last = frames.length && frames[frames.length - 1].note;

  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  return r;
}

const visualMap = loadVisuals();
const ids = Object.keys(visualMap);
if (!ids.length) {
  console.error('✖ visuals.js 里一个演示都没有，检查文件是否加载成功');
  process.exit(1);
}

console.log('校验 ' + ids.length + ' 个可视化演示…\n');

let fail = 0;
const results = ids.map((id) => {
  const r = checkOne(id, visualMap[id]);
  const flag = r.ok ? '✔' : '✖';
  if (!r.ok) fail++;
  console.log(flag + ' ' + id.padEnd(18) + ' ' + String(r.frames).padStart(3) + ' 帧  ' +
    String(r.lines).padStart(3) + ' 行  ' + (r.title || ''));
  if (!r.ok) r.problems.forEach((p) => console.log('     ↳ ' + p));
  return r;
});

console.log('\n' + '─'.repeat(60));
const totalFrames = results.reduce((s, r) => s + r.frames, 0);
console.log('合计 ' + totalFrames + ' 帧 · ' + (ids.length - fail) + '/' + ids.length + ' 通过');
if (fail) {
  console.log('有 ' + fail + ' 个演示没通过，见上面的 ↳ 说明');
  process.exit(1);
}
console.log('全部通过。');
