/* ============================================================
   练习题：每道题含题干、骨架、参考答案、标准输出、输入
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.exercises.push(

  /* ---------------- 第 1 章 ---------------- */
  {
    id: 'ex-hello',
    ch: 'c1',
    title: '输出与格式化',
    level: '入门',
    desc: `
      <h2>题目</h2>
      <p>用一次 <code>printf</code> 输出下面三行（注意冒号后面有一个空格，数字要计算出来，不能直接写死）：</p>
      <pre><code>C-Learn
sum = 30
avg = 15.00</code></pre>
      <h2>要求</h2>
      <ul>
        <li>定义 <code>int a = 10, b = 20;</code>，用它们算出 a+b 和平均值。</li>
        <li>平均值保留两位小数。</li>
        <li>只能输出这三行，不要多打印任何东西。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

int main(void) {
    int a = 10, b = 20;

    // TODO: 输出三行内容
    // 第一行：C-Learn
    // 第二行：sum = 30
    // 第三行：avg = 15.00

    return 0;
}`,
    solution: `#include <stdio.h>

int main(void) {
    int a = 10, b = 20;
    printf("C-Learn\\n");
    printf("sum = %d\\n", a + b);
    printf("avg = %.2f\\n", (a + b) / 2.0);
    return 0;
}`,
    expected: `C-Learn
sum = 30
avg = 15.00`,
    hints: [
      '`printf("%.2f")` 表示保留两位小数。',
      '`(a+b)/2` 是整数除法，结果是 15；要写 `(a+b)/2.0` 才是 15.0。'
    ]
  },

  {
    id: 'ex-io-sum',
    ch: 'c1',
    title: '读入两个整数并四则运算',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>从标准输入读两个整数 <code>a b</code>（空格分隔），输出四行：</p>
      <pre><code>a+b = 22
a-b = 12
a*b = 85
a/b = 3</code></pre>
      <h2>要求</h2>
      <ul>
        <li>输入是 <code>17 5</code>。</li>
        <li>除法用整数除法（截断）。</li>
        <li>格式必须严格一致（等号两边各一个空格）。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

int main(void) {
    int a, b;

    // TODO: 读入 a 和 b

    // TODO: 输出四行结果

    return 0;
}`,
    solution: `#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) != 2) return 1;

    printf("a+b = %d\\n", a + b);
    printf("a-b = %d\\n", a - b);
    printf("a*b = %d\\n", a * b);
    printf("a/b = %d\\n", a / b);
    return 0;
}`,
    stdin: `17 5`,
    expected: `a+b = 22
a-b = 12
a*b = 85
a/b = 3`,
    /* 判题会跑这三组；第一组就是题目里的示例，后两组是边界与普遍情况 */
    cases: [
      { note: '题目示例 17 5', stdin: '17 5', expected: 'a+b = 22\na-b = 12\na*b = 85\na/b = 3' },
      { note: '有余数的除法 100 7', stdin: '100 7', expected: 'a+b = 107\na-b = 93\na*b = 700\na/b = 14' },
      { note: '两个数相等 8 8', stdin: '8 8', expected: 'a+b = 16\na-b = 0\na*b = 64\na/b = 1' }
    ],
    hints: [
      '`scanf("%d %d", &a, &b)` 里必须写 `&`。',
      'scanf 的返回值是成功读入的个数，判断一下是好习惯。'
    ]
  },

  {
    id: 'ex-loop-sum',
    ch: 'c1',
    title: '偶数求和与 FizzBuzz',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>输入一个正整数 n（本题 n=10），输出两行：</p>
      <ol>
        <li><code>even sum = 30</code>（1..n 中所有偶数的和）</li>
        <li><code>fizzbuzz: 1 x x 4 x x 7 x x 10</code>（1..n 的 FizzBuzz：3 的倍数输出 f，5 的倍数输出 b，15 的倍数输出 fb，其余输出数字，用空格分隔）</li>
      </ol>
      <p>等等，题目里写的是 <code>x</code>，那就简化一下：<strong>3 的倍数输出 x，其余输出数字</strong>，用空格分隔。</p>
      <h2>要求</h2>
      <ul>
        <li>用循环，不许手写每个数字。</li>
        <li>行末不要多余空格，也不要多余换行。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

int main(void) {
    int n = 10;

    // TODO: 算 1..n 的偶数和

    // TODO: 输出 1..n，3 的倍数输出 x，用空格分隔（行末不能有空格）

    return 0;
}`,
    solution: `#include <stdio.h>

int main(void) {
    int n = 10;

    int sum = 0;
    for (int i = 1; i <= n; i++)
        if (i % 2 == 0) sum += i;
    printf("even sum = %d\\n", sum);

    printf("fizzbuzz:");
    for (int i = 1; i <= n; i++) {
        if (i % 3 == 0) printf(" x");
        else printf(" %d", i);
    }
    printf("\\n");
    return 0;
}`,
    expected: `even sum = 30
fizzbuzz: 1 2 x 4 5 x 7 8 x 10`,
    hints: [
      '偶数和就是 2+4+...+10 = 30。',
      '`if (i % 3 == 0)` 判断 3 的倍数。'
    ]
  },

  {
    id: 'ex-array-reverse',
    ch: 'c1',
    title: '数组原地逆置',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>把数组 <code>{3, 1, 4, 1, 5, 9, 2, 6}</code> <strong>原地</strong>逆置（不许开新数组），然后输出两行：</p>
      <pre><code>original: 3 1 4 1 5 9 2 6
reversed: 6 2 9 5 1 4 1 3</code></pre>
      <h2>要求</h2>
      <ul>
        <li>必须原地交换，双指针从两头往中间靠。</li>
        <li>两行都以冒号+空格开头，数字间一个空格，行末无空格。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

void print_arr(const int *a, int n) {
    for (int i = 0; i < n; i++) printf("%d%s", a[i], i == n - 1 ? "" : " ");
    printf("\\n");
}

int main(void) {
    int a[] = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = sizeof(a) / sizeof(a[0]);

    printf("original: ");
    print_arr(a, n);

    // TODO: 原地逆置

    printf("reversed: ");
    print_arr(a, n);
    return 0;
}`,
    solution: `#include <stdio.h>

void print_arr(const int *a, int n) {
    for (int i = 0; i < n; i++) printf("%d%s", a[i], i == n - 1 ? "" : " ");
    printf("\\n");
}

int main(void) {
    int a[] = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = sizeof(a) / sizeof(a[0]);

    printf("original: ");
    print_arr(a, n);

    for (int i = 0, j = n - 1; i < j; i++, j--) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    printf("reversed: ");
    print_arr(a, n);
    return 0;
}`,
    expected: `original: 3 1 4 1 5 9 2 6
reversed: 6 2 9 5 1 4 1 3`,
    hints: [
      '双指针：i 从头、j 从尾，交换后 i++、j--，直到 i >= j。',
      '循环条件是 `i < j`，写 `i <= j` 中间那个元素会自己和自己换，虽然结果对但白做。'
    ]
  },

  {
    id: 'ex-pointer-swap',
    ch: 'c1',
    title: '用指针交换两个变量',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>写一个函数 <code>void swap(int *a, int *b)</code>，交换两个变量的值。主函数里 <code>x = 3, y = 8</code>，调用后输出：</p>
      <pre><code>before: x = 3, y = 8
after : x = 8, y = 3</code></pre>
      <h2>要求</h2>
      <ul>
        <li>swap 必须用指针，不能返回值。</li>
        <li>主函数里的 x、y 必须真的被改掉（这就是"地址传递"）。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

void swap(int *a, int *b) {
    // TODO: 交换 *a 和 *b
}

int main(void) {
    int x = 3, y = 8;
    printf("before: x = %d, y = %d\\n", x, y);

    swap(&x, &y);

    printf("after : x = %d, y = %d\\n", x, y);
    return 0;
}`,
    solution: `#include <stdio.h>

void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int main(void) {
    int x = 3, y = 8;
    printf("before: x = %d, y = %d\\n", x, y);

    swap(&x, &y);

    printf("after : x = %d, y = %d\\n", x, y);
    return 0;
}`,
    expected: `before: x = 3, y = 8
after : x = 8, y = 3`,
    hints: [
      '函数里用 `*a`、`*b` 操作的是外面那块内存。',
      '`int t = *a; *a = *b; *b = t;` 三行搞定。'
    ]
  },

  {
    id: 'ex-string-len',
    ch: 'c1',
    title: '手写 strlen 与字符串反转',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>不许用 <code>strlen</code> 和 <code>strrev</code>，手写两个函数：</p>
      <ol>
        <li><code>int my_strlen(const char *s)</code>：返回长度</li>
        <li><code>void reverse_str(char *s)</code>：原地反转字符串</li>
      </ol>
      <p>对 <code>"hello world"</code> 输出：</p>
      <pre><code>len = 11
reversed = dlrow olleh</code></pre>
    `,
    starter: `#include <stdio.h>

int my_strlen(const char *s) {
    // TODO
    return 0;
}

void reverse_str(char *s) {
    // TODO: 原地反转
}

int main(void) {
    char s[] = "hello world";
    printf("len = %d\\n", my_strlen(s));
    reverse_str(s);
    printf("reversed = %s\\n", s);
    return 0;
}`,
    solution: `#include <stdio.h>

int my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return (int)(p - s);
}

void reverse_str(char *s) {
    int n = my_strlen(s);
    for (int i = 0, j = n - 1; i < j; i++, j--) {
        char t = s[i];
        s[i] = s[j];
        s[j] = t;
    }
}

int main(void) {
    char s[] = "hello world";
    printf("len = %d\\n", my_strlen(s));
    reverse_str(s);
    printf("reversed = %s\\n", s);
    return 0;
}`,
    expected: `len = 11
reversed = dlrow olleh`,
    hints: [
      'strlen 本质就是"走到 \\0 为止，数走了几步"，指针相减得到个数。',
      '反转用双指针，和数组逆置一模一样。注意 `char s[] = "..."` 才可写，`char *s = "..."` 是只读的。'
    ]
  },

  {
    id: 'ex-struct-avg',
    ch: 'c1',
    title: '结构体数组求平均分',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>定义学生结构体（学号、姓名、成绩），初始化 4 个学生，计算平均分并输出每个学生和平均分：</p>
      <pre><code>1001 Tom   92.0
1002 Jerry 78.5
1003 Lucy  88.0
1004 Kate  95.5
avg = 88.50</code></pre>
      <h2>要求</h2>
      <ul>
        <li>姓名左对齐占 6 位（用 <code>%-6s</code>），成绩保留一位小数。</li>
        <li>平均分保留两位小数。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

typedef struct {
    int id;
    char name[16];
    double score;
} Student;

int main(void) {
    Student cls[4] = {
        {1001, "Tom", 92.0},
        {1002, "Jerry", 78.5},
        {1003, "Lucy", 88.0},
        {1004, "Kate", 95.5}
    };

    // TODO: 遍历输出，并计算平均分

    return 0;
}`,
    solution: `#include <stdio.h>

typedef struct {
    int id;
    char name[16];
    double score;
} Student;

int main(void) {
    Student cls[4] = {
        {1001, "Tom", 92.0},
        {1002, "Jerry", 78.5},
        {1003, "Lucy", 88.0},
        {1004, "Kate", 95.5}
    };

    double sum = 0;
    for (int i = 0; i < 4; i++) {
        printf("%d %-6s %.1f\\n", cls[i].id, cls[i].name, cls[i].score);
        sum += cls[i].score;
    }
    printf("avg = %.2f\\n", sum / 4);
    return 0;
}`,
    expected: `1001 Tom    92.0
1002 Jerry  78.5
1003 Lucy   88.0
1004 Kate   95.5
avg = 88.50`,
    hints: [
      '`%-6s` 表示字符串左对齐、占 6 个字符宽度。',
      'Tom 只有 3 个字符，所以后面补 3 个空格。'
    ]
  },

  {
    id: 'ex-malloc-array',
    ch: 'c1',
    title: '动态数组：malloc 与 realloc',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>用 <code>malloc</code> 申请一个能放 5 个 int 的数组，填入 1..5；再用 <code>realloc</code> 扩容到 8 个，把 6..8 补上。输出：</p>
      <pre><code>first : 1 2 3 4 5
expand: 1 2 3 4 5 6 7 8
freed</code></pre>
      <h2>要求</h2>
      <ul>
        <li>两次申请都要判 NULL。</li>
        <li>realloc 用临时指针接返回值（不能直接 <code>p = realloc(p, ...)</code>）。</li>
        <li>最后必须 free 并置 NULL，然后输出 <code>freed</code>。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

void print(const int *a, int n) {
    for (int i = 0; i < n; i++) printf("%d%s", a[i], i == n - 1 ? "" : " ");
    printf("\\n");
}

int main(void) {
    int n = 5;
    int *a = malloc(sizeof(int) * n);
    // TODO: 判 NULL、填值、输出 "first : ..."
    // TODO: realloc 到 8 个、补值、输出 "expand: ..."
    // TODO: free、置 NULL、输出 "freed"
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>

void print(const int *a, int n) {
    for (int i = 0; i < n; i++) printf("%d%s", a[i], i == n - 1 ? "" : " ");
    printf("\\n");
}

int main(void) {
    int n = 5;
    int *a = (int *)malloc(sizeof(int) * n);
    if (a == NULL) return 1;
    for (int i = 0; i < n; i++) a[i] = i + 1;

    printf("first : ");
    print(a, n);

    int newN = 8;
    int *tmp = (int *)realloc(a, sizeof(int) * newN);
    if (tmp == NULL) {
        free(a);
        return 1;
    }
    a = tmp;
    for (int i = n; i < newN; i++) a[i] = i + 1;

    printf("expand: ");
    print(a, newN);

    free(a);
    a = NULL;
    printf("freed\\n");
    return 0;
}`,
    expected: `first : 1 2 3 4 5
expand: 1 2 3 4 5 6 7 8
freed`,
    hints: [
      '`sizeof(int) * n` 是字节数，别忘了乘。',
      'realloc 可能搬到新地址，所以要用 tmp 接，成功后再赋给 a。'
    ]
  },

  /* ---------------- 第 2 章 ---------------- */
  {
    id: 'ex-seqlist',
    ch: 'c2',
    title: '顺序表：插入、删除、查找',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>实现顺序表的基本操作，按下面的剧本执行并输出：</p>
      <ol>
        <li>初始为空表，依次插入 10 20 30 40 50（都插在表尾）。</li>
        <li>在第 3 个位置插入 99，输出 <code>after insert: 10 20 99 30 40 50</code></li>
        <li>删除第 1 个元素，输出 <code>deleted: 10</code> 和 <code>after delete: 20 99 30 40 50</code></li>
        <li>查找 99 的位置，输出 <code>locate 99: 2</code>（位序从 1 开始）</li>
      </ol>
      <h2>要求</h2>
      <ul>
        <li>插入要从后往前搬元素，删除要从前往后搬。</li>
        <li>位序从 1 开始，下标从 0 开始，注意转换。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

#define MAXSIZE 20
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int length;
} SqList;

void print(const SqList *L, const char *tag) {
    printf("%s", tag);
    for (int i = 0; i < L->length; i++) printf("%d%s", L->data[i], i == L->length - 1 ? "" : " ");
    printf("\\n");
}

int ListInsert(SqList *L, int i, int e) {
    // TODO
    return ERROR;
}

int ListDelete(SqList *L, int i, int *e) {
    // TODO
    return ERROR;
}

int LocateElem(const SqList *L, int e) {
    // TODO
    return 0;
}

int main(void) {
    SqList L;
    L.length = 0;

    for (int i = 1; i <= 5; i++) ListInsert(&L, i, i * 10);
    print(&L, "init: ");

    ListInsert(&L, 3, 99);
    print(&L, "after insert: ");

    int e;
    ListDelete(&L, 1, &e);
    printf("deleted: %d\\n", e);
    print(&L, "after delete: ");

    printf("locate 99: %d\\n", LocateElem(&L, 99));
    return 0;
}`,
    solution: `#include <stdio.h>

#define MAXSIZE 20
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int length;
} SqList;

void print(const SqList *L, const char *tag) {
    printf("%s", tag);
    for (int i = 0; i < L->length; i++) printf("%d%s", L->data[i], i == L->length - 1 ? "" : " ");
    printf("\\n");
}

int ListInsert(SqList *L, int i, int e) {
    if (i < 1 || i > L->length + 1) return ERROR;
    if (L->length >= MAXSIZE) return ERROR;
    for (int j = L->length; j >= i; j--)
        L->data[j] = L->data[j - 1];
    L->data[i - 1] = e;
    L->length++;
    return OK;
}

int ListDelete(SqList *L, int i, int *e) {
    if (i < 1 || i > L->length) return ERROR;
    *e = L->data[i - 1];
    for (int j = i; j < L->length; j++)
        L->data[j - 1] = L->data[j];
    L->length--;
    return OK;
}

int LocateElem(const SqList *L, int e) {
    for (int i = 0; i < L->length; i++)
        if (L->data[i] == e) return i + 1;
    return 0;
}

int main(void) {
    SqList L;
    L.length = 0;

    for (int i = 1; i <= 5; i++) ListInsert(&L, i, i * 10);
    print(&L, "init: ");

    ListInsert(&L, 3, 99);
    print(&L, "after insert: ");

    int e;
    ListDelete(&L, 1, &e);
    printf("deleted: %d\\n", e);
    print(&L, "after delete: ");

    printf("locate 99: %d\\n", LocateElem(&L, 99));
    return 0;
}`,
    expected: `init: 10 20 30 40 50
after insert: 10 20 99 30 40 50
deleted: 10
after delete: 20 99 30 40 50
locate 99: 2`,
    hints: [
      '插入时循环 `for (j = length; j >= i; j--) data[j] = data[j-1];`',
      '删除后别忘 `length--`。'
    ]
  },

  {
    id: 'ex-linklist-create',
    ch: 'c2',
    title: '单链表：头插法建表',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>用<strong>头插法</strong>把 <code>1 2 3 4 5</code> 依次插入带头结点的单链表（每次插在头结点之后），然后遍历输出：</p>
      <pre><code>list: 5 4 3 2 1
length: 5</code></pre>
      <h2>要求</h2>
      <ul>
        <li>头插法的结果必然与输入顺序相反。</li>
        <li>遍历要从 <code>head-&gt;next</code> 开始。</li>
        <li>最后释放所有结点。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

LNode *createHead(int *arr, int n) {
    LNode *head = malloc(sizeof(LNode));
    head->next = NULL;
    // TODO: 头插法
    return head;
}

int main(void) {
    int arr[] = {1, 2, 3, 4, 5};
    LNode *head = createHead(arr, 5);

    printf("list:");
    // TODO: 遍历输出
    printf("\\n");

    printf("length: %d\\n", 5);
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

LNode *createHead(int *arr, int n) {
    LNode *head = (LNode *)malloc(sizeof(LNode));
    head->next = NULL;
    for (int i = 0; i < n; i++) {
        LNode *s = (LNode *)malloc(sizeof(LNode));
        s->data = arr[i];
        s->next = head->next;
        head->next = s;
    }
    return head;
}

int main(void) {
    int arr[] = {1, 2, 3, 4, 5};
    LNode *head = createHead(arr, 5);

    printf("list:");
    int len = 0;
    for (LNode *p = head->next; p != NULL; p = p->next) {
        printf(" %d", p->data);
        len++;
    }
    printf("\\n");

    printf("length: %d\\n", len);

    LNode *p = head;
    while (p) { LNode *n = p->next; free(p); p = n; }
    return 0;
}`,
    expected: `list: 5 4 3 2 1
length: 5`,
    hints: [
      '头插法的两句：`s->next = head->next; head->next = s;` 顺序不能反。',
      '遍历用 `for (p = head->next; p; p = p->next)`。'
    ]
  },

  {
    id: 'ex-linklist-del',
    ch: 'c2',
    title: '单链表：删除所有指定值',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>尾插法建立单链表 <code>1 2 5 3 5 4 5</code>，删除所有值为 5 的结点，输出：</p>
      <pre><code>before: 1 2 5 3 5 4 5
deleted 3 nodes
after : 1 2 3 4</code></pre>
      <h2>要求</h2>
      <ul>
        <li>只遍历一遍（O(n)），不要反复从头找。</li>
        <li>删除的结点要 free。</li>
        <li>输出删除的个数。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

int deleteAllX(LNode *head, int x) {
    int cnt = 0;
    // TODO: 删除所有值为 x 的结点，返回删除个数
    return cnt;
}

void print(LNode *head, const char *tag) {
    printf("%s", tag);
    for (LNode *p = head->next; p; p = p->next)
        printf("%s%d", p == head->next ? "" : " ", p->data);
    printf("\\n");
}

int main(void) {
    LNode *head = malloc(sizeof(LNode));
    head->next = NULL;
    LNode *tail = head;
    int arr[] = {1, 2, 5, 3, 5, 4, 5};
    for (int i = 0; i < 7; i++) {
        LNode *s = malloc(sizeof(LNode));
        s->data = arr[i];
        s->next = NULL;
        tail->next = s;
        tail = s;
    }

    print(head, "before: ");
    int cnt = deleteAllX(head, 5);
    printf("deleted %d nodes\\n", cnt);
    print(head, "after : ");
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

int deleteAllX(LNode *head, int x) {
    int cnt = 0;
    LNode *p = head;
    while (p->next != NULL) {
        if (p->next->data == x) {
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

void print(LNode *head, const char *tag) {
    printf("%s", tag);
    for (LNode *p = head->next; p; p = p->next)
        printf("%s%d", p == head->next ? "" : " ", p->data);
    printf("\\n");
}

int main(void) {
    LNode *head = (LNode *)malloc(sizeof(LNode));
    head->next = NULL;
    LNode *tail = head;
    int arr[] = {1, 2, 5, 3, 5, 4, 5};
    for (int i = 0; i < 7; i++) {
        LNode *s = (LNode *)malloc(sizeof(LNode));
        s->data = arr[i];
        s->next = NULL;
        tail->next = s;
        tail = s;
    }

    print(head, "before: ");
    int cnt = deleteAllX(head, 5);
    printf("deleted %d nodes\\n", cnt);
    print(head, "after : ");
    return 0;
}`,
    expected: `before: 1 2 5 3 5 4 5
deleted 3 nodes
after : 1 2 3 4`,
    hints: [
      '关键是"删除之后不要往前走"，因为新的 p->next 还没检查过。',
      '用 `while (p->next)` 而不是 `while (p)`，能省掉一堆判空。'
    ]
  },

  {
    id: 'ex-linklist-reverse',
    ch: 'c2',
    title: '单链表原地逆置',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>把带头结点的单链表 <code>1 2 3 4 5 6</code> 原地逆置（不许新建结点），输出：</p>
      <pre><code>before: 1 2 3 4 5 6
after : 6 5 4 3 2 1</code></pre>
      <h2>要求</h2>
      <ul>
        <li>用三指针法（prev / cur / next）。</li>
        <li>空间 O(1)，不许申请新结点。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

void reverse(LNode *head) {
    // TODO: 原地逆置（head 是头结点，不参与逆置）
}

int main(void) {
    LNode *head = malloc(sizeof(LNode));
    head->next = NULL;
    LNode *tail = head;
    for (int i = 1; i <= 6; i++) {
        LNode *s = malloc(sizeof(LNode));
        s->data = i;
        s->next = NULL;
        tail->next = s;
        tail = s;
    }

    printf("before:");
    for (LNode *p = head->next; p; p = p->next) printf(" %d", p->data);
    printf("\\n");

    reverse(head);

    printf("after :");
    for (LNode *p = head->next; p; p = p->next) printf(" %d", p->data);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>

typedef struct LNode {
    int data;
    struct LNode *next;
} LNode;

void reverse(LNode *head) {
    LNode *prev = NULL;
    LNode *cur = head->next;
    while (cur) {
        LNode *next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    head->next = prev;
}

int main(void) {
    LNode *head = (LNode *)malloc(sizeof(LNode));
    head->next = NULL;
    LNode *tail = head;
    for (int i = 1; i <= 6; i++) {
        LNode *s = (LNode *)malloc(sizeof(LNode));
        s->data = i;
        s->next = NULL;
        tail->next = s;
        tail = s;
    }

    printf("before:");
    for (LNode *p = head->next; p; p = p->next) printf(" %d", p->data);
    printf("\\n");

    reverse(head);

    printf("after :");
    for (LNode *p = head->next; p; p = p->next) printf(" %d", p->data);
    printf("\\n");
    return 0;
}`,
    expected: `before: 1 2 3 4 5 6
after : 6 5 4 3 2 1`,
    hints: [
      '四句话顺序固定：存后继 → 反转指针 → prev 前移 → cur 前移。',
      '循环结束后别忘 `head->next = prev;`，否则头结点还指着原来的第一个（现在是最后一个）。'
    ]
  },

  /* ---------------- 第 3 章 ---------------- */
  {
    id: 'ex-stack',
    ch: 'c3',
    title: '顺序栈：基本操作',
    level: '简单',
    desc: `
      <h2>题目</h2>
      <p>用数组实现顺序栈（top 指向栈顶元素，空栈 top = -1），执行：</p>
      <ol>
        <li>依次压入 1 2 3 4 5</li>
        <li>弹出两次，输出弹出的值</li>
        <li>输出当前栈顶和栈内元素</li>
      </ol>
      <pre><code>pop: 5
pop: 4
top: 3
stack: 1 2 3</code></pre>
    `,
    starter: `#include <stdio.h>

#define MAXSIZE 10
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int top;
} SqStack;

void InitStack(SqStack *S) { S->top = -1; }

int Push(SqStack *S, int x) {
    // TODO
    return ERROR;
}

int Pop(SqStack *S, int *x) {
    // TODO
    return ERROR;
}

int GetTop(SqStack *S, int *x) {
    // TODO
    return ERROR;
}

int main(void) {
    SqStack S;
    InitStack(&S);
    for (int i = 1; i <= 5; i++) Push(&S, i);

    int x;
    Pop(&S, &x); printf("pop: %d\\n", x);
    Pop(&S, &x); printf("pop: %d\\n", x);

    GetTop(&S, &x);
    printf("top: %d\\n", x);

    printf("stack:");
    for (int i = 0; i <= S.top; i++) printf(" %d", S.data[i]);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>

#define MAXSIZE 10
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int top;
} SqStack;

void InitStack(SqStack *S) { S->top = -1; }

int Push(SqStack *S, int x) {
    if (S->top == MAXSIZE - 1) return ERROR;
    S->data[++S->top] = x;
    return OK;
}

int Pop(SqStack *S, int *x) {
    if (S->top == -1) return ERROR;
    *x = S->data[S->top--];
    return OK;
}

int GetTop(SqStack *S, int *x) {
    if (S->top == -1) return ERROR;
    *x = S->data[S->top];
    return OK;
}

int main(void) {
    SqStack S;
    InitStack(&S);
    for (int i = 1; i <= 5; i++) Push(&S, i);

    int x;
    Pop(&S, &x); printf("pop: %d\\n", x);
    Pop(&S, &x); printf("pop: %d\\n", x);

    GetTop(&S, &x);
    printf("top: %d\\n", x);

    printf("stack:");
    for (int i = 0; i <= S.top; i++) printf(" %d", S.data[i]);
    printf("\\n");
    return 0;
}`,
    expected: `pop: 5
pop: 4
top: 3
stack: 1 2 3`,
    hints: [
      '`data[++top] = x` 是入栈，`x = data[top--]` 是出栈。',
      'GetTop 不出栈，只读不删。'
    ]
  },

  {
    id: 'ex-bracket',
    ch: 'c3',
    title: '括号匹配',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>用栈判断括号是否匹配。支持 <code>()</code>、<code>[]</code>、<code>{}</code> 三种。对下面四个字符串判断：</p>
      <pre><code>(a+b)*[c-{d+e}] : ok
([)] : fail
((( : fail
)( : fail</code></pre>
      <h2>要求</h2>
      <ul>
        <li>输出格式：<code>字符串 : ok</code> 或 <code>字符串 : fail</code></li>
        <li>三种失败情况都要处理：栈空遇右括号、类型不匹配、结束时栈非空。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <string.h>

#define MAXSIZE 64

typedef struct {
    char data[MAXSIZE];
    int top;
} Stack;

void init(Stack *s) { s->top = -1; }
int empty(Stack *s) { return s->top == -1; }
void push(Stack *s, char c) { s->data[++s->top] = c; }
char pop(Stack *s) { return s->data[s->top--]; }

int check(const char *s) {
    Stack st;
    init(&st);
    // TODO: 返回 1 表示匹配，0 表示不匹配
    return 1;
}

int main(void) {
    const char *tests[] = {"(a+b)*[c-{d+e}]", "([)]", "(((", ")("};
    for (int i = 0; i < 4; i++)
        printf("%s : %s\\n", tests[i], check(tests[i]) ? "ok" : "fail");
    return 0;
}`,
    solution: `#include <stdio.h>
#include <string.h>

#define MAXSIZE 64

typedef struct {
    char data[MAXSIZE];
    int top;
} Stack;

void init(Stack *s) { s->top = -1; }
int empty(Stack *s) { return s->top == -1; }
void push(Stack *s, char c) { s->data[++s->top] = c; }
char pop(Stack *s) { return s->data[s->top--]; }

int check(const char *s) {
    Stack st;
    init(&st);
    for (int i = 0; s[i]; i++) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            push(&st, c);
        } else if (c == ')' || c == ']' || c == '}') {
            if (empty(&st)) return 0;
            char t = pop(&st);
            if ((c == ')' && t != '(') ||
                (c == ']' && t != '[') ||
                (c == '}' && t != '{')) return 0;
        }
    }
    return empty(&st);
}

int main(void) {
    const char *tests[] = {"(a+b)*[c-{d+e}]", "([)]", "(((", ")("};
    for (int i = 0; i < 4; i++)
        printf("%s : %s\\n", tests[i], check(tests[i]) ? "ok" : "fail");
    return 0;
}`,
    expected: `(a+b)*[c-{d+e}] : ok
([)] : fail
((( : fail
)( : fail`,
    hints: [
      '遇到左括号压栈，右括号弹栈比较类型。',
      '最后返回 `empty(&st)`，这一句同时处理了"结束时还有左括号"的情况。'
    ]
  },

  {
    id: 'ex-queue',
    ch: 'c3',
    title: '循环队列：入队出队',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>实现循环队列（数组长度 5，浪费一个单元，最多存 4 个），执行：</p>
      <ol>
        <li>入队 1 2 3 4，输出队列内容</li>
        <li>再入队 5（应该失败，队满）</li>
        <li>出队两次，输出出队值</li>
        <li>再入队 5 6，输出队列内容（验证取模绕回）</li>
      </ol>
      <pre><code>queue: 1 2 3 4
enqueue 5: fail
dequeue: 1
dequeue: 2
queue: 3 4 5 6</code></pre>
    `,
    starter: `#include <stdio.h>

#define MAXSIZE 5

typedef struct {
    int data[MAXSIZE];
    int front, rear;
} SqQueue;

void init(SqQueue *q) { q->front = q->rear = 0; }
int empty(SqQueue *q) { return q->front == q->rear; }
int full(SqQueue *q) { return (q->rear + 1) % MAXSIZE == q->front; }

int enqueue(SqQueue *q, int x) {
    // TODO
    return 0;
}

int dequeue(SqQueue *q, int *x) {
    // TODO
    return 0;
}

void print(SqQueue *q, const char *tag) {
    printf("%s", tag);
    for (int i = q->front; i != q->rear; i = (i + 1) % MAXSIZE)
        printf(" %d", q->data[i]);
    printf("\\n");
}

int main(void) {
    SqQueue q;
    init(&q);

    for (int i = 1; i <= 4; i++) enqueue(&q, i);
    print(&q, "queue:");

    printf("enqueue 5: %s\\n", enqueue(&q, 5) ? "ok" : "fail");

    int x;
    dequeue(&q, &x); printf("dequeue: %d\\n", x);
    dequeue(&q, &x); printf("dequeue: %d\\n", x);

    enqueue(&q, 5);
    enqueue(&q, 6);
    print(&q, "queue:");
    return 0;
}`,
    solution: `#include <stdio.h>

#define MAXSIZE 5

typedef struct {
    int data[MAXSIZE];
    int front, rear;
} SqQueue;

void init(SqQueue *q) { q->front = q->rear = 0; }
int empty(SqQueue *q) { return q->front == q->rear; }
int full(SqQueue *q) { return (q->rear + 1) % MAXSIZE == q->front; }

int enqueue(SqQueue *q, int x) {
    if (full(q)) return 0;
    q->data[q->rear] = x;
    q->rear = (q->rear + 1) % MAXSIZE;
    return 1;
}

int dequeue(SqQueue *q, int *x) {
    if (empty(q)) return 0;
    *x = q->data[q->front];
    q->front = (q->front + 1) % MAXSIZE;
    return 1;
}

void print(SqQueue *q, const char *tag) {
    printf("%s", tag);
    for (int i = q->front; i != q->rear; i = (i + 1) % MAXSIZE)
        printf(" %d", q->data[i]);
    printf("\\n");
}

int main(void) {
    SqQueue q;
    init(&q);

    for (int i = 1; i <= 4; i++) enqueue(&q, i);
    print(&q, "queue:");

    printf("enqueue 5: %s\\n", enqueue(&q, 5) ? "ok" : "fail");

    int x;
    dequeue(&q, &x); printf("dequeue: %d\\n", x);
    dequeue(&q, &x); printf("dequeue: %d\\n", x);

    enqueue(&q, 5);
    enqueue(&q, 6);
    print(&q, "queue:");
    return 0;
}`,
    expected: `queue: 1 2 3 4
enqueue 5: fail
dequeue: 1
dequeue: 2
queue: 3 4 5 6`,
    hints: [
      '入队：存值后 `rear = (rear+1) % MAXSIZE`。',
      '判满公式 `(rear+1) % MAXSIZE == front`，因为要浪费一个位置区分空和满。'
    ]
  },

  /* ---------------- 第 4 章 ---------------- */
  {
    id: 'ex-kmp-next',
    ch: 'c4',
    title: '求 next 数组并统计匹配次数',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>实现 KMP 的 next 数组（0 开始下标，next[0] = -1），对模式串 <code>abcac</code> 输出 next，然后用它在主串 <code>ababcabcacbab</code> 中查找并输出位置。</p>
      <pre><code>pattern: abcac
next: -1 0 0 0 1
match at: 5</code></pre>
      <h2>要求</h2>
      <ul>
        <li>next 数组用空格分隔，不要用逗号。</li>
        <li>返回首次匹配的起始下标（0 开始）。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <string.h>

void getNext(const char *t, int *next, int m) {
    // TODO: next[0] = -1，用 i、j 双指针
}

int kmp(const char *s, const char *t, int *next) {
    // TODO: 返回首次匹配下标，找不到返回 -1
    return -1;
}

int main(void) {
    const char *T = "abcac";
    const char *S = "ababcabcacbab";
    int m = strlen(T);
    int next[32];

    getNext(T, next, m);

    printf("pattern: %s\\n", T);
    printf("next:");
    for (int i = 0; i < m; i++) printf(" %d", next[i]);
    printf("\\n");

    int pos = kmp(S, T, next);
    printf("match at: %d\\n", pos);
    return 0;
}`,
    solution: `#include <stdio.h>
#include <string.h>

void getNext(const char *t, int *next, int m) {
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

int kmp(const char *s, const char *t, int *next) {
    int n = strlen(s), m = strlen(t);
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1 || s[i] == t[j]) {
            i++;
            j++;
        } else {
            j = next[j];
        }
    }
    return j == m ? i - m : -1;
}

int main(void) {
    const char *T = "abcac";
    const char *S = "ababcabcacbab";
    int m = strlen(T);
    int next[32];

    getNext(T, next, m);

    printf("pattern: %s\\n", T);
    printf("next:");
    for (int i = 0; i < m; i++) printf(" %d", next[i]);
    printf("\\n");

    int pos = kmp(S, T, next);
    printf("match at: %d\\n", pos);
    return 0;
}`,
    expected: `pattern: abcac
next: -1 0 0 0 1
match at: 5`,
    hints: [
      '求 next 的过程就是"模式串自己和自己匹配"。',
      '`j == -1` 时 i、j 同时加一，这是哨兵设计的妙处。',
      '主串里 abcac 第一次出现在下标 5（第 6 个字符起）。',
      '算 next 时注意：abcac 的前 4 个字符 abca 里，前缀 a 和后缀 a 相等，所以 next[4] = 1。'
    ]
  },

  /* ---------------- 第 5 章 ---------------- */
  {
    id: 'ex-tree-props',
    ch: 'c5',
    title: '统计二叉树的叶子数和高度',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>手工建一棵 7 个结点的二叉树，统计叶子数、高度、度为 1 的结点数，并验证 <code>n0 = n2 + 1</code>。</p>
      <p>树结构（前序输入）：<code>1 2 4 # # 5 7 # # # 3 # 6 # #</code>，实际形状：</p>
      <pre><code>       1
      / \\
     2   3
    / \\   \\
   4   5   6
      /
     7</code></pre>
      <p>输出：</p>
      <pre><code>n0 = 3
n1 = 2
n2 = 2
height = 4
check n0 == n2 + 1 : true</code></pre>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *l, *r;
} Node;

Node *newNode(int v) {
    Node *n = malloc(sizeof(Node));
    n->data = v;
    n->l = n->r = NULL;
    return n;
}

void stats(Node *p, int depth, int *n0, int *n1, int *n2, int *h) {
    // TODO: 递归统计
}

int main(void) {
    Node *root = newNode(1);
    root->l = newNode(2); root->r = newNode(3);
    root->l->l = newNode(4); root->l->r = newNode(5);
    root->r->r = newNode(6);
    root->l->r->l = newNode(7);

    int n0 = 0, n1 = 0, n2 = 0, h = 0;
    // TODO: 调用 stats

    printf("n0 = %d\\n", n0);
    printf("n1 = %d\\n", n1);
    printf("n2 = %d\\n", n2);
    printf("height = %d\\n", h);
    printf("check n0 == n2 + 1 : %s\\n", n0 == n2 + 1 ? "true" : "false");
    return 0;
}`,
    solution: `#include <stdio.h>
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

void stats(Node *p, int depth, int *n0, int *n1, int *n2, int *h) {
    if (!p) return;
    int deg = (p->l ? 1 : 0) + (p->r ? 1 : 0);
    if (deg == 0) (*n0)++;
    else if (deg == 1) (*n1)++;
    else (*n2)++;
    if (depth > *h) *h = depth;

    stats(p->l, depth + 1, n0, n1, n2, h);
    stats(p->r, depth + 1, n0, n1, n2, h);
}

int main(void) {
    Node *root = newNode(1);
    root->l = newNode(2); root->r = newNode(3);
    root->l->l = newNode(4); root->l->r = newNode(5);
    root->r->r = newNode(6);
    root->l->r->l = newNode(7);

    int n0 = 0, n1 = 0, n2 = 0, h = 0;
    stats(root, 1, &n0, &n1, &n2, &h);

    printf("n0 = %d\\n", n0);
    printf("n1 = %d\\n", n1);
    printf("n2 = %d\\n", n2);
    printf("height = %d\\n", h);
    printf("check n0 == n2 + 1 : %s\\n", n0 == n2 + 1 ? "true" : "false");
    return 0;
}`,
    expected: `n0 = 3
n1 = 2
n2 = 2
height = 4
check n0 == n2 + 1 : true`,
    hints: [
      '度为 0 的叶子：4、7、6 共 3 个。',
      '度为 1 的：3（只有右孩子）、5（只有左孩子 7）共 2 个。',
      '高度 4：路径 1-2-5-7。'
    ]
  },

  {
    id: 'ex-tree-traverse',
    ch: 'c5',
    title: '二叉树四种遍历',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>对下面这棵树输出前序、中序、后序、层序：</p>
      <pre><code>       1
      / \\
     2   3
    / \\   \\
   4   5   6
      /
     7</code></pre>
      <p>期望输出：</p>
      <pre><code>pre  : 1 2 4 5 7 3 6
in   : 4 2 7 5 1 3 6
post : 4 7 5 2 6 3 1
level: 1 2 3 4 5 6 7</code></pre>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *l, *r;
} Node;

Node *newNode(int v) {
    Node *n = malloc(sizeof(Node));
    n->data = v;
    n->l = n->r = NULL;
    return n;
}

void pre(Node *p) { /* TODO */ }
void in(Node *p)  { /* TODO */ }
void post(Node *p){ /* TODO */ }
void level(Node *p) { /* TODO: 用数组当队列 */ }

int main(void) {
    Node *root = newNode(1);
    root->l = newNode(2); root->r = newNode(3);
    root->l->l = newNode(4); root->l->r = newNode(5);
    root->r->r = newNode(6);
    root->l->r->l = newNode(7);

    printf("pre  :"); pre(root);  printf("\\n");
    printf("in   :"); in(root);   printf("\\n");
    printf("post :"); post(root); printf("\\n");
    printf("level:"); level(root); printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>
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

void pre(Node *p) {
    if (!p) return;
    printf(" %d", p->data);
    pre(p->l);
    pre(p->r);
}

void in(Node *p) {
    if (!p) return;
    in(p->l);
    printf(" %d", p->data);
    in(p->r);
}

void post(Node *p) {
    if (!p) return;
    post(p->l);
    post(p->r);
    printf(" %d", p->data);
}

void level(Node *p) {
    if (!p) return;
    Node *q[32];
    int head = 0, tail = 0;
    q[tail++] = p;
    while (head < tail) {
        Node *cur = q[head++];
        printf(" %d", cur->data);
        if (cur->l) q[tail++] = cur->l;
        if (cur->r) q[tail++] = cur->r;
    }
}

int main(void) {
    Node *root = newNode(1);
    root->l = newNode(2); root->r = newNode(3);
    root->l->l = newNode(4); root->l->r = newNode(5);
    root->r->r = newNode(6);
    root->l->r->l = newNode(7);

    printf("pre  :"); pre(root);  printf("\\n");
    printf("in   :"); in(root);   printf("\\n");
    printf("post :"); post(root); printf("\\n");
    printf("level:"); level(root); printf("\\n");
    return 0;
}`,
    expected: `pre  : 1 2 4 5 7 3 6
in   : 4 2 7 5 1 3 6
post : 4 7 5 2 6 3 1
level: 1 2 3 4 5 6 7`,
    hints: [
      '三种递归遍历只有 printf 的位置不同。',
      '层序用数组模拟队列：head 出队，tail 入队。'
    ]
  },

  {
    id: 'ex-tree-build',
    ch: 'c5',
    title: '由前序和中序建树',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>给定前序 <code>ABDECF</code> 和中序 <code>DBEAFC</code>，建出二叉树并输出后序遍历。</p>
      <pre><code>preorder : A B D E C F
inorder  : D B E A F C
postorder: D E B F C A</code></pre>
      <h2>要求</h2>
      <ul>
        <li>用递归，参数用闭区间 <code>[preL, preR]</code>、<code>[inL, inR]</code>。</li>
        <li>输出后序时用空格分隔。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    char data;
    struct Node *l, *r;
} Node;

Node *build(const char *pre, int preL, int preR,
            const char *in, int inL, int inR) {
    // TODO
    return NULL;
}

void post(Node *p) {
    if (!p) return;
    post(p->l);
    post(p->r);
    printf(" %c", p->data);
}

int main(void) {
    const char *pre = "ABDECF";
    const char *in = "DBEAFC";
    Node *root = build(pre, 0, strlen(pre) - 1, in, 0, strlen(in) - 1);

    printf("preorder :");
    for (int i = 0; i < 6; i++) printf(" %c", pre[i]);
    printf("\\n");

    printf("inorder  :");
    for (int i = 0; i < 6; i++) printf(" %c", in[i]);
    printf("\\n");

    printf("postorder:");
    post(root);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct Node {
    char data;
    struct Node *l, *r;
} Node;

Node *build(const char *pre, int preL, int preR,
            const char *in, int inL, int inR) {
    if (preL > preR) return NULL;

    char rootC = pre[preL];
    Node *root = (Node *)malloc(sizeof(Node));
    root->data = rootC;
    root->l = root->r = NULL;

    int k = inL;
    while (k <= inR && in[k] != rootC) k++;
    if (k > inR) return NULL;

    int leftLen = k - inL;
    root->l = build(pre, preL + 1, preL + leftLen, in, inL, k - 1);
    root->r = build(pre, preL + leftLen + 1, preR, in, k + 1, inR);
    return root;
}

void post(Node *p) {
    if (!p) return;
    post(p->l);
    post(p->r);
    printf(" %c", p->data);
}

int main(void) {
    const char *pre = "ABDECF";
    const char *in = "DBEAFC";
    Node *root = build(pre, 0, strlen(pre) - 1, in, 0, strlen(in) - 1);

    printf("preorder :");
    for (int i = 0; i < 6; i++) printf(" %c", pre[i]);
    printf("\\n");

    printf("inorder  :");
    for (int i = 0; i < 6; i++) printf(" %c", in[i]);
    printf("\\n");

    printf("postorder:");
    post(root);
    printf("\\n");
    return 0;
}`,
    expected: `preorder : A B D E C F
inorder  : D B E A F C
postorder: D E B F C A`,
    hints: [
      '前序第一个是根；在中序里找到根，左边就是左子树。',
      '右子树的起点是 `preL + leftLen + 1`，别漏掉 +1。'
    ]
  },

  {
    id: 'ex-bst',
    ch: 'c5',
    title: '二叉排序树：插入与中序',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>依次插入 <code>45 24 53 12 37 93</code> 到二叉排序树，然后输出中序遍历和前序，并查找 37。</p>
      <pre><code>inorder: 12 24 37 45 53 93
preorder: 45 24 12 37 53 93
search 37: found
search 50: not found</code></pre>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *l, *r;
} Node;

Node *insert(Node *root, int v) {
    // TODO
    return NULL;
}

Node *search(Node *root, int key) {
    // TODO
    return NULL;
}

void inorder(Node *p) {
    if (!p) return;
    inorder(p->l);
    printf(" %d", p->data);
    inorder(p->r);
}

void preorder(Node *p) {
    if (!p) return;
    printf(" %d", p->data);
    preorder(p->l);
    preorder(p->r);
}

int main(void) {
    int arr[] = {45, 24, 53, 12, 37, 93};
    Node *root = NULL;
    for (int i = 0; i < 6; i++) root = insert(root, arr[i]);

    printf("inorder:"); inorder(root); printf("\\n");
    printf("preorder:"); preorder(root); printf("\\n");
    printf("search 37: %s\\n", search(root, 37) ? "found" : "not found");
    printf("search 50: %s\\n", search(root, 50) ? "found" : "not found");
    return 0;
}`,
    solution: `#include <stdio.h>
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
    if (v < root->data) root->l = insert(root->l, v);
    else if (v > root->data) root->r = insert(root->r, v);
    return root;
}

Node *search(Node *root, int key) {
    while (root && root->data != key)
        root = (key < root->data) ? root->l : root->r;
    return root;
}

void inorder(Node *p) {
    if (!p) return;
    inorder(p->l);
    printf(" %d", p->data);
    inorder(p->r);
}

void preorder(Node *p) {
    if (!p) return;
    printf(" %d", p->data);
    preorder(p->l);
    preorder(p->r);
}

int main(void) {
    int arr[] = {45, 24, 53, 12, 37, 93};
    Node *root = NULL;
    for (int i = 0; i < 6; i++) root = insert(root, arr[i]);

    printf("inorder:"); inorder(root); printf("\\n");
    printf("preorder:"); preorder(root); printf("\\n");
    printf("search 37: %s\\n", search(root, 37) ? "found" : "not found");
    printf("search 50: %s\\n", search(root, 50) ? "found" : "not found");
    return 0;
}`,
    expected: `inorder: 12 24 37 45 53 93
preorder: 45 24 12 37 53 93
search 37: found
search 50: not found`,
    hints: [
      '插入的递归要接住返回值：`root->l = insert(root->l, v);`',
      '中序一定是递增的，这是最好的自检方式。'
    ]
  },

  {
    id: 'ex-unionfind',
    ch: 'c5',
    title: '并查集：朋友圈',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>10 个人（0..9），已知朋友关系：<code>(0,1) (1,2) (3,4) (5,6) (6,7) (8,9)</code>。用并查集合并后输出：</p>
      <pre><code>groups: 4
0 and 2 same group: yes
0 and 3 same group: no</code></pre>
      <h2>要求</h2>
      <ul>
        <li>实现带路径压缩的 find。</li>
        <li>统计根结点个数即为组数。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

#define N 10

int parent[N];

void init(void) { for (int i = 0; i < N; i++) parent[i] = i; }

int find(int x) {
    // TODO: 路径压缩
    return x;
}

void unite(int a, int b) {
    // TODO
}

int main(void) {
    init();
    int edges[][2] = {{0,1},{1,2},{3,4},{5,6},{6,7},{8,9}};
    for (int i = 0; i < 6; i++) unite(edges[i][0], edges[i][1]);

    int groups = 0;
    for (int i = 0; i < N; i++) if (find(i) == i) groups++;
    printf("groups: %d\\n", groups);

    printf("0 and 2 same group: %s\\n", find(0) == find(2) ? "yes" : "no");
    printf("0 and 3 same group: %s\\n", find(0) == find(3) ? "yes" : "no");
    return 0;
}`,
    solution: `#include <stdio.h>

#define N 10

int parent[N];

void init(void) { for (int i = 0; i < N; i++) parent[i] = i; }

int find(int x) {
    if (parent[x] != x)
        parent[x] = find(parent[x]);
    return parent[x];
}

void unite(int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra != rb) parent[ra] = rb;
}

int main(void) {
    init();
    int edges[][2] = {{0,1},{1,2},{3,4},{5,6},{6,7},{8,9}};
    for (int i = 0; i < 6; i++) unite(edges[i][0], edges[i][1]);

    int groups = 0;
    for (int i = 0; i < N; i++) if (find(i) == i) groups++;
    printf("groups: %d\\n", groups);

    printf("0 and 2 same group: %s\\n", find(0) == find(2) ? "yes" : "no");
    printf("0 and 3 same group: %s\\n", find(0) == find(3) ? "yes" : "no");
    return 0;
}`,
    expected: `groups: 4
0 and 2 same group: yes
0 and 3 same group: no`,
    hints: [
      '初始有 10 个组，每成功合并一次少一个组。',
      '路径压缩就一句 `parent[x] = find(parent[x])`，写在递归里。'
    ]
  },

  /* ---------------- 第 6 章 ---------------- */
  {
    id: 'ex-graph-traverse',
    ch: 'c6',
    title: '图的 DFS 与 BFS',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>无向图 6 个顶点 0..5，边：<code>(0,1) (0,2) (1,3) (2,4) (3,4) (3,5)</code>。用邻接矩阵存储，从 0 开始输出 DFS 和 BFS 序列（小编号优先）。</p>
      <pre><code>DFS: 0 1 3 4 2 5
BFS: 0 1 2 3 4 5</code></pre>
    `,
    starter: `#include <stdio.h>

#define N 6

int g[N][N];
int visited[N];

void addEdge(int u, int v) { g[u][v] = g[v][u] = 1; }

void dfs(int v) {
    // TODO: 标记 + 输出 + 递归邻居
}

void bfs(int start) {
    // TODO: 用数组当队列
}

int main(void) {
    addEdge(0,1); addEdge(0,2); addEdge(1,3);
    addEdge(2,4); addEdge(3,4); addEdge(3,5);

    printf("DFS:");
    for (int i = 0; i < N; i++) visited[i] = 0;
    dfs(0);
    printf("\\n");

    printf("BFS:");
    bfs(0);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>

#define N 6

int g[N][N];
int visited[N];

void addEdge(int u, int v) { g[u][v] = g[v][u] = 1; }

void dfs(int v) {
    visited[v] = 1;
    printf(" %d", v);
    for (int w = 0; w < N; w++)
        if (g[v][w] && !visited[w]) dfs(w);
}

void bfs(int start) {
    int q[N], head = 0, tail = 0;
    int vis[N] = {0};

    vis[start] = 1;
    q[tail++] = start;
    while (head < tail) {
        int v = q[head++];
        printf(" %d", v);
        for (int w = 0; w < N; w++) {
            if (g[v][w] && !vis[w]) {
                vis[w] = 1;
                q[tail++] = w;
            }
        }
    }
}

int main(void) {
    addEdge(0,1); addEdge(0,2); addEdge(1,3);
    addEdge(2,4); addEdge(3,4); addEdge(3,5);

    printf("DFS:");
    for (int i = 0; i < N; i++) visited[i] = 0;
    dfs(0);
    printf("\\n");

    printf("BFS:");
    bfs(0);
    printf("\\n");
    return 0;
}`,
    expected: `DFS: 0 1 3 4 2 5
BFS: 0 1 2 3 4 5`,
    hints: [
      '邻接矩阵遍历时 w 从 0 到 N-1，天然就是小编号优先。',
      'BFS 一定要在入队时标记 visited。'
    ]
  },

  {
    id: 'ex-mst',
    ch: 'c6',
    title: 'Prim 求最小生成树',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>无向图 6 个顶点，边权为：<code>A-B 6, A-C 1, A-D 5, B-C 5, B-E 3, C-D 5, C-E 6, C-F 4, D-F 2, E-F 6</code>。用 Prim 算法从 A 出发求最小生成树，输出每条选中的边和总权值。</p>
      <pre><code>A-C 1
C-F 4
F-D 2
C-B 5
B-E 3
total = 15</code></pre>
      <h2>说明</h2>
      <p>选边顺序可能不同（取决于相等权值的处理），但 <strong>total 一定是 15</strong>。判题只比对完整输出，所以请按"每次选最小权值、相同权值时选小编号"的策略实现。</p>
    `,
    starter: `#include <stdio.h>

#define N 6
#define INF 99999

int cost[N][N];
int used[N];

int main(void) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    int e[][3] = {
        {0,1,6},{0,2,1},{0,3,5},{1,2,5},{1,4,3},
        {2,3,5},{2,4,6},{2,5,4},{3,5,2},{4,5,6}
    };
    for (int i = 0; i < 10; i++) {
        cost[e[i][0]][e[i][1]] = e[i][2];
        cost[e[i][1]][e[i][0]] = e[i][2];
    }

    // TODO: Prim，按格式输出选中的边和 total
    return 0;
}`,
    solution: `#include <stdio.h>

#define N 6
#define INF 99999

int cost[N][N];
int used[N];

int main(void) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    int e[][3] = {
        {0,1,6},{0,2,1},{0,3,5},{1,2,5},{1,4,3},
        {2,3,5},{2,4,6},{2,5,4},{3,5,2},{4,5,6}
    };
    for (int i = 0; i < 10; i++) {
        cost[e[i][0]][e[i][1]] = e[i][2];
        cost[e[i][1]][e[i][0]] = e[i][2];
    }

    int low[N], from[N];
    for (int i = 0; i < N; i++) { low[i] = cost[0][i]; from[i] = 0; }
    used[0] = 1;
    int total = 0;

    for (int k = 1; k < N; k++) {
        int min = INF, u = -1;
        for (int i = 0; i < N; i++)
            if (!used[i] && low[i] < min) { min = low[i]; u = i; }
        if (u == -1) break;

        used[u] = 1;
        total += min;
        printf("%c-%c %d\\n", 'A' + from[u], 'A' + u, min);

        for (int i = 0; i < N; i++)
            if (!used[i] && cost[u][i] < low[i]) {
                low[i] = cost[u][i];
                from[i] = u;
            }
    }
    printf("total = %d\\n", total);
    return 0;
}`,
    expected: `A-C 1
C-F 4
F-D 2
C-B 5
B-E 3
total = 15`,
    hints: [
      'lowcost 数组存"已选集合到每个未选点的最小边权"，每次选最小。',
      '每次加入新点后要更新 lowcost 和 from（前驱）。',
      '总权值 15 = 1+4+2+5+3。'
    ]
  },

  {
    id: 'ex-dijkstra',
    ch: 'c6',
    title: 'Dijkstra 单源最短路',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>有向图 5 个顶点：<code>A→B 10, A→C 3, B→D 2, C→B 4, C→D 8, C→E 2, D→E 5</code>。求 A 到所有点的最短距离并输出：</p>
      <pre><code>A: 0
B: 7
C: 3
D: 9
E: 5</code></pre>
      <h2>提示</h2>
      <p>A→C→B 是 3+4=7，比 A→B 的 10 更短，这就是"松弛"的意义。</p>
    `,
    starter: `#include <stdio.h>

#define N 5
#define INF 99999

int cost[N][N];
int dist[N];
int done[N];

int main(void) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    cost[0][1] = 10; cost[0][2] = 3;
    cost[1][3] = 2;
    cost[2][1] = 4;  cost[2][3] = 8; cost[2][4] = 2;
    cost[3][4] = 5;

    // TODO: Dijkstra，输出 A..E 到 A 的最短距离
    return 0;
}`,
    solution: `#include <stdio.h>

#define N 5
#define INF 99999

int cost[N][N];
int dist[N];
int done[N];

int main(void) {
    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    cost[0][1] = 10; cost[0][2] = 3;
    cost[1][3] = 2;
    cost[2][1] = 4;  cost[2][3] = 8; cost[2][4] = 2;
    cost[3][4] = 5;

    for (int i = 0; i < N; i++) dist[i] = cost[0][i];
    dist[0] = 0;
    done[0] = 1;

    for (int k = 1; k < N; k++) {
        int min = INF, u = -1;
        for (int i = 0; i < N; i++)
            if (!done[i] && dist[i] < min) { min = dist[i]; u = i; }
        if (u == -1) break;
        done[u] = 1;
        for (int v = 0; v < N; v++)
            if (!done[v] && cost[u][v] < INF && dist[u] + cost[u][v] < dist[v])
                dist[v] = dist[u] + cost[u][v];
    }

    for (int i = 0; i < N; i++)
        printf("%c: %d\\n", 'A' + i, dist[i]);
    return 0;
}`,
    expected: `A: 0
B: 7
C: 3
D: 9
E: 5`,
    hints: [
      'dist 初始化为起点到各点的直接边权。',
      '每次选 dist 最小的未确定点，然后用它松弛邻居。'
    ]
  },

  {
    id: 'ex-topo',
    ch: 'c6',
    title: '拓扑排序',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>6 门课依赖关系：<code>0→2, 2→3, 1→3, 3→4, 3→5, 4→5</code>。输出一个合法的拓扑序列，并输出是否能完成所有课程。</p>
      <pre><code>order: 0 1 2 3 4 5
count: 6
all done: yes</code></pre>
      <h2>要求</h2>
      <ul>
        <li>用入度为 0 入栈/入队的方式。</li>
        <li>如果有多个入度为 0，编号小的先输出（用栈且从大到小压入，或者用队列）。</li>
      </ul>
    `,
    starter: `#include <stdio.h>

#define N 6

int g[N][N];
int indeg[N];
int order[N];

int main(void) {
    int e[][2] = {{0,2},{2,3},{1,3},{3,4},{3,5},{4,5}};
    for (int i = 0; i < 6; i++) {
        g[e[i][0]][e[i][1]] = 1;
        indeg[e[i][1]]++;
    }

    // TODO: 拓扑排序，输出 order / count / all done
    return 0;
}`,
    solution: `#include <stdio.h>

#define N 6

int g[N][N];
int indeg[N];
int order[N];

int main(void) {
    int e[][2] = {{0,2},{2,3},{1,3},{3,4},{3,5},{4,5}};
    for (int i = 0; i < 6; i++) {
        g[e[i][0]][e[i][1]] = 1;
        indeg[e[i][1]]++;
    }

    int q[N], head = 0, tail = 0;
    for (int i = 0; i < N; i++)
        if (indeg[i] == 0) q[tail++] = i;

    int cnt = 0;
    while (head < tail) {
        int u = q[head++];
        order[cnt++] = u;
        for (int v = 0; v < N; v++)
            if (g[u][v] && --indeg[v] == 0) q[tail++] = v;
    }

    printf("order:");
    for (int i = 0; i < cnt; i++) printf(" %d", order[i]);
    printf("\\n");
    printf("count: %d\\n", cnt);
    printf("all done: %s\\n", cnt == N ? "yes" : "no");
    return 0;
}`,
    expected: `order: 0 1 2 3 4 5
count: 6
all done: yes`,
    hints: [
      '初始入度为 0 的是 0 和 1，按编号顺序入队，所以先输出 0 再 1。',
      '处理 0 之后，2 的入度变 0，入队；处理 1 后 3 的入度变 1（还差 2）；2 处理完 3 才入队。'
    ]
  },

  /* ---------------- 第 7 章 ---------------- */
  {
    id: 'ex-binary-search',
    ch: 'c7',
    title: '折半查找与 ASL',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>有序数组 <code>7 11 18 25 33 47 58 69 80 92</code>，实现折半查找，对 25、92、7、40 输出查找结果和比较次数，最后输出成功 ASL。</p>
      <pre><code>25 -> index 3, cmp 2
92 -> index 9, cmp 4
7 -> index 0, cmp 3
40 -> not found, cmp 3
ASL = 2.90</code></pre>
    `,
    starter: `#include <stdio.h>

int binSearch(const int *a, int n, int key, int *cmp) {
    // TODO
    return -1;
}

int main(void) {
    int a[] = {7, 11, 18, 25, 33, 47, 58, 69, 80, 92};
    int n = 10;
    int keys[] = {25, 92, 7, 40};

    for (int i = 0; i < 4; i++) {
        int cmp;
        int pos = binSearch(a, n, keys[i], &cmp);
        if (pos >= 0) printf("%d -> index %d, cmp %d\\n", keys[i], pos, cmp);
        else          printf("%d -> not found, cmp %d\\n", keys[i], cmp);
    }

    // TODO: 计算并输出 ASL，保留两位小数
    return 0;
}`,
    solution: `#include <stdio.h>

int binSearch(const int *a, int n, int key, int *cmp) {
    int low = 0, high = n - 1;
    *cmp = 0;
    while (low <= high) {
        (*cmp)++;
        int mid = low + (high - low) / 2;
        if (a[mid] == key) return mid;
        if (a[mid] < key) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main(void) {
    int a[] = {7, 11, 18, 25, 33, 47, 58, 69, 80, 92};
    int n = 10;
    int keys[] = {25, 92, 7, 40};

    for (int i = 0; i < 4; i++) {
        int cmp;
        int pos = binSearch(a, n, keys[i], &cmp);
        if (pos >= 0) printf("%d -> index %d, cmp %d\\n", keys[i], pos, cmp);
        else          printf("%d -> not found, cmp %d\\n", keys[i], cmp);
    }

    int total = 0;
    for (int i = 0; i < n; i++) {
        int cmp;
        binSearch(a, n, a[i], &cmp);
        total += cmp;
    }
    printf("ASL = %.2f\\n", (double)total / n);
    return 0;
}`,
    expected: `25 -> index 3, cmp 4
92 -> index 9, cmp 4
7 -> index 0, cmp 3
40 -> not found, cmp 3
ASL = 2.90`,
    hints: [
      'mid = (0+9)/2 = 4，a[4]=33 > 25，所以去左半边，再 mid=1... 试着手算一遍。',
      'ASL = 所有元素查找次数之和 / n。'
    ]
  },

  {
    id: 'ex-hash',
    ch: 'c7',
    title: '哈希表：线性探测',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>表长 11，<code>H(key) = key % 11</code>，用线性探测法插入 <code>22 41 53 46 30 13 1 67</code>。输出每个元素的最终位置，以及成功查找的 ASL。</p>
      <pre><code>22 -> 0
41 -> 8
53 -> 9
46 -> 2
30 -> 10
13 -> 3
1 -> 1
67 -> 4
ASL = 1.75</code></pre>
    `,
    starter: `#include <stdio.h>

#define M 11
#define EMPTY -1

int table[M];

int insert(int key, int *probes) {
    // TODO: 线性探测，返回最终位置，probes 带回探测次数
    return -1;
}

int search(int key, int *probes) {
    // TODO
    return -1;
}

int main(void) {
    for (int i = 0; i < M; i++) table[i] = EMPTY;

    int keys[] = {22, 41, 53, 46, 30, 13, 1, 67};
    for (int i = 0; i < 8; i++) {
        int probes;
        int pos = insert(keys[i], &probes);
        printf("%d -> %d\\n", keys[i], pos);
    }

    // TODO: 输出 ASL
    return 0;
}`,
    solution: `#include <stdio.h>

#define M 11
#define EMPTY -1

int table[M];

int insert(int key, int *probes) {
    int idx = key % M;
    *probes = 0;
    for (int i = 0; i < M; i++) {
        int p = (idx + i) % M;
        (*probes)++;
        if (table[p] == EMPTY) {
            table[p] = key;
            return p;
        }
    }
    return -1;
}

int search(int key, int *probes) {
    int idx = key % M;
    *probes = 0;
    for (int i = 0; i < M; i++) {
        int p = (idx + i) % M;
        (*probes)++;
        if (table[p] == EMPTY) return -1;
        if (table[p] == key) return p;
    }
    return -1;
}

int main(void) {
    for (int i = 0; i < M; i++) table[i] = EMPTY;

    int keys[] = {22, 41, 53, 46, 30, 13, 1, 67};
    for (int i = 0; i < 8; i++) {
        int probes;
        int pos = insert(keys[i], &probes);
        printf("%d -> %d\\n", keys[i], pos);
    }

    int total = 0;
    for (int i = 0; i < 8; i++) {
        int probes;
        search(keys[i], &probes);
        total += probes;
    }
    printf("ASL = %.2f\\n", (double)total / 8);
    return 0;
}`,
    expected: `22 -> 0
41 -> 8
53 -> 9
46 -> 2
30 -> 10
13 -> 3
1 -> 1
67 -> 4
ASL = 1.75`,
    hints: [
      '53 % 11 = 9，直接放；46 % 11 = 2，直接放。',
      '30 % 11 = 8，但 8 被 41 占了、9 被 53 占了，所以往后探测到 10。',
      '67 % 11 = 1，1 号位被 1 占了、2 号被 46、3 号被 13，一直探测到 4 号位。',
      'ASL = 探测次数总和 / 元素个数 = (1+1+1+1+3+2+1+4)/8。'
    ]
  },

  /* ---------------- 第 8 章 ---------------- */
  {
    id: 'ex-insert-sort',
    ch: 'c8',
    title: '直接插入排序（带过程输出）',
    level: '中等',
    desc: `
      <h2>题目</h2>
      <p>对 <code>49 38 65 97 76 13 27</code> 做直接插入排序，每插入一个元素输出一趟结果，最后输出排好序的数组。</p>
      <pre><code>pass 1: 38 49
pass 2: 38 49 65
pass 3: 38 49 65 97
pass 4: 38 49 65 76 97
pass 5: 13 38 49 65 76 97
pass 6: 13 27 38 49 65 76 97
sorted: 13 27 38 49 65 76 97</code></pre>
      <h2>说明</h2>
      <p>第一个元素 49 自己就是有序的，所以从第 2 个元素开始，正好 6 趟。</p>
    `,
    starter: `#include <stdio.h>

void insertSort(int *a, int n) {
    // TODO: 每趟之后打印 "pass k:" 和当前已排序部分
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27};
    int n = 7;
    insertSort(a, n);

    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>

void insertSort(int *a, int n) {
    for (int i = 1; i < n; i++) {
        int t = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > t) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = t;

        printf("pass %d:", i);
        for (int k = 0; k <= i; k++) printf(" %d", a[k]);
        printf("\\n");
    }
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27};
    int n = 7;
    insertSort(a, n);

    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");
    return 0;
}`,
    expected: `pass 1: 38 49
pass 2: 38 49 65
pass 3: 38 49 65 97
pass 4: 38 49 65 76 97
pass 5: 13 38 49 65 76 97
pass 6: 13 27 38 49 65 76 97
sorted: 13 27 38 49 65 76 97`,
    hints: [
      '先暂存 `t = a[i]`，然后前面的元素只要大于 t 就往后挪。',
      '最后把 t 放到空出来的位置 `a[j+1] = t`。'
    ]
  },

  {
    id: 'ex-quicksort',
    ch: 'c8',
    title: '快速排序（partition 手写）',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>用"挖坑填数"法实现快速排序，对 <code>49 38 65 97 76 13 27 49</code> 排序，输出每层划分的结果，最后输出最终结果。</p>
      <pre><code>pivot 49 at 3: 27 38 13 49 76 97 65 49
pivot 27 at 1: 13 27 38
pivot 76 at 6: 49 65 76 97
pivot 49 at 4: 49 65
final: 13 27 38 49 49 65 76 97</code></pre>
      <h2>说明</h2>
      <p>取每段第一个元素作枢轴，划分后用"枢轴 位置"标记，只打印当前段的内容。</p>
    `,
    starter: `#include <stdio.h>

int partition(int *a, int low, int high) {
    // TODO: 挖坑填数，返回枢轴最终位置
    return low;
}

void quickSort(int *a, int low, int high) {
    // TODO: 划分后打印 "pivot X at P:" 和当前段
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27, 49};
    int n = 8;

    quickSort(a, 0, n - 1);

    printf("final:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");
    return 0;
}`,
    solution: `#include <stdio.h>

int partition(int *a, int low, int high) {
    int pivot = a[low];
    while (low < high) {
        while (low < high && a[high] >= pivot) high--;
        a[low] = a[high];
        while (low < high && a[low] <= pivot) low++;
        a[high] = a[low];
    }
    a[low] = pivot;
    return low;
}

void quickSort(int *a, int low, int high) {
    if (low >= high) return;
    int p = partition(a, low, high);

    printf("pivot %d at %d:", a[p], p);
    for (int i = low; i <= high; i++) printf(" %d", a[i]);
    printf("\\n");

    quickSort(a, low, p - 1);
    quickSort(a, p + 1, high);
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27, 49};
    int n = 8;

    quickSort(a, 0, n - 1);

    printf("final:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");
    return 0;
}`,
    expected: `pivot 49 at 3: 27 38 13 49 76 97 65 49
pivot 27 at 1: 13 27 38
pivot 76 at 6: 49 65 76 97
pivot 49 at 4: 49 65
final: 13 27 38 49 49 65 76 97`,
    hints: [
      '挖坑法：`pivot = a[low]`，先从右往左找小的填左边坑，再从左往右找大的填右边坑。',
      '两个 while 都必须带 `low < high`。'
    ]
  },

  {
    id: 'ex-merge-sort',
    ch: 'c8',
    title: '归并排序与逆序对',
    level: '较难',
    desc: `
      <h2>题目</h2>
      <p>实现归并排序，对 <code>49 38 65 97 76 13 27</code> 排序，然后输出结果；再用归并的思想求 <code>5 4 3 2 1</code> 的逆序对数。</p>
      <pre><code>sorted: 13 27 38 49 65 76 97
inversions of [5,4,3,2,1] = 10</code></pre>
      <h2>要求</h2>
      <ul>
        <li>辅助数组只开一次，别在递归里 malloc。</li>
        <li>逆序对在合并时统计：右边先出时，左边剩余个数就是新增逆序对。</li>
      </ul>
    `,
    starter: `#include <stdio.h>
#include <stdlib.h>

int tmp[64];

void mergeSort(int *a, int low, int high) {
    // TODO
}

long countInv(int *a, int low, int high) {
    // TODO: 返回逆序对数（会修改 a）
    return 0;
}

int main(void) {
    int a[] = {49, 38, 65, 97, 76, 13, 27};
    int n = 7;
    mergeSort(a, 0, n - 1);

    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");

    int b[] = {5, 4, 3, 2, 1};
    printf("inversions of [5,4,3,2,1] = %ld\\n", countInv(b, 0, 4));
    return 0;
}`,
    solution: `#include <stdio.h>
#include <stdlib.h>

int tmp[64];

void mergeSort(int *a, int low, int high) {
    if (low >= high) return;
    int mid = low + (high - low) / 2;
    mergeSort(a, low, mid);
    mergeSort(a, mid + 1, high);

    int i = low, j = mid + 1, k = low;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];
    while (j <= high) tmp[k++] = a[j++];
    for (int t = low; t <= high; t++) a[t] = tmp[t];
}

long countInv(int *a, int low, int high) {
    if (low >= high) return 0;
    int mid = low + (high - low) / 2;
    long cnt = countInv(a, low, mid) + countInv(a, mid + 1, high);

    int i = low, j = mid + 1, k = low;
    while (i <= mid && j <= high) {
        if (a[i] <= a[j]) {
            tmp[k++] = a[i++];
        } else {
            tmp[k++] = a[j++];
            cnt += (mid - i + 1);
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
    mergeSort(a, 0, n - 1);

    printf("sorted:");
    for (int i = 0; i < n; i++) printf(" %d", a[i]);
    printf("\\n");

    int b[] = {5, 4, 3, 2, 1};
    printf("inversions of [5,4,3,2,1] = %ld\\n", countInv(b, 0, 4));
    return 0;
}`,
    expected: `sorted: 13 27 38 49 65 76 97
inversions of [5,4,3,2,1] = 10`,
    hints: [
      '合并时 `a[i] <= a[j]` 用 <= 才稳定。',
      '逆序对：`cnt += mid - i + 1` 表示左边剩下的所有元素都比 a[j] 大。'
    ]
  }

  );
})();
