/* ============================================================
   第 4 章：串与 KMP    第 5 章：树与二叉树
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  /* ══════════════════════════ 第 4 章 ══════════════════════════ */
  {
    id: 'd-string',
    ch: 'c4',
    title: '串：存储结构与朴素匹配',
    tag: '必学',
    brief: '串就是字符的线性表。朴素匹配 O(nm)，KMP 优化到 O(n+m)。',
    tags: ['串', '字符串匹配', 'BF算法', '朴素匹配', '模式串'],
    body: `
      <h2>串的存储</h2>
      <ul>
        <li><strong>定长顺序存储</strong>：<code>char ch[MAXLEN]; int length;</code>，长度固定。</li>
        <li><strong>堆分配存储</strong>：<code>malloc</code> 一段连续空间，长度可变（最常用）。</li>
        <li><strong>块链存储</strong>：每个结点存多个字符，最后一个可能不满。考研偶尔考"存储密度"。</li>
      </ul>

      <h2>朴素匹配（BF，Brute Force）</h2>
      <p>主串 S、模式串 T。从 S 的每个位置开始，逐个字符和 T 比，不匹配就<strong>回退到本趟起点的下一个位置</strong>重新开始。</p>
      <pre><code>for (i = 1; i &lt;= n - m + 1; i++) {
    for (j = 1; j &lt;= m; j++)
        if (S[i+j-1] != T[j]) break;
    if (j &gt; m) return i;        // 匹配成功
}</code></pre>

      <h2>复杂度账本</h2>
      <table>
        <tr><th></th><th>最好</th><th>最坏</th><th>平均</th></tr>
        <tr><td>BF</td><td>O(m)</td><td>O(n·m)</td><td>O(n·m)</td></tr>
        <tr><td>KMP</td><td>O(n+m)</td><td>O(n+m)</td><td>O(n+m)</td></tr>
      </table>
      <p>最坏情况长什么样：主串 <code>aaaaaaaab</code>，模式串 <code>aaab</code>。每一趟都要比到最后一个字符才发现不对，然后只前进一位，前功尽弃。</p>

      <h2>BF 到底浪费在哪</h2>
      <p>前面已经比较过的那些字符，其实已经告诉你"模式串的某个前缀和主串的某段相等"。BF 把这个信息全丢了，每次从头再来。<strong>KMP 的全部价值就是：把这部分信息记住，让主串指针不回退。</strong></p>
      <div class="note">下面代码把 BF 的每一趟比较都打出来了，你能直观看到"回退"有多浪费。往下看就明白 KMP 想解决什么。</div>
    `,
    code: `#include <stdio.h>
#include <string.h>

// 朴素匹配：返回第一次出现的下标（0 开始），找不到返回 -1
int bf_match(const char *s, const char *t, int verbose) {
    int n = (int)strlen(s);
    int m = (int)strlen(t);
    int compares = 0;

    for (int i = 0; i <= n - m; i++) {
        int j = 0;
        while (j < m) {
            compares++;
            if (s[i + j] != t[j]) break;
            j++;
        }
        if (verbose)
            printf("  第 %d 趟（从 S[%d] 开始）：比了 %d 个字符，%s\\n",
                   i + 1, i, j, j == m ? "匹配成功" : "失配，回退");
        if (j == m) {
            if (verbose) printf("  总共比较 %d 次\\n", compares);
            return i;
        }
    }
    if (verbose) printf("  总共比较 %d 次，未找到\\n", compares);
    return -1;
}

int main(void) {
    printf("== 匹配成功 ==\\n");
    const char *S1 = "ababcabcacbab";
    const char *T1 = "abcac";
    printf("主串：%s\\n模式：%s\\n", S1, T1);
    int pos = bf_match(S1, T1, 1);
    printf("结果：下标 %d\\n\\n", pos);

    printf("== 最坏情况（大量重复字符）==\\n");
    const char *S2 = "aaaaaaaaab";
    const char *T2 = "aaab";
    printf("主串：%s\\n模式：%s\\n", S2, T2);
    pos = bf_match(S2, T2, 0);
    printf("结果：下标 %d\\n", pos);
    printf("主串长度 %zu，模式长度 %zu，最坏比较次数接近 %zu × %zu = %zu\\n",
           strlen(S2), strlen(T2), strlen(S2), strlen(T2), strlen(S2) * strlen(T2));
    printf("\\n这就是 KMP 要解决的问题：主串指针不要回退。\\n");
    return 0;
}`,
    tips: [
      '写 BF 时外层循环条件是 `i <= n - m`，写成 `i < n` 会越界。',
      '`strstr()` 就是标准库里的串匹配，底层实现通常是优化过的（glibc 用 Two-Way 算法）。'
    ],
    traps: [
      '字符串下标从 0 开始，但教材算法常从 1 开始，混用会导致差一错误。',
      '模式串为空时 `n - m` 会出问题，实际工程里要先判空。'
    ]
  },

  {
    id: 'd-kmp',
    ch: 'c4',
    title: 'KMP 与 next 数组：不回溯的秘密',
    tag: '重点·难点',
    brief: 'next[j] = 模式串前 j-1 个字符里，最长相等前后缀的长度。',
    tags: ['KMP', 'next数组', '前缀', '后缀', '失配', '字符串匹配'],
    body: `
      <h2>核心思想一句话</h2>
      <p>失配时，主串指针 <code>i</code> 不动，模式串指针 <code>j</code> 跳到 <code>next[j]</code>。因为我们已经知道模式串前 <code>j-1</code> 个字符和主串刚才那段相等，而这段里有一部分前缀和后缀相同，可以直接复用。</p>

      <h2>next 数组怎么手算（考试必考）</h2>
      <p><code>next[j]</code> 的含义：<strong>模式串的前 j-1 个字符中，最长的"相等前后缀"的长度，再加 1</strong>（教材用 1 开始下标）。</p>
      <p>举例，模式串 <code>abaabc</code>（下标从 1 开始）：</p>
      <table>
        <tr><th>j</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th></tr>
        <tr><td>字符</td><td>a</td><td>b</td><td>a</td><td>a</td><td>b</td><td>c</td></tr>
        <tr><td>next</td><td>0</td><td>1</td><td>1</td><td>2</td><td>2</td><td>3</td></tr>
      </table>
      <ul>
        <li>j=1：固定为 0。</li>
        <li>j=2：前 1 个字符 <code>a</code>，没有真前缀/后缀 → 1。</li>
        <li>j=3：前 2 个 <code>ab</code>，前后缀无相等 → 1。</li>
        <li>j=4：前 3 个 <code>aba</code>，前缀 <code>a</code> = 后缀 <code>a</code>，长度 1 → 1+1 = 2。</li>
        <li>j=5：前 4 个 <code>abaa</code>，最长相等前后缀 <code>a</code>，长度 1 → 2。</li>
        <li>j=6：前 5 个 <code>abaab</code>，前缀 <code>ab</code> = 后缀 <code>ab</code>，长度 2 → 3。</li>
      </ul>
      <div class="warn">不同教材的 next 定义差 1（有的用 -1 开头、有的用 0 开头）。<strong>考试按你教材的来，代码按你的实现来</strong>，别混。本课代码用"0 开始下标 + next[0] = -1"这套，最通用。</div>

      <h2>求 next 的代码（本质是自己和自己匹配）</h2>
      <pre><code>next[0] = -1;  i = 0;  j = -1;
while (i &lt; m - 1) {
    if (j == -1 || t[i] == t[j]) { i++; j++; next[i] = j; }
    else j = next[j];
}</code></pre>
      <p>看懂了会很爽：<code>j</code> 其实是"当前已知的最长相等前后缀长度"，失配时让 <code>j</code> 回退到 <code>next[j]</code> 继续试。</p>

      <h2>复杂度</h2>
      <p>求 next <span class="complexity">O(m)</span>，匹配 <span class="complexity">O(n)</span>，总共 O(n+m)。因为 <code>i</code> 从不回退，<code>j</code> 每次失配至少减小 1，总减小次数不超过总增加次数。</p>
    `,
    code: `#include <stdio.h>
#include <string.h>

// 求 next 数组（0 开始下标，next[0] = -1）
void get_next(const char *t, int *next, int m) {
    int i = 0, j = -1;
    next[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) {
            i++;
            j++;
            next[i] = j;
        } else {
            j = next[j];
        }
    }
}

// nextval：优化的 next，连续相同字符时跳过（考试常问）
void get_nextval(const char *t, int *nextval, int m) {
    int i = 0, j = -1;
    nextval[0] = -1;
    while (i < m - 1) {
        if (j == -1 || t[i] == t[j]) {
            i++;
            j++;
            if (t[i] != t[j]) nextval[i] = j;
            else              nextval[i] = nextval[j];
        } else {
            j = nextval[j];
        }
    }
}

// KMP 匹配，返回首次出现的下标
int kmp(const char *s, const char *t, int *next, int *cmpCount) {
    int n = (int)strlen(s), m = (int)strlen(t);
    int i = 0, j = 0, cmp = 0;
    while (i < n && j < m) {
        cmp++;
        if (j == -1 || s[i] == t[j]) {
            i++;
            j++;
        } else {
            j = next[j];
        }
    }
    if (cmpCount) *cmpCount = cmp;
    return j == m ? i - m : -1;
}

void print_arr(const char *name, const char *t, int *arr, int m) {
    printf("%s  : ", name);
    for (int i = 0; i < m; i++) printf("%2c", t[i]);
    printf("\\n");
    printf("%s  : ", name);
    for (int i = 0; i < m; i++) printf("%2d", i);
    printf("\\n");
    printf("next  : ");
    for (int i = 0; i < m; i++) printf("%2d", arr[i]);
    printf("\\n");
}

int main(void) {
    const char *T = "abaabc";
    int m = (int)strlen(T);
    int next[64], nextval[64];

    get_next(T, next, m);
    get_nextval(T, nextval, m);

    printf("模式串：%s\\n", T);
    printf("下标  : ");
    for (int i = 0; i < m; i++) printf("%2d", i);
    printf("\\n字符  : ");
    for (int i = 0; i < m; i++) printf("%2c", T[i]);
    printf("\\nnext  : ");
    for (int i = 0; i < m; i++) printf("%2d", next[i]);
    printf("\\nnextval: ");
    for (int i = 0; i < m; i++) printf("%2d", nextval[i]);
    printf("\\n");

    printf("\\n== 匹配测试 ==\\n");
    const char *S = "ababcabaabc";
    int cmp = 0;
    int pos = kmp(S, T, next, &cmp);
    printf("主串：%s\\n", S);
    printf("模式：%s\\n", T);
    printf("KMP 结果：下标 %d，比较了 %d 次\\n", pos, cmp);

    // 对比朴素匹配
    int naiveCmp = 0, found = -1;
    for (int i = 0; i + m <= (int)strlen(S); i++) {
        int j = 0;
        while (j < m) { naiveCmp++; if (S[i + j] != T[j]) break; j++; }
        if (j == m) { found = i; break; }
    }
    printf("BF  结果：下标 %d，比较了 %d 次\\n", found, naiveCmp);
    printf("省了 %d 次比较\\n", naiveCmp - cmp);

    printf("\\n== 最坏情况对比 ==\\n");
    const char *S2 = "aaaaaaaaab";
    const char *T2 = "aaab";
    int m2 = (int)strlen(T2);
    int next2[16];
    get_next(T2, next2, m2);
    int c1 = 0, c2 = 0;
    int p1 = kmp(S2, T2, next2, &c1);
    for (int i = 0; i + m2 <= (int)strlen(S2); i++) {
        int j = 0;
        while (j < m2) { c2++; if (S2[i + j] != T2[j]) break; j++; }
        if (j == m2) break;
    }
    printf("KMP: 下标 %d，比较 %d 次\\nBF : 比较 %d 次\\n", p1, c1, c2);
    return 0;
}`,
    tips: [
      '手算 next 时列表格：写出每个 j 前面那段字符串，然后找"最长的相等前后缀"，别在脑子里硬想。',
      '`next[0] = -1` 这个设计很妙：它让"第一个字符就失配"也能统一处理（j=-1 时 i、j 同时加）。'
    ],
    traps: [
      '把 next 理解成"前缀函数"时注意它存的是长度还是下标，混了就会全错一位。',
      'nextval 只有在连续相同字符时才有优化效果，别以为它永远更快。'
    ],
    exercises: ['ex-kmp-next']
  },

  /* ══════════════════════════ 第 5 章 ══════════════════════════ */
  {
    id: 'd-tree-basic',
    ch: 'c5',
    title: '树的概念与二叉树五个性质',
    tag: '必学·重点',
    brief: 'n₀ = n₂ + 1 这个公式，考试能直接换 5 分。',
    tags: ['树', '二叉树', '性质', '结点', '度', '完全二叉树', '满二叉树'],
    body: `
      <h2>基本术语</h2>
      <ul>
        <li><strong>度</strong>：结点拥有的子树个数。二叉树每个结点度 ≤ 2。</li>
        <li><strong>层</strong>：根是第 1 层。<strong>深度/高度</strong>：最大层数。</li>
        <li><strong>满二叉树</strong>：每层都满，第 k 层有 2^(k-1) 个结点。</li>
        <li><strong>完全二叉树</strong>：只有最后一层可以不满，且靠左连续排列。它就是"用数组存树不浪费空间"的那种树。</li>
      </ul>

      <h2>二叉树五个性质（背下来）</h2>
      <table>
        <tr><th>编号</th><th>性质</th><th>说明</th></tr>
        <tr><td>1</td><td>第 i 层最多 2^(i-1) 个结点</td><td>i 从 1 开始</td></tr>
        <tr><td>2</td><td>深度 h 的二叉树最多 2^h − 1 个结点</td><td>满二叉树时取到</td></tr>
        <tr><td>3</td><td><strong>n₀ = n₂ + 1</strong></td><td>叶子数 = 度为 2 的结点数 + 1</td></tr>
        <tr><td>4</td><td>n 个结点的完全二叉树深度 = ⌊log₂n⌋ + 1</td><td>向下取整</td></tr>
        <tr><td>5</td><td>完全二叉树按层编号，结点 i 的左孩子 2i、右孩子 2i+1、父 ⌊i/2⌋</td><td>数组存储的基础</td></tr>
      </table>

      <h2>n₀ = n₂ + 1 怎么推（考点）</h2>
      <p>设 n₀、n₁、n₂ 分别是度为 0、1、2 的结点数：</p>
      <ul>
        <li>结点总数 <code>n = n₀ + n₁ + n₂</code></li>
        <li>边数 <code>n - 1</code>（树的性质：n 个结点 n-1 条边）</li>
        <li>边数也等于 <code>n₁ + 2n₂</code>（每个度为 1 的贡献 1 条，度为 2 的贡献 2 条）</li>
      </ul>
      <p>联立：<code>n₀ + n₁ + n₂ - 1 = n₁ + 2n₂</code> → <code>n₀ = n₂ + 1</code>。<strong>推导过程也要会写。</strong></p>

      <h2>典型考题</h2>
      <ul>
        <li>一棵二叉树有 10 个度为 2 的结点，5 个度为 1 的结点，问叶子数？→ n₀ = 10+1 = 11。</li>
        <li>n 个结点的完全二叉树有多少叶子？→ 从 ⌊n/2⌋+1 到 n 都是叶子，共 <code>n − ⌊n/2⌋</code> 个。</li>
        <li>1000 个结点的完全二叉树高度？→ ⌊log₂1000⌋ + 1 = 9 + 1 = 10。</li>
      </ul>
      <div class="note">下面代码把前四个性质都验证了一遍，用真实建树来数，比背公式直观。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <math.h>

typedef struct Node {
    int data;
    struct Node *left, *right;
} Node;

Node *newNode(int v) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = v;
    n->left = n->right = NULL;
    return n;
}

// 统计：n0 叶子，n1 度为1，n2 度为2，h 高度
void stats(Node *root, int *n0, int *n1, int *n2, int depth, int *height) {
    if (!root) return;
    int deg = (root->left ? 1 : 0) + (root->right ? 1 : 0);
    if (deg == 0) (*n0)++;
    else if (deg == 1) (*n1)++;
    else (*n2)++;
    if (depth > *height) *height = depth;
    stats(root->left, n0, n1, n2, depth + 1, height);
    stats(root->right, n0, n1, n2, depth + 1, height);
}

int count(Node *root) {
    if (!root) return 0;
    return 1 + count(root->left) + count(root->right);
}

int main(void) {
    /*        1
             / \\
            2   3
           / \\   \\
          4   5   6
             /
            7            */
    Node *root = newNode(1);
    root->left = newNode(2);
    root->right = newNode(3);
    root->left->left = newNode(4);
    root->left->right = newNode(5);
    root->right->right = newNode(6);
    root->left->right->left = newNode(7);

    int n0 = 0, n1 = 0, n2 = 0, h = 0;
    stats(root, &n0, &n1, &n2, 1, &h);
    int n = count(root);

    printf("结点总数 n  = %d\\n", n);
    printf("叶子 n0     = %d\\n", n0);
    printf("度 1 的 n1  = %d\\n", n1);
    printf("度 2 的 n2  = %d\\n", n2);
    printf("高度 h      = %d\\n", h);
    printf("\\n验证 n0 + n1 + n2 = %d （应等于 n=%d）\\n", n0 + n1 + n2, n);
    printf("验证 n0 = n2 + 1  ：%d = %d + 1 %s\\n", n0, n2, (n0 == n2 + 1) ? "成立" : "不成立");

    printf("\\n== 完全二叉树的性质（用数组下标模拟）==\\n");
    printf("n=10 的完全二叉树：\\n");
    int N = 10;
    printf("  高度 = floor(log2(%d)) + 1 = %d\\n", N, (int)floor(log2(N)) + 1);
    printf("  叶子数 = n - floor(n/2) = %d - %d = %d\\n", N, N / 2, N - N / 2);
    printf("  按层编号，结点 i 的左孩子 2i、右孩子 2i+1：\\n");
    for (int i = 1; i <= 3; i++) {
        printf("    结点 %d -> 左 %d, 右 %d, 父 %d\\n",
               i, 2 * i, 2 * i + 1, i / 2);
    }
    printf("\\n这些性质不是背的，是用「每个结点最多 2 个孩子」推出来的。\\n");
    return 0;
}`,
    tips: [
      '看到"度为 2 的结点数"就直接想 n₀ = n₂ + 1，能省大量时间。',
      '完全二叉树的性质用「编号 1..n」那套去套，比画图快。'
    ],
    traps: [
      '满二叉树和完全二叉树是两个概念，满的一定是完全的，完全的不一定满。',
      '深度从 1 开始，高度也是从 1 开始；空树深度是 0。别用 0 开始算然后对不上答案。'
    ],
    exercises: ['ex-tree-props']
  },

  {
    id: 'd-tree-store',
    ch: 'c5',
    title: '二叉树的存储：顺序 vs 二叉链表',
    tag: '必学',
    brief: '完全二叉树用数组；一般二叉树用 left/right 指针。',
    tags: ['顺序存储', '二叉链表', '孩子兄弟表示法', '存储结构'],
    body: `
      <h2>顺序存储</h2>
      <p>按完全二叉树的编号把结点放进数组：<code>tree[i]</code> 的左右孩子是 <code>tree[2i]</code> 和 <code>tree[2i+1]</code>。</p>
      <ul>
        <li>完全二叉树：完美，一点空间都不浪费。</li>
        <li>一般二叉树（尤其单支树）：<strong>可能浪费大量空间</strong>。深度为 h 的单支树，数组要开 2^h−1 个位置，实际只有 h 个结点。</li>
      </ul>
      <p>所以顺序存储适合<strong>完全二叉树</strong>（堆就是典型，第 8 章堆排序会用）。</p>

      <h2>二叉链表（最常用）</h2>
      <pre><code>typedef struct BiTNode {
    int data;
    struct BiTNode *lchild, *rchild;
} BiTNode, *BiTree;</code></pre>
      <p>n 个结点有 2n 个指针域，其中 n-1 条边用掉了 n-1 个，剩下 <strong>n+1 个空指针</strong>。这个数字就是线索二叉树能利用的空间。</p>

      <h2>三叉链表</h2>
      <p>再加一个 <code>parent</code> 指针指向父结点，方便往上找。代价是多 8 字节/结点。</p>

      <h2>孩子兄弟表示法（树 → 二叉树）</h2>
      <p>一般的树（每个结点可以有任意多个孩子）怎么存？用"左孩子右兄弟"：</p>
      <pre><code>typedef struct CSNode {
    int data;
    struct CSNode *firstchild;   // 第一个孩子
    struct CSNode *nextsibling;  // 下一个兄弟
} CSNode;</code></pre>
      <p>这样任意树都能转成二叉树，而且<strong>转换后根结点没有右子树</strong>——这是"树转二叉树"的判据。</p>

      <h2>森林转二叉树</h2>
      <p>每棵树的根互为兄弟，连成一串。转换后根结点<strong>有</strong>右子树，右子树是第二棵树。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAXN 32

typedef struct BiTNode {
    int data;
    struct BiTNode *lchild, *rchild;
} BiTNode, *BiTree;

BiTNode *newNode(int v) {
    BiTNode *n = (BiTNode *)malloc(sizeof(BiTNode));
    n->data = v;
    n->lchild = n->rchild = NULL;
    return n;
}

/* 顺序存储：用 -1 表示空，按完全二叉树编号 */
void print_array_tree(const int *a, int n) {
    printf("数组：[");
    for (int i = 1; i <= n; i++) printf("%d%s", a[i], i == n ? "" : " ");
    printf("]\\n");
    printf("逻辑结构：\\n");
    for (int i = 1; i <= n; i++) {
        if (a[i] == -1) continue;
        printf("  %d", a[i]);
        if (2 * i <= n && a[2 * i] != -1) printf(" 的左孩子=%d", a[2 * i]);
        if (2 * i + 1 <= n && a[2 * i + 1] != -1) printf(" 的右孩子=%d", a[2 * i + 1]);
        printf("\\n");
    }
}

/* 统计空指针域 */
int count_null(BiTree root) {
    if (!root) return 0;
    int cnt = 0;
    if (!root->lchild) cnt++;
    if (!root->rchild) cnt++;
    return cnt + count_null(root->lchild) + count_null(root->rchild);
}
int count_node(BiTree root) {
    if (!root) return 0;
    return 1 + count_node(root->lchild) + count_node(root->rchild);
}

int main(void) {
    printf("== 顺序存储（完全二叉树）==\\n");
    //     1
    //   2   3
    //  4 5 6
    int arr[MAXN] = {0, 1, 2, 3, 4, 5, 6};
    print_array_tree(arr, 6);
    printf("  数组下标就是编号，父子关系靠 2i / 2i+1 算出来\\n");

    printf("\\n== 顺序存储的浪费（单支树）==\\n");
    int bad[MAXN] = {0, 1, -1, 2, -1, -1, -1, 3};
    printf("深度 3 的单支树，数组要开到 %d：", 7);
    print_array_tree(bad, 7);
    printf("  只有 3 个结点，却占了 7 个位置——这就是一般二叉树不适合顺序存储的原因\\n");

    printf("\\n== 二叉链表 ==\\n");
    BiTree root = newNode(1);
    root->lchild = newNode(2);
    root->rchild = newNode(3);
    root->lchild->lchild = newNode(4);
    root->lchild->rchild = newNode(5);
    root->rchild->rchild = newNode(6);

    int n = count_node(root);
    printf("结点数 n = %d\\n", n);
    printf("指针域总数 2n = %d\\n", 2 * n);
    printf("实际用掉的边 = n-1 = %d\\n", n - 1);
    printf("空指针域 = n+1 = %d，实测 = %d\\n", n + 1, count_null(root));
    printf("\\n线索二叉树就是把这 %d 个空指针利用起来，指向前驱/后继。\\n", count_null(root));
    return 0;
}`,
    tips: [
      '考试常考"n 个结点的二叉链表有多少空指针" → n+1，记住这个结论。',
      '堆（第 8 章）就是顺序存储 + 完全二叉树，所以下标计算要非常熟。'
    ],
    traps: [
      '顺序存储里数组下标从 1 开始才好用 2i/2i+1 公式；从 0 开始公式要改成 2i+1/2i+2，很容易混。',
      '单支树用顺序存储非常浪费，不要以为"数组存树一定省空间"。'
    ]
  },

  {
    id: 'd-tree-traverse',
    ch: 'c5',
    title: '四种遍历：前序、中序、后序、层序',
    tag: '必学·重点',
    brief: '前中后序是递归三行代码的顺序问题，层序用队列。',
    tags: ['遍历', '前序', '中序', '后序', '层序', '递归', '非递归'],
    body: `
      <h2>看名字就知道顺序</h2>
      <ul>
        <li><strong>前序</strong>：根 → 左 → 右</li>
        <li><strong>中序</strong>：左 → 根 → 右</li>
        <li><strong>后序</strong>：左 → 右 → 根</li>
      </ul>
      <p>三种遍历的递归代码<strong>只差三行语句的位置</strong>：</p>
      <pre><code>void preorder(Node *p) { if (!p) return; visit(p); preorder(p-&gt;l); preorder(p-&gt;r); }
void inorder(Node *p)  { if (!p) return; inorder(p-&gt;l); visit(p); inorder(p-&gt;r); }
void postorder(Node *p){ if (!p) return; postorder(p-&gt;l); postorder(p-&gt;r); visit(p); }</code></pre>
      <div class="note">递归的关键是「只考虑当前结点做什么，剩下的交给递归」。想清楚 <code>visit</code> 该在哪一行，三种遍历就都会了。</div>

      <h2>层序遍历（队列）</h2>
      <p>根入队 → 出队访问 → 左右孩子入队 → 循环。这个顺序天然就是"一层一层"。</p>
      <pre><code>Q.push(root);
while (!Q.empty()) {
    p = Q.pop(); visit(p);
    if (p-&gt;l) Q.push(p-&gt;l);
    if (p-&gt;r) Q.push(p-&gt;r);
}</code></pre>

      <h2>非递归遍历（栈）</h2>
      <p>中序非递归最典型，思路：<strong>一路向左压栈，到底就弹一个访问，然后转向右子树</strong>。</p>
      <pre><code>while (p || !st.empty()) {
    if (p) { st.push(p); p = p-&gt;l; }
    else   { p = st.pop(); visit(p); p = p-&gt;r; }
}</code></pre>
      <p>这个模板把递归的"系统栈"换成了"自己的栈"，面试经常要求手写。</p>

      <h2>三种序列的用途</h2>
      <table>
        <tr><th>遍历</th><th>典型用途</th></tr>
        <tr><td>前序</td><td>复制树、输出目录结构、序列化</td></tr>
        <tr><td>中序</td><td>BST 的中序是<b>有序序列</b>（第 42 课要用）</td></tr>
        <tr><td>后序</td><td>释放内存、算表达式树的值、算子树高度</td></tr>
        <tr><td>层序</td><td>求宽度、按层打印、判断完全二叉树</td></tr>
      </table>
      <div class="warn">释放二叉树必须用后序（先释放孩子再释放自己），用前序会先把自己 free 掉，然后访问 <code>p-&gt;lchild</code> 就是野指针。这个坑很经典。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *l, *r;
} Node;

Node *newNode(int v) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = v;
    n->l = n->r = NULL;
    return n;
}

/* ---------- 递归三兄弟 ---------- */
void preorder(Node *p) {
    if (!p) return;
    printf("%d ", p->data);
    preorder(p->l);
    preorder(p->r);
}
void inorder(Node *p) {
    if (!p) return;
    inorder(p->l);
    printf("%d ", p->data);
    inorder(p->r);
}
void postorder(Node *p) {
    if (!p) return;
    postorder(p->l);
    postorder(p->r);
    printf("%d ", p->data);
}

/* ---------- 层序（数组当队列）---------- */
void levelorder(Node *root) {
    if (!root) return;
    Node *q[64];
    int head = 0, tail = 0;
    q[tail++] = root;
    while (head < tail) {
        Node *p = q[head++];
        printf("%d ", p->data);
        if (p->l) q[tail++] = p->l;
        if (p->r) q[tail++] = p->r;
    }
}

/* ---------- 中序非递归（显式栈）---------- */
void inorder_iter(Node *root) {
    Node *stack[64];
    int top = -1;
    Node *p = root;
    while (p || top >= 0) {
        if (p) {
            stack[++top] = p;     // 一路向左压栈
            p = p->l;
        } else {
            p = stack[top--];     // 弹出访问
            printf("%d ", p->data);
            p = p->r;             // 转向右子树
        }
    }
}

/* ---------- 前序非递归 ---------- */
void preorder_iter(Node *root) {
    if (!root) return;
    Node *stack[64];
    int top = -1;
    stack[++top] = root;
    while (top >= 0) {
        Node *p = stack[top--];
        printf("%d ", p->data);
        if (p->r) stack[++top] = p->r;   // 先压右，后压左
        if (p->l) stack[++top] = p->l;   // 这样左先出
    }
}

/* ---------- 后序释放（必须后序）---------- */
void destroy(Node *p) {
    if (!p) return;
    destroy(p->l);
    destroy(p->r);
    free(p);
}

int height(Node *p) {
    if (!p) return 0;
    int hl = height(p->l), hr = height(p->r);
    return (hl > hr ? hl : hr) + 1;
}

int main(void) {
    /*        1
             / \\
            2   3
           / \\   \\
          4   5   6
             /
            7
    */
    Node *root = newNode(1);
    root->l = newNode(2);  root->r = newNode(3);
    root->l->l = newNode(4); root->l->r = newNode(5);
    root->r->r = newNode(6);
    root->l->r->l = newNode(7);

    printf("递归前序："); preorder(root);  printf("\\n");
    printf("递归中序："); inorder(root);   printf("\\n");
    printf("递归后序："); postorder(root); printf("\\n");
    printf("层序遍历："); levelorder(root); printf("\\n");

    printf("\\n非递归前序："); preorder_iter(root);  printf("\\n");
    printf("非递归中序："); inorder_iter(root);   printf("\\n");
    printf("（两种写法和递归结果一致，说明栈就是递归的底层）\\n");

    printf("\\n树的高度：%d\\n", height(root));
    printf("叶子：4 7 6（前序里没有孩子的那些）\\n");

    destroy(root);
    printf("\\n已用后序释放整棵树（先孩子后自己）\\n");
    return 0;
}`,
    tips: [
      '写非递归前序时「先压右孩子再压左孩子」，栈才会先弹出左孩子，顺序才对。',
      '递归遍历的调用栈深度 = 树高，单支树 10 万个结点会爆栈，这时必须用非递归或显式栈。'
    ],
    traps: [
      '后序非递归最难写（要判断右孩子是否已访问），面试不会要求就别硬背，会中序就够。',
      '释放树用前序会导致 use-after-free，程序可能不崩但内存全乱。'
    ],
    exercises: ['ex-tree-traverse']
  },

  {
    id: 'd-tree-build',
    ch: 'c5',
    title: '由遍历序列还原二叉树',
    tag: '重点',
    brief: '前序+中序 或 后序+中序 能唯一确定；前序+后序不能。',
    tags: ['建树', '前序中序', '后序中序', '唯一确定', '递归建树'],
    body: `
      <h2>哪些组合能唯一确定一棵二叉树</h2>
      <table>
        <tr><th>组合</th><th>能否唯一确定</th><th>原因</th></tr>
        <tr><td>前序 + 中序</td><td>能</td><td>前序定根，中序分左右</td></tr>
        <tr><td>后序 + 中序</td><td>能</td><td>后序定根（最后一个），中序分左右</td></tr>
        <tr><td>层序 + 中序</td><td>能</td><td>层序定根，中序分左右</td></tr>
        <tr><td>前序 + 后序</td><td><b>不能</b></td><td>分不清只有一个孩子时是左还是右</td></tr>
      </table>

      <h2>算法步骤（前序 + 中序）</h2>
      <ol>
        <li>前序第一个字符是根。</li>
        <li>在中序里找到这个根，左边是左子树的中序，右边是右子树的中序。</li>
        <li>按左子树长度，把前序切成两段。</li>
        <li>递归建左、右子树。</li>
      </ol>
      <pre><code>Node *build(pre, preL, preR, in, inL, inR) {
    if (preL &gt; preR) return NULL;
    root = new(pre[preL]);
    k = 在中序里找 pre[preL] 的位置;
    leftLen = k - inL;
    root-&gt;l = build(pre, preL+1, preL+leftLen, in, inL, k-1);
    root-&gt;r = build(pre, preL+leftLen+1, preR, in, k+1, inR);
    return root;
}</code></pre>
      <div class="note">这套递归的边界条件是<strong>最容易写错</strong>的地方。写的时候把 <code>preL/preR</code> 和 <code>inL/inR</code> 的含义写在注释里，一遍就对了。</div>

      <h2>手工还原技巧</h2>
      <p>前序 <code>A B D E C F</code>，中序 <code>D B E A F C</code>：</p>
      <ul>
        <li>A 是根。中序里 A 左边 <code>D B E</code> 是左子树，右边 <code>F C</code> 是右子树。</li>
        <li>左子树前序是 <code>B D E</code> → B 是左子树根；中序 <code>D B E</code> → D 左、E 右。</li>
        <li>右子树前序 <code>C F</code> 但中序是 <code>F C</code> → C 是根，F 是左孩子。</li>
      </ul>
      <p>画出来再验证一遍遍历序列，稳。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    char data;
    struct Node *l, *r;
} Node;

Node *newNode(char c) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = c;
    n->l = n->r = NULL;
    return n;
}

// 在中序序列的 [inL, inR] 里找 c
int find_root(const char *in, int inL, int inR, char c) {
    for (int i = inL; i <= inR; i++)
        if (in[i] == c) return i;
    return -1;
}

// 前序 + 中序 建树
Node *build_by_pre_in(const char *pre, int preL, int preR,
                      const char *in, int inL, int inR) {
    if (preL > preR || inL > inR) return NULL;
    char rootC = pre[preL];
    Node *root = newNode(rootC);

    int k = find_root(in, inL, inR, rootC);
    if (k == -1) return NULL;              // 序列不合法
    int leftLen = k - inL;

    root->l = build_by_pre_in(pre, preL + 1, preL + leftLen, in, inL, k - 1);
    root->r = build_by_pre_in(pre, preL + leftLen + 1, preR, in, k + 1, inR);
    return root;
}

// 后序 + 中序 建树
Node *build_by_post_in(const char *post, int postL, int postR,
                       const char *in, int inL, int inR) {
    if (postL > postR || inL > inR) return NULL;
    char rootC = post[postR];              // 后序最后一个是根
    Node *root = newNode(rootC);
    int k = find_root(in, inL, inR, rootC);
    int leftLen = k - inL;
    root->l = build_by_post_in(post, postL, postL + leftLen - 1, in, inL, k - 1);
    root->r = build_by_post_in(post, postL + leftLen, postR - 1, in, k + 1, inR);
    return root;
}

void preorder(Node *p) { if (!p) return; printf("%c ", p->data); preorder(p->l); preorder(p->r); }
void inorder(Node *p)  { if (!p) return; inorder(p->l); printf("%c ", p->data); inorder(p->r); }
void postorder(Node *p){ if (!p) return; postorder(p->l); postorder(p->r); printf("%c ", p->data); }

void destroy(Node *p) { if (!p) return; destroy(p->l); destroy(p->r); free(p); }

int main(void) {
    const char *pre  = "ABDECF";
    const char *in   = "DBEAFC";
    const char *post = "DEBFCA";

    printf("前序：%s\\n中序：%s\\n后序：%s\\n\\n", pre, in, post);

    Node *t1 = build_by_pre_in(pre, 0, (int)strlen(pre) - 1, in, 0, (int)strlen(in) - 1);
    printf("由前序+中序建树：\\n");
    printf("  前序验证："); preorder(t1); printf("\\n");
    printf("  中序验证："); inorder(t1);  printf("\\n");
    printf("  后序结果："); postorder(t1); printf("  <- 应该等于 %s\\n", post);
    destroy(t1);

    Node *t2 = build_by_post_in(post, 0, (int)strlen(post) - 1, in, 0, (int)strlen(in) - 1);
    printf("\\n由后序+中序建树：\\n");
    printf("  前序结果："); preorder(t2); printf("  <- 应该等于 %s\\n", pre);
    printf("  后序验证："); postorder(t2); printf("\\n");
    destroy(t2);

    printf("\\n为什么前序+后序不行？\\n");
    printf("  考虑树 A 只有左孩子 B：前序 AB，后序 BA\\n");
    printf("  考虑树 A 只有右孩子 B：前序 AB，后序 BA\\n");
    printf("  两组序列完全一样，但树不同 —— 所以无法唯一确定。\\n");
    return 0;
}`,
    tips: [
      '递归建树时，参数用「闭区间 [L, R]」比「长度」更好写，边界不容易错。',
      '写完立刻用三种遍历验证一遍，能立刻发现边界错误。'
    ],
    traps: [
      '切分前序时右子树的起点是 `preL + leftLen + 1`（要跳过根），写成 `preL + leftLen` 就错了。',
      '中序里找不到根说明输入序列不合法，要返回 NULL，否则数组越界。'
    ],
    exercises: ['ex-tree-build']
  },

  {
    id: 'd-thread',
    ch: 'c5',
    title: '线索二叉树：把空指针用起来',
    tag: '难点',
    brief: 'n+1 个空指针改成指向前驱/后继，加 tag 区分"孩子"还是"线索"。',
    tags: ['线索二叉树', 'ltag', 'rtag', '前驱', '后继', '中序线索化'],
    body: `
      <h2>动机</h2>
      <p>n 个结点的二叉链表有 n+1 个空指针。线索二叉树把这些空指针改造成<strong>指向前驱或后继的线索</strong>，这样不用栈也能遍历（空间 O(1)）。</p>

      <h2>结点结构</h2>
      <pre><code>typedef struct ThreadNode {
    int data;
    struct ThreadNode *lchild, *rchild;
    int ltag, rtag;     // 0 = 指向孩子，1 = 指向前驱/后继
} ThreadNode;</code></pre>
      <table>
        <tr><th>tag</th><th>含义</th></tr>
        <tr><td><code>ltag == 0</code></td><td>lchild 指向左孩子</td></tr>
        <tr><td><code>ltag == 1</code></td><td>lchild 指向前驱</td></tr>
        <tr><td><code>rtag == 0</code></td><td>rchild 指向右孩子</td></tr>
        <tr><td><code>rtag == 1</code></td><td>rchild 指向后继</td></tr>
      </table>
      <div class="warn">真正工程代码通常用位域省空间，但考试就考这两个 tag 的含义，一定背清楚「0 是孩子，1 是线索」。</div>

      <h2>中序线索化的过程</h2>
      <p>按中序遍历走，用一个 <code>pre</code> 指针记录上一个访问的结点：</p>
      <ul>
        <li>如果当前结点左孩子为空 → <code>lchild = pre</code>，<code>ltag = 1</code>。</li>
        <li>如果 pre 的右孩子为空 → <code>pre-&gt;rchild = 当前</code>，<code>pre-&gt;rtag = 1</code>。</li>
        <li>处理完，<code>pre = 当前</code>。</li>
      </ul>

      <h2>利用线索遍历（中序）</h2>
      <pre><code>// 找中序第一个结点：一路向左
while (p-&gt;ltag == 0) p = p-&gt;lchild;
// 然后反复：有右线索就走线索，否则进右子树再一路向左
while (p) {
    visit(p);
    if (p-&gt;rtag == 1) p = p-&gt;rchild;
    else { p = p-&gt;rchild; while (p &amp;&amp; p-&gt;ltag == 0) p = p-&gt;lchild; }
}</code></pre>
      <p>全程不用栈、不用递归，空间 O(1)。这就是线索树的价值。</p>

      <h2>三种线索树</h2>
      <p>按遍历顺序不同分：前序线索、中序线索、后序线索。<strong>中序线索最常用</strong>，因为找前驱后继都方便；前序线索找前驱、后序线索找后继都比较麻烦（这也是考点）。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct TNode {
    char data;
    struct TNode *lchild, *rchild;
    int ltag, rtag;         // 0=孩子, 1=线索
} TNode;

TNode *newNode(char c) {
    TNode *n = (TNode *)malloc(sizeof(TNode));
    n->data = c;
    n->lchild = n->rchild = NULL;
    n->ltag = n->rtag = 0;
    return n;
}

/* 中序线索化：递归，pre 是上一个访问的结点 */
void inThread(TNode *p, TNode **pre) {
    if (!p) return;

    inThread(p->lchild, pre);            // 左

    if (p->lchild == NULL) {             // 左空 -> 指向前驱
        p->lchild = *pre;
        p->ltag = 1;
    }
    if (*pre != NULL && (*pre)->rchild == NULL) {   // 前驱的右空 -> 指向后继
        (*pre)->rchild = p;
        (*pre)->rtag = 1;
    }
    *pre = p;

    inThread(p->rchild, pre);            // 右
}

void createInThread(TNode *root) {
    TNode *pre = NULL;
    if (root) {
        inThread(root, &pre);
        if (pre->rchild == NULL) {       // 最后一个结点
            pre->rtag = 1;
            pre->rchild = NULL;
        }
    }
}

TNode *firstNode(TNode *p) {
    while (p && p->ltag == 0) p = p->lchild;
    return p;
}

TNode *nextNode(TNode *p) {
    if (p->rtag == 1) return p->rchild;      // 直接走线索
    return firstNode(p->rchild);             // 否则右子树的最左结点
}

void threadInorder(TNode *root) {
    for (TNode *p = firstNode(root); p != NULL; p = nextNode(p))
        printf("%c ", p->data);
}

void preorder(TNode *p) {
    if (!p) return;
    printf("%c ", p->data);
    if (p->ltag == 0) preorder(p->lchild);
    if (p->rtag == 0) preorder(p->rchild);
}

int main(void) {
    /*        A
             / \\
            B   C
           / \\   \\
          D   E   F
    */
    TNode *A = newNode('A');
    TNode *B = newNode('B');
    TNode *C = newNode('C');
    TNode *D = newNode('D');
    TNode *E = newNode('E');
    TNode *F = newNode('F');
    A->lchild = B; A->rchild = C;
    B->lchild = D; B->rchild = E;
    C->rchild = F;

    printf("线索化之前：\\n");
    printf("  B 的 lchild = %s, ltag = %d\\n", B->lchild ? "D" : "NULL", B->ltag);
    printf("  E 的 rchild = %s, rtag = %d\\n", E->rchild ? "有" : "NULL", E->rtag);
    printf("  空指针有 7 个（n+1 = 6+1）\\n");

    createInThread(A);

    printf("\\n线索化之后：\\n");
    printf("  D 的 lchild 是线索 -> %s\\n", D->lchild ? "指向前驱(NULL)" : "NULL");
    printf("  D 的 rchild 是线索 -> 后继 %c\\n", D->rchild->data);
    printf("  E 的 rchild 是线索 -> 后继 %c\\n", E->rchild->data);

    printf("\\n利用线索做中序遍历（不用递归、不用栈）：\\n  ");
    threadInorder(A);
    printf("\\n\\n普通前序遍历验证：\\n  ");
    preorder(A);
    printf("\\n");
    return 0;
}`,
    tips: [
      '线索化就是"中序遍历 + 顺便补空指针"，理解这一点，代码就只是把 visit 换成补指针。',
      '考试常考"中序线索树里结点 x 的后继是谁"：若 rtag=1 就是 rchild；否则是右子树最左结点。'
    ],
    traps: [
      '线索化之后不能再当普通二叉链表用，遍历时必须先判 tag，否则会死循环。',
      '最后一个结点的 rchild 要显式置 NULL 并 rtag=1，不然遍历会走到垃圾地址。'
    ]
  },

  {
    id: 'd-huffman',
    ch: 'c5',
    title: '哈夫曼树与哈夫曼编码',
    tag: '重点',
    brief: '每次取两个最小权值合并，WPL 最小。左 0 右 1 得到前缀编码。',
    tags: ['哈夫曼树', 'WPL', '最优二叉树', '哈夫曼编码', '前缀编码', '贪心'],
    body: `
      <h2>哈夫曼树是什么</h2>
      <p>给定 n 个带权的叶子，构造一棵二叉树使 <strong>WPL（带权路径长度 = Σ 权值 × 路径长度）最小</strong>。这样的树叫哈夫曼树（最优二叉树）。</p>

      <h2>构造算法（贪心）</h2>
      <ol>
        <li>把 n 个权值都看成只有根的树，放进集合。</li>
        <li>取出<strong>两个最小</strong>的，合并成一个新根（权值为两者之和），放回集合。</li>
        <li>重复直到只剩一棵树。</li>
      </ol>
      <div class="note">贪心为什么对？因为权值大的应该离根近、权值小的离根远。每次合并最小的两个，就让小的沉得更深。</div>

      <h2>WPL 计算</h2>
      <p>WPL = 所有叶子 <code>权值 × 深度</code> 之和。也可以等价地算成 <strong>所有非叶结点的权值之和</strong>（每次合并出来的新结点权值累加），这个技巧考试很好用。</p>
      <p>例：权值 {1, 2, 3, 4} → 合并 1+2=3，集合 {3,3,4} → 合并 3+3=6，集合 {4,6} → 合并 10。<br>
      非叶结点权值和 = 3 + 6 + 10 = 19，所以 WPL = 19。</p>

      <h2>哈夫曼编码</h2>
      <p>把字符的使用频率当权值建哈夫曼树，然后<strong>左分支记 0、右分支记 1</strong>，从根到叶的路径就是该字符的编码。</p>
      <ul>
        <li>频率高的字符编码短 → 总长度最小。</li>
        <li>所有字符都在叶子上 → <strong>没有任何编码是另一个的前缀</strong>（前缀编码），解码无歧义。</li>
        <li>哈夫曼编码不唯一（左右可以互换、相同权值可以换顺序），但<strong>WPL 唯一</strong>。</li>
      </ul>

      <h2>为什么它出现在"树"这一章</h2>
      <p>因为它是"带权路径长度"这个概念的最佳应用，也是压缩算法（DEFLATE、JPEG、MP3）的基础。虽然叫"编码"，本质是构造一棵最优二叉树。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define MAXN 64

typedef struct {
    int weight;
    int parent, lchild, rchild;
} HTNode;

/* 在 1..n 中找两个 parent==0 且权值最小的结点 */
void select_two(HTNode *ht, int n, int *s1, int *s2) {
    int min1 = 1 << 30, min2 = 1 << 30;
    *s1 = *s2 = 0;
    for (int i = 1; i <= n; i++) {
        if (ht[i].parent != 0) continue;
        if (ht[i].weight < min1) {
            min2 = min1; *s2 = *s1;
            min1 = ht[i].weight; *s1 = i;
        } else if (ht[i].weight < min2) {
            min2 = ht[i].weight; *s2 = i;
        }
    }
}

/* 构造哈夫曼树，返回根下标；w 是 n 个权值 */
int build_huffman(HTNode *ht, const int *w, int n) {
    if (n <= 1) return n;
    int m = 2 * n - 1;
    for (int i = 1; i <= m; i++) {
        ht[i].weight = 0;
        ht[i].parent = ht[i].lchild = ht[i].rchild = 0;
    }
    for (int i = 1; i <= n; i++) ht[i].weight = w[i - 1];

    for (int i = n + 1; i <= m; i++) {
        int s1, s2;
        select_two(ht, i - 1, &s1, &s2);
        ht[s1].parent = i;
        ht[s2].parent = i;
        ht[i].lchild = s1;
        ht[i].rchild = s2;
        ht[i].weight = ht[s1].weight + ht[s2].weight;
    }
    return m;
}

/* 求每个叶子的编码，存入 codes */
void get_codes(HTNode *ht, int n, char codes[MAXN][MAXN]) {
    char tmp[MAXN];
    for (int i = 1; i <= n; i++) {
        int len = 0;
        int c = i, p = ht[i].parent;
        while (p != 0) {
            tmp[len++] = (ht[p].lchild == c) ? '0' : '1';   // 左 0 右 1
            c = p;
            p = ht[p].parent;
        }
        for (int k = 0; k < len; k++) codes[i][k] = tmp[len - 1 - k];  // 反转
        codes[i][len] = '\\0';
    }
}

int main(void) {
    /* 经典作业题：权值 5 29 7 8 14 23 3 11 */
    int w[] = {5, 29, 7, 8, 14, 23, 3, 11};
    int n = 8;
    HTNode ht[MAXN];
    char codes[MAXN][MAXN];

    int root = build_huffman(ht, w, n);

    printf("=== 哈夫曼树结点表 ===\\n");
    printf("下标  weight  parent  lchild  rchild\\n");
    for (int i = 1; i <= 2 * n - 1; i++) {
        printf("%4d %7d %7d %7d %7d\\n", i, ht[i].weight,
               ht[i].parent, ht[i].lchild, ht[i].rchild);
    }

    get_codes(ht, n, codes);

    printf("\\n=== 每个叶子的编码 ===\\n");
    int wpl = 0;
    for (int i = 1; i <= n; i++) {
        int depth = (int)strlen(codes[i]);
        wpl += w[i - 1] * depth;
        printf("  权值 %2d -> 编码 %-8s 长度 %d  贡献 %d×%d = %d\\n",
               w[i - 1], codes[i], depth, w[i - 1], depth, w[i - 1] * depth);
    }

    int nonLeafSum = 0;
    for (int i = n + 1; i <= 2 * n - 1; i++) nonLeafSum += ht[i].weight;

    printf("\\nWPL = %d\\n", wpl);
    printf("另一个算法：非叶结点权值之和 = %d（结果相同，考试这里能省时间）\\n", nonLeafSum);

    printf("\\n校验前缀编码：没有任何编码是别人的前缀\\n");
    int ok = 1;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++) {
            if (i == j) continue;
            if (strncmp(codes[i], codes[j], strlen(codes[i])) == 0) ok = 0;
        }
    printf("结论：%s\\n", ok ? "全部满足前缀性质" : "存在前缀冲突");

    printf("\\n根结点下标 %d，权值 %d（= 所有叶子权值之和）\\n", root, ht[root].weight);
    return 0;
}`,
    tips: [
      'WPL 用「非叶结点权值和」算，比逐个叶子乘深度快得多，考试时能省 3 分钟。',
      '哈夫曼树没有度为 1 的结点（每次合并都产生一个度为 2 的结点），这是重要性质。'
    ],
    traps: [
      '求编码时是从叶子往根走，得到的是逆序，必须反转。',
      '相同权值的结点顺序不同，构造出的树形状可能不同，但 WPL 一定相同。'
    ]
  },

  {
    id: 'd-bst',
    ch: 'c5',
    title: '二叉排序树 BST：中序就是排序',
    tag: '必学·重点',
    brief: '左小右大，中序遍历得到有序序列。查找 O(log n)～O(n)。',
    tags: ['二叉排序树', 'BST', '查找', '插入', '删除', '中序有序'],
    body: `
      <h2>定义</h2>
      <p>对任意结点：<strong>左子树所有结点 &lt; 根 &lt; 右子树所有结点</strong>，且左右子树也是 BST。</p>
      <p>最重要的推论：<strong>中序遍历得到递增序列。</strong>所以在 BST 里找第 k 小、判断是否合法，都用中序。</p>

      <h2>查找</h2>
      <pre><code>while (p && p-&gt;data != key)
    p = (key &lt; p-&gt;data) ? p-&gt;l : p-&gt;r;
return p;</code></pre>
      <p>复杂度取决于<strong>树高</strong>：平衡时 O(log n)，退化成单支树（有序插入）时 O(n)。这就是 AVL 存在的理由。</p>

      <h2>插入</h2>
      <p>查找失败的位置就是插入位置。新结点一定是叶子。</p>

      <h2>删除（三种情况，考试必考）</h2>
      <table>
        <tr><th>情况</th><th>处理</th></tr>
        <tr><td>叶子</td><td>直接删</td></tr>
        <tr><td>只有一个孩子</td><td>孩子顶上来</td></tr>
        <tr><td>有两个孩子</td><td>用<b>中序前驱</b>（左子树最大）或<b>中序后继</b>（右子树最小）替换，再删那个替身</td></tr>
      </table>
      <p>第三种有个坑：替换之后要递归删除替身结点，而替身最多只有一个孩子，所以又回到前两种情况。</p>

      <h2>ASL 计算</h2>
      <p>查找成功的 ASL = Σ(每个结点的层数) / n。<strong>层数</strong>就是找到它需要比较的次数。所以树越矮越好。</p>
      <div class="note">下面代码演示"有序数据插入 BST 会退化成链表"这个经典问题——这也是 AVL 要解决的问题。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *l, *r;
} Node;

Node *insert(Node *root, int v) {
    if (root == NULL) {
        Node *n = (Node *)malloc(sizeof(Node));
        n->data = v;
        n->l = n->r = NULL;
        return n;
    }
    if (v < root->data)      root->l = insert(root->l, v);
    else if (v > root->data) root->r = insert(root->r, v);
    // v == root->data 时不插入（树里不存重复值）
    return root;
}

Node *search(Node *root, int key) {
    while (root && root->data != key)
        root = (key < root->data) ? root->l : root->r;
    return root;
}

Node *findMin(Node *root) {
    while (root && root->l) root = root->l;
    return root;
}

Node *deleteNode(Node *root, int key) {
    if (!root) return NULL;
    if (key < root->data)      root->l = deleteNode(root->l, key);
    else if (key > root->data) root->r = deleteNode(root->r, key);
    else {
        if (!root->l) { Node *t = root->r; free(root); return t; }
        if (!root->r) { Node *t = root->l; free(root); return t; }
        Node *succ = findMin(root->r);      // 中序后继
        root->data = succ->data;
        root->r = deleteNode(root->r, succ->data);
    }
    return root;
}

void inorder(Node *p) {
    if (!p) return;
    inorder(p->l);
    printf("%d ", p->data);
    inorder(p->r);
}

int height(Node *p) {
    if (!p) return 0;
    int a = height(p->l), b = height(p->r);
    return (a > b ? a : b) + 1;
}

// 计算 ASL（成功）：sum(层数)/n
void sumDepth(Node *p, int d, int *sum, int *cnt) {
    if (!p) return;
    *sum += d;
    (*cnt)++;
    sumDepth(p->l, d + 1, sum, cnt);
    sumDepth(p->r, d + 1, sum, cnt);
}

void destroy(Node *p) { if (!p) return; destroy(p->l); destroy(p->r); free(p); }

int main(void) {
    int arr[] = {45, 24, 53, 12, 37, 93};
    int n = 6;

    Node *root = NULL;
    for (int i = 0; i < n; i++) root = insert(root, arr[i]);

    printf("插入顺序：");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n中序遍历（必然递增）：");
    inorder(root);
    printf("\\n树高：%d\\n", height(root));

    int sum = 0, cnt = 0;
    sumDepth(root, 1, &sum, &cnt);
    printf("ASL(成功) = %d/%d = %.2f\\n", sum, cnt, (double)sum / cnt);

    printf("\\n查找测试：\\n");
    int keys[] = {37, 99, 12};
    for (int i = 0; i < 3; i++)
        printf("  找 %2d：%s\\n", keys[i], search(root, keys[i]) ? "找到" : "没找到");

    printf("\\n删除 12（叶子）：");
    root = deleteNode(root, 12);
    inorder(root); printf("\\n");

    printf("删除 24（有一个孩子）：");
    root = deleteNode(root, 24);
    inorder(root); printf("\\n");

    printf("删除 45（有两个孩子，用中序后继 53 替换）：");
    root = deleteNode(root, 45);
    inorder(root); printf("\\n");

    destroy(root);

    printf("\\n== 退化演示：有序插入 ==\\n");
    Node *bad = NULL;
    for (int i = 1; i <= 8; i++) bad = insert(bad, i * 10);
    printf("插入 10..80（有序）：树高 = %d（8 个结点）\\n", height(bad));
    printf("这时候它其实就是一条链表，查找退化成 O(n)\\n");
    printf("所以需要平衡二叉树（下一课）。\\n");
    destroy(bad);
    return 0;
}`,
    tips: [
      'BST 删除两个孩子的结点时，用中序前驱或后继都行，但一定要"替换值 + 删除替身"。',
      '判断一棵树是不是 BST：中序遍历必须严格递增（不能有相等）。'
    ],
    traps: [
      'BST 查找的最坏复杂度是 O(n)，不是 O(log n)——很多教材只写平均情况。',
      '递归插入时忘了 `root->l = insert(...)` 把返回值接住，树根本长不出来。'
    ],
    exercises: ['ex-bst']
  },

  {
    id: 'd-avl',
    ch: 'c5',
    title: '平衡二叉树 AVL：四种旋转',
    tag: '难点',
    brief: '平衡因子只能是 -1/0/1；LL、RR、LR、RL 四种失衡各有对应旋转。',
    tags: ['AVL', '平衡二叉树', '平衡因子', '左旋', '右旋', 'LL', 'RR', 'LR', 'RL'],
    body: `
      <h2>平衡因子 BF</h2>
      <p><code>BF = 左子树高度 − 右子树高度</code>。AVL 要求每个结点 <code>|BF| ≤ 1</code>。插入/删除后如果不满足，就要旋转。</p>
      <p>另一种定义是右减左，含义一样，注意和你教材一致。</p>

      <h2>四种失衡与旋转</h2>
      <table>
        <tr><th>类型</th><th>情形</th><th>操作</th></tr>
        <tr><td>LL</td><td>在左孩子的左子树插入</td><td>右旋一次</td></tr>
        <tr><td>RR</td><td>在右孩子的右子树插入</td><td>左旋一次</td></tr>
        <tr><td>LR</td><td>在左孩子的右子树插入</td><td>先对左孩子左旋，再对根右旋</td></tr>
        <tr><td>RL</td><td>在右孩子的左子树插入</td><td>先对右孩子右旋，再对根左旋</td></tr>
      </table>
      <div class="note">记忆法：「哪边高就往反方向转」。LL 是左边高，所以往右转；LR 是"左的右边高"，要先把左孩子的右边转上来，再整体右旋。</div>

      <h2>左旋 / 右旋的代码骨架</h2>
      <pre><code>// 右旋（处理 LL）
y = x-&gt;l;
x-&gt;l = y-&gt;r;
y-&gt;r = x;
return y;      // y 成为新的子树根</code></pre>
      <p>就三行指针操作，但顺序不能错。左旋对称。</p>

      <h2>复杂度</h2>
      <p>AVL 高度是 O(log n)，所以查找、插入、删除都是 O(log n)。代价是每次改动可能要做 O(log n) 次旋转，常数比普通 BST 大。</p>

      <h2>AVL vs 红黑树</h2>
      <table>
        <tr><th></th><th>AVL</th><th>红黑树</th></tr>
        <tr><td>平衡程度</td><td>严格（高度差 ≤ 1）</td><td>近似（最长路径 ≤ 2 倍最短）</td></tr>
        <tr><td>查找</td><td>更快</td><td>稍慢</td></tr>
        <tr><td>插入删除</td><td>旋转多，更慢</td><td>旋转少，更快</td></tr>
        <tr><td>用在哪</td><td>查找密集、改动少</td><td>std::map、Java TreeMap、Linux 内核</td></tr>
      </table>
      <div class="warn">考试只要会「判断是否平衡」「算 BF」「画出旋转后的树」，不要求写完整 AVL 代码。下面的实现是为了让你看懂旋转到底在干什么。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    int height;
    struct Node *l, *r;
} Node;

int h(Node *p) { return p ? p->height : 0; }
int max(int a, int b) { return a > b ? a : b; }
int bf(Node *p) { return p ? h(p->l) - h(p->r) : 0; }

Node *newNode(int v) {
    Node *n = (Node *)malloc(sizeof(Node));
    n->data = v;
    n->height = 1;
    n->l = n->r = NULL;
    return n;
}

void update(Node *p) {
    if (p) p->height = max(h(p->l), h(p->r)) + 1;
}

/* 右旋：处理 LL */
Node *rotateRight(Node *y) {
    Node *x = y->l;
    Node *t2 = x->r;
    x->r = y;
    y->l = t2;
    update(y);
    update(x);
    return x;
}

/* 左旋：处理 RR */
Node *rotateLeft(Node *x) {
    Node *y = x->r;
    Node *t2 = y->l;
    y->l = x;
    x->r = t2;
    update(x);
    update(y);
    return y;
}

Node *insert(Node *node, int v) {
    if (!node) return newNode(v);
    if (v < node->data)      node->l = insert(node->l, v);
    else if (v > node->data) node->r = insert(node->r, v);
    else return node;

    update(node);
    int b = bf(node);

    if (b > 1 && v < node->l->data)  return rotateRight(node);          // LL
    if (b < -1 && v > node->r->data) return rotateLeft(node);           // RR
    if (b > 1 && v > node->l->data) {                                   // LR
        node->l = rotateLeft(node->l);
        return rotateRight(node);
    }
    if (b < -1 && v < node->r->data) {                                  // RL
        node->r = rotateRight(node->r);
        return rotateLeft(node);
    }
    return node;
}

void inorder(Node *p) { if (!p) return; inorder(p->l); printf("%d ", p->data); inorder(p->r); }

void printBF(Node *p) {
    if (!p) return;
    printBF(p->l);
    printf("  %d: BF=%+d 高度=%d\\n", p->data, bf(p), p->height);
    printBF(p->r);
}

void destroy(Node *p) { if (!p) return; destroy(p->l); destroy(p->r); free(p); }

int main(void) {
    printf("== 场景 1：LL 型（一直往左插）==\\n");
    Node *root = NULL;
    int a[] = {30, 20, 10};
    for (int i = 0; i < 3; i++) {
        root = insert(root, a[i]);
        printf("插入 %d 后中序：", a[i]);
        inorder(root);
        printf("  树高 %d，根 %d\\n", h(root), root->data);
    }
    printf("插入 10 时 30 的 BF 变成 +2，触发右旋，20 成为新根\\n");
    destroy(root);

    printf("\\n== 场景 2：LR 型（左孩子的右边）==\\n");
    root = NULL;
    int b[] = {30, 10, 20};
    for (int i = 0; i < 3; i++) {
        root = insert(root, b[i]);
        printf("插入 %2d 后：中序 ", b[i]);
        inorder(root);
        printf(" 根=%d\\n", root->data);
    }
    printf("两次旋转后，20 成为根，10 和 30 分别是左右孩子\\n");
    destroy(root);

    printf("\\n== 场景 3：10 个结点的 AVL ==\\n");
    root = NULL;
    int c[] = {50, 30, 70, 20, 40, 60, 80, 10, 25, 35};
    for (int i = 0; i < 10; i++) root = insert(root, c[i]);
    printf("中序：");
    inorder(root);
    printf("\\n树高：%d（10 个结点，理想高度是 4）\\n", h(root));
    printf("各结点平衡因子：\\n");
    printBF(root);
    printf("全部 |BF| <= 1，这就是 AVL。\\n");
    destroy(root);
    return 0;
}`,
    tips: [
      '判断失衡类型：从插入点往上找第一个 |BF|=2 的结点，看插入发生在它的左左、左右、右左还是右右。',
      '旋转只需要改 3 个指针，画图时标好 t2（要转移的子树），一次就对。'
    ],
    traps: [
      '旋转后忘了更新高度，下一次判断 BF 就全错。要「先更新下面，再更新上面」。',
      'LR 型只做一次右旋会变成另一个不平衡状态，必须两次。'
    ]
  },

  {
    id: 'd-btree',
    ch: 'c5',
    title: 'B 树与 B+ 树：为什么数据库用它',
    tag: '了解',
    brief: '多路平衡查找树，一个结点存多个关键字，专为磁盘 IO 设计。',
    tags: ['B树', 'B+树', '多路平衡', '磁盘IO', '索引', 'MySQL'],
    body: `
      <h2>为什么需要 B 树</h2>
      <p>二叉树每个结点只有 2 个孩子，100 万数据要 20 层。每层都要读一次磁盘（页），20 次 IO 太慢。<strong>B 树让一个结点存几百个关键字</strong>，树高降到 3 层左右，3 次 IO 搞定。</p>

      <h2>m 阶 B 树的定义</h2>
      <ul>
        <li>每个结点最多 m 个孩子（m−1 个关键字）。</li>
        <li>根结点至少 2 个孩子（除非它是叶子）。</li>
        <li>其他非叶结点至少 ⌈m/2⌉ 个孩子。</li>
        <li>所有叶子在同一层（绝对平衡）。</li>
        <li>结点内关键字有序，且 <code>kᵢ</code> 的左子树所有值 &lt; <code>kᵢ</code> &lt; 右子树。</li>
      </ul>

      <h2>插入与分裂</h2>
      <p>插到叶子里；如果关键字数超过 m−1，就<strong>从中间分裂</strong>：中间的关键字升到父结点，左右两半成为两个新结点。父结点也可能因此溢出，继续向上分裂——这叫"分裂传播"。如果根分裂，树高 +1。</p>

      <h2>B 树 vs B+ 树（考试重点）</h2>
      <table>
        <tr><th></th><th>B 树</th><th>B+ 树</th></tr>
        <tr><td>数据存放</td><td>每个结点都存数据</td><td><b>只有叶子存数据</b>，内部结点只存索引</td></tr>
        <tr><td>关键字重复</td><td>不重复</td><td>内部结点的关键字会在叶子中再次出现</td></tr>
        <tr><td>叶子链接</td><td>无</td><td>叶子之间有链表，支持范围查询</td></tr>
        <tr><td>查找</td><td>可能在内部结点就命中</td><td>必须走到叶子（路径长度稳定）</td></tr>
        <tr><td>范围查询</td><td>麻烦（要中序遍历）</td><td>极快（顺着叶子链表扫）</td></tr>
      </table>
      <p>所以 MySQL InnoDB 用 B+ 树：范围查询快、树更矮（内部结点不存数据，能放更多索引）。</p>

      <h2>典型考题</h2>
      <ul>
        <li>3 阶 B 树最多 2 个关键字、3 个孩子；至少 1 个关键字、2 个孩子。</li>
        <li>含 n 个关键字的 m 阶 B 树，最小高度和最大高度公式。</li>
        <li>给一串数，画出插入后的 B 树（考分裂）。</li>
      </ul>
      <div class="note">下面代码用数组模拟 3 阶 B 树的一次插入+分裂过程，让你看清"中间关键字上移"到底怎么操作。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

/* 简化版 3 阶 B 树（每个结点最多 2 个关键字、3 个孩子）
   只演示插入与分裂的核心逻辑，不实现删除 */

typedef struct BNode {
    int key[3];              // 最多 2 个关键字，多留一位方便临时溢出
    int n;                   // 当前关键字个数
    struct BNode *child[4];  // 最多 3 个孩子
    int isLeaf;
} BNode;

BNode *newNode(int isLeaf) {
    BNode *p = (BNode *)malloc(sizeof(BNode));
    p->n = 0;
    p->isLeaf = isLeaf;
    for (int i = 0; i < 4; i++) p->child[i] = NULL;
    return p;
}

void printNode(BNode *p) {
    printf("[");
    for (int i = 0; i < p->n; i++) printf("%d%s", p->key[i], i == p->n - 1 ? "" : " ");
    printf("]");
}

void printTree(BNode *root, int depth) {
    if (!root) return;
    for (int i = 0; i < depth; i++) printf("    ");
    printNode(root);
    printf("%s\\n", root->isLeaf ? "  (叶)" : "");
    if (!root->isLeaf)
        for (int i = 0; i <= root->n; i++)
            printTree(root->child[i], depth + 1);
}

/* 在叶子中插入，返回是否溢出 */
int insertLeaf(BNode *leaf, int k) {
    int i = leaf->n - 1;
    while (i >= 0 && leaf->key[i] > k) {
        leaf->key[i + 1] = leaf->key[i];
        i--;
    }
    leaf->key[i + 1] = k;
    leaf->n++;
    return leaf->n > 2;      // 3 阶最多 2 个关键字
}

int main(void) {
    printf("手工模拟 3 阶 B 树插入 10 20 30 40 50：\\n\\n");

    BNode *root = newNode(1);
    int data[] = {10, 20, 30, 40, 50};
    int n = 5;

    for (int i = 0; i < n; i++) {
        int k = data[i];
        printf("插入 %d：\\n", k);

        if (root->isLeaf) {
            int overflow = insertLeaf(root, k);
            if (!overflow) {
                printf("  直接放进根：");
                printNode(root);
                printf("\\n\\n");
            } else {
                // 分裂：3 个关键字中间的上移
                int mid = root->key[1];
                BNode *L = newNode(1), *R = newNode(1);
                L->key[0] = root->key[0]; L->n = 1;
                R->key[0] = root->key[2]; R->n = 1;

                BNode *newRoot = newNode(0);
                newRoot->key[0] = mid;
                newRoot->n = 1;
                newRoot->child[0] = L;
                newRoot->child[1] = R;

                free(root);
                root = newRoot;
                printf("  溢出！中间关键字 %d 上移成为新根\\n", mid);
                printTree(root, 1);
                printf("\\n");
            }
        } else {
            // 根不是叶子：找到对应孩子插入（简化：只处理一层）
            int idx = (k < root->key[0]) ? 0 : 1;
            BNode *leaf = root->child[idx];
            int overflow = insertLeaf(leaf, k);
            if (!overflow) {
                printf("  父结点 %d 指引下插入叶子：", root->key[0]);
                printNode(leaf);
                printf("\\n\\n");
            } else {
                printf("  叶子溢出，需要分裂并让中间关键字上移（省略完整实现）\\n\\n");
            }
        }
    }

    printf("最终结构：\\n");
    printTree(root, 1);

    printf("\\n观察：\\n");
    printf("  1. 所有叶子在同一层（B 树绝对平衡）\\n");
    printf("  2. 分裂时中间关键字上移，左右各分一半\\n");
    printf("  3. 根分裂时树高 +1，这是 B 树唯一长高的方式\\n");
    return 0;
}`,
    tips: [
      '记 B 阶数口诀：m 阶 → 最多 m 个孩子、m−1 个关键字；最少 ⌈m/2⌉ 个孩子。',
      'B+ 树的最大优势是范围查询和树高更低，MySQL 索引、文件系统都用它。'
    ],
    traps: [
      'B 树关键字在整棵树中不重复，B+ 树内部结点的关键字是"冗余索引"，会在叶子里再出现一次。',
      '分裂时上移的是"中间"关键字，不是第一个或最后一个。'
    ]
  },

  {
    id: 'd-unionfind',
    ch: 'c5',
    title: '并查集：判断"是不是一伙的"',
    tag: '实用',
    brief: '路径压缩 + 按秩合并后，单次操作接近 O(1)。',
    tags: ['并查集', 'Union-Find', '路径压缩', '按秩合并', '连通分量', 'Kruskal'],
    body: `
      <h2>它能干什么</h2>
      <ul>
        <li>判断两个元素是否在同一个集合（朋友圈、连通性）。</li>
        <li>合并两个集合。</li>
        <li>统计连通分量个数（图那章会用）。</li>
        <li>Kruskal 最小生成树用它判环（第 6 章）。</li>
      </ul>

      <h2>核心思想：用一棵树表示一个集合</h2>
      <p>每个元素指向它的父结点，<strong>根结点就是集合的代表</strong>。判断两个元素是否同集合 = 判断它们的根是否相同。</p>
      <pre><code>int find(int x) {
    while (parent[x] != x) x = parent[x];
    return x;
}
void union_set(int a, int b) { parent[find(a)] = find(b); }</code></pre>

      <h2>两个优化</h2>
      <table>
        <tr><th>优化</th><th>做法</th><th>效果</th></tr>
        <tr><td>路径压缩</td><td>find 时顺便把路径上所有结点直接挂到根上</td><td>树高趋于 1</td></tr>
        <tr><td>按秩合并</td><td>矮的树挂到高的树下</td><td>避免退化成链</td></tr>
      </table>
      <p>两个都用上，复杂度是 <code>O(α(n))</code>，α 是反阿克曼函数，实际中 <strong>不超过 4</strong>，可以当成 O(1)。</p>

      <h2>路径压缩的写法（递归版最简洁）</h2>
      <pre><code>int find(int x) {
    if (parent[x] != x)
        parent[x] = find(parent[x]);   // 顺手把路径上所有点挂到根
    return parent[x];
}</code></pre>
      <div class="note">注意：路径压缩之后不能再"按原树结构恢复"，因为它已经把树压平了。这在需要保留原始结构的题目里要注意。</div>
    `,
    code: `#include <stdio.h>

#define MAXN 20

int parent[MAXN];
int rank_[MAXN];

void init(int n) {
    for (int i = 0; i < n; i++) {
        parent[i] = i;        // 每个元素自成一个集合
        rank_[i] = 0;
    }
}

// 路径压缩
int find(int x) {
    if (parent[x] != x)
        parent[x] = find(parent[x]);
    return parent[x];
}

// 按秩合并
void union_set(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return;
    if (rank_[ra] < rank_[rb])      parent[ra] = rb;
    else if (rank_[ra] > rank_[rb]) parent[rb] = ra;
    else { parent[rb] = ra; rank_[ra]++; }
}

void show(int n) {
    printf("  parent: ");
    for (int i = 0; i < n; i++) printf("%2d", parent[i]);
    printf("\\n  find  : ");
    for (int i = 0; i < n; i++) printf("%2d", find(i));
    printf("\\n");
}

int main(void) {
    int n = 10;
    init(n);

    printf("== 初始状态（每个元素自己一组）==\\n");
    show(n);

    printf("\\n== 合并 {0,1,2}、{3,4}、{5,6,7} ==\\n");
    union_set(0, 1); union_set(1, 2);
    union_set(3, 4);
    union_set(5, 6); union_set(6, 7);
    show(n);

    printf("\\n判断关系：\\n");
    printf("  0 和 2 同组？%s\\n", find(0) == find(2) ? "是" : "否");
    printf("  0 和 3 同组？%s\\n", find(0) == find(3) ? "是" : "否");
    printf("  5 和 7 同组？%s\\n", find(5) == find(7) ? "是" : "否");

    printf("\\n== 合并两组 {0,1,2} 和 {5,6,7} ==\\n");
    union_set(2, 7);
    show(n);

    printf("\\n统计连通分量个数：\\n");
    int count = 0;
    for (int i = 0; i < n; i++)
        if (find(i) == i) count++;
    printf("  共有 %d 个集合：", count);
    for (int i = 0; i < n; i++)
        if (find(i) == i) printf("[根 %d] ", i);
    printf("\\n");

    printf("\\n== 路径压缩的效果 ==\\n");
    printf("合并了 0-1-2 之后，如果不用路径压缩，find(2) 要走 2 步；\\n");
    printf("用了压缩之后，parent[2] 直接就是根 %d。\\n", find(2));
    show(n);

    printf("\\n典型用途：Kruskal 判环、朋友圈计数、判断图连通性。\\n");
    return 0;
}`,
    tips: [
      '并查集只支持"合并"和"查询"，不支持"分裂"。需要分裂时要换思路。',
      '模板背下来：init / find(路径压缩) / union(按秩)，十分钟能写完，性价比极高。'
    ],
    traps: [
      '`find` 忘了路径压缩，最坏会退化成 O(n) 的链。',
      '合并时必须合并"根"，写成 `parent[a] = b` 就挂错层了。'
    ],
    exercises: ['ex-unionfind']
  }

  );
})();
