/* ============================================================
   C-Learn Studio — 主逻辑
   ============================================================ */
(function () {
  'use strict';

  const C = window.CURRICULUM || { chapters: [], lessons: [], exercises: [] };
  const LS = {
    drafts: 'cls.drafts.v1',
    progress: 'cls.progress.v1',
    settings: 'cls.settings.v1',
    last: 'cls.last.v1',
    stdin: 'cls.stdin.v1',
    panelH: 'cls.panelH.v1',
    history: 'cls.history.v1'
  };

  const state = {
    tabs: [],            // {id, type, title}
    activeId: null,
    drafts: readJSON(LS.drafts, {}),
    history: readJSON(LS.history, {}),
    progress: readJSON(LS.progress, { lessons: {}, exercises: {} }),
    settings: Object.assign({ fontSize: 13, lineHeight: 22, lessonPanel: 'right' }, readJSON(LS.settings, {})),
    gcc: null,
    running: false,
    collapsedChapters: {},
    searchIndex: null,
    lastRun: null,       // { res, pack, actual, code, expected } 最近一次运行
    diff: null,          // 最近一次比对结果
    judge: null,         // 最近一次多用例判题结果
    aiBusy: false
  };

  let editor = null;
  let vizPlayer = null;
  const $ = (id) => document.getElementById(id);
  const term = $('term');
  const D = window.CDiagnose;

  /* 当前知识点有没有可视化演示 */
  function vizOf(id) {
    const V = window.VISUALS;
    return (V && Object.prototype.hasOwnProperty.call(V, id)) ? V[id] : null;
  }
  /* 当前知识点有没有白话定义卡 */
  function defOf(id) {
    const V = window.DEFS;
    return (V && Object.prototype.hasOwnProperty.call(V, id)) ? V[id] : null;
  }

  /* ══════════════════ 底部面板高度（可拖 / 可记忆） ══════════════════ */
  const PANEL_DEFAULT_H = 200;
  const PANEL_MIN_H = 90;

  function clampPanelH(h) {
    // 上限给编辑器留够地方，别让人把终端拉到顶把代码挤没了
    const max = Math.max(PANEL_MIN_H + 60, window.innerHeight - 220);
    return Math.round(Math.max(PANEL_MIN_H, Math.min(max, h)));
  }

  function setPanelHeight(h, persist) {
    const v = clampPanelH(h);
    const panelEl = $('panel');
    /* 以前有段代码直接往面板上写内联 height，内联样式优先级高于 CSS 变量，
       结果拖拽改了变量面板却纹丝不动。这里顺手把可能残留的内联值清掉。 */
    if (panelEl) { panelEl.style.height = ''; panelEl.style.flexBasis = ''; }
    document.documentElement.style.setProperty('--panel-h', v + 'px');
    if (persist) writeJSON(LS.panelH, v);
    // 编辑器高度变了，高亮层和行号得重新量一遍
    if (editor) { editor.measure(); editor.refresh(); }
    return v;
  }

  let panelUserAdjusted = false;   /* 用户自己拖过高度之后，就别再自动撑开了 */

  function togglePanel() {
    const collapsed = $('panel').classList.toggle('collapsed');
    $('resizerPanel').classList.toggle('hidden', collapsed);
  }

  /* ═══════════════════════════ 工具 ═══════════════════════════ */

  function readJSON(key, def) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : def;
    } catch (e) { return def; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  // 把 tips / hints / 定义卡里的 `代码` 转成 <code>代码</code>
  function mdInline(s) {
    return String(s == null ? '' : s).replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function toast(msg, kind, ms) {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.innerHTML = msg;
    $('toastWrap').appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 260);
    }, ms || 2600);
  }
  function modal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modalMask').classList.remove('hidden');
  }
  function closeModal() { $('modalMask').classList.add('hidden'); }

  function allItems() {
    const map = {};
    C.lessons.forEach(l => { map[l.id] = { type: 'lesson', data: l }; });
    C.exercises.forEach(e => { map[e.id] = { type: 'exercise', data: e }; });
    return map;
  }
  const ITEMS = allItems();
  const chapterOf = (chId) => C.chapters.find(c => c.id === chId) || { name: chId };
  const lessonsOf = (chId) => C.lessons.filter(l => l.ch === chId);

  function totalDone() {
    return Object.keys(state.progress.lessons).length + Object.keys(state.progress.exercises).length;
  }
  function totalCount() {
    return C.lessons.length + C.exercises.length;
  }

  /* ═══════════════════════════ 初始化 ═══════════════════════════ */

  function init() {
    editor = new window.CodeEditor({
      onCursor: (p) => { $('sbPos').textContent = '行 ' + p.line + ', 列 ' + p.col; },
      onChange: () => { scheduleDraftSave(); }
    });
    applySettings();
    initAiSettings();
    // ?panel=320 可以指定打开时底部面板的高度（截图/分享用）
    const panelQp = Number(new URLSearchParams(location.search).get('panel'));
    setPanelHeight(panelQp > 0 ? panelQp : readJSON(LS.panelH, PANEL_DEFAULT_H));
    buildTree();
    buildExerciseTree();
    buildSearchSuggest();

    vizPlayer = new window.CViz.Player({
      root: $('pv-viz'),
      onLine: (line) => {
        if (line > 0) editor.setTraceLine(line);
        else editor.clearTraceLine();
      }
    });

    bindEvents();
    renderProgress();
    updateStatus();
    renderAiIdle();

    /* 第一次打开时终端是空的，给一句"下一步该干什么"，比一片黑好 */
    term.innerHTML = '<span class="t-dim">按 Ctrl+Enter 运行代码 · Ctrl+F7 只编译' +
      ' · 报错看「问题」面板 · 输出和答案不一样看「对比」面板</span>';

    // 恢复上次打开
    const hashId = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    const last = readJSON(LS.last, null);
    if (hashId && ITEMS[hashId]) {
      open(ITEMS[hashId].type, hashId, { restore: true });
    } else if (last && ITEMS[last.id] && ITEMS[last.id].type === last.type) {
      open(last.type, last.id, { restore: true });
    } else {
      const first = C.lessons[0];
      if (first) open('lesson', first.id);
    }

    $('stdinInput').value = localStorage.getItem(LS.stdin) || '';

    // 支持 ?q=xxx 直接打开搜索并出结果
    const qp = new URLSearchParams(location.search).get('q');
    if (qp) {
      showView('search');
      $('searchInput').value = qp;
      renderSearchResults(qp);
    }

    // ?view=settings 之类的参数可以直接打开某个侧栏视图（截图 / 分享用）
    const vp = new URLSearchParams(location.search).get('view');
    if (vp) {
      showView(vp);
      if (vp === 'env') renderEnv();
    }

    // ?viz=1 打开就直接跑当前知识点的演示（方便分享链接 / 自动截图）
    if (new URLSearchParams(location.search).get('viz')) {
      setTimeout(() => { runViz(); }, 500);
    }

    checkHealth();
  }

  function checkHealth() {
    fetch('/api/health').then(r => r.json()).then(res => {
      state.gcc = res;
      window.CLEARN_TOKEN = res.token || '';
      let label = 'gcc 未找到';
      if (res.gcc) {
        const m = String(res.version || '').match(/(\d+\.\d+\.\d+)/);
        label = 'gcc ' + (m ? m[1] : '');
      }
      $('sbGcc').textContent = label;
      $('gccPath').textContent = res.gcc || '未检测到 gcc，请安装 MinGW-w64 后点「重新检测」';
      if (!res.gcc) {
        toast('没找到 gcc 编译器：教程和编辑都能用，但代码跑不起来。已打开「环境自检」页，上面有安装命令。', 'err', 7000);
        showView('env');
        renderEnv();
      }
    }).catch(() => {
      $('sbGcc').textContent = '未连接服务';
      $('gccPath').textContent = '未连接本地服务（请用 启动.bat 或 node server.js 启动）';
      pushTerm('<span class="t-warn">⚠ 没连上本地服务，代码无法编译运行。\n  请双击项目里的「启动.bat」，或在项目目录执行： node server.js\n  然后访问 http://127.0.0.1:7788</span>');
    });
  }

  /* ═══════════════════════════ 大纲树 ═══════════════════════════ */

  function buildTree(filter) {
    const q = (filter || '').trim().toLowerCase();
    let html = '';
    C.chapters.forEach((ch) => {
      if (ch.id === 'ex') return;
      let lessons = lessonsOf(ch.id);
      if (q) lessons = lessons.filter(l => matchFilter(l, q));
      if (q && lessons.length === 0) return;
      const collapsed = state.collapsedChapters[ch.id] && !q;
      const doneCount = lessons.filter(l => state.progress.lessons[l.id]).length;
      html += '<div class="tnode chapter' + (collapsed ? ' collapsed' : '') + '" data-chapter="' + ch.id + '"' +
        ' role="treeitem" tabindex="0" aria-expanded="' + (!collapsed) + '">' +
        '<span class="arrow"><svg width="12" height="12" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>' +
        '<span class="ico">📁</span>' +
        '<span class="lbl">' + esc(ch.name) + '</span>' +
        '<span class="count">' + doneCount + '/' + lessonsOf(ch.id).length + '</span>' +
        '</div>';
      html += '<div class="tchildren' + (collapsed ? ' collapsed' : '') + '" role="group">';
      lessons.forEach((l) => {
        const done = !!state.progress.lessons[l.id];
        html += '<div class="tnode lesson" data-id="' + l.id + '" style="padding-left:22px"' +
          ' role="treeitem" tabindex="0" aria-selected="' + (l.id === state.activeId) + '">' +
          '<span class="ico' + (done ? ' done' : '') + '">' + (done ? '✔' : '§') + '</span>' +
          '<span class="lbl">' + esc(l.title) + '</span>' +
          (l.tag ? '<span class="tag">' + esc(l.tag) + '</span>' : '') +
          '</div>';
      });
      html += '</div>';
    });
    $('tree').innerHTML = html;

    $('tree').querySelectorAll('.tnode.chapter').forEach((el) => {
      el.addEventListener('click', () => {
        const id = el.dataset.chapter;
        state.collapsedChapters[id] = !state.collapsedChapters[id];
        el.classList.toggle('collapsed');
        el.nextElementSibling.classList.toggle('collapsed');
        el.setAttribute('aria-expanded', String(!el.classList.contains('collapsed')));
      });
    });
    $('tree').querySelectorAll('.tnode.lesson').forEach((el) => {
      el.addEventListener('click', () => open('lesson', el.dataset.id));
    });
    /* 键盘可达：Tab 能走到节点，回车/空格等于点击 */
    $('tree').querySelectorAll('.tnode').forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
    highlightActiveNode();
  }

  function matchFilter(l, q) {
    return (l.title + ' ' + (l.tags || []).join(' ') + ' ' + (l.brief || '')).toLowerCase().includes(q);
  }

  function buildExerciseTree() {
    const groups = {};
    C.exercises.forEach((e) => {
      const ch = e.ch || 'ex';
      (groups[ch] = groups[ch] || []).push(e);
    });
    let html = '';
    Object.keys(groups).forEach((chId) => {
      const name = chId === 'ex' ? '综合练习' : chapterOf(chId).name;
      html += '<div class="tnode chapter" data-exgroup="1" role="treeitem" tabindex="0" aria-expanded="true">' +
        '<span class="arrow"><svg width="12" height="12" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span>' +
        '<span class="ico">🧩</span><span class="lbl">' + esc(name) + '</span>' +
        '<span class="count">' + groups[chId].length + '</span></div>';
      html += '<div class="tchildren" role="group">';
      groups[chId].forEach((e) => {
        const done = !!state.progress.exercises[e.id];
        const drafted = state.drafts[e.id] != null && state.drafts[e.id].trim() !== (e.starter || '').trim();
        const manyCases = Array.isArray(e.cases) && e.cases.length > 1;
        html += '<div class="tnode exercise" data-id="' + e.id + '" style="padding-left:22px"' +
          ' role="treeitem" tabindex="0" title="' + (manyCases ? '这道题有 ' + e.cases.length + ' 组用例' : '') + '">' +
          '<span class="ico' + (done ? ' done' : '') + '">' + (done ? '✔' : (drafted ? '●' : '✎')) + '</span>' +
          '<span class="lbl">' + esc(e.title) + '</span>' +
          '<span class="tag">' + esc(manyCases ? (e.level || '') + ' ·' + e.cases.length : (e.level || '')) + '</span></div>';
      });
      html += '</div>';
    });
    $('exTree').innerHTML = html || '<div class="sr-empty" style="padding:12px">暂无练习题</div>';
    $('exTree').querySelectorAll('.tnode.chapter').forEach((el) => {
      el.addEventListener('click', () => {
        el.classList.toggle('collapsed');
        el.nextElementSibling.classList.toggle('collapsed');
        el.setAttribute('aria-expanded', String(!el.classList.contains('collapsed')));
      });
    });
    $('exTree').querySelectorAll('.tnode.exercise').forEach((el) => {
      el.addEventListener('click', () => open('exercise', el.dataset.id));
    });
    $('exTree').querySelectorAll('.tnode').forEach((el) => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
      });
    });
  }

  function highlightActiveNode() {
    document.querySelectorAll('#tree .tnode.lesson, #exTree .tnode.exercise').forEach((el) => {
      el.classList.toggle('active', el.dataset.id === state.activeId);
    });
  }

  /* ═══════════════════════════ 打开条目 ═══════════════════════════ */

  function open(type, id, opts) {
    const item = ITEMS[id];
    if (!item) return;

    // 保存上一个草稿
    saveDraftNow();

    const title = item.data.title;
    if (!state.tabs.find(t => t.id === id)) {
      state.tabs.push({ id: id, type: type, title: title });
    }
    state.activeId = id;
    state.currentType = type;
    state.lastRun = null;
    state.diff = null;
    state.judge = null;

    const data = item.data;
    const stored = state.drafts[id];
    const initial = data.code != null ? data.code : (data.starter != null ? data.starter : '');
    editor.setValue(stored != null ? stored : initial);
    editor.setDiagnostics([]);

    renderTabs();
    renderCrumbs(data, type);
    renderLessonPanel(data, type);
    highlightActiveNode();
    writeJSON(LS.last, { id: id, type: type });
    try { history.replaceState(null, '', '#' + id); } catch (e) { /* file:// 下可能受限 */ }

    $('sbChapter').textContent = chapterOf(data.ch).name;
    $('btnCheck').style.display = type === 'exercise' ? '' : 'none';
    $('btnLoadSample').style.display = type === 'lesson' ? '' : 'none';

    /* 演示按钮：只有做了可视化演示的知识点才亮出来 */
    const viz = vizOf(id);
    $('btnViz').style.display = viz ? '' : 'none';
    $('btnViz').title = viz
      ? '可视化演示：' + viz.title + '（Ctrl+Shift+V）'
      : '可视化演示';
    if (vizPlayer) {
      vizPlayer.reset();
      $('vizBadge').textContent = '0';
    }
    if (data.stdin != null && String(data.stdin).length) {
      $('stdinInput').value = data.stdin;
    } else if (type === 'exercise') {
      $('stdinInput').value = '';
    }

    /* 换题就清空上一题留下的对比和诊断，别让人看着旧结果发懵 */
    $('diffBadge').textContent = '–';
    $('diffBadge').className = 'badge';
    $('probBadge').textContent = '0';
    $('probBadge').className = 'badge';
    $('diffBody').innerHTML = emptyDiffHtml(type);
    $('problems').innerHTML = '<div class="prob-empty">还没有编译或运行记录。写点代码，按 Ctrl+Enter 试试。</div>';
    renderAiIdle();

    if (!opts || !opts.restore) {
      $('titleHint').textContent = chapterOf(data.ch).name + ' · ' + data.title;
    }
  }

  function renderTabs() {
    $('tabs').innerHTML = state.tabs.map((t) => {
      const active = t.id === state.activeId;
      const dirty = isDirty(t.id);
      return '<div class="tab' + (active ? ' active' : '') + '" data-tab="' + t.id + '">' +
        '<span class="ico" style="font-size:11px;color:' + (t.type === 'exercise' ? '#dcdcaa' : '#519aba') + '">' +
        (t.type === 'exercise' ? '✎' : '§') + '</span>' +
        '<span class="t-name">' + esc(t.title) + '</span>' +
        (dirty ? '<span class="t-dot"></span>' : '') +
        '<span class="t-close" data-close="' + t.id + '">×</span></div>';
    }).join('');
    $('tabs').querySelectorAll('.tab').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.dataset.close) return;
        open(ITEMS[el.dataset.tab].type, el.dataset.tab);
      });
    });
    $('tabs').querySelectorAll('.t-close').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(el.dataset.close);
      });
    });
  }

  function closeTab(id) {
    const idx = state.tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    state.tabs.splice(idx, 1);
    if (state.activeId === id) {
      const next = state.tabs[Math.max(0, idx - 1)];
      if (next) open(ITEMS[next.id].type, next.id);
      else {
        state.activeId = null;
        renderTabs();
      }
    } else renderTabs();
  }

  function isDirty(id) {
    const item = ITEMS[id];
    if (!item) return false;
    const d = state.drafts[id];
    if (d == null) return false;
    const base = item.data.code != null ? item.data.code : (item.data.starter || '');
    return d.trim() !== base.trim();
  }

  function renderCrumbs(data, type) {
    const ch = chapterOf(data.ch);
    const parts = [ch.name, type === 'exercise' ? '练习题' : '知识点', data.title];
    $('crumbs').innerHTML = parts.map((p, i) =>
      '<span class="' + (i === parts.length - 1 ? 'cur' : '') + '">' + esc(p) + '</span>' +
      (i < parts.length - 1 ? '<span class="sep">›</span>' : '')
    ).join('');
  }

  /* ═══════════════════════════ 教程面板 ═══════════════════════════ */

  /* 白话定义卡：一句话 + 打个比方 + 最小例子。 这是"先看懂"的那一层。 */
  function defCardHtml(id) {
    const d = defOf(id);
    if (!d) return '';
    return '<section class="defcard">' +
      '<div class="defcard-top">' +
      '<span class="defcard-tag">白话速懂</span>' +
      '<span class="defcard-sub">先看这段，再看下面的推导</span>' +
      '</div>' +
      '<p class="defcard-plain">' + mdInline(d.plain) + '</p>' +
      (d.analogy
        ? '<div class="defcard-analogy"><span class="defcard-key">打个比方</span><p>' + mdInline(d.analogy) + '</p></div>'
        : '') +
      (d.demo
        ? '<div class="defcard-demo"><div class="defcard-demo-h">最小例子</div><pre><code>' + esc(d.demo) + '</code></pre></div>'
        : '') +
      '</section>';
  }

  /* 路线上"上一站"还没过就给一句提醒——不是硬拦，只是别让人从第 6 章空降 */
  function prereqHtml(id) {
    const order = window.PATH_ORDER || [];
    const i = order.indexOf(id);
    if (i <= 0) return '';
    const prev = ITEMS[order[i - 1]];
    if (!prev) return '';
    if (state.progress.lessons[prev.data.id]) return '';
    return '<button class="prereq" data-prev="' + prev.data.id + '">' +
      '<span class="prereq-t">上一站还没过：' + esc(prev.data.title) + '</span>' +
      '<span class="prereq-a">先去补 →</span></button>';
  }

  function renderLessonPanel(data, type) {
    $('lessonTitle').textContent = data.title;
    const pills = [];
    pills.push('<span class="pill ch">' + esc(chapterOf(data.ch).name) + '</span>');
    if (data.level) pills.push('<span class="pill">' + esc(data.level) + '</span>');
    if (type === 'lesson' && data.tag) pills.push('<span class="pill">' + esc(data.tag) + '</span>');
    const done = type === 'lesson' ? state.progress.lessons[data.id] : state.progress.exercises[data.id];
    if (done) pills.push('<span class="pill done">✔ 已完成</span>');
    $('lessonSub').innerHTML = pills.join(' ');

    let body = '';

    if (type === 'exercise') {
      body += data.desc || '';
      if (data.stdin) {
        body += '<h2>程序输入（标准输入）</h2><pre><code>' + esc(data.stdin) + '</code></pre>';
        body += '<div class="note">这段输入已经填到下方「标准输入」面板了，直接点运行即可。</div>';
      }
      if (data.hints && data.hints.length) {
        body += '<div class="callout hint"><div class="callout-h">思路提示<span>卡住了再看，一条一条试</span></div><ol>' +
          data.hints.map(h => '<li>' + mdInline(h) + '</li>').join('') + '</ol></div>';
      }
      body += '<div class="callout task"><div class="callout-h">怎么交这道题</div><ol>' +
        '<li>写完点「编译」——先确认没有语法错和警告。</li>' +
        '<li>点「运行」看输出，下面「对比」面板会直接告诉你哪一行和期望不一样。</li>' +
        '<li>一致了点「检查答案」判分；卡住了再点「看答案」。</li>' +
        '</ol></div>';
      $('btnDone').style.display = '';
      $('btnDone').textContent = '看答案';
    } else {
      body += data.body || '';
      if (data.tips && data.tips.length) {
        body += '<div class="callout tip"><div class="callout-h">实用技巧</div><ul>' +
          data.tips.map(t => '<li>' + mdInline(t) + '</li>').join('') + '</ul></div>';
      }
      if (data.traps && data.traps.length) {
        body += '<div class="callout trap"><div class="callout-h">常见坑</div><ul>' +
          data.traps.map(t => '<li>' + mdInline(t) + '</li>').join('') + '</ul></div>';
      }
      if (data.exercises && data.exercises.length) {
        body += '<h2>配套练习</h2><div class="ex-links">' + data.exercises.map(eid => {
          const ex = C.exercises.find(x => x.id === eid);
          if (!ex) return '';
          return '<a href="#" class="ex-link" data-ex="' + eid + '">' +
            '<span class="ex-link-t">' + esc(ex.title) + '</span>' +
            '<span class="ex-link-l">' + esc(ex.level || '练习') + '</span></a>';
        }).join('') + '</div>';
      }
      if (data.code) {
        body += '<div class="note">编辑器里已经放好本节的示例代码，按 <code>Ctrl+Enter</code> 直接跑。改一改再跑，比看十遍强。</div>';
      }
      $('btnDone').textContent = state.progress.lessons[data.id] ? '✔ 已学完' : '标记为已学';
    }

    /* 组装：演示入口 → 白话定义 → 本节目录 → 正文 */
    const panel = $('lessonBody');
    panel.innerHTML = '';

    const vizMeta = vizOf(data.id);
    if (vizMeta) {
      const cta = document.createElement('div');
      cta.className = 'viz-cta';
      cta.innerHTML = '<div class="viz-cta-h">本节带可视化演示</div>' +
        '<p>' + esc(vizMeta.desc || '') + '</p>' +
        '<button class="btn viz" id="vizCta">▶ 打开演示 · ' + esc(vizMeta.title) + '</button>' +
        '<div class="viz-cta-tip">演示会载入示例代码并逐帧回放，代码行同步高亮。快捷键 Ctrl+Shift+V</div>';
      panel.appendChild(cta);
    }

    const def = defCardHtml(data.id);
    if (def) {
      const holder = document.createElement('div');
      holder.innerHTML = def;
      panel.appendChild(holder.firstElementChild);
    }

    if (type === 'lesson') {
      const pre = prereqHtml(data.id);
      if (pre) {
        const holder = document.createElement('div');
        holder.innerHTML = pre;
        const btn = holder.firstElementChild;
        btn.addEventListener('click', () => open('lesson', btn.dataset.prev));
        panel.appendChild(btn);
      }
    }

    const prose = document.createElement('div');
    prose.className = 'prose';
    prose.innerHTML = body;

    /* 表格在 430px 宽的面板里常常放不下。给它套一层可以自己横向滚动的壳，
       别让整块面板跟着横向溢出（那样连正文都跟着跑偏）。 */
    prose.querySelectorAll('table').forEach((tb) => {
      if (tb.parentElement && tb.parentElement.classList.contains('table-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-wrap';
      tb.parentNode.insertBefore(wrap, tb);
      wrap.appendChild(tb);
    });

    /* 给每个 h2 编号并生成目录：长文里"一眼看到结构"靠这个 */
    const heads = Array.prototype.slice.call(prose.querySelectorAll('h2'));
    heads.forEach((h, i) => {
      h.id = 'sec-' + (i + 1);
      h.insertAdjacentHTML('afterbegin', '<span class="sec-n">' + String(i + 1).padStart(2, '0') + '</span>');
    });
    if (heads.length >= 3) {
      const toc = document.createElement('nav');
      toc.className = 'toc';
      toc.innerHTML = '<div class="toc-h">本节目录</div>' + heads.map((h, i) =>
        '<button class="toc-i" data-sec="sec-' + (i + 1) + '">' +
        '<b>' + String(i + 1).padStart(2, '0') + '</b>' +
        '<span>' + esc(h.textContent.replace(/^\d+/, '').trim()) + '</span></button>').join('');
      panel.appendChild(toc);
      toc.querySelectorAll('.toc-i').forEach(btn => {
        btn.addEventListener('click', () => {
          const t = prose.querySelector('#' + btn.dataset.sec);
          if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    panel.appendChild(prose);

    panel.querySelectorAll('.ex-link').forEach(a => {
      a.addEventListener('click', (e) => { e.preventDefault(); open('exercise', a.dataset.ex); });
    });
    const vizCta = panel.querySelector('#vizCta');
    if (vizCta) vizCta.addEventListener('click', () => runViz());
    panel.scrollTop = 0;
  }

  function nextLesson() {
    const id = state.activeId;
    const item = ITEMS[id];
    if (!item) return;
    if (item.type === 'exercise') {
      const idx = C.exercises.findIndex(e => e.id === id);
      const next = C.exercises[idx + 1];
      if (next) open('exercise', next.id);
      else toast('练习题刷完了，牛。');
      return;
    }
    const idx = C.lessons.findIndex(l => l.id === id);
    const next = C.lessons[idx + 1];
    if (next) open('lesson', next.id);
    else toast('已经是最后一个知识点了。');
  }

  /* ═══════════════════════════ 草稿 ═══════════════════════════ */

  let draftTimer = null;
  function scheduleDraftSave() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, 500);
  }
  function saveDraftNow() {
    if (!state.activeId || !editor) return;
    state.drafts[state.activeId] = editor.getValue();
    writeJSON(LS.drafts, state.drafts);
    renderTabs();
  }

  /* ═══════════════════════════ 运行 / 编译 / 判题 ═══════════════════════════ */

  function pushTerm(html) {
    const atBottom = term.scrollHeight - term.parentElement.scrollHeight - term.parentElement.scrollTop < 60;
    term.insertAdjacentHTML('beforeend', html + '\n');
    if (atBottom) term.parentElement.scrollTop = term.parentElement.scrollHeight;
  }

  function setRunState(txt, cls) {
    const el = $('runState');
    el.textContent = txt;
    el.className = 'run-state' + (cls ? ' ' + cls : '');
    $('sbMsg').textContent = txt;
  }

  async function callRun(code, stdin) {
    return apiPost('/api/run', { code: code, stdin: stdin });
  }
  async function callCompile(code) {
    return apiPost('/api/compile', { code: code });
  }
  async function callJudge(code, cases) {
    return apiPost('/api/judge', {
      code: code,
      cases: cases.map(c => ({ stdin: c.stdin, note: c.note }))
    });
  }

  /* ------------------------------------------------------------
     所有写接口都要带本地令牌（服务端只发给同源页面），
     令牌会随服务重启而变，所以 403 时自动重新取一次再试。
     ------------------------------------------------------------ */
  let tokenRetried = false;

  async function refreshToken() {
    try {
      const h = await (await fetch('/api/health')).json();
      window.CLEARN_TOKEN = h.token || '';
      return h;
    } catch (e) {
      return null;
    }
  }

  async function apiPost(pathName, body) {
    const send = () => fetch(pathName, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CLearn-Token': window.CLEARN_TOKEN || '' },
      body: JSON.stringify(body)
    });
    let res = await send();
    if (res.status === 403 && !tokenRetried) {
      tokenRetried = true;
      await refreshToken();
      res = await send();
    }
    return res.json();
  }

  function currentItem() { return ITEMS[state.activeId] || null; }
  function currentExpected() {
    const it = currentItem();
    return it && it.type === 'exercise' && it.data.expected != null ? it.data.expected : null;
  }

  /* ---------- 运行 ---------- */

  async function runCode() {
    if (state.running) { toast('上一次还在跑，别急。'); return; }
    const code = editor.getValue();
    if (!code.trim()) { toast('编辑器是空的，写点东西吧。'); return; }
    const stdin = $('stdinInput').value;

    snapshotCode('运行前');
    state.running = true;
    setRunState('编译中…', 'busy');
    $('btnRun').disabled = true;
    switchPanelTab('out');
    const item = currentItem();
    const name = item ? (item.type === 'exercise' ? 'solution.c' : 'main.c') : 'main.c';
    pushTerm('<span class="t-hr">──────────────────────────────────────────</span>');
    pushTerm('<span class="t-cmd">▶ ' + name + '</span> <span class="t-dim">' + new Date().toLocaleTimeString('zh-CN') + '</span>');

    try {
      const res = await callRun(code, stdin);

      if (res.error && !res.stage) {
        pushTerm('<span class="t-err">✖ ' + esc(res.error) + '</span>');
        setRunState('出错了', 'bad');
        return;
      }
      if (res.stage === 'compile') {
        pushTerm('<span class="t-err">✖ 编译失败（' + res.compileMs + ' ms）</span>');
        pushTerm('<span class="t-err">' + esc((res.compilerOutput || '').trim()) + '</span>');
        editor.setDiagnostics(res.diagnostics || []);
        const pack = D.summarizeRun(res, { code: code, expected: currentExpected() });
        state.lastRun = { res: res, pack: pack, actual: '', code: code, expected: currentExpected() };
        renderProblems(res.diagnostics || [], pack);
        switchPanelTab('problems');
        setRunState('编译失败', 'bad');
        return;
      }

      /* ---- 编译通过 ---- */
      if (res.warnings && res.warnings.length) {
        pushTerm('<span class="t-warn">⚠ ' + res.warnings.length + ' 条警告（见「问题」面板）</span>');
      }
      editor.setDiagnostics([]);
      if (res.compilerOutput && res.compilerOutput.trim()) {
        pushTerm('<span class="t-warn">' + esc(res.compilerOutput.trim()) + '</span>');
      }
      pushTerm('<span class="t-dim">编译 ' + res.compileMs + ' ms · 运行 ' + res.runMs + ' ms</span>');
      if (res.stdout) pushTerm('<span class="t-out">' + esc(res.stdout.replace(/\n$/, '')) + '</span>');
      if (res.stderr) pushTerm('<span class="t-err">' + esc(res.stderr.replace(/\n$/, '')) + '</span>');
      if (res.timedOut) pushTerm('<span class="t-err">⏱ 超时（5 秒）已强制结束 —— 检查是不是死循环了</span>');
      else if (res.exitCode !== 0) pushTerm('<span class="t-err">✖ 进程异常退出，退出码 ' + res.exitCode + '</span>');
      else pushTerm('<span class="t-ok">✔ 程序正常结束</span>');

      const expected = currentExpected();
      const pack = D.summarizeRun(res, { code: code, expected: expected });
      state.lastRun = { res: res, pack: pack, actual: res.stdout || '', code: code, expected: expected };

      /* 多用例题：单次运行只跑一组，提示一下别拿它当判题结果 */
      const ex = currentItem();
      if (ex && ex.type === 'exercise' && casesOf(ex.data).length > 1) {
        pushTerm('<span class="t-dim">这题有 ' + casesOf(ex.data).length +
          ' 组用例，上面的输出只是「标准输入」面板里那一组的。点「检查答案」会一次跑完全部用例。</span>');
      }

      if (pack.diff) {
        renderCompare(expected, res.stdout || '');
        if (!pack.diff.same) {
          pushTerm('<span class="t-warn">⚠ 输出和期望不一致：看「对比」面板，第一处不同已经标出来了。</span>');
          setRunState('输出不一致', 'bad');
        } else {
          setRunState('运行完成 · 输出一致', 'ok');
        }
      } else {
        setRunState(res.timedOut ? '超时' : '运行完成', (res.timedOut || res.exitCode) ? 'bad' : 'ok');
      }

      renderProblems(res.warnings || [], pack);
      if (pack.kind === 'runtime' || pack.kind === 'lint') switchPanelTab('problems');
    } catch (e) {
      pushTerm('<span class="t-err">✖ 无法连接本地服务：' + esc(e.message) + '</span>');
      pushTerm('<span class="t-dim">  请确认 server.js 正在运行：node server.js</span>');
      setRunState('服务未启动', 'bad');
    } finally {
      state.running = false;
      $('btnRun').disabled = false;
    }
  }

  /* ---------- 只编译 ---------- */

  async function compileOnly() {
    if (state.running) { toast('上一次还在跑，别急。'); return; }
    const code = editor.getValue();
    if (!code.trim()) { toast('编辑器是空的，没什么可编译的。'); return; }

    snapshotCode('编译前');
    state.running = true;
    setRunState('编译中…', 'busy');
    $('btnCompile').disabled = true;
    pushTerm('<span class="t-hr">──────────────────────────────────────────</span>');
    pushTerm('<span class="t-cmd">⚙ 只编译（不运行）</span>');

    try {
      const res = await callCompile(code);
      if (res.error && !res.stage) {
        pushTerm('<span class="t-err">✖ ' + esc(res.error) + '</span>');
        setRunState('出错了', 'bad');
        return;
      }
      if (!res.ok) {
        const errCount = (res.diagnostics || []).filter(d => d.severity === 'error').length;
        pushTerm('<span class="t-err">✖ 有 ' + errCount + ' 个错误（' + res.compileMs + ' ms）</span>');
        editor.setDiagnostics(res.diagnostics || []);
        const pack = D.summarizeRun(res, { code: code, expected: currentExpected() });
        state.lastRun = { res: res, pack: pack, actual: '', code: code, expected: currentExpected() };
        renderProblems(res.diagnostics || [], pack);
        switchPanelTab('problems');
        setRunState('编译失败', 'bad');
        return;
      }
      const warns = res.warnings || [];
      const passRes = { ok: true, diagnostics: warns, compileMs: res.compileMs, compilerOutput: res.compilerOutput };
      const pack = D.summarizeRun(passRes, { code: code, expected: currentExpected() });
      state.lastRun = { res: passRes, pack: pack, actual: '', code: code, expected: currentExpected() };
      if (warns.length) {
        pushTerm('<span class="t-warn">⚠ 编译通过，但有 ' + warns.length + ' 条警告 —— 警告往往就是下一步出错的伏笔。</span>');
        renderProblems(warns, pack);
        switchPanelTab('problems');
        setRunState('通过（有警告）', 'busy');
      } else {
        pushTerm('<span class="t-ok">✔ 编译通过，0 错误 0 警告（' + res.compileMs + ' ms）。可以点「运行」了。</span>');
        renderProblems([], null);
        setRunState('编译通过', 'ok');
      }
      editor.setDiagnostics([]);
    } catch (e) {
      pushTerm('<span class="t-err">✖ 无法连接本地服务：' + esc(e.message) + '</span>');
      setRunState('服务未启动', 'bad');
    } finally {
      state.running = false;
      $('btnCompile').disabled = false;
    }
  }

  /* ---------- 草稿快照 ---------- */

  const SNAP_MAX = 10;

  /* 每次"运行 / 编译 / 判题"之前存一版：改崩了还能捞回来，成本只有几十 KB */
  function snapshotCode(reason) {
    if (!state.activeId || !editor) return;
    const code = editor.getValue();
    const list = state.history[state.activeId] || (state.history[state.activeId] = []);
    if (list.length && list[0].code === code) return;   // 内容没变，不重复存
    list.unshift({ t: Date.now(), reason: reason || '运行前', code: code });
    state.history[state.activeId] = list.slice(0, SNAP_MAX);
    writeJSON(LS.history, state.history);
  }

  function openHistory() {
    const id = state.activeId;
    const list = state.history[id] || [];
    if (!list.length) {
      modal('草稿历史', '<p>还没有快照。每次点「运行 / 编译 / 检查答案」前都会自动存一份，最多留 10 版。</p>');
      return;
    }
    const rows = list.map((sn, i) => {
      const d = new Date(sn.t);
      const hm = [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map(n => String(n).padStart(2, '0')).join(':');
      const first = (sn.code.split('\n').find(l => l.trim()) || '').trim().slice(0, 46);
      return '<div class="hist-row">' +
        '<span class="hist-t">' + hm + '</span>' +
        '<span class="hist-r">' + esc(sn.reason) + '</span>' +
        '<code class="hist-c">' + esc(first) + '</code>' +
        '<button class="btn ghost hist-go" data-i="' + i + '">恢复</button></div>';
    }).join('');
    modal('草稿历史（' + list.length + ' 版）',
      '<p class="hist-tip">恢复会覆盖当前内容——但当前这版会先存进历史，反悔还能再捞回来。</p>' + rows);
    document.querySelectorAll('.hist-go').forEach(btn => btn.addEventListener('click', () => {
      const sn = list[Number(btn.dataset.i)];
      snapshotCode('恢复前');
      editor.setValue(sn.code);
      state.drafts[id] = sn.code;
      writeJSON(LS.drafts, state.drafts);
      renderTabs();
      closeModal();
      toast('已恢复 ' + new Date(sn.t).toLocaleTimeString('zh-CN') + ' 的版本', 'ok');
    }));
  }

  /* ---------- 用例 ---------- */

  /* 有 cases 就用 cases（多组），否则退回题目自带的单组 stdin/expected */
  function casesOf(ex) {
    if (!ex) return [];
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

  /* 结构哨兵：输出对了但没用到该用的写法，提醒一句（不判错） */
  function structureCheck(id, code) {
    const r = (window.EX_RULES || {})[id];
    if (!r || !r.must || !r.must.length) return null;
    const hit = r.must.some((re) => {
      try { return re.test(code); } catch (e) { return false; }
    });
    return hit ? null : { why: r.why || '这题要练的东西没在代码里出现' };
  }

  /* ---------- 检查答案（多用例） ---------- */

  async function checkAnswer() {
    const item = currentItem();
    if (!item || item.type !== 'exercise') { toast('只有在练习题里才能判分。'); return; }
    const data = item.data;
    const cases = casesOf(data);
    if (!cases.length) { toast('这道题没有标准输出，自己对照题目检查吧。'); return; }

    const code = editor.getValue();
    if (!code.trim() || code.trim() === (data.starter || '').trim()) {
      toast('骨架还没动呢，先把 TODO 写完。', 'err');
      return;
    }
    snapshotCode('判题前');
    setRunState('判题中…', 'busy');
    $('btnCheck').disabled = true;
    pushTerm('<span class="t-hr">──────────────────────────────────────────</span>');
    pushTerm('<span class="t-cmd">▶ 检查答案 · ' + esc(data.title) + '</span>' +
      '<span class="t-dim"> · ' + cases.length + ' 组用例</span>');
    try {
      const res = await callJudge(code, cases);

      if (res.stage === 'compile') {
        pushTerm('<span class="t-err">✖ 编译没过，先修语法：</span>');
        pushTerm('<span class="t-err">' + esc((res.compilerOutput || '').trim()) + '</span>');
        editor.setDiagnostics(res.diagnostics || []);
        const pack = D.summarizeRun(res, { code: code, expected: cases[0].expected });
        state.lastRun = { res: res, pack: pack, actual: '', code: code, expected: cases[0].expected };
        renderProblems(res.diagnostics || [], pack);
        switchPanelTab('problems');
        setRunState('编译失败', 'bad');
        return;
      }
      if (!res.ok) {
        pushTerm('<span class="t-err">✖ ' + esc(res.error || '判题失败') + '</span>');
        setRunState('判题失败', 'bad');
        return;
      }

      const evaluated = cases.map((c, i) => {
        const r = res.results[i] || { stdout: '', stderr: '', exitCode: 1, timedOut: false };
        const diff = D.analyzeDiff(c.expected, r.stdout);
        return Object.assign({}, c, { res: r, diff: diff, pass: diff.same && !r.timedOut });
      });
      const pass = evaluated.filter(x => x.pass).length;
      const structure = pass === evaluated.length ? structureCheck(data.id, code) : null;
      const selected = Math.max(0, evaluated.findIndex(x => !x.pass));

      state.judge = { cases: evaluated, pass: pass, total: evaluated.length, structure: structure, selected: selected };
      state.lastRun = {
        res: { ok: true, exitCode: evaluated[selected].res.exitCode, compilerOutput: res.compilerOutput },
        pack: null,
        actual: evaluated[selected].res.stdout,
        code: code,
        expected: evaluated[selected].expected,
        judged: true
      };
      if (Array.isArray(res.warnings) && res.warnings.length) renderProblems(res.warnings, null);
      renderJudge();
      switchPanelTab('diff');

      if (pass === evaluated.length) {
        state.progress.exercises[data.id] = true;
        writeJSON(LS.progress, state.progress);
        buildExerciseTree();
        buildTree($('treeFilter').value);
        renderProgress();
        updateStatus();
        renderLessonPanel(data, 'exercise');
        pushTerm('<span class="t-ok">✔ 通过！' + pass + '/' + evaluated.length + ' 组用例全部一致。</span>');
        if (structure) {
          pushTerm('<span class="t-warn">⚠ 输出对了，但代码里没看到这题该练的写法（见「对比」面板的提示）。</span>');
          setRunState('通过（结构提醒）', 'busy');
        } else {
          setRunState('判题通过', 'ok');
        }
        toast('✔ ' + pass + ' 组全过。下一题？', 'ok');
      } else {
        pushTerm('<span class="t-err">✖ ' + pass + '/' + evaluated.length + ' 组通过，第 ' +
          (selected + 1) + ' 组没过（输入 ' + esc(previewStdin(evaluated[selected].stdin)) + '）。</span>');
        setRunState('答案不匹配', 'bad');
        toast('挂在哪组、差哪个字符，都在「对比」面板里。', 'err', 3600);
      }
    } catch (e) {
      pushTerm('<span class="t-err">✖ 无法连接本地服务：' + esc(e.message) + '</span>');
      setRunState('服务未启动', 'bad');
    } finally {
      $('btnCheck').disabled = false;
    }
  }

  /* ═══════════════════════════ 对比面板 ═══════════════════════════ */

  function emptyDiffHtml(type) {
    return '<div class="diff-empty">' +
      '<div class="diff-empty-t">' + (type === 'exercise' ? '这里会显示「你的输出」和「期望输出」的逐行对照' : '这里显示运行输出与期望输出的对照') + '</div>' +
      '<div class="diff-empty-d">' +
      (type === 'exercise'
        ? '写完代码先点「运行」——如果输出和标准答案不一致，这个面板会自动列出第几行第几个字符不一样；点「检查答案」会一次跑完这道题的所有用例，并告诉你挂在哪一组。'
        : '知识点没有标准输出，这一栏只对练习题有意义。') +
      '</div></div>';
  }

  function previewStdin(s) {
    const t = String(s == null ? '' : s).replace(/\n+$/, '');
    if (!t) return '（无输入）';
    const one = t.replace(/\n/g, ' ⏎ ');
    return one.length > 42 ? one.slice(0, 42) + '…' : one;
  }

  function markChar(str, col) {
    if (str == null) return '<span class="dl-none">—</span>';
    if (!col || col > str.length) return esc(str);
    const i = col - 1;
    return esc(str.slice(0, i)) + '<mark class="dch">' + esc(str[i]) + '</mark>' + esc(str.slice(i + 1));
  }

  function setDiffBadge(ok) {
    const badge = $('diffBadge');
    badge.textContent = ok ? '✓' : '✗';
    badge.className = 'badge' + (ok ? ' ok' : ' err');
  }

  function diffBlockHtml(d) {
    let html = '';
    if (d.same) {
      html += '<div class="diff-verdict ok"><b>输出和期望完全一致</b><span>' +
        d.rows.length + ' 行全部匹配（已忽略行尾空白和末尾空行，判题时这些差异都不算错）</span></div>';
    } else {
      const f = d.first;
      html += '<div class="diff-verdict bad"><b>第一处不同：第 ' + f.line + ' 行' +
        (f.col ? '第 ' + f.col + ' 列' : '') + '</b><span>期望 <code>' + esc(f.expChar || '(缺行)') +
        '</code>，你的输出 <code>' + esc(f.actChar || '(行尾)') + '</code></span></div>';
      if (d.causes.length) {
        html += '<ul class="diff-causes">' + d.causes.map(c => '<li>' + esc(c) + '</li>').join('') + '</ul>';
      }
    }
    html += '<div class="dl-table">' +
      '<div class="dl-head"><span class="dl-n">行</span><span class="dl-exp">期望输出</span><span class="dl-act">你的输出</span><span class="dl-flag"></span></div>';
    d.rows.forEach((r) => {
      html += '<div class="dl-row ' + (r.ok ? 'ok' : 'bad') + '">' +
        '<span class="dl-n">' + r.n + '</span>' +
        '<span class="dl-exp">' + markChar(r.exp, r.diff && r.diff.col) + '</span>' +
        '<span class="dl-act">' + (r.ok ? '<span class="dl-same">同上</span>' : markChar(r.act, r.diff && r.diff.col)) + '</span>' +
        '<span class="dl-flag">' + (r.ok ? '✓' : '✗') + '</span>' +
        '</div>';
    });
    html += '</div>';
    return html;
  }

  function diffFootHtml() {
    return '<div class="diff-foot">' +
      '<span class="diff-foot-tip">标红的字符就是差异所在 · 行尾空白和末尾空行已忽略</span>' +
      '<span class="diff-foot-act">' +
      '<button class="btn ghost" id="diffCopy">复制我的输出</button>' +
      '<button class="btn ai" id="diffAi">让 AI 解释差异</button>' +
      '</span></div>';
  }

  function wireDiffFoot(actual) {
    const cp = $('diffCopy');
    if (cp) cp.addEventListener('click', () => {
      copyText(String(actual || ''));
      toast('已复制你的输出', 'ok', 1500);
    });
    const ai = $('diffAi');
    if (ai) ai.addEventListener('click', () => runAi('diff'));
  }

  /* 单组：运行后自动比对（练习题才有 expected） */
  function renderCompare(expected, actual) {
    const d = D.analyzeDiff(expected, actual);
    state.diff = d;
    setDiffBadge(d.same);
    $('diffBody').innerHTML = diffBlockHtml(d) + diffFootHtml();
    wireDiffFoot(actual);
  }

  /* 多组：判题结果 + 用例切换 */
  function renderJudge() {
    const j = state.judge;
    if (!j) return;
    const allPass = j.pass === j.total;
    const cur = j.cases[j.selected] || j.cases[0];
    state.diff = cur.diff;
    setDiffBadge(allPass);

    let html = '<div class="case-strip">' +
      j.cases.map((c, i) =>
        '<button class="case-chip ' + (c.pass ? 'ok' : 'bad') + (i === j.selected ? ' on' : '') +
        '" data-i="' + i + '" title="' + esc(c.note) + '">' +
        '<b>' + (i + 1) + '</b><span>' + (c.pass ? '✓' : '✗') + '</span>' +
        '</button>').join('') +
      '<span class="case-sum ' + (allPass ? 'ok' : 'bad') + '">' +
      j.pass + ' / ' + j.total + ' 组通过</span>' +
      (j.total > 1 ? '<span class="case-hint">点数字切换这组的对比</span>' : '') +
      '</div>';

    if (j.total > 1) {
      html += '<div class="case-note"><b>' + esc(cur.note) + '</b>' +
        '<span class="case-in">输入 <code>' + esc(previewStdin(cur.stdin)) + '</code></span>' +
        (cur.pass ? '' : '<span class="case-bad">这组没过</span>') +
        '</div>';
    }

    html += diffBlockHtml(cur.diff);

    if (j.structure) {
      html += '<div class="struct-warn"><b>输出对了，但这题要练的是：' + esc(j.structure.why) + '</b>' +
        '<span>你的代码里没看到相关写法。把答案直接 <code>printf</code> 出来也能过判题，但那样这题就白做了。</span></div>';
    }

    html += diffFootHtml();
    $('diffBody').innerHTML = html;

    document.querySelectorAll('.case-chip').forEach(b => b.addEventListener('click', () => {
      j.selected = Number(b.dataset.i);
      renderJudge();
    }));
    wireDiffFoot(cur.res.stdout);
  }

  function copyText(t) {
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      else {
        const ta = document.createElement('textarea');
        ta.value = t; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
    } catch (e) { /* ignore */ }
  }

  /* ═══════════════════════════ 问题面板（人话诊断） ═══════════════════════════ */

  function renderProblems(list, pack) {
    const box = $('problems');
    const badge = $('probBadge');
    const items = list || [];
    const errors = items.filter(d => d.severity === 'error').length;
    const total = items.length + (pack && pack.lint ? pack.lint.length : 0);
    badge.textContent = String(total);
    badge.className = 'badge' + (errors || (pack && pack.kind === 'compile') ? ' err' : '');

    let html = '';

    if (pack && pack.title) {
      const cls = pack.kind === 'compile' || pack.kind === 'runtime' ? 'bad'
        : (pack.kind === 'ok' ? 'ok' : 'warn');
      html += '<div class="diag-banner ' + cls + '"><b>' + esc(pack.title) + '</b>' +
        (pack.kind === 'compile' ? '<span>从上往下修：后面的错误常常是第一条引起的连锁反应。</span>' : '') +
        (pack.kind === 'runtime' ? '<span>程序跑起来了，但中途崩了。下面是常见的几种死因。</span>' : '') +
        '</div>';
    }

    if (pack && pack.items && pack.items.length) {
      pack.items.forEach((it, idx) => {
        html += '<div class="diag-item">' +
          '<div class="diag-t">' +
          '<span class="diag-i">' + (idx + 1) + '</span>' +
          '<span class="diag-title">' + esc(it.title) + '</span>' +
          (it.line ? '<button class="diag-jump" data-line="' + it.line + '">跳到第 ' + it.line + ' 行</button>' : '') +
          '</div>' +
          (it.why ? '<div class="diag-why"><span class="diag-k">为什么</span>' + mdInline(it.why) + '</div>' : '') +
          (it.fix ? '<div class="diag-fix"><span class="diag-k">怎么改</span>' + mdInline(it.fix) + '</div>' : '') +
          (it.snippet ? '<pre class="diag-snip"><code>' + esc(it.snippet) + '</code></pre>' : '') +
          (it.raw ? '<details class="diag-raw"><summary>编译器原话</summary><code>' + esc(it.raw) + '</code></details>' : '') +
          '</div>';
      });
    }

    /* 原始诊断列表（可点击跳行）—— 保留给需要看 gcc 原话的人 */
    if (items.length) {
      html += '<div class="prob-list">' + items.map(d =>
        '<div class="prob ' + (d.severity === 'warning' ? 'warning' : '') + '" data-line="' + (d.line || 1) + '">' +
        '<span class="p-ico">' + (d.severity === 'warning' ? '⚠' : '✖') + '</span>' +
        '<span class="p-msg">' + esc(d.message) + '</span>' +
        '<span class="p-loc">' + esc(d.file || 'main.c') + (d.line ? ':' + d.line + ':' + d.col : '') + '</span></div>'
      ).join('') + '</div>';
    }

    if (pack && pack.lint && pack.lint.length) {
      html += '<div class="lint-block"><div class="lint-h">代码自查（不依赖编译器，按经验抓的）</div>' +
        pack.lint.map(l => '<div class="lint-row ' + (l.level === 'error' ? 'bad' : 'warn') + '">' +
          '<span class="lint-dot"></span><span>' + mdInline(l.text) + '</span>' +
          (l.line ? '<button class="diag-jump" data-line="' + l.line + '">第 ' + l.line + ' 行</button>' : '') +
          '</div>').join('') + '</div>';
    }

    if (!html) {
      box.innerHTML = '<div class="prob-empty">没有错误或警告。干净得像刚写的空文件。</div>';
      return;
    }

    html += '<div class="diag-cta">' +
      '<span>还是不明白？可以让 AI 针对这次的问题讲一遍（会把你这段代码和这次报错发给你自己配置的模型）。</span>' +
      '<button class="btn ai" id="probAi">让 AI 讲一遍</button>' +
      '<span class="diag-cta-tip">没配 API 也没关系，上面的离线诊断本身就是答案。</span>' +
      '</div>';

    box.innerHTML = html;
    box.querySelectorAll('.diag-jump').forEach(btn => {
      btn.addEventListener('click', () => {
        const line = Number(btn.dataset.line);
        if (line) editor.gotoLine(line);
      });
    });
    const pa = $('probAi');
    if (pa) pa.addEventListener('click', () => runAi('diagnose'));
  }

  /* ═══════════════════════════ AI 面板 ═══════════════════════════ */

  function aiReady() { return window.CAI && window.CAI.isReady(); }
  function aiCfg() { return window.CAI ? window.CAI.load() : {}; }

  function aiEngineLabel() {
    const cfg = aiCfg();
    const p = window.CAI && window.CAI.PRESETS[cfg.provider];
    return (p ? p.label : '自定义') + ' · ' + (cfg.model || '未选模型');
  }

  function renderAiIdle() {
    const box = $('aiBody');
    if (!box) return;
    const badge = $('aiBadge');
    const ready = aiReady();
    if (badge) {
      badge.textContent = ready ? '✓' : '·';
      badge.className = 'badge' + (ready ? ' ok' : '');
    }

    if (!ready) {
      box.innerHTML = '<div class="ai-setup">' +
        '<div class="ai-setup-h">AI 改错是可选功能，现在还没启用</div>' +
        '<p>本程序不联网也能用：编译、运行、报错翻译、答案对比全部在本地完成。' +
        '只有你想让模型「用人话再讲一遍」时，才需要填一个自己的 API Key。</p>' +
        '<ul class="ai-setup-list">' +
        '<li><b>用什么</b>：任何 OpenAI 兼容接口——DeepSeek、Kimi、智谱、通义、OpenAI，或者本机跑的 Ollama。</li>' +
        '<li><b>Key 去哪了</b>：只存在你本机浏览器的 localStorage，请求经本机 127.0.0.1 的服务直连服务商，不经过任何中转。</li>' +
        '<li><b>发什么</b>：只发这道题的题干、这次报错和这段代码；不发学习进度、不发别的题。</li>' +
        '</ul>' +
        '<button class="btn" id="aiGoSettings">去设置里填 API（也可以一直不填）</button>' +
        '</div>';
      const b = $('aiGoSettings');
      if (b) b.addEventListener('click', () => showView('settings'));
      return;
    }

    const ctx = aiContext();
    box.innerHTML = '<div class="ai-idle">' +
      '<div class="ai-idle-head"><span class="ai-dot"></span>已连接：<b>' + esc(aiEngineLabel()) + '</b></div>' +
      '<div class="ai-idle-ctx">' + esc(ctx.summary) + '</div>' +
      '<div class="ai-idle-act">' +
      '<button class="btn ai" id="aiAsk">分析这次的问题</button>' +
      '<button class="btn ghost" id="aiReview">通读一遍我的代码</button>' +
      '<button class="btn ghost" id="aiSettingsFromPanel">换模型 / 关闭</button>' +
      '</div>' +
      '<div class="ai-idle-note">AI 只负责"讲清楚"，改还是你自己改——这样下次才会。</div>' +
      '</div>';
    $('aiAsk').addEventListener('click', () => runAi('diagnose'));
    $('aiReview').addEventListener('click', () => runAi('review'));
    $('aiSettingsFromPanel').addEventListener('click', () => showView('settings'));
  }

  /* 把"这次发生了什么"整理成一句话，给面板显示，也给提示词用 */
  function aiContext() {
    const item = currentItem();
    const data = (item && item.data) || {};
    const lr = state.lastRun;
    const j = state.judge;
    let summary = '还没有运行记录——先点「运行」或「编译」，AI 才能看到具体报错。';
    let kind = 'review';

    if (j) {
      const firstBad = j.cases.find(c => !c.pass);
      if (j.pass === j.total) {
        summary = '上一次判题：' + j.total + ' 组用例全部通过。';
        kind = 'ok';
      } else {
        summary = '上一次判题：' + j.total + ' 组用例过了 ' + j.pass + ' 组，第 ' +
          (j.cases.indexOf(firstBad) + 1) + ' 组没过（输入 ' + previewStdin(firstBad.stdin) + '）。';
        kind = 'answer';
      }
    } else if (lr) {
      if (lr.pack && lr.pack.kind === 'compile') { summary = '上一次：编译失败，共 ' + ((lr.res.diagnostics || []).length) + ' 条诊断。'; kind = 'compile'; }
      else if (lr.pack && lr.pack.kind === 'runtime') { summary = '上一次：程序异常结束（退出码 ' + lr.res.exitCode + '）。'; kind = 'runtime'; }
      else if (lr.pack && lr.pack.kind === 'answer') { summary = '上一次：能跑通，但输出和期望不一致。'; kind = 'answer'; }
      else if (lr.pack && lr.pack.kind === 'lint') { summary = '上一次：跑通了，代码里有 ' + lr.pack.lint.length + ' 处隐患。'; kind = 'lint'; }
      else { summary = '上一次：跑通了，输出正常。'; kind = 'ok'; }
    }

    return {
      title: data.title || '未命名',
      exercise: item ? item.type === 'exercise' : false,
      desc: data.desc,
      expected: lr ? lr.expected : (data.expected != null ? data.expected : null),
      actual: lr ? lr.actual : null,
      code: editor ? editor.getValue() : '',
      compilerOutput: lr && lr.res ? lr.res.compilerOutput : '',
      pack: lr ? lr.pack : null,
      diff: state.diff,
      lint: lr && lr.pack ? (lr.pack.lint || []) : [],
      /* 判题失败的那几组用例一起给 AI——只给代码，它猜不出"哪组输入挂了" */
      cases: j ? j.cases.map(c => ({
        note: c.note, stdin: c.stdin, expected: c.expected,
        actual: c.res.stdout, pass: c.pass, timedOut: c.res.timedOut
      })) : null,
      structure: j ? j.structure : null,
      kind: kind,
      summary: summary
    };
  }

  async function runAi(mode) {
    if (!window.CAI) { toast('AI 模块没加载成功，刷新页面试试。', 'err'); return; }
    if (!aiReady()) {
      renderAiIdle();
      switchPanelTab('ai');
      showView('settings');
      toast('需要先在「设置 → AI 辅助改错」里填一个 API Key（也可以不填，离线诊断够用）。', '', 5200);
      return;
    }
    if (state.aiBusy) { toast('AI 还在想，等它说完。'); return; }

    const ctx = aiContext();
    if (mode === 'review') ctx.kind = 'review';
    const messages = window.CAI.buildPrompt(ctx);

    state.aiBusy = true;
    switchPanelTab('ai');
    const box = $('aiBody');
    box.innerHTML = '<div class="ai-loading"><span class="ai-spin"></span>' +
      '<div><b>正在问 ' + esc(aiEngineLabel()) + '…</b>' +
      '<div class="ai-loading-tip">只发送这道题、这次报错和这段代码。最长等 95 秒。</div></div></div>' +
      '<button class="btn ghost" id="aiCancel">不想等了</button>';
    $('aiCancel').addEventListener('click', () => { state.aiBusy = false; box.innerHTML = '<div class="ai-note">已取消等待。重新点一次就能再问。</div>'; });
    setRunState('AI 分析中…', 'busy');

    const t0 = Date.now();
    const r = await window.CAI.chat(messages, aiCfg());
    const ms = Date.now() - t0;
    state.aiBusy = false;

    if (!r.ok) {
      box.innerHTML = '<div class="ai-error"><div class="ai-error-h">没成功：' + esc(r.error || '未知错误') + '</div>' +
        (r.detail ? '<pre class="ai-error-detail">' + esc(String(r.detail).slice(0, 600)) + '</pre>' : '') +
        '<div class="ai-error-tip">常见原因：Key 错了 / 余额不足 / 接口地址少写或多写 <code>/v1</code> / 网络到不了服务商。</div>' +
        '<div class="ai-error-act">' +
        '<button class="btn" id="aiRetry">重试一次</button>' +
        '<button class="btn ghost" id="aiToSettings">去设置检查</button></div></div>';
      $('aiRetry').addEventListener('click', () => runAi(mode));
      $('aiToSettings').addEventListener('click', () => showView('settings'));
      setRunState('AI 调用失败', 'bad');
      return;
    }

    const usage = r.usage ? (' · ' + (r.usage.total_tokens || 0) + ' tokens') : '';
    box.innerHTML = '<div class="ai-answer-head">' +
      '<span class="ai-dot"></span><b>' + esc(r.model || aiCfg().model) + '</b>' +
      '<span class="ai-meta">' + (ms / 1000).toFixed(1) + ' s' + usage + '</span>' +
      '<span class="ai-head-act">' +
      '<button class="btn ghost" id="aiCopy">复制</button>' +
      '<button class="btn ghost" id="aiAgain">再问一次</button>' +
      '</span></div>' +
      '<div class="ai-md">' + window.CAI.render(r.content) + '</div>' +
      '<div class="ai-foot">AI 也会错。它给的代码建议，先自己跑一遍再信。</div>';
    $('aiCopy').addEventListener('click', () => { copyText(r.content); toast('回答已复制', 'ok', 1500); });
    $('aiAgain').addEventListener('click', () => runAi(mode));
    setRunState('AI 已回复', 'ok');
  }

  /* ═══════════════════════════ AI 设置 ═══════════════════════════ */

  function initAiSettings() {
    if (!window.CAI) return;
    const sel = $('aiProvider');
    if (!sel) return;
    const cfg = window.CAI.load();
    sel.innerHTML = Object.keys(window.CAI.PRESETS)
      .map(k => '<option value="' + k + '">' + esc(window.CAI.PRESETS[k].label) + '</option>').join('');
    sel.value = cfg.provider;
    $('aiBase').value = cfg.baseURL || '';
    $('aiKey').value = cfg.apiKey || '';
    $('aiModel').value = cfg.model || '';
    updateAiStatus();

    sel.addEventListener('change', () => {
      const p = window.CAI.PRESETS[sel.value];
      const cur = window.CAI.load();
      cur.provider = sel.value;
      if (p) {
        if (p.url) { cur.baseURL = p.url; $('aiBase').value = p.url; }
        if (p.model) { cur.model = p.model; $('aiModel').value = p.model; }
      }
      window.CAI.save(cur);
      updateAiStatus();
    });

    const persist = () => {
      const cur = window.CAI.load();
      cur.baseURL = $('aiBase').value.trim();
      cur.apiKey = $('aiKey').value.trim();
      cur.model = $('aiModel').value.trim();
      window.CAI.save(cur);
      updateAiStatus();
    };
    $('aiBase').addEventListener('input', persist);
    $('aiKey').addEventListener('input', persist);
    $('aiModel').addEventListener('input', persist);

    $('btnAiTest').addEventListener('click', async () => {
      const st = $('aiStatus');
      st.className = 'ai-status busy';
      st.textContent = '正在测试…（会发一句「只回复两个字：可用」）';
      const r = await window.CAI.test();
      if (r.ok) {
        st.className = 'ai-status ok';
        st.textContent = '✔ 通了：' + (r.model || $('aiModel').value) + ' 在 ' + ((r.latencyMs || 0) / 1000).toFixed(1) + ' 秒内回应。现在可以用「AI 改错」了。';
      } else {
        st.className = 'ai-status bad';
        st.textContent = '✖ ' + (r.error || '失败') + (r.detail ? '（' + String(r.detail).slice(0, 120) + '）' : '');
      }
    });

    $('btnAiClear').addEventListener('click', () => {
      const cur = window.CAI.load();
      cur.apiKey = '';
      window.CAI.save(cur);
      $('aiKey').value = '';
      updateAiStatus();
      toast('Key 已清除。离线功能不受影响。');
    });
  }

  function updateAiStatus() {
    const st = $('aiStatus');
    if (!st || !window.CAI) return;
    const cfg = window.CAI.load();
    if (window.CAI.isReady(cfg)) {
      st.className = 'ai-status ok';
      st.textContent = '✔ 已配置：' + (cfg.model || '未命名模型') + ' · 只存在本机浏览器';
    } else {
      st.className = 'ai-status';
      st.textContent = '尚未配置（AI 功能不可用，其它功能不受影响）';
    }
    renderAiIdle();
  }

  /* ═══════════════════════════ 可视化演示 ═══════════════════════════ */

  async function runViz() {
    const id = state.activeId;
    const viz = vizOf(id);
    if (!viz) {
      toast('这个知识点还没有配可视化演示。', 'err');
      return;
    }
    if (state.running) { toast('上一次还在跑，稍等一下。'); return; }
    if (!window.CViz) { toast('可视化模块没加载成功，刷新页面试试。', 'err'); return; }

    const target = String(viz.code || '').replace(/^\n+/, '');

    /* 要"代码—图形同步"，演示代码就必须待在编辑器里，
       所以先换过去。用户原来的内容不丢：明确存进草稿，点「还原」取回。 */
    if (editor.getValue().trim() !== target.trim()) {
      state.drafts[id] = editor.getValue();
      writeJSON(LS.drafts, state.drafts);
      editor.setValue(target);
      renderTabs();
      toast('已载入演示代码。你原来写的内容存在草稿里，点「还原」可取回。', '', 3600);
    }

    state.running = true;
    $('btnViz').disabled = true;
    $('btnRun').disabled = true;
    $('vizBadge').textContent = '…';
    switchPanelTab('viz');
    vizPlayer.reset();
    vizPlayer.showEmpty('正在编译并运行演示…');
    setRunState('编译演示…', 'busy');

    try {
      const res = await callRun(target, '');

      if (res.stage === 'compile') {
        vizPlayer.showEmpty('演示代码编译失败，看输出面板的报错。');
        pushTerm('<span class="t-err">✖ 演示编译失败</span>');
        pushTerm('<span class="t-err">' + esc((res.compilerOutput || '').trim()) + '</span>');
        switchPanelTab('out');
        setRunState('演示编译失败', 'bad');
        $('vizBadge').textContent = '0';
        return;
      }
      if (!res.ok) {
        vizPlayer.showEmpty(res.error || '运行失败');
        setRunState('演示失败', 'bad');
        $('vizBadge').textContent = '0';
        return;
      }

      const frames = res.traces || [];
      $('vizBadge').textContent = String(frames.length);

      vizPlayer.setFrames(frames, {
        title: viz.title,
        emptyText: '这段演示没有打出任何帧——检查一下代码里的 tr_end() 是不是被删了。'
      });

      if (frames.length) {
        setRunState('演示就绪 · ' + frames.length + ' 帧', 'ok');
        /* ?frame=N 可以停在指定帧，方便截图或反复看某一步 */
        const stopAt = new URLSearchParams(location.search).get('frame');
        if (stopAt != null && stopAt !== '') {
          vizPlayer.goto(Number(stopAt) || 0, true);
          vizPlayer.pause();
        } else {
          vizPlayer.play();
        }
      } else {
        setRunState('没有可演示的帧', 'bad');
        if (res.stderr) pushTerm('<span class="t-err">' + esc(res.stderr.trim()) + '</span>');
      }
    } catch (e) {
      vizPlayer.showEmpty('连不上本地服务：' + esc(e.message));
      setRunState('服务未启动', 'bad');
      $('vizBadge').textContent = '0';
    } finally {
      state.running = false;
      $('btnViz').disabled = false;
      $('btnRun').disabled = false;
    }
  }

  /* ═══════════════════════════ 面板 ═══════════════════════════ */

  const PANEL_TABS = ['out', 'diff', 'problems', 'ai', 'viz', 'stdin'];

  function switchPanelTab(name) {
    document.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.ptab === name));
    PANEL_TABS.forEach((k) => {
      const el = $('pv-' + k);
      if (el) el.classList.toggle('hidden', k !== name);
    });
    $('panel').classList.remove('collapsed');
    /* 演示要同时容下"图形 + 访问序列 + 工具栏"，200px 根本不够，第一次进来直接撑开。
       注意：这里必须走 setPanelHeight（改 CSS 变量），不能写内联 height——
       内联样式会盖掉变量，之后用户就再也拖不动面板了。用户自己调过高度则不插手。 */
    if (name === 'viz' && !panelUserAdjusted && $('panel').getBoundingClientRect().height < 440) {
      setPanelHeight(470);
    }
    if (name !== 'viz' && vizPlayer) vizPlayer.pause();   /* 切走了就别在后台空转 */
  }

  /* ═══════════════════════════ 搜索 ═══════════════════════════ */

  const SYNONYMS = {
    '快排': '快速排序', '冒泡': '冒泡排序', '堆排': '堆排序', '归并': '归并排序',
    '希尔': '希尔排序', '基数': '基数排序', '插入排序': '直接插入排序',
    '最短路': '最短路径', '生成树': '最小生成树', '拓扑': '拓扑排序',
    '哈希': '哈希表 散列表', '散列': '哈希表', '单链': '单链表',
    '双链': '双向链表', '循环队列': '循环队列 假溢出', 'kmp': 'KMP next',
    '复杂度': '时间复杂度 空间复杂度', '大o': '时间复杂度',
    '指针数组': '指针数组 数组指针', '野指针': '野指针 内存泄漏',
    '二叉树': '二叉树 遍历', '遍历': '遍历 先序 中序 后序'
  };

  function buildSearchIndex() {
    if (state.searchIndex) return state.searchIndex;
    const docs = [];
    const DEFS = window.DEFS || {};
    C.lessons.forEach((l) => {
      const d = DEFS[l.id];
      const text = stripHtml(l.body || '') + ' ' + (l.brief || '') + ' ' +
        (l.tips || []).join(' ') + ' ' + (l.traps || []).join(' ') + ' ' + (l.code || '') +
        (d ? ' ' + d.plain + ' ' + d.analogy : '');
      docs.push({ id: l.id, type: 'lesson', title: l.title, ch: chapterOf(l.ch).name, tags: (l.tags || []).join(' '), text: text });
    });
    C.exercises.forEach((e) => {
      const text = stripHtml(e.desc || '') + ' ' + (e.hints || []).join(' ') + ' ' + (e.solution || '');
      docs.push({ id: e.id, type: 'exercise', title: e.title, ch: '练习题', tags: '', text: text });
    });
    state.searchIndex = docs;
    return docs;
  }

  function stripHtml(html) {
    return String(html || '')
      .replace(/<pre[\s\S]*?<\/pre>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  }

  function queryTokens(q) {
    const tokens = new Set();
    const lower = q.toLowerCase();
    Object.keys(SYNONYMS).forEach((k) => {
      if (lower.includes(k)) SYNONYMS[k].split(/\s+/).forEach(x => tokens.add(x.toLowerCase()));
    });
    (q.match(/[A-Za-z_][A-Za-z0-9_]{1,}/g) || []).forEach(x => tokens.add(x.toLowerCase()));
    (q.match(/[\u4e00-\u9fa5]+/g) || []).forEach((seg) => {
      if (seg.length === 1) tokens.add(seg);
      for (let i = 0; i < seg.length - 1; i++) tokens.add(seg.slice(i, i + 2));
      if (seg.length >= 2) tokens.add(seg);
    });
    return [...tokens].filter(t => t.length > 0);
  }

  function search(q) {
    const docs = buildSearchIndex();
    const tokens = queryTokens(q);
    const results = [];
    const qLower = q.toLowerCase().trim();

    docs.forEach((d) => {
      let score = 0;
      const title = d.title.toLowerCase();
      const tags = (d.tags || '').toLowerCase();
      const text = d.text.toLowerCase();

      if (qLower && title.includes(qLower)) score += 60;
      if (qLower && tags.includes(qLower)) score += 30;
      tokens.forEach((t) => {
        if (title.includes(t)) score += 18;
        if (tags.includes(t)) score += 10;
        const c = countOccur(text, t);
        if (c) score += Math.min(12, 2 * c);
      });
      if (score > 0) results.push({ doc: d, score: score });
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, 12);
  }

  function countOccur(hay, needle) {
    if (!needle) return 0;
    let c = 0, i = 0;
    while ((i = hay.indexOf(needle, i)) !== -1) { c++; i += needle.length; if (c > 20) break; }
    return c;
  }

  function snippetOf(text, tokens) {
    const lower = text.toLowerCase();
    let pos = -1, hit = '';
    for (const t of tokens) {
      const p = lower.indexOf(t);
      if (p !== -1 && (pos === -1 || p < pos)) { pos = p; hit = t; }
    }
    if (pos === -1) return esc(text.slice(0, 130)) + '…';
    const start = Math.max(0, pos - 45);
    const end = Math.min(text.length, pos + 110);
    let out = esc((start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : ''));
    tokens.slice(0, 6).forEach((t) => {
      if (!t) return;
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      out = out.replace(re, m => '<mark>' + m + '</mark>');
    });
    return out;
  }

  function renderSearchResults(q) {
    const box = $('searchResults');
    if (!q.trim()) { box.innerHTML = ''; return; }
    const res = search(q);
    if (!res.length) {
      box.innerHTML = '<div class="sr-empty">本地知识库里没找到「' + esc(q) + '」。<br>试试更短的关键词，比如「快排」「指针」「BFS」「next 数组」。<br>（这是纯本地检索，没有联网大模型兜底，所以搜不到就是真没写。）</div>' +
        aiSearchBlock(q, 0);
      const ask0 = $('srAskAi');
      if (ask0) ask0.addEventListener('click', () => runSearchAi(q, []));
      return;
    }
    const tokens = queryTokens(q);
    box.innerHTML = res.map((r, i) =>
      '<div class="sr-item" data-id="' + r.doc.id + '" data-type="' + r.doc.type + '">' +
      '<div class="sr-title"><span>' + (i === 0 ? '★ ' : '') + esc(r.doc.title) + '</span>' +
      '<span class="path">' + esc(r.doc.ch) + '</span></div>' +
      '<div class="sr-snippet">' + snippetOf(r.doc.text, tokens) + '</div>' +
      '</div>'
    ).join('');
    box.querySelectorAll('.sr-item').forEach(el => {
      el.addEventListener('click', () => open(el.dataset.type, el.dataset.id));
    });

    /* 本地检索只在"写过的东西"里找；真正的问题往往需要有人解释，这就是 AI 的入口 */
    box.insertAdjacentHTML('beforeend', aiSearchBlock(q, res.length));
    const ask = $('srAskAi');
    if (ask) ask.addEventListener('click', () => runSearchAi(q, res));
  }

  function aiSearchBlock(q, n) {
    const ready = aiReady();
    return '<div class="sr-ai">' +
      '<div class="sr-ai-h">' + (n ? '这些没回答你的问题？' : '本地库里没有直接相关的条目') + '</div>' +
      '<button class="btn' + (ready ? ' ai' : '') + '" id="srAskAi">' +
      (ready ? '问 AI：' : '配置 AI 后可以直接问：') + esc(q.slice(0, 44)) + '</button>' +
      '<div class="sr-ai-tip">' + (ready
        ? '会把这个问题和上面命中的片段一起发给你自己配置的模型。'
        : 'AI 是可选功能，不配置也能用本地检索。') + '</div></div>';
  }

  async function runSearchAi(q, res) {
    if (!aiReady()) {
      showView('settings');
      toast('先到设置里填 API Key（这一步可以不填，本地检索照常可用）。', '', 4600);
      return;
    }
    const box = $('searchResults');
    const snips = (res || []).slice(0, 3)
      .map(r => '【' + r.doc.title + '】' + r.doc.text.slice(0, 600)).join('\n\n');
    box.innerHTML = '<div class="ai-loading"><span class="ai-spin"></span>' +
      '<div><b>正在问 ' + esc(aiEngineLabel()) + '…</b>' +
      '<div class="ai-loading-tip">问题 + 命中的本地片段，一共几百字。</div></div></div>';

    const messages = [
      {
        role: 'system',
        content: '你是 C 语言与数据结构助教。学生用中文提问，直接回答：先一句话结论，再给最多 5 条要点；' +
          '需要时给 10 行以内的 C 代码。不要客套，不要重复问题。'
      },
      {
        role: 'user',
        content: '问题：' + q + (snips ? '\n\n本地知识库里可能相关的片段（不完整、可能有偏差，仅供参考）：\n' + snips : '')
      }
    ];

    const r = await window.CAI.chat(messages, aiCfg());
    if (!r.ok) {
      box.innerHTML = '<div class="ai-error"><div class="ai-error-h">没成功：' + esc(r.error || '未知错误') + '</div>' +
        '<div class="ai-error-act"><button class="btn" id="srRetry">重试</button>' +
        '<button class="btn ghost" id="srBack">回到检索结果</button></div></div>';
      $('srRetry').addEventListener('click', () => runSearchAi(q, res));
      $('srBack').addEventListener('click', () => renderSearchResults(q));
      return;
    }
    box.innerHTML = '<div class="ai-answer-head"><span class="ai-dot"></span><b>' +
      esc(r.model || aiCfg().model) + '</b>' +
      '<span class="ai-head-act"><button class="btn ghost" id="srBack">回到检索结果</button></span></div>' +
      '<div class="ai-md">' + window.CAI.render(r.content) + '</div>' +
      '<div class="ai-foot">回答由模型生成，可能会错。要验证就把它说的代码粘到编辑器里跑一遍。</div>';
    $('srBack').addEventListener('click', () => renderSearchResults(q));
  }

  function buildSearchSuggest() {
    const samples = ['快速排序怎么分区', '链表和顺序表有什么区别', 'KMP 的 next 数组怎么求', '指针和数组的区别', '时间复杂度怎么算', 'Dijkstra 算法过程', '循环队列为什么假溢出', '结构体内存对齐'];
    $('qaSuggest').innerHTML = samples.map(s => '<button class="chip">' + esc(s) + '</button>').join('');
    $('qaSuggest').querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', () => {
        $('searchInput').value = b.textContent;
        renderSearchResults(b.textContent);
      });
    });
  }

  /* ═══════════════════════════ 进度 ═══════════════════════════ */

  function renderProgress() {
    const total = totalCount();
    const done = totalDone();
    let html = '<div class="pg-total">已完成 <b>' + done + '</b> / ' + total + ' 个条目<br>' +
      '知识点 ' + Object.keys(state.progress.lessons).length + '/' + C.lessons.length +
      ' · 练习 ' + Object.keys(state.progress.exercises).length + '/' + C.exercises.length + '</div>';

    /* 零基础路线：把 62 个知识点排成 5 站，顺序就是前置依赖 */
    const path = window.LEARNING_PATH || [];
    const order = window.PATH_ORDER || [];
    if (path.length && order.length) {
      const doneInPath = order.filter(id => state.progress.lessons[id]).length;
      const nextId = order.find(id => !state.progress.lessons[id] && ITEMS[id]);
      html += '<div class="path-head">' +
        '<span class="path-h">零基础路线</span>' +
        '<span class="path-p">' + doneInPath + ' / ' + order.length + ' 站</span>' +
        '</div>';
      if (nextId) {
        html += '<button class="path-next" id="pathNext">继续学：' + esc(ITEMS[nextId].data.title) + '<span>→</span></button>';
      } else {
        html += '<div class="path-done">✔ 路线全部走完了。回头把练习题刷一遍吧。</div>';
      }
      path.forEach((st) => {
        const d = st.ids.filter(id => state.progress.lessons[id]).length;
        const pct = Math.round(d / st.ids.length * 100);
        html += '<div class="path-stage">' +
          '<div class="path-st-h"><b>' + esc(st.name) + '</b><span>' + d + '/' + st.ids.length + '</span></div>' +
          '<div class="path-st-d">' + esc(st.desc) + '</div>' +
          '<div class="pg-bar"><i style="width:' + pct + '%"></i></div></div>';
      });
      html += '<div class="pg-sep"></div>';
    }

    C.chapters.forEach((ch) => {
      if (ch.id === 'ex') return;
      const ls = lessonsOf(ch.id);
      if (!ls.length) return;
      const d = ls.filter(l => state.progress.lessons[l.id]).length;
      const pct = Math.round(d / ls.length * 100);
      html += '<div class="pg-row"><div class="lbl"><span>' + esc(ch.name) + '</span><b>' + pct + '%</b></div>' +
        '<div class="pg-bar"><i style="width:' + pct + '%"></i></div></div>';
    });
    $('progressBody').innerHTML = html;
    const pn = $('pathNext');
    if (pn) pn.addEventListener('click', () => {
      const id = (window.PATH_ORDER || []).find(x => !state.progress.lessons[x] && ITEMS[x]);
      if (id) open('lesson', id);
    });
    $('sbProgress').textContent = '进度 ' + done + '/' + total;
  }

  /* ═══════════════════════════ 环境自检 ═══════════════════════════ */

  async function renderEnv() {
    const box = $('envBody');
    if (!box) return;
    box.innerHTML = '<div class="env-loading"><span class="ai-spin"></span>正在检测…</div>';

    let health = null;
    try {
      health = await (await fetch('/api/health')).json();
      if (health.token) window.CLEARN_TOKEN = health.token;
      state.gcc = health;
    } catch (e) { /* 服务没起 */ }

    const rows = [];

    rows.push({
      name: '本地服务',
      ok: !!(health && health.ok),
      detail: health ? ('已连通 · 端口 ' + (health.port || '—')) : '连不上 /api/health（页面是从本地服务打开的吗？）',
      fix: health ? '' : '双击项目里的「启动.bat」，或在项目目录执行：node server.js'
    });

    const nodeRaw = health ? String(health.node || '') : '';
    const nodeMajor = Number(nodeRaw.replace(/^v/, '').split('.')[0]) || 0;
    rows.push({
      name: 'Node 运行时',
      ok: nodeMajor >= 18,
      detail: nodeRaw ? (nodeRaw + (nodeMajor >= 18 ? '（要求 ≥ 18）' : '（太旧，建议升级到 20 LTS）')) : '不知道（服务没连上）',
      fix: nodeMajor >= 18 ? '' : 'winget install --id OpenJS.NodeJS.LTS -e'
    });

    rows.push({
      name: 'gcc 编译器',
      ok: !!(health && health.gcc),
      detail: health && health.gcc ? String(health.version || health.gcc).slice(0, 72) : '没找到 gcc.exe',
      fix: health && health.gcc ? '' : 'winget install --id BrechtSanders.WinLibs.POSIX.UCRT -e',
      extra: health && health.gcc ? '' : '装完关掉黑窗口重开一次，让 PATH 生效。也可以手动指定路径（设置 → 编译器）。'
    });

    let sc = null;
    if (health && health.gcc) sc = await apiPost('/api/selfcheck', {});
    rows.push({
      name: '编译 + 运行实测',
      ok: !!(sc && sc.ok),
      detail: sc ? (sc.ok
        ? ('通过：编译 ' + sc.compileMs + ' ms · 运行 ' + sc.runMs + ' ms')
        : (sc.error || '失败')) : '跳过（先把 gcc 装上）',
      fix: (sc && sc.ok) ? '' : '连一个最小程序都编不过，通常是 MinGW 装坏、缺运行库，或生成的 exe 被安全软件拦了。',
      raw: (sc && !sc.ok) ? (sc.compilerOutput || sc.stderr || '') : ''
    });

    let storageOk = false;
    try {
      localStorage.setItem('cls.__probe', '1');
      localStorage.removeItem('cls.__probe');
      storageOk = true;
    } catch (e) { storageOk = false; }
    rows.push({
      name: '浏览器本地存储',
      ok: storageOk,
      detail: storageOk ? '可用（草稿、进度、API Key 都存在这一格里）' : '不可用（无痕模式或站点数据被禁）',
      fix: storageOk ? '' : '关掉无痕模式，或允许本页保存站点数据'
    });

    rows.push({
      name: 'AI 辅助改错',
      optional: true,
      ok: aiReady() ? true : null,
      detail: aiReady() ? (aiEngineLabel() + ' · 已就绪') : '未配置（可选，不影响任何离线功能）',
      fix: ''
    });

    const required = rows.filter(r => !r.optional);
    const allOk = required.every(r => r.ok);
    const bad = required.filter(r => !r.ok).length;

    box.innerHTML = '<div class="env-sum ' + (allOk ? 'ok' : 'bad') + '">' +
      (allOk ? '✔ 环境齐全，代码可以真编译真运行' : '✖ 有 ' + bad + ' 项没过，按下面的命令修一下') +
      '</div>' +
      rows.map((r) => {
        const cls = r.optional ? (r.ok ? 'ok' : 'skip') : (r.ok ? 'ok' : 'bad');
        const ico = r.optional ? (r.ok ? '✓' : '·') : (r.ok ? '✓' : '✗');
        return '<div class="env-row ' + cls + '">' +
          '<span class="env-ico">' + ico + '</span>' +
          '<div class="env-main">' +
          '<div class="env-name">' + esc(r.name) +
          (r.optional ? '<span class="env-tag">可选</span>' : '') + '</div>' +
          '<div class="env-detail">' + esc(r.detail) + '</div>' +
          (r.fix ? '<div class="env-fix"><span>修复</span><code>' + esc(r.fix) + '</code>' +
            '<button class="env-copy" data-copy="' + esc(r.fix) + '">复制</button></div>' : '') +
          (r.extra ? '<div class="env-extra">' + esc(r.extra) + '</div>' : '') +
          (r.raw ? '<pre class="env-raw">' + esc(String(r.raw).slice(0, 600)) + '</pre>' : '') +
          '</div></div>';
      }).join('') +
      '<div class="env-foot">这一页查的是"这台机器到底能不能跑"，所以它会真的编译并运行一个最小程序，' +
      '不是只看 gcc --version。改完环境后点右上角刷新图标重测。</div>';

    box.querySelectorAll('.env-copy').forEach(btn => btn.addEventListener('click', () => {
      copyText(btn.dataset.copy);
      toast('命令已复制，粘到 PowerShell 里执行', 'ok', 2200);
    }));
  }

  function updateStatus() {
    $('sbProgress').textContent = '进度 ' + totalDone() + '/' + totalCount();
  }

  /* ═══════════════════════════ 设置 ═══════════════════════════ */

  function applySettings() {
    document.documentElement.style.setProperty('--code-size', state.settings.fontSize + 'px');
    document.documentElement.style.setProperty('--code-lh', state.settings.lineHeight + 'px');
    $('setFontSize').value = state.settings.fontSize;
    $('setFontSizeVal').textContent = state.settings.fontSize;
    $('setLineHeight').value = String(state.settings.lineHeight);
    $('setLessonPanel').value = state.settings.lessonPanel;
    $('lessonPanel').classList.toggle('hidden', state.settings.lessonPanel === 'hidden');
    if (editor) { editor.measure(); editor.refresh(); }
    writeJSON(LS.settings, state.settings);
  }

  /* ═══════════════════════════ 事件绑定 ═══════════════════════════ */

  function bindEvents() {
    // 活动栏
    document.querySelectorAll('.act-btn[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        document.querySelectorAll('.act-btn[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
        const target = $('view-' + v);
        if (target) target.classList.remove('hidden');
        $('sidebar').classList.remove('collapsed');
        if (v === 'search') setTimeout(() => $('searchInput').focus(), 30);
        if (v === 'env') renderEnv();
        if (v === 'progress') renderProgress();
      });
    });

    // 菜单
    const menuConfig = {
      file: [
        { label: '打开第一个知识点', action: () => open('lesson', C.lessons[0].id) },
        { label: '打开第一道练习', action: () => C.exercises[0] && open('exercise', C.exercises[0].id) },
        { label: '清空输出', action: () => { term.innerHTML = ''; } },
        { label: '查看学习进度', action: () => showView('progress') }
      ],
      edit: [
        { label: '切换注释  Ctrl+/', action: () => editor.toggleComment() },
        { label: '缩进  Tab', action: () => editor.indent() },
        { label: '减少缩进  Shift+Tab', action: () => editor.outdent() },
        { label: '还原当前代码', action: () => resetCode() }
      ],
      view: [
        { label: '显示/隐藏教程面板  Ctrl+Alt+L', action: () => toggleLessonPanel() },
        { label: '显示/隐藏底部面板  Ctrl+`', action: () => togglePanel() },
        { label: '输出区高度：拖面板上沿，双击复位', action: () => setPanelHeight(PANEL_DEFAULT_H, true) },
        { label: '显示/隐藏侧边栏  Ctrl+B', action: () => $('sidebar').classList.toggle('collapsed') },
        { label: '大纲', action: () => showView('explorer') },
        { label: '学习进度与路线', action: () => { showView('progress'); renderProgress(); } },
        { label: '环境自检', action: () => { showView('env'); renderEnv(); } },
        { label: '设置', action: () => showView('settings') }
      ],
      run: [
        { label: '运行代码  Ctrl+Enter', action: () => runCode() },
        { label: '只编译  Ctrl+F7', action: () => compileOnly() },
        { label: '检查答案', action: () => checkAnswer() },
        { label: '可视化演示  Ctrl+Shift+V', action: () => runViz() },
        { label: 'AI 分析这次的问题  Ctrl+Shift+A', action: () => runAi('diagnose') },
        { label: '切换标准输入面板', action: () => switchPanelTab('stdin') }
      ],
      help: [
        { label: '使用说明 / 快捷键', action: () => showHelp() },
        { label: '学习路线建议', action: () => open('lesson', C.lessons[0].id) }
      ]
    };

    document.querySelectorAll('.menu-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenus();
        const items = menuConfig[btn.dataset.menu] || [];
        const dd = document.createElement('div');
        dd.className = 'dropdown';
        dd.innerHTML = items.map((it, i) => '<div class="dd-item" data-i="' + i + '">' + esc(it.label) + '</div>').join('');
        document.body.appendChild(dd);
        const r = btn.getBoundingClientRect();
        dd.style.left = Math.min(r.left, window.innerWidth - 280) + 'px';
        dd.style.top = r.bottom + 'px';
        dd.querySelectorAll('.dd-item').forEach(el => {
          el.addEventListener('click', () => {
            const it = items[Number(el.dataset.i)];
            closeMenus();
            if (it && it.action) it.action();
          });
        });
      });
    });
    document.addEventListener('click', closeMenus);

    function closeMenus() {
      document.querySelectorAll('.dropdown').forEach(d => d.remove());
    }

    // 工具栏
    $('btnRun').addEventListener('click', runCode);
    $('btnCompile').addEventListener('click', compileOnly);
    $('btnViz').addEventListener('click', runViz);
    $('btnCheck').addEventListener('click', checkAnswer);
    $('btnAi').addEventListener('click', () => runAi('diagnose'));
    $('btnLoadSample').addEventListener('click', () => {
      const item = currentItem();
      if (item && item.data.code != null) {
        editor.setValue(item.data.code);
        state.drafts[state.activeId] = item.data.code;
        writeJSON(LS.drafts, state.drafts);
        renderTabs();
        toast('示例代码已重置到最原始的样子。');
      }
    });
    $('btnResetCode').addEventListener('click', resetCode);
    $('btnHistory').addEventListener('click', openHistory);
    $('btnEnvRerun').addEventListener('click', renderEnv);
    $('btnDone').addEventListener('click', () => {
      const item = currentItem();
      if (!item) return;
      if (item.type === 'exercise') {
        if (!item.data.solution) { toast('这道题没有参考答案。'); return; }
        modal('看答案', '<p>确定要看参考答案吗？建议先自己写十分钟，卡住了再看，效果差好几倍。</p>' +
          '<p><button class="btn run" id="confirmAns">看答案</button></p>');
        $('confirmAns').addEventListener('click', () => {
          editor.setValue(item.data.solution);
          state.drafts[item.data.id] = item.data.solution;
          writeJSON(LS.drafts, state.drafts);
          renderTabs();
          closeModal();
          toast('答案已载入编辑器。看完关掉，自己默写一遍。', 'ok', 3600);
        });
        return;
      }
      state.progress.lessons[item.data.id] = true;
      writeJSON(LS.progress, state.progress);
      buildTree($('treeFilter').value);
      renderProgress();
      updateStatus();
      renderLessonPanel(item.data, 'lesson');
      toast('已标记为学完 ✔', 'ok');
    });
    $('btnNext').addEventListener('click', nextLesson);

    // 面板 tab
    document.querySelectorAll('.ptab').forEach(b => {
      b.addEventListener('click', () => switchPanelTab(b.dataset.ptab));
    });
    $('btnClear').addEventListener('click', () => { term.innerHTML = ''; });
    $('btnTogglePanel').addEventListener('click', () => togglePanel());

    // 标准输入
    $('stdinInput').addEventListener('input', () => {
      localStorage.setItem(LS.stdin, $('stdinInput').value);
    });

    // 搜索
    $('searchBtn').addEventListener('click', () => renderSearchResults($('searchInput').value));
    $('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') renderSearchResults($('searchInput').value);
    });
    $('searchInput').addEventListener('input', (e) => {
      clearTimeout(state._searchTimer);
      state._searchTimer = setTimeout(() => renderSearchResults(e.target.value), 220);
    });

    // 树筛选
    $('treeFilter').addEventListener('input', (e) => buildTree(e.target.value));

    // 展开 / 折叠
    $('btnExpandAll').addEventListener('click', () => {
      state.collapsedChapters = {};
      buildTree($('treeFilter').value);
    });
    $('btnCollapseAll').addEventListener('click', () => {
      C.chapters.forEach(c => { state.collapsedChapters[c.id] = true; });
      buildTree($('treeFilter').value);
    });

    // 设置
    $('setFontSize').addEventListener('input', (e) => {
      state.settings.fontSize = Number(e.target.value);
      $('setFontSizeVal').textContent = e.target.value;
      applySettings();
    });
    $('setLineHeight').addEventListener('change', (e) => {
      state.settings.lineHeight = Number(e.target.value);
      applySettings();
    });
    $('setLessonPanel').addEventListener('change', (e) => {
      state.settings.lessonPanel = e.target.value;
      applySettings();
    });
    $('btnRecheckGcc').addEventListener('click', () => {
      $('gccPath').textContent = '检测中…';
      apiPost('/api/compiler', {})
        .then(() => checkHealth())
        .catch(() => { $('gccPath').textContent = '未连接本地服务'; });
    });
    $('btnResetProgress').addEventListener('click', () => {
      modal('确认清空', '<p>将清空<strong>学习进度</strong>和<strong>所有草稿代码</strong>，不可恢复。</p>' +
        '<p>确定的话点下面的按钮。</p><p><button class="btn danger" id="confirmReset">我确定，清空</button></p>');
      $('confirmReset').addEventListener('click', () => {
        localStorage.removeItem(LS.drafts);
        localStorage.removeItem(LS.progress);
        localStorage.removeItem(LS.last);
        location.reload();
      });
    });

    // 弹窗
    $('modalClose').addEventListener('click', closeModal);
    $('modalMask').addEventListener('click', (e) => { if (e.target.id === 'modalMask') closeModal(); });
    $('btnHelp').addEventListener('click', showHelp);
    $('btnGcc').addEventListener('click', () => showView('settings'));
    $('sbBranch').addEventListener('click', () => showView('explorer'));
    $('sbBell').addEventListener('click', showHelp);

    // 全局快捷键
    document.addEventListener('keydown', (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === 'Enter') { e.preventDefault(); runCode(); return; }
      if (meta && e.key === 'F7') { e.preventDefault(); compileOnly(); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'v') { e.preventDefault(); runViz(); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'a') { e.preventDefault(); runAi('diagnose'); return; }
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault(); saveDraftNow(); toast('草稿已保存（自动）', 'ok', 1200); return;
      }
      if (meta && e.key === '`') { e.preventDefault(); togglePanel(); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'e') { e.preventDefault(); showView('explorer'); return; }
      if (meta && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); showView('search'); $('searchInput').focus(); return; }
      if (meta && e.key.toLowerCase() === 'b') { e.preventDefault(); $('sidebar').classList.toggle('collapsed'); return; }
      if (meta && e.altKey && e.key.toLowerCase() === 'l') { e.preventDefault(); toggleLessonPanel(); return; }
      if (e.key === 'Escape') closeModal();
    });

    // 拖拽改变宽度
    makeResizer($('resizerSide'), 'x', (dx) => {
      const sb = $('sidebar');
      const w = Math.max(180, Math.min(460, sb.getBoundingClientRect().width + dx));
      sb.style.flex = '0 0 ' + w + 'px';
      sb.style.width = w + 'px';
    });
    makeResizer($('resizerLesson'), 'x-rev', (dx) => {
      const lp = $('lessonPanel');
      const w = Math.max(300, Math.min(window.innerWidth * 0.62, lp.getBoundingClientRect().width - dx));
      lp.style.flex = '0 0 ' + w + 'px';
      lp.style.width = w + 'px';
      editor.measure(); editor.refresh();
    });

    // 拖拽改变底部面板高度（往上拖变高）
    const panelEl = $('panel');
    let panelWasCollapsed = false;
    $('resizerPanel').addEventListener('mousedown', () => {
      panelWasCollapsed = panelEl.classList.contains('collapsed');
      if (panelWasCollapsed) panelEl.classList.remove('collapsed');
    });
    makeResizer($('resizerPanel'), 'y', (dy) => {
      if (panelWasCollapsed) return;   // 折叠状态下这一按只负责展开，不做缩放
      setPanelHeight(panelEl.getBoundingClientRect().height - dy);
    }, () => {
      panelWasCollapsed = false;
      panelUserAdjusted = true;
      writeJSON(LS.panelH, clampPanelH(panelEl.getBoundingClientRect().height));
    });
    // 双击复位
    $('resizerPanel').addEventListener('dblclick', () => {
      panelUserAdjusted = true;
      setPanelHeight(PANEL_DEFAULT_H, true);
    });

    // 窗口变矮时把面板高度收回来，别把编辑器挤没了
    window.addEventListener('resize', () => {
      const cur = parseInt(document.documentElement.style.getPropertyValue('--panel-h'), 10) || PANEL_DEFAULT_H;
      setPanelHeight(cur);
    });
  }

  /* dir 以 y 开头就是上下拖，其余按左右拖处理；onEnd 在松手时调用 */
  function makeResizer(el, dir, onMove, onEnd) {
    const isY = dir.charAt(0) === 'y';
    let dragging = false, last = 0;
    el.addEventListener('mousedown', (e) => {
      dragging = true; last = isY ? e.clientY : e.clientX;
      el.classList.add('dragging');
      document.body.style.cursor = isY ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const cur = isY ? e.clientY : e.clientX;
      const d = cur - last;
      if (!d) return;
      last = cur;
      onMove(d);
    });
    document.addEventListener('mouseup', () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (onEnd) onEnd();
    });
  }

  function showView(name) {
    document.querySelectorAll('.act-btn[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
    document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
    const el = $('view-' + name);
    if (el) el.classList.remove('hidden');
    $('sidebar').classList.remove('collapsed');
    if (name === 'search') $('searchInput').focus();
  }

  function toggleLessonPanel() {
    state.settings.lessonPanel = state.settings.lessonPanel === 'hidden' ? 'right' : 'hidden';
    applySettings();
    editor.measure(); editor.refresh();
  }

  function resetCode() {
    const item = currentItem();
    if (!item) return;
    const base = item.data.code != null ? item.data.code : (item.data.starter || '');
    editor.setValue(base);
    state.drafts[state.activeId] = base;
    writeJSON(LS.drafts, state.drafts);
    renderTabs();
    toast('已还原为初始代码。');
  }

  function showHelp() {
    modal('使用说明', [
      '<h3>这是什么</h3>',
      '<p>一个跑在本机的 C 语言 + 数据结构学习台。左边选知识点，中间写代码，右边读讲解（每节开头都有一段「白话速懂」），下面是真编译真运行的输出。</p>',
      '<h3>核心用法</h3>',
      '<ul>',
      '<li>点左边大纲 → 右边先看「白话速懂」定义卡 → 中间改代码 → <code>Ctrl+Enter</code> 运行。</li>',
      '<li>代码是<b>真的用本机 gcc 编译并执行</b>的，不是假输出。</li>',
      '<li>练习题的顺序：先「编译」（<code>Ctrl+F7</code>）查语法，再「运行」，「对比」面板会逐行逐字符标出和期望的差异。</li>',
      '<li>出错时「问题」面板会把 gcc 的英文报错翻译成人话，给出常见原因和最小改法。</li>',
      '<li>实在卡住不动，可以在「设置」里填自己的 API Key，让 AI 针对这次报错讲一遍。<b>不填也完全能用</b>。</li>',
      '<li>程序里用到 <code>scanf</code> 时，在下面「标准输入」面板填输入内容。</li>',
      '</ul>',
      '<h3>快捷键</h3>',
      '<table class="m-table">',
      '<tr><th>按键</th><th>作用</th></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>编译并运行</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>F7</kbd></td><td>只编译不运行</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>A</kbd></td><td>AI 分析这次的问题（需配置 API）</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd></td><td>可视化演示</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>保存草稿（每 0.5 秒也会自动存）</td></tr>',
      '<tr><td><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd></td><td>缩进 / 反缩进（支持多行）</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>/</kbd></td><td>注释 / 取消注释</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>`</kbd></td><td>收起/展开底部面板</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>F</kbd></td><td>搜索</td></tr>',
      '<tr><td><kbd>Ctrl</kbd>+<kbd>B</kbd></td><td>收起/展开侧边栏</td></tr>',
      '</table>',
      '<h3>不想用了怎么关</h3>',
      '<p>关掉运行 <code>node server.js</code> 的那个黑窗口就行，或者在里面按 <kbd>Ctrl</kbd>+<kbd>C</kbd>。</p>'
    ].join(''));
  }

  /* ═══════════════════════════ 启动 ═══════════════════════════ */

  window.addEventListener('DOMContentLoaded', init);
})();
