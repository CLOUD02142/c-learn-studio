/* ============================================================
   第 1 章（下）：数组、指针、字符串、结构体、动态内存、文件、预处理
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  {
    id: 'c-array',
    ch: 'c1',
    title: '数组：连续内存、越界与传参退化',
    tag: '必学',
    brief: '数组名是首元素地址，传进函数就退化，长度信息会丢。',
    tags: ['数组', '二维数组', '下标', '越界', '退化', 'sizeof'],
    body: `
      <h2>内存是连续的</h2>
      <p><code>int a[5]</code> 在内存里就是 5 个连续的 int，总共 20 字节。<code>a[i]</code> 的地址 = <code>a 的地址 + i * sizeof(int)</code>。这个"连续 + 偏移"就是数组能 O(1) 随机访问的全部秘密，也是后面顺序表的基础。</p>

      <h2>初始化</h2>
      <pre><code>int a[5];                      // 栈上，内容全是垃圾值
int b[5] = {0};                // 全部为 0（常用技巧）
int c[5] = {1, 2};             // c[0]=1, c[1]=2, 其余补 0
int d[] = {1, 2, 3};           // 长度自动 = 3
int m[2][3] = {{1,2,3},{4,5,6}};</code></pre>

      <h2>二维数组的内存布局</h2>
      <p><code>int m[2][3]</code> 在内存里是<strong>一行接一行</strong>线性排列的：<code>m[0][0] m[0][1] m[0][2] m[1][0]...</code>。所以 <code>m[i][j]</code> = 第 <code>i*3+j</code> 个元素。按行访问比按列访问快，因为 CPU 缓存喜欢连续地址。</p>

      <h2>传参退化（考点）</h2>
      <pre><code>void f(int a[5]) { sizeof(a); }   // 这里 sizeof(a) 是 8（指针大小），不是 20</code></pre>
      <p><strong>数组作为参数会退化成指针，长度信息完全丢失。</strong>所以标准写法是额外传一个长度：<code>void f(int a[], int n)</code>。这也是为什么数据结构里的顺序表必须用一个结构体把"数组 + 长度"绑在一起。</p>

      <h2>越界不会报错，只会出事</h2>
      <p>C 不检查下标。越界读是垃圾值，越界写可能改掉别的变量甚至崩溃，而且往往当时不崩，几行之后才崩——这就是最难查的那类 bug。</p>
    `,
    code: `#include <stdio.h>

#define N 5

// 数组传参会退化成指针，所以必须额外传长度
double average(int arr[], int n) {
    int sum = 0;
    for (int i = 0; i < n; i++) sum += arr[i];
    return (double)sum / n;
}

// 原地逆置：双指针向中间靠
void reverse(int arr[], int n) {
    int i = 0, j = n - 1;
    while (i < j) {
        int t = arr[i];
        arr[i] = arr[j];
        arr[j] = t;
        i++;
        j--;
    }
}

int main(void) {
    int a[N] = {3, 1, 4, 1, 5};
    printf("a 占 %zu 字节，元素 %zu 个\\n", sizeof(a), sizeof(a) / sizeof(a[0]));

    printf("原数组：");
    for (int i = 0; i < N; i++) printf("%d ", a[i]);
    printf("\\n平均值：%.2f\\n", average(a, N));

    reverse(a, N);
    printf("逆置后：");
    for (int i = 0; i < N; i++) printf("%d ", a[i]);
    printf("\\n");

    // 二维数组按行连续存储
    int m[2][3] = {{1, 2, 3}, {4, 5, 6}};
    printf("\\n二维数组按行展开：");
    for (int i = 0; i < 2; i++)
        for (int j = 0; j < 3; j++)
            printf("%d ", m[i][j]);
    printf("\\nm 一共 %zu 字节 = 2*3*4\\n", sizeof(m));
    printf("m[1][2] 的地址偏移：%d 个 int\\n", (int)(&m[1][2] - &m[0][0]));
    return 0;
}`,
    tips: [
      '只初始化全部为 0 时写 `= {0}`，这是最省事的写法。',
      '遍历数组时把 `strlen`/`sizeof` 提前算好存变量，别放在循环条件里重复计算。'
    ],
    traps: [
      '`int n = 5; int a[n];` 是变长数组（C99），栈上分配，n 太大会爆栈。',
      '`sizeof(arr)/sizeof(arr[0])` 写在函数内部算的是指针大小，永远得 2（64 位）。'
    ],
    exercises: ['ex-array-reverse']
  },

  {
    id: 'c-pointer',
    ch: 'c1',
    title: '指针：C 语言的分水岭',
    tag: '必学·重点',
    brief: '指针就是地址。&取地址、*解引用、指针运算按类型大小走。',
    tags: ['指针', '地址', '解引用', '指针运算', 'NULL', '值传递', '地址传递'],
    body: `
      <h2>先把三个符号分清</h2>
      <table>
        <tr><th>写法</th><th>含义</th></tr>
        <tr><td><code>int *p;</code></td><td>声明：p 是"指向 int 的指针"</td></tr>
        <tr><td><code>&amp;x</code></td><td>取地址：x 在内存里的门牌号</td></tr>
        <tr><td><code>*p</code></td><td>解引用：顺着地址找到那个变量</td></tr>
      </table>
      <p><code>int *p = &amp;x;</code> 之后，<code>*p</code> 和 <code>x</code> 就是同一块内存的两个名字，改哪个另一个都变。</p>

      <h2>指针运算按"类型大小"走</h2>
      <p><code>p + 1</code> 不是地址加 1 字节，而是加 <code>sizeof(*p)</code> 字节。int 指针 +1 前进 4 字节，char 指针 +1 前进 1 字节。这就是数组下标能用指针实现的原因：<code>a[i]</code> 等价于 <code>*(a + i)</code>。</p>

      <h2>为什么函数改不了实参？</h2>
      <p>C 是<strong>值传递</strong>：函数拿到的是实参的副本。想改外面的变量，必须把地址传进去，让函数通过地址去改。</p>
      <pre><code>void bad(int x)  { x = 100; }        // 外面不变
void good(int *p){ *p = 100; }       // 外面变了</code></pre>
      <div class="warn">链表、树、图的所有操作都依赖"传指针"这一招。<strong>指针没过关，第 2 章开始就是天书。</strong></div>

      <h2>NULL 与野指针</h2>
      <ul>
        <li><code>int *p = NULL;</code> 是"我不指向任何地方"，解引用它会崩——但至少崩得干脆。</li>
        <li><code>int *p;</code> 不初始化是野指针，里面是随机地址，解引用可能不崩但改坏别人的内存，更可怕。</li>
        <li>规矩：<strong>指针定义时就初始化</strong>，<strong>free 之后立刻置 NULL</strong>。</li>
      </ul>
    `,
    code: `#include <stdio.h>

// 值传递：改不了外面
void change_by_value(int x) {
    x = 100;
    printf("  函数内 x 的地址 %p，值改成 %d\\n", (void *)&x, x);
}

// 地址传递：能改外面
void change_by_pointer(int *p) {
    *p = 100;
    printf("  函数内 p 指向 %p\\n", (void *)p);
}

int main(void) {
    int x = 10;
    int *p = &x;

    printf("x = %d，x 的地址 = %p\\n", x, (void *)&x);
    printf("*p = %d，p 的值 = %p\\n\\n", *p, (void *)p);

    *p = 20;                        // 通过指针改 x
    printf("执行 *p = 20 后，x = %d\\n\\n", x);

    printf("值传递：\\n");
    change_by_value(x);
    printf("  回来后 x = %d（没变）\\n\\n", x);

    printf("地址传递：\\n");
    change_by_pointer(&x);
    printf("  回来后 x = %d（变了）\\n\\n", x);

    // 指针运算按类型大小走
    int a[4] = {10, 20, 30, 40};
    int *q = a;                     // 数组名就是首元素地址
    printf("q   -> %d\\n", *q);
    printf("q+1 -> %d（地址加了 %zu 字节）\\n", *(q + 1), sizeof(int));
    printf("q+3 -> %d\\n", *(q + 3));
    printf("a[2] == *(a+2) ? %s\\n", (a[2] == *(a + 2)) ? "成立" : "不成立");

    char s[] = "ABC";
    char *cp = s;
    printf("\\nchar 指针 +1 只前进 1 字节：%c\\n", *(cp + 2));

    int *np = NULL;
    printf("\\nNULL 指针的值：%p（解引用它会崩，所以别解）\\n", (void *)np);
    return 0;
}`,
    tips: [
      '画图。真的，拿纸画方框和箭头，指针这一章画两遍就通了。',
      '看到 `int *p` 读成"p 指向 int"，`int **p` 读成"p 指向（指向 int 的指针）"。'
    ],
    traps: [
      '`*p++` 是 `*(p++)`：先取 *p，再让 p 后移。不是 `(*p)++`。',
      '函数返回局部变量的地址是致命错误——函数一结束那块栈就被回收了。'
    ]
  },

  {
    id: 'c-pointer2',
    ch: 'c1',
    title: '指针进阶：指针数组、数组指针、二级指针、函数指针',
    tag: '重点',
    brief: 'int *p[3] 和 int (*p)[3] 的区别，看括号就知道。',
    tags: ['指针数组', '数组指针', '二级指针', '函数指针', 'qsort', '回调'],
    body: `
      <h2>一眼看穿声明</h2>
      <p>规则：<strong>从变量名出发，先看括号里，再看右边，再看左边</strong>。</p>
      <table>
        <tr><th>声明</th><th>读法</th><th>用途</th></tr>
        <tr><td><code>int *p[3]</code></td><td>p 是数组，3 个元素，每个是 int*</td><td>指针数组：存一堆字符串</td></tr>
        <tr><td><code>int (*p)[3]</code></td><td>p 是指针，指向含 3 个 int 的数组</td><td>数组指针：二维数组的行指针</td></tr>
        <tr><td><code>int **p</code></td><td>p 指向 int*</td><td>二级指针：改指针本身、动态二维数组</td></tr>
        <tr><td><code>int (*f)(int,int)</code></td><td>f 是指针，指向函数</td><td>函数指针：回调、策略模式</td></tr>
      </table>

      <h2>二级指针什么时候必须用</h2>
      <p>当你需要<strong>修改一个指针变量的值</strong>时。比如单链表的头插：</p>
      <pre><code>void insertHead(LNode **head, int x);   // 头指针本身要变，所以传它的地址</code></pre>
      <p>如果只传 <code>LNode *head</code>，函数里改的是副本，外面的头指针根本没动。这是链表写不对的头号原因。</p>

      <h2>函数指针与回调</h2>
      <p>标准库的 <code>qsort</code> 就是靠函数指针实现"通用排序"：你给它一个比较函数，它按你的规则排。这是 C 里唯一的"多态"手段。</p>
      <pre><code>int cmp(const void *a, const void *b) {
    return *(int*)a - *(int*)b;      // 升序
}
qsort(arr, n, sizeof(int), cmp);</code></pre>
      <p>比较函数必须返回 int：负表示 a 该在前，正表示 b 该在前，0 表示相等。想降序就把 a、b 反过来减。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int cmp_asc(const void *a, const void *b) {
    return (*(const int *)a) - (*(const int *)b);
}
int cmp_desc(const void *a, const void *b) {
    return (*(const int *)b) - (*(const int *)a);
}

// 函数指针做参数：传入"怎么算"
int apply(int a, int b, int (*op)(int, int)) {
    return op(a, b);
}
int add(int a, int b) { return a + b; }
int mul(int a, int b) { return a * b; }

void print_arr(const char *tag, int a[], int n) {
    printf("%s", tag);
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\\n");
}

int main(void) {
    // 指针数组：每个元素都是 char*
    const char *names[3] = {"C", "Data Structure", "Algorithm"};
    printf("指针数组：\\n");
    for (int i = 0; i < 3; i++)
        printf("  names[%d] -> \\"%s\\" (长度 %zu)\\n", i, names[i], strlen(names[i]));

    // 数组指针：指向一行（3 个 int）
    int m[2][3] = {{1, 2, 3}, {4, 5, 6}};
    int (*row)[3] = m;
    printf("\\n数组指针访问 m[1][2] = %d\\n", row[1][2]);
    printf("sizeof(*row) = %zu（一整行的大小）\\n", sizeof(*row));

    // 二级指针：修改变量里的指针值
    int value = 42;
    int *p = &value;
    int **pp = &p;
    printf("\\nvalue=%d, *p=%d, **pp=%d\\n", value, *p, **pp);
    int other = 99;
    *pp = &other;                   // 通过二级指针改了 p 本身
    printf("执行 *pp = &other 后，*p = %d\\n", *p);

    // 函数指针
    int arr[6] = {5, 2, 9, 1, 7, 3};
    print_arr("\\n原始：", arr, 6);

    int (*cmp)(const void *, const void *) = cmp_asc;
    qsort(arr, 6, sizeof(int), cmp);
    print_arr("升序：", arr, 6);

    cmp = cmp_desc;
    qsort(arr, 6, sizeof(int), cmp);
    print_arr("降序：", arr, 6);

    printf("\\n函数指针当参数：add=%d, mul=%d\\n", apply(3, 4, add), apply(3, 4, mul));
    return 0;
}`,
    tips: [
      '能用 `typedef` 就用：`typedef int (*CmpFn)(const void*, const void*);` 之后声明清爽多了。',
      '`qsort` 的比较函数里千万别写 `*(int*)a - *(int*)b` 处理大数，会溢出，改成比较大小返回 ±1。'
    ],
    traps: [
      '`int *p[3]` 和 `int (*p)[3]` 只差一对括号，含义完全不同，考试和真实 bug 都爱考这个。',
      '函数名本身就是函数指针，`qsort(a,n,s,cmp)` 不用写 `&cmp`，写了也对。'
    ]
  },

  {
    id: 'c-string',
    ch: 'c1',
    title: '字符数组与字符串：\\0 是命根子',
    tag: '必学',
    brief: 'C 没有字符串类型，只有以 \\0 结尾的字符数组。手写一遍 strlen/strcpy/strcmp。',
    tags: ['字符串', 'char数组', '\\0', 'strlen', 'strcpy', 'strcmp', 'strcat'],
    body: `
      <h2>C 的字符串 = char 数组 + 结尾的 '\\0'</h2>
      <p><code>char s[] = "abc";</code> 实际占 4 个字节：<code>'a' 'b' 'c' '\\0'</code>。<code>strlen(s)</code> 返回 3（不含 <code>\\0</code>），<code>sizeof(s)</code> 返回 4（含 <code>\\0</code>）。<strong>这个区别考试必考。</strong></p>
      <div class="warn">所以给字符串开数组时，长度一定要多算一位放 <code>\\0</code>。少这一位就是经典溢出。</div>

      <h2>常用函数（记住它们在哪个头文件）</h2>
      <table>
        <tr><th>函数</th><th>作用</th><th>注意</th></tr>
        <tr><td><code>strlen(s)</code></td><td>长度，O(n)</td><td>每次调用都从头数，别放循环条件里</td></tr>
        <tr><td><code>strcpy(d, s)</code></td><td>复制</td><td>不检查 d 的容量，危险，用 <code>strncpy</code></td></tr>
        <tr><td><code>strcmp(a, b)</code></td><td>比较</td><td>返回 0 才相等，别用 <code>==</code> 比字符串</td></tr>
        <tr><td><code>strcat(d, s)</code></td><td>拼接</td><td>同样有溢出风险</td></tr>
        <tr><td><code>strchr(s, c)</code></td><td>找字符</td><td>返回指针，找不到返回 NULL</td></tr>
      </table>

      <h2>四个必须会手写的函数</h2>
      <p>面试和考试都爱让你手写，因为这几行代码把指针玩明白了：</p>
      <pre><code>size_t my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;          // 一直走到 '\\0'
    return p - s;            // 指针相减 = 元素个数
}</code></pre>
      <div class="note">下面程序把这四个都实现了，然后跟标准库的结果对比。自己先遮住代码写一遍，再对答案。</div>
    `,
    code: `#include <stdio.h>
#include <string.h>

size_t my_strlen(const char *s) {
    const char *p = s;
    while (*p) p++;
    return (size_t)(p - s);
}

char *my_strcpy(char *dst, const char *src) {
    char *p = dst;
    while ((*p++ = *src++) != '\\0')
        ;
    return dst;
}

int my_strcmp(const char *a, const char *b) {
    while (*a && *a == *b) {
        a++;
        b++;
    }
    return (unsigned char)*a - (unsigned char)*b;
}

char *my_strcat(char *dst, const char *src) {
    char *p = dst;
    while (*p) p++;
    while ((*p++ = *src++) != '\\0')
        ;
    return dst;
}

int main(void) {
    char s[] = "hello";
    printf("s = \\"%s\\"\\n", s);
    printf("strlen = %zu, sizeof = %zu  <- 差一个 '\\\\0'\\n", strlen(s), sizeof(s));

    printf("\\n手写 vs 标准库：\\n");
    printf("my_strlen  = %zu\\n", my_strlen(s));
    printf("strlen     = %zu\\n", strlen(s));

    char buf1[32], buf2[32];
    my_strcpy(buf1, s);
    strcpy(buf2, s);
    printf("my_strcpy  = \\"%s\\" / strcpy = \\"%s\\"\\n", buf1, buf2);

    printf("\\n比较：\\n");
    const char *x = "apple", *y = "apply";
    printf("my_strcmp(\\"%s\\",\\"%s\\") = %d\\n", x, y, my_strcmp(x, y));
    printf("strcmp    = %d\\n", strcmp(x, y));
    printf("相等判断要用 strcmp == 0，不能 == 比地址\\n");

    my_strcat(buf1, " world");
    printf("\\n拼接后：\\"%s\\"（长度 %zu）\\n", buf1, strlen(buf1));

    // 常用函数
    printf("\\nstrchr(\\"hello world\\", 'w') -> \\"%s\\"\\n", strchr("hello world", 'w'));
    printf("strstr(\\"hello world\\", \\"lo w\\") -> \\"%s\\"\\n", strstr("hello world", "lo w"));
    printf("strncmp(\\"hello\\",\\"help\\",3) = %d（比前 3 个字符）\\n", strncmp("hello", "help", 3));
    return 0;
}`,
    tips: [
      '判空用 `if (s[0] == \'\\0\')`，别用 `if (s == NULL)`，那是判指针。',
      '读一整个字符串（含空格）用 `fgets(buf, sizeof(buf), stdin)`。'
    ],
    traps: [
      '`char *s = "abc"; s[0] = \'A\';` 会崩，字符串字面量在只读区。要改就写 `char s[] = "abc";`。',
      '`if (s1 == s2)` 比较的是地址，永远不相等（除非同一个指针）。用 `strcmp`。'
    ],
    exercises: ['ex-string-len']
  },

  {
    id: 'c-struct',
    ch: 'c1',
    title: '结构体与内存对齐（链表结点的定义方式）',
    tag: '必学·重点',
    brief: 'struct 把不同类型绑在一起；-> 是 (*p). 的糖；对齐会插填充字节。',
    tags: ['结构体', 'struct', 'typedef', '内存对齐', '自引用', '指针成员'],
    body: `
      <h2>定义与使用</h2>
      <pre><code>struct Student {
    int  id;
    char name[20];
    double score;
};
struct Student s = {1, "Tom", 92.5};
struct Student *p = &amp;s;
printf("%s", p-&gt;name);      // p-&gt;name 等价于 (*p).name</code></pre>

      <h2>typedef 让命名短一点</h2>
      <pre><code>typedef struct Student {
    int id;
    char name[20];
} Student;                  // 之后可以直接写 Student s;

typedef struct LNode {
    int data;
    struct LNode *next;     // 自引用必须写 struct LNode *，不能写 LNode *
} LNode, *LinkList;</code></pre>
      <p>最后那行是数据结构教材的标准写法：<code>LNode</code> 是结点，<code>LinkList</code> 是指向结点的指针。看代码时把它当成"<code>LinkList</code> 就是头指针类型"就行。</p>

      <h2>内存对齐：为什么 sizeof 比你想的大</h2>
      <p>CPU 访问对齐的地址更快，所以编译器会自动插入填充字节。规则：</p>
      <ul>
        <li>每个成员的起始偏移必须是它自身大小的整数倍。</li>
        <li>结构体总大小必须是最大成员大小的整数倍（结尾补 padding）。</li>
      </ul>
      <table>
        <tr><th>结构体</th><th>直觉大小</th><th>实际大小</th></tr>
        <tr><td><code>{char; int;}</code></td><td>5</td><td>8（char 后补 3）</td></tr>
        <tr><td><code>{int; char;}</code></td><td>5</td><td>8（char 后补 3）</td></tr>
        <tr><td><code>{char; double; char;}</code></td><td>10</td><td>24</td></tr>
      </table>
      <p>优化技巧：<strong>把小的成员放一起、大的放前面</strong>，能省内存。极端场景用 <code>#pragma pack(1)</code> 关闭对齐（网络协议、文件格式），但会变慢。</p>
    `,
    code: `#include <stdio.h>
#include <stddef.h>

typedef struct {
    char   tag;
    int    id;
    double score;
    char   grade;
} Student;

typedef struct Node {
    int data;
    struct Node *next;      // 自引用：必须写 struct Node *
} Node;

// 结构体传参：传指针避免拷贝整个结构体
void print_student(const Student *s) {
    printf("%s%d%s%.1f%s%c%s\\n", "  id=", s->id, ", score=", s->score,
           ", grade=", s->grade, "");
}

int main(void) {
    Student s = {.tag = 'A', .id = 1001, .score = 92.5, .grade = 'A'};
    printf("结构体总大小：%zu 字节\\n", sizeof(Student));
    printf("各成员偏移：tag=%zu, id=%zu, score=%zu, grade=%zu\\n",
           offsetof(Student, tag), offsetof(Student, id),
           offsetof(Student, score), offsetof(Student, grade));
    printf("如果不做对齐，只需要 %zu 字节，多了 %zu 字节填充\\n\\n",
           sizeof(char) + sizeof(int) + sizeof(double) + sizeof(char),
           sizeof(Student) - (sizeof(char) + sizeof(int) + sizeof(double) + sizeof(char)));

    print_student(&s);

    // 自引用结构体：手动串一个三结点链表
    Node n3 = {3, NULL};
    Node n2 = {2, &n3};
    Node n1 = {1, &n2};

    printf("\\n链表遍历（不用 malloc）：");
    for (Node *p = &n1; p != NULL; p = p->next) {
        printf("%d", p->data);
        if (p->next) printf(" -> ");
    }
    printf("\\n");

    // 结构体数组
    Student cls[3] = {
        {'B', 2, 78.0, 'C'},
        {'A', 1, 95.0, 'A'},
        {'C', 3, 61.5, 'D'}
    };
    printf("\\n结构体数组：\\n");
    double sum = 0;
    for (int i = 0; i < 3; i++) {
        print_student(&cls[i]);
        sum += cls[i].score;
    }
    printf("  平均分 = %.1f\\n", sum / 3);

    // 结点大小：指针 8 字节，前面会有 4 字节填充
    printf("\\n一个链表结点占 %zu 字节（int 4 + 填充 4 + 指针 8）\\n", sizeof(Node));
    return 0;
}`,
    tips: [
      '初始化时用指定成员写法 `.id = 1`，可读性远好于按顺序堆一排数字。',
      '结构体比较大时，函数参数传 `const Student *s`，别传值（传值要复制整个结构体）。'
    ],
    traps: [
      '`p.name` 是错的，p 是指针必须用 `p->name`。',
      '`typedef struct LNode { LNode *next; } LNode;` 编译不过，内部必须写 `struct LNode *next;`。'
    ],
    exercises: ['ex-struct-avg']
  },

  {
    id: 'c-union-enum',
    ch: 'c1',
    title: '共用体、枚举、typedef 与位域',
    tag: '了解',
    brief: 'union 所有成员共用一块内存；enum 让魔法数字有名字。',
    tags: ['union', 'enum', '共用体', '枚举', 'typedef', '位域'],
    body: `
      <h2>union：同一块内存，不同解释方式</h2>
      <p>所有成员共享同一块内存，大小 = 最大成员的大小。改一个成员，其他成员的值跟着变（因为它们看的是同一段字节）。</p>
      <pre><code>union U { int i; char c[4]; float f; };   // 大小 4 字节
union U u;
u.i = 0x41424344;      // 小端机器上，c[0] 会变成 'D'</code></pre>
      <p>用途：类型双关（看一个 float 的二进制位）、协议解析、节省内存的变体记录。</p>

      <h2>enum：给整数起名字</h2>
      <pre><code>typedef enum { RED, GREEN, BLUE } Color;   // 0, 1, 2
typedef enum { OK = 0, ERROR = -1 } Status;</code></pre>
      <p>数据结构教材里到处是 <code>typedef int Status;</code> 加 <code>#define OK 1</code>，本质是同一件事。枚举的好处是编译期有类型检查、调试器能显示名字。</p>

      <h2>typedef：给类型起别名</h2>
      <p>它不产生新类型，只是别名。最大的价值是简化复杂声明，尤其是结构体和函数指针。</p>

      <h2>位域：按位挤内存</h2>
      <pre><code>struct Flags {
    unsigned int isLeaf : 1;      // 占 1 位
    unsigned int color  : 3;      // 占 3 位
    unsigned int level  : 4;      // 占 4 位
};</code></pre>
      <p>位域在实际工程里用来压状态标志，缺点是布局依赖编译器、取地址不合法。考试里知道概念就行。</p>
    `,
    code: `#include <stdio.h>

typedef enum { RED, GREEN, BLUE } Color;
typedef enum { OK = 0, ERROR = -1, OVERFLOW = -2 } Status;

union Number {
    int   i;
    float f;
    unsigned char bytes[4];
};

typedef struct {
    unsigned int is_leaf : 1;
    unsigned int color   : 2;
    unsigned int level   : 5;
} NodeFlag;

const char *color_name(Color c) {
    switch (c) {
    case RED:   return "RED";
    case GREEN: return "GREEN";
    case BLUE:  return "BLUE";
    default:    return "UNKNOWN";
    }
}

int main(void) {
    printf("枚举就是整数：RED=%d GREEN=%d BLUE=%d\\n", RED, GREEN, BLUE);
    for (Color c = RED; c <= BLUE; c++)
        printf("  %d -> %s\\n", c, color_name(c));

    printf("Status: OK=%d ERROR=%d\\n\\n", OK, ERROR);

    union Number n;
    printf("union 大小 = %zu 字节（成员里最大的那个）\\n", sizeof(union Number));
    n.i = 0x41424344;
    printf("n.i = 0x%X\\n", n.i);
    printf("按字节看：%02X %02X %02X %02X（小端：低位在前）\\n",
           n.bytes[0], n.bytes[1], n.bytes[2], n.bytes[3]);
    printf("当字符看：%c%c%c%c\\n", n.bytes[3], n.bytes[2], n.bytes[1], n.bytes[0]);

    n.f = 1.0f;
    printf("\\nn.f = 1.0f，同一块内存的整数值 = 0x%X（IEEE754 编码）\\n", n.i);

    NodeFlag flag;
    flag.is_leaf = 1;
    flag.color = BLUE;
    flag.level = 12;
    printf("\\n位域：is_leaf=%u color=%u level=%u\\n", flag.is_leaf, flag.color, flag.level);
    printf("整个结构体只占 %zu 字节（正常要 12 字节）\\n", sizeof(NodeFlag));
    return 0;
}`,
    tips: [
      '联合体 + 枚举 + 结构体组合，就是 C 里实现"多态记录"的经典手法（tag 决定 union 里哪个成员有效）。',
      '`typedef` 别名别滥用，`typedef int MyInt;` 除了让同事看不懂没有任何好处。'
    ],
    traps: [
      'union 里存了 int，用 float 读出来是未定义行为的边界地带，实际结果依赖平台字节序。',
      '位域不能取地址（`&flag.level` 非法），也不能跨平台保证布局。'
    ]
  },

  {
    id: 'c-malloc',
    ch: 'c1',
    title: '动态内存：malloc / free 与内存泄漏',
    tag: '必学·重点',
    brief: '堆上内存要自己申请、自己释放。链表的每个结点都靠它。',
    tags: ['malloc', 'free', 'calloc', 'realloc', '堆', '内存泄漏', '野指针', '柔性数组'],
    body: `
      <h2>四个函数</h2>
      <table>
        <tr><th>函数</th><th>作用</th><th>是否清零</th></tr>
        <tr><td><code>malloc(n)</code></td><td>申请 n 字节</td><td>不清零（垃圾值）</td></tr>
        <tr><td><code>calloc(k, n)</code></td><td>申请 k 个 n 字节</td><td><strong>清零</strong></td></tr>
        <tr><td><code>realloc(p, n)</code></td><td>把 p 扩/缩到 n 字节</td><td>新区域不清零</td></tr>
        <tr><td><code>free(p)</code></td><td>归还内存</td><td>——</td></tr>
      </table>
      <pre><code>int *a = (int *)malloc(sizeof(int) * n);
if (a == NULL) { /* 处理失败 */ }
a[0] = 1;
free(a);
a = NULL;           // 防悬空指针</code></pre>

      <h2>四条铁律</h2>
      <ol>
        <li><strong>必须检查 NULL</strong>：申请失败返回 NULL，直接解引用就是段错误。</li>
        <li><strong>malloc 和 free 必须配对</strong>：申请了不还 = 内存泄漏，跑久了程序吃满内存。</li>
        <li><strong>free 之后置 NULL</strong>：否则那块地址可能被别的地方复用，你再写就是踩别人。</li>
        <li><strong>不能 free 栈上的地址</strong>：<code>int a[10]; free(a);</code> 直接崩。</li>
      </ol>

      <h2>链表的结点就是这么来的</h2>
      <pre><code>LNode *p = (LNode *)malloc(sizeof(LNode));
p->data = 1;
p->next = NULL;</code></pre>
      <p>为什么必须用堆？因为函数里的局部变量出了作用域就销毁了，而链表结点要活到你自己决定删它为止。<strong>这就是"动态"的含义。</strong></p>

      <h2>realloc 的正确写法</h2>
      <pre><code>int *tmp = (int *)realloc(a, sizeof(int) * new_n);
if (tmp == NULL) { /* a 还在，别丢 */ }
else a = tmp;</code></pre>
      <p>别直接写 <code>a = realloc(a, ...)</code>，失败时原指针丢了，原内存也泄漏了。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node *next;
} Node;

int main(void) {
    // 1. 动态数组
    int n = 5;
    int *a = (int *)malloc(sizeof(int) * n);
    if (a == NULL) {
        printf("申请失败\\n");
        return 1;
    }
    for (int i = 0; i < n; i++) a[i] = (i + 1) * 10;
    printf("malloc 的数组（未清零时是垃圾值，这里已逐个赋值）：");
    for (int i = 0; i < n; i++) printf("%d ", a[i]);
    printf("\\n");

    // 2. realloc 扩容
    int new_n = 8;
    int *tmp = (int *)realloc(a, sizeof(int) * new_n);
    if (tmp == NULL) {
        free(a);
        printf("扩容失败\\n");
        return 1;
    }
    a = tmp;
    for (int i = n; i < new_n; i++) a[i] = (i + 1) * 10;
    printf("realloc 扩容到 %d 个：", new_n);
    for (int i = 0; i < new_n; i++) printf("%d ", a[i]);
    printf("\\n");
    free(a);
    a = NULL;

    // 3. calloc 自动清零
    int *b = (int *)calloc(5, sizeof(int));
    printf("\\ncalloc 的数组（全 0）：");
    for (int i = 0; i < 5; i++) printf("%d ", b[i]);
    printf("\\n");
    free(b);
    b = NULL;

    // 4. 用堆建一个三结点链表
    Node *head = NULL;
    for (int i = 1; i <= 3; i++) {
        Node *node = (Node *)malloc(sizeof(Node));
        if (node == NULL) return 1;
        node->data = i * 100;
        node->next = head;      // 头插
        head = node;
    }
    printf("\\n堆上的链表：");
    for (Node *p = head; p != NULL; p = p->next)
        printf("%d%s", p->data, p->next ? " -> " : "\\n");

    // 5. 逐个释放（顺序：先存 next，再 free 当前）
    Node *p = head;
    while (p != NULL) {
        Node *next = p->next;
        free(p);
        p = next;
    }
    head = NULL;
    printf("所有结点已释放\\n");
    return 0;
}`,
    tips: [
      '写完 malloc 就顺手把 free 也写上，别等"最后再补"，最后一定忘。',
      '调试时可以用 `calloc` 代替 `malloc`，至少垃圾值变成 0，问题更容易暴露位置。'
    ],
    traps: [
      '`malloc(sizeof(int *))` 只申请了 8 字节，你想要的是 `sizeof(int)`，这类笔误极其常见。',
      '`free(p); free(p);` 双重释放会直接崩，所以 free 后置 NULL 不只是好习惯，是保命。'
    ],
    exercises: ['ex-malloc-array']
  },

  {
    id: 'c-file',
    ch: 'c1',
    title: '文件读写：把数据存下来',
    tag: '了解',
    brief: 'fopen/fclose、fprintf/fscanf、fgets，以及为什么要检查返回值。',
    tags: ['文件', 'fopen', 'fclose', 'fprintf', 'fgets', 'fread'],
    body: `
      <h2>基本套路</h2>
      <pre><code>FILE *fp = fopen("data.txt", "w");
if (fp == NULL) { perror("fopen"); return 1; }
fprintf(fp, "%d %s\\n", 1, "hello");
fclose(fp);            // 不关可能丢数据（缓冲区没刷）</code></pre>

      <h2>打开模式</h2>
      <table>
        <tr><th>模式</th><th>含义</th><th>文件不存在时</th></tr>
        <tr><td><code>"r"</code></td><td>只读</td><td>失败，返回 NULL</td></tr>
        <tr><td><code>"w"</code></td><td>只写，清空原内容</td><td>新建</td></tr>
        <tr><td><code>"a"</code></td><td>追加</td><td>新建</td></tr>
        <tr><td><code>"r+"</code></td><td>读写</td><td>失败</td></tr>
        <tr><td><code>"rb"/"wb"</code></td><td>二进制模式</td><td>Windows 下必须加 b</td></tr>
      </table>

      <h2>文本 vs 二进制</h2>
      <ul>
        <li>文本：<code>fprintf</code>/<code>fscanf</code>/<code>fgets</code>，人能读，适合配置、日志、OJ 数据。</li>
        <li>二进制：<code>fwrite</code>/<code>fread</code>，原样搬内存，适合结构体数组，但跨平台有字节序和对齐问题。</li>
      </ul>

      <h2>读文件的正确姿势</h2>
      <pre><code>char line[256];
while (fgets(line, sizeof(line), fp) != NULL) {
    // 处理每一行，注意可能带换行符
}
fclose(fp);</code></pre>
      <p>别用 <code>while (!feof(fp))</code>，它在文件末尾会多读一次，这是 C 语言最经典的坑之一。</p>
      <div class="note">下面程序在当前目录写一个文件再读回来。文件会建在临时目录里，不影响你的电脑。</div>
    `,
    code: `#include <stdio.h>
#include <string.h>

typedef struct {
    int  id;
    char name[16];
    double score;
} Student;

int main(void) {
    const char *path = "students.txt";

    // ---------- 写 ----------
    Student cls[3] = {
        {1, "Tom", 91.5},
        {2, "Jerry", 85.0},
        {3, "Lucy", 78.5}
    };

    FILE *fp = fopen(path, "w");
    if (fp == NULL) {
        printf("无法创建文件\\n");
        return 1;
    }
    fprintf(fp, "%d\\n", 3);                 // 先写条数
    for (int i = 0; i < 3; i++)
        fprintf(fp, "%d %s %.1f\\n", cls[i].id, cls[i].name, cls[i].score);
    fclose(fp);
    printf("已写入 %s\\n", path);

    // ---------- 读 ----------
    fp = fopen(path, "r");
    if (fp == NULL) {
        printf("打不开文件\\n");
        return 1;
    }
    int n = 0;
    if (fscanf(fp, "%d", &n) != 1) {
        fclose(fp);
        printf("格式不对\\n");
        return 1;
    }
    printf("读到 %d 条记录：\\n", n);
    double sum = 0;
    for (int i = 0; i < n; i++) {
        Student s;
        if (fscanf(fp, "%d %15s %lf", &s.id, s.name, &s.score) != 3) break;
        printf("  #%d  %-6s %.1f\\n", s.id, s.name, s.score);
        sum += s.score;
    }
    fclose(fp);
    printf("平均分 %.2f\\n", sum / n);

    // ---------- 按行读 ----------
    fp = fopen(path, "r");
    char line[128];
    int lineNo = 0;
    printf("\\n按行读（fgets）：\\n");
    while (fgets(line, sizeof(line), fp) != NULL) {
        line[strcspn(line, "\\n")] = '\\0';
        printf("  第 %d 行：[%s]\\n", ++lineNo, line);
    }
    fclose(fp);

    // ---------- 追加 ----------
    fp = fopen(path, "a");
    fprintf(fp, "4 Kate 88.0\\n");
    fclose(fp);
    printf("\\n已追加一行，用追加模式打开不会清空原内容\\n");
    return 0;
}`,
    tips: [
      '文件路径在 Windows 上要么用正斜杠 `"data/x.txt"`，要么双反斜杠 `"data\\\\x.txt"`。',
      '`fclose` 会刷新缓冲区，程序正常结束也会，但崩溃时不会——重要数据尽早 fflush。'
    ],
    traps: [
      '`fopen` 之后忘了判 NULL，文件不存在时后面所有操作都会崩。',
      '用 `feof` 做循环条件会多读一次，正确做法是判断读函数返回值。'
    ]
  },

  {
    id: 'c-macro',
    ch: 'c1',
    title: '预处理、宏与多文件工程',
    tag: '了解',
    brief: '带参宏一定要加括号；头文件要写 ifndef 保护；多文件编译要一起给。',
    tags: ['预处理', '#define', '宏', '条件编译', '头文件', 'extern', '多文件'],
    body: `
      <h2>预处理做了什么</h2>
      <p>在真正编译之前，预处理器只做文本替换：展开 <code>#include</code>、替换宏、处理条件编译、删注释。它不懂 C 语法，所以宏的坑都很"文本级"。</p>

      <h2>带参宏必须给每个参数和整体都加括号</h2>
      <pre><code>#define SQ_BAD(x)  x * x
#define SQ_OK(x)   ((x) * (x))

SQ_BAD(1 + 2)   // 展开成 1 + 2 * 1 + 2 = 5，不是 9
SQ_OK(1 + 2)    // 展开成 ((1+2) * (1+2)) = 9</code></pre>
      <div class="warn">宏没有类型检查、没法调试、不会短路。<strong>能用 const 和 inline 函数就别用宏。</strong>宏适合做常量、条件编译、以及 <code>#</code> / <code>##</code> 这类预处理操作。</div>

      <h2>头文件的正确写法</h2>
      <pre><code>#ifndef LIST_H
#define LIST_H
// 声明
#endif</code></pre>
      <p>这叫 include guard（或 <code>#pragma once</code>），防止同一个头文件被重复包含导致"重复定义"。</p>

      <h2>多文件编译</h2>
      <p>一个项目拆成 <code>main.c</code> + <code>list.c</code> + <code>list.h</code>，编译时要一起交给 gcc：</p>
      <pre><code>gcc main.c list.c -o app</code></pre>
      <p>本学习台只编译一个文件，所以下面的例子用 static 函数和宏模拟"私有"的概念。</p>

      <h2>几个好用的预定义宏</h2>
      <table>
        <tr><th>宏</th><th>含义</th></tr>
        <tr><td><code>__LINE__</code></td><td>当前行号</td></tr>
        <tr><td><code>__FILE__</code></td><td>当前文件名</td></tr>
        <tr><td><code>__func__</code></td><td>当前函数名（C99）</td></tr>
        <tr><td><code>__DATE__</code> <code>__TIME__</code></td><td>编译日期时间</td></tr>
      </table>
    `,
    code: `#include <stdio.h>

#define PI 3.14159
#define SQ_BAD(x)  x * x
#define SQ_OK(x)   ((x) * (x))
#define MAX(a, b)  ((a) > (b) ? (a) : (b))
#define STR(x)     #x              // 把参数变成字符串
#define CAT(a, b)  a##b            // 拼接标识符

// 调试开关：改成 0 就关掉日志
#define DEBUG 1
#if DEBUG
#define LOG(fmt, val) printf("[LOG %s:%d] " fmt "\\n", __FILE__, __LINE__, val)
#else
#define LOG(fmt, val) ((void)0)
#endif

// 模拟"私有"函数
static int internal_helper(int x) {
    return x * 2;
}

int main(void) {
    printf("PI = %f\\n", PI);

    printf("\\n宏的括号陷阱：\\n");
    printf("  SQ_BAD(1 + 2) = %d   <- 错，1+2*1+2\\n", SQ_BAD(1 + 2));
    printf("  SQ_OK(1 + 2)  = %d   <- 对\\n", SQ_OK(1 + 2));
    printf("  MAX(3, 7)     = %d\\n", MAX(3, 7));

    printf("\\n字符串化 STR(hello) = \\"%s\\"\\n", STR(hello));
    int CAT(my, var) = 42;
    printf("拼接 CAT(my, var) 得到变量 myvar = %d\\n", myvar);

    LOG("调试信息可以带参数：x=%d", myvar);

    printf("\\n预定义宏：\\n");
    printf("  文件：%s\\n", __FILE__);
    printf("  行号：%d\\n", __LINE__);
    printf("  编译日期：%s %s\\n", __DATE__, __TIME__);

    printf("\\nstatic 函数只能本文件用：%d\\n", internal_helper(21));

#ifdef _WIN32
    printf("\\n当前编译目标：Windows\\n");
#elif __linux__
    printf("\\n当前编译目标：Linux\\n");
#else
    printf("\\n当前编译目标：其他\\n");
#endif
    return 0;
}`,
    tips: [
      '常量优先用 `#define` 或 `enum`，别用魔数 `if (status == 3)` 这种。',
      '`#define` 后面别加分号，否则展开时会多一个分号，造成诡异的语法错误。'
    ],
    traps: [
      '`#define MAX(a,b) ((a)>(b)?(a):(b))` 里如果参数有 `i++`，会被求值两次。',
      '宏没有作用域，`#undef` 之前全局有效。'
    ]
  }

  );
})();
