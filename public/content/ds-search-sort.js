/* ============================================================
   第 7 章：查找    第 8 章：排序
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  /* ══════════════════════════ 第 7 章 ══════════════════════════ */
  {
    id: 'd-search-seq',
    ch: 'c7',
    title: '顺序查找与折半查找（附 ASL 计算）',
    tag: '必学·重点',
    brief: '折半查找要求有序 + 顺序存储，ASL ≈ log₂(n+1) − 1。',
    tags: ['顺序查找', '折半查找', '二分查找', 'ASL', '判定树', '有序表'],
    body: `
      <h2>顺序查找</h2>
      <p>从头到尾一个个比。不要求有序，什么存储都行。</p>
      <ul>
        <li>成功 ASL（等概率）= <code>(n+1)/2</code></li>
        <li>失败 ASL = <code>n+1</code>（含哨兵）或 <code>n</code></li>
        <li>时间复杂度 O(n)</li>
      </ul>
      <p>优化技巧：把<strong>查找概率大的放前面</strong>，ASL 会下降。这就是"哨兵"之外的实用优化。</p>

      <h2>折半查找（二分）</h2>
      <p><strong>前提：有序表 + 顺序存储（数组）。</strong>链表不行，因为没法 O(1) 定位中间。</p>
      <pre><code>while (low &lt;= high) {
    mid = (low + high) / 2;
    if (a[mid] == key) return mid;
    else if (a[mid] &lt; key) low = mid + 1;
    else high = mid - 1;
}</code></pre>

      <h2>ASL 与判定树</h2>
      <p>折半查找的过程可以画成一棵<strong>判定树</strong>（平衡二叉树，mid 是根）。查找成功时比较次数 = 结点所在层数。</p>
      <p>等概率时：<code>ASL = (1/n) × Σ(层数)</code>，约等于 <code>log₂(n+1) − 1</code>。</p>
      <table>
        <tr><th>n</th><th>最大比较次数</th><th>ASL≈</th></tr>
        <tr><td>7</td><td>3</td><td>2.43</td></tr>
        <tr><td>15</td><td>4</td><td>3.27</td></tr>
        <tr><td>1000</td><td>10</td><td>8.99</td></tr>
      </table>

      <h2>三个必须记住的边界</h2>
      <ul>
        <li>循环条件是 <code>low &lt;= high</code>（不是 &lt;），否则会漏掉最后一个元素。</li>
        <li><code>mid = low + (high - low) / 2</code> 比 <code>(low+high)/2</code> 更安全，能防溢出。</li>
        <li>数组必须<strong>严格有序</strong>，有重复元素时"找到的下标不唯一"。</li>
      </ul>
      <div class="note">折半查找的"变种题"特别多：找第一个 ≥ key 的位置、找最后一个 ≤ key 的位置、找插入位置。建议把标准版写熟，再记两个变种模板。</div>
    `,
    code: `#include <stdio.h>

// 顺序查找：返回下标，找不到返回 -1
int seq_search(const int *a, int n, int key, int *cmp) {
    *cmp = 0;
    for (int i = 0; i < n; i++) {
        (*cmp)++;
        if (a[i] == key) return i;
    }
    return -1;
}

// 折半查找（迭代）
int bin_search(const int *a, int n, int key, int *cmp) {
    int low = 0, high = n - 1;
    *cmp = 0;
    while (low <= high) {
        (*cmp)++;
        int mid = low + (high - low) / 2;
        if (a[mid] == key) return mid;
        else if (a[mid] < key) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

// 折半查找（递归），方便理解判定树
int bin_search_rec(const int *a, int low, int high, int key) {
    if (low > high) return -1;
    int mid = low + (high - low) / 2;
    if (a[mid] == key) return mid;
    if (a[mid] < key) return bin_search_rec(a, mid + 1, high, key);
    return bin_search_rec(a, low, mid - 1, key);
}

// 找第一个 >= key 的位置（lower_bound）
int lower_bound(const int *a, int n, int key) {
    int low = 0, high = n;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (a[mid] < key) low = mid + 1;
        else high = mid;
    }
    return low;
}

int main(void) {
    int a[] = {7, 11, 18, 25, 33, 47, 58, 69, 80, 92};
    int n = 10;

    printf("有序表：");
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\\n\\n");

    printf("下标: ");
    for (int i = 0; i < n; i++) printf("%2d ", i);
    printf("\\n");

    printf("\\n== 查找过程对比 ==\\n");
    int keys[] = {25, 92, 7, 40};
    for (int k = 0; k < 4; k++) {
        int c1, c2;
        int p1 = seq_search(a, n, keys[k], &c1);
        int p2 = bin_search(a, n, keys[k], &c2);
        printf("找 %2d：顺序查找 %d 次(下标 %2d)  |  折半查找 %d 次(下标 %2d)\\n",
               keys[k], c1, p1, c2, p2);
    }

    printf("\\n递归版验证：找 47 -> 下标 %d\\n", bin_search_rec(a, 0, n - 1, 47));

    printf("\\n== ASL 计算（等概率）==\\n");
    int sum = 0;
    for (int i = 0; i < n; i++) {
        int c;
        bin_search(a, n, a[i], &c);
        sum += c;
    }
    printf("折半查找成功 ASL = %d/%d = %.2f\\n", sum, n, (double)sum / n);
    printf("公式估算 log2(n+1)-1 = %.2f\\n", 3.4594 - 1);   // log2(11)≈3.4594

    printf("\\n== lower_bound（找第一个 >= key 的位置）==\\n");
    int targets[] = {18, 20, 0, 100};
    for (int i = 0; i < 4; i++)
        printf("  第一个 >= %3d 的下标是 %d\\n", targets[i], lower_bound(a, n, targets[i]));

    printf("\\n折半查找的判定树是一棵平衡二叉树，树高 = 最大比较次数 = %d\\n", 4);
    return 0;
}`,
    tips: [
      '写二分时 `while (low <= high)` 配 `low = mid+1 / high = mid-1`，这是一套；`while (low < high)` 配 `low = mid+1 / high = mid`，这是另一套。别混用，混了必死循环。',
      '求"第一个满足条件"的位置，用 lower_bound 模板，比手写 if 靠谱。'
    ],
    traps: [
      '对无序数组用折半查找，结果随机正确——这种 bug 最难查。',
      '`mid = (low+high)/2` 在 low、high 都很大时会溢出，改成 `low + (high-low)/2`。'
    ],
    exercises: ['ex-binary-search']
  },

  {
    id: 'd-search-block',
    ch: 'c7',
    title: '分块查找（索引顺序表）',
    tag: '了解',
    brief: '块间有序、块内无序。先查索引，再在块内顺序查找。',
    tags: ['分块查找', '索引顺序表', '块间有序', 'ASL', '索引'],
    body: `
      <h2>结构</h2>
      <p>把表分成若干块，要求：</p>
      <ul>
        <li><strong>块间有序</strong>：第 i 块的最大值 &lt; 第 i+1 块的最小值。</li>
        <li><strong>块内无序</strong>：块里可以随便排。</li>
      </ul>
      <p>再建一张索引表，每项存"该块的最大值 + 起始下标"。</p>

      <h2>查找过程</h2>
      <ol>
        <li>在索引表里找 key 可能所在的块（索引表有序，可以折半）。</li>
        <li>在该块内顺序查找。</li>
      </ol>

      <h2>ASL 分析</h2>
      <p>设 n 个元素分 b 块，每块 s 个（<code>n = b·s</code>）：</p>
      <ul>
        <li>索引查找平均 <code>(b+1)/2</code> 次。</li>
        <li>块内查找平均 <code>(s+1)/2</code> 次。</li>
        <li>总共 <code>ASL = (b+1)/2 + (s+1)/2</code>，当 <code>s = √n</code> 时取最小值 <code>√n + 1</code>。</li>
      </ul>
      <p>所以分块查找的平均性能介于顺序查找 O(n) 和折半查找 O(log n) 之间，是 <strong>O(√n)</strong>。</p>

      <h2>它有什么用</h2>
      <p>折半查找要求整体有序，插入删除很贵；分块查找只要求块间有序，<strong>插入删除相对便宜</strong>（只在块内动）。所以它是"查得快 + 改得动"的折中方案，数据库的稀疏索引就是类似思想。</p>
      <div class="note">考试重点在 ASL 公式和"最佳分块大小是 √n"这个结论，代码实现反而不常考。</div>
    `,
    code: `#include <stdio.h>
#include <math.h>

#define N 18
#define BLOCK 3            // 每块 3 个元素

typedef struct {
    int maxKey;            // 本块最大值
    int start;             // 本块起始下标
    int len;
} IndexItem;

int main(void) {
    /* 块间有序：每块的最大值递增；块内也按题目约定随便放 */
    /* 标准分块数据：块间严格有序 */
    int arr[N] = {
        8, 12, 22,       // 块 0：8..22
        23, 25, 30,      // 块 1：23..30
        31, 35, 42,      // 块 2
        44, 48, 50,      // 块 3
        52, 58, 60,      // 块 4
        65, 70, 88       // 块 5
    };

    int b = N / BLOCK;
    IndexItem idx[N / BLOCK];
    for (int i = 0; i < b; i++) {
        idx[i].start = i * BLOCK;
        idx[i].len = BLOCK;
        idx[i].maxKey = arr[i * BLOCK + BLOCK - 1];   // 块内有序时最后一个是最大
    }

    printf("== 数据（每块 %d 个，块间有序）==\\n", BLOCK);
    for (int i = 0; i < b; i++) {
        printf("  块 %d（最大 %2d）：", i, idx[i].maxKey);
        for (int j = 0; j < idx[i].len; j++) printf("%3d", arr[idx[i].start + j]);
        printf("\\n");
    }

    printf("\\n== 索引表 ==\\n");
    for (int i = 0; i < b; i++)
        printf("  [%d] maxKey=%2d start=%2d len=%d\\n", i, idx[i].maxKey, idx[i].start, idx[i].len);

    int keys[] = {35, 22, 88, 40, 99};
    printf("\\n== 查找过程 ==\\n");
    for (int k = 0; k < 5; k++) {
        int key = keys[k];
        int cmp = 0, pos = -1, blockNo = -1;

        // 1. 顺序查索引，找第一个 maxKey >= key 的块
        for (int i = 0; i < b; i++) {
            cmp++;
            if (idx[i].maxKey >= key) { blockNo = i; break; }
        }
        // 2. 块内顺序查找
        if (blockNo != -1) {
            for (int j = 0; j < idx[blockNo].len; j++) {
                cmp++;
                if (arr[idx[blockNo].start + j] == key) {
                    pos = idx[blockNo].start + j;
                    break;
                }
            }
        }
        if (pos >= 0)
            printf("  找 %2d：在第 %d 块，下标 %2d，共比较 %d 次\\n", key, blockNo, pos, cmp);
        else
            printf("  找 %2d：没找到（比较 %d 次就断定不存在）\\n", key, cmp);
    }

    printf("\\n== ASL 分析 ==\\n");
    int n = N, s = BLOCK, nb = b;
    double asl = (nb + 1) / 2.0 + (s + 1) / 2.0;
    printf("  n=%d，分成 %d 块，每块 %d 个\\n", n, nb, s);
    printf("  ASL = (b+1)/2 + (s+1)/2 = %.1f + %.1f = %.2f\\n", (nb + 1) / 2.0, (s + 1) / 2.0, asl);
    printf("  理论最优：s = sqrt(n) = %.1f 时 ASL 最小，约 sqrt(n)+1 = %.1f\\n", sqrt(n), sqrt(n) + 1);
    printf("  对比：顺序查找 ASL=%.1f，折半查找 ASL≈%.1f\\n", (n + 1) / 2.0, log2(n + 1) - 1);
    return 0;
}`,
    tips: [
      '分块查找的代码不常考，但"为什么 s=√n 最优"要会推：ASL 对 s 求导等于 0。',
      '数据库的稀疏索引（每个数据页存一个最大 key）就是分块查找的工业版。'
    ],
    traps: [
      '索引表必须有序（按每块最大值递增），否则第一步就找错块。',
      '块内如果也有序，那直接在块内折半，性能更好——题目如果说"块内有序"，记得用折半。'
    ]
  },

  {
    id: 'd-hash',
    ch: 'c7',
    title: '哈希表：装填因子、冲突与 ASL',
    tag: '必学·重点',
    brief: '用关键字直接算地址，理想 O(1)。冲突处理分开放定址和拉链法。',
    tags: ['哈希表', '散列表', '哈希函数', '冲突', '线性探测', '拉链法', '装填因子', 'ASL'],
    body: `
      <h2>核心思想</h2>
      <p><code>addr = H(key)</code>。不比较、直接算，理想情况 O(1)。但不同 key 可能算出同一个地址，这叫<strong>冲突</strong>，必须有处理策略。</p>

      <h2>常见哈希函数</h2>
      <ul>
        <li><strong>除留余数法</strong>：<code>H(key) = key % p</code>，p 取小于表长的最大质数（最常用）。</li>
        <li>直接定址法：<code>H(key) = a·key + b</code>，不冲突但要求关键字连续。</li>
        <li>平方取中法、折叠法：适合位数多的关键字。</li>
      </ul>

      <h2>冲突处理</h2>
      <table>
        <tr><th>方法</th><th>做法</th><th>特点</th></tr>
        <tr><td>线性探测</td><td>冲突了就往后找下一个空位</td><td>简单，但会产生<b>堆积</b>（连续占满，查找变慢）</td></tr>
        <tr><td>二次探测</td><td>偏移 1², −1², 2², −2²…</td><td>减少堆积，但可能探测不到所有位置</td></tr>
        <tr><td>再散列</td><td>换一个哈希函数再算</td><td>需要多个函数</td></tr>
        <tr><td>拉链法</td><td>同一地址的元素挂成链表</td><td>不产生堆积，删除方便，工程最常用</td></tr>
      </table>

      <h2>装填因子 α</h2>
      <p><code>α = 表中元素个数 / 表长</code>。α 越大冲突越多、ASL 越大。<strong>哈希表的平均查找长度只和 α 有关，和元素总数无关</strong>——这是它区别于其他查找方法的最大特点。</p>
      <ul>
        <li>线性探测：成功 ASL ≈ <code>(1 + 1/(1−α))/2</code></li>
        <li>拉链法：成功 ASL ≈ <code>1 + α/2</code></li>
      </ul>
      <p>所以工程上一般把 α 控制在 0.75 以下，超了就扩容（rehash）。</p>

      <h2>删除的坑</h2>
      <div class="warn">开放定址法<strong>不能直接删除</strong>元素！直接置空会切断探测链，导致后面的元素找不到。必须用"墓碑标记"（标记为已删除但探测时继续往后走）。拉链法就没这个问题。</div>

      <h2>ASL 计算题</h2>
      <p>给一组关键字和哈希函数，画出表，然后逐个算"查找每个元素需要比较几次"，求和除以个数。记住：<strong>比较次数 = 探测次数</strong>，第一次就算 1 次。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define M 11               // 表长（质数）
#define EMPTY -1
#define DELETED -2

/* ---------- 开放定址法：线性探测 ---------- */
typedef struct {
    int key[M];
} HashTable;

int hash(int key) { return ((key % M) + M) % M; }

void initTable(HashTable *h) {
    for (int i = 0; i < M; i++) h->key[i] = EMPTY;
}

int insertLinear(HashTable *h, int key, int *probes) {
    int idx = hash(key);
    int i = 0;
    *probes = 0;
    while (i < M) {
        int p = (idx + i) % M;
        (*probes)++;
        if (h->key[p] == EMPTY || h->key[p] == DELETED) {
            h->key[p] = key;
            return p;
        }
        if (h->key[p] == key) return -1;    // 已存在
        i++;
    }
    return -1;                              // 表满
}

int searchLinear(HashTable *h, int key, int *probes) {
    int idx = hash(key);
    *probes = 0;
    for (int i = 0; i < M; i++) {
        int p = (idx + i) % M;
        (*probes)++;
        if (h->key[p] == EMPTY) return -1;
        if (h->key[p] == key) return p;
    }
    return -1;
}

/* ---------- 拉链法 ---------- */
typedef struct Node {
    int key;
    struct Node *next;
} Node;

Node *chain[M];

void insertChain(int key, int *probes) {
    int idx = hash(key);
    *probes = 0;
    Node *p = (Node *)malloc(sizeof(Node));
    p->key = key;
    p->next = chain[idx];
    chain[idx] = p;
    (*probes)++;
}

int searchChain(int key, int *probes) {
    int idx = hash(key);
    *probes = 0;
    for (Node *p = chain[idx]; p; p = p->next) {
        (*probes)++;
        if (p->key == key) return idx;
    }
    return -1;
}

void printTable(HashTable *h) {
    printf("下标: ");
    for (int i = 0; i < M; i++) printf("%3d", i);
    printf("\\n数据: ");
    for (int i = 0; i < M; i++) {
        if (h->key[i] == EMPTY) printf("  .");
        else if (h->key[i] == DELETED) printf("  x");
        else printf("%3d", h->key[i]);
    }
    printf("\\n");
}

int main(void) {
    /* 经典例子：H(key) = key % 11 */
    int keys[] = {22, 41, 53, 46, 30, 13, 1, 67};
    int n = 8;

    printf("哈希函数 H(key) = key %% %d，装填因子 α = %d/%d = %.2f\\n\\n",
           M, n, M, (double)n / M);

    /* ---- 线性探测 ---- */
    printf("== 线性探测法 ==\\n");
    HashTable h;
    initTable(&h);
    for (int i = 0; i < n; i++) {
        int probes;
        int pos = insertLinear(&h, keys[i], &probes);
        printf("  插入 %2d：H=%2d，探测 %d 次，放在下标 %2d\\n",
               keys[i], hash(keys[i]), probes, pos);
    }
    printTable(&h);

    int totalProbes = 0;
    printf("\\n  查找（成功）：\\n");
    for (int i = 0; i < n; i++) {
        int probes;
        int pos = searchLinear(&h, keys[i], &probes);
        totalProbes += probes;
        printf("    %2d -> 下标 %2d，比较 %d 次\\n", keys[i], pos, probes);
    }
    printf("  成功 ASL = %d/%d = %.2f\\n", totalProbes, n, (double)totalProbes / n);
    printf("  公式估计 (1 + 1/(1-α))/2 = %.2f\\n",
           0.5 * (1 + 1 / (1 - (double)n / M)));

    /* ---- 拉链法 ---- */
    printf("\\n== 拉链法 ==\\n");
    for (int i = 0; i < M; i++) chain[i] = NULL;
    for (int i = 0; i < n; i++) {
        int probes;
        insertChain(keys[i], &probes);
    }
    for (int i = 0; i < M; i++) {
        if (!chain[i]) continue;
        printf("  [%2d]: ", i);
        for (Node *p = chain[i]; p; p = p->next)
            printf("%d%s", p->key, p->next ? " -> " : "");
        printf("\\n");
    }

    int total2 = 0;
    for (int i = 0; i < n; i++) {
        int probes;
        searchChain(keys[i], &probes);
        total2 += probes;
    }
    printf("  成功 ASL = %d/%d = %.2f（比线性探测小）\\n", total2, n, (double)total2 / n);
    printf("  公式估计 1 + α/2 = %.2f\\n", 1 + (double)n / M / 2);

    printf("\\n结论：装填因子相同时，拉链法的 ASL 通常更小，而且删除方便。\\n");
    return 0;
}`,
    tips: [
      '考试算 ASL 时列个表：每个元素探测了几次，求和除以元素个数，别凭感觉。',
      '拉链法在工程里最常用（Java HashMap、Redis dict 都用），因为删除和扩容都简单。'
    ],
    traps: [
      '开放定址法直接删除元素会切断探测链，必须用墓碑标记。',
      '表长尽量取质数，取 2 的幂会让 `key % M` 只用低位，冲突率飙升。'
    ],
    exercises: ['ex-hash']
  },

  /* ══════════════════════════ 第 8 章 ══════════════════════════ */
  {
    id: 'd-sort-basic',
    ch: 'c8',
    title: '排序概述：稳定性到底有什么用',
    tag: '必学',
    brief: '稳定 = 相等元素排序后相对顺序不变。内部排序 vs 外部排序。',
    tags: ['排序', '稳定性', '内部排序', '外部排序', '原地排序', '比较次数'],
    body: `
      <h2>两种分类</h2>
      <ul>
        <li><strong>内部排序</strong>：数据全在内存里排（本章讲的都是）。</li>
        <li><strong>外部排序</strong>：数据太大装不下，要借助磁盘（多路归并）。</li>
      </ul>

      <h2>稳定性</h2>
      <p>如果两个元素关键字相等，排序前后它们的<strong>相对顺序不变</strong>，这个算法就稳定。</p>
      <p>为什么重要？比如学生成绩表先按姓名排、再按分数排，如果分数排序是稳定的，同分的人还保持姓名的字典序；不稳定就乱了。</p>

      <h2>稳定性速查表（必背）</h2>
      <table>
        <tr><th>稳定</th><th>不稳定</th></tr>
        <tr><td>插入、冒泡、归并、基数</td><td>希尔、快速、选择、堆</td></tr>
      </table>
      <p>记忆口诀："<strong>插入冒泡归并基数稳，希尔快选堆不稳</strong>"。简单选择排序不稳定的原因：把最小值换到前面时，可能把它前面相等的元素换到后面去了。</p>

      <h2>原地排序</h2>
      <p>空间复杂度 O(1) 的叫原地排序：插入、冒泡、选择、希尔、堆、快速（递归栈 O(log n) 算辅助）。归并需要 O(n) 辅助数组，基数需要 O(n+r)。</p>

      <h2>本章会讲的算法</h2>
      <table>
        <tr><th>算法</th><th>平均</th><th>最坏</th><th>空间</th><th>稳定</th></tr>
        <tr><td>直接插入</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>是</td></tr>
        <tr><td>希尔</td><td>O(n^1.3)</td><td>O(n²)</td><td>O(1)</td><td>否</td></tr>
        <tr><td>冒泡</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>是</td></tr>
        <tr><td>快速</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>否</td></tr>
        <tr><td>简单选择</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>否</td></tr>
        <tr><td>堆排序</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>否</td></tr>
        <tr><td>归并</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>是</td></tr>
        <tr><td>基数</td><td>O(d(n+r))</td><td>O(d(n+r))</td><td>O(n+r)</td><td>是</td></tr>
      </table>
      <div class="note">这张表是考试和面试的核心，建议手抄三遍。下面代码演示"稳定 vs 不稳定"到底差在哪。</div>
    `,
    code: `#include <stdio.h>

typedef struct {
    int score;
    char name[8];
    int id;              // 原始顺序，用来观察稳定性
} Student;

void print(Student *a, int n, const char *tag) {
    printf("%s", tag);
    for (int i = 0; i < n; i++)
        printf("%s(%d)", a[i].name, a[i].score);
    printf("\\n");
}

/* 稳定的冒泡：只有严格大于才交换 */
void bubble_stable(Student *a, int n) {
    for (int i = 0; i < n - 1; i++)
        for (int j = 0; j < n - 1 - i; j++)
            if (a[j].score > a[j + 1].score) {   // 不用 >=
                Student t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
            }
}

/* 不稳定的选择排序：直接交换，可能破坏相对顺序 */
void select_unstable(Student *a, int n) {
    for (int i = 0; i < n - 1; i++) {
        int min = i;
        for (int j = i + 1; j < n; j++)
            if (a[j].score < a[min].score) min = j;
        if (min != i) {
            Student t = a[i]; a[i] = a[min]; a[min] = t;
        }
    }
}

int main(void) {
    /* 三个 90 分的学生，原始顺序 A B C */
    Student s1[] = {
        {90, "A", 1}, {85, "B", 2}, {90, "C", 3}, {70, "D", 4}, {90, "E", 5}
    };
    Student s2[] = {
        {90, "A", 1}, {85, "B", 2}, {90, "C", 3}, {70, "D", 4}, {90, "E", 5}
    };
    int n = 5;

    print(s1, n, "原始：          ");
    bubble_stable(s1, n);
    print(s1, n, "冒泡排序后：    ");
    printf("  90 分的三个仍然是 A C E 顺序 -> 稳定\\n\\n");

    print(s2, n, "原始：          ");
    select_unstable(s2, n);
    print(s2, n, "选择排序后：    ");
    printf("  看 90 分的三个：%s%s%s -> 顺序变了说明不稳定\\n", s2[2].name, s2[3].name, s2[4].name);

    printf("\\n== 不稳定的原因 ==\\n");
    printf("选择排序第 1 轮：从 [A(90) B(85) C(90) D(70) E(90)] 里找最小 D(70)，\\n");
    printf("把 D 和 A 交换 -> [D A? 不对，是 D B C A E]\\n");
    printf("A 被换到了最后，于是 A 和 C 的相对顺序就反了。\\n");
    return 0;
}`,
    tips: [
      '判断稳定性有个懒办法：看算法有没有"长距离交换"。选择排序、快排、堆排序都有，所以不稳定。',
      '面试问"稳定排序有哪些"，答插入、冒泡、归并、基数，别只答一个。'
    ],
    traps: [
      '冒泡写成 `if (a[j] >= a[j+1])` 会变成不稳定（相等也交换），一个小符号决定稳定性。',
      '稳定性只在"按多个关键字排序"时才有意义，单个数字排序无所谓。'
    ]
  },

  {
    id: 'd-sort-insert',
    ch: 'c8',
    title: '直接插入排序与折半插入',
    tag: '必学',
    brief: '把当前元素插到前面已排好的序列里。近乎有序时接近 O(n)。',
    tags: ['插入排序', '直接插入', '折半插入', '哨兵', '稳定性'],
    body: `
      <h2>思想</h2>
      <p>把数组分成"已排序前缀"和"未排序后缀"。每次取后缀第一个元素，在前面找到位置插进去，后面的元素整体后移。</p>
      <pre><code>for (i = 2; i &lt;= n; i++) {
    if (a[i] &lt; a[i-1]) {
        a[0] = a[i];                     // 哨兵，同时暂存
        for (j = i-1; a[0] &lt; a[j]; j--)
            a[j+1] = a[j];               // 后移
        a[j+1] = a[0];
    }
}</code></pre>
      <p>教材里 <code>a[0]</code> 当哨兵，好处是内层循环不用判 <code>j &gt;= 0</code>（因为 <code>a[0]</code> 一定不小于自己，循环必然停）。这是个小技巧，能少一次比较。</p>

      <h2>复杂度</h2>
      <table>
        <tr><th>情况</th><th>比较次数</th><th>移动次数</th><th>复杂度</th></tr>
        <tr><td>最好（已有序）</td><td>n−1</td><td>0</td><td>O(n)</td></tr>
        <tr><td>最坏（逆序）</td><td>n(n−1)/2</td><td>n(n−1)/2</td><td>O(n²)</td></tr>
        <tr><td>平均</td><td>≈n²/4</td><td>≈n²/4</td><td>O(n²)</td></tr>
      </table>
      <p><strong>稳定</strong>（相等不交换），空间 O(1)。</p>

      <h2>什么时候它反而最快</h2>
      <p>数据<strong>基本有序</strong>时，插入排序接近 O(n)，比快排还快。所以工程里的混合排序（如 TimSort、std::sort 的小数组分支）会在小规模/近乎有序时切换到插入排序。</p>

      <h2>折半插入</h2>
      <p>找位置那一步用二分，比较次数降到 O(n log n)，但<strong>移动次数还是 O(n²)</strong>，总复杂度仍是 O(n²)。考试爱考"折半插入减少了什么"→ 减少比较次数，不减少移动次数。</p>
    `,
    code: `#include <stdio.h>

void print(int *a, int n, const char *tag) {
    printf("%-14s", tag);
    for (int i = 1; i <= n; i++) printf("%3d", a[i]);
    printf("\\n");
}

/* 直接插入（a[0] 作哨兵，数据从 1 开始） */
void insertSort(int *a, int n, int verbose) {
    int cmp = 0, move = 0;
    for (int i = 2; i <= n; i++) {
        cmp++;
        if (a[i] < a[i - 1]) {
            a[0] = a[i];                 // 暂存 + 哨兵
            int j = i - 1;
            while (a[0] < a[j]) {        // 不用判 j >= 1，哨兵会挡
                cmp++;
                a[j + 1] = a[j];
                move++;
                j--;
            }
            a[j + 1] = a[0];
            move++;
        }
        if (verbose) {
            printf("  第 %d 个元素（%d）插入后：", i, a[0] ? a[i] : 0);
            for (int k = 1; k <= n; k++) printf("%3d", a[k]);
            printf("\\n");
        }
    }
    printf("  比较 %d 次，移动 %d 次\\n", cmp, move);
}

/* 折半插入：只减少比较次数 */
void binInsertSort(int *a, int n) {
    int cmp = 0, move = 0;
    for (int i = 2; i <= n; i++) {
        a[0] = a[i];
        int low = 1, high = i - 1;
        while (low <= high) {
            cmp++;
            int mid = (low + high) / 2;
            if (a[mid] > a[0]) high = mid - 1;
            else low = mid + 1;          // 相等时插在后面 -> 保持稳定
        }
        for (int j = i - 1; j >= low; j--) { a[j + 1] = a[j]; move++; }
        a[low] = a[0];
        move++;
    }
    printf("  比较 %d 次，移动 %d 次\\n", cmp, move);
}

int main(void) {
    /* a[0] 是哨兵位，数据从下标 1 开始 */
    int a1[] = {0, 49, 38, 65, 97, 76, 13, 27, 49};
    int n = 8;

    printf("原始：");
    for (int i = 1; i <= n; i++) printf("%3d", a1[i]);
    printf("\\n\\n");

    printf("== 直接插入排序（逐步）==\\n");
    insertSort(a1, n, 1);
    print(a1, n, "结果：");

    int a2[] = {0, 49, 38, 65, 97, 76, 13, 27, 49};
    printf("\\n== 折半插入排序 ==\\n");
    binInsertSort(a2, n);
    print(a2, n, "结果：");

    printf("\\n两者结果相同。折半插入只减少了「比较」次数，\\n");
    printf("「移动」次数一样多，所以总复杂度还是 O(n²)。\\n");

    printf("\\n== 最好情况：已经有序 ==\\n");
    int a3[] = {0, 1, 2, 3, 4, 5, 6, 7, 8};
    insertSort(a3, 8, 0);
    printf("  只比较 n-1 次，移动 0 次 -> O(n)，这是插入排序的主场\\n");

    printf("\\n== 最坏情况：完全逆序 ==\\n");
    int a4[] = {0, 8, 7, 6, 5, 4, 3, 2, 1};
    insertSort(a4, 8, 0);
    printf("  比较和移动都是 n(n-1)/2 = 28 次 -> O(n²)\\n");

    printf("\\n插入排序是稳定的：相等元素不会被交换。\\n");
    return 0;
}`,
    tips: [
      '哨兵 `a[0]` 的写法能省一次边界判断，是教材经典技巧，考试常问"哨兵的作用"。',
      '数据量小于 20 时，插入排序往往比快排快，因为常数因子小。'
    ],
    traps: [
      '内层循环 `while (a[0] < a[j])` 用 `<` 才是稳定；用 `<=` 会破坏稳定性。',
      'a[0] 当哨兵后，真实数据必须从下标 1 开始存，从 0 开始会覆盖数据。'
    ],
    exercises: ['ex-insert-sort']
  },

  {
    id: 'd-sort-shell',
    ch: 'c8',
    title: '希尔排序：插入排序的加强版',
    tag: '重点',
    brief: '按增量分组做插入排序，增量逐渐减到 1。不稳定。',
    tags: ['希尔排序', '增量', '缩小增量', '分组插入', '不稳定'],
    body: `
      <h2>为什么需要它</h2>
      <p>插入排序在"基本有序"时很快，但逆序时要移动 O(n²) 次。希尔排序的思路：<strong>先用大步长把元素大致挪到该在的位置，让序列变得"基本有序"，最后再用增量 1 做一次插入排序</strong>——这时候插入排序几乎不用动。</p>

      <h2>算法</h2>
      <pre><code>for (gap = n/2; gap &gt; 0; gap /= 2)      // 增量序列
    for (i = gap + 1; i &lt;= n; i++)      // 各组分别插入排序
        if (a[i] &lt; a[i-gap]) {
            a[0] = a[i];
            for (j = i-gap; j &gt; 0 &amp;&amp; a[0] &lt; a[j]; j -= gap)
                a[j+gap] = a[j];
            a[j+gap] = a[0];
        }</code></pre>
      <p>可以理解成"<strong>每隔 gap 个取一个元素组成一组，组内做插入排序</strong>"。gap 递减到 1 时就是普通插入排序。</p>

      <h2>复杂度与稳定性</h2>
      <ul>
        <li>时间复杂度依赖增量序列：Hibbard 增量约 O(n^1.5)，Sedgewick 约 O(n^1.3)，取 n/2 折半最坏 O(n²)。</li>
        <li>空间 O(1)。</li>
        <li><strong>不稳定</strong>：相同元素可能被分到不同组，相对顺序会变。</li>
      </ul>

      <h2>增量怎么取</h2>
      <table>
        <tr><th>序列</th><th>复杂度</th><th>说明</th></tr>
        <tr><td>n/2, n/4, …, 1</td><td>O(n²)</td><td>最教科书的写法</td></tr>
        <tr><td>2^k − 1（Hibbard）</td><td>O(n^1.5)</td><td>互质效果好</td></tr>
        <tr><td>1, 5, 19, 41…（Sedgewick）</td><td>O(n^1.3)</td><td>工程常用</td></tr>
      </table>
      <div class="note">增量序列最后必须是 1，否则不能保证完全有序。这一点考试爱抠。</div>

      <h2>为什么比插入快</h2>
      <p>插入排序每次只能把元素移动一位，希尔排序一次能移动 gap 位。<strong>大步长让元素快速接近目标位置</strong>，后面的小步长只需要微调。这就是"减少总移动次数"的思路。</p>
    `,
    code: `#include <stdio.h>

void print(int *a, int n, const char *tag) {
    printf("%-22s", tag);
    for (int i = 1; i <= n; i++) printf("%3d", a[i]);
    printf("\\n");
}

void shellSort(int *a, int n, int verbose) {
    int totalMove = 0, totalCmp = 0;

    for (int gap = n / 2; gap > 0; gap /= 2) {
        if (verbose) printf("\\n增量 gap = %d，分成 %d 组：\\n", gap, gap);

        for (int i = gap + 1; i <= n; i++) {
            if (a[i] < a[i - gap]) {
                a[0] = a[i];
                int j = i - gap;
                while (j > 0 && a[0] < a[j]) {
                    totalCmp++;
                    a[j + gap] = a[j];
                    totalMove++;
                    j -= gap;
                }
                a[j + gap] = a[0];
                totalMove++;
            }
        }
        if (verbose) {
            char buf[32];
            snprintf(buf, sizeof(buf), "  gap=%d 排序后：", gap);
            print(a, n, buf);

            // 展示每组的内容
            for (int g = 1; g <= gap && g <= 4; g++) {
                printf("    第 %d 组：", g);
                for (int k = g; k <= n; k += gap) printf("%3d", a[k]);
                printf("\\n");
            }
        }
    }
    printf("\\n总比较 %d 次，总移动 %d 次\\n", totalCmp, totalMove);
}

int main(void) {
    int a[] = {0, 49, 38, 65, 97, 76, 13, 27, 49, 55, 4};
    int n = 10;

    printf("原始：");
    for (int i = 1; i <= n; i++) printf("%3d", a[i]);
    printf("\\n");

    shellSort(a, n, 1);
    print(a, n, "最终结果：");

    printf("\\n对比：同样数据用插入排序要移动约 %d 次，希尔少得多。\\n", n * n / 4);

    printf("\\n== 稳定性反例 ==\\n");
    printf("数据 [2a, 2b, 1]，gap=2 时 2a 和 1 一组、2b 单独一组；\\n");
    printf("排完变成 [1, 2b, 2a]，两个 2 的相对顺序变了 -> 不稳定。\\n");

    int b[] = {0, 2, 2, 1};
    printf("\\n实测 [2, 2, 1]（gap=2）：\\n");
    shellSort(b, 3, 0);
    printf("结果：");
    for (int i = 1; i <= 3; i++) printf("%d ", b[i]);
    printf("\\n（值相等时分不出先后，但算法内部确实可能交换过）\\n");
    return 0;
}`,
    tips: [
      '希尔排序的代码结构和插入排序几乎一样，只是把 `1` 换成 `gap`，理解这点就通了。',
      '增量必须递减到 1；考试常问"增量序列的最后一个值是什么"。'
    ],
    traps: [
      '内层循环条件 `j > 0 && a[0] < a[j]` 里 `j > 0` 不能省，因为跨 gap 移动可能越界。',
      '希尔排序不稳定，别看到"插入排序"四个字就以为稳定。'
    ]
  },

  {
    id: 'd-sort-swap',
    ch: 'c8',
    title: '冒泡排序与快速排序（重点）',
    tag: '必学·重点',
    brief: '快排平均 O(n log n)，是最常用的内部排序；但最坏 O(n²)。',
    tags: ['冒泡排序', '快速排序', '快排', 'partition', '枢轴', 'pivot', '分治'],
    body: `
      <h2>冒泡排序</h2>
      <p>相邻两个比较，大的往后冒。每趟确定一个最大值。<strong>稳定</strong>，O(n²)，但可以加"本趟没交换就提前结束"的优化，最好情况 O(n)。</p>

      <h2>快速排序（核心）</h2>
      <p>选一个枢轴（pivot），把数组分成"小于它"和"大于它"两半，再递归处理两半。分治思想。</p>

      <h3>partition 是快排的灵魂</h3>
      <pre><code>int pivot = a[low];
while (low &lt; high) {
    while (low &lt; high &amp;&amp; a[high] &gt;= pivot) high--;
    a[low] = a[high];
    while (low &lt; high &amp;&amp; a[low] &lt;= pivot) low++;
    a[high] = a[low];
}
a[low] = pivot;
return low;</code></pre>
      <div class="warn">两个内层 while 的 <code>low &lt; high</code> 不能省，否则指针会跑出去。这是手写快排最容易错的地方。</div>
      <p>这个"挖坑填数"的写法比"交换法"少很多交换操作，考试和面试都推荐。</p>

      <h3>复杂度</h3>
      <table>
        <tr><th>情况</th><th>复杂度</th><th>什么时候发生</th></tr>
        <tr><td>最好/平均</td><td>O(n log n)</td><td>枢轴比较均匀地分开</td></tr>
        <tr><td>最坏</td><td>O(n²)</td><td>已有序/逆序 + 取第一个作枢轴</td></tr>
        <tr><td>空间</td><td>O(log n) ~ O(n)</td><td>递归栈深度</td></tr>
      </table>
      <p>最坏情况怎么避免？<strong>随机选枢轴</strong>或<strong>三数取中</strong>。工程实现（如 std::sort）用的是 introsort：快排 + 堆排 + 插入排序混合。</p>

      <h2>快排为什么不稳定</h2>
      <p>partition 时枢轴和远处的元素交换，跨越了很多元素，相等元素的相对顺序可能被打乱。</p>

      <h2>什么时候快排最快</h2>
      <p>数据随机、内存里、追求平均性能。它的常数因子小，实际比归并和堆排都快——所以是"最快的通用排序"。但如果有大量重复元素，用三路快排（分成 &lt;、=、&gt; 三段）更快。</p>
    `,
    code: `#include <stdio.h>

void print(int *a, int n, const char *tag) {
    printf("%-16s", tag);
    for (int i = 0; i < n; i++) printf("%3d", a[i]);
    printf("\\n");
}

/* ---------- 冒泡（带提前结束优化）---------- */
void bubbleSort(int *a, int n) {
    int cmp = 0, swapCnt = 0;
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            cmp++;
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                swapCnt++;
                swapped = 1;
            }
        }
        if (!swapped) break;          // 本趟没交换，已经有序
    }
    printf("  冒泡：比较 %d 次，交换 %d 次\\n", cmp, swapCnt);
}

/* ---------- 快速排序：挖坑填数 ---------- */
int partition(int *a, int low, int high) {
    int pivot = a[low];               // 取第一个作枢轴
    while (low < high) {
        while (low < high && a[high] >= pivot) high--;
        a[low] = a[high];
        while (low < high && a[low] <= pivot) low++;
        a[high] = a[low];
    }
    a[low] = pivot;
    return low;
}

void quickSortRec(int *a, int low, int high, int level, int *maxDepth) {
    if (level > *maxDepth) *maxDepth = level;
    if (low >= high) return;

    int p = partition(a, low, high);

    // 教学演示：打印每层划分结果
    printf("  深度 %d：枢轴 %2d 归位到下标 %d -> ", level, a[p], p);
    for (int i = low; i <= high; i++) printf("%3d", a[i]);
    printf("\\n");

    quickSortRec(a, low, p - 1, level + 1, maxDepth);
    quickSortRec(a, p + 1, high, level + 1, maxDepth);
}

void quickSort(int *a, int n) {
    int maxDepth = 0;
    quickSortRec(a, 0, n - 1, 1, &maxDepth);
    printf("  递归最大深度 %d\\n", maxDepth);
}

int main(void) {
    int a1[] = {49, 38, 65, 97, 76, 13, 27, 49};
    int n = 8;

    print(a1, n, "原始：");
    printf("\\n== 冒泡排序 ==\\n");
    bubbleSort(a1, n);
    print(a1, n, "结果：");

    int a2[] = {49, 38, 65, 97, 76, 13, 27, 49};
    printf("\\n== 快速排序（逐步）==\\n");
    quickSort(a2, n);
    print(a2, n, "结果：");

    printf("\\n== 快排的最坏情况 ==\\n");
    int a3[] = {1, 2, 3, 4, 5, 6, 7, 8};
    print(a3, 8, "已有序：");
    printf("  取第一个作枢轴，每次只能分出一个元素：\\n");
    quickSort(a3, 8);
    printf("  -> 递归深度 8，退化成 O(n²)\\n");
    printf("  解决办法：随机选枢轴 / 三数取中。\\n");

    printf("\\n== 三数取中（改良版）==\\n");
    printf("取 a[low]、a[mid]、a[high] 的中位数作枢轴，\\n");
    printf("有序数据就不会退化了。这是工程实现的标准做法。\\n");

    printf("\\n快排不稳定，但平均最快，是 std::sort 的基础。\\n");
    return 0;
}`,
    tips: [
      '手写 partition 时，先背"挖坑填数"的模板，再理解为什么两个 while 都要 `low < high`。',
      '快排递归时先处理较短的一边、尾递归优化较长的一边，能把栈深度降到 O(log n)。'
    ],
    traps: [
      'partition 里 `a[high] >= pivot` 的等号：不加等号，遇到全部相等的元素会死循环或退化。',
      '快排处理大量重复元素时退化成 O(n²)，要用三路划分。'
    ],
    exercises: ['ex-quicksort']
  },

  {
    id: 'd-sort-select',
    ch: 'c8',
    title: '选择排序与堆排序',
    tag: '重点',
    brief: '堆排序是唯一"最坏也是 O(n log n) + 原地"的排序。',
    tags: ['选择排序', '堆排序', '大根堆', '小根堆', '建堆', '筛选', 'sift'],
    body: `
      <h2>简单选择排序</h2>
      <p>每趟从未排序部分选出最小值，和第 i 个位置交换。比较次数固定 <code>n(n−1)/2</code>，交换最多 n−1 次。<strong>不稳定</strong>，O(n²)。</p>
      <p>它的优点是<strong>交换次数少</strong>，适合"元素移动代价很大"的场景。</p>

      <h2>堆排序</h2>
      <p>先建<strong>大根堆</strong>（每个结点 ≥ 孩子），然后反复"取堆顶（最大值）放末尾，再调整堆"。</p>

      <h3>两个核心操作</h3>
      <ol>
        <li><strong>向下调整（sift）</strong>：从某个结点开始，和较大的孩子比较，不满足堆性质就交换，一路往下。</li>
        <li><strong>建堆</strong>：从最后一个非叶结点 <code>n/2</code> 开始，倒着对每个结点做 sift。时间 O(n)（不是 O(n log n)！）。</li>
      </ol>
      <pre><code>for (i = n/2; i &gt;= 1; i--) sift(a, i, n);       // 建堆 O(n)
for (i = n; i &gt; 1; i--) {                        // 排序 O(n log n)
    swap(a[1], a[i]);                            // 堆顶放末尾
    sift(a, 1, i-1);                             // 剩下部分重新调整
}</code></pre>

      <h3>复杂度</h3>
      <ul>
        <li>建堆 O(n)，每次调整 O(log n)，共 n−1 次 → 总 <span class="complexity">O(n log n)</span>。</li>
        <li><strong>最好、最坏、平均都是 O(n log n)</strong>，这点比快排强。</li>
        <li>空间 O(1)，原地。</li>
        <li><strong>不稳定</strong>。</li>
      </ul>
      <div class="note">"建堆为什么是 O(n) 而不是 O(n log n)"是经典面试题。因为大部分结点都在底层，sift 的代价很小，求和后收敛到 O(n)。</div>

      <h2>堆的其他用途</h2>
      <ul>
        <li><strong>优先队列</strong>：插入/取最值都是 O(log n)。</li>
        <li><strong>Top K 问题</strong>：求最大的 K 个，用容量 K 的小根堆，O(n log K)。</li>
        <li>Dijkstra 的优先队列优化、任务调度、合并 K 个有序链表。</li>
      </ul>
      <p>堆在内存里就是数组，下标从 1 开始时：父 <code>i/2</code>，左孩子 <code>2i</code>，右孩子 <code>2i+1</code>。</p>
    `,
    code: `#include <stdio.h>

void print(int *a, int n, int start) {
    for (int i = start; i <= n; i++) printf("%3d", a[i]);
    printf("\\n");
}

/* 简单选择排序 */
void selectSort(int *a, int n) {
    int cmp = 0, swp = 0;
    for (int i = 1; i < n; i++) {
        int min = i;
        for (int j = i + 1; j <= n; j++) {
            cmp++;
            if (a[j] < a[min]) min = j;
        }
        if (min != i) {
            int t = a[i]; a[i] = a[min]; a[min] = t;
            swp++;
        }
    }
    printf("  选择排序：比较 %d 次，交换 %d 次\\n", cmp, swp);
}

/* 向下调整：把 i 为根的子树调整成大根堆，范围 1..len */
void sift(int *a, int i, int len) {
    int tmp = a[i];
    int j = 2 * i;                       // 左孩子
    while (j <= len) {
        if (j < len && a[j + 1] > a[j]) j++;    // 选较大的孩子
        if (tmp >= a[j]) break;                 // 已满足堆性质
        a[i] = a[j];
        i = j;
        j = 2 * i;
    }
    a[i] = tmp;
}

void heapSort(int *a, int n, int verbose) {
    printf("  建堆（从 a[%d] 开始倒着 sift）：\\n", n / 2);
    for (int i = n / 2; i >= 1; i--) {
        sift(a, i, n);
        if (verbose) {
            printf("    sift(a,%d) 后：", i);
            print(a, n, 1);
        }
    }

    printf("  排序（每次取堆顶放末尾）：\\n");
    for (int i = n; i > 1; i--) {
        int t = a[1]; a[1] = a[i]; a[i] = t;
        sift(a, 1, i - 1);
    }
}

int main(void) {
    int a1[] = {0, 49, 38, 65, 97, 76, 13, 27, 49};
    int n = 8;

    printf("原始：");
    print(a1, n, 1);

    printf("\\n== 简单选择排序 ==\\n");
    selectSort(a1, n);
    printf("  结果：");
    print(a1, n, 1);

    int a2[] = {0, 49, 38, 65, 97, 76, 13, 27, 49};
    printf("\\n== 堆排序 ==\\n");
    heapSort(a2, n, 1);
    printf("\\n  最终结果：");
    print(a2, n, 1);

    printf("\\n== 堆的数组表示 ==\\n");
    printf("  大根堆最终形态（数组）：");
    print(a2, n, 1);
    printf("  父 i 的孩子是 2i 和 2i+1，所以 a[1]=%d 是最大值\\n", a2[1]);
    printf("  但注意：堆排序后的数组是递增的，堆性质已经被破坏（排序完成了）。\\n");

    printf("\\n== Top K 思路 ==\\n");
    printf("  求最大的 3 个：维护一个容量 3 的小根堆，\\n");
    printf("  遍历数组，比堆顶大就替换并调整 -> O(n log K)\\n");

    printf("\\n堆排序最坏也是 O(n log n)，而且原地，缺点是常数大、不稳定。\\n");
    return 0;
}`,
    tips: [
      'sift 里先 `tmp = a[i]` 暂存，然后一路"上移孩子"，最后再赋值，比反复 swap 快。',
      '建堆从 `n/2` 开始，因为下标大于 n/2 的都是叶子，天然是堆。'
    ],
    traps: [
      '下标从 0 开始的堆，孩子是 2i+1 和 2i+2，和教材的写法差 1，混用必错。',
      '建堆是 O(n) 不是 O(n log n)，这个考点几乎年年出现。'
    ]
  },

  {
    id: 'd-sort-merge',
    ch: 'c8',
    title: '归并排序：稳定 + 最坏 O(n log n)',
    tag: '重点',
    brief: '分治合并，需要 O(n) 辅助空间。是外部排序的基础。',
    tags: ['归并排序', '分治', '合并', '稳定', 'O(nlogn)', '外部排序'],
    body: `
      <h2>思想</h2>
      <p>把数组对半分成两段，分别排序，再把两个有序段<strong>合并</strong>成一个。合并是核心，也是它稳定的原因。</p>
      <pre><code>void mergeSort(a, low, high) {
    if (low &gt;= high) return;
    mid = (low + high) / 2;
    mergeSort(a, low, mid);
    mergeSort(a, mid+1, high);
    merge(a, low, mid, high);       // 合并两个有序段
}</code></pre>

      <h2>合并操作</h2>
      <p>两个指针各指一段的开头，谁小放谁进辅助数组，最后拷回去。这需要 <strong>O(n) 的辅助数组</strong>。</p>

      <h2>复杂度</h2>
      <table>
        <tr><th></th><th>值</th></tr>
        <tr><td>时间（最好/最坏/平均）</td><td>都是 O(n log n)</td></tr>
        <tr><td>空间</td><td>O(n)</td></tr>
        <tr><td>稳定性</td><td><b>稳定</b></td></tr>
        <tr><td>递归深度</td><td>O(log n)</td></tr>
      </table>
      <p>归并排序是唯一"稳定 + 最坏 O(n log n)"的常用排序，代价是要额外空间、常数比快排大。</p>

      <h2>为什么它重要</h2>
      <ul>
        <li><strong>外部排序</strong>：大文件排序的基础。把文件分成若干块各自排序（内部排序），再做多路归并。磁盘 IO 次数是性能瓶颈。</li>
        <li><strong>求逆序对</strong>：在合并时统计"右边先出来"的次数，就是逆序对数，O(n log n)。这是经典应用。</li>
        <li>链表排序：归并排序天然适合链表（不需要随机访问），LeetCode 148 的标准解法。</li>
      </ul>

      <h2>外部排序的多路归并</h2>
      <p>数据分成 k 个有序段，每次从 k 个段里选最小——朴素做法要比较 k 次。用<strong>败者树</strong>或<strong>小根堆</strong>可以降到 log k 次。考研会考"m 路归并需要几趟"：<code>⌈log_m(r)⌉</code>（r 是初始段数）。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

void print(int *a, int n, const char *tag) {
    printf("%-20s", tag);
    for (int i = 0; i < n; i++) printf("%3d", a[i]);
    printf("\\n");
}

/* 合并 a[low..mid] 和 a[mid+1..high] 到 tmp，再拷回 */
void merge(int *a, int *tmp, int low, int mid, int high, long *moves) {
    int i = low, j = mid + 1, k = low;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];    // <= 保证稳定
        else              tmp[k++] = a[j++];
        (*moves)++;
    }
    while (i <= mid)  { tmp[k++] = a[i++]; (*moves)++; }
    while (j <= high) { tmp[k++] = a[j++]; (*moves)++; }
    for (int t = low; t <= high; t++) a[t] = tmp[t];
}

void mergeSortRec(int *a, int *tmp, int low, int high, long *moves, int level, int verbose) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;

    mergeSortRec(a, tmp, low, mid, moves, level + 1, verbose);
    mergeSortRec(a, tmp, mid + 1, high, moves, level + 1, verbose);

    if (verbose) {
        printf("  合并 [%d..%d] 和 [%d..%d]：", low, mid, mid + 1, high);
        printf("左边 ");
        for (int i = low; i <= mid; i++) printf("%d ", a[i]);
        printf("| 右边 ");
        for (int i = mid + 1; i <= high; i++) printf("%d ", a[i]);
        printf("\\n");
    }
    merge(a, tmp, low, mid, high, moves);
}

void mergeSort(int *a, int n, int verbose) {
    int *tmp = (int *)malloc(sizeof(int) * n);
    long moves = 0;
    mergeSortRec(a, tmp, 0, n - 1, &moves, 1, verbose);
    free(tmp);
    printf("  总移动次数（含临时数组）%ld\\n", moves);
}

/* 归并求逆序对 */
long mergeCount(int *a, int *tmp, int low, int high) {
    if (low >= high) return 0;
    int mid = low + (high - low) / 2;
    long cnt = mergeCount(a, tmp, low, mid) + mergeCount(a, tmp, mid + 1, high);

    int i = low, j = mid + 1, k = low;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
        } else {
            tmp[k++] = a[j++];
            cnt += (mid - i + 1);      // 左边剩下的都比它大
        }
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= high) tmp[k++] = a[j++];
    for (int t = low; t <= high; t++) a[t] = tmp[t];
    return cnt;
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27};
    int n = 7;

    print(a, n, "原始：");
    printf("\\n== 归并过程 ==\\n");
    mergeSort(a, n, 1);
    printf("\\n");
    print(a, n, "结果：");

    printf("\\n== 求逆序对 ==\\n");
    int b[] = {5, 4, 3, 2, 1};
    int tmp[8];
    long inv = mergeCount(b, tmp, 0, 4);
    printf("  [5,4,3,2,1] 的逆序对 = %ld（应该是 10）\\n", inv);

    int c[] = {2, 4, 1, 3, 5};
    long inv2 = mergeCount(c, tmp, 0, 4);
    printf("  [2,4,1,3,5] 的逆序对 = %ld（(2,1)(4,1)(4,3) = 3）\\n", inv2);

    printf("\\n== 外部排序 ==\\n");
    printf("  100 万条记录，内存只能放 10 万条：\\n");
    printf("  1. 分成 10 段，每段在内存排序后写回磁盘\\n");
    printf("  2. 做 10 路归并（用败者树/小根堆加速）\\n");
    printf("  3. 归并趟数 = ceil(log_10(10)) = 1 趟\\n");

    printf("\\n归并排序稳定、最坏 O(n log n)，代价是要 O(n) 额外空间。\\n");
    return 0;
}`,
    tips: [
      '合并时 `a[i] <= a[j]` 用 `<=` 才稳定；用 `<` 会把右边的相等元素提前，破坏稳定性。',
      '归并排序的辅助数组只开一次（放在最外层），别在递归里反复 malloc，那会慢十倍。'
    ],
    traps: [
      '递归里 mid 用 `(low+high)/2` 在超大数组会溢出，用 `low + (high-low)/2`。',
      '合并后忘了把 tmp 拷回 a，结果数组根本没变——这个 bug 很常见，因为 tmp 是看不见的。'
    ],
    exercises: ['ex-merge-sort']
  },

  {
    id: 'd-sort-radix',
    ch: 'c8',
    title: '基数排序：不比较的排序',
    tag: '了解',
    brief: '按个位、十位、百位依次分配收集，O(d(n+r))，稳定。',
    tags: ['基数排序', '分配收集', ' LSD', 'MSD', '稳定', '非比较排序'],
    body: `
      <h2>思想</h2>
      <p>不比较关键字大小，而是<strong>按每一位数字"分配"到 10 个桶里，再按顺序"收集"回来</strong>。从最低位到最高位重复 d 轮（d 是最大位数）。</p>
      <p>这叫 LSD（Least Significant Digit first，最低位优先）。</p>

      <h3>例子</h3>
      <p><code>278, 109, 63, 930, 589, 184, 505, 269, 8, 83</code></p>
      <ol>
        <li>按个位分桶收集 → <code>930, 63, 83, 184, 505, 278, 8, 589, 269, 109</code></li>
        <li>按十位分桶收集 → <code>505, 8, 109, 930, 63, 269, 278, 83, 184, 589</code></li>
        <li>按百位分桶收集 → 有序</li>
      </ol>
      <p>关键：<strong>每一轮收集必须按桶的顺序（0→9）且桶内保持入桶顺序</strong>，这是"稳定"的要求。正因为每轮稳定，前面排好的低位顺序才不会被破坏。</p>

      <h2>复杂度</h2>
      <ul>
        <li>时间：<code>O(d(n+r))</code>，d 是位数，r 是基数（十进制是 10）。</li>
        <li>空间：O(n + r)，需要桶。链式基数排序只需要 r 个头尾指针 + n 个结点。</li>
        <li><strong>稳定</strong>。</li>
      </ul>

      <h2>适用与不适用</h2>
      <table>
        <tr><th>适合</th><th>不适合</th></tr>
        <tr><td>整数、定长字符串、日期</td><td>浮点数（要特殊处理）</td></tr>
        <tr><td>位数少、数据量大</td><td>位数很多（d 大时退化）</td></tr>
        <tr><td>需要稳定排序</td><td>内存紧张（要额外空间）</td></tr>
      </table>
      <p>工程上它常用于<strong>多关键字排序</strong>：先按次要关键字排，再按主要关键字排（稳定排序保证次要关键字仍然有序）。</p>
      <div class="note">基数排序是"非比较排序"的代表，另外两个是计数排序和桶排序。它们都能突破 O(n log n) 的下界，因为它们利用了关键字的额外信息（这里是"可以按位拆分"）。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

void print(int *a, int n, const char *tag) {
    printf("%-14s", tag);
    for (int i = 0; i < n; i++) printf("%4d", a[i]);
    printf("\\n");
}

int getMax(int *a, int n) {
    int m = a[0];
    for (int i = 1; i < n; i++) if (a[i] > m) m = a[i];
    return m;
}

/* 按第 exp 位（1, 10, 100...）做一次分配+收集 */
void countingSortByDigit(int *a, int n, int exp, int verbose) {
    int output[64];
    int count[10] = {0};

    // 1. 统计每个桶有多少个
    for (int i = 0; i < n; i++)
        count[(a[i] / exp) % 10]++;

    // 2. 前缀和 -> 每个桶在 output 里的结束位置
    for (int i = 1; i < 10; i++)
        count[i] += count[i - 1];

    // 3. 从后往前放，保证稳定
    for (int i = n - 1; i >= 0; i--) {
        int d = (a[i] / exp) % 10;
        output[--count[d]] = a[i];
    }

    for (int i = 0; i < n; i++) a[i] = output[i];

    if (verbose) {
        char buf[48];
        snprintf(buf, sizeof(buf), "按 %d 位后：", exp);
        print(a, n, buf);
    }
}

void radixSort(int *a, int n, int verbose) {
    int max = getMax(a, n);
    for (int exp = 1; max / exp > 0; exp *= 10)
        countingSortByDigit(a, n, exp, verbose);
}

int main(void) {
    int a[] = {278, 109, 63, 930, 589, 184, 505, 269, 8, 83};
    int n = 10;

    print(a, n, "原始：");
    printf("\\n== 基数排序过程（LSD，从个位开始）==\\n");
    radixSort(a, n, 1);
    printf("\\n");
    print(a, n, "结果：");

    printf("\\n== 为什么必须「从后往前」放 ==\\n");
    printf("假设当前桶已有元素，如果从前往后放，后入的元素会插到前面，\\n");
    printf("同一轮里先入桶的元素顺序就被打乱了 -> 破坏稳定性 -> \\n");
    printf("上一轮排好的低位顺序也白排了。\\n");

    printf("\\n== 位的轮数 ==\\n");
    printf("最大数是 930，3 位数 -> 需要 3 轮（个、十、百）\\n");
    printf("每轮 O(n+10)，总 O(d(n+10)) = 3 × 20 = 60 次操作\\n");

    printf("\\n== 反过来（MSD，从高位开始）==\\n");
    printf("MSD 是先按最高位分桶，然后每个桶内部递归排序。\\n");
    printf("适合字符串排序（字典序），但实现更复杂，且不是稳定排序。\\n");

    printf("\\n基数排序稳定、线性时间，但只能用于整形这种「能按位拆」的关键字。\\n");
    return 0;
}`,
    tips: [
      '计数排序的前缀和 + 从后往前放，是"稳定"的关键，这段代码值得背。',
      '求位数可以用 `while (max) { digits++; max /= 10; }`，比 log10 更稳（避免浮点误差）。'
    ],
    traps: [
      '从前往后放会破坏稳定性，导致高位排序时低位信息丢失，结果直接错。',
      '负数不能直接基数排序（取模会得负数），要先分离符号或整体加偏移。'
    ]
  },

  {
    id: 'd-sort-compare',
    ch: 'c8',
    title: '八大排序总对比与选择指南',
    tag: '必学·总结',
    brief: '一张表 + 三个场景，把这一章收口。',
    tags: ['排序对比', '排序选择', '总结', '复杂度', '稳定性'],
    body: `
      <h2>总表（背它）</h2>
      <table>
        <tr><th>算法</th><th>平均</th><th>最好</th><th>最坏</th><th>空间</th><th>稳定</th><th>特点</th></tr>
        <tr><td>直接插入</td><td>O(n²)</td><td>O(n)</td><td>O(n²)</td><td>O(1)</td><td>✔</td><td>近乎有序时最快</td></tr>
        <tr><td>折半插入</td><td>O(n²)</td><td>O(n)</td><td>O(n²)</td><td>O(1)</td><td>✔</td><td>比较次数减少，移动不变</td></tr>
        <tr><td>希尔</td><td>O(n^1.3)</td><td>—</td><td>O(n²)</td><td>O(1)</td><td>✘</td><td>插入的加强版</td></tr>
        <tr><td>冒泡</td><td>O(n²)</td><td>O(n)</td><td>O(n²)</td><td>O(1)</td><td>✔</td><td>教学用，实际少用</td></tr>
        <tr><td>快速</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n²)</td><td>O(log n)</td><td>✘</td><td>平均最快</td></tr>
        <tr><td>简单选择</td><td>O(n²)</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>✘</td><td>交换次数最少</td></tr>
        <tr><td>堆排序</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(1)</td><td>✘</td><td>最坏也有保障、原地</td></tr>
        <tr><td>归并</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n log n)</td><td>O(n)</td><td>✔</td><td>稳定 + 最坏可控</td></tr>
        <tr><td>基数</td><td>O(d(n+r))</td><td>O(d(n+r))</td><td>O(d(n+r))</td><td>O(n+r)</td><td>✔</td><td>不比较，线性</td></tr>
      </table>

      <h2>怎么选（工程视角）</h2>
      <ul>
        <li><strong>n 很小（&lt; 20）</strong>：直接插入排序。常数小，别搞花活。</li>
        <li><strong>基本有序</strong>：插入排序或冒泡（带提前退出）。</li>
        <li><strong>一般情况</strong>：快速排序 / std::sort（introsort）。</li>
        <li><strong>要求稳定</strong>：归并排序（或用 stable_sort）。</li>
        <li><strong>内存吃紧、要求最坏有保障</strong>：堆排序。</li>
        <li><strong>整数且位数少</strong>：基数排序。</li>
        <li><strong>数据太大装不进内存</strong>：外部排序（多路归并）。</li>
      </ul>

      <h2>几个高频考点</h2>
      <ul>
        <li>一趟排序结束后，能确定一个元素最终位置的：<strong>冒泡、快速、选择、堆</strong>。</li>
        <li>比较次数与初始序列无关的：<strong>简单选择、归并（部分）、折半插入</strong>。</li>
        <li>时间复杂度不受初始序列影响的：<strong>简单选择、堆、归并、基数</strong>。</li>
        <li>空间复杂度 O(1) 的：插入、冒泡、选择、希尔、堆。</li>
      </ul>
      <div class="note">下面代码跑一个"实测对比"，把同一组数据丢给各个算法，统计比较次数和移动次数。看数字比看表格印象深。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
    const char *name;
    long cmp;
    long moves;
    int stable;
} Stat;

static long CMP, MOV;

void reset(void) { CMP = 0; MOV = 0; }

void cpy(int *dst, const int *src, int n) { memcpy(dst, src, sizeof(int) * n); }

void insertion(int *a, int n) {
    for (int i = 1; i < n; i++) {
        int t = a[i], j = i - 1;
        while (j >= 0 && (CMP++, a[j] > t)) { a[j + 1] = a[j]; MOV++; j--; }
        a[j + 1] = t;
        MOV++;
    }
}

void bubble(int *a, int n) {
    for (int i = 0; i < n - 1; i++) {
        int sw = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            CMP++;
            if (a[j] > a[j + 1]) {
                int t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
                MOV += 3; sw = 1;
            }
        }
        if (!sw) break;
    }
}

int part(int *a, int lo, int hi) {
    int p = a[lo];
    while (lo < hi) {
        while (lo < hi && (CMP++, a[hi] >= p)) hi--;
        a[lo] = a[hi]; MOV++;
        while (lo < hi && (CMP++, a[lo] <= p)) lo++;
        a[hi] = a[lo]; MOV++;
    }
    a[lo] = p; MOV++;
    return lo;
}
void quick(int *a, int lo, int hi) {
    if (lo >= hi) return;
    int p = part(a, lo, hi);
    quick(a, lo, p - 1);
    quick(a, p + 1, hi);
}

void selection(int *a, int n) {
    for (int i = 0; i < n - 1; i++) {
        int m = i;
        for (int j = i + 1; j < n; j++) { CMP++; if (a[j] < a[m]) m = j; }
        if (m != i) { int t = a[i]; a[i] = a[m]; a[m] = t; MOV += 3; }
    }
}

void sift(int *a, int i, int len) {
    int t = a[i], j = 2 * i + 1;
    while (j < len) {
        if (j + 1 < len && (CMP++, a[j + 1] > a[j])) j++;
        if ((CMP++, t >= a[j])) break;
        a[i] = a[j]; MOV++;
        i = j; j = 2 * i + 1;
    }
    a[i] = t; MOV++;
}
void heap_sort(int *a, int n) {
    for (int i = n / 2 - 1; i >= 0; i--) sift(a, i, n);
    for (int i = n - 1; i > 0; i--) {
        int t = a[0]; a[0] = a[i]; a[i] = t; MOV += 3;
        sift(a, 0, i);
    }
}

int buf[4096];
void msort(int *a, int lo, int hi) {
    if (lo >= hi) return;
    int mid = (lo + hi) / 2;
    msort(a, lo, mid); msort(a, mid + 1, hi);
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) { CMP++; buf[k++] = (a[i] <= a[j]) ? a[i++] : a[j++]; MOV++; }
    while (i <= mid)  { buf[k++] = a[i++]; MOV++; }
    while (j <= hi)   { buf[k++] = a[j++]; MOV++; }
    for (int t = lo; t <= hi; t++) { a[t] = buf[t]; MOV++; }
}

void shellSortWrap(int *a, int n) {
    for (int gap = n / 2; gap > 0; gap /= 2)
        for (int i = gap; i < n; i++) {
            int t = a[i], j = i - gap;
            while (j >= 0 && (CMP++, a[j] > t)) { a[j + gap] = a[j]; MOV++; j -= gap; }
            a[j + gap] = t; MOV++;
        }
}
void quickWrap(int *a, int n) { quick(a, 0, n - 1); }
void mergeWrap(int *a, int n) { msort(a, 0, n - 1); }

void run(const char *name, void (*fn)(int *, int), int *src, int n, int stable) {
    int work[64];
    cpy(work, src, n);
    reset();
    fn(work, n);
    printf("%-10s 比较 %6ld   移动 %6ld   %s\\n", name, CMP, MOV, stable ? "稳定" : "不稳定");
}

int main(void) {
    int src[] = {49, 38, 65, 97, 76, 13, 27, 49, 55, 4, 92, 31, 68, 12, 87, 43};
    int n = 16;

    printf("数据：");
    for (int i = 0; i < n; i++) printf("%d ", src[i]);
    printf("\\n\\n");

    run("插入", insertion, src, n, 1);
    run("冒泡", bubble, src, n, 1);
    run("选择", selection, src, n, 0);
    run("希尔", shellSortWrap, src, n, 0);
    run("快速", quickWrap, src, n, 0);
    run("堆", heap_sort, src, n, 0);
    run("归并", mergeWrap, src, n, 1);

    printf("\\n结论：\\n");
    printf("  1. 简单选择排序比较次数固定 n(n-1)/2，与数据无关\\n");
    printf("  2. 快速排序在随机数据上比较次数接近 n log n\\n");
    printf("  3. 归并的移动次数最多（要拷来拷去），但最坏有保障\\n");
    printf("  4. 冒泡的移动次数是交换次数的 3 倍（每次交换 3 次赋值）\\n");
    return 0;
}`,
    tips: [
      '记忆法：稳定的四个是「插入、冒泡、归并、基数」，其余都不稳定。',
      '考试问"最坏 O(n log n) 且原地"→ 堆排序；"稳定且 O(n log n)"→ 归并。'
    ],
    traps: [
      '快排的"平均 O(n log n)"不代表任何情况都 O(n log n)，有序数据会退化。',
      '归并排序的空间复杂度是 O(n)，不是 O(1)，别和"递归栈 O(log n)"搞混。'
    ]
  }

  );
})();
