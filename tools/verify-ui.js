/**
 * 界面自检：用无头 Edge 载入 __probe.html，模拟"改代码 → 点按钮"，
 * 把真实 DOM 的度量结果读回来做断言。
 *
 * 用法： node tools/verify-ui.js
 * 依赖：本机 Edge（路径可用 EDGE_PATH 覆盖）、gcc（编译报错断言需要）
 */
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.SHOT_PORT || 7824);
const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PROBE_SRC = path.join(__dirname, 'probe.html');
const PROBE_DST = path.join(ROOT, 'public', '__probe.html');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function dump(url) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'vui-'));
  try {
    const buf = execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--user-data-dir=' + profile, '--window-size=1560,940',
      '--virtual-time-budget=15000', '--dump-dom', url
    ], { timeout: 120000, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    return buf;
  } finally {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

function pick(html) {
  const m = html.match(/RESULT=(\{[\s\S]*?\})<\/pre>/);
  if (!m) {
    const e = html.match(/ERROR=([^<]*)<\/pre>/);
    throw new Error(e ? e[1] : '探针没有回传结果（页面可能没加载完）');
  }
  return JSON.parse(m[1]);
}

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✔ ' + name); }
  else { fail++; console.log('  ✖ ' + name + (detail ? '  → ' + detail : '')); }
}

(async () => {
  console.log('起临时服务 :' + PORT + ' …');
  /* 探针只在自检期间临时放进 public/，跑完就删，交稿的目录里不会有它 */
  fs.copyFileSync(PROBE_SRC, PROBE_DST);
  const srv = spawn(process.execPath, ['server.js'], {
    cwd: ROOT,
    env: Object.assign({}, process.env, { PORT: String(PORT), CLEARN_NO_OPEN: '1' }),
    stdio: 'ignore'
  });

  try {
    for (let i = 0; i < 60; i++) {
      try {
        const r = await fetch('http://127.0.0.1:' + PORT + '/api/health');
        if ((await r.json()).ok) break;
      } catch (e) {}
      await sleep(250);
    }
    const base = 'http://127.0.0.1:' + PORT + '/__probe.html?';
    const bg = execFileSync;  // 占位，避免未使用告警

    /* ---- 1. 知识点页：定义卡 / 目录 / 字号层级 ---- */
    console.log('\n[1] 知识点页排版');
    const L = pick(dump(base + 's=lesson'));
    check('有白话定义卡', L.defcard === true);
    check('定义卡主句字号 ≥ 16px（' + L.plainFs + '）', parseFloat(L.plainFs) >= 16);
    check('正文 14px（' + L.bodyFs + '）', parseFloat(L.bodyFs) >= 13.5);
    check('标题 20px（' + L.titleFs + '）', parseFloat(L.titleFs) >= 19);
    check('小节都有编号（' + L.h2Numbered + ' 个）', L.h2Numbered >= 3);
    check('目录条目 = 小节数（' + L.tocItems + '）', L.tocItems === L.h2Numbered);
    check('右栏没有横向溢出（溢出 ' + L.overflowX + 'px）', L.overflowX <= 1);

    /* 带表格的页面：表格要能自己滚，不能把面板撑宽 */
    const T = pick(dump(base + 's=lesson&id=c-types'));
    check('表格被套进可滚动容器（' + T.tableWraps + ' 个）', T.tableWraps >= 1);
    check('表格宽度不超面板（' + (T.tableBox && T.tableBox.w) + ' ≤ ' + T.panelClientW + '）',
      T.tableBox && T.tableBox.w <= T.panelClientW + 1);
    check('有表格时面板仍无横向溢出（' + T.overflowX + 'px）', T.overflowX <= 1);

    /* ---- 2. 编译报错：人话诊断卡片 ---- */
    console.log('\n[2] 练习题 · 编译失败');
    const C = pick(dump(base + 's=compile'));
    check('生成了诊断卡片（' + C.diagCards + ' 张）', C.diagCards >= 1);
    check('有结论横幅', /编译没过/.test(C.banner));
    check('卡片标题带行号与原因', /第 \d+ 行/.test(C.firstTitle), C.firstTitle);
    check('有「为什么」', C.hasWhy === true);
    check('有「怎么改」', C.hasFix === true);
    check('自动切到问题面板', /问题/.test(C.activeTab), C.activeTab);
    check('问题徽标有数字（' + C.probBadge + '）', Number(C.probBadge) >= 1);

    /* ---- 3. 答案对比 ---- */
    console.log('\n[3] 练习题 · 答案对比');
    const D = pick(dump(base + 's=diff'));
    check('对比表 3 行（' + D.rows + '）', D.rows === 3);
    check('每行 4 列（' + D.colsPerRow + '）', D.colsPerRow === 4);
    check('标红了差异字符（' + D.marked + ' 处）', D.marked >= 1);
    check('结论写明第一处位置', /第一处不同：第 \d+ 行/.test(D.verdictText), D.verdictText.slice(0, 40));
    check('给出了原因（' + D.causes + ' 条）', D.causes >= 1);
    check('自动切到对比面板', /对比/.test(D.activeTab), D.activeTab);
    check('对比徽标是 ✗', D.diffBadge === '✗', D.diffBadge);
    check('勾/叉列在可视范围内', D.flagVisible && D.flagVisible.w > 0 && D.flagVisible.x > 0);

    /* ---- 4. AI 可选功能的两种状态 ---- */
    console.log('\n[4] AI 改错（可选）');
    const A0 = pick(dump(base + 's=aisetup'));
    check('没配 Key 时显示引导卡', A0.setupShown === true);
    check('没配 Key 时不显示对话入口', A0.idleShown === false);
    check('设置页状态写明未配置', /尚未配置/.test(A0.settingsStatus), A0.settingsStatus);
    const A1 = pick(dump(base + 's=ai'));
    check('配了 Key 后显示对话入口', A1.idleShown === true);
    check('AI 徽标变 ✓', A1.aiBadge === '✓', A1.aiBadge);
    check('设置页状态写明已配置', /已配置/.test(A1.settingsStatus), A1.settingsStatus);

    /* ---- 5. 多用例判题 ---- */
    console.log('\n[5] 多用例判题');
    const J = pick(dump(base + 's=judge&p=470'));
    check('用例数 = 3（' + J.chips + '）', J.chips === 3);
    check('只对一组时 1 绿 2 红（' + J.okChips + '/' + J.badChips + '）', J.okChips === 1 && J.badChips === 2);
    check('汇总写着 1 / 3', /1 \/ 3/.test(J.sum), J.sum);
    check('自动切到没过的那组（' + J.note + '）', /100 7/.test(J.note), J.note);
    check('给出第一处不同', /第一处不同：第 1 行/.test(J.verdict), J.verdict);
    check('对比表铺满面板（' + J.tableW + '/' + J.viewW + '）', J.tableW >= J.viewW - 30);
    check('✓/✗ 列在面板内（x=' + (J.flagBox && J.flagBox.x) + '）', J.flagBox && J.flagBox.w > 0);
    const JP = pick(dump(base + 's=judgepass&p=400'));
    check('三组全对时 3 / 3', /3 \/ 3/.test(JP.sum), JP.sum);
    check('全对时不弹结构警告（代码确实用了 scanf）', JP.structWarn === false);

    /* ---- 6. 环境自检 ---- */
    console.log('\n[6] 环境自检');
    const E = pick(dump(base + 's=env'));
    check('六项检查都渲染出来（' + E.rows + '）', E.rows === 6);
    check('本机环境下没有失败项（' + E.badRows + '）', E.badRows === 0);
    check('汇总写明环境齐全', /环境齐全/.test(E.sum), E.sum);

    /* ---- 7. 学习路线 ---- */
    console.log('\n[7] 学习路线');
    const P = pick(dump(base + 's=path'));
    check('五个阶段都在（' + P.stages + '）', P.stages === 5);
    check('有"继续学"入口', P.nextText.length > 4, P.nextText);
    check('章节进度条仍保留（' + P.chapterBars + '）', P.chapterBars >= 8);

    /* ---- 8. 草稿历史 ---- */
    console.log('\n[8] 草稿历史');
    const H = pick(dump(base + 's=history'));
    check('两次运行留下两版（' + H.rows + '）', H.rows >= 2);
    check('历史弹窗打开了', H.modalShown === true);

    /* ---- 9. 搜索里的 AI 入口 ---- */
    console.log('\n[9] 搜索 · 问 AI');
    const SR = pick(dump(base + 's=searchai'));
    check('结果下面有问 AI 入口', SR.hasAiBlock === true);
    check('未配置时按钮文案是引导（' + SR.askLabel.slice(0, 12) + '…）', /配置 AI/.test(SR.askLabel), SR.askLabel);
    check('本地检索照常出结果（' + SR.results + '）', SR.results > 0);

    /* ---- 10. 接口守卫 ---- */
    console.log('\n[10] 本地写接口的令牌');
    const health = await (await fetch('http://127.0.0.1:' + PORT + '/api/health')).json();
    check('/api/health 会下发令牌', typeof health.token === 'string' && health.token.length >= 16);
    const noTok = await fetch('http://127.0.0.1:' + PORT + '/api/compile', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'int main(void){return 0;}' })
    });
    check('不带令牌直接编译被拒（' + noTok.status + '）', noTok.status === 403);
    const badOrigin = await fetch('http://127.0.0.1:' + PORT + '/api/compile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CLearn-Token': health.token, 'Origin': 'http://evil.example' },
      body: JSON.stringify({ code: 'int main(void){return 0;}' })
    });
    const badOriginJson = await badOrigin.json();
    check('外站 Origin 被拒', /来源不被允许/.test(badOriginJson.error || ''), badOriginJson.error);
    const okTok = await fetch('http://127.0.0.1:' + PORT + '/api/selfcheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CLearn-Token': health.token },
      body: '{}'
    });
    const okTokJson = await okTok.json();
    check('带正确令牌能自检通过', okTokJson.ok === true, JSON.stringify(okTokJson).slice(0, 80));

    console.log('\n通过 ' + pass + ' / ' + (pass + fail) + '，失败 ' + fail);
    process.exitCode = fail ? 1 : 0;
  } catch (e) {
    console.error('自检中断：' + e.message);
    process.exitCode = 1;
  } finally {
    srv.kill();
    try { fs.rmSync(PROBE_DST, { force: true }); } catch (e) {}
  }
})();
