/**
 * shot.js —— 自动截图验证界面
 *
 * 流程：起一个临时服务（用完即杀）→ 用 Edge headless 逐个场景截图 → 输出到 shots/
 * 用法：node tools/shot.js
 */
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.SHOT_PORT || 7823);
const EDGE = process.env.EDGE_PATH ||
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT = path.join(ROOT, 'shots');

/* 想看哪个场景就改这里：url 支持 ?viz=1 自动开演、&frame=N 停在指定帧、?view=settings 开侧栏视图 */
const SHOTS = [
  { name: '01-lesson-def', url: '/#c-pointer', note: '知识点页：白话定义卡 + 目录 + 编号小节' },
  { name: '02-lesson-cta', url: '/#d-sort-basic', note: '知识点页 + 演示入口卡片' },
  { name: '03-exercise', url: '/?panel=340#ex-hello', note: '练习题页 + 作答步骤' },
  { name: '04-settings', url: '/?view=settings', note: '设置页：AI 可选配置 + 编译器' },
  { name: '05-array-sort', url: '/?viz=1&frame=14#d-sort-basic', note: '冒泡排序：数组 + 交换标记' },
  { name: '06-tree', url: '/?viz=1&frame=5#d-tree-traverse', note: '二叉树遍历：树 + 访问序列' },
  { name: '07-list', url: '/?viz=1&frame=6#d-linklist', note: '单链表头插' },
  { name: '08-graph', url: '/?viz=1&frame=6#d-graph-traverse', note: '图 BFS' },
  { name: '09-queue', url: '/?viz=1&frame=7#d-queue', note: '循环队列' },
  { name: '10-quick', url: '/?viz=1&frame=20#d-sort-swap', note: '快排分区' },
  { name: '11-array-mem', url: '/?viz=1&frame=3#c-array', note: '数组：带地址的内存格' },
  { name: '12-pointer', url: '/?viz=1&frame=2#c-pointer', note: '指针：地址 + 指向哪一格' },
  { name: '13-hash', url: '/?viz=1&frame=5#d-hash', note: '哈希表：桶 + 链地址' },
  { name: '14-kmp', url: '/?viz=1&frame=13#d-kmp', note: 'KMP：next 数组' },
  { name: '15-dijkstra', url: '/?viz=1&frame=6#d-shortest', note: 'Dijkstra：dist 松弛' },
  { name: '16-avl', url: '/?viz=1&frame=6#d-avl', note: 'AVL：LR 双旋前失衡' },
  { name: '17-topo', url: '/?viz=1&frame=8#d-topo', note: '拓扑排序：入度表推进' },
  { name: '18-string', url: '/?viz=1&frame=4#c-string', note: "字符串：'\\0' 与残留字符" },
  /* 下面几张需要"先改代码再点按钮"，走临时探针（截图前会 copy 到 public/，结束自动删） */
  { name: '19-problems', url: '/__probe.html?s=compile&p=430', probe: true, note: '练习题：编译失败的人话诊断' },
  { name: '20-diff', url: '/__probe.html?s=diff&p=520', probe: true, note: '练习题：逐行逐字符对比' },
  { name: '21-ai-idle', url: '/__probe.html?s=ai&p=380', probe: true, note: 'AI 已配置时的入口' },
  { name: '22-ai-setup', url: '/__probe.html?s=aisetup&p=380', probe: true, note: 'AI 未配置时的引导（可选功能）' },
  { name: '23-judge', url: '/__probe.html?s=judge&p=470', probe: true, note: '多用例判题：1 / 3 组通过' },
  { name: '24-env', url: '/__probe.html?s=env', probe: true, note: '环境自检：六项逐条打勾' },
  { name: '25-path', url: '/__probe.html?s=path', probe: true, note: '学习路线：5 站 + 继续学' },
  { name: '26-history', url: '/__probe.html?s=history', probe: true, note: '草稿历史：运行前自动快照' }
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitHealth(tries) {
  for (let i = 0; i < (tries || 60); i++) {
    try {
      const r = await fetch('http://127.0.0.1:' + PORT + '/api/health');
      const j = await r.json();
      if (j && j.ok) return j;
    } catch (e) { /* 还没起来 */ }
    await sleep(250);
  }
  throw new Error('服务没起来（端口 ' + PORT + '）');
}

function shoot(shot) {
  const file = path.join(OUT, shot.name + '.png');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vzshot-'));
  try {
    execFileSync(EDGE, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=' + profile,
      '--window-size=1560,940',
      '--force-device-scale-factor=' + (process.env.SHOT_SCALE || '1'),
      '--virtual-time-budget=20000',
      '--screenshot=' + file,
      'http://127.0.0.1:' + PORT + shot.url
    ], { timeout: 90000, stdio: 'ignore' });
    const size = fs.existsSync(file) ? (fs.statSync(file).size / 1024).toFixed(0) + ' KB' : '失败';
    console.log('  ✔ ' + shot.name.padEnd(16) + size.padStart(9) + '   ' + (shot.note || ''));
  } finally {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  /* 交互类场景要借 tools/probe.html 驱动，临时放进 public/，结束删掉 */
  const probeDst = path.join(ROOT, 'public', '__probe.html');
  fs.copyFileSync(path.join(__dirname, 'probe.html'), probeDst);
  console.log('起临时服务 :' + PORT + ' …');
  const srv = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), CLEARN_NO_OPEN: '1' }),
    stdio: 'ignore'
  });

  try {
    const h = await waitHealth();
    console.log('  gcc: ' + (h.version || '未找到') + ' · 埋点: ' + (h.trace ? '开' : '关'));
    console.log('开始截图：');
    const only = String(process.env.SHOT_ONLY || '').trim();
    const list = only
      ? only.split(',').map(n => SHOTS[Number(n) - 1]).filter(Boolean)
      : SHOTS;
    for (const s of list) {
      try { shoot(s); } catch (e) { console.log('  ✖ ' + s.name + '  ' + e.message); }
    }
    console.log('\n输出目录：shots/');
  } finally {
    srv.kill();
    try { fs.rmSync(probeDst, { force: true }); } catch (e) {}
  }
})();
