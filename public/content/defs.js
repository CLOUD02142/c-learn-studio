/* ============================================================
   白话定义卡 —— 每个知识点一条

   为什么单独一个文件：正文 body 里讲的是"展开"，这里只负责"进门那一脚"。
   三条固定结构：
     plain    一句话说清它是什么（不用术语，或者当场把术语解释掉）
     analogy  打个比方（把抽象的关系搬到生活里）
     demo     最小可运行片段（3~6 行，看得完）

   写法约定：
     - 用单引号字符串，内部反引号会由 mdInline 渲染成行内代码
     - demo 用 String.raw，反斜杠才不会被 JS 吃掉
   ============================================================ */
(function () {
  'use strict';
  window.DEFS = {

    /* ---------------- 第 0 章 ---------------- */

    'w-welcome': {
      plain: '这个台子有四块地方：左边挑知识点，中间写代码，右边读讲解，下面看真实输出。看懂了就改一改代码再跑一次。',
      analogy: '像学车：右边是教练在讲，中间是方向盘在你手里，下面那块是仪表盘——你一动手，它立刻给反馈。',
      demo: String.raw`// 每节中间都已经放好了示例代码
// 按 Ctrl+Enter → 下面出现的是 gcc 真编译真跑出来的结果
// 把它改坏，看报错长什么样，比看十遍讲解管用`
    },

    'w-debug': {
      plain: '错误分三层：编译期错是"语法写错，程序根本没生成"；运行期错是"生成了，跑到一半崩了"；逻辑错是"跑完了，但结果不对"。三层要用三种不同的办法查。',
      analogy: '编译错＝作文有病句，老师直接打回；运行错＝车能打着火但半路抛锚；逻辑错＝一路顺风开到了隔壁城市。',
      demo: String.raw`// 1 编译期：scanf("%d", a);        ← 少了 &
// 2 运行期：int a[3]; a[5] = 1;     ← 越界，直接崩
// 3 逻辑错：sum = a[i];             ← 本想累加，写成了覆盖`
    },

    'w-complexity': {
      plain: '大 O 说的是"数据量 n 变大时，工作量涨得多快"。算的时候只留最高次项、丢掉常数系数——因为 n 一大，小项就不重要了。',
      analogy: '在仓库里找货：知道货架号就是 O(1)，顺着编号折半找是 O(log n)，一件件翻是 O(n)，两两配对比较是 O(n²)。货越多，差距越吓人。',
      demo: String.raw`O(1)      按下标取 a[i]
O(log n)  折半查找
O(n)      遍历一遍
O(n log n) 归并 / 快排（平均）
O(n^2)    双重循环`
    },

    /* ---------------- 第 1 章 C 语法 ---------------- */

    'c-hello': {
      plain: '一个 C 程序从 `main` 函数开始执行，`return 0` 是告诉操作系统"我正常结束了"。要打印东西就得先 `#include <stdio.h>`。',
      analogy: '`main` 是房子的大门，程序只能从大门进来；`return 0` 是出门时跟门卫说一句"我没事"，说别的数字就代表出事了。',
      demo: String.raw`#include <stdio.h>
int main(void) {
    printf("hi\n");   // \n 是换行
    return 0;
}`
    },

    'c-types': {
      plain: '类型决定两件事：这块内存占几个字节、这串 0/1 该怎么解释。`int` 是 4 字节整数，`double` 是 8 字节小数，`char` 只有 1 字节，本质是个小整数。',
      analogy: '同样一段录音，用正常速度放是说话，用 100 倍速放就是尖叫。内存里的 0/1 也一样，按整数读和按浮点读，结果完全不同。',
      demo: String.raw`printf("%zu %zu %zu\n",
       sizeof(int),     // 4
       sizeof(double),  // 8
       sizeof(char));   // 1`
    },

    'c-var': {
      plain: '变量就是内存里一块"起了名字的地"。局部变量不初始化，里面是上一次残留的垃圾值；加上 `static`，它的值会一直活到程序结束。',
      analogy: '普通局部变量像酒店房间，退房就被人清空；`static` 像你自己买的储物柜，只有你有钥匙，下次来东西还在。',
      demo: String.raw`void f(void) {
    int t;              // 垃圾值，别直接用
    static int cnt = 0; // 只初始化一次，下次调用还是上次的值
    cnt++;
}`
    },

    'c-op': {
      plain: '运算符有优先级和结合性，写不清楚就加括号。两个整数相除结果还是整数（直接截断），想要小数至少让一边是浮点。位运算则是直接改二进制位。',
      analogy: '`5 / 2` 得 2 不是 2.5，就像分 5 个苹果给 2 个人，每人 2 个，剩下那个不切开就扔了。',
      demo: String.raw`5 / 2        // 2
5 / 2.0      // 2.5
5 % 2        // 1  取余
5 & 1        // 1  奇数；0 就是偶数
x << 1       // 乘 2`
    },

    'c-io': {
      plain: '`printf` 把内存里的值按格式符变成文字；`scanf` 反过来，按格式符从输入里"抠"出值。`scanf` 后面除了字符串，全都要加 `&` 取地址。',
      analogy: '格式符是取件码：`%d` 取整数件，`%f` 取小数件，`%s` 取字符串件。给错码，取出来的就是别人的包裹（垃圾值）。',
      demo: String.raw`int a;  double x;  char s[20];
scanf("%d %lf %19s", &a, &x, s);  // s 是数组名，不用加 &
printf("%d %.2f %s\n", a, x, s);`
    },

    'c-flow': {
      plain: '`if` 选路，`for`/`while` 重复，`switch` 按值跳转到某个 `case`。`switch` 里不写 `break` 会继续往下执行，这叫"穿透"。',
      analogy: '`switch` 像一栋楼的电梯：到了 3 楼你不出来，它就继续开到 4 楼、5 楼——`break` 就是"我在这层下"。',
      demo: String.raw`switch (n % 3) {
    case 0: puts("余 0"); break;   // 没 break 会继续执行下一个 case
    default: puts("其它");
}`
    },

    'c-array': {
      plain: '数组是一段连续的内存格子，`a[i]` 其实就是 `*(a + i)`。下标从 0 开始，越界不会报错，只会悄悄踩坏旁边的数据；数组当参数传进函数后会退化成指针，长度信息就丢了。',
      analogy: '数组像一排连号的储物柜，`a[0]` 是第一格。你拿钥匙去开 8 号柜，可柜子只到 5 号——管理员不管，你撬开的是别人的柜子。',
      demo: String.raw`int a[5] = {1, 2, 3, 4, 5};
a[0] == *(a + 0);              // 同一回事
int n = sizeof(a) / sizeof(a[0]);  // 5
// 但传进函数后 sizeof(a) 只剩 8（指针大小）`
    },

    'c-pointer': {
      plain: '指针是一个存"地址"的变量。`&a` 取 a 的地址，`*p` 顺着 p 里的地址把值取出来。指针的类型决定"顺着这个地址能读几个字节"。',
      analogy: '指针是一张写着门牌号的纸条。纸条本身不是房子，但顺着门牌号能找到房子，还能进屋改东西（`*p = 1`）。',
      demo: String.raw`int a = 42;
int *p = &a;    // p 里存的是 a 的地址
printf("%d", *p);  // 42
*p = 7;         // 顺着地址改，a 也变成 7`
    },

    'c-pointer2': {
      plain: '`int *p[3]` 是"三个指针组成的数组"，`int (*p)[3]` 是"指向 3 个 int 数组的指针"。读法是从名字开始，先跟谁结合就是什么。',
      analogy: '看门牌：`p` 后面先写 `[3]`，说明 p 是"三间房"；加了括号 `(*p)` 才说明 p 是"一张写着某栋楼地址的纸条"。',
      demo: String.raw`int *a[3];    // 数组，3 个 int*
int (*b)[3];  // 指针，指向 int[3]
int **c;      // 二级指针：指向"另一个指针"

// 从名字读起：a 先遇 [] → 是数组；b 先遇 * → 是指针`
    },

    'c-string': {
      plain: 'C 没有字符串类型，只有"以 `\0` 结尾的 char 数组"。`strlen` 一直数到 `\0` 才停，比较内容要用 `strcmp`，不能用 `==`（那比的是地址）。',
      analogy: '`\0` 是这句话的句号。没有句号，函数就会一路念下去，念到别人的内存里为止。',
      demo: String.raw`char s[6] = "hello";   // 5 个字符 + 1 个 '\0'
strlen(s);             // 5
strcmp(s, "hello");    // 0 表示相等
s == "hello";          // 永远不等！比的是地址`
    },

    'c-struct': {
      plain: '结构体把几个不同类型的变量打包成一个新类型。成员之间会按对齐规则插入空隙，所以 `sizeof` 常常比成员大小之和更大。',
      analogy: '结构体像表格里的一行：姓名、年龄、分数写在同一行，拿这一行就能找到这个人的全部信息。',
      demo: String.raw`struct Student {
    int  id;      // 0~3
    char name[8]; // 4~11
    double score; // 对齐到 8，中间补 4 字节 → 16~23
};                // sizeof = 24，不是 20`
    },

    'c-union-enum': {
      plain: '`union` 让几个成员共用同一块内存（同一时刻只有一个有效）；`enum` 是给整数起名字；`typedef` 是给类型起外号。',
      analogy: '`union` 像一个抽屉：放了笔就放不进本子，几个名字共用一格空间。`enum` 像给星期编号，1 代表周一，写 `MON` 比写 1 好懂。',
      demo: String.raw`typedef enum { MON = 1, TUE, WED } Week;  // TUE=2, WED=3
union U { int i; float f; };  // sizeof = 4，两个成员挤一块`
    },

    'c-malloc': {
      plain: '`malloc` 从堆上借一块内存，用完必须 `free` 还回去。`free` 之后那块指针就成了"野指针"，再访问就是未定义行为。',
      analogy: '借书：`malloc` 是借，`free` 是还。还了之后书架上那本书可能已经借给别人了，你手里那张借书卡（指针）再拿去用就出事。',
      demo: String.raw`int *a = malloc(n * sizeof(int));
if (a == NULL) return 1;   // 一定判空
a[0] = 1;
free(a);
a = NULL;                  // 好习惯：置空，防止野指针`
    },

    'c-file': {
      plain: '用 `fopen` 打开文件拿到 `FILE*`，用 `fprintf`/`fscanf`/`fgets` 读写，最后 `fclose`。打开失败会返回 `NULL`，必须判。',
      analogy: '`FILE*` 是"文件的门把手"：先抓住把手（fopen），才能往里放东西（fprintf），走的时候要把门关上（fclose），不然数据可能还在缓冲区里没落盘。',
      demo: String.raw`FILE *fp = fopen("data.txt", "w");
if (!fp) { printf("打不开\n"); return 1; }
fprintf(fp, "%d\n", 42);
fclose(fp);`
    },

    'c-macro': {
      plain: '`#define` 是编译前的"文本替换"，不是函数。带参数的宏一定要给参数加括号，否则运算优先级会坑你。',
      analogy: '宏像 Ctrl+H 全局替换：`#define SQ(x) x*x`，写 `SQ(1+2)` 会被替换成 `1+2*1+2`，等于 5 而不是 9。',
      demo: String.raw`#define SQ_BAD(x)  x*x       // SQ_BAD(1+2) → 1+2*1+2 = 5
#define SQ_OK(x)   ((x)*(x))  // SQ_OK(1+2)  → 9`
    },

    /* ---------------- 第 2 章 线性表 ---------------- */

    'd-adt': {
      plain: '数据结构要看三件事：逻辑结构（元素之间是什么关系）、存储结构（在内存里怎么摆）、运算（能对它做什么操作）。同一个逻辑结构可以用不同存储方式实现。',
      analogy: '同样是"排队"这件事：可以用一条绳子串起来（链表），也可以在地上画好格子按号站（顺序表）。队伍的顺序一样，但插队和找人的难易完全不同。',
      demo: String.raw`逻辑：线性（一对一） / 树（一对多） / 图（多对多）
存储：顺序（连续数组） / 链式（指针串起来）
运算：增 删 查 改 遍历`
    },

    'd-seqlist': {
      plain: '顺序表就是"数组 + 一个记录当前长度的变量"。插入要把后面所有元素往后挪一格，删除要往前挪一格，所以平均要动一半元素。',
      analogy: '一排坐满人的长椅，中间要插一个人，右边所有人得往右挪一个位置——人越多挪得越久。',
      demo: String.raw`typedef struct { int data[MAX]; int len; } SqList;

// 在下标 i 处插入 x：从后往前挪，避免覆盖
for (int j = L.len; j > i; j--) L.data[j] = L.data[j-1];
L.data[i] = x;  L.len++;`
    },

    'd-seqlist-app': {
      plain: '顺序表的经典题都靠"双指针"：一个读、一个写（或一头一尾）。这样一遍扫描就能完成去重、逆置、划分，不用额外数组。',
      analogy: '两个人整理一叠牌：一个负责翻（快指针），一个负责把合格的放好（慢指针）。一趟就理完了。',
      demo: String.raw`// 原地去重（有序表）
int k = 0;
for (int i = 1; i < L.len; i++)
    if (L.data[i] != L.data[k]) L.data[++k] = L.data[i];
L.len = k + 1;`
    },

    'd-linklist': {
      plain: '单链表由一个个结点组成，每个结点存"数据"和"下一个结点的地址"。头插法建出来的表是倒序的，尾插法才是原序。',
      analogy: '寻宝游戏：每张纸条上写着下一个线索藏在哪。你只能顺着线索一张张找，没法直接跳到第 5 张。',
      demo: String.raw`typedef struct Node { int data; struct Node *next; } Node;

// 头插：新结点永远插在头结点后面 → 逆序
n->next = head->next;  head->next = n;

// 尾插：需要一个尾指针 tail 一直跟着 → 保持顺序
tail->next = n;  tail = n;  n->next = NULL;`
    },

    'd-linklist-ops': {
      plain: '按位插入/删除都要先找到"前一个结点"，因为改链表的入口在前驱的 `next` 上。改指针的顺序不能反：先让新结点接上后面，再断开前面。',
      analogy: '换车厢：新挂钩必须先挂到后车上，再松开旧挂钩。顺序反了，后面的整列车就跑了，再也找不回来。',
      demo: String.raw`// 在 p 之后插入 s
s->next = p->next;   // ① 先接后
p->next = s;         // ② 再断前

// 删除 p 的后继
Node *q = p->next;
p->next = q->next;
free(q);`
    },

    'd-linklist-app': {
      plain: '链表题几乎都靠"多个指针一起走"：逆置用三个指针（前、当前、后），找中点用快慢指针（快的走两步、慢的走一步），判环也用快慢指针（追上就有环）。',
      analogy: '在环形跑道上，一个跑得快一个跑得慢，只要跑道是环，快的迟早会再遇到慢的。',
      demo: String.raw`// 逆置
Node *pre = NULL, *cur = head->next;
while (cur) { Node *nxt = cur->next; cur->next = pre; pre = cur; cur = nxt; }

// 找中点
while (fast && fast->next) { slow = slow->next; fast = fast->next->next; }`
    },

    'd-dlink': {
      plain: '双向链表的每个结点有两个指针（前驱 + 后继），删除时不用再去找前驱。循环链表的尾结点指回头结点，形成一个圈。',
      analogy: '双向链表像地铁双向车厢，倒着走也行；单链表像单行道，想回头只能绕一圈。',
      demo: String.raw`// 在 p 之后插入 s（四步）
s->next = p->next;   s->prior = p;
p->next->prior = s;  p->next = s;`
    },

    'd-static': {
      plain: '静态链表用数组模拟链表：数组下标当"地址"，每个元素再存一个 `next` 存下一个元素的下标，`0` 表示空。适合没有指针的语言。',
      analogy: '把纸条上的"下一个在哪"改成"下一个是几号柜子"，不用真的拿地址，靠编号也能串起来。',
      demo: String.raw`typedef struct { int data; int next; } SNode;
SNode s[MAX];   // s[0] 当头结点用，s[i].next 是下标不是指针`
    },

    'd-linear-compare': {
      plain: '要频繁按下标随机访问 → 用顺序表（O(1)）；要频繁在中间插入删除 → 用链表（已知位置时 O(1)）；内存要连续一大块 → 只有顺序表做得到。',
      analogy: '顺序表像电影院连排座位（找座快、中间加座难），链表像每人手里牵着下一个人（加人容易、找人得一个个问）。',
      demo: String.raw`顺序表：查 O(1)  插删 O(n)  空间连续，有扩容成本
链  表：查 O(n)  插删 O(1)* 空间碎片友好，多花指针
            *前提是已经站在那个位置上了`
    },

    /* ---------------- 第 3 章 栈与队列 ---------------- */

    'd-stack': {
      plain: '栈是"只能在一头进出的线性表"，后进先出。顺序栈用一个 `top` 下标记录栈顶，入栈 `++top`，出栈 `top--`。',
      analogy: '一摞盘子：只能从最上面拿，也只能往最上面放。想拿最底下那个，得先把上面的都搬走。',
      demo: String.raw`typedef struct { int data[MAX]; int top; } SqStack;
// 初始化 top = -1
push: s->data[++s->top] = x;
pop : x = s->data[s->top--];
空  : s->top == -1`
    },

    'd-stack-app': {
      plain: '凡是"最近出现的先处理"的问题都用栈：括号匹配（左括号压栈，右括号弹栈对比）、进制转换（余数倒着读）、递归消除（系统栈换手动栈）。',
      analogy: '括号匹配像叠盘子对号：每拿出一个右括号，必须和最近放进去的那个左括号是一对。',
      demo: String.raw`for (每个字符 c) {
    if (c == '(') push(c);
    else if (c == ')') { if (空栈 || pop() != '(') return 0; }
}
return 栈空;`
    },

    'd-expr': {
      plain: '中缀表达式（人看的 `1+2*3`）要先转成后缀（`1 2 3 * +`）再求值，因为后缀不需要括号、优先级全由顺序决定。转换靠一个运算符栈，求值靠一个数字栈。',
      analogy: '后缀表达式像"先把材料摆好，最后写操作"：`1 2 3 * +` 就是"拿 1、拿 2、拿 3、把后两个相乘、再和 1 相加"。',
      demo: String.raw`中缀：1 + 2 * 3
后缀：1 2 3 * +
求值：遇数字压栈；遇运算符弹出两个算完再压回 → 7`
    },

    'd-queue': {
      plain: '队列是"一头进、另一头出"，先进先出。普通顺序队列会"假溢出"（前面有空位但 rear 到底了），解法是循环队列：下标用 `% MAX` 绕回来。',
      analogy: '排队买饭：前面的人买完走了，队尾的人补上来。如果空位不重复利用，队伍会"排到墙外"而前面其实空着——这就是假溢出。',
      demo: String.raw`入队：rear = (rear + 1) % MAX;  q[rear] = x;
出队：front = (front + 1) % MAX;
队满：(rear + 1) % MAX == front;   // 牺牲一个单元区分空和满`
    },

    'd-queue-link': {
      plain: '链队列就是带头尾指针的单链表，出队在头部、入队在尾部。双端队列（deque）两头都能进出，是滑动窗口的标准工具。',
      analogy: '链队列像一条蛇：头在动（出队），尾也在长（入队），中间不用挪。',
      demo: String.raw`typedef struct { Node *front, *rear; } LinkQueue;
入队：rear->next = n; rear = n;
出队：Node *p = front->next; front->next = p->next; free(p);`
    },

    'd-queue-app': {
      plain: '凡是要"按层、按距离、按到达顺序"处理的问题都用队列：BFS 一圈圈扩散、滑动窗口维护最大值、杨辉三角逐层生成。',
      analogy: 'BFS 像往水里丢石头：波纹一圈一圈往外，先到的一圈先处理完，才轮到下一圈。',
      demo: String.raw`// BFS 骨架
enqueue(start); visited[start] = 1;
while (!empty(q)) {
    u = dequeue(q);
    for (v : u 的邻居) if (!visited[v]) { visited[v] = 1; enqueue(v); }
}`
    },

    /* ---------------- 第 4 章 串 ---------------- */

    'd-string': {
      plain: '串就是字符的有限序列。存储方式有定长数组、堆分配（malloc）、块链。朴素匹配是"主串每个位置都试一次模式串"，最坏 O(n*m)。',
      analogy: '朴素匹配像拿一张小卡片在主串上一个个位置比对着滑，滑一次比一次，不聪明但不会错。',
      demo: String.raw`for (i = 1; i <= n - m + 1; i++) {
    for (j = 1; j <= m && S[i+j-1] == P[j]; j++);
    if (j > m) return i;   // 匹配成功
}`
    },

    'd-kmp': {
      plain: 'KMP 的核心是：失配时主串指针不回头，只把模式串往右滑到"已匹配部分的最长相同前后缀"那个位置。`next[j]` 存的就是这个位置。',
      analogy: '你在读一句话找关键词，读到一半发现不对——KMP 不会从头再读，而是利用"刚才那几个字我已经认识了"，直接从可能对上的地方接着读。',
      demo: String.raw`// next[j]：P[1..j-1] 的最长相同前后缀长度
// 失配时：j = next[j]，i 不动
while (i <= n && j <= m) {
    if (j == 0 || S[i] == P[j]) { i++; j++; }
    else j = next[j];
}`
    },

    /* ---------------- 第 5 章 树 ---------------- */

    'd-tree-basic': {
      plain: '树是"一个根、每个结点只有一个父亲、没有环"的层次结构。二叉树每个结点最多两个孩子，五个性质全靠"每层最多 2^(i-1) 个"推出来。',
      analogy: '家谱：最上面是老祖宗（根），往下分儿子、孙子，每个人只有一个父亲，不会出现"你的爷爷也是你的孙子"这种环。',
      demo: String.raw`第 i 层最多 2^(i-1) 个结点
深度 h 最多 2^h - 1 个结点
n0 = n2 + 1        （叶子数 = 双分支结点数 + 1）
n 个结点的完全二叉树高度 = ⌊log2 n⌋ + 1`
    },

    'd-tree-store': {
      plain: '顺序存储把二叉树按下标塞进数组，适合完全二叉树（i 的孩子是 2i 和 2i+1）；一般二叉树用二叉链表，每个结点存左右孩子指针。',
      analogy: '顺序存储像按座位号排的剧场，缺人时座位还留着空；链表像每个人手里牵着左右两个孩子，不用管空位。',
      demo: String.raw`// 二叉链表
typedef struct TNode {
    int data;
    struct TNode *lchild, *rchild;
} TNode;`
    },

    'd-tree-traverse': {
      plain: '前序/中序/后序的区别只是"根在什么时候访问"：前序先根、中序中间、后序最后。层序则是一层一层来，要用队列。',
      analogy: '整理一本书：前序是先写章标题再写内容，中序是内容夹在标题中间，后序是先把小节写完最后标章名。',
      demo: String.raw`void inOrder(TNode *t) {
    if (!t) return;
    inOrder(t->lchild);
    visit(t);            // 根在中间 → 中序
    inOrder(t->rchild);
}`
    },

    'd-tree-build': {
      plain: '前序 + 中序能唯一确定一棵二叉树：前序第一个是根，拿这个根去中序里切，左边是左子树、右边是右子树，然后递归。',
      analogy: '前序告诉你"谁当队长"，中序告诉你"谁站在队长左边、谁在右边"。两个信息合起来，队形就定死了。',
      demo: String.raw`前序：A B D E C
中序：D B E A C
     └ A 是根；中序里 A 左边 DBE → 左子树，右边 C → 右子树
       再对 DBE 递归（前序里对应 B D E）→ B 是根…`
    },

    'd-thread': {
      plain: '线索化是把链表里空着的 `lchild`/`rchild` 利用起来，改成指向前驱/后继的"线索"。这样遍历不用栈也不用递归。',
      analogy: '一本书每章末尾本来空着，你在空白处写上"下一章在第几页"，翻起来就不用每次都查目录了。',
      demo: String.raw`if (!p->lchild) { p->lchild = pre;  p->ltag = 1; }  // 指向前驱
if (pre && !pre->rchild) { pre->rchild = p; pre->rtag = 1; }  // 后继`
    },

    'd-huffman': {
      plain: '哈夫曼树是"带权路径长度最小"的二叉树：每次挑两个权值最小的合并，直到只剩一棵。左 0 右 1 就得到哈夫曼编码。',
      analogy: '给常用字配短码、生僻字配长码——像发电报，最常发的字用最短的码，整篇电文就短了。',
      demo: String.raw`权值 1 2 3 4：
取 1,2 合并成 3  → 剩 3,3,4
取 3,3 合并成 6  → 剩 4,6
取 4,6 合并成 10 → 完
WPL = 1*3 + 2*3 + 3*2 + 4*1 = 19`
    },

    'd-bst': {
      plain: '二叉排序树：左子树全部小于根，右子树全部大于根。所以中序遍历一定是升序。查找平均 O(log n)，但如果插入顺序本身有序，会退化成链表变成 O(n)。',
      analogy: '查字典：先翻到中间，比要找的字小就往左半本，大就往右半本。前提是书是按顺序排的——BST 就是这个"按顺序排"。',
      demo: String.raw`查找：
while (p && p->data != x)
    p = (x < p->data) ? p->lchild : p->rchild;
中序遍历 → 1 3 5 7 9（一定有序）`
    },

    'd-avl': {
      plain: 'AVL 是"任何结点的左右子树高度差不超过 1"的 BST。插入后失衡就旋转：LL 右旋、RR 左旋、LR 先左后右、RL 先右后左。',
      analogy: '天平：一边重了就往轻的那边挪一点，直到两边差不多高。旋转就是"挪"的动作。',
      demo: String.raw`判断类型看"插入点在哪"：
LL：插入在左孩子的左子树 → 右旋一次
RR：右孩子的右子树     → 左旋一次
LR：左孩子的右子树     → 先对左孩子左旋，再自己右旋
RL：右孩子的左子树     → 先对右孩子右旋，再自己左旋`
    },

    'd-btree': {
      plain: 'B 树是多路平衡查找树：一个结点存多个关键字、有多个孩子，树很"矮很胖"。B+ 树把数据全放在叶子上，叶子之间用链表连起来，所以范围查询特别快。',
      analogy: 'B 树像图书馆的分区检索：一次翻一大类（一个结点多个 key），翻两三次就到具体书架，不用一层层找。磁盘一次读一大块，所以"矮胖"比"瘦高"省 IO。',
      demo: String.raw`B 树：每个结点存 key + 数据，树矮 → 磁盘 IO 少
B+ 树：内部结点只存索引，数据全在叶子
        叶子之间有链表 → 范围查询 ORDER BY 很快
        数据库索引几乎都是 B+ 树`
    },

    'd-unionfind': {
      plain: '并查集维护"谁和谁是一伙的"：每个集合选一个代表（根），`find` 往上找根，`union` 把两个根连起来。加上路径压缩，几乎就是 O(1)。',
      analogy: '查户口：问你属于哪个村，你就往上问"我爸属于哪个村"，一直问到村长。路径压缩＝问过一次之后，直接把你也记成村长管的。',
      demo: String.raw`int find(int x) { return fa[x] == x ? x : (fa[x] = find(fa[x])); }
void uni(int a, int b) { fa[find(a)] = find(b); }

// 用在 Kruskal 判环：两个端点已经同根 → 加这条边会成环`
    },

    /* ---------------- 第 6 章 图 ---------------- */

    'd-graph-store': {
      plain: '邻接矩阵是一个 n×n 的二维数组，`A[i][j]=1` 表示有边，判边 O(1) 但占 O(n²) 空间；邻接表是每个点挂一条链表存邻居，省空间但判边要遍历。',
      analogy: '邻接矩阵像一张"谁认识谁"的全员表格（人多时表格巨大，大部分是空的）；邻接表像每个人的通讯录（只记认识的人）。',
      demo: String.raw`邻接矩阵：int g[N][N];  g[u][v] = w;
邻接表：
typedef struct ArcNode { int adjvex; int w; struct ArcNode *next; } ArcNode;
ArcNode *head[N];`
    },

    'd-graph-traverse': {
      plain: 'DFS 一条路走到黑，走不动了退回上一个岔口（用递归或栈）；BFS 一层层往外扩（用队列）。两者都要记 `visited`，否则有环会转不出来。',
      analogy: 'DFS 像走迷宫总往右转，撞墙就退回上一个路口；BFS 像往水里丢石头，波纹一圈圈同时扩散。',
      demo: String.raw`DFS(u): visited[u]=1; for (v: u 的邻居) if(!visited[v]) DFS(v);
BFS(s): visited[s]=1; enqueue(s);
        while(!empty){ u=dequeue(); for(v:邻居) if(!visited[v]){visited[v]=1;enqueue(v);} }`
    },

    'd-mst': {
      plain: '最小生成树＝用 n-1 条边把所有点连起来、总权值最小。Prim 从点出发，每次连"离当前树最近的点"；Kruskal 从边出发，每次拿最小边、用并查集判会不会成环。',
      analogy: '要在几个村子之间修路、花钱最少：Prim 是"从一个村开始，每次修一条通往最近村子的路"；Kruskal 是"把所有候选路按造价排好，能修就修，会绕成圈的就跳过"。',
      demo: String.raw`Prim   ：适合稠密图，O(n^2)
Kruskal：适合稀疏图，O(e log e)，靠并查集判环`
    },

    'd-shortest': {
      plain: 'Dijkstra 求"一个源点到其它所有点"的最短路径，要求边权非负：每次选当前距离最小的点，用它去"松弛"邻居。Floyd 三重循环求"任意两点之间"，能处理负权（但不能有负环）。',
      analogy: 'Dijkstra 像水从源点往外漫：总是先淹到最近的地方，淹到哪就把哪的最短距离定下来，再不更改。',
      demo: String.raw`Dijkstra：O(n^2)
for (k = 0; k < n; k++)          // 选未确定里 dist 最小的 u
  for (每个邻居 v) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;

Floyd：O(n^3)
for (k) for (i) for (j) d[i][j] = min(d[i][j], d[i][k] + d[k][j]);`
    },

    'd-topo': {
      plain: '拓扑排序把"有先后依赖"的任务排成一个线性序列：每次取一个"入度为 0"（没有前置任务）的点输出，然后把它发出的边删掉。排不完说明有环。',
      analogy: '选课：先修完高数才能学数据结构。拓扑排序就是给你一个合法的选课顺序，让每门课的前置课都排在它前面。',
      demo: String.raw`统计入度 → 入度为 0 的入队
while (!empty(q)) {
    u = dequeue(q); 输出 u;
    for (v : u 的出边) if (--indeg[v] == 0) enqueue(v);
}
输出个数 < n → 有环，不存在拓扑序`
    },

    'd-critical': {
      plain: 'AOE 网里，边是活动、点是事件。事件有"最早开始 ve"和"最迟开始 vl"，两者相等的事件是关键事件；活动的最早开始和最迟开始相等，就是关键活动，它们连起来就是关键路径。',
      analogy: '装修房子：水电、瓦工、木工有先后。有些工序拖一天，整个工期就拖一天（关键活动）；有些拖三天也没事（有富余时间）。',
      demo: String.raw`ve：拓扑序正推，取 max(前驱 ve + 边权)
vl：逆拓扑序倒推，取 min(后继 vl - 边权)
关键活动：e = l，即 ve[u] == vl[v] - w`
    },

    /* ---------------- 第 7 章 查找 ---------------- */

    'd-search-seq': {
      plain: '顺序查找挨个比，O(n)，对数据没要求；折半查找要求"有序 + 顺序存储"，每次砍一半，O(log n)。ASL（平均查找长度）用判定树算最直观。',
      analogy: '查字典：顺序查找是从第一页翻起；折半查找是先翻中间——但前提是这本字典真的按字母排好了。',
      demo: String.raw`while (low <= high) {
    mid = (low + high) / 2;
    if (a[mid] == key) return mid;
    if (a[mid] < key) low = mid + 1; else high = mid - 1;
}`
    },

    'd-search-block': {
      plain: '分块查找（索引顺序表）：数据分成若干块，"块间有序、块内无序"。先用索引表折半找到所在块，再在块内顺序找。',
      analogy: '图书馆先按大类分书架（块间有序），每个书架上的书不排序（块内无序）。先找对书架，再一本本翻。',
      demo: String.raw`索引表：每块的最大关键字 + 起始下标
先折半定位块 → 再块内顺序扫
平均 ASL ≈ log2(b) + s/2   （b 块数，s 每块长度）`
    },

    'd-hash': {
      plain: '哈希表用哈希函数把 key 直接算成数组下标，理想情况 O(1) 找到。两个 key 算到同一个下标叫冲突，用链地址法（挂链表）或开放定址法（往后找空位）解决。装填因子 α = 元素数 / 表长，越大越容易冲突。',
      analogy: '按姓名首字母分柜子：姓"安"的放 A 柜。如果 A 柜塞满了（冲突），就往后找 B 柜，或者在 A 柜里挂一串抽屉（链地址）。',
      demo: String.raw`H(key) = key % 13
α = n / m          // 0.75 是常见上限
链地址法：同一格挂一条链表，查找 = 算下标 + 遍历链表
平均查找长度 ≈ 1 + α/2`
    },

    /* ---------------- 第 8 章 排序 ---------------- */

    'd-sort-basic': {
      plain: '排序算法的两个关键指标：时间（比较 + 移动次数）和稳定性。稳定＝相等的元素排完之后相对次序不变——多关键字排序时这个很重要。',
      analogy: '先按分数排、再按班级排：如果排序稳定，同班同学之间还保持分数高低；不稳定的话，分数顺序就乱了。',
      demo: String.raw`稳定：插入、冒泡、归并、基数
不稳：快排、希尔、选择、堆排`
    },

    'd-sort-insert': {
      plain: '直接插入排序：把当前元素插到前面"已经排好序"的那一段里的正确位置，后面的元素依次后移。数据越接近有序越快，最好 O(n)，最坏 O(n²)，稳定。',
      analogy: '打扑克摸牌：手里的牌一直是有序的，每摸一张就插到合适的位置。',
      demo: String.raw`for (i = 2; i <= n; i++) {
    if (a[i] < a[i-1]) {
        a[0] = a[i];                       // a[0] 当哨兵/暂存
        for (j = i-1; a[j] > a[0]; j--) a[j+1] = a[j];
        a[j+1] = a[0];
    }
}`
    },

    'd-sort-shell': {
      plain: '希尔排序＝按增量 d 把序列分成若干组，每组做插入排序，然后 d 逐渐缩小到 1。它让元素一次能"跳很远"，所以比插入排序快，但不稳定。',
      analogy: '大扫除先粗分（把大件归堆），再细分（把小件归类）。先大步调整，最后一步才精修。',
      demo: String.raw`for (d = n/2; d >= 1; d /= 2)
    for (i = d+1; i <= n; i++)
        if (a[i] < a[i-d]) { 在组内做插入排序 }`
    },

    'd-sort-swap': {
      plain: '冒泡：相邻两个比，大的往后冒，每轮定一个最大值。快排：选一个基准，把小的甩左边、大的甩右边，再对两边递归。快排平均 O(n log n)，但已经有序且取端点当基准时会退化成 O(n²)。',
      analogy: '快排像把一堆牌按"比 5 大还是小"分成两堆，再各自分下去。分得越均匀越快；每次都分成 1 和 n-1 就白干了。',
      demo: String.raw`int partition(int a[], int low, int high) {
    int p = a[low];                       // 基准
    while (low < high) {
        while (low < high && a[high] >= p) high--;
        a[low] = a[high];
        while (low < high && a[low] <= p) low++;
        a[high] = a[low];
    }
    a[low] = p;  return low;
}`
    },

    'd-sort-select': {
      plain: '选择排序：每轮从剩下的里挑最小的放到前面，比较次数固定 O(n²)，交换很少。堆排序：把数组看成一棵完全二叉树，建成大顶堆后每次把堆顶换到末尾再调整，O(n log n)。',
      analogy: '选择排序像每次从一堆球里挑最小的摆到队首；堆排序像一场淘汰赛，冠军（最大值）总在顶上，取走冠军后重新赛一次。',
      demo: String.raw`// 堆调整（大顶堆）
void sift(int a[], int k, int n) {
    int t = a[k];
    for (int i = 2*k; i <= n; i *= 2) {
        if (i < n && a[i] < a[i+1]) i++;   // 取较大的孩子
        if (t >= a[i]) break;
        a[k] = a[i];  k = i;
    }
    a[k] = t;
}`
    },

    'd-sort-merge': {
      plain: '归并排序：把序列对半切开，两边各自排好，再合并两个有序段。合并只要一遍扫描，所以总体 O(n log n)，稳定，代价是要 O(n) 额外空间。',
      analogy: '两队已经按身高排好的队伍合成一队：每次看两个队首，矮的先出列。一遍就合完了。',
      demo: String.raw`mergeSort(a, low, high):
    mid = (low + high) / 2;
    mergeSort(a, low, mid);
    mergeSort(a, mid+1, high);
    merge(a, low, mid, high);   // 合并两个有序段`
    },

    'd-sort-radix': {
      plain: '基数排序不比较大小：按个位、十位、百位……从低位到高位，每一轮"分配"到 10 个桶再"收集"回来。d 位数、r 进制时是 O(d(n+r))。',
      analogy: '整理一叠卡片：先按个位数字分成 10 摞并叠好，再按十位分 10 摞……几轮下来就全有序了。',
      demo: String.raw`for (每一位，从低位到高位) {
    按该位数字分配进 10 个桶
    按 0..9 顺序收集回原数组
}`
    },

    'd-sort-compare': {
      plain: '没有"最好的排序"，只有"最合适的"：要稳定选归并，要最坏情况也 O(n log n) 选堆排/归并，工程上默认快排（常数小、缓存友好），数据基本有序时插入排序反而最快。',
      analogy: '工具箱里没有一把万能的工具：拧螺丝用螺丝刀，砸钉子用锤子。',
      demo: String.raw`平均最快      → 快排
要稳定        → 归并 / 插入
要最坏也稳    → 堆排 / 归并
数据基本有序  → 插入 / 冒泡
元素是整数    → 基数（O(n) 级别）`
    }
  };
})();
