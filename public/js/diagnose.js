/* ============================================================
   C-Learn Studio — 报错翻译 & 答案比对引擎（离线，不依赖网络）

   两个职责：
   1. 把 gcc 的英文报错 / 程序崩溃码，翻译成"人话 + 怎么改 + 改完长什么样"
   2. 把「你的输出」和「期望输出」逐行逐字符比一遍，指出第一处不同和可能的原因

   为什么不用大模型：这两个功能必须在完全离线的机器上也能用。
   需要更灵活的分析时，再交给用户自己配置的 AI（见 ai.js）。
   ============================================================ */
(function (global) {
  'use strict';

  /* ══════════════════════ 一、gcc 报错 → 人话 ══════════════════════ */

  /* 每条规则：test 匹配原消息，出 title（一句话结论）、why（为什么）、fix（怎么办）、
     snippet（改前/改后对照，可选）。顺序有讲究：越具体的越靠前。 */
  const RULES = [
    {
      test: /invalid suffix .* (on integer constant|on floating constant)/i,
      title: '数字后面跟了一个非法字符（多半是中文标点或全角空格）',
      why: '`int a = 1；` 里的「；」不是 C 的分号，编译器把它当成数字 1 的一部分，于是说"这个后缀不认识"。',
      fix: '把这一行光标处的全角符号删掉，切英文输入法重打。全角「；，：（）」都会被这么报。',
      snippet: 'int a = 1；      ← 全角分号\nint a = 1;       ← 半角分号'
    },
    {
      test: /expected identifier or '\(' before/i,
      title: '这里多了一个逗号，或者括号里空着',
      why: '`int a = 1,;` 这种写法里，编译器在等下一个名字，结果等到了分号。',
      fix: '删掉多余的逗号；函数参数列表末尾也不要留逗号（C 不允许）。',
      snippet: 'int a = 1,;        ← 多余逗号\nint a = 1;         ← 对'
    },
    {
      test: /stray '\\\d+' in program/i,
      title: '代码里混进了中文标点或全角空格',
      why: '逗号、分号、括号、引号看上去没问题，但其实是中文输入法打出来的全角字符，编译器只认 ASCII。',
      fix: '切到英文输入法，把这一行的 `，；：（）“”` 换成 `,;:()""`。全角空格（　）也要删掉重打。',
      snippet: 'printf("ok")；   ← 中文分号\nprintf("ok");    ← 英文分号'
    },
    {
      test: /missing terminating " character|missing terminating ' character/i,
      title: '字符串或字符的引号没配对',
      why: '一个 `"` 开了头却没在行内闭合，后面的代码全被当成字符串内容了。',
      fix: '数一数这一行的 `"` 是不是偶数个；字符串里的 `"` 要写成 `\\"`。',
      snippet: 'printf("he said "hi"\\n");   ← 错\nprintf("he said \\"hi\\"\\n");  ← 对'
    },
    {
      test: /expected ',' or ';' before/i,
      title: '上一句结尾少了分号（或函数参数之间漏了逗号）',
      why: '编译器读到下一行的 `printf` / 变量名时，才发现"上一句好像没结束"。它给出两种可能：少分号，或者参数之间少逗号。',
      fix: '看报错行的**上一行**末尾有没有 `;`；如果是函数调用的参数，检查两个参数之间有没有 `,`。',
      snippet: 'int a = 1\nprintf("%d", a);   ← 报错落在 printf 这行，实际错在上一行末尾'
    },
    {
      test: /expected [';]?\s*;?\s*[';]? before/i,
      title: '上一句结尾少了分号',
      why: 'C 的语句必须以 `;` 结束。报错行通常比真正出错的位置晚一行——编译器读到下一行才发现不对。',
      fix: '往上翻一行，看是不是漏了分号；`struct` / 函数头 / `if (...)` 的右括号后面不要加分号。',
      snippet: 'int a = 1\nint b = 2;   ← 报错在这里，其实错在上一行'
    },
    {
      test: /expected declaration or statement at end of input/i,
      title: '大括号没闭合，或者函数没写完',
      why: '文件到末尾了，还有个 `{` 找不到配对的 `}`。常见于复制代码时漏了最后一个 `}`，或 `while` 后面多写了一个 `{`。',
      fix: '把光标停在每个 `{` 上，编辑器会高亮配对的 `}`；重点检查 `main` 函数和循环体。'
    },
    {
      test: /expected ['"]?\)['"]? before|expected ['"]?\)['"]? at end/i,
      title: '括号不匹配（少一个右括号或多一个左括号）',
      why: '函数调用、`if`、`for` 的括号没配平，编译器在等一个 `)`。',
      fix: '从这一行的左括号开始数，左右个数要相等；多行调用时最容易漏。'
    },
    {
      test: /expected expression before|expected expression at end/i,
      title: '这里应该有个表达式，但没写',
      why: '运算符两边空着、多了个逗号、或者 `= ;` 这种写法，都会触发。',
      fix: '看报错位置前后有没有多余的 `,` `=` `+`，或者把参数写完整。',
      snippet: 'int a = ;        ← 少了值\nsum = sum + ;    ← 少了加数'
    },
    {
      test: /undeclared \(first use in this function\)|undeclared here|unknown type name/i,
      title: '变量或类型没声明就用了',
      why: '要么是拼错了名字，要么是声明在别的 `{}` 里（作用域外看不见），要么忘了 `typedef`。',
      fix: '先检查拼写（`lenght` / `length` 这种最常见），再确认声明在同一个函数体里面。',
      snippet: 'for (int i = 0; ...) { }\nprintf("%d", i);   ← i 出了循环就不存在了'
    },
    {
      test: /implicit declaration of function/i,
      title: '调用了一个"来路不明"的函数',
      why: '编译器没见过这个函数的声明：多半是忘了 `#include`，或者函数名拼错。C11 里这已经是硬错误。',
      fix: '`printf/sprintf` → `<stdio.h>`，`strlen/strcpy` → `<string.h>`，`malloc/free` → `<stdlib.h>`，`sqrt/pow` → `<math.h>`。',
      snippet: '#include <string.h>\nint n = strlen(s);'
    },
    {
      test: /undefined reference to|ld returned \d+ exit status/i,
      title: '链接失败：函数/变量只有名字，没有实体',
      why: '这不是语法错误——编译器找到了声明，但整个工程里找不到它的实现（函数体）。',
      fix: '三种可能：① 函数只写了原型没写实现；② 名字拼错（大小写也算）；③ 用了数学库却没加 `-lm`（本项目已自动加）。',
      snippet: 'int add(int, int);      // 只有声明\ni = add(1, 2);          // 链接时找不到 add 的实现 → 报错'
    },
    {
      test: /multiple definition of|redefinition of/i,
      title: '同一个东西被定义了两次',
      why: '变量或函数在同一个文件里定义了两遍；多文件时是把定义写进了头文件。',
      fix: '删掉重复的那份；头文件里只放声明（`extern int x;`），定义放 `.c` 文件。'
    },
    {
      test: /conflicting types for/i,
      title: '同名的函数/变量，前后声明的类型不一样',
      why: '先声明成 `int f(int)`，后面写成 `double f(double)`，编译器不知道听谁的。',
      fix: '让声明和定义完全一致；调用前先确认原型的参数类型。'
    },
    {
      test: /Using gets\(\) is always unsafe|declared with attribute warning: Using gets/i,
      title: '用了 gets()——它在 C11 里已经被删掉了',
      why: '`gets` 不检查缓冲区长度，输入一长就直接写穿内存，是"缓冲区溢出"的经典教科书案例。',
      fix: '改用 `fgets(buf, sizeof buf, stdin)`。注意 fgets 会把结尾的换行也读进来，需要的话自己去掉。',
      snippet: 'char s[32];\nfgets(s, sizeof s, stdin);\ns[strcspn(s, "\\n")] = \'\\0\';   // 去掉换行'
    },
    {
      test: /format '.*' expects argument of type|format '%\w' expects/i,
      title: '格式符和参数类型对不上（printf 打印 / scanf 取地址）',
      why: '`%d` 只认 int，`%f` 只认 double，`%s` 只认 char*。类型不匹配时 printf 会打出垃圾值，scanf 会写坏内存。另外 scanf 的普通变量前面必须加 `&`。',
      fix: '`int`→`%d`，`long long`→`%lld`，`double`→`%f`/`%.2f`，`char`→`%c`，字符串→`%s`，`size_t`→`%zu`；scanf 里写成 `&x`。',
      snippet: 'double x = 1.5;\nprintf("%d", x);    ← 错（%d 配 double）\nprintf("%f", x);    ← 对\nscanf("%d", a);     ← 错（少了 &）\nscanf("%d", &a);    ← 对'
    },
    {
      test: /too few arguments to function|too many arguments to function/i,
      title: '函数调用的参数个数不对',
      why: '声明里有 2 个参数，调用时给了 3 个（或者少给）。',
      fix: '对着函数定义数一遍参数；`printf` 的个数要和格式符数量一致。'
    },
    {
      test: /lvalue required as|assignment to expression with array type/i,
      title: '等号左边不是一个"能装东西"的位置',
      why: '`a + b = c`、`5 = x`、`arr = ...`（数组名是常量地址）都不行，左边必须是变量。',
      fix: '把要改的变量放左边；给字符数组赋值要用 `strcpy(arr, "hi")` 而不是 `arr = "hi"`。',
      snippet: 'char s[10];\ns = "hi";            ← 错\nstrcpy(s, "hi");     ← 对'
    },
    {
      test: /dereferencing pointer to incomplete type|invalid use of undefined type|storage size of .* isn't known/i,
      title: '结构体还没定义完就被使用了',
      why: '只写了 `struct Node;`（前向声明）就拿它定义变量或访问成员，编译器不知道它有多大。',
      fix: '把完整的 `struct { ... };` 定义挪到使用之前；用 `typedef` 时注意定义顺序。'
    },
    {
      test: /control reaches end of non-void function/i,
      title: '非 void 函数有可能不返回任何值',
      why: '声明了返回 `int`，但某条分支走到最后没有 `return`，调用方拿到的是垃圾值。',
      fix: '在所有分支末尾补 `return 0;`（或对应的值）；递归函数别忘了基准情形也要 return。'
    },
    {
      test: /suggest parentheses around assignment used as truth value/i,
      title: 'if 里把 `==` 写成了 `=`',
      why: '`if (a = b)` 是赋值，结果永远为真（除非 b 是 0），经典的逻辑错误。',
      fix: '比较用 `==`；确实想在条件里赋值，就写 `if ((a = b) != 0)` 把意图写清楚。'
    },
    {
      test: /invalid operands to binary|invalid operands to binary \*|incompatible type for argument/i,
      title: '运算符两边的类型不搭',
      why: '比如两个结构体相加、指针乘整数、把 `char*` 当整数用。',
      fix: '想清楚操作数的类型：指针只能加减整数，结构体不能直接比较，字符串比较要用 `strcmp`。'
    },
    {
      test: /subscripted value is neither array nor pointer/i,
      title: '对不是数组的东西用了 `[]`',
      why: '`int a;` 然后 `a[0]` —— 单个变量没有下标。常见于把 `int *a` 写成了 `int a`。',
      fix: '确认声明：要下标就声明成数组或指针，并且真的分配了内存。'
    },
    {
      test: /invalid type argument of '->'|'\.' .* but argument|request for member .* in something not a structure/i,
      title: '结构体成员访问符用错了',
      why: '`p.x` 用于结构体变量，`p->x` 用于结构体指针，混用就报这个。',
      fix: '指针用 `->`，变量用 `.`；`(*p).x` 和 `p->x` 等价。'
    },
    {
      test: /array subscript .* is (above|below) array bounds|out of bounds/i,
      title: '数组下标越界',
      why: '访问了 `a[n]` 这种超出申请范围的位置，写进去会把别的数据踩坏。',
      fix: '下标范围是 `0 .. n-1`；循环条件写 `i < n` 而不是 `i <= n`。'
    },
    {
      test: /comparison of integer expressions of different signedness/i,
      title: '有符号数和无符号数在比较（警告）',
      why: '`int` 和 `size_t` 比较时，负数会被当成巨大的正数，条件可能反着走。',
      fix: '统一类型：循环变量用 `int` 就和 `int` 比，用 `size_t` 就全用 `size_t`。本项目已默认关掉这条警告，但知道原因有好处。'
    },
    {
      test: /unused variable|set but not used|defined but not used|unused parameter/i,
      title: '声明了但没用（只是警告）',
      why: '不影响运行，但通常说明"你本来想用它却忘了"。',
      fix: '要么用起来，要么删掉。留着容易在交作业时被扣"代码不干净"的分。'
    },
    {
      test: /return with no value|'return' with a value, in function returning void/i,
      title: 'return 的写法和函数返回类型不一致',
      why: '`void` 函数不该 `return 1;`，非 void 函数不该光写 `return;`。',
      fix: '`void` 就写 `return;` 或干脆不写；有返回值就 `return 值;`。'
    },
    {
      test: /No such file or directory|#include .* No such file/i,
      title: '头文件找不到',
      why: '`#include <xxx.h>` 里的名字拼错了，或者用了非标准头（比如 `conio.h` 在 Linux 上没有）。',
      fix: '标准库头文件只有那二十来个，`gets` 所在的 `<conio.h>` 是 Windows 专有且已废弃，别用。'
    },
    {
      test: /division by zero|division by zero in/i,
      title: '除以 0',
      why: '编译器发现除数是常量 0，直接报错；如果除数是变量，就要到运行期才会崩。',
      fix: '除法前判断除数是否为 0，尤其是 `avg = sum / n` 里 n 可能为 0 的情况。'
    }
  ];

  function explainDiagnostic(d) {
    if (!d) return null;
    const msg = String(d.message || '');
    for (const r of RULES) {
      if (r.test.test(msg)) {
        return {
          title: r.title,
          why: r.why,
          fix: r.fix,
          snippet: r.snippet || '',
          matched: true
        };
      }
    }
    return {
      title: d.stage === 'link' ? '链接阶段出了问题' : '编译器报了一个它自己的错',
      why: '这条消息不在常见清单里。别慌，先把报错里的英文关键词挑出来（比如 undeclared / expected / invalid），它们就是线索。',
      fix: '点这一行能跳到对应代码；先修最上面那条错误——后面的错误常常是它引起的连锁反应。',
      snippet: '',
      matched: false
    };
  }

  /* ══════════════════════ 二、程序跑崩了 → 人话 ══════════════════════ */

  function explainRun(res) {
    if (!res) return null;
    if (res.timedOut) {
      return {
        title: '程序跑了 5 秒还没结束，被强制掐掉了',
        why: '最常见是死循环：循环变量没更新、条件永远成立、`while (1)` 忘了 break。也可能是 `scanf` 在等一个永远不会来的输入。',
        fix: '在循环体里加一句 `printf("i=%d\\n", i);` 看它到底停在哪；确认循环条件里的变量真的在变。',
        snippet: 'while (i < n) {\n    printf("%d", a[i]);\n    // 忘了 i++  → 永远在打印同一个\n}'
      };
    }
    const code = res.exitCode;
    if (code === 3221225477 || code === -1073741819 || code === 139) {
      return {
        title: '程序崩溃：访问了不该访问的内存（段错误 / 0xC0000005）',
        why: '三种典型：① 空指针或野指针被解引用；② 数组下标越界；③ 用了已经 `free` 掉的内存。',
        fix: '先在可疑位置打印指针值和下标；检查 `malloc` 之后有没有判空、`free` 之后有没有再访问。',
        snippet: 'int *p = NULL;\n*p = 1;              // 崩在这里\n\nint a[3];\na[5] = 1;            // 也会崩'
      };
    }
    if (code === 3221225725 || code === -1073741571 || code === 0xC00000FD) {
      return {
        title: '栈溢出（0xC00000FD）',
        why: '递归太深没有出口，或者在函数里开了超大数组（比如 `int a[1000000]`）——栈只有几 MB。',
        fix: '递归先写基准情形并确认它会收敛；大数组改成 `static` 或 `malloc` 放堆上。'
      };
    }
    if (code === 3221226505 || code === -1073740791 || code === 0xC0000409) {
      return {
        title: '栈被写坏了（0xC0000409）',
        why: '典型是数组越界写：`char s[5]` 里 `strcpy` 了 10 个字符，把函数返回地址盖掉了。',
        fix: '给字符串留足空间（别忘了结尾的 `\\0`）；用 `strncpy` / `snprintf` 限制长度。'
      };
    }
    if (code === -1073741676 || code === 0xC0000094) {
      return {
        title: '整数除以 0，CPU 直接抛异常',
        why: '`a / b` 里 b 是 0。和浮点不同，整数除零不会返回 inf，会直接崩。',
        fix: '除法前加 `if (b != 0)`；求平均时先确认个数不为 0。'
      };
    }
    if (code === 1) {
      return {
        title: '程序自己返回了 1，主动退出',
        why: '要么是代码里 `return 1;`（常见于 `if (scanf(...) != 2) return 1;` 这种输入检查），要么是 `exit(1)`。',
        fix: '先确认标准输入面板里的内容够不够程序读——输入给少了，scanf 读不到，就走进这个分支了。'
      };
    }
    if (code !== 0 && code != null) {
      return {
        title: '程序异常退出，退出码 ' + code,
        why: '退出码是操作系统给的"死因"。非 0 一般意味着崩溃或主动报错。',
        fix: '看上面的 stderr 有没有提示；把可疑操作用 printf 夹起来定位。'
      };
    }
    return null;
  }

  /* ══════════════════════ 三、输出比对 ══════════════════════ */

  function normalize(s) {
    return String(s == null ? '' : s)
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(l => l.replace(/[ \t]+$/, ''))
      .join('\n')
      .replace(/\n+$/, '')
      .trim();
  }

  /* 把空白可视化：行尾空格显示成 ·，制表符显示成 → */
  function showWs(line) {
    let s = String(line == null ? '' : line);
    const lead = s.match(/^[ \t]*/)[0];
    s = s.slice(lead.length);
    return lead.replace(/ /g, '·').replace(/\t/g, '→') + s.replace(/\t/g, '→');
  }

  function firstDiffChar(a, b) {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      if (a[i] !== b[i]) {
        return {
          col: i + 1,
          exp: a[i] == null ? '(行尾)' : a[i],
          act: b[i] == null ? '(行尾)' : b[i]
        };
      }
    }
    return null;
  }

  /**
   * 逐行比对。
   * 返回 rows（带行号的期望/实际对照）、first（第一处不同）、causes（可能原因清单）
   */
  function analyzeDiff(expected, actual) {
    const e = normalize(expected);
    const a = normalize(actual);
    const el = e === '' ? [] : e.split('\n');
    const al = a === '' ? [] : a.split('\n');
    const max = Math.max(el.length, al.length);
    const rows = [];
    let first = null;

    for (let i = 0; i < max; i++) {
      const exp = el[i];
      const act = al[i];
      const ok = exp === act;
      let diff = null;
      if (!ok && exp != null && act != null) {
        diff = firstDiffChar(exp, act);
      }
      if (!ok && !first) {
        first = {
          line: i + 1,
          col: diff ? diff.col : 0,
          exp: exp == null ? '(缺少这一行)' : exp,
          act: act == null ? '(没有输出这一行)' : act,
          expChar: diff ? diff.exp : '',
          actChar: diff ? diff.act : ''
        };
      }
      rows.push({
        n: i + 1,
        exp: exp == null ? null : exp,
        act: act == null ? null : act,
        ok: ok,
        diff: diff
      });
    }

    const causes = [];
    const add = (text) => { if (!causes.includes(text)) causes.push(text); };

    if (max === 0) {
      add('两边都是空的——是不是还没运行？');
      return { same: true, rows: rows, first: null, causes: causes, verdict: 'empty' };
    }

    if (el.length !== al.length) {
      if (al.length < el.length) {
        add('你的输出只有 ' + al.length + ' 行，期望 ' + el.length + ' 行：有内容没打印出来（循环少跑了一轮？分支没进？）');
      } else {
        add('你的输出有 ' + al.length + ' 行，期望只有 ' + el.length + ' 行：多打印了东西（调试用的 printf 忘了删？）');
      }
    }

    /* 逐行扫描，把"差在哪一类"分开数，结论才具体。
       注：行尾空白在 normalize 里已经忽略（判题也不该为它扣分），所以这里不处理。 */
    let onlyCase = 0, onlyFormat = 0, valueWrong = [], fullWidth = 0, debugWord = 0;
    const NUM = /-?\d+(?:\.\d+)?/g;
    for (let i = 0; i < max; i++) {
      const x = el[i], y = al[i];
      if (x == null || y == null || x === y) continue;
      if (x.trim() === y.trim() && x.trim().toLowerCase() === y.trim().toLowerCase()) { onlyCase++; continue; }
      if (/[\u3000\uFF00-\uFFEF]/.test(y) && !/[\u3000\uFF00-\uFFEF]/.test(x)) { fullWidth++; continue; }
      if (x.replace(NUM, '#') === y.replace(NUM, '#')) {
        // 文字骨架一样，只是数字不一样：要么小数位不对，要么算错了
        const dec = (s) => (s.match(/\.\d+/g) || []).map(t => t.length).join(',');
        if (dec(x) !== dec(y) && x.replace(/\.?\d+/g, '#') === y.replace(/\.?\d+/g, '#')) onlyFormat++;
        else valueWrong.push({ n: i + 1, exp: x, act: y });
        continue;
      }
      if (/^[A-Za-z_][\w]*\s*[:=]/.test(y.trim()) && !/^[A-Za-z_][\w]*\s*[:=]/.test(x.trim())) debugWord++;
    }
    if (onlyCase) add('有 ' + onlyCase + ' 行大小写不一致（比如 true / True、OK / ok）。');
    if (onlyFormat) add('有 ' + onlyFormat + ' 行小数位数不对：`%f` 默认 6 位，要两位就写 `%.2f`。');
    if (valueWrong.length) {
      const v = valueWrong[0];
      add('第 ' + v.n + ' 行的数值算错了：期望「' + v.exp + '」，实际「' + v.act + '」。检查初值、循环边界（`<` 还是 `<=`）、整数除法截断。');
    }
    if (fullWidth) add('输出里有全角字符（中文标点、全角空格），题目要的通常是半角。');
    if (debugWord) add('看起来混进了调试输出（`sum=`、`i:` 这种前缀），判题时会算成多输出。');

    /* 顺序问题：行集合一样但顺序不同 */
    if (el.length === al.length && el.length > 1) {
      const se = el.slice().sort().join('\n');
      const sa = al.slice().sort().join('\n');
      if (se === sa && el.join('\n') !== al.join('\n')) {
        add('每行内容都对，但顺序不对：检查遍历方向（正序/逆序）和多层循环的内外层顺序。');
      }
    }

    if (!causes.length && first) add('差别很细，见下面标红的那一列——通常是一个空格、一个字母或一个数字。');

    return {
      same: e === a,
      rows: rows,
      first: first,
      causes: causes,
      verdict: e === a ? 'same' : 'differ'
    };
  }

  /* ══════════════════════ 四、代码自查（不依赖编译器） ══════════════════════ */

  /* 先剥掉字符串和注释，避免把字符串里的中文标点、`printf(";")` 当成代码问题 */
  function stripNoise(code) {
    return String(code || '')
      .replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))
      .replace(/\/\/[^\n]*/g, '')
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      .replace(/'(?:\\.|[^'\\])*'/g, "''");
  }

  function lintCode(code) {
    const out = [];
    if (!String(code || '').trim()) return out;
    const raw = String(code);
    const bare = stripNoise(raw);
    const lines = raw.split('\n');

    // 全角标点（只在剥掉字符串/注释后的代码里找）
    bare.split('\n').forEach((line, i) => {
      if (/[，；：（）【】｛｝“”‘’　]/.test(line)) {
        out.push({
          line: i + 1,
          level: 'error',
          text: '第 ' + (i + 1) + ' 行有全角标点（，；：（）""　）。它们看上去像、但不是 C 的符号，编译器会报 stray 字符。'
        });
      }
    });

    if (/\bvoid\s+main\s*\(/.test(bare)) {
      out.push({ line: 0, level: 'warn', text: '写了 `void main()`。标准写法是 `int main(void)` 并 `return 0;`，交作业时会被扣分。' });
    }
    if (/\bgets\s*\(/.test(bare)) {
      out.push({ line: 0, level: 'error', text: '用了 `gets()`：它不检查长度，C11 已经把它删了。改用 `fgets(buf, sizeof buf, stdin)`。' });
    }
    // scanf 忘了 &
    bare.split('\n').forEach((line, i) => {
      const at = line.indexOf('scanf');
      if (at === -1) return;
      const call = line.slice(at);
      const fm = call.match(/"([^"]*)"/);
      if (!fm) return;
      // %s 传数组名本来就够地址，%*d 是跳过，都不算
      const needAddr = (fm[1].replace(/%%/g, '').match(/%(?![*])[\d]*(?!s)[a-zA-Z]/g) || []).length;
      const ampCount = (call.match(/&/g) || []).length;
      if (needAddr > ampCount) {
        out.push({
          line: i + 1,
          level: 'error',
          text: '第 ' + (i + 1) + ' 行的 `scanf` 漏了 `&`：`scanf("%d", a)` 应该写 `scanf("%d", &a)`，不取地址程序会直接崩。'
        });
      }
    });
    if (/\bif\s*\([^=!<>]*[^=!<>]=[^=][^)]*\)/.test(bare) && !/==/.test(bare)) {
      out.push({ line: 0, level: 'warn', text: '`if` 条件里出现了单个 `=`（赋值），是不是想写 `==`？' });
    }
    if (/\b0\.\d+\s*==|==\s*0\.\d+|\bfloat\b[\s\S]{0,200}?==/.test(bare)) {
      out.push({ line: 0, level: 'warn', text: '浮点数和 `==` 比较几乎永远不成立（0.1+0.2 != 0.3）。改成 `fabs(a-b) < 1e-9`。' });
    }
    if (/\bprintf\b/.test(bare) && !/#include\s*<\s*stdio\.h\s*>/.test(bare)) {
      out.push({ line: 0, level: 'error', text: '用 `printf` 却没 `#include <stdio.h>`，会报 implicit declaration。' });
    }
    if (/\bstr(len|cpy|cmp|cat|ncpy|ncat)\s*\(/.test(bare) && !/#include\s*<\s*string\.h\s*>/.test(bare)) {
      out.push({ line: 0, level: 'error', text: '用了字符串函数却没 `#include <string.h>`。' });
    }
    if (/\bmalloc\s*\(/.test(bare) && !/#include\s*<\s*stdlib\.h\s*>/.test(bare)) {
      out.push({ line: 0, level: 'error', text: '用了 `malloc` 却没 `#include <stdlib.h>`。' });
    }

    return out.filter((v, i, arr) => arr.findIndex(x => x.text === v.text) === i);
  }

  /* ══════════════════════ 五、汇总入口 ══════════════════════ */

  /**
   * 把一次运行的原始结果整理成"给人看"的诊断包。
   */
  function summarizeRun(res, ctx) {
    const pack = { kind: 'ok', title: '', items: [], lint: [], diff: null };
    ctx = ctx || {};

    if (!res) return pack;

    if (res.noCompiler) {
      pack.kind = 'env';
      pack.title = '这台机器上没找到 gcc';
      pack.items.push({ title: '装一个 MinGW-w64', why: '本程序不做假输出，所有结果都来自真编译器，所以必须先有 gcc。', fix: '去 winlibs.com 下 UCRT 版解压，把 `bin` 目录加进 PATH；或装 MSYS2 后 `pacman -S mingw-w64-ucrt-x86_64-gcc`。' });
      return pack;
    }

    if (res.stage === 'compile' || (res.diagnostics && res.diagnostics.some(d => d.severity === 'error'))) {
      pack.kind = 'compile';
      pack.title = '编译没过';
      const errs = (res.diagnostics || []).filter(d => d.severity === 'error');
      const uniq = [];
      for (const d of errs) {
        const e = explainDiagnostic(d);
        if (!e) continue;
        // 同一条建议只说一次
        if (uniq.some(u => u.e.title === e.title)) continue;
        uniq.push({ d: d, e: e });
      }
      pack.items = uniq.map(u => ({
        line: u.d.line,
        title: '第 ' + (u.d.line || '?') + ' 行：' + u.e.title,
        why: u.e.why,
        fix: u.e.fix,
        snippet: u.e.snippet,
        raw: u.d.message
      }));
      pack.lint = lintCode(ctx.code || '');
      return pack;
    }

    /* 注意：只编译不运行的结果里没有 exitCode，别把它当成"异常退出" */
    if (res.ok && (res.timedOut || (res.exitCode != null && res.exitCode !== 0))) {
      const e = explainRun(res);
      pack.kind = 'runtime';
      pack.title = e ? e.title : '程序异常结束';
      if (e) {
        pack.items.push({ line: 0, title: e.title, why: e.why, fix: e.fix, snippet: e.snippet || '', raw: 'exit code ' + res.exitCode });
      }
      pack.lint = lintCode(ctx.code || '');
      return pack;
    }

    if (ctx.expected != null && res.ok) {
      const d = analyzeDiff(ctx.expected, res.stdout || '');
      pack.diff = d;
      if (!d.same) {
        pack.kind = 'answer';
        pack.title = '程序跑通了，但输出和期望不一致';
        pack.items = d.causes.map(c => ({ title: c, why: '', fix: '', snippet: '', raw: '' }));
      }
    }

    if (pack.kind === 'ok') {
      pack.lint = lintCode(ctx.code || '');
      if (pack.lint.length) { pack.kind = 'lint'; pack.title = '跑通了，但代码里有几处隐患'; }
    }
    return pack;
  }

  global.CDiagnose = {
    explainDiagnostic: explainDiagnostic,
    explainRun: explainRun,
    analyzeDiff: analyzeDiff,
    lintCode: lintCode,
    summarizeRun: summarizeRun,
    normalize: normalize,
    showWs: showWs
  };
})(window);
