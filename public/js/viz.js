/* ============================================================
   viz.js —— 数据结构可视化播放器
   ------------------------------------------------------------
   吃的是服务端返回的 frames（C 程序埋点打出的快照），吐的是动画。

   设计要点：
   1) 帧是"完整快照"不是差量 —— 所以任意跳转、往前拖、重放都是 O(1)，
      不用维护状态机，也不怕用户乱点。
   2) 渲染器按视图类型自动选择：arr → 格子、lnode → 链表、tnode → 二叉树、
      vnode/vedge → 图。一帧里可以同时有多种视图。
   3) 每渲染一帧都会把行号回调出去，让主编辑器高亮对应那行代码，
      这就是"代码—状态—图形"三者同步的关键。
   ============================================================ */
(function (global) {
  'use strict';

  /* 播放速度档位：数字越大越快 */
  var SPEEDS = [
    { label: '0.5×', ms: 1100 },
    { label: '1×',   ms: 620 },
    { label: '1.5×', ms: 420 },
    { label: '2×',   ms: 280 },
    { label: '4×',   ms: 130 }
  ];

  /* 标记 kind → 中文说明（鼠标悬停提示用） */
  var KIND_TEXT = {
    cmp: '正在比较', swap: '正在交换', cur: '当前操作', done: '已完成',
    hit: '命中/访问过', path: '在路径上', del: '待删除', new: '新插入'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ============================================================
     视图渲染
     ============================================================ */

  /* ---------- 数组 / 顺序表 ---------- */
  function renderArray(view, flagMap) {
    var v = Array.isArray(view.v) ? view.v : [];
    var cap = (typeof view.cap === 'number' && view.cap > v.length) ? view.cap : v.length;
    if (cap > 48) cap = 48;                        /* 槽位太多不画了，免得糊成一团 */
    var html = '<div class="vz-block">';
    html += '<div class="vz-blabel">' + esc(view.name || 'arr');
    if (typeof view.len === 'number') {
      html += ' <span class="vz-dim">length=' + view.len + (view.cap != null ? ' · capacity=' + view.cap : '') + '</span>';
    } else {
      html += ' <span class="vz-dim">n=' + v.length + '</span>';
    }
    html += '</div><div class="vz-cells">';
    var i;
    for (i = 0; i < v.length; i++) {
      var f = flagMap[i] || '';
      html += '<div class="vz-cell' + (f ? ' f-' + esc(f) : '') + '"' +
        (f ? ' title="' + esc(KIND_TEXT[f] || f) + '"' : '') + '>' +
        '<b>' + esc(v[i]) + '</b><i>' + i + '</i></div>';
    }
    for (i = v.length; i < cap; i++) {
      html += '<div class="vz-cell vz-empty"><b>·</b><i>' + i + '</i></div>';
    }
    html += '</div></div>';
    return html;
  }

  /* ---------- 字符串数组 ---------- */
  /* 带上 hi 字段的视图只认自己的 hi（-1 = 谁都不亮），不吃全局 flagMap ——
     一帧里同时放主串和模式串时，全靠它俩各亮各的 */
  function renderStrs(view, flagMap) {
    var v = Array.isArray(view.v) ? view.v : [];
    var hasOwn = (typeof view.hi === 'number');
    var own = hasOwn ? view.hi : -1;
    var html = '<div class="vz-block"><div class="vz-blabel">' + esc(view.name || 's') +
      ' <span class="vz-dim">n=' + v.length + '</span></div><div class="vz-cells">';
    for (var i = 0; i < v.length; i++) {
      var f = hasOwn ? (i === own ? 'cur' : '') : (flagMap[i] || '');
      html += '<div class="vz-cell vz-wide' + (f ? ' f-' + esc(f) : '') + '">' +
        '<b>' + esc(v[i]) + '</b><i>' + i + '</i></div>';
    }
    html += '</div></div>';
    return html;
  }

  /* ---------- 内存快照（带地址）---------- */
  /* 和数组的区别就一个：每格上面多一行真实地址。
     讲指针、讲"数组为什么能用下标直接跳"、讲 malloc 拿到的块在哪，全靠这一行。 */
  function renderMem(view, flagMap, targets) {
    var v = Array.isArray(view.v) ? view.v : [];
    var addr = Array.isArray(view.addr) ? view.addr : [];
    var sz = view.sz || 4;
    var ch = !!view.ch;
    targets = targets || {};

    var html = '<div class="vz-block"><div class="vz-blabel">' + esc(view.name || 'mem');
    html += ' <span class="vz-dim">' + (ch ? 'char' : 'int') + '[' + v.length + '] · 每格 ' + sz + ' 字节';
    if (v.length > 1) {
      html += ' · 相邻差 ' + sz;                    /* 顺手把"步长"点出来 */
    }
    html += '</span></div><div class="vz-cells vz-mem">';

    for (var i = 0; i < v.length; i++) {
      var f = flagMap[i] || '';
      var a = String(addr[i] == null ? '' : addr[i]);
      /* 只显示低 6 位：高位每次运行都在变，看多了纯属干扰 */
      var shown = a ? '0x' + (a.length > 6 ? a.slice(-6) : a) : '';
      var tg = targets[i] || '';
      html += '<div class="vz-cell vz-mcell' + (f ? ' f-' + esc(f) : '') + (tg ? ' vz-pointed' : '') + '"' +
        (f ? ' title="' + esc(KIND_TEXT[f] || f) + '"' : '') + '>' +
        (tg ? '<span class="vz-tgt" title="' + esc(tg) + ' 指向这里">' + esc(tg) + ' ↓</span>' : '') +
        '<span class="vz-addr">' + esc(shown) + '</span>' +
        '<b>' + esc(ch ? "'" + v[i] + "'" : v[i]) + '</b>' +
        '<i>' + i + '</i></div>';
    }
    html += '</div></div>';
    return html;
  }

  /* ---------- 指针变量 ---------- */
  /* 画成一张小卡片：名字 = 地址 → 指向谁。
     目标格子会由 tr_mark 单独点亮，两边一对，比真的拉一根线还清楚。 */
  function renderPtr(ptrs) {
    if (!ptrs.length) return '';
    var html = '<div class="vz-block"><div class="vz-blabel">指针 <span class="vz-dim">' +
      ptrs.length + ' 个 · 存的是地址，不是值</span></div><div class="vz-ptrs">';

    ptrs.forEach(function (p, k) {
      var to = String(p.to == null ? '' : p.to);
      var a = String(p.addr == null ? '' : p.addr);
      var shown = a ? '0x' + (a.length > 6 ? a.slice(-6) : a) : '';
      var isNull = isNullPtr(p);
      if (k) html += '<span class="vz-ptr-sep"></span>';
      html += '<div class="vz-ptr' + (isNull ? ' is-null' : '') + '">' +
        '<span class="vz-ptr-name">' + esc(p.name || 'p') + '</span>' +
        '<span class="vz-ptr-eq">=</span>' +
        '<span class="vz-ptr-addr">' + esc(shown || '?') + '</span>' +
        '<span class="vz-ptr-arrow">→</span>' +
        '<span class="vz-ptr-to">' + esc(isNull ? 'NULL' : to) + '</span>' +
        '</div>';
    });

    html += '</div></div>';
    return html;
  }

  function isNullPtr(p) {
    var to = String(p.to == null ? '' : p.to);
    var a = String(p.addr == null ? '' : p.addr);
    return !to || /^null$/i.test(to) || /^0*$/.test(a);
  }

  /* 从 "a[2]" 这种描述里抠出下标，好让内存格知道自己正被谁指着 */
  function ptrTargets(ptrs) {
    var map = {};
    ptrs.forEach(function (p) {
      if (isNullPtr(p)) return;
      var m = /\[\s*(\d+)\s*\]/.exec(String(p.to || ''));
      if (!m) return;
      var i = Number(m[1]);
      map[i] = map[i] ? map[i] + ',' + (p.name || 'p') : (p.name || 'p');
    });
    return map;
  }

  /* ---------- 单链表 ---------- */
  function renderList(nodes, flagMap) {
    if (!nodes.length) return '';
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    /* 找头结点：没有被任何 next 指向的那个 */
    var pointed = {};
    nodes.forEach(function (n) { if (n.n != null && n.n >= 0) pointed[n.n] = 1; });
    var head = null;
    for (var i = 0; i < nodes.length; i++) {
      if (!pointed[nodes[i].id]) { head = nodes[i]; break; }
    }
    if (!head) head = nodes[0];                    /* 全是环或者只有一个节点 */

    /* 顺着 next 走，visited 防止链表有环时死循环 */
    var chain = [];
    var visited = {};
    var cur = head;
    while (cur && !visited[cur.id]) {
      visited[cur.id] = 1;
      chain.push(cur);
      cur = (cur.n != null && cur.n >= 0) ? byId[cur.n] : null;
    }
    var hasCycle = !!cur;

    var html = '<div class="vz-block"><div class="vz-blabel">链表 <span class="vz-dim">' +
      chain.length + ' 个结点' + (hasCycle ? ' · 有环' : '') + '</span></div><div class="vz-chain">';
    if (!chain.length) html += '<span class="vz-null">NULL（空表）</span>';
    for (var k = 0; k < chain.length; k++) {
      var nd = chain[k];
      var f = flagMap[nd.id] || '';
      if (k > 0) html += '<span class="vz-arrow">→</span>';
      html += '<div class="vz-node' + (f ? ' f-' + esc(f) : '') + '"' +
        (f ? ' title="' + esc(KIND_TEXT[f] || f) + '"' : '') + '>' +
        '<b>' + esc(nd.v) + '</b><i>#' + nd.id + '</i></div>';
    }
    if (chain.length) html += '<span class="vz-arrow">→</span><span class="vz-null">NULL</span>';
    html += '</div></div>';
    return html;
  }

  /* ---------- 二叉树 ---------- */
  function renderTree(nodes, flagMap) {
    if (!nodes.length) return '';
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    /* 根 = 不被任何 l/r 指向的节点 */
    var childOf = {};
    nodes.forEach(function (n) {
      if (n.l != null && n.l >= 0) childOf[n.l] = 1;
      if (n.r != null && n.r >= 0) childOf[n.r] = 1;
    });
    var root = null;
    for (var i = 0; i < nodes.length; i++) {
      if (!childOf[nodes[i].id]) { root = nodes[i]; break; }
    }
    if (!root) root = nodes[0];

    /* 中序遍历分配横坐标，深度作纵坐标 —— 教科书上最标准的画法 */
    var pos = {};
    var order = 0;
    var maxDepth = 0;
    var seen = {};
    (function walk(id, depth) {
      if (id == null || id < 0 || seen[id]) return;
      var nd = byId[id];
      if (!nd) return;
      seen[id] = 1;
      walk(nd.l, depth + 1);
      pos[id] = { x: order++, y: depth };
      if (depth > maxDepth) maxDepth = depth;
      walk(nd.r, depth + 1);
    })(root.id, 0);

    /* 没被遍历到的（比如断开的子树）丢到最后一层，至少别丢数据 */
    nodes.forEach(function (n) {
      if (!pos[n.id]) { pos[n.id] = { x: order++, y: maxDepth }; }
    });

    var gapX = 50, gapY = 44, R = 16, pad = 14;
    var W = Math.max(1, order) * gapX + pad * 2;
    var H = (maxDepth + 1) * gapY + pad * 2;

    /* 结点少的时候别让它撑满整个面板 —— 三个结点摊开一米宽，看着像丢了半棵树。
       宽度上限交给 CSS（.vz-block-svg svg 的 max-width），这样面板拖高时它还能按高度长大。 */

    var svg = '<div class="vz-block vz-block-svg"><div class="vz-blabel">二叉树 <span class="vz-dim">' +
      nodes.length + ' 个结点 · 高度 ' + (maxDepth + 1) + '</span></div>' +
      '<div class="vz-svgwrap"><svg viewBox="0 0 ' + W + ' ' + H +
      '" preserveAspectRatio="xMidYMid meet">';

    /* 先画边，再画节点，保证节点压在线上 */
    var u, c1, c2;
    nodes.forEach(function (n) {
      var p = pos[n.id];
      [n.l, n.r].forEach(function (cid) {
        if (cid == null || cid < 0) return;
        var cp = pos[cid];
        if (!cp) return;
        u = { x: pad + p.x * gapX + gapX / 2, y: pad + p.y * gapY + gapY / 2 };
        c1 = { x: pad + cp.x * gapX + gapX / 2, y: pad + cp.y * gapY + gapY / 2 };
        svg += '<line x1="' + u.x + '" y1="' + u.y + '" x2="' + c1.x + '" y2="' + c1.y + '" class="vz-edge"/>';
      });
    });

    nodes.forEach(function (n) {
      var p = pos[n.id];
      var cx = pad + p.x * gapX + gapX / 2;
      var cy = pad + p.y * gapY + gapY / 2;
      var f = flagMap[n.id] || '';
      svg += '<g class="vz-tn' + (f ? ' f-' + esc(f) : '') + '">' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '"/>' +
        '<text x="' + cx + '" y="' + (cy + 4.5) + '">' + esc(n.v) + '</text>' +
        (f ? '<title>' + esc(KIND_TEXT[f] || f) + '</title>' : '') +
        '</g>';
    });

    svg += '</svg></div></div>';
    return svg;
  }

  /* ---------- 图 ---------- */
  function renderGraph(nodes, edges, flagMap) {
    if (!nodes.length) return '';

    /* 没有坐标信息，就按顶点顺序排成一圈。
     * 用椭圆而不是正圆：面板是"宽而矮"的，正圆会把顶点挤到中间一小团。
     * viewBox 高固定在 230 左右、宽按顶点数撑开，缩放比才接近 1，节点才看得清。 */
    var n = nodes.length;
    var W = Math.max(540, n * 104);
    var H = 230;
    var cx0 = W / 2, cy0 = H / 2;
    var rx = W / 2 - 50;
    var ry = H / 2 - 40;
    var pos = {};
    nodes.forEach(function (v, i) {
      var a = -Math.PI / 2 + i * (2 * Math.PI / n);
      pos[v.id] = { x: cx0 + rx * Math.cos(a), y: cy0 + ry * Math.sin(a) };
    });

    var uid = 'vzarrow' + Math.random().toString(36).slice(2, 8);
    var svg = '<div class="vz-block vz-block-svg"><div class="vz-blabel">图 <span class="vz-dim">' +
      n + ' 个顶点 · ' + edges.length + ' 条边</span></div>' +
      '<div class="vz-svgwrap"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' +
      '<defs><marker id="' + uid + '" viewBox="0 0 10 10" refX="26" refY="5" ' +
      'markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="#6b7f8f"/></marker></defs>';

    edges.forEach(function (e) {
      var a = pos[e.u], b = pos[e.v];
      if (!a || !b) return;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      /* w 传 used 表示"这条边已经处理过了"：留着画，但淡下去，
         免得做拓扑排序时图越删越空，看到最后不知道原来长什么样 */
      var off = (e.w === 'used');
      svg += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y +
        '" class="vz-edge' + (off ? ' vz-edge-off' : '') + '" marker-end="url(#' + uid + ')"/>';
      if (e.w && !off) {
        svg += '<text x="' + (mx + 8) + '" y="' + (my - 6) + '" class="vz-w">' + esc(e.w) + '</text>';
      }
    });

    nodes.forEach(function (v) {
      var p = pos[v.id];
      var f = flagMap[v.id] || '';
      svg += '<g class="vz-vn' + (f ? ' f-' + esc(f) : '') + '">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="19"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 5) + '">' + esc(v.v) + '</text></g>';
    });

    svg += '</svg></div></div>';
    return svg;
  }

  /* ============================================================
     播放器
     ============================================================ */

  function Player(opts) {
    this.root = opts.root;
    this.onLine = opts.onLine || function () {};
    this.onEnd = opts.onEnd || function () {};

    this.frames = [];
    this.index = 0;
    this.timer = null;
    this.speed = 1;
    this.playing = false;
    this.rendered = -1;

    this.build();
  }

  Player.prototype.build = function () {
    var speeds = SPEEDS.map(function (s, i) {
      return '<option value="' + i + '"' + (i === 1 ? ' selected' : '') + '>' + s.label + '</option>';
    }).join('');

    this.root.innerHTML =
      '<div class="vz">' +
        '<div class="vz-bar">' +
          '<div class="vz-ctl">' +
            '<button class="vz-btn" data-act="first" title="回到第一步">⏮</button>' +
            '<button class="vz-btn" data-act="prev" title="上一步">◀</button>' +
            '<button class="vz-btn vz-play" data-act="play" title="播放 / 暂停（空格）">▶</button>' +
            '<button class="vz-btn" data-act="next" title="下一步">▶|</button>' +
            '<button class="vz-btn" data-act="last" title="跳到最后">⏭</button>' +
            '<span class="vz-count"><b data-el="idx">0</b>/<span data-el="total">0</span></span>' +
            '<span class="vz-sep"></span>' +
            '<select class="vz-speed" data-el="speed" title="播放速度">' + speeds + '</select>' +
          '</div>' +
          '<div class="vz-note" data-el="note"></div>' +
        '</div>' +
        '<div class="vz-stage" data-el="stage">' +
          '<div class="vz-empty">还没有数据。点上面的「演示」按钮跑一遍代码，这里就会动起来。</div>' +
        '</div>' +
        '<div class="vz-rail"><input type="range" data-el="rail" min="0" max="0" value="0" step="1"></div>' +
      '</div>';

    var q = function (sel) { return this.root.querySelector(sel); }.bind(this);
    this.el = {
      stage: q('[data-el="stage"]'),
      note: q('[data-el="note"]'),
      idx: q('[data-el="idx"]'),
      total: q('[data-el="total"]'),
      speed: q('[data-el="speed"]'),
      rail: q('[data-el="rail"]'),
      play: q('.vz-play')
    };

    var self = this;
    this.root.querySelectorAll('[data-act]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var act = btn.dataset.act;
        if (act === 'first') self.goto(0, true);
        else if (act === 'prev') self.step(-1);
        else if (act === 'next') self.step(1);
        else if (act === 'last') self.goto(self.frames.length - 1, true);
        else if (act === 'play') self.toggle();
      });
    });

    this.el.speed.addEventListener('change', function () {
      self.speed = Number(this.value) || 1;
      if (self.playing) { self.pause(); self.play(); }
    });

    this.el.rail.addEventListener('input', function () {
      self.pause();
      self.goto(Number(this.value), false);
    });

    /* 空格播放/暂停：只在鼠标落在播放器里才拦，免得抢了编辑器的空格 */
    this.root.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        self.toggle();
      }
    });
  };

  /* ------------------------------ 数据 ------------------------------ */

  Player.prototype.setFrames = function (frames, meta) {
    this.pause();
    this.frames = Array.isArray(frames) ? frames : [];
    this.meta = meta || {};
    this.index = 0;
    this.rendered = -1;

    this.el.total.textContent = this.frames.length;
    this.el.rail.max = String(Math.max(0, this.frames.length - 1));
    this.el.rail.value = '0';
    this.paintRail();

    if (!this.frames.length) {
      this.showEmpty(this.meta.emptyText ||
        '这段代码一次埋点都没打，所以没有可演的东西。想让它动起来，在关键操作后面加 tr_end()。');
      this.el.note.textContent = '';
      this.el.idx.textContent = '0';
      this.onLine(0);
      return;
    }
    this.goto(0, true);
  };

  Player.prototype.showEmpty = function (text) {
    this.el.stage.innerHTML = '<div class="vz-empty">' + esc(text) + '</div>';
  };

  /* ------------------------------ 渲染 ------------------------------ */

  Player.prototype.goto = function (i, syncRail) {
    if (!this.frames.length) return;
    i = Math.max(0, Math.min(this.frames.length - 1, i | 0));
    this.index = i;
    if (syncRail !== false) this.el.rail.value = String(i);
    this.paintRail();

    if (this.rendered === i) return;   /* 同一帧不重复刷，拖动滑块时省事 */
    this.rendered = i;
    this.renderFrame(this.frames[i]);
  };

  /* 进度条已走过的部分填成强调色 */
  Player.prototype.paintRail = function () {
    var n = this.frames.length;
    var pct = n > 1 ? (this.index / (n - 1)) * 100 : (n ? 100 : 0);
    this.el.rail.style.setProperty('--vz-pct', pct.toFixed(2) + '%');
  };

  Player.prototype.step = function (d) {
    this.pause();
    this.goto(this.index + d, true);
  };

  Player.prototype.renderFrame = function (frame) {
    if (!frame) return;

    /* flags 是 [idx, kind] 数组，转成 idx→kind 的表 */
    var flagMap = {};
    (frame.flags || []).forEach(function (f) {
      if (Array.isArray(f) && f.length >= 2) flagMap[f[0]] = f[1];
    });

    var views = frame.views || [];
    var arrs = [], mems = [], strs = [], ptrs = [], lns = [], tns = [], vns = [], vdes = [], vars = [];
    views.forEach(function (v) {
      if (!v || typeof v !== 'object') return;
      if (v.k === 'arr') arrs.push(v);
      else if (v.k === 'mem') mems.push(v);
      else if (v.k === 'strs') strs.push(v);
      else if (v.k === 'ptr') ptrs.push(v);
      else if (v.k === 'lnode') lns.push(v);
      else if (v.k === 'tnode') tns.push(v);
      else if (v.k === 'vnode') vns.push(v);
      else if (v.k === 'vedge') vdes.push(v);
      else if (v.k === 'var') vars.push(v);
    });

    var tgts = ptrTargets(ptrs);
    var html = '<div class="vz-canvas">';
    arrs.forEach(function (v) { html += renderArray(v, flagMap); });
    mems.forEach(function (v) { html += renderMem(v, flagMap, tgts); });
    strs.forEach(function (v) { html += renderStrs(v, flagMap); });
    if (ptrs.length) html += renderPtr(ptrs);
    if (lns.length) html += renderList(lns, flagMap);
    if (tns.length) html += renderTree(tns, flagMap);
    if (vns.length) html += renderGraph(vns, vdes, flagMap);
    html += '</div>';
    this.el.stage.innerHTML = html;

    /* 变量 + 说明 */
    var vtxt = vars.map(function (v) {
      return '<span class="vz-var"><i>' + esc(v.name) + '</i>=<b>' + esc(v.v) + '</b></span>';
    }).join('');
    this.el.note.innerHTML =
      (vtxt ? '<span class="vz-vars">' + vtxt + '</span>' : '') +
      '<span class="vz-desc">' + esc(frame.note || '') + '</span>';

    this.el.idx.textContent = String(this.index + 1);

    /* 通知外部：把编辑器里对应那行高亮起来 */
    this.onLine(frame.line || 0);
  };

  /* ------------------------------ 播放控制 ------------------------------ */

  Player.prototype.play = function () {
    if (this.playing || !this.frames.length) return;
    if (this.index >= this.frames.length - 1) this.goto(0, true);

    this.playing = true;
    this.el.play.textContent = '❚❚';
    this.el.play.classList.add('on');

    var self = this;
    var tick = function () {
      if (!self.playing) return;
      if (self.index >= self.frames.length - 1) {
        self.pause();
        self.onEnd();
        return;
      }
      self.goto(self.index + 1, true);
      self.timer = setTimeout(tick, SPEEDS[self.speed].ms);
    };
    this.timer = setTimeout(tick, SPEEDS[this.speed].ms);
  };

  Player.prototype.pause = function () {
    this.playing = false;
    clearTimeout(this.timer);
    this.timer = null;
    if (this.el && this.el.play) {
      this.el.play.textContent = '▶';
      this.el.play.classList.remove('on');
    }
  };

  Player.prototype.toggle = function () {
    if (this.playing) this.pause();
    else this.play();
  };

  Player.prototype.reset = function () {
    this.pause();
    this.frames = [];
    this.index = 0;
    this.rendered = -1;
    this.el.total.textContent = '0';
    this.el.idx.textContent = '0';
    this.el.rail.max = '0';
    this.el.rail.value = '0';
    this.el.rail.style.setProperty('--vz-pct', '0%');
    this.el.note.innerHTML = '';
    this.showEmpty('还没有数据。点上面的「演示」按钮跑一遍代码，这里就会动起来。');
    this.onLine(0);
  };

  /* ============================================================
     导出
     ============================================================ */
  global.CViz = {
    Player: Player,
    SPEEDS: SPEEDS,
    /* 暴露给外部测试用 */
    _render: {
      array: renderArray, mem: renderMem, ptr: renderPtr,
      list: renderList, tree: renderTree, graph: renderGraph
    }
  };
})(window);
