/* ============================================================
   第 2 章：线性表 —— 顺序表、单链表、双链表、循环链表、静态链表
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  {
    id: 'd-adt',
    ch: 'c2',
    title: '数据结构三要素：逻辑、存储、运算',
    tag: '必学',
    brief: '逻辑结构讲"什么关系"，存储结构讲"怎么放"，运算讲"能干什么"。',
    tags: ['数据结构', '逻辑结构', '存储结构', '抽象数据类型', 'ADT', '线性表'],
    body: `
      <h2>一道题判断你懂没懂</h2>
      <p>"线性表"是逻辑结构，"顺序表"和"链表"是存储结构。同一种逻辑结构可以有多种存储实现——这就是为什么教材里先讲线性表（逻辑），再分别讲顺序表和链表（存储）。</p>

      <h2>逻辑结构：元素之间什么关系</h2>
      <table>
        <tr><th>结构</th><th>关系</th><th>例子</th></tr>
        <tr><td>集合</td><td>只有"同属一个集合"</td><td>一堆无序的标签</td></tr>
        <tr><td>线性结构</td><td>一对一，有前驱后继</td><td>数组、链表、栈、队列、串</td></tr>
        <tr><td>树形结构</td><td>一对多</td><td>目录树、家族树</td></tr>
        <tr><td>图状结构</td><td>多对多</td><td>地铁线路、社交网络</td></tr>
      </table>

      <h2>存储结构：内存里怎么摆</h2>
      <ul>
        <li><strong>顺序存储</strong>：逻辑相邻 → 物理相邻。用数组，支持随机访问，插入删除要搬家。</li>
        <li><strong>链式存储</strong>：靠指针串起来，物理上随便放。插入删除快，查找慢。</li>
        <li><strong>索引存储</strong>：额外建一张索引表（如书的目录）。</li>
        <li><strong>散列存储</strong>：按关键字算出地址（哈希表）。</li>
      </ul>

      <h2>抽象数据类型 ADT</h2>
      <p>ADT = 数据对象 + 数据关系 + 一组操作。它只关心"能做什么"，不关心"怎么实现"。教材里的写法：</p>
      <pre><code>ADT List {
    数据对象：D = {a1, a2, ..., an}
    数据关系：除首尾外，每个元素有唯一前驱和后继
    基本操作：
        InitList(&amp;L)      初始化
        ListInsert(&amp;L, i, e)  在第 i 个位置插入 e
        ListDelete(&amp;L, i, &amp;e) 删除第 i 个元素
        GetElem(L, i, &amp;e)     取第 i 个元素
        LocateElem(L, e)      查找 e 的位置
        ListLength(L)         返回长度
}</code></pre>
      <p>写代码时把这些操作做成函数，就得到了一个可复用的模块。<strong>后面每章我都会按这个套路写：结构体 + 一组操作函数。</strong></p>

      <h2>最重要的一句话</h2>
      <div class="note">数据结构 = 关系 + 存储 + 操作。<strong>光会画图不算会，能手写出 Init / Insert / Delete / Traverse 四个函数才算。</strong></div>
    `,
    code: `#include <stdio.h>

/* 用最简单的例子说明：同一个逻辑结构，两种存储实现 */

// —— 实现 1：顺序存储（数组） ——
#define MAXSIZE 10
typedef struct {
    int data[MAXSIZE];
    int length;
} SqList;

void seq_print(const SqList *L, const char *tag) {
    printf("%s", tag);
    for (int i = 0; i < L->length; i++) printf("%d ", L->data[i]);
    printf("\\n");
}

// —— 实现 2：链式存储（结点 + 指针） ——
typedef struct Node {
    int data;
    struct Node *next;
} Node;

int main(void) {
    // 顺序存储：内存连续
    SqList L;
    L.length = 0;
    for (int i = 1; i <= 5; i++) {
        L.data[L.length++] = i * 10;
    }
    seq_print(&L, "顺序存储：");
    printf("  连续内存，第 3 个元素地址 = 首地址 + 2*4 字节\\n");

    // 链式存储：靠指针连
    Node n5 = {50, NULL};
    Node n4 = {40, &n5};
    Node n3 = {30, &n4};
    Node n2 = {20, &n3};
    Node n1 = {10, &n2};

    printf("\\n链式存储：");
    for (Node *p = &n1; p != NULL; p = p->next)
        printf("%d ", p->data);
    printf("\\n  内存里各自独立，靠 next 指针找到下一个\\n");

    printf("\\n两种实现，逻辑上都是「10 20 30 40 50」的线性表。\\n");
    printf("SQL 里叫表，教材里叫线性表，本质就是「有顺序的一串元素」。\\n");
    return 0;
}`,
    tips: [
      '背概念时用「逻辑结构 / 存储结构」这对词去套，考试问"链表是逻辑结构吗"答案是"不是"。',
      'ADT 的 `&L` 是 C++ 引用写法，C 语言里等价于传 `SqList *L` 再写 `L->`。'
    ],
    traps: [
      '顺序表 ≠ 线性表。顺序表是线性表的一种实现，别在简答题里混着写。'
    ]
  },

  {
    id: 'd-seqlist',
    ch: 'c2',
    title: '顺序表：插入删除为什么要搬家',
    tag: '必学·重点',
    brief: '插入平均移动 n/2 个元素，删除平均 (n-1)/2 个，查找 O(1)。',
    tags: ['顺序表', 'SqList', '插入', '删除', '时间复杂度', '随机访问'],
    body: `
      <h2>结构定义</h2>
      <pre><code>#define MAXSIZE 100
typedef struct {
    int data[MAXSIZE];   // 静态分配
    int length;          // 当前元素个数
} SqList;</code></pre>
      <p>关键是<strong>数组 + 长度</strong>必须绑在一起。只给一个数组，函数里就不知道有几个元素（因为传参会退化）。</p>

      <h2>按位插入（第 i 个位置，i 从 1 开始）</h2>
      <ol>
        <li>检查 <code>i</code> 是否合法：<code>1 &lt;= i &lt;= length+1</code>。</li>
        <li>检查是否已满。</li>
        <li><strong>从后往前</strong>把 <code>data[i-1..length-1]</code> 各后移一位。</li>
        <li>放入新元素，<code>length++</code>。</li>
      </ol>
      <div class="warn">为什么必须从后往前挪？从前往后挪会把后面的元素覆盖掉。这个顺序是插入算法的核心，写反了数组就废了。</div>

      <h2>按位删除</h2>
      <p>取出元素后，<strong>从前往后</strong>把后面的元素各前移一位，<code>length--</code>。</p>

      <h2>复杂度账本</h2>
      <table>
        <tr><th>操作</th><th>最好</th><th>最坏</th><th>平均</th></tr>
        <tr><td>按位查找 GetElem</td><td>O(1)</td><td>O(1)</td><td>O(1)</td></tr>
        <tr><td>按值查找</td><td>O(1)</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>插入</td><td>O(1)（表尾）</td><td>O(n)（表头）</td><td>O(n)，平均移 n/2 个</td></tr>
        <tr><td>删除</td><td>O(1)</td><td>O(n)</td><td>O(n)，平均移 (n-1)/2 个</td></tr>
      </table>
      <p>考试常问："长度为 n 的顺序表，插入一个元素的平均移动次数" → <code>n/2</code>；"删除的平均移动次数" → <code>(n-1)/2</code>。</p>

      <h2>优缺点</h2>
      <ul>
        <li>优点：能随机访问（<code>a[i]</code> 一步到位），存储密度高（不用存指针）。</li>
        <li>缺点：插入删除要搬家，长度固定（静态分配）或扩容要整体复制（动态分配）。</li>
      </ul>
    `,
    code: `#include <stdio.h>

#define MAXSIZE 20
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int length;
} SqList;

void InitList(SqList *L) {
    L->length = 0;
}

void PrintList(const SqList *L, const char *tag) {
    printf("%s(长度 %d)：", tag, L->length);
    for (int i = 0; i < L->length; i++) printf("%d ", L->data[i]);
    printf("\\n");
}

// 在第 i 个位置插入 e（i 从 1 开始）
int ListInsert(SqList *L, int i, int e) {
    if (i < 1 || i > L->length + 1) return ERROR;   // 位置非法
    if (L->length >= MAXSIZE) return ERROR;         // 表满

    for (int j = L->length; j >= i; j--)            // 从后往前挪
        L->data[j] = L->data[j - 1];
    L->data[i - 1] = e;
    L->length++;
    return OK;
}

// 删除第 i 个元素，用 e 带回
int ListDelete(SqList *L, int i, int *e) {
    if (i < 1 || i > L->length) return ERROR;
    *e = L->data[i - 1];
    for (int j = i; j < L->length; j++)             // 从前往后挪
        L->data[j - 1] = L->data[j];
    L->length--;
    return OK;
}

// 按值查找，返回位序（1 开始），找不到返回 0
int LocateElem(const SqList *L, int e) {
    for (int i = 0; i < L->length; i++)
        if (L->data[i] == e) return i + 1;
    return 0;
}

int main(void) {
    SqList L;
    InitList(&L);

    for (int i = 1; i <= 5; i++) ListInsert(&L, i, i * 10);
    PrintList(&L, "建表后");

    ListInsert(&L, 3, 99);
    PrintList(&L, "在第 3 位插入 99");

    ListInsert(&L, 1, 5);
    PrintList(&L, "在第 1 位插入 5");

    int e;
    if (ListDelete(&L, 2, &e)) printf("\\n删除第 2 个元素：%d\\n", e);
    PrintList(&L, "删除后");

    printf("\\n查找 99 的位置：%d\\n", LocateElem(&L, 99));
    printf("查找 123 的位置：%d（0 表示没找到）\\n", LocateElem(&L, 123));

    printf("\\n非法操作测试：\\n");
    printf("  在第 0 位插入 -> %d\\n", ListInsert(&L, 0, 1));
    printf("  在第 %d 位插入 -> %d\\n", L.length + 2, ListInsert(&L, L.length + 2, 1));
    return 0;
}`,
    tips: [
      '位序和下标差 1，这是所有顺序表代码 bug 的最大来源。写代码时先想清"i 是位序还是下标"。',
      '插入之前一定要判满，删除之前一定要判空，否则会写出难查的越界。'
    ],
    traps: [
      '插入循环条件写成 `j > i` 会少挪一个元素，导致数据被覆盖。',
      '删除后忘记 `length--`，表尾会残留旧值。'
    ],
    exercises: ['ex-seqlist']
  },

  {
    id: 'd-seqlist-app',
    ch: 'c2',
    title: '顺序表应用题：合并、去重、逆置、划分',
    tag: '练习',
    brief: '考研最爱考的四个顺序表算法，全是双指针套路。',
    tags: ['顺序表应用', '合并', '去重', '逆置', '双指针', 'Partition'],
    body: `
      <h2>套路一：双指针原地操作</h2>
      <p>顺序表题目的核心是<strong>用两个下标各干各的</strong>：一个负责"读"，一个负责"写"。这样不用额外空间，复杂度 O(n)。</p>

      <h3>1. 删除所有值为 x 的元素（O(n)，O(1)）</h3>
      <pre><code>int k = 0;                     // k 是"写"指针
for (int i = 0; i &lt; L-&gt;length; i++)
    if (L-&gt;data[i] != x)
        L-&gt;data[k++] = L-&gt;data[i];
L-&gt;length = k;</code></pre>
      <p>这比"找到一个就整体前移"的 O(n²) 写法高一个档次，考试写这个能加分。</p>

      <h3>2. 逆置（原地，O(n)）</h3>
      <p>首尾双指针往中间靠，交换。<code>for (i=0, j=n-1; i&lt;j; i++, j--)</code>。</p>

      <h3>3. 两个有序表合并（归并思想）</h3>
      <p>两个指针分别扫两个表，谁小放谁，剩下的整体接上。这是归并排序的雏形。</p>

      <h3>4. 按基准值划分（快排的 partition）</h3>
      <p>把所有小于基准的放左边。用两个指针从两头夹：左边找大于基准的，右边找小于基准的，交换。这就是快速排序的核心。</p>

      <h2>考研原题长什么样</h2>
      <ul>
        <li>从有序顺序表中删除所有重复元素（保留第一个）—— 双指针 + 与前一个比较。</li>
        <li>两个有序表合并成一个新的有序表 —— 归并。</li>
        <li>找出两个等长有序表的中位数 —— 二分思想，O(log n)。</li>
        <li>循环左移 k 位 —— 三次逆置，很巧。</li>
      </ul>
      <div class="note">下面代码把前三个都实现了。自己先想 5 分钟再看实现，效果差三倍。</div>
    `,
    code: `#include <stdio.h>

#define MAXSIZE 30
typedef struct {
    int data[MAXSIZE];
    int length;
} SqList;

void print(const SqList *L, const char *tag) {
    printf("%-22s", tag);
    for (int i = 0; i < L->length; i++) printf("%d ", L->data[i]);
    printf("\\n");
}

void build(SqList *L, const int *arr, int n) {
    for (int i = 0; i < n; i++) L->data[i] = arr[i];
    L->length = n;
}

// 1. 删除所有值为 x 的元素，O(n)
void delete_all_x(SqList *L, int x) {
    int k = 0;
    for (int i = 0; i < L->length; i++)
        if (L->data[i] != x)
            L->data[k++] = L->data[i];
    L->length = k;
}

// 2. 原地逆置
void reverse(SqList *L) {
    for (int i = 0, j = L->length - 1; i < j; i++, j--) {
        int t = L->data[i];
        L->data[i] = L->data[j];
        L->data[j] = t;
    }
}

// 3. 两个有序表合并
void merge_sorted(const SqList *A, const SqList *B, SqList *C) {
    int i = 0, j = 0, k = 0;
    while (i < A->length && j < B->length) {
        if (A->data[i] <= B->data[j]) C->data[k++] = A->data[i++];
        else                          C->data[k++] = B->data[j++];
    }
    while (i < A->length) C->data[k++] = A->data[i++];
    while (j < B->length) C->data[k++] = B->data[j++];
    C->length = k;
}

// 4. 有序表去重（保留一个）
void unique_sorted(SqList *L) {
    if (L->length == 0) return;
    int k = 1;
    for (int i = 1; i < L->length; i++)
        if (L->data[i] != L->data[k - 1])
            L->data[k++] = L->data[i];
    L->length = k;
}

// 5. 按 pivot 划分：小于 pivot 的放左边
void partition(SqList *L, int pivot) {
    int i = 0, j = L->length - 1;
    while (i < j) {
        while (i < j && L->data[j] >= pivot) j--;
        while (i < j && L->data[i] < pivot) i++;
        if (i < j) {
            int t = L->data[i];
            L->data[i] = L->data[j];
            L->data[j] = t;
        }
    }
}

int main(void) {
    int a1[] = {3, 1, 4, 1, 5, 1, 9};
    int a2[] = {1, 1, 2, 3, 3, 3, 5};
    int s1[] = {1, 3, 5, 7};
    int s2[] = {2, 4, 6, 8, 10};

    SqList L;
    build(&L, a1, 7);
    print(&L, "原始：");
    delete_all_x(&L, 1);
    print(&L, "删掉所有 1：");

    build(&L, a1, 7);
    reverse(&L);
    print(&L, "原地逆置：");

    SqList A, B, Cm;
    build(&A, s1, 4);
    build(&B, s2, 5);
    merge_sorted(&A, &B, &Cm);
    print(&A, "有序表 A：");
    print(&B, "有序表 B：");
    print(&Cm, "合并后：");

    build(&L, a2, 7);
    unique_sorted(&L);
    print(&L, "有序表去重：");

    int a3[] = {7, 2, 9, 4, 1, 8, 3};
    build(&L, a3, 7);
    partition(&L, 5);
    print(&L, "按 5 划分：");
    printf("\\n全部操作都是 O(n) 或 O(n log n)，没有额外数组。\\n");
    return 0;
}`,
    tips: [
      '「读指针 i、写指针 k」这个模式能解决一大半顺序表题，先记住它。',
      '写完后手动跑一遍空表、单元素、全相同这三种边界，能抓出 80% 的错。'
    ],
    traps: [
      '去重时与 `data[k-1]` 比较，不是与 `data[i-1]`——写指针和读指针不是一回事。',
      '合并时忘了把剩余部分接上，结果长度对但元素少。'
    ],
    exercises: ['ex-array-reverse']
  },

  {
    id: 'd-linklist',
    ch: 'c2',
    title: '单链表：头插法与尾插法建表',
    tag: '必学·重点',
    brief: '头插法得到逆序，尾插法得到顺序。带头结点能省掉一堆特判。',
    tags: ['单链表', 'LinkList', '头插法', '尾插法', '头结点', '遍历'],
    body: `
      <h2>结点长什么样</h2>
      <pre><code>typedef struct LNode {
    int data;
    struct LNode *next;
} LNode, *LinkList;</code></pre>
      <p><code>LNode</code> 是结点类型，<code>LinkList</code> 是指向结点的指针（习惯上用它表示"一个链表"）。</p>

      <h2>带头结点 vs 不带头结点</h2>
      <p><strong>强烈建议用带头结点。</strong>头结点不存数据，只是让"插入/删除第一个位置"和"插入/删除其他位置"用同一套代码，不用额外判断 <code>if (p == head)</code>。</p>
      <pre><code>LinkList L = (LNode *)malloc(sizeof(LNode));   // 头结点
L->next = NULL;
// 空表判断变成 L->next == NULL，而不是 L == NULL</code></pre>
      <div class="warn">教材、考试、LeetCode 三种环境的习惯不一样。考研 408 默认带头结点，LeetCode 默认不带头结点。看题先看清。</div>

      <h2>两种建表法</h2>
      <table>
        <tr><th>方法</th><th>做法</th><th>结果</th><th>复杂度</th></tr>
        <tr><td>头插法</td><td>每次插在头结点之后</td><td>输入顺序<b>相反</b></td><td>O(n)</td></tr>
        <tr><td>尾插法</td><td>维护尾指针，插在表尾</td><td>与输入顺序<b>一致</b></td><td>O(n)</td></tr>
      </table>
      <p>头插法常用来做链表逆置——把原链表从头到尾头插到新链表，天然逆序。</p>

      <h2>遍历的标准写法</h2>
      <pre><code>for (LNode *p = L->next; p != NULL; p = p-&gt;next)
    printf("%d ", p-&gt;data);</code></pre>
      <p>记住从 <code>L-&gt;next</code> 开始（跳过头结点），到 <code>NULL</code> 结束。写 <code>p-&gt;next != NULL</code> 会漏掉最后一个。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode, *LinkList;

// 初始化：创建头结点
LinkList InitList(void) {
    LNode *head = (LNode *)malloc(sizeof(LNode));
    if (head == NULL) return NULL;
    head->next = NULL;
    return head;
}

// 头插法：结果与输入逆序
void CreateHead(LinkList L, const int *arr, int n) {
    L->next = NULL;
    for (int i = 0; i < n; i++) {
        LNode *node = (LNode *)malloc(sizeof(LNode));
        node->data = arr[i];
        node->next = L->next;      // 新结点指向原来的第一个
        L->next = node;            // 头结点指向新结点
    }
}

// 尾插法：结果与输入顺序一致
void CreateTail(LinkList L, const int *arr, int n) {
    LNode *tail = L;               // tail 一直指向最后一个结点
    L->next = NULL;
    for (int i = 0; i < n; i++) {
        LNode *node = (LNode *)malloc(sizeof(LNode));
        node->data = arr[i];
        node->next = NULL;
        tail->next = node;
        tail = node;
    }
}

int Length(LinkList L) {
    int n = 0;
    for (LNode *p = L->next; p != NULL; p = p->next) n++;
    return n;
}

LNode *Locate(LinkList L, int e) {
    for (LNode *p = L->next; p != NULL; p = p->next)
        if (p->data == e) return p;
    return NULL;
}

void Print(LinkList L, const char *tag) {
    printf("%s", tag);
    if (L->next == NULL) {
        printf("(空表)");
    } else {
        for (LNode *p = L->next; p != NULL; p = p->next) {
            printf("%d", p->data);
            if (p->next) printf(" -> ");
        }
    }
    printf("\\n");
}

void Destroy(LinkList L) {
    LNode *p = L;
    while (p != NULL) {
        LNode *next = p->next;
        free(p);
        p = next;
    }
}

int main(void) {
    int arr[] = {1, 2, 3, 4, 5};
    int n = 5;

    LinkList A = InitList();
    CreateHead(A, arr, n);
    Print(A, "头插法（逆序）：");

    LinkList B = InitList();
    CreateTail(B, arr, n);
    Print(B, "尾插法（顺序）：");

    printf("\\n链表长度：%d\\n", Length(B));

    LNode *p = Locate(B, 3);
    printf("查找 3：%s\\n", p ? "找到了" : "没有");
    printf("查找 9：%s\\n", Locate(B, 9) ? "找到了" : "没有");

    printf("\\n注意：头结点 data 是随机值，不参与遍历：%d\\n", B->data);

    Destroy(A);
    Destroy(B);
    printf("内存已释放\\n");
    return 0;
}`,
    tips: [
      '画图时把 NULL 写成 `∅` 或者一条斜线，能避免"忘了处理最后一个"这类错误。',
      '尾插法维护 `tail` 指针，否则每次都要从头找尾巴，退化成 O(n²)。'
    ],
    traps: [
      '头插法执行 `L->next = NULL` 之前，如果表里已有结点，会造成内存泄漏。',
      '遍历写成 `p->next != NULL` 会漏掉最后一个结点，输出少一个数。'
    ],
    exercises: ['ex-linklist-create']
  },

  {
    id: 'd-linklist-ops',
    ch: 'c2',
    title: '单链表的插入与删除（按位 / 按值）',
    tag: '必学·重点',
    brief: '插入要先找前驱，删除要保存被删结点再 free。',
    tags: ['单链表', '插入', '删除', '前驱', '按位序', '按值删除'],
    body: `
      <h2>核心思想：一切操作都要先找到"前驱"</h2>
      <p>单链表只能往后走，所以要改第 i 个位置，必须先停在<strong>第 i-1 个结点</strong>上。</p>

      <h2>按位序插入（第 i 个位置）</h2>
      <pre><code>// 找到第 i-1 个结点 p
LNode *p = L;  int j = 0;
while (p != NULL &amp;&amp; j &lt; i - 1) { p = p-&gt;next; j++; }
if (p == NULL) return ERROR;          // i 太大

LNode *s = malloc(sizeof(LNode));
s-&gt;data = e;
s-&gt;next = p-&gt;next;    // ① 新结点先接后面
p-&gt;next = s;         // ② 前驱再接新结点</code></pre>
      <div class="warn">①② 两句顺序不能反。反了以后 <code>p-&gt;next</code> 已经指向新结点，原来后面的链表就丢了——这是链表题第一大坑。</div>

      <h2>按位序删除</h2>
      <pre><code>// 找到第 i-1 个结点 p
LNode *q = p-&gt;next;    // 要删的结点
p-&gt;next = q-&gt;next;    // 从链上摘下来
free(q);              // 记得释放</code></pre>
      <p>顺序反过来（先 free 再改指针）就崩了，因为 <code>q-&gt;next</code> 已经读不到了。</p>

      <h2>按值删除的两种写法</h2>
      <ul>
        <li><strong>删第一个</strong>：找到前驱，摘链，free。</li>
        <li><strong>删所有</strong>：遍历时删完要继续往下走，注意别丢了后继。</li>
      </ul>

      <h2>头插法为什么不需要找前驱</h2>
      <p>因为头结点就是"第 0 个位置"的前驱。这也是带头结点的最大好处：<strong>位序 1 的插入删除不需要特判</strong>。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode, *LinkList;

LinkList InitList(void) {
    LNode *L = (LNode *)malloc(sizeof(LNode));
    L->next = NULL;
    return L;
}

void Print(LinkList L, const char *tag) {
    printf("%s", tag);
    for (LNode *p = L->next; p != NULL; p = p->next)
        printf("%s%d", p == L->next ? "" : " -> ", p->data);
    if (L->next == NULL) printf("(空)");
    printf("\\n");
}

// 按位序插入：在第 i 个位置放 e
int ListInsert(LinkList L, int i, int e) {
    if (i < 1) return 0;
    LNode *p = L;
    int j = 0;                               // p 指向第 j 个结点
    while (p != NULL && j < i - 1) {
        p = p->next;
        j++;
    }
    if (p == NULL) return 0;                 // i 超出范围
    LNode *s = (LNode *)malloc(sizeof(LNode));
    if (s == NULL) return 0;
    s->data = e;
    s->next = p->next;
    p->next = s;
    return 1;
}

// 按位序删除，被删值用 e 带回
int ListDelete(LinkList L, int i, int *e) {
    if (i < 1) return 0;
    LNode *p = L;
    int j = 0;
    while (p != NULL && j < i - 1) {
        p = p->next;
        j++;
    }
    if (p == NULL || p->next == NULL) return 0;   // 前驱不存在或没有第 i 个
    LNode *q = p->next;
    *e = q->data;
    p->next = q->next;
    free(q);
    return 1;
}

// 删除所有值为 e 的结点
int DeleteAllX(LinkList L, int e) {
    int cnt = 0;
    LNode *p = L;
    while (p->next != NULL) {
        if (p->next->data == e) {
            LNode *q = p->next;
            p->next = q->next;
            free(q);
            cnt++;
        } else {
            p = p->next;
        }
    }
    return cnt;
}

int main(void) {
    LinkList L = InitList();
    printf("建表：");
    for (int i = 1; i <= 5; i++) ListInsert(L, i, i * 10);
    Print(L, "");

    printf("\\n在第 1 位插入 5：");
    ListInsert(L, 1, 5);
    Print(L, "");

    printf("在第 4 位插入 99：");
    ListInsert(L, 4, 99);
    Print(L, "");

    printf("在第 100 位插入（非法）：%s\\n", ListInsert(L, 100, 1) ? "成功" : "失败");

    int e;
    if (ListDelete(L, 2, &e)) printf("\\n删除第 2 位：删掉了 %d -> ", e);
    Print(L, "");
    printf("删除第 100 位：%s\\n", ListDelete(L, 100, &e) ? "成功" : "失败");

    printf("\\n再插入几个 5：");
    ListInsert(L, 2, 5);
    ListInsert(L, 5, 5);
    Print(L, "");

    int cnt = DeleteAllX(L, 5);
    printf("删除所有值为 5 的结点，共删了 %d 个：", cnt);
    Print(L, "");

    // 释放
    LNode *p = L;
    while (p) { LNode *n = p->next; free(p); p = n; }
    return 0;
}`,
    tips: [
      '把「找前驱」写成一个独立函数 `GetPrev(L, i)`，插入删除都能复用，代码立刻清爽。',
      '判 `p == NULL` 和判 `p->next == NULL` 的区别要分清：前者是位序太大，后者是表尾。'
    ],
    traps: [
      '`s->next = p->next; p->next = s;` 写反顺序，链表后半截直接丢失。',
      '删除时忘了 free，跑一万次就是一万个泄漏结点。'
    ],
    exercises: ['ex-linklist-del']
  },

  {
    id: 'd-linklist-app',
    ch: 'c2',
    title: '单链表经典题：逆置、找中点、合并、判环',
    tag: '重点·面试',
    brief: '快慢指针、三指针逆置、双路归并——链表题就这几个套路。',
    tags: ['链表逆置', '快慢指针', '合并有序链表', '判断环', '双指针'],
    body: `
      <h2>1. 原地逆置（三指针法）</h2>
      <p>把每个结点的 <code>next</code> 反过来指。需要三个指针：<code>prev</code>（已逆置部分的头）、<code>cur</code>（当前）、<code>next</code>（暂存后继）。</p>
      <pre><code>prev = NULL; cur = head-&gt;next;
while (cur) {
    next = cur-&gt;next;    // ① 先存后继，不然改完就找不到了
    cur-&gt;next = prev;    // ② 反转指针
    prev = cur;          // ③ prev 前移
    cur = next;          // ④ cur 前移
}
head-&gt;next = prev;</code></pre>
      <p>这四行的顺序是死的，背下来。<strong>①必须先做</strong>，否则链表断了。</p>

      <h2>2. 找中间结点（快慢指针）</h2>
      <p>慢指针走一步，快指针走两步。快指针到末尾时，慢指针正好在中间。找中点、判环、找环入口、找倒数第 k 个，全是这个套路。</p>

      <h2>3. 合并两个有序链表</h2>
      <p>双路归并：比较两个头，谁小接谁。用一个"尾指针"串结果，最后接上剩下的部分。</p>

      <h2>4. 判断有没有环</h2>
      <p>快指针每次两步、慢指针一步。<strong>有环则必相遇</strong>（在环里快指针每轮追近 1 步）；无环则快指针先到 NULL。</p>
      <div class="note">为什么一定相遇？因为进环后两者距离每轮减 1，距离是整数，必然减到 0。这个证明过程面试会被追问。</div>

      <h2>5. 找倒数第 k 个</h2>
      <p>先让快指针走 k 步，再和慢指针一起走，快指针到 NULL 时慢指针就是倒数第 k 个。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode, *LinkList;

LinkList Init(void) {
    LNode *L = (LNode *)malloc(sizeof(LNode));
    L->next = NULL;
    return L;
}

void append(LinkList L, int e) {
    LNode *p = L;
    while (p->next) p = p->next;
    LNode *s = (LNode *)malloc(sizeof(LNode));
    s->data = e;
    s->next = NULL;
    p->next = s;
}

void print(LinkList L, const char *tag) {
    printf("%s", tag);
    for (LNode *p = L->next; p; p = p->next)
        printf("%s%d", p == L->next ? "" : " -> ", p->data);
    printf("\\n");
}

// 1. 原地逆置
void reverse(LinkList L) {
    LNode *prev = NULL, *cur = L->next;
    while (cur) {
        LNode *next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    L->next = prev;
}

// 2. 找中间结点（偶数个时返回靠前的那个）
LNode *middle(LinkList L) {
    LNode *slow = L->next, *fast = L->next;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

// 3. 合并两个有序链表，结果放进 C
void merge(LinkList A, LinkList B, LinkList Cm) {
    LNode *pa = A->next, *pb = B->next, *tail = Cm;
    while (pa && pb) {
        if (pa->data <= pb->data) { tail->next = pa; pa = pa->next; }
        else                      { tail->next = pb; pb = pb->next; }
        tail = tail->next;
    }
    tail->next = pa ? pa : pb;
}

// 4. 判环
int has_cycle(LinkList L) {
    LNode *slow = L, *fast = L;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return 1;
    }
    return 0;
}

// 5. 倒数第 k 个
LNode *kth_from_end(LinkList L, int k) {
    LNode *fast = L->next, *slow = L->next;
    for (int i = 0; i < k; i++) {
        if (fast == NULL) return NULL;
        fast = fast->next;
    }
    while (fast) {
        slow = slow->next;
        fast = fast->next;
    }
    return slow;
}

int main(void) {
    LinkList A = Init();
    for (int i = 1; i <= 6; i++) append(A, i * 10);
    print(A, "原始链表：      ");

    LNode *mid = middle(A);
    printf("中间结点：      %d\\n", mid->data);

    reverse(A);
    print(A, "逆置后：        ");

    reverse(A);
    LNode *k2 = kth_from_end(A, 2);
    printf("倒数第 2 个：   %d\\n", k2 ? k2->data : -1);

    printf("有环吗？        %s\\n", has_cycle(A) ? "有" : "没有");

    // 手动造一个环：让尾结点指回第 2 个结点
    LNode *tail = A->next;
    while (tail->next) tail = tail->next;
    tail->next = A->next->next;
    printf("造环后：        %s\\n", has_cycle(A) ? "有" : "没有");
    tail->next = NULL;      // 拆环，否则后面释放会死循环

    // 合并两个有序表
    LinkList B = Init(), Cm = Init();
    append(B, 15); append(B, 25); append(B, 60);
    merge(A, B, Cm);
    print(A, "\\n有序链表 A：   ");
    print(B, "有序链表 B：     ");
    print(Cm, "合并结果：      ");

    // 释放：A、B 的头结点是独立申请的，链表结点已被合并进 Cm
    free(A);
    free(B);
    LNode *p = Cm;
    while (p) { LNode *n = p->next; free(p); p = n; }
    return 0;
}`,
    tips: [
      '所有链表题先在纸上画 3 个结点，把指针变化标出来，比在脑子里模拟快十倍。',
      '快慢指针的四道常见题（中点、环、环入口、倒数第 k）本质是同一个技巧。'
    ],
    traps: [
      '逆置循环里先改 `cur->next` 再存 `next`，链表直接断，后面全空。',
      '快指针判断条件写成 `fast->next && fast->next->next` 容易漏边界，用 `fast && fast->next` 更稳。'
    ],
    exercises: ['ex-linklist-reverse']
  },

  {
    id: 'd-dlink',
    ch: 'c2',
    title: '双向链表与循环链表',
    tag: '重点',
    brief: '双向链表多一个 prior 指针，换来 O(1) 找前驱；循环链表没有 NULL。',
    tags: ['双向链表', '循环链表', 'prior', 'next', '约瑟夫环'],
    body: `
      <h2>双向链表</h2>
      <pre><code>typedef struct DNode {
    int data;
    struct DNode *prior, *next;
} DNode, *DLinkList;</code></pre>
      <p>每个结点知道自己的前后是谁，代价是多用一个指针（存储密度下降），收益是<strong>找前驱 O(1)</strong>、可以反向遍历。</p>

      <h3>插入（在 p 之后插入 s）—— 四步，顺序不能错</h3>
      <pre><code>s-&gt;next = p-&gt;next;        // ①
if (p-&gt;next) p-&gt;next-&gt;prior = s;   // ②
s-&gt;prior = p;             // ③
p-&gt;next = s;              // ④</code></pre>
      <p>口诀：<strong>先接后，再接前，最后改前驱的 next</strong>。②必须在④之前，否则 <code>p-&gt;next</code> 已经变了，找不到原来的后继。</p>

      <h3>删除（删 p 的后继 q）</h3>
      <pre><code>q = p-&gt;next;
p-&gt;next = q-&gt;next;
if (q-&gt;next) q-&gt;next-&gt;prior = p;
free(q);</code></pre>

      <h2>循环链表</h2>
      <p>尾结点的 <code>next</code> 指回头结点，形成一个环。好处：从任意结点出发都能遍历全表；判断结束的条件变成 <code>p != head</code> 而不是 <code>p != NULL</code>。</p>
      <div class="warn">循环链表的遍历千万别用 <code>while (p != NULL)</code>，永远不成立，直接死循环。本程序 5 秒会被掐掉，你可以试试。</div>

      <h3>只设尾指针的循环链表很香</h3>
      <p>因为 <code>rear-&gt;next</code> 就是头结点，所以<strong>访问表头 O(1)</strong>，在表头表尾插入都 O(1)。两个循环链表合并也只要 O(1)——这是考试爱考的小结论。</p>

      <h2>约瑟夫环</h2>
      <p>n 个人围成一圈，报数到 m 的出列。用循环链表模拟最直观：数 m-1 步，删掉下一个，继续。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct DNode {
    int data;
    struct DNode *prior, *next;
} DNode, *DLinkList;

DLinkList InitD(void) {
    DNode *L = (DNode *)malloc(sizeof(DNode));
    L->prior = L->next = L;    // 空的双向循环链表：自己指自己
    return L;
}

void AppendD(DLinkList L, int e) {
    DNode *tail = L->prior;    // 尾结点
    DNode *s = (DNode *)malloc(sizeof(DNode));
    s->data = e;
    s->next = L;               // 新结点接在尾后、头前
    s->prior = tail;
    tail->next = s;
    L->prior = s;
}

void PrintD(DLinkList L, const char *tag) {
    printf("%s正向：", tag);
    for (DNode *p = L->next; p != L; p = p->next)
        printf("%d ", p->data);
    printf("| 反向：");
    for (DNode *p = L->prior; p != L; p = p->prior)
        printf("%d ", p->data);
    printf("\\n");
}

// 约瑟夫环：n 个人，报到 m 出列，输出出列顺序
void josephus(int n, int m) {
    DLinkList L = InitD();
    for (int i = 1; i <= n; i++) AppendD(L, i);

    printf("约瑟夫环 n=%d, m=%d 出列顺序：", n, m);
    DNode *p = L->next;
    int left = n;
    while (left > 0) {
        for (int i = 1; i < m; i++) p = p->next;   // 数 m-1 步
        if (p == L) p = p->next;                   // 跳过哨兵
        printf("%d ", p->data);
        DNode *next = p->next;
        p->prior->next = p->next;                  // 从环上摘掉
        p->next->prior = p->prior;
        free(p);
        p = next;
        if (p == L) p = p->next;
        left--;
    }
    printf("\\n");
    free(L);
}

int main(void) {
    printf("== 双向循环链表 ==\\n");
    DLinkList L = InitD();
    for (int i = 1; i <= 5; i++) AppendD(L, i * 10);
    PrintD(L, "");

    // 在值为 20 的结点后面插入 25
    DNode *p = L->next;
    while (p != L && p->data != 20) p = p->next;
    if (p != L) {
        DNode *s = (DNode *)malloc(sizeof(DNode));
        s->data = 25;
        s->next = p->next;
        p->next->prior = s;
        s->prior = p;
        p->next = s;
        printf("在 20 后面插入 25：");
        PrintD(L, "");
    }

    // 删除值为 25 的结点
    p = L->next;
    while (p != L && p->data != 25) p = p->next;
    if (p != L) {
        p->prior->next = p->next;
        p->next->prior = p->prior;
        free(p);
        printf("删除 25 之后：");
        PrintD(L, "");
    }

    // 释放
    p = L->next;
    while (p != L) { DNode *n = p->next; free(p); p = n; }
    free(L);

    printf("\\n== 约瑟夫环 ==\\n");
    josephus(7, 3);
    return 0;
}`,
    tips: [
      '双向链表用「哨兵头结点 + 循环」的写法最省事，头和尾的边界都消失了。',
      '约瑟夫环用数组也能做（下标 mod n），但链表写法最能体现"删除 O(1)"的优势。'
    ],
    traps: [
      '双向链表插入时漏了 `if (p->next)` 判空，插在表尾会崩。',
      '循环链表遍历用 `p != NULL` 会死循环，必须是 `p != head`。'
    ]
  },

  {
    id: 'd-static',
    ch: 'c2',
    title: '静态链表：用数组模拟指针',
    tag: '了解',
    brief: '没有指针的语言怎么实现链表？用数组下标当指针。',
    tags: ['静态链表', '游标', '数组模拟', 'next 下标'],
    body: `
      <h2>为什么会有这个东西</h2>
      <p>早期语言（比如 BASIC、Fortran）没有指针，但需要链表。解法：<strong>用数组下标代替地址</strong>，这个下标叫"游标（cursor）"。</p>
      <pre><code>typedef struct {
    int data;
    int next;      // 存的是下一个元素的下标，不是地址
} SLinkList[MAXSIZE];</code></pre>

      <h2>规则</h2>
      <ul>
        <li>下标 0 当"头结点"，<code>next</code> 指向第一个元素。</li>
        <li>用 <code>-1</code>（或 0）表示 NULL，标记链表结束。</li>
        <li>插入时找空闲位置（通常把空闲单元也串成一条"备用链表"）。</li>
      </ul>

      <h2>优缺点</h2>
      <table>
        <tr><th>优点</th><th>缺点</th></tr>
        <tr><td>不用指针，可移植到无指针环境</td><td>容量固定，需预先分配</td></tr>
        <tr><td>插入删除不需要移动元素</td><td>不能随机访问（要顺着下标走）</td></tr>
        <tr><td>数据可以存在磁盘文件里</td><td>找空闲位置有额外开销</td></tr>
      </table>
      <div class="note">考试里通常只考"给一个静态链表数组，画出逻辑结构"和"写出插入/删除的下标变化"。理解"下标当指针"这一句就够了。</div>
    `,
    code: `#include <stdio.h>

#define MAXSIZE 10
#define NULL_IDX -1

typedef struct {
    int data;
    int next;          // 下一个元素在数组中的下标
} SNode;

typedef struct {
    SNode node[MAXSIZE];
    int head;          // 首元素下标
} SLinkList;

void Init(SLinkList *L) {
    L->head = NULL_IDX;
    for (int i = 0; i < MAXSIZE; i++) {
        L->node[i].data = 0;
        L->node[i].next = NULL_IDX;
    }
}

// 找一个空位
int alloc_node(SLinkList *L) {
    for (int i = 0; i < MAXSIZE; i++) {
        int used = (i == L->head);
        for (int p = L->head; p != NULL_IDX; p = L->node[p].next)
            if (p == i) { used = 1; break; }
        if (!used) return i;
    }
    return NULL_IDX;
}

// 头插
int InsertHead(SLinkList *L, int e) {
    int idx = alloc_node(L);
    if (idx == NULL_IDX) return 0;
    L->node[idx].data = e;
    L->node[idx].next = L->head;
    L->head = idx;
    return 1;
}

void Print(const SLinkList *L, const char *tag) {
    printf("%s", tag);
    for (int p = L->head; p != NULL_IDX; p = L->node[p].next)
        printf("%d ", L->node[p].data);
    printf("\\n");
}

void Dump(const SLinkList *L) {
    printf("  下标: ");
    for (int i = 0; i < MAXSIZE; i++) printf("%3d", i);
    printf("\\n  data: ");
    for (int i = 0; i < MAXSIZE; i++) printf("%3d", L->node[i].data);
    printf("\\n  next: ");
    for (int i = 0; i < MAXSIZE; i++) printf("%3d", L->node[i].next);
    printf("\\n  head = %d\\n", L->head);
}

int main(void) {
    SLinkList L;
    Init(&L);

    InsertHead(&L, 30);
    InsertHead(&L, 20);
    InsertHead(&L, 10);
    Print(&L, "静态链表：");
    Dump(&L);

    printf("\\n读法：head=%d -> node[%d].next=... 一路走到 -1\\n", L.head, L.head);
    printf("这不就是链表吗？只不过 next 存的是下标而不是地址。\\n");

    printf("\\n逻辑顺序是 ");
    for (int p = L.head; p != NULL_IDX; p = L.node[p].next)
        printf("%d%s", L.node[p].data, L.node[p].next != NULL_IDX ? " -> " : "");
    printf("\\n");
    return 0;
}`,
    tips: [
      '把静态链表当成"数组实现的链表"，一切操作都能对上号：head 是头指针，next 是指针。',
      '真正工程里（比如文件系统、Redis 的 ziplist）确实有类似的"用下标代替指针"的设计，为了省内存和可持久化。'
    ],
    traps: [
      '判结束用 `-1` 还是 `0` 取决于实现约定，别一半用 -1 一半用 0。',
      '删除结点时要把它的 next 还回"空闲链表"，否则这个位置永远用不了。'
    ]
  },

  {
    id: 'd-linear-compare',
    ch: 'c2',
    title: '顺序表 vs 链表：到底该用哪个',
    tag: '必学',
    brief: '查得多用顺序表，插删多用链表。没有银弹。',
    tags: ['顺序表', '链表', '对比', '选型', '存储密度', '缓存'],
    body: `
      <h2>八项对比</h2>
      <table>
        <tr><th>维度</th><th>顺序表</th><th>链表</th></tr>
        <tr><td>存储方式</td><td>连续内存</td><td>离散，靠指针连</td></tr>
        <tr><td>随机访问</td><td>O(1)</td><td>O(n)</td></tr>
        <tr><td>按值查找</td><td>O(n)</td><td>O(n)</td></tr>
        <tr><td>插入/删除</td><td>O(n)（要搬家）</td><td>O(1)（已定位到前驱时）</td></tr>
        <tr><td>空间</td><td>需预分配，可能浪费</td><td>按需分配，但每个结点多一个指针</td></tr>
        <tr><td>存储密度</td><td>1（全是数据）</td><td>&lt; 1（指针占地方）</td></tr>
        <tr><td>缓存友好</td><td>非常好（连续）</td><td>差（到处跳）</td></tr>
        <tr><td>实现难度</td><td>简单</td><td>指针操作容易错</td></tr>
      </table>

      <h2>关键但常被忽略的一点</h2>
      <p>链表的"插入删除 O(1)"有前提：<strong>你已经拿到了那个位置的前驱指针</strong>。如果只给一个位序 i，你还是得先 O(n) 走过去。所以：</p>
      <div class="warn">"链表插入比顺序表快"这句话，在"按位序插入"的场景下是<strong>错的</strong>——两者都是 O(n)，只是链表是"找"的代价，顺序表是"搬"的代价。真正的优势在"已知结点指针"的场景，比如 LRU 缓存、邻接表删边。</div>

      <h2>工程上的真实建议</h2>
      <ul>
        <li>数据量已知、以查询为主 → <strong>数组/顺序表</strong>。99% 的业务场景都是这个。</li>
        <li>频繁在中间插入删除、长度变化剧烈 → <strong>链表</strong>。</li>
        <li>追求性能的现代代码 → 优先数组。因为 CPU 缓存对连续内存的加速能到 10 倍以上，抵消了搬家的开销。这就是为什么 <code>std::vector</code> 比 <code>std::list</code> 常用得多。</li>
        <li>需要 O(1) 删除且要遍历 → 双向链表（如 LRU）。</li>
      </ul>
      <div class="note">下面代码用"操作次数"量化对比，不测时间（时间受机器影响不稳定），但结论一样清楚。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

/* 用一个实验对比：在位序 1 反复插入，谁更累？ */

typedef struct Node {
    int data;
    struct Node *next;
} Node;

int main(void) {
    int n = 200;

    /* --- 顺序表：头插要搬 n 个元素 --- */
    long long moves = 0;
    int *arr = (int *)malloc(sizeof(int) * (n + 1));
    int len = 0;
    for (int k = 0; k < n; k++) {
        for (int j = len; j > 0; j--) {     // 整体后移
            arr[j] = arr[j - 1];
            moves++;
        }
        arr[0] = k;
        len++;
    }
    printf("顺序表头插 %d 次：搬家 %lld 次\\n", n, moves);
    free(arr);

    /* --- 链表：头插只改两个指针 --- */
    long long steps = 0;
    Node *head = NULL;
    for (int k = 0; k < n; k++) {
        Node *s = (Node *)malloc(sizeof(Node));
        s->data = k;
        s->next = head;
        head = s;
        steps += 2;                        // 两次指针赋值
    }
    printf("单链表头插 %d 次：改指针 %lld 次\\n", n, steps);

    /* --- 但链表按位序访问第 i 个，要一步步走 --- */
    long long walk = 0;
    Node *p = head;
    while (p) { walk++; p = p->next; }
    printf("链表遍历一遍：走 %lld 步（顺序表只要 1 次下标运算）\\n", walk);

    while (head) { Node *t = head->next; free(head); head = t; }

    printf("\\n结论：\\n");
    printf("  头插：链表完胜（O(1) vs O(n)）\\n");
    printf("  随机访问：顺序表完胜（O(1) vs O(n)）\\n");
    printf("  所以选型看你的主要操作是哪个。\\n");
    return 0;
}`,
    tips: [
      '面试被问"为什么 vector 比 list 快"，答案就是缓存局部性 + 现代 CPU 的预取。',
      '真实项目里如果需要频繁中间插入，先考虑"数组 + 预留空间 + 批量重建"，往往比链表简单又快。'
    ],
    traps: [
      '别背"链表插入删除 O(1)"就到处套，按位序操作是 O(n)。',
      '链表的指针额外占用 8 字节/结点，数据本身只有 4 字节时，存储密度只有 33%。'
    ]
  }

  );
})();
