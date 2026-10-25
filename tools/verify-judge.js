/**
 * 判题用例体检：拿每道题的**参考答案**去跑它自己的用例。
 *
 * 这是"多用例判题"的正确性根：如果用例的 expected 写错了，
 * 学生写对了反而会被判错，比没有用例更糟。
 *
 * 用法： node tools/verify-judge.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

global.window = {};
const CONTENT = path.join(__dirname, '..', 'public', 'content');
['ch0-intro', 'c-basics', 'c-advanced', 'ds-linear', 'ds-stack-queue', 'ds-string-tree',
  'ds-graph', 'ds-search-sort', 'exercises', 'ex-io', 'path', 'visuals', 'defs'
].forEach(f => require(path.join(CONTENT, f + '.js')));
require(path.join(__dirname, '..', 'public', 'js', 'diagnose.js'));

const C = global.window.CURRICULUM;
const D = global.window.CDiagnose;

function findGcc() {
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    const p = path.join(d, 'gcc.exe');
    try { if (fs.existsSync(p)) return p; } catch (e) {}
  }
  return 'gcc';
}
const GCC = findGcc();

function casesOf(ex) {
  if (Array.isArray(ex.cases) && ex.cases.length) {
    return ex.cases.map((c, i) => ({
      note: c.note || ('用例 ' + (i + 1)),
      stdin: c.stdin == null ? '' : String(c.stdin),
      expected: c.expected == null ? '' : String(c.expected)
    }));
  }
  if (ex.expected != null) {
    return [{ note: '题目给定数据', stdin: ex.stdin == null ? '' : String(ex.stdin), expected: String(ex.expected) }];
  }
  return [];
}

function build(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vj-'));
  fs.writeFileSync(path.join(dir, 'main.c'), code, 'utf8');
  const r = spawnSync(GCC, ['-std=c11', '-O0', '-Wall', '-Wextra', '-Wno-unused-parameter',
    '-Wno-unused-variable', '-finput-charset=UTF-8', '-fexec-charset=UTF-8',
    '-fdiagnostics-color=never', '-o', path.join(dir, 'main.exe'), 'main.c', '-lm'],
    { cwd: dir, encoding: 'utf8', timeout: 30000 });
  return { dir, ok: r.status === 0, exe: path.join(dir, 'main.exe'), stderr: String(r.stderr || '') };
}

function run(exe, dir, stdin) {
  const r = spawnSync(exe, [], { cwd: dir, input: stdin, encoding: 'utf8', timeout: 8000 });
  return String(r.stdout || '').replace(/\r\n/g, '\n');
}

let pass = 0, fail = 0, skipped = 0;
const failures = [];

console.log('判题用例体检\n');
for (const ex of C.exercises) {
  const cases = casesOf(ex);
  if (!cases.length) { skipped++; continue; }
  if (!ex.solution) { console.log('  ?  ' + ex.id + ' 没有参考答案，跳过'); skipped++; continue; }

  const b = build(ex.solution);
  if (!b.ok) {
    fail++;
    failures.push(ex.id + '：参考答案编译失败\n' + b.stderr.split('\n').slice(0, 3).join('\n'));
    console.log('  ✖  ' + ex.id.padEnd(20) + '参考答案编译失败');
    try { fs.rmSync(b.dir, { recursive: true, force: true }); } catch (e) {}
    continue;
  }

  let bad = 0;
  const detail = [];
  for (const c of cases) {
    const out = run(b.exe, b.dir, c.stdin);
    const d = D.analyzeDiff(c.expected, out);
    if (!d.same) {
      bad++;
      detail.push('    [' + c.note + '] 输入 ' + JSON.stringify(c.stdin) +
        '\n      期望: ' + JSON.stringify(c.expected) +
        '\n      实际: ' + JSON.stringify(out));
    }
  }
  try { fs.rmSync(b.dir, { recursive: true, force: true }); } catch (e) {}

  if (bad === 0) {
    pass++;
    console.log('  ✓  ' + ex.id.padEnd(20) + cases.length + ' 组用例全部一致');
  } else {
    fail++;
    failures.push(ex.id + '：' + bad + '/' + cases.length + ' 组用例对不上\n' + detail.join('\n'));
    console.log('  ✖  ' + ex.id.padEnd(20) + bad + '/' + cases.length + ' 组用例对不上');
  }
}

console.log('\n通过 ' + pass + ' 道，失败 ' + fail + ' 道，跳过 ' + skipped + ' 道');
if (failures.length) {
  console.log('\n失败详情：\n' + failures.join('\n\n'));
  process.exitCode = 1;
}
