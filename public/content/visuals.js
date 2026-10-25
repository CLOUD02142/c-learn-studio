/* ============================================================
   visuals.js —— 可视化演示源码库
   ------------------------------------------------------------
   这里放的是"能演"的 C 代码：每段都在关键操作后埋了帧，
   点「演示」跑一遍，前端就能按帧回放，同时高亮编辑器里对应的那行。

   写这类演示代码的三条纪律：
   1) #include "trace.h" —— 服务端每次编译都会把 trace.h 放到源码旁边。
   2) 一帧 = 若干个 tr_xxx() 描述状态 + tr_note() 说明 + tr_end() 提交。
   3) 在辅助函数里打帧，要把 __LINE__ 当参数传进去，
      否则所有帧的行号都会钉死在辅助函数内部，代码高亮就白瞎了。

   代码用 String.raw 包着，反斜杠不会被 JS 吃掉（printf 里的 \n 才能原样保留）。
   ============================================================ */
(function () {
  'use strict';

  window.VISUALS = {

    /* ══════════════════ 数组：连续存储 ══════════════════ */
    'c-array': {
      title: '数组：内存里挨着放的一排格子',
      desc: '每格上面是真实地址。看清楚了：相邻两格差 sizeof(int) 而不是 1，这就是下标寻址能一步跳到位的底气。',
      code: String.raw`
/* 数组：元素在内存里一格挨一格，步长固定 = sizeof(元素类型)
   下标寻址之所以是 O(1)，就是"首地址 + i × 4"一个乘加算完，不用顺着数 */
#include <stdio.h>
#include "trace.h"

#define N 6

static int a[N] = {17, 42, 8, 99, 3, 56};

/* 所有帧都走这里。hi 是要点亮的格子，-1 表示不点亮；
   行号必须由调用处传进来，否则高亮会全钉在 show 函数自己身上 */
static void show(int hi, const char *kind, const char *note, int line) {
    tr_begin();
    tr_mem("a", (const void *)a, a, N, (int)sizeof a[0]);
    if (hi >= 0) tr_mark(hi, kind);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    show(-1, "cur", "a 是 6 个 int，在内存里排成连续的一排，每格 4 字节", __LINE__);

    show(0, "cur", "a[0] 的地址就是整个数组的首地址，也是 a 这个数组名退化后的值", __LINE__);

    show(1, "cur", "a[1] 在首地址上往后挪 1×4 字节 —— 不是挪 1 个字节，别搞错", __LINE__);

    show(4, "cur", "a[4] = 首地址 + 4×4，乘个倍数直接跳过去，不用从头一个个数", __LINE__);

    a[4] = 100;
    show(4, "swap", "改 a[4] 就只改这一格，旁边几格纹丝不动", __LINE__);

    show(-1, "done", "合法下标只有 0..5。a[6] 已经踩到数组外面去了，而且编译器通常不拦你", __LINE__);

    printf("a[0]=%d  a[4]=%d  sizeof(a)=%d 字节\n", a[0], a[4], (int)sizeof a);
    return 0;
}
`
    },

    /* ══════════════════ 指针 ══════════════════ */
    'c-pointer': {
      title: '指针：地址、解引用、以及 p++ 到底挪多远',
      desc: 'p 里装的不是值，是地址；*p 是顺着地址回去拿那个变量。p++ 挪的是 sizeof(指针所指类型)，所以 int* 一次走 4 字节。',
      code: String.raw`
/* 指针三件事：& 取地址、* 解引用、p++ 按"所指类型的大小"移动
   指标卡片里的地址就是 p 里存的值，箭头指向哪格，哪格就点亮 */
#include <stdio.h>
#include "trace.h"

#define N 5

static int a[N] = {10, 20, 30, 40, 50};

static void show(int *p, int hi, const char *note, int line) {
    char to[32];
    if (p == NULL) snprintf(to, sizeof to, "NULL");
    else           snprintf(to, sizeof to, "a[%d]", (int)(p - a));

    tr_begin();
    tr_mem("a", (const void *)a, a, N, (int)sizeof a[0]);
    if (hi >= 0) tr_mark(hi, "cur");
    tr_ptr("p", (const void *)p, to);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    int *p = a;                     /* 数组名退化成首元素地址，等价于 &a[0] */

    show(p, 0, "p = a：把 a[0] 的地址存进 p。此时 *p 读出来的就是 a[0]", __LINE__);

    p++;
    show(p, 1, "p++ 加的是一个 int 的宽度 = 4 字节，所以落在 a[1] 而不是字节 1", __LINE__);

    p++;
    show(p, 2, "再 ++ 一次落在 a[2]，现在 *p 就是 30", __LINE__);

    *p = 33;
    show(p, 2, "*p = 33 改的是 p 指的那一格，a[2] 当场变成 33", __LINE__);

    p = a + 4;
    show(p, 4, "a + 4 就是 &a[4]：*(a + i) 和 a[i] 是同一件事的两种写法", __LINE__);

    p = NULL;
    show(p, -1, "p 置空之后不能再解引用，*p 会直接段错误 —— C 里最常见的崩法", __LINE__);

    printf("a = %d %d %d %d %d\n", a[0], a[1], a[2], a[3], a[4]);
    return 0;
}
`
    },

    /* ══════════════════ 字符串与 '\0' ══════════════════ */
    'c-string': {
      title: "字符串：那个看不见的 '\\0' 才是命根子",
      desc: "字符串就是 char 数组，末尾靠 '\\0' 收尾。strlen 数到它就停，所以 strcpy 之后旧字符还赖在后面，只是不算数了。",
      code: String.raw`
/* 字符串 = char 数组 + 结尾的 '\0'
   strlen 不认长度，它只认 '\0'：一路数，数到 0 就停 */
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include "trace.h"

#define CAP 10

static char buf[CAP] = "hello";     /* 后面几格由编译器自动补 0 */

static void show(int hi, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_memc("buf", (const void *)buf, buf, CAP, 1);
    if (hi >= 0) tr_mark(hi, "cur");
    tr_var("strlen", "%d", (int)strlen(buf));
    tr_var("sizeof", "%d", (int)sizeof buf);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    show(5, __LINE__, "hello 占 6 个字节：5 个字母 + 1 个 \\0，剩下的格子被补成 0");

    show(-1, __LINE__, "strlen 数到 \\0 就停，所以是 5；sizeof buf 是数组总大小，永远是 10");

    buf[0] = 'H';
    show(0, __LINE__, "改首字母就是改数组里那一格，跟别的格子没关系");

    strcpy(buf, "hi");
    show(2, __LINE__, "strcpy 只写了 h i 和新的 \\0，原来后面的 l、o 还赖在那几格里");

    show(2, __LINE__, "所以 strlen 变成 2 —— 后面虽然还有字符，但已经不算这个字符串的一部分了");

    buf[2] = 'X';
    show(2, __LINE__, "把 \\0 覆盖成 X，字符串当场从 2 涨回 5：只要没遇到 0，strlen 就一路数下去");

    printf("strlen = %d, sizeof = %d\n", (int)strlen(buf), (int)sizeof buf);
    return 0;
}
`
    },

    /* ══════════════════ 顺序表：插入与删除 ══════════════════ */
    'd-seqlist': {
      title: '顺序表的插入与删除',
      desc: '插入要把它后面的元素整体后移，删除要整体前移——这就是顺序表 O(n) 的来源。',
      code: String.raw`
/* 顺序表：在下标 pos 插入一个元素，再把下标 1 的元素删掉
   重点观察：插入是"从后往前挪"，删除是"从前往后挪"，方向不能反 */
#include <stdio.h>
#include "trace.h"

#define MAX 9

int main(void) {
    int a[MAX] = {7, 11, 15, 19};
    int len = 4;
    int pos = 2, val = 13;

    tr_begin();
    tr_seq("L", a, len, MAX);
    tr_note("初始：length = %d，后面那些点线格是 capacity 的空余槽位", len);
    TR_END();

    tr_begin();
    tr_seq("L", a, len, MAX);
    tr_mark(pos, "new");
    tr_var("pos", "%d", pos);
    tr_var("val", "%d", val);
    tr_note("目标：在下标 %d 插入 %d。下标 %d 及其之后的元素都要往后挪一格", pos, val, pos);
    TR_END();

    for (int k = len; k > pos; k--) {
        a[k] = a[k - 1];
        tr_begin();
        tr_seq("L", a, len + 1, MAX);
        tr_mark(k, "swap");
        tr_mark(k - 1, "done");
        tr_var("k", "%d", k);
        tr_note("a[%d] ← a[%d]：把 %d 往后挪一格（从后往前，不然会覆盖）", k, k - 1, a[k]);
        TR_END();
    }

    a[pos] = val;
    len++;

    tr_begin();
    tr_seq("L", a, len, MAX);
    tr_mark(pos, "new");
    tr_note("空位腾好了，写入 %d，length++ 变成 %d", val, len);
    TR_END();

    /* —————— 下面演示删除 —————— */
    tr_begin();
    tr_seq("L", a, len, MAX);
    tr_mark(1, "del");
    tr_note("现在删除 a[1] = %d，它后面的元素整体前移", a[1]);
    TR_END();

    for (int k = 1; k < len - 1; k++) {
        a[k] = a[k + 1];
        tr_begin();
        tr_seq("L", a, len, MAX);
        tr_mark(k, "cur");
        tr_mark(k + 1, "del");
        tr_var("k", "%d", k);
        tr_note("a[%d] ← a[%d]：从前往后挪", k, k + 1);
        TR_END();
    }
    len--;

    tr_begin();
    tr_seq("L", a, len, MAX);
    tr_note("删除完成，length = %d。插入和删除都要搬元素 → 平均 O(n)", len);
    TR_END();

    printf("最终长度 %d\n", len);
    return 0;
}
`
    },

    /* ══════════════════ 单链表：头插与删除 ══════════════════ */
    'd-linklist': {
      title: '单链表的头插法与删除结点',
      desc: '头插只要两步（新结点指针指向旧表头、head 改指新结点），但插入顺序被倒过来了；删除要记住前驱结点。',
      code: String.raw`
/* 单链表：头插法建表 → 按值删除 → 遍历
   头插两步：p->next = head; head = p;  顺序反了就把表弄丢了 */
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include "trace.h"

typedef struct Node { int data; struct Node *next; } Node;

#define POOL 16
static Node *pool[POOL];
static int pool_n = 0;

/* 给每个结点一个稳定编号，只是为了画图时能画箭头 */
static int id_of(Node *p) {
    for (int i = 0; i < pool_n; i++) if (pool[i] == p) return i;
    return -1;
}

static Node *make(int v) {
    Node *p = (Node *)malloc(sizeof(Node));
    p->data = v;
    p->next = NULL;
    pool[pool_n++] = p;
    return p;
}

/* 把整条链表画出来。line 由调用处传 __LINE__，前端拿它高亮源码 */
static void draw(Node *head, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    int any = 0;
    for (Node *p = head; p; p = p->next) {
        char buf[16];
        snprintf(buf, sizeof buf, "%d", p->data);
        tr_lnode(id_of(p), buf, p->next ? id_of(p->next) : -1);
        any = 1;
    }
    if (!any) tr_var("head", "NULL");   /* 空表也得有东西可画，不然那帧是白板 */
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    int vals[4] = {10, 20, 30, 40};
    Node *head = NULL;

    draw(head, __LINE__, "空表：head = NULL，一个结点都没有");

    for (int i = 0; i < 4; i++) {
        Node *p = make(vals[i]);
        p->next = head;     /* 第一步：新结点接上旧表头 */
        head = p;           /* 第二步：head 改指新结点 */
        draw(head, __LINE__, "头插 %d：先 p->next = head，再 head = p", vals[i]);
    }

    draw(head, __LINE__, "插完了。注意顺序反了：最后插的在最前面");

    /* —————— 按值删除 —————— */
    Node *pre = NULL, *cur = head;
    while (cur && cur->data != 30) {
        draw(head, __LINE__, "查找 %d：当前是 %d，不是，继续往后走", 30, cur->data);
        pre = cur;
        cur = cur->next;
    }

    draw(head, __LINE__, "找到 %d 了，pre 是它的前驱。删结点必须知道前驱", 30);

    if (cur) {
        if (pre) pre->next = cur->next;   /* 跳过 cur */
        else     head = cur->next;        /* 删的是第一个 */
        free(cur);
        draw(head, __LINE__, "摘链完成：pre->next = cur->next，30 被跳过");
    }

    for (Node *p = head; p; p = p->next) {
        draw(head, __LINE__, "遍历到结点 %d", p->data);
    }

    printf("遍历结束\n");
    return 0;
}
`
    },

    /* ══════════════════ 顺序栈：进制转换 ══════════════════ */
    'd-stack': {
      title: '顺序栈：十进制转二进制',
      desc: '不断除 2 取余把余数压栈，最后弹栈输出——先压进去的后出来，天然倒序。栈的"后进先出"在这里看得最清楚。',
      code: String.raw`
/* 顺序栈：十进制转二进制
   栈底 ↑ 栈顶，top 是栈顶元素的下标，-1 表示空栈 */
#include <stdio.h>
#include "trace.h"

#define MAX 16

int main(void) {
    int st[MAX];
    int top = -1;
    int n = 25;
    int origin = n;

    tr_begin();
    tr_arr("stack", st, 0);
    tr_var("top", "%d", top);
    tr_var("n", "%d", n);
    tr_note("空栈：top = -1。注意 top 是下标，不是元素个数");
    TR_END();

    while (n > 0) {
        int r = n % 2;
        st[++top] = r;      /* 先移动栈顶指针，再存元素 */
        n /= 2;
        tr_begin();
        tr_arr("stack", st, top + 1);
        tr_mark(top, "new");
        tr_var("top", "%d", top);
        tr_var("n", "%d", n);
        tr_note("余数 %d 入栈：++top 后写入 st[%d]，n 变成 %d", r, top, n);
        TR_END();
    }

    tr_begin();
    tr_arr("stack", st, top + 1);
    tr_note("%d 的二进制位全压完了，此刻从栈顶开始弹", origin);
    TR_END();

    int bits = 0;
    while (top >= 0) {
        int b = st[top--];
        bits = bits * 10 + b;
        tr_begin();
        tr_arr("stack", st, top + 1);
        if (top >= 0) tr_mark(top, "cur");
        tr_var("top", "%d", top);
        tr_note("弹出 %d，剩下 %d 个。弹出来的顺序就是二进制的高位到低位", b, top + 1);
        TR_END();
    }

    printf("%d 的二进制是 %d\n", origin, bits);
    return 0;
}
`
    },

    /* ══════════════════ 循环队列 ══════════════════ */
    'd-queue': {
      title: '循环队列：入队与出队',
      desc: 'front 指着队头、rear 指着"下一个要写的位置"，两者都对 MAX 取模，所以队列能在数组里绕圈，不会假溢出。',
      code: String.raw`
/* 循环队列：入队 5 个，出队 2 个，再入队 2 个
   关键看 front / rear 怎么绕过数组末端回到 0 —— 这就是"循环"的含义 */
#include <stdio.h>
#include "trace.h"

#define MAX 6

/* 画当前队列：整排格子都画出来，用标记区分"有效 / 队头 / 刚入队" */
static void draw(int *q, int front, int rear, int cnt, int line, const char *note) {
    tr_begin();
    tr_arr("queue", q, MAX);
    for (int i = 0; i < MAX; i++) {
        /* 从 front 开始数 cnt 个，就是当前有效元素 */
        if (cnt > 0 && ((i - front + MAX) % MAX) < cnt) tr_mark(i, "done");
    }
    if (cnt > 0) tr_mark(front, "cur");
    if (cnt > 0) tr_mark((rear - 1 + MAX) % MAX, "new");
    tr_var("front", "%d", front);
    tr_var("rear", "%d", rear);
    tr_var("cnt", "%d", cnt);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    int q[MAX] = {0};
    int front = 0, rear = 0, cnt = 0;

    draw(q, front, rear, cnt, __LINE__, "空队列：front == rear == 0。队空的条件就是它俩相等");

    int enq[5] = {3, 6, 9, 12, 15};
    for (int i = 0; i < 5; i++) {
        q[rear] = enq[i];
        rear = (rear + 1) % MAX;
        cnt++;
        char buf[128];
        snprintf(buf, sizeof buf, "入队 %d：写在 q[%d]，然后 rear 追一格变 %d",
                 enq[i], (rear - 1 + MAX) % MAX, rear);
        draw(q, front, rear, cnt, __LINE__, buf);
    }

    for (int i = 0; i < 2; i++) {
        int v = q[front];
        front = (front + 1) % MAX;
        cnt--;
        char buf[128];
        snprintf(buf, sizeof buf, "出队 %d：只移动 front，元素本身不用擦掉", v);
        draw(q, front, rear, cnt, __LINE__, buf);
    }

    int more[2] = {21, 24};
    for (int i = 0; i < 2; i++) {
        q[rear] = more[i];
        rear = (rear + 1) % MAX;
        cnt++;
        char buf[160];
        snprintf(buf, sizeof buf,
                 "再入队 %d：rear 已经到末尾，取模后绕回 %d —— 这就是循环队列",
                 more[i], rear);
        draw(q, front, rear, cnt, __LINE__, buf);
    }

    printf("队列里还有 %d 个元素，front=%d rear=%d\n", cnt, front, rear);
    return 0;
}
`
    },

    /* ══════════════════ 二叉树中序遍历 ══════════════════ */
    'd-tree-traverse': {
      title: '二叉树中序遍历（左 → 根 → 右）',
      desc: '递归的行走顺序和你手工走一遍完全一致。盯着下面"访问序列"的逐步增长，最右一列数字会按从小到大排好。',
      code: String.raw`
/* 二叉树中序遍历：左子树 → 根 → 右子树
   树里存的是一棵二叉排序树，所以中序输出必然是升序，这是它的性质 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define N 7

typedef struct { int v, l, r; } TNode;

/* 下标即结点编号，-1 表示空 */
static TNode T[N] = {
    { 8,  1,  2},   /* 0 根 */
    { 3,  3,  4},   /* 1 */
    {10,  5,  6},   /* 2 */
    { 1, -1, -1},   /* 3 叶子 */
    { 6, -1, -1},   /* 4 叶子 */
    { 9, -1, -1},   /* 5 叶子 */
    {14, -1, -1}    /* 6 叶子 */
};

static int out[N];
static int nout = 0;
static int visited[N];   /* 哪些结点已经被访问过（按结点编号，不是按序列下标） */

/* 画全树 + 当前访问序列。mark 是本步刚访问的结点（-1 表示不标） */
static void paint(int mark, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < N; i++) {
        char buf[8];
        snprintf(buf, sizeof buf, "%d", T[i].v);
        tr_tnode(i, buf, T[i].l, T[i].r);
    }
    for (int i = 0; i < N; i++) {
        if (visited[i] && i != mark) tr_mark(i, "done");
    }
    if (mark >= 0) tr_mark(mark, "hit");
    if (nout > 0) tr_arr("访问序列", out, nout);
    tr_note("%s", note);
    tr_commit(line);
}

static void inorder(int root) {
    if (root < 0) return;              /* 空子树，返回 */
    inorder(T[root].l);                /* 1. 递归左边 */
    out[nout++] = T[root].v;           /* 2. 访问根 */
    visited[root] = 1;
    paint(root, __LINE__, "访问结点 %d，序列长度变成 %d", T[root].v, nout);
    inorder(T[root].r);                /* 3. 递归右边 */
}

int main(void) {
    paint(-1, __LINE__, "先看清这棵树：根 8，左子树 3，右子树 10");
    inorder(0);

    tr_begin();
    for (int i = 0; i < N; i++) {
        char buf[8];
        snprintf(buf, sizeof buf, "%d", T[i].v);
        tr_tnode(i, buf, T[i].l, T[i].r);
    }
    tr_arr("访问序列", out, nout);
    tr_note("遍历结束：%d 个结点全部访问，序列是升序 —— 二叉排序树的中序必升序", N);
    TR_END();

    printf("中序序列：");
    for (int i = 0; i < nout; i++) printf("%d ", out[i]);
    printf("\n");
    return 0;
}
`
    },

    /* ══════════════════ 二叉排序树：插入 ══════════════════ */
    'd-bst': {
      title: '二叉排序树的插入过程',
      desc: '小的往左走、大的往右走，一路比较到空位，那里就是新结点的归宿。查找路径和插入路径是同一条。',
      code: String.raw`
/* 二叉排序树（BST）：插入即查找
   从根开始比：比结点小就往左，大就往右，走到空位挂上去 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define POOL 12
static int val[POOL], lc[POOL], rc[POOL];
static int n = 0;

static int newnode(int v) {
    val[n] = v;
    lc[n] = rc[n] = -1;
    return n++;
}

/* 画整棵树。mark 是本步正在比较/刚落位的结点编号 */
static void paint(int mark, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < n; i++) {
        char buf[8];
        snprintf(buf, sizeof buf, "%d", val[i]);
        tr_tnode(i, buf, lc[i], rc[i]);
    }
    if (mark >= 0) tr_mark(mark, "cur");
    tr_var("结点数", "%d", n);
    tr_note("%s", note);
    tr_commit(line);
}

static void insert(int v) {
    if (n == 0) {
        int id = newnode(v);
        paint(id, __LINE__, "空树：%d 直接当根", v);
        return;
    }
    int cur = 0;
    for (;;) {
        if (v < val[cur]) {
            paint(cur, __LINE__, "%d < %d，应该往左走", v, val[cur]);
            if (lc[cur] < 0) {
                int id = newnode(v);
                lc[cur] = id;
                paint(id, __LINE__, "左孩子是空的，%d 就落在这里", v);
                return;
            }
            cur = lc[cur];
        } else {
            paint(cur, __LINE__, "%d > %d，应该往右走", v, val[cur]);
            if (rc[cur] < 0) {
                int id = newnode(v);
                rc[cur] = id;
                paint(id, __LINE__, "右孩子是空的，%d 就落在这里", v);
                return;
            }
            cur = rc[cur];
        }
    }
}

int main(void) {
    int seq[8] = {8, 3, 10, 1, 6, 14, 4, 7};

    for (int i = 0; i < 8; i++) {
        insert(seq[i]);
    }

    paint(-1, __LINE__, "插入完毕：中序遍历就是升序，这就是二叉排序树的价值");
    printf("建树完成，共 %d 个结点\n", n);
    return 0;
}
`
    },

    /* ══════════════════ AVL 旋转 ══════════════════ */
    'd-avl': {
      title: 'AVL：一边高一边矮的时候怎么转回来',
      desc: '平衡因子 = 左子树高 − 右子树高，绝对值超过 1 就得转。LL 型右旋一次，RR 型左旋一次，刚好把高度差抹平。',
      code: String.raw`
/* AVL 树：任意结点左右子树高度差不超过 1
   失衡就靠旋转救回来：LL 型右旋、RR 型左旋。
   这里用数组 + 下标模拟指针，看得见的是旋转前后谁当了根 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define MAXN 16

typedef struct { int key, l, r, h; } Node;

static Node t[MAXN];
static int  n = 0;          /* 用了几个结点 */
static int  root = -1;

static int hgt(int x) { return x < 0 ? 0 : t[x].h; }
static int bf(int x)  { return x < 0 ? 0 : hgt(t[x].l) - hgt(t[x].r); }

static void upd(int x) {
    int a = hgt(t[x].l), b = hgt(t[x].r);
    t[x].h = 1 + (a > b ? a : b);
}

static int new_node(int key) {
    t[n].key = key; t[n].l = t[n].r = -1; t[n].h = 1;
    return n++;
}

/* 右旋：左孩子上位，自己变成它的右孩子 */
static int rot_right(int y) {
    int x = t[y].l;
    t[y].l = t[x].r;
    t[x].r = y;
    upd(y);
    upd(x);
    return x;
}

/* 左旋：右孩子上位，自己变成它的左孩子 */
static int rot_left(int x) {
    int y = t[x].r;
    t[x].r = t[y].l;
    t[y].l = x;
    upd(x);
    upd(y);
    return y;
}

/* 谁是根？没被任何人当孩子的那个。
   递归里 root 这个全局变量还没被外层更新，所以当场算一遍，比存变量靠谱 */
static int find_root(void) {
    int child[MAXN] = {0};
    for (int i = 0; i < n; i++) {
        if (t[i].l >= 0) child[t[i].l] = 1;
        if (t[i].r >= 0) child[t[i].r] = 1;
    }
    for (int i = 0; i < n; i++) if (!child[i]) return i;
    return -1;
}

static void draw(int hi, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < n; i++) {
        char lab[24];
        snprintf(lab, sizeof lab, "%d", t[i].key);
        tr_tnode(i, lab, t[i].l, t[i].r);
    }
    int r = find_root();
    if (r >= 0)    tr_var("树高", "%d", hgt(r));
    if (hi >= 0)   tr_var("失衡点", "%d (平衡因子 %d)", t[hi].key, bf(hi));
    if (hi >= 0) tr_mark(hi, "cur");
    tr_note("%s", note);
    tr_commit(line);
}

/* 插入 + 就地修复，一路返回新的子树根 */
static int insert(int x, int key, int line) {
    if (x < 0) {
        int id = new_node(key);
        draw(-1, line, "插入 %d：挂到空位上", key);
        return id;
    }
    if (key < t[x].key) t[x].l = insert(t[x].l, key, line);
    else                t[x].r = insert(t[x].r, key, line);

    upd(x);

    int b = bf(x);
    if (b > 1) {
        /* 看左孩子的平衡因子：>=0 说明是往左偏的 LL，<0 说明是拐了一道弯的 LR。
           不能用 key 比大小来判断 —— 插入点未必就在失衡的那条路径上 */
        if (bf(t[x].l) >= 0) {
            draw(x, line, "%d 左高右低（平衡因子 %d），左孩子也偏左，LL 型 —— 对 %d 右旋一次",
                 t[x].key, b, t[x].key);
            int nr = rot_right(x);
            draw(-1, line, "右旋完成：%d 上来当根，%d 变成它的右孩子，高度差抹平了", t[nr].key, t[x].key);
            return nr;
        }
        draw(x, line, "%d 左边高，可左孩子自己偏右，这是 LR 型 —— 光转一次救不回来", t[x].key);
        t[x].l = rot_left(t[x].l);
        draw(-1, line, "先对左孩子左旋，形状变成 LL 型了，接着再对 %d 右旋", t[x].key);
        int nr2 = rot_right(x);
        draw(-1, line, "LR 型修完了：%d 当上这棵子树的根", t[nr2].key);
        return nr2;
    }
    if (b < -1) {
        if (bf(t[x].r) <= 0) {
            draw(x, line, "%d 右高左低（平衡因子 %d），右孩子也偏右，RR 型 —— 对 %d 左旋一次",
                 t[x].key, b, t[x].key);
            int nr = rot_left(x);
            draw(-1, line, "左旋完成：%d 上来当根，%d 变成它的左孩子", t[nr].key, t[x].key);
            return nr;
        }
        draw(x, line, "%d 右边高，可右孩子自己偏左，这是 RL 型 —— 得转两次", t[x].key);
        t[x].r = rot_right(t[x].r);
        draw(-1, line, "先对右孩子右旋，形状变成 RR 型了，接着再对 %d 左旋", t[x].key);
        int nr3 = rot_left(x);
        draw(-1, line, "RL 型修完了：%d 当上这棵子树的根", t[nr3].key);
        return nr3;
    }
    return x;
}

int main(void) {
    int keys[7] = {30, 20, 10, 25, 28, 40, 50};

    root = insert(root, keys[0], __LINE__);
    draw(-1, __LINE__, "%d 当根，树高 1，平衡因子 0", keys[0]);

    for (int i = 1; i < 7; i++) {
        root = insert(root, keys[i], __LINE__);
        if (root >= 0) {
            char tmp[128];
            snprintf(tmp, sizeof tmp, "插完 %d 之后，根是 %d，整棵树依然平衡", keys[i], t[root].key);
            draw(-1, __LINE__, "%s", tmp);
        }
    }

    printf("根 = %d，树高 = %d\n", t[root].key, hgt(root));
    return 0;
}
`
    },

    /* ══════════════════ 图的广度优先遍历 ══════════════════ */
    'd-graph-traverse': {
      title: '图的广度优先遍历（BFS）',
      desc: '队列里装"待访问"，visited 数组记"已访问"。先把一圈邻居全排上队，再一个一个出队——这就是"广"的含义。',
      code: String.raw`
/* 图的 BFS：邻接矩阵存图 + 队列驱动
   注意区分两件事：visited 表示"已进过队"，队列表示"还没出队" */
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include "trace.h"

#define V 6

static const char *nm[V] = {"A", "B", "C", "D", "E", "F"};

/* 无向图，对称矩阵 */
static int G[V][V] = {
    {0, 1, 1, 0, 0, 0},
    {1, 0, 0, 1, 0, 0},
    {1, 0, 0, 0, 1, 0},
    {0, 1, 0, 0, 0, 1},
    {0, 0, 1, 0, 0, 1},
    {0, 0, 0, 1, 1, 0}
};

static int vis[V];

static void qstr(int *q, int qh, int qt, char *buf) {
    buf[0] = '\0';
    for (int i = qh; i < qt; i++) {
        strcat(buf, nm[q[i]]);
        if (i + 1 < qt) strcat(buf, " ");
    }
    if (!buf[0]) strcpy(buf, "（空）");
}

static void paint(int cur, int line, const char *fmt, ...) {
    char note[300];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < V; i++) tr_vnode(i, nm[i]);
    for (int i = 0; i < V; i++)
        for (int j = i + 1; j < V; j++)
            if (G[i][j]) tr_vedge(i, j, "");

    for (int i = 0; i < V; i++)
        if (vis[i] && i != cur) tr_mark(i, "done");
    if (cur >= 0) tr_mark(cur, "cur");

    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    int q[V], qh = 0, qt = 0;
    char buf[128];

    paint(-1, __LINE__, "无向图共 6 个顶点。从 A 出发做广度优先遍历");

    vis[0] = 1;
    q[qt++] = 0;
    qstr(q, qh, qt, buf);
    paint(0, __LINE__, "A 标记已访问并入队，队列：%s", buf);

    while (qh < qt) {
        int u = q[qh++];
        qstr(q, qh, qt, buf);
        paint(u, __LINE__, "出队 %s，队列剩：%s。现在扫它的所有邻居", nm[u], buf);

        for (int v = 0; v < V; v++) {
            if (!G[u][v] || vis[v]) continue;
            vis[v] = 1;
            q[qt++] = v;
            qstr(q, qh, qt, buf);
            paint(v, __LINE__, "邻居 %s 没访问过 → 标记已访问并入队，队列：%s", nm[v], buf);
        }
    }

    paint(-1, __LINE__, "队列空了，遍历结束。入队顺序就是访问顺序，一层一层往外扩");
    return 0;
}
`
    },

    /* ══════════════════ 拓扑排序 ══════════════════ */
    'd-topo': {
      title: '拓扑排序：入度归零才轮到你上场',
      desc: '入度就是"还有几门先修课没修完"。每次挑一个入度为 0 的顶点输出，再把它的出边删掉——被删的终点入度减 1，减到 0 就能进队。',
      code: String.raw`
/* 拓扑排序（Kahn 算法）：靠入度表推进
   顶点 0..5 对应一门门课，边的含义是 u 必须在 v 之前完成 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define V 6

/* 邻接矩阵。靠数组模拟，省得写邻接表那堆指针 */
static int g[V][V] = {
    {0, 1, 1, 0, 0, 0},   /* 0 -> 1, 0 -> 2 */
    {0, 0, 0, 1, 0, 0},   /* 1 -> 3 */
    {0, 0, 0, 1, 0, 1},   /* 2 -> 3, 2 -> 5 */
    {0, 0, 0, 0, 1, 0},   /* 3 -> 4 */
    {0, 0, 0, 0, 0, 1},   /* 4 -> 5 */
    {0, 0, 0, 0, 0, 0}
};

static int indeg[V];          /* 每个顶点还剩几条边指着它 */
static int done[V];           /* 已经排进序列了 */
static int used[V][V];        /* 这条边是不是已经被消掉了 —— 图还照画，只是淡下去 */
static int order[V], cnt;     /* 结果序列 */

static void draw(int cur, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < V; i++) {
        char nm[4];
        snprintf(nm, sizeof nm, "%d", i);
        tr_vnode(i, nm);
    }
    for (int i = 0; i < V; i++)
        for (int j = 0; j < V; j++)
            if (g[i][j]) tr_vedge(i, j, used[i][j] ? "used" : "");

    tr_arr("入度", indeg, V);
    for (int i = 0; i < V; i++) if (done[i]) tr_mark(i, "done");
    if (cur >= 0) tr_mark(cur, "cur");
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    for (int i = 0; i < V; i++)
        for (int j = 0; j < V; j++)
            if (g[i][j]) indeg[j]++;

    draw(-1, __LINE__, "先把每条边算进终点的入度：入度是几，它就还得等几门先修课");

    int q[V], head = 0, tail = 0;
    for (int i = 0; i < V; i++)
        if (!indeg[i]) q[tail++] = i;

    draw(-1, __LINE__, "入度为 0 的顶点没有前置，全部先入队 —— 这轮只有 %d", q[0]);

    while (head < tail) {
        int u = q[head++];
        order[cnt++] = u;
        done[u] = 1;
        draw(u, __LINE__, "取出 %d 放进结果序列，它的所有前置都已经完成了", u);

        int added = -1;
        for (int v = 0; v < V; v++) {
            if (!g[u][v] || used[u][v]) continue;
            used[u][v] = 1;
            indeg[v]--;
            if (indeg[v] == 0) {
                q[tail++] = v;
                added = v;
            }
        }

        if (added >= 0)
            draw(-1, __LINE__, "删掉 %d 的出边，%d 的入度降到 0，可以进队了", u, added);
        else
            draw(-1, __LINE__, "删掉 %d 的出边，暂时没有新的顶点入度归零", u);
    }

    draw(-1, __LINE__, "队列空了就排完了。有环的图会在这里发现：排出来的个数少于顶点数");

    printf("拓扑序：");
    for (int i = 0; i < cnt; i++) printf(" %d", order[i]);
    printf("\n");
    return 0;
}
`
    },

    /* ══════════════════ 哈希表 ══════════════════ */
    'd-hash': {
      title: '哈希表：除留余数 + 链地址法',
      desc: 'h(k) = k % 7 直接算出租号，同余的钥匙只能挤一个桶。挤不下就挂一条链，于是冲突处理就变成了链表查找。',
      code: String.raw`
/* 哈希表：h(k) = k % 7
   表长取质数，余数分布更均匀；撞进同一个桶的用链地址法串起来 */
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include "trace.h"

#define P     7
#define MAXB  8

static int tab[P][MAXB];        /* 每个桶一条链，用数组模拟，省得写指针 */
static int cnt[P];              /* 每个桶里挂了几个 */
static int total;               /* 一共有几个元素 */

static char txt[P][64];         /* 桶内容拼成的文字 */
static const char *ptrs[P];

static int h(int k) { return k % P; }

/* 把每个桶的内容拼成一行，比如 "15 -> 22" */
static void fill(void) {
    for (int i = 0; i < P; i++) {
        int off = 0;
        if (cnt[i] == 0) {
            strcpy(txt[i], "空");
        } else {
            for (int j = 0; j < cnt[i]; j++)
                off += snprintf(txt[i] + off, sizeof txt[i] - (size_t)off,
                                j ? " -> %d" : "%d", tab[i][j]);
        }
        ptrs[i] = txt[i];
    }
}

static void snap(int hi, const char *kind, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    fill();
    tr_begin();
    tr_strs("桶（下标 = h(k)）", ptrs, P);
    if (hi >= 0) tr_mark(hi, kind);
    tr_var("元素数", "%d/%d", total, P);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    int ks[7] = {15, 22, 8, 17, 4, 29, 11};

    snap(-1, "cur", __LINE__, "7 个空桶，哈希函数 h(k) = k %% %d：算个余数就直接定位到桶", P);

    for (int t = 0; t < 7; t++) {
        int k = ks[t];
        int b = h(k);
        int step = 0;

        /* 顺着链走，顺便看看有没有重复 */
        while (step < cnt[b] && tab[b][step] != k) step++;

        if (step < cnt[b]) {
            snap(b, "hit", __LINE__, "%d 已经在桶 %d 里了，哈希表不放重复元素", k, b);
            continue;
        }

        tab[b][cnt[b]++] = k;
        total++;

        if (step == 0) {
            snap(b, "new", __LINE__, "插入 %d：%d %% %d = %d，桶是空的，直接放进去", k, k, P, b);
        } else {
            snap(b, "new", __LINE__, "插入 %d：桶 %d 已被占，走了 %d 步到链尾，挂上去", k, b, step);
        }
    }

    int q = 29, b = h(q), step = 0;
    while (step < cnt[b] && tab[b][step] != q) step++;
    snap(b, "cur", __LINE__, "查找 %d：算 h = %d，在桶里走到第 %d 个才找到", q, b, step + 1);

    snap(-1, "done", __LINE__,
         "装填因子 %.2f，桶 1 挤了 %d 个 —— 冲突一多，O(1) 就退化成链表查找",
         total / (double)P, cnt[1]);

    printf("插入 %d 个元素，桶 1 有 %d 个\n", total, cnt[1]);
    return 0;
}
`
    },

    /* ══════════════════ KMP ══════════════════ */
    'd-kmp': {
      title: 'KMP：先算 next，再让 j 自己往回退',
      desc: '朴素匹配失配时 i 要退回起点重来；KMP 算出 next 之后，i 一步都不后退，只让 j 跳回"还可能有戏"的位置。',
      code: String.raw`
/* KMP 两步走：
   1) 对模式串 P 自己求 next —— next[j] = P[0..j-1] 里最长相同前后缀的长度
   2) 拿 next 去匹配，失配时只动 j，不动 i（这就是快的原因）
   亮点标的是 j 的位置，i 的值看上面的小标签 */
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include "trace.h"

#define N  13
#define M  5

static const char *s = "ababcabcacbab";
static const char *p = "abcac";

static int next[M];

/* 求 next 的阶段主串根本没参与，别去标它 */
static int in_build = 1;

/* 拆成一个个字符，前端好一格一格地画 */
static char sa[N][2], pa[M][2];
static const char *sv[N], *pv[M];

static void split(void) {
    for (int i = 0; i < N; i++) { sa[i][0] = s[i]; sa[i][1] = 0; sv[i] = sa[i]; }
    for (int i = 0; i < M; i++) { pa[i][0] = p[i]; pa[i][1] = 0; pv[i] = pa[i]; }
}

static void snap(int i, int j, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_strs_at("主串 S（亮的是 i）", sv, N, in_build ? -1 : i);
    tr_strs_at("模式串 P（亮的是 j）", pv, M, j);
    tr_arr("next", next, M);
    if (j >= 0 && j < M) tr_mark(j, "cmp");
    tr_var("i", "%d", i);
    tr_var("j", "%d", j);
    tr_note("%s", note);
    tr_commit(line);
}

/* next[0] 填 -1，这是个「从头重来」的哨兵，不是长度 */
static void build_next(void) {
    for (int k = 0; k < M; k++) next[k] = 0;
    next[0] = -1;

    int i = 0, j = -1;
    snap(i, -1, __LINE__, "next[0] 写死 -1：它代表「连第一个字符都对不上，i 也得往前走」");

    while (i < M - 1) {
        if (j == -1 || p[i] == p[j]) {
            next[++i] = ++j;
            snap(i, j, __LINE__, "P[%d] 和 P[%d] 相同，所以 next[%d] = %d", i - 1, j - 1, i, j);
        } else {
            int old = j;
            j = next[j];
            snap(i, j, __LINE__, "P[%d] 和 P[%d] 不同，j 从 %d 退回 next[%d] = %d，i 原地不动",
                 i, old, old, old, j);
        }
    }

    snap(i, j, __LINE__, "next 算完了。注意它只跟模式串自己有关，主串换了也不用重算");
    in_build = 0;
}

static int match(void) {
    int i = 0, j = 0;

    snap(i, j, __LINE__, "从两个 0 开始，逐位比对");

    while (i < N && j < M) {
        if (s[i] == p[j]) {
            i++;
            j++;
            if (j < M && i < N)
                snap(i, j, __LINE__, "S[%d] = P[%d] 对上，两人一起往前走", i - 1, j - 1);
            else
                snap(i, j, __LINE__, "S[%d] = P[%d] 对上，j 走到头了 —— 匹配成功", i - 1, j - 1);
        } else {
            int old = j;
            j = next[j];
            snap(i, j, __LINE__, "S[%d] 和 P[%d] 失配：i 留在 %d 不退，j 跳回 next[%d] = %d",
                 i, old, i, old, j);
        }
    }

    return j == M ? i - M : -1;
}

int main(void) {
    split();
    build_next();
    int at = match();

    snap(N, M, __LINE__, "在 S 的下标 %d 处匹配成功 —— 全程 i 一次都没回退", at);

    printf("位置 = %d\n", at);
    return 0;
}
`
    },

    /* ══════════════════ Dijkstra ══════════════════ */
    'd-shortest': {
      title: 'Dijkstra：每次挑最近的，然后把邻居的距离放松一遍',
      desc: '已经确定最短路的顶点打个勾，再从没确定的里挑 dist 最小的，用它去更新邻居。贪心的正确性就建立在"边权非负"上。',
      code: String.raw`
/* Dijkstra 单源最短路（邻接矩阵，顶点 0..5）
   每轮：在未确定的顶点里挑 dist 最小的 → 确定它 → 拿它松弛所有邻居 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define V    6
#define INF  999

/* 邻接矩阵，INF 表示没边 */
static int w[V][V] = {
    { 0,  7,  9, INF, INF, 14},
    { 7,  0, 10, 15, INF, INF},
    { 9, 10,  0, 11, INF,  2},
    {INF,15, 11,  0,  6, INF},
    {INF,INF,INF,  6,  0,  9},
    {14,INF,  2, INF,  9,  0}
};

static int dist[V];
static int done[V];

static void show(int cur, int relax, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    for (int i = 0; i < V; i++) {
        char name[4];
        snprintf(name, sizeof name, "%d", i);
        tr_vnode(i, name);
    }
    for (int i = 0; i < V; i++) {
        for (int j = i + 1; j < V; j++) {
            if (w[i][j] < INF) {
                char lbl[8];
                snprintf(lbl, sizeof lbl, "%d", w[i][j]);
                tr_vedge(i, j, lbl);
            }
        }
    }
    tr_arr("dist", dist, V);
    for (int i = 0; i < V; i++) if (done[i]) tr_mark(i, "done");
    if (cur >= 0)    tr_mark(cur, "cur");
    if (relax >= 0)  tr_mark(relax, "cmp");
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    for (int i = 0; i < V; i++) { dist[i] = INF; done[i] = 0; }
    dist[0] = 0;

    show(-1, -1, __LINE__, "起点 0 到自己是 0，其余先当无穷远（这里用 999 代理）");

    for (int round = 0; round < V; round++) {
        int u = -1;
        for (int i = 0; i < V; i++)
            if (!done[i] && (u < 0 || dist[i] < dist[u])) u = i;

        if (u < 0 || dist[u] >= INF) break;

        done[u] = 1;
        show(u, -1, __LINE__, "未确定的顶点里 dist 最小的是 %d（dist = %d），它的最短路就此定死", u, dist[u]);

        for (int v = 0; v < V; v++) {
            if (done[v] || w[u][v] >= INF) continue;
            int nd = dist[u] + w[u][v];
            if (nd < dist[v]) {
                int old = dist[v];
                dist[v] = nd;
                show(-1, v, __LINE__, "经 %d 到 %d 只要 %d，比原来的 %d 更短，更新", u, v, nd, old);
            }
        }
    }

    show(-1, -1, __LINE__, "全部确定完毕。dist 里就是 0 到各点的最短路长度");

    printf("dist:");
    for (int i = 0; i < V; i++) printf(" %d", dist[i]);
    printf("\n");
    return 0;
}
`
    },

    /* ══════════════════ 冒泡排序 ══════════════════ */
    'd-sort-basic': {
      title: '冒泡排序：每一轮冒一个最大的',
      desc: '相邻两个比较，大的往后换。一轮下来最大的必定沉到末尾，所以下一轮末尾就不用再看。',
      code: String.raw`
/* 冒泡排序：相邻比较、逆序交换
   每轮结束，末尾的那部分已经有序，标记成 done 就不用再碰 */
#include <stdio.h>
#include "trace.h"

#define N 8

static int a[N] = {5, 2, 9, 1, 6, 3, 8, 4};
static int cmps = 0, swaps = 0;

/* 画一帧：hi/hj 是本次比较的两个下标，-1 表示不标 */
static void show(int hi, int hj, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_arr("a", a, N);
    if (hi >= 0) tr_mark(hi, "cmp");
    if (hj >= 0) tr_mark(hj, "cmp");
    tr_var("比较次数", "%d", cmps);
    tr_var("交换次数", "%d", swaps);
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    show(-1, -1, __LINE__, "初始状态，n = %d", N);

    for (int i = 0; i < N - 1; i++) {
        int swapped = 0;

        for (int j = 0; j < N - 1 - i; j++) {
            int x = a[j], y = a[j + 1];
            cmps++;
            if (x > y) {
                a[j] = y;
                a[j + 1] = x;
                swaps++;
                swapped = 1;
                show(j, j + 1, __LINE__, "a[%d]=%d > a[%d]=%d，交换这两个", j, x, j + 1, y);
            } else {
                show(j, j + 1, __LINE__, "a[%d]=%d <= a[%d]=%d，不用动", j, x, j + 1, y);
            }
        }

        tr_begin();
        tr_arr("a", a, N);
        for (int k = N - 1 - i; k < N; k++) tr_mark(k, "done");
        tr_var("比较次数", "%d", cmps);
        tr_var("交换次数", "%d", swaps);
        tr_note("第 %d 轮结束：最大的 %d 落到 a[%d]，末尾 %d 个已就位",
                i + 1, a[N - 1 - i], N - 1 - i, i + 1);
        TR_END();

        if (!swapped) {
            show(-1, -1, __LINE__, "这一轮一次都没换，说明已经有序，提前收工");
            break;
        }
    }

    printf("排序完成：比较 %d 次，交换 %d 次\n", cmps, swaps);
    return 0;
}
`
    },

    /* ══════════════════ 插入排序 ══════════════════ */
    'd-sort-insert': {
      title: '插入排序：像摸牌一样，一张张往左插',
      desc: '前面那一段永远是有序的，来一张新牌就从右往左找位置，比它大的统统往后挪一格。',
      code: String.raw`
/* 插入排序：a[0..i-1] 始终有序，把 a[i] 往这段里塞
   像打扑克摸牌：手里一直排得好好的，新来的那张往合适位置一插 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define N 8

static int a[N] = {5, 2, 9, 1, 6, 3, 8, 4};

static int cur = -1;       /* 正在处理的位置 */
static int sorted = 0;     /* 已排序区的右边界 */

static void show(int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_arr("a", a, N);
    for (int k = 0; k <= sorted; k++) tr_mark(k, "done");
    if (cur >= 0) tr_mark(cur, "swap");
    tr_note("%s", note);
    tr_commit(line);
}

int main(void) {
    show(__LINE__, "只有 1 个元素的时候天然有序，所以从第 2 个开始往左插");

    for (int i = 1; i < N; i++) {
        int key = a[i];
        int j = i - 1;

        cur = i;
        sorted = i - 1;
        show(__LINE__, "摸到新牌 a[%d]=%d，前 %d 个已经排好", i, key, i);

        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            cur = j + 1;
            show(__LINE__, "a[%d]=%d 比 %d 大，往后挪一格", j, a[j], key);
            j--;
        }

        a[j + 1] = key;
        cur = j + 1;
        sorted = i;
        show(__LINE__, "%d 插到 a[%d]，前 %d 个又恢复有序", key, j + 1, i + 1);
    }

    cur = -1;
    sorted = N - 1;
    show(__LINE__, "全部有序。数据本来就有序时内层循环一次都不跑，直接退化成 O(n)");

    printf("排序结果：");
    for (int k = 0; k < N; k++) printf("%d ", a[k]);
    printf("\n");
    return 0;
}
`
    },

    /* ══════════════════ 快速排序 ══════════════════ */
    'd-sort-swap': {
      title: '快速排序：分区（Partition）',
      desc: '拿末尾元素当基准，把比它小的统统甩到左边，最后基准落位——它左边全小、右边全大，位置就此定死。',
      code: String.raw`
/* 快速排序：Lomuto 分区法
   基准取区间最后一个元素，i 是"小于基准区域"的右边界 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define N 9

static int a[N] = {7, 2, 9, 4, 3, 8, 1, 6, 5};

/* 高亮信息放全局，show 里统一消费 —— 免得参数列表长得没人看 */
static int  hi[4];
static const char *hk[4];
static int  hn = 0;
static int  gL = -1, gR = -1;

static void hreset(void) { hn = 0; }
static void hmark(int idx, const char *k) {
    if (hn < 4 && idx >= 0 && idx < N) { hi[hn] = idx; hk[hn] = k; hn++; }
}

static void show(int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_arr("a", a, N);
    for (int k = 0; k < hn; k++) tr_mark(hi[k], hk[k]);
    tr_var("区间", "[%d..%d]", gL, gR);
    tr_note("%s", note);
    tr_commit(line);
}

static void qs(int L, int R) {
    if (L >= R) return;

    gL = L; gR = R;
    int p = a[R];                 /* 基准值 */
    int i = L - 1;                /* 小于基准区域的右边界 */

    hreset();
    hmark(R, "hit");
    gL = L; gR = R;
    show(__LINE__, "处理区间 [%d..%d]，拿 a[%d]=%d 当基准", L, R, R, p);

    for (int j = L; j < R; j++) {
        hreset();
        hmark(R, "hit");
        hmark(j, "cmp");
        gL = L; gR = R;
        show(__LINE__, "a[%d]=%d %s 基准 %d", j, a[j], a[j] < p ? "<" : ">=", p);

        if (a[j] < p) {
            i++;
            if (i != j) {
                int t = a[i]; a[i] = a[j]; a[j] = t;
                hreset();
                hmark(R, "hit");
                hmark(i, "swap");
                hmark(j, "swap");
                gL = L; gR = R;
                show(__LINE__, "比基准小，换到左边界 a[%d] 处", i);
            }
        }
    }

    int t = a[i + 1]; a[i + 1] = a[R]; a[R] = t;
    hreset();
    hmark(i + 1, "done");
    gL = L; gR = R;
    show(__LINE__, "基准 %d 落到 a[%d]：左边都小于它，右边都不小于它", p, i + 1);

    qs(L, i);
    qs(i + 2, R);
}

int main(void) {
    gL = 0; gR = N - 1;
    hreset();
    show(__LINE__, "初始数组，准备对整个区间分区");

    qs(0, N - 1);

    gL = 0; gR = N - 1;
    hreset();
    for (int k = 0; k < N; k++) hmark(k, "done");
    show(__LINE__, "全部完成。快排平均 O(n log n)，最坏退化成 O(n²)");

    printf("排序结果：");
    for (int k = 0; k < N; k++) printf("%d ", a[k]);
    printf("\n");
    return 0;
}
`
    },

    /* ══════════════════ 归并排序 ══════════════════ */
    'd-sort-merge': {
      title: '归并排序：先分到不能再分，再两两合并',
      desc: '递归把区间一刀刀劈成单元素，再往回合。合并时两个有序段各拿一个指针比大小，谁小谁先写回。',
      code: String.raw`
/* 归并排序：自顶向下
   分割没有数据搬动，真正的活都在 merge 里 */
#include <stdio.h>
#include <stdarg.h>
#include "trace.h"

#define N 8

static int a[N] = {6, 3, 8, 1, 9, 2, 7, 4};
static int tmp[N];

static void show(int L, int M, int R, int line, const char *fmt, ...) {
    char note[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(note, sizeof note, fmt, ap);
    va_end(ap);

    tr_begin();
    tr_arr("a", a, N);
    for (int k = L; k <= R && k < N; k++) tr_mark(k, "cur");
    if (M >= L && M <= R) tr_mark(M, "hit");
    tr_var("区间", "[%d..%d]", L, R);
    tr_note("%s", note);
    tr_commit(line);
}

static void merge(int L, int M, int R) {
    int i = L, j = M + 1, k = L;

    show(L, M, R, __LINE__, "合并 [%d..%d] 和 [%d..%d] 两段", L, M, M + 1, R);

    while (i <= M && j <= R) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
            show(L, M, R, __LINE__, "左边 %d 更小（或相等），先取左边", tmp[k - 1]);
        } else {
            tmp[k++] = a[j++];
            show(L, M, R, __LINE__, "右边 %d 更小，先取右边", tmp[k - 1]);
        }
    }
    while (i <= M) tmp[k++] = a[i++];
    while (j <= R) tmp[k++] = a[j++];

    for (k = L; k <= R; k++) a[k] = tmp[k];

    show(L, M, R, __LINE__, "两段合并完毕，[%d..%d] 已经有序", L, R);
}

static void msort(int L, int R) {
    if (L >= R) return;
    int M = (L + R) / 2;
    show(L, M, R, __LINE__, "把 [%d..%d] 劈成 [%d..%d] 和 [%d..%d]",
         L, R, L, M, M + 1, R);
    msort(L, M);
    msort(M + 1, R);
    merge(L, M, R);
}

int main(void) {
    show(0, -1, N - 1, __LINE__, "初始 8 个元素，先一路劈开再往回合");

    msort(0, N - 1);

    tr_begin();
    tr_arr("a", a, N);
    for (int k = 0; k < N; k++) tr_mark(k, "done");
    tr_note("排序完成。归并是稳定排序，时间复杂度稳定 O(n log n)");
    TR_END();

    printf("排序结果：");
    for (int k = 0; k < N; k++) printf("%d ", a[k]);
    printf("\n");
    return 0;
}
`
    }

  };
})();
