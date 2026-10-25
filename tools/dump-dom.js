/**
 * dump-dom.js —— 把页面渲染后的 DOM 掏出来看
 * 用法：node tools/dump-dom.js "/?viz=1&frame=6#d-graph-traverse" "vz-vn"
 */
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 7825;
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

const urlPath = process.argv[2] || '/';
const needle = process.argv[3] || 'vz-';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const srv = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: 'ignore'
  });
  try {
    for (let i = 0; i < 40; i++) {
      try { const r = await fetch('http://127.0.0.1:' + PORT + '/api/health'); if ((await r.json()).ok) break; } catch (e) { /* wait */ }
      await sleep(200);
    }
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'dom-'));
    const dom = execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--dump-dom',
      '--virtual-time-budget=15000',
      '--user-data-dir=' + profile,
      'http://127.0.0.1:' + PORT + urlPath
    ], { encoding: 'utf8', timeout: 60000, maxBuffer: 32 * 1024 * 1024 });

    const lines = dom.split(/\n/).filter((l) => l.includes(needle));
    console.log('DOM 总长 ' + dom.length + ' 字符');

    /* 统计所有 class 值，看状态类到底加上没有 */
    const classes = {};
    const re = /class="([^"]*)"/g;
    let mm;
    while ((mm = re.exec(dom))) {
      const v = mm[1];
      if (!/vz-/.test(v)) continue;
      classes[v] = (classes[v] || 0) + 1;
    }
    console.log('\nclass 统计（含 vz- 的）：');
    Object.keys(classes).sort().forEach((k) => console.log('  ' + String(classes[k]).padStart(3) + '  ' + k));

    if (!Object.keys(classes).length) {
      console.log('（一个 vz- 类都没有，说明演示没跑起来）');
    }
  } finally {
    srv.kill();
  }
})();
