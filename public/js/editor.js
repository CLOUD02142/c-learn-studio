/* ============================================================
   代码编辑器：textarea + 高亮层（VS Code 风格）
   ============================================================ */
(function (global) {
  'use strict';

  const INDENT = '    ';

  class CodeEditor {
    constructor(opts) {
      this.ta = document.getElementById('codeInput');
      this.pre = document.getElementById('hlPre');
      this.codeEl = document.getElementById('hlCode');
    this.gutter = document.getElementById('gutter');
    this.activeLine = document.getElementById('activeLine');
    this.traceEl = document.getElementById('traceLine');
    this.traceLine = 0;              /* 演示时高亮的代码行，0 表示不亮 */
    this.onCursor = opts.onCursor || function () {};
      this.onChange = opts.onChange || function () {};
      this.errLines = new Set();
      this.lh = 22;
      this.measure();
      this.bind();
      this.refresh();
    }

    measure() {
      const cs = getComputedStyle(this.ta);
      this.lh = parseFloat(cs.lineHeight) || 22;
      this.padTop = parseFloat(cs.paddingTop) || 8;
    }

    bind() {
      const ta = this.ta;
      ta.addEventListener('scroll', () => this.syncScroll());
      ta.addEventListener('input', () => { this.refresh(); this.onChange(); });
      ta.addEventListener('keydown', (e) => this.onKeyDown(e));
      ta.addEventListener('keyup', () => this.updateCursor());
      ta.addEventListener('click', () => this.updateCursor());
      ta.addEventListener('select', () => this.updateCursor());
      window.addEventListener('resize', () => { this.measure(); this.refresh(); });
    }

    /* ------------------------------ 内容 ------------------------------ */
    getValue() { return this.ta.value; }

    setValue(v, opts) {
      this.ta.value = v == null ? '' : v;
      this.traceLine = 0;
      this.updateTraceLine();
      if (!opts || opts.cursor !== 'keep') {
        this.ta.setSelectionRange(0, 0);
        this.ta.scrollTop = 0;
        this.ta.scrollLeft = 0;
      }
      this.refresh();
    }

    focus() { this.ta.focus(); }

    /* ------------------------------ 渲染 ------------------------------ */
    refresh() {
      this.codeEl.innerHTML = global.CHighlight.highlight(this.ta.value);
      this.renderGutter();
      this.syncScroll();
      this.updateCursor();
    }

    renderGutter() {
      const count = this.ta.value.split('\n').length;
      const curLine = this.currentLine();
      let html = '';
      for (let i = 1; i <= count; i++) {
        const cls = 'gl' + (i === curLine ? ' cur' : '') + (this.errLines.has(i) ? ' err' : '');
        html += '<div class="' + cls + '">' + i + '</div>';
      }
      this.gutter.innerHTML = html;
    }

    syncScroll() {
      const ta = this.ta;
      this.pre.scrollTop = ta.scrollTop;
      this.pre.scrollLeft = ta.scrollLeft;
      this.gutter.scrollTop = ta.scrollTop;
      this.updateActiveLine();
      this.updateTraceLine();
    }

    /* ---------- 演示行高亮：跟光标行分开，互不干扰 ---------- */

    setTraceLine(line) {
      this.traceLine = line | 0;
      if (this.traceLine) this.scrollTraceIntoView();
      this.updateTraceLine();
    }

    clearTraceLine() {
      this.traceLine = 0;
      this.updateTraceLine();
    }

    /* 播放到一半时，当前行跑出视野就把它拉回来 */
    scrollTraceIntoView() {
      const ta = this.ta;
      const y = this.padTop + (this.traceLine - 1) * this.lh;
      const visH = ta.clientHeight;
      if (y - ta.scrollTop < this.lh) {
        ta.scrollTop = Math.max(0, y - this.lh * 2);
      } else if (y + this.lh - ta.scrollTop > visH - this.lh) {
        ta.scrollTop = Math.max(0, y - visH + this.lh * 3);
      }
    }

    updateTraceLine() {
      const el = this.traceEl;
      if (!el) return;
      if (!this.traceLine) { el.style.display = 'none'; return; }
      el.style.display = 'block';
      el.style.top = (this.padTop + (this.traceLine - 1) * this.lh - this.ta.scrollTop) + 'px';
      el.style.height = this.lh + 'px';
    }

    updateActiveLine() {
      const line = this.currentLine();
      const top = this.padTop + (line - 1) * this.lh - this.ta.scrollTop;
      this.activeLine.style.top = top + 'px';
      this.activeLine.style.height = this.lh + 'px';
    }

    currentLine() {
      const v = this.ta.value.slice(0, this.ta.selectionStart);
      return v.split('\n').length;
    }

    currentCol() {
      const v = this.ta.value.slice(0, this.ta.selectionStart);
      return v.length - v.lastIndexOf('\n');
    }

    updateCursor() {
      const line = this.currentLine();
      const col = this.currentCol();
      // 更新 gutter 当前行
      const prev = this.gutter.querySelector('.gl.cur');
      if (prev) prev.classList.remove('cur');
      const items = this.gutter.children;
      if (items[line - 1]) items[line - 1].classList.add('cur');
      this.updateActiveLine();
      this.onCursor({ line: line, col: col });
    }

    setDiagnostics(list) {
      this.errLines.clear();
      (list || []).forEach((d) => { if (d.severity === 'error' && d.line) this.errLines.add(d.line); });
      this.renderGutter();
    }

    /* ------------------------------ 编辑原语 ------------------------------ */
    insertText(text) {
      const ta = this.ta;
      ta.focus();
      let ok = false;
      try {
        ok = document.execCommand('insertText', false, text);
      } catch (e) { ok = false; }
      if (!ok) {
        const s = ta.selectionStart, e = ta.selectionEnd;
        ta.setRangeText(text, s, e, 'end');
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
      this.refresh();
    }

    replaceRange(text, from, to, caret) {
      const ta = this.ta;
      ta.value = ta.value.slice(0, from) + text + ta.value.slice(to);
      const pos = caret == null ? from + text.length : caret;
      ta.setSelectionRange(pos, pos);
      this.refresh();
      this.onChange();
    }

    /* ------------------------------ 键盘 ------------------------------ */
    onKeyDown(e) {
      const ta = this.ta;
      const meta = e.ctrlKey || e.metaKey;

      // 中文输入法组词中，不要抢键
      if (e.isComposing || e.keyCode === 229) return;

      // Ctrl+Enter / Ctrl+S 交给全局
      if (meta && (e.key === 'Enter' || e.key.toLowerCase() === 's' || e.key === '`')) return;

      // 注释切换 Ctrl+/
      if (meta && (e.key === '/' || e.key === '?')) {
        e.preventDefault();
        this.toggleComment();
        return;
      }

      // 注释切换 Ctrl+Shift+/ (块注释)
      if (meta && e.shiftKey && e.key === '?') { e.preventDefault(); this.toggleBlockComment(); return; }

      // Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) this.outdent();
        else this.indent();
        return;
      }

      // 回车自动缩进
      if (e.key === 'Enter') {
        e.preventDefault();
        this.autoIndent();
        return;
      }

      // 退格成对删除
      if (e.key === 'Backspace') {
        const s = ta.selectionStart, en = ta.selectionEnd;
        if (s === en && s > 0) {
          const prev = ta.value[s - 1], next = ta.value[s];
          const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', '\'': '\'' };
          if (pairs[prev] && pairs[prev] === next) {
            e.preventDefault();
            this.replaceRange('', s - 1, s + 1, s - 1);
            return;
          }
        }
        return;
      }

      // 括号 / 引号自动配对
      if (!meta && !e.altKey) {
        const pairs = { '(': ')', '[': ']', '{': '}', '"': '"', '\'': '\'' };
        const s = ta.selectionStart, en = ta.selectionEnd;

        // 输入右括号时，若下一个字符就是它，直接跳过
        if ([')', ']', '}', '"', '\''].includes(e.key) && s === en && ta.value[s] === e.key) {
          e.preventDefault();
          ta.setSelectionRange(s + 1, s + 1);
          this.updateCursor();
          return;
        }

        if (pairs[e.key]) {
          e.preventDefault();
          const close = pairs[e.key];
          if (s !== en) {
            const sel = ta.value.slice(s, en);
            this.insertText(e.key + sel + close);
            ta.setSelectionRange(s + 1, s + 1 + sel.length);
            this.updateCursor();
          } else {
            this.insertText(e.key + close);
            ta.setSelectionRange(s + 1, s + 1);
            this.updateCursor();
          }
          return;
        }
      }
    }

    autoIndent() {
      const ta = this.ta;
      let s = ta.selectionStart;
      const en = ta.selectionEnd;
      if (s !== en) {
        // 有选区时先删除选区
        ta.setSelectionRange(s, en);
        const del = document.execCommand('delete');
        if (!del) { ta.setRangeText('', s, en, 'end'); }
        s = ta.selectionStart;
      }
      const value = ta.value;
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const before = value.slice(lineStart, s);
      const indent = (before.match(/^[ \t]*/) || [''])[0];
      const prevChar = value[s - 1];
      const nextChar = value[s];

      let add = indent;
      if (prevChar === '{' || prevChar === '(') {
        add = indent + INDENT;
      } else if (prevChar === ':' && /^\s*case\b|^\s*default\b/.test(before)) {
        add = indent + INDENT;
      }

      if (nextChar === '}' && prevChar === '{') {
        this.insertText('\n' + add + '\n' + indent);
        const pos = ta.selectionStart - (indent.length + 1);
        ta.setSelectionRange(pos, pos);
        this.updateCursor();
        return;
      }
      this.insertText('\n' + add);
    }

    indent() {
      const ta = this.ta;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const value = ta.value;
      if (s === en) {
        this.insertText(INDENT);
        return;
      }
      const startLine = value.lastIndexOf('\n', s - 1) + 1;
      let endLine = value.indexOf('\n', en);
      if (endLine === -1) endLine = value.length;
      const block = value.slice(startLine, endLine);
      const lines = block.split('\n');
      const newBlock = lines.map(l => (l.length ? INDENT + l : l)).join('\n');
      const firstShift = lines[0].length ? INDENT.length : 0;
      ta.setSelectionRange(startLine, endLine);
      this.insertText(newBlock);
      ta.setSelectionRange(startLine + firstShift, startLine + newBlock.length);
      this.refresh();
    }

    outdent() {
      const ta = this.ta;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const value = ta.value;
      const startLine = value.lastIndexOf('\n', s - 1) + 1;
      let endLine = value.indexOf('\n', en);
      if (endLine === -1) endLine = value.length;
      const block = value.slice(startLine, endLine);
      const lines = block.split('\n');
      let removedFirst = 0;
      const newBlock = lines.map((l, idx) => {
        const m = l.match(/^( {1,4}|\t)/);
        if (!m) return l;
        if (idx === 0) removedFirst = m[0].length;
        return l.slice(m[0].length);
      }).join('\n');
      ta.setSelectionRange(startLine, endLine);
      this.insertText(newBlock);
      ta.setSelectionRange(Math.max(startLine, s - removedFirst), startLine + newBlock.length);
      this.refresh();
    }

    toggleComment() {
      const ta = this.ta;
      const value = ta.value;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const startLine = value.lastIndexOf('\n', s - 1) + 1;
      let endLine = value.indexOf('\n', en);
      if (endLine === -1) endLine = value.length;
      const block = value.slice(startLine, endLine);
      const lines = block.split('\n');
      const allCommented = lines.every(l => !l.trim() || /^\s*\/\//.test(l));
      const newBlock = lines.map((l) => {
        if (!l.trim()) return l;
        if (allCommented) return l.replace(/^(\s*)\/\/\s?/, '$1');
        return l.replace(/^(\s*)/, '$1// ');
      }).join('\n');
      ta.setSelectionRange(startLine, endLine);
      this.insertText(newBlock);
      ta.setSelectionRange(startLine, startLine + newBlock.length);
      this.refresh();
    }

    toggleBlockComment() {
      const ta = this.ta;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const value = ta.value;
      const sel = value.slice(s, en);
      if (!sel.trim()) { this.insertText('/*  */'); ta.setSelectionRange(s + 3, s + 3); return; }
      this.insertText('/*' + sel + '*/');
      ta.setSelectionRange(s + 2, s + 2 + sel.length);
      this.refresh();
    }

    gotoLine(line) {
      const ta = this.ta;
      const lines = ta.value.split('\n');
      let pos = 0;
      for (let i = 0; i < Math.min(line - 1, lines.length); i++) pos += lines[i].length + 1;
      ta.focus();
      ta.setSelectionRange(pos, pos);
      const top = (line - 1) * this.lh;
      ta.scrollTop = Math.max(0, top - ta.clientHeight / 2 + this.lh);
      this.syncScroll();
      this.updateCursor();
    }
  }

  global.CodeEditor = CodeEditor;
})(window);
