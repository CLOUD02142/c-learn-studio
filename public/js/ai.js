/* ============================================================
   C-Learn Studio — AI 辅助改错（可选功能）

   设计原则：
   1. 完全可选。没填 API 也能用全部离线功能，离线诊断（diagnose.js）才是主力。
   2. Key 只存在本机浏览器的 localStorage，请求发到本机 127.0.0.1 的服务再转发，
      不经过任何第三方中转服务器，程序也不落盘。
   3. 只发"这道题 + 这次报错 + 这段代码"，不发学习进度、不传整个学习库。
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'cls.ai.v1';

  /* 常见服务商。全部走 OpenAI 兼容的 /chat/completions，换服务只要改三行。 */
  const PRESETS = {
    deepseek: { label: 'DeepSeek', url: 'https://api.deepseek.com/v1', model: 'deepseek-chat', note: '便宜、中文好，1 元能问很多次' },
    moonshot: { label: '月之暗面 Kimi', url: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k', note: '长上下文' },
    zhipu: { label: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4-flash', note: 'flash 版有免费额度' },
    qwen: { label: '阿里通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', note: '有免费额度' },
    openai: { label: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-4o-mini', note: '需要能直连的网络' },
    ollama: { label: '本地 Ollama（不用 Key）', url: 'http://127.0.0.1:11434/v1', model: 'qwen2.5-coder:7b', note: '完全离线，先 ollama pull 模型' },
    custom: { label: '自定义（OpenAI 兼容）', url: '', model: '', note: '任何兼容 /chat/completions 的网关' }
  };

  const DEFAULT = {
    provider: 'deepseek',
    baseURL: PRESETS.deepseek.url,
    apiKey: '',
    model: PRESETS.deepseek.model,
    enabled: false,
    temperature: 0.3
  };

  function load() {
    let cfg = {};
    try { cfg = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { cfg = {}; }
    return Object.assign({}, DEFAULT, cfg);
  }

  function save(cfg) {
    try { localStorage.setItem(KEY, JSON.stringify(cfg)); } catch (e) { /* 隐私模式下会失败，忽略 */ }
  }

  function clear() {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  /* 本地模型（Ollama / LM Studio）不校验 Key */
  function isLocalURL(url) {
    return /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?/i.test(String(url || ''));
  }

  function isReady(cfg) {
    cfg = cfg || load();
    if (!cfg.baseURL || !cfg.model) return false;
    if (isLocalURL(cfg.baseURL)) return true;
    return !!(cfg.apiKey && cfg.apiKey.trim().length >= 8);
  }

  /* ══════════════════ 网络 ══════════════════ */

  async function post(path, body, timeoutMs) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs || 95000);
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CLearn-Token': global.CLEARN_TOKEN || ''
        },
        body: JSON.stringify(body),
        signal: ctl.signal
      });
      if (res.status === 403) {
        return { ok: false, error: '本地令牌失效（服务可能重启过），刷新页面再试一次。' };
      }
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function loadConfigForRequest(cfg) {
    return {
      baseURL: cfg.baseURL,
      apiKey: cfg.apiKey,
      model: cfg.model,
      temperature: cfg.temperature
    };
  }

  async function chat(messages, cfg) {
    cfg = cfg || load();
    if (!isReady(cfg)) return { ok: false, error: '还没配置可用的 API。点下面的「去设置」填一下，或者继续用离线诊断。' };
    try {
      const r = await post('/api/ai/chat', Object.assign(loadConfigForRequest(cfg), { messages: messages }));
      if (!r) return { ok: false, error: '本地服务没响应' };
      if (r.ok) return r;
      return { ok: false, error: r.error || '调用失败', detail: r.detail || '', status: r.status };
    } catch (e) {
      if (e && e.name === 'AbortError') return { ok: false, error: '等太久了（95 秒），已取消。网络不稳或模型太慢。' };
      return { ok: false, error: '连不上本地服务：' + (e && e.message ? e.message : e) };
    }
  }

  async function test(cfg) {
    cfg = cfg || load();
    if (!cfg.baseURL) return { ok: false, error: '先填接口地址' };
    if (!cfg.model) return { ok: false, error: '先填模型名' };
    if (!isReady(cfg)) return { ok: false, error: 'API Key 还没填（本地模型除外）' };
    try {
      const r = await post('/api/ai/test', loadConfigForRequest(cfg), 25000);
      return r || { ok: false, error: '本地服务没响应' };
    } catch (e) {
      return { ok: false, error: '连不上本地服务：' + (e && e.message ? e.message : e) };
    }
  }

  /* ══════════════════ 提示词 ══════════════════ */

  const SYSTEM = [
    '你是一位教 C 语言和数据结构的助教，学生正在用本地的练习台写代码。',
    '你的任务只有一件：针对这一次的具体报错/输出差异，讲清楚"错在哪、为什么错、怎么改"。',
    '',
    '要求：',
    '1. 先用一句话给出结论，再解释原因。不要复述题目，不要写"希望这对你有帮助"这类客套话。',
    '2. 指出具体行号和那一行代码，不要泛泛而谈。',
    '3. 给最小修改：只说需要改的那几行，不要重写整个程序；如果必须重写，也只给关键函数。',
    '4. 如果学生思路本身就错了（比如把链表当数组遍历），直接指出来，并给正确思路的一句话版本。',
    '5. 用中文，Markdown 排版，代码块标注 c。总长度控制在 400 字以内，除非问题确实复杂。',
    '6. 不要编造学生代码里不存在的内容；不确定的地方说"需要看更多代码"。'
  ].join('\n');

  function codeWithLines(code, maxLen) {
    const src = String(code || '');
    const lines = src.split('\n');
    let out = '';
    for (let i = 0; i < lines.length; i++) {
      const row = String(i + 1).padStart(3, ' ') + ' | ' + lines[i];
      if (out.length + row.length > (maxLen || 6000)) {
        out += '\n... (后面的代码省略，共 ' + lines.length + ' 行)';
        break;
      }
      out += row + '\n';
    }
    return out;
  }

  /**
   * 把一次运行的上下文整理成一次对话。
   * ctx: { title, kind, desc, expected, actual, code, compilerOutput, pack, diff, exercise }
   */
  function buildPrompt(ctx) {
    const parts = [];
    parts.push('【场景】' + (ctx.exercise ? '练习题：' : '知识点示例：') + (ctx.title || '未命名'));
    if (ctx.kind === 'compile') parts.push('【这次的问题】编译失败');
    else if (ctx.kind === 'runtime') parts.push('【这次的问题】程序运行崩溃/超时');
    else if (ctx.kind === 'answer') parts.push('【这次的问题】能跑通，但输出和标准答案不一致');
    else parts.push('【这次的问题】代码能跑，但我怀疑有问题');

    if (ctx.desc) {
      const plain = String(ctx.desc).replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      parts.push('【题目要求】' + plain.slice(0, 600));
    }
    if (ctx.expected != null) parts.push('【期望输出】\n```\n' + String(ctx.expected).slice(0, 800) + '\n```');
    if (ctx.actual != null && ctx.actual !== '') parts.push('【实际输出】\n```\n' + String(ctx.actual).slice(0, 800) + '\n```');
    if (ctx.compilerOutput) parts.push('【编译器原始输出】\n```\n' + String(ctx.compilerOutput).slice(0, 1500) + '\n```');

    if (ctx.pack && ctx.pack.items && ctx.pack.items.length) {
      const human = ctx.pack.items.slice(0, 3).map(it => '- ' + it.title + (it.fix ? '｜建议：' + it.fix : '')).join('\n');
      parts.push('【本地离线诊断已经给出的线索】\n' + human);
    }
    if (ctx.diff && ctx.diff.first) {
      const f = ctx.diff.first;
      parts.push('【第一处差异】第 ' + f.line + ' 行' + (f.col ? '第 ' + f.col + ' 列' : '') + '：期望「' + f.expChar + '」，实际「' + f.actChar + '」');
    }
    if (Array.isArray(ctx.cases) && ctx.cases.length) {
      const bad = ctx.cases.filter(c => !c.pass).slice(0, 3);
      if (bad.length) {
        parts.push('【判题结果】一共 ' + ctx.cases.length + ' 组用例，只有 ' + (ctx.cases.length - ctx.cases.filter(c => !c.pass).length) + ' 组通过。失败的是：');
        bad.forEach((c) => {
          const idx = ctx.cases.indexOf(c) + 1;
          parts.push('第 ' + idx + ' 组（' + (c.note || '用例') + '）\n' +
            '输入：\n```\n' + (c.stdin || '(无输入)') + '\n```\n' +
            '期望输出：\n```\n' + (c.expected || '(空)') + '\n```\n' +
            '实际输出：\n```\n' + (c.actual || '(无输出)') + '\n```');
        });
        parts.push('请重点解释：为什么偏偏这几组会算错（边界？类型？循环范围？还是算法本身不对），而通过的组却是对的。');
      } else if (ctx.cases.length > 1) {
        parts.push('【判题结果】' + ctx.cases.length + ' 组用例全部通过，但我还想把代码写得更扎实。');
      }
    }
    if (ctx.structure) {
      parts.push('【结构提醒】本地静态检查认为代码里没体现这题要练的写法：' + ctx.structure.why + '。请判断这是不是"把答案直接打印出来"式的蒙混过关。');
    }
    if (ctx.lint && ctx.lint.length) {
      parts.push('【静态自查提示】\n' + ctx.lint.slice(0, 5).map(l => '- ' + l.text).join('\n'));
    }

    parts.push('【我的代码】\n```c\n' + codeWithLines(ctx.code, 6000) + '```');
    parts.push('请按"结论 → 原因 → 最小修改"的结构回答。');

    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: parts.join('\n\n') }
    ];
  }

  /* ══════════════════ 极简 Markdown 渲染 ══════════════════ */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  }

  /**
   * 只支持 AI 回答里真正会用到的语法：代码块、行内代码、加粗、标题、列表、段落。
   * 先转义再套标签，避免模型输出里的 HTML 直接生效。
   */
  function render(md) {
    const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let i = 0;
    let listType = '';

    const closeList = () => { if (listType) { html += '</' + listType + '>'; listType = ''; } };

    while (i < lines.length) {
      const line = lines[i];

      // 代码块
      const fence = line.match(/^\s*```(\w*)\s*$/);
      if (fence) {
        closeList();
        const buf = [];
        i++;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        html += '<pre class="ai-code"><code>' + esc(buf.join('\n')) + '</code></pre>';
        continue;
      }

      if (!line.trim()) { closeList(); i++; continue; }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h) {
        closeList();
        const lv = Math.min(4, h[1].length + 2);   // # → h3，## → h4，避免抢教程面板的层级
        html += '<h' + lv + '>' + inline(esc(h[2])) + '</h' + lv + '>';
        i++; continue;
      }

      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (ul || ol) {
        const want = ul ? 'ul' : 'ol';
        if (listType !== want) { closeList(); html += '<' + want + '>'; listType = want; }
        html += '<li>' + inline(esc((ul || ol)[1])) + '</li>';
        i++; continue;
      }

      if (/^\s*>\s?/.test(line)) {
        closeList();
        html += '<blockquote>' + inline(esc(line.replace(/^\s*>\s?/, ''))) + '</blockquote>';
        i++; continue;
      }

      closeList();
      html += '<p>' + inline(esc(line)) + '</p>';
      i++;
    }
    closeList();
    return html;
  }

  global.CAI = {
    PRESETS: PRESETS,
    load: load,
    save: save,
    clear: clear,
    isReady: isReady,
    isLocalURL: isLocalURL,
    chat: chat,
    test: test,
    buildPrompt: buildPrompt,
    render: render
  };
})(window);
