/* ============================================================
   输入驱动型练习：从 stdin 读数据，判题跑多组用例
   ------------------------------------------------------------
   为什么单独一个文件：
   原来 29 道练习的数据都写死在代码里，只能对一组输出。这几道题改成真读输入，
   判题时一次跑 3 组（正常值 / 边界值 / 负数或空输入），"蒙对一次"就过不了了。

   用例写在题目对象里（cases 字段），expected 是参考答案的真实输出，
   由 tools/verify-judge.js 批量核对——改题库后跑一遍就知道有没有写错。
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.exercises.push(

  /* ---------------- 读输入：统计 ---------------- */
  {
    id: 'ex-io-stats',
    ch: 'c1',
    title: '读入一组数，求最大值与平均值',
    level: '简单',
    tags: ['scanf', '循环', '浮点输出'],
    desc: `
      <h2>题目</h2>
      <p>先读一个整数 <code>n</code>，再读 <code>n</code> 个整数，输出它们的最大值和平均值：</p>
      <pre><code>max = 5
avg = 2.80</code></pre>
      <h2>要求</h2>
      <ul>
        <li>平均值保留两位小数，用 <code>(double)sum / n</code> 算，别用整数除法。</li>
        <li>这题会被 3 组数据分别判一次：5 个数、只有 1 个数、含负数。三组都对才算过。</li>
        <li>输出格式严格一致：等号两边各一个空格。</li>
      </ul>
      <div class="note">读 <code>n</code> 之后循环 <code>n</code> 次，每次 <code>scanf("%d", &x)</code>。最大值不要用 <code>0</code> 初始化——数据全是负数时它就错了。</div>
    `,
    starter: String.raw`#include <stdio.h>

int main(void) {
    int n, x;

    // TODO: 读入 n
    // TODO: 循环读 n 个数，边读边求最大值与总和
    // 提示：max 别用 0 初始化，负数会出错

    // TODO: 输出
    // max = ?
    // avg = ?（两位小数）

    return 0;
}`,
    solution: String.raw`#include <stdio.h>

int main(void) {
    int n, x, max = 0, sum = 0;
    if (scanf("%d", &n) != 1 || n <= 0) return 1;

    for (int i = 0; i < n; i++) {
        if (scanf("%d", &x) != 1) return 1;
        if (i == 0 || x > max) max = x;
        sum += x;
    }
    printf("max = %d\navg = %.2f\n", max, (double)sum / n);
    return 0;
}`,
    cases: [
      { note: '5 个正整数', stdin: '5\n3 1 4 1 5\n', expected: 'max = 5\navg = 2.80' },
      { note: '只有 1 个数（边界）', stdin: '1\n7\n', expected: 'max = 7\navg = 7.00' },
      { note: '含负数（max 初始化容易错）', stdin: '3\n-2 0 2\n', expected: 'max = 2\navg = 0.00' }
    ],
    hints: [
      '`scanf("%d", &x)` 每读一个判断一次；读失败直接 return 1。',
      '`max` 用第一个数初始化，或者用 `i == 0 || x > max` 兜住。',
      '`(double)sum / n` 里那个强制转换不能省，否则 10/4 会被截成 2。'
    ]
  },

  /* ---------------- 读一行：字符分类 ---------------- */
  {
    id: 'ex-io-count',
    ch: 'c1',
    title: '统计一行里的字母、数字和其它字符',
    level: '简单',
    tags: ['fgets', '字符判断', 'ctype'],
    desc: `
      <h2>题目</h2>
      <p>读入<strong>一整行</strong>（可能含空格），统计里面字母、数字、其它字符各有多少个：</p>
      <pre><code>letters = 10
digits = 3
others = 3</code></pre>
      <h2>要求</h2>
      <ul>
        <li>用 <code>fgets</code> 读整行，不能用 <code>scanf("%s")</code>——它遇到空格就停。</li>
        <li><code>fgets</code> 会把行尾的 <code>\\n</code> 也读进来，统计前先去掉，否则换行会被算成"其它"。</li>
        <li>判题会跑 3 组：含空格的长句、纯字母数字、只有空格。</li>
      </ul>
      <div class="note">判断字符类别可以自己写 <code>(c >= 'a' &amp;&amp; c &lt;= 'z')</code>，也可以 <code>#include &lt;ctype.h&gt;</code> 用 <code>isalpha</code> / <code>isdigit</code>。</div>
    `,
    starter: String.raw`#include <stdio.h>

int main(void) {
    char s[256];
    int letters = 0, digits = 0, others = 0;

    // TODO: 用 fgets 读一行
    // TODO: 去掉结尾的换行
    // TODO: 逐字符分类计数

    printf("letters = %d\ndigits = %d\nothers = %d\n", letters, digits, others);
    return 0;
}`,
    solution: String.raw`#include <stdio.h>
#include <string.h>
#include <ctype.h>

int main(void) {
    char s[256];
    int letters = 0, digits = 0, others = 0;

    if (!fgets(s, sizeof s, stdin)) return 1;
    s[strcspn(s, "\n")] = '\0';       /* 去掉行尾换行 */

    for (int i = 0; s[i] != '\0'; i++) {
        unsigned char c = (unsigned char)s[i];
        if (isalpha(c))      letters++;
        else if (isdigit(c)) digits++;
        else                 others++;
    }
    printf("letters = %d\ndigits = %d\nothers = %d\n", letters, digits, others);
    return 0;
}`,
    cases: [
      { note: '含空格与标点', stdin: 'Hello World 123!\n', expected: 'letters = 10\ndigits = 3\nothers = 3' },
      { note: '纯字母数字', stdin: 'C99\n', expected: 'letters = 1\ndigits = 2\nothers = 0' },
      { note: '只有空格（边界）', stdin: '  \n', expected: 'letters = 0\ndigits = 0\nothers = 2' }
    ],
    hints: [
      '`fgets(s, sizeof s, stdin)` 的第二个参数是缓冲区大小，别写成 256 和数组长度不一致。',
      '`s[strcspn(s, "\\n")] = 0;` 是去掉换行的常用写法，`strcspn` 在 `<string.h>` 里。',
      '`isalpha` 的入参要用 `unsigned char`，直接传负的 `char` 是未定义行为。'
    ]
  },

  /* ---------------- 读数组：逆序输出 ---------------- */
  {
    id: 'ex-io-reverse',
    ch: 'c1',
    title: '读入 n 个数，逆序输出',
    level: '简单',
    tags: ['scanf', '数组', '格式控制'],
    desc: `
      <h2>题目</h2>
      <p>读入 <code>n</code> 和 <code>n</code> 个整数，把它们<strong>逆序</strong>输出，数字之间一个空格，<strong>行末不能有空格</strong>。</p>
      <pre><code>输入：5
      1 2 3 4 5
输出：5 4 3 2 1</code></pre>
      <h2>要求</h2>
      <ul>
        <li>必须真的倒着输出（或者原地逆置），不能提前知道自己会遇到什么数据。</li>
        <li>行末不能多空格——很多判题平台会为这个扣分。</li>
        <li>判题会跑：5 个数、1 个数、含负数三组。</li>
      </ul>
      <div class="note">行末去空格的常用写法：<code>for (i = n-1; i &gt;= 0; i--) printf(i ? "%d " : "%d", a[i]);</code></div>
    `,
    starter: String.raw`#include <stdio.h>
#define MAXN 100

int main(void) {
    int n, a[MAXN];

    // TODO: 读 n
    // TODO: 读 n 个数到 a[]
    // TODO: 从后往前输出，最后一个数字后面不要空格

    printf("\n");
    return 0;
}`,
    solution: String.raw`#include <stdio.h>
#define MAXN 100

int main(void) {
    int n, a[MAXN];
    if (scanf("%d", &n) != 1 || n <= 0 || n > MAXN) return 1;
    for (int i = 0; i < n; i++)
        if (scanf("%d", &a[i]) != 1) return 1;

    for (int i = n - 1; i >= 0; i--)
        printf(i ? "%d " : "%d", a[i]);
    printf("\n");
    return 0;
}`,
    cases: [
      { note: '5 个数', stdin: '5\n1 2 3 4 5\n', expected: '5 4 3 2 1' },
      { note: '只有 1 个（边界）', stdin: '1\n42\n', expected: '42' },
      { note: '含负数', stdin: '3\n-1 0 1\n', expected: '1 0 -1' }
    ],
    hints: [
      '倒着输出的循环是 `for (int i = n - 1; i >= 0; i--)`，注意 `i >= 0` 而不是 `i > 0`。',
      '空格问题：最后一项（i == 0）不打印空格，所以用 `i ? "%d " : "%d"`。'
    ]
  },

  /* ---------------- 读输入：筛素数 ---------------- */
  {
    id: 'ex-io-primes',
    ch: 'c1',
    title: '输出 2..n 之间的所有素数',
    level: '中等',
    tags: ['循环', '素数', '边界'],
    desc: `
      <h2>题目</h2>
      <p>读入一个整数 <code>n</code>（n ≥ 2），把 <code>2..n</code> 之间的素数<strong>每行一个</strong>输出，最后再输出个数：</p>
      <pre><code>输入：10
输出：2
      3
      5
      7
      count = 4</code></pre>
      <h2>要求</h2>
      <ul>
        <li>判断素数用试除法，试到 <code>i * i &lt;= x</code> 就够，不用试到 x。</li>
        <li>注意 2 是素数，1 不是；<code>n = 2</code> 时也要正常输出。</li>
        <li>判题会跑 n = 10、n = 2（边界）、n = 20 三组。</li>
      </ul>
      <div class="note">试除法的典型错误是把 <code>for (j = 2; j &lt; i; j++)</code> 写成 <code>j &lt;= i</code>，那样每个数都会被自己整除。</div>
    `,
    starter: String.raw`#include <stdio.h>

int main(void) {
    int n;
    // TODO: 读 n
    // TODO: 对 2..n 每个数判断是否素数，是就输出并计数
    // TODO: 输出 count = ?
    return 0;
}`,
    solution: String.raw`#include <stdio.h>

int isPrime(int x) {
    if (x < 2) return 0;
    for (int d = 2; d * d <= x; d++)
        if (x % d == 0) return 0;
    return 1;
}

int main(void) {
    int n, count = 0;
    if (scanf("%d", &n) != 1) return 1;
    for (int i = 2; i <= n; i++) {
        if (isPrime(i)) { printf("%d\n", i); count++; }
    }
    printf("count = %d\n", count);
    return 0;
}`,
    cases: [
      { note: 'n = 10', stdin: '10\n', expected: '2\n3\n5\n7\ncount = 4' },
      { note: 'n = 2（边界）', stdin: '2\n', expected: '2\ncount = 1' },
      { note: 'n = 20', stdin: '20\n', expected: '2\n3\n5\n7\n11\n13\n17\n19\ncount = 8' }
    ],
    hints: [
      '单独写一个 `isPrime(x)` 函数，主循环只管遍历，逻辑最清楚。',
      '`d * d <= x` 比 `d <= sqrt(x)` 省事，也不用 include math.h。',
      '计数变量 `count` 要初始化为 0，并且每找到一个素数就 `count++`。'
    ]
  }

  );
})();
