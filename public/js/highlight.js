/* ============================================================
   C 语法高亮（手写词法扫描，无依赖、离线可用）
   ============================================================ */
(function (global) {
  'use strict';

  const KEYWORDS = new Set([
    'auto', 'extern', 'register', 'static', 'typedef', 'volatile', 'const', 'inline',
    'struct', 'union', 'enum', 'sizeof', 'restrict', '_Bool', '_Complex', '_Atomic',
    '_Alignof', '_Alignas', '_Generic', '_Static_assert', '_Noreturn', '_Thread_local',
    'alignof', 'typeof', '__attribute__', 'asm'
  ]);

  const CONTROL = new Set([
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
    'break', 'continue', 'return', 'goto'
  ]);

  const TYPES = new Set([
    'void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned',
    'size_t', 'ssize_t', 'ptrdiff_t', 'bool', 'FILE', 'time_t', 'va_list', 'wchar_t',
    'int8_t', 'int16_t', 'int32_t', 'int64_t',
    'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
    'ElemType', 'Status', 'SqList', 'LinkList', 'LNode', 'SqStack', 'SqQueue',
    'BiTree', 'BiTNode', 'Graph', 'MGraph', 'ALGraph', 'Edge'
  ]);

  const CONSTS = new Set(['NULL', 'true', 'false', 'EOF', 'OK', 'ERROR', 'TRUE', 'FALSE']);

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function span(cls, text) {
    return '<span class="' + cls + '">' + esc(text) + '</span>';
  }

  function isIdStart(c) { return /[A-Za-z_]/.test(c); }
  function isIdChar(c) { return /[A-Za-z0-9_]/.test(c); }
  function isDigit(c) { return c >= '0' && c <= '9'; }

  function highlight(src) {
    let out = '';
    let i = 0;
    const n = src.length;
    let lineStart = true;

    while (i < n) {
      const c = src[i];

      /* --- 换行 --- */
      if (c === '\n') { out += '\n'; i++; lineStart = true; continue; }

      /* 行首空白 */
      if (lineStart && (c === ' ' || c === '\t')) { out += c; i++; continue; }

      /* --- 预处理指令 --- */
      if (c === '#' && lineStart) {
        let j = i + 1;
        while (src[j] === ' ' || src[j] === '\t') j++;
        let k = j;
        while (k < n && isIdChar(src[k])) k++;
        out += span('tk-pre', '#' + src.slice(i + 1, k));
        i = k;
        lineStart = false;

        const directive = src.slice(j, k);
        // #include <xxx.h> 整段按字符串着色
        if (directive === 'include' || directive === 'include_next') {
          let m = i;
          while (m < n && src[m] !== '\n') m++;
          out += span('tk-str', src.slice(i, m));
          i = m;
        }
        continue;
      }

      /* --- 注释 --- */
      if (c === '/' && src[i + 1] === '/') {
        let j = src.indexOf('\n', i);
        if (j === -1) j = n;
        out += span('tk-com', src.slice(i, j));
        i = j;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        let j = src.indexOf('*/', i + 2);
        j = j === -1 ? n : j + 2;
        out += span('tk-com', src.slice(i, j));
        i = j;
        continue;
      }

      /* --- 字符串 / 字符 --- */
      if (c === '"' || c === '\'') {
        const quote = c;
        let j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === quote) { j++; break; }
          if (src[j] === '\n') break;
          j++;
        }
        out += span('tk-str', src.slice(i, j));
        i = j;
        lineStart = false;
        continue;
      }

      /* --- 数字 --- */
      if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
        let j = i;
        if (src[j] === '0' && /[xX]/.test(src[j + 1] || '')) {
          j += 2;
          while (j < n && /[0-9a-fA-F]/.test(src[j])) j++;
        } else {
          while (j < n && /[0-9.]/.test(src[j])) j++;
          if (/[eE]/.test(src[j] || '') && /[0-9+-]/.test(src[j + 1] || '')) {
            j += 2;
            while (j < n && isDigit(src[j])) j++;
          }
        }
        while (j < n && /[uUlLfF]/.test(src[j])) j++;
        out += span('tk-num', src.slice(i, j));
        i = j;
        lineStart = false;
        continue;
      }

      /* --- 标识符 --- */
      if (isIdStart(c)) {
        let j = i;
        while (j < n && isIdChar(src[j])) j++;
        const word = src.slice(i, j);

        // 结构体成员 obj.field 也当普通标识符
        if (CONTROL.has(word)) out += span('tk-ctrl', word);
        else if (KEYWORDS.has(word)) out += span('tk-kw', word);
        else if (TYPES.has(word)) out += span('tk-type', word);
        else if (CONSTS.has(word)) out += span('tk-kw', word);
        else {
          let k = j;
          while (k < n && (src[k] === ' ' || src[k] === '\t')) k++;
          if (src[k] === '(') out += span('tk-fn', word);
          else out += span('tk-id', word);
        }
        i = j;
        lineStart = false;
        continue;
      }

      /* --- 其他 --- */
      if (c === ';' || c === '{' || c === '}' || c === '(' || c === ')' ||
          c === '[' || c === ']' || c === ',' || c === '.' || c === ':') {
        out += span('tk-op', c);
        i++;
        lineStart = false;
        continue;
      }
      if (c === ' ' || c === '\t') { out += c; i++; continue; }
      out += span('tk-op', c);
      i++;
      lineStart = false;
    }

    // 末尾换行占位，避免最后一行光标抖动
    return out + '\n';
  }

  global.CHighlight = { highlight: highlight, escapeHtml: esc };
})(window);
