/**
 * 规则表体检脚本：拿真实的 gcc 报错去撞 diagnose.js 的规则表，
 * 看有多少条能翻成人话、多少条掉进了兜底。
 *
 * 用法： node tools/verify-diagnose.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

global.window = {};
require(path.join(__dirname, '..', 'public', 'js', 'diagnose.js'));
const D = global.window.CDiagnose;

function findGcc() {
  for (const d of (process.env.PATH || '').split(path.delimiter)) {
    const p = path.join(d, 'gcc.exe');
    try { if (fs.existsSync(p)) return p; } catch (e) {}
  }
  return 'gcc';
}
const GCC = findGcc();

const CASES = [
  ['少分号', '#include <stdio.h>\nint main(void){ int a = 1\nprintf("%d", a); return 0; }'],
  ['大括号没闭合', '#include <stdio.h>\nint main(void){ printf("hi"); return 0;'],
  ['中文分号', '#include <stdio.h>\nint main(void){ int a = 1； printf("%d", a); return 0; }'],
  ['未声明变量', '#include <stdio.h>\nint main(void){ printf("%d", nothere); return 0; }'],
  ['隐式声明函数', '#include <stdio.h>\n#include <string.h>\nint main(void){ char s[8]="ab"; printf("%d", mystrlen(s)); return 0; }'],
  ['格式符不匹配', '#include <stdio.h>\nint main(void){ double x = 1.5; printf("%d", x); return 0; }'],
  ['链接失败', '#include <stdio.h>\nint add(int,int);\nint main(void){ printf("%d", add(1,2)); return 0; }'],
  ['数组不能赋值', '#include <stdio.h>\nint main(void){ char s[8]; s = "hi"; printf("%s", s); return 0; }'],
  ['结构体不完整', 'struct Node;\nint main(void){ struct Node n; return 0; }'],
  ['非void缺return', 'int f(int x){ if (x > 0) return 1; }\nint main(void){ return f(1); }'],
  ['if里写成赋值', '#include <stdio.h>\nint main(void){ int a=1,b=2; if (a = b) printf("x"); return 0; }'],
  ['引号没闭合', '#include <stdio.h>\nint main(void){ printf("hi); return 0; }'],
  ['多余逗号', '#include <stdio.h>\nint main(void){ int a = 1,; printf("%d", a); return 0; }'],
  ['指针类型运算', 'struct P { int x; };\nint main(void){ struct P a, b; return a * b; }'],
  ['用了gets', '#include <stdio.h>\nint main(void){ char s[8]; gets(s); return 0; }'],
  ['scanf漏&', '#include <stdio.h>\nint main(void){ int a; scanf("%d", a); return 0; }']
];

const re = /^(.*?):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.*)$/i;

function compile(code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vd-'));
  fs.writeFileSync(path.join(dir, 'main.c'), code, 'utf8');
  const r = spawnSync(GCC, ['-std=c11', '-Wall', '-Wextra', '-Wno-unused-parameter', '-Wno-unused-variable',
    '-finput-charset=UTF-8', '-fexec-charset=UTF-8', '-fdiagnostics-color=never',
    '-o', path.join(dir, 'main.exe'), 'main.c', '-lm'], {
    cwd: dir, encoding: 'utf8', timeout: 20000
  });
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  return { ok: r.status === 0, stderr: String(r.stderr || '') };
}

let hit = 0, miss = 0;
console.log('规则表体检（' + CASES.length + ' 个真实报错）\n');
for (const [name, code] of CASES) {
  const r = compile(code);
  const msgs = [];
  for (const line of r.stderr.split(/\r?\n/)) {
    const m = line.match(re);
    if (m && /error|warning/i.test(m[4])) msgs.push({ line: Number(m[2]), message: m[5].trim(), severity: m[4].toLowerCase() });
  }
  // 有错误优先用错误，只有警告时也照样体检（警告也要能翻译）
  const errs = msgs.filter(x => x.severity.indexOf('error') >= 0);
  if (errs.length) msgs.length = 0, msgs.push(...errs);
  if (!msgs.length) {
    // 链接错误
    const lm = r.stderr.match(/undefined reference to .+/);
    if (lm) msgs.push({ line: 0, message: lm[0], stage: 'link' });
  }
  if (!msgs.length) { console.log('  ?  ' + name.padEnd(14) + '没抓到错误（可能编译通过）'); continue; }
  const e = D.explainDiagnostic(msgs[0]);
  if (e.matched) { hit++; console.log('  ✔  ' + name.padEnd(14) + e.title); }
  else { miss++; console.log('  ✖  ' + name.padEnd(14) + '未命中｜原话：' + msgs[0].message); }
}
console.log('\n命中 ' + hit + ' / ' + (hit + miss) + '，未命中 ' + miss);

/* 顺手验一下比对引擎 */
const diff = D.analyzeDiff('C-Learn\nsum = 30\navg = 15.00', 'C-Learn\nsum = 30\navg = 15.0');
console.log('比对引擎：same=' + diff.same + '，首处差异=第' + diff.first.line + '行第' + diff.first.col + '列');
