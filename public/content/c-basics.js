/* ============================================================
   第 1 章（上）：C 语言核心语法 —— 编译、类型、变量、运算、IO、流程
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  {
    id: 'c-hello',
    ch: 'c1',
    title: '第一个程序与编译的四个阶段',
    tag: '必学',
    brief: '预处理 → 编译 → 汇编 → 链接。main 的返回值是谁拿走的？',
    tags: ['hello world', '编译', 'gcc', 'main', '预处理', '链接'],
    body: `
      <h2>最小可运行程序</h2>
      <p>C 程序从 <code>main</code> 开始执行，<code>return 0</code> 是告诉操作系统"我正常结束了"。别写 <code>void main()</code>，那是三十年前的写法。</p>
      <pre><code>#include &lt;stdio.h&gt;      // 引入标准输入输出库的声明
int main(void) {         // 程序入口，void 表示不收参数
    printf("hi\\n");     // \\n 是换行
    return 0;            // 0 = 成功，非 0 = 出错
}</code></pre>

      <h2>你按下「运行」之后，gcc 干了四件事</h2>
      <table>
        <tr><th>阶段</th><th>干什么</th><th>产物</th><th>常见错误</th></tr>
        <tr><td>预处理</td><td>展开 <code>#include</code>、替换宏、删注释</td><td><code>.i</code></td><td>宏没括号、头文件找不到</td></tr>
        <tr><td>编译</td><td>C 代码 → 汇编</td><td><code>.s</code></td><td>语法错误、类型错误</td></tr>
        <tr><td>汇编</td><td>汇编 → 机器码</td><td><code>.o</code></td><td>基本不出错</td></tr>
        <tr><td>链接</td><td>把 <code>.o</code> 和库拼起来</td><td><code>.exe</code></td><td><code>undefined reference to 'xxx'</code></td></tr>
      </table>

      <h2>两条最常撞的墙</h2>
      <ul>
        <li><strong>error: expected ';' before '}' token</strong> —— 上一条语句少分号。</li>
        <li><strong>undefined reference to 'printf'</strong> —— 忘了 <code>#include &lt;stdio.h&gt;</code>，或者编译时函数名拼错了。</li>
      </ul>
      <div class="note">下面这段程序把四件事都演示了：包含头文件、定义变量、格式化输出、返回值。跑完改改字符串，再跑一次。</div>
    `,
    code: `#include <stdio.h>

int main(void) {
    int year = 2026;
    printf("Hello, C.\\n");
    printf("这是 %d 年的第一行 C 代码。\\n", year);
    printf("本文件占 %d 个字节的源码（大概）\\n", 128);

    // 特殊字符转义
    printf("制表符\\t竖线\\n反斜杠\\\\ 双引号\\"\\n");
    return 0;
}`,
    tips: [
      '`printf` 结尾不加 `\\n` 时，输出可能卡在缓冲区里不显示，尤其是在程序崩溃前。',
      '想看预处理结果：`gcc -E main.c -o main.i`。想看汇编：`gcc -S main.c`。'
    ],
    traps: [
      '`main` 忘了写 `return 0;` 在新标准里等价于返回 0，但老编译器会有警告，写上更稳。',
      '字符串里写 `\\` 要双写，路径 `C:\\Users` 在 C 字符串里必须写成 `C:\\\\Users`。'
    ]
  },

  {
    id: 'c-types',
    ch: 'c1',
    title: '数据类型、sizeof 与那些反直觉的坑',
    tag: '必学',
    brief: '整数溢出、浮点不精确、char 其实是小整数。',
    tags: ['int', 'float', 'double', 'char', 'sizeof', '溢出', '精度'],
    body: `
      <h2>基本类型一览（64 位 Windows / MinGW）</h2>
      <table>
        <tr><th>类型</th><th>字节</th><th>范围 / 说明</th></tr>
        <tr><td><code>char</code></td><td>1</td><td>−128 ~ 127，本质是小整数</td></tr>
        <tr><td><code>short</code></td><td>2</td><td>−32768 ~ 32767</td></tr>
        <tr><td><code>int</code></td><td>4</td><td>约 ±21 亿</td></tr>
        <tr><td><code>long long</code></td><td>8</td><td>约 ±9.2×10¹⁸</td></tr>
        <tr><td><code>float</code></td><td>4</td><td>约 7 位有效数字</td></tr>
        <tr><td><code>double</code></td><td>8</td><td>约 15 位有效数字</td></tr>
        <tr><td><code>指针</code></td><td>8</td><td>64 位系统一律 8 字节，跟指向什么类型无关</td></tr>
      </table>
      <div class="warn">注意：<code>long</code> 在 Windows 上是 4 字节，在 Linux 上是 8 字节。别拿 <code>long</code> 存大数，要跨平台就用 <code>long long</code>。</div>

      <h2>三个反直觉的坑</h2>
      <ol>
        <li><strong>整数溢出</strong>：<code>int</code> 到 2147483647 再加 1 就变负数（有符号溢出是未定义行为，实际常见是回绕）。</li>
        <li><strong>浮点不精确</strong>：<code>0.1 + 0.2 != 0.3</code>。二进制表示不了 0.1，所以永远别用 <code>==</code> 比较浮点数，要比较差值。</li>
        <li><strong>整数除法截断</strong>：<code>5 / 2 == 2</code>，不是 2.5。想要小数至少一边是浮点。</li>
      </ol>
      <p><code>sizeof</code> 是运算符不是函数，编译期就求值，返回 <code>size_t</code>（用 <code>%zu</code> 打印）。</p>
    `,
    code: `#include <stdio.h>
#include <limits.h>
#include <float.h>

int main(void) {
    printf("char=%zu short=%zu int=%zu long=%zu longlong=%zu\\n",
           sizeof(char), sizeof(short), sizeof(int), sizeof(long), sizeof(long long));
    printf("float=%zu double=%zu pointer=%zu\\n",
           sizeof(float), sizeof(double), sizeof(int *));

    printf("\\nINT_MAX = %d\\n", INT_MAX);
    printf("INT_MAX + 1 = %d  <-- 溢出回绕\\n", INT_MAX + 1);

    printf("\\n0.1 + 0.2 = %.17f\\n", 0.1 + 0.2);
    printf("0.1+0.2 == 0.3 ? %s\\n", (0.1 + 0.2 == 0.3) ? "true" : "false");
    printf("差值 < 1e-9 ? %s\\n", (0.1 + 0.2 - 0.3 < 1e-9 && 0.1 + 0.2 - 0.3 > -1e-9) ? "true" : "false");

    printf("\\n5 / 2 = %d\\n", 5 / 2);
    printf("5 / 2.0 = %f\\n", 5 / 2.0);
    printf("(double)5 / 2 = %f\\n", (double)5 / 2);
    return 0;
}`,
    tips: [
      '打印 `size_t` 用 `%zu`；打印 `long long` 用 `%lld`。格式符和类型不匹配，输出就是垃圾。',
      '别用 `#define PI 3.14` 存常量，用 `const double PI = 3.14159;` 有类型检查。'
    ],
    traps: [
      '`char` 存 200 会溢出成 -56（有符号 char），要存 0~255 用 `unsigned char`。',
      '`sizeof(a) / sizeof(a[0])` 求数组长度只在数组本身作用域里有效，传进函数就退化成指针了。'
    ]
  },

  {
    id: 'c-var',
    ch: 'c1',
    title: '变量、常量、作用域与 static',
    tag: '必学',
    brief: '局部变量不初始化就是垃圾值；static 让变量"活到程序结束"。',
    tags: ['变量', '常量', 'const', 'static', 'extern', '作用域', '生命周期'],
    body: `
      <h2>四个存储类别</h2>
      <table>
        <tr><th>关键字</th><th>位置</th><th>生命周期</th><th>用途</th></tr>
        <tr><td>（默认）局部</td><td>栈</td><td>函数结束就销毁</td><td>普通局部变量</td></tr>
        <tr><td><code>static</code> 局部</td><td>静态区</td><td>整个程序运行期</td><td>计数器、缓存</td></tr>
        <tr><td><code>static</code> 全局/函数</td><td>静态区</td><td>整个程序</td><td>文件内私有，别的文件看不见</td></tr>
        <tr><td><code>extern</code></td><td>别的文件</td><td>——</td><td>跨文件引用全局变量</td></tr>
      </table>

      <h2>必须记住的一条</h2>
      <p><strong>局部变量不初始化 = 里面是垃圾值。</strong>不是 0，是上一次别人用这块内存留下的东西。所以：</p>
      <pre><code>int sum;          // 错：垃圾值
int sum = 0;      // 对</code></pre>
      <p>全局变量和 static 变量会被自动初始化为 0，这是它们的特权。</p>

      <h2>const 不是"编译期常量"</h2>
      <p><code>const int n = 10;</code> 说的是"不能通过 n 改"，但用它做数组长度在 C 里不一定合法（C99 变长数组可以，C++ 里可以）。真正的编译期常量用 <code>#define</code> 或 <code>enum</code>。</p>

      <h2>static 最实用的两个场景</h2>
      <ul>
        <li>函数内计数器：函数调用完了值还在，下次接着加。</li>
        <li>限制可见性：一个 .c 里的 <code>static</code> 函数，别的文件链接不到，等于私有方法。</li>
      </ul>
    `,
    code: `#include <stdio.h>

int g_count = 100;          // 全局变量，自动初始化为 0（这里手动给了 100）

int next_id(void) {
    static int id = 0;      // 只初始化一次，之后一直累加
    id++;
    return id;
}

void show_scope(void) {
    int local = 1;          // 每次进来都是新的
    static int persist = 1; // 只初始化一次
    local++;
    persist++;
    printf("local=%d  static persist=%d\\n", local, persist);
}

int main(void) {
    printf("第一次调用：id=%d\\n", next_id());
    printf("第二次调用：id=%d\\n", next_id());
    printf("第三次调用：id=%d\\n", next_id());

    printf("\\n");
    show_scope();
    show_scope();
    show_scope();

    {
        int local = 999;    // 块作用域，出了大括号就没了
        printf("\\n块内 local=%d\\n", local);
    }

    const int MAX = 5;      // 只读变量
    printf("全局 g_count=%d, 只读 MAX=%d\\n", g_count, MAX);
    return 0;
}`,
    tips: [
      '给变量起名别用 `a1 a2 a3`，用 `len / count / head / next` 这种，三天后你还看得懂。',
      '变量定义尽量靠近第一次使用的位置，别全堆在函数开头（老 C89 才强制那样）。'
    ],
    traps: [
      '`static` 局部变量在多线程里不安全，因为所有调用共享同一份。',
      '同名变量在内层作用域会"遮蔽"外层，编译器不一定警告你。'
    ]
  },

  {
    id: 'c-op',
    ch: 'c1',
    title: '运算符、类型转换与位运算',
    tag: '必学',
    brief: 'i++ 和 ++i 的区别、优先级、以及数据结构里常用的位技巧。',
    tags: ['运算符', '优先级', '自增', '类型转换', '位运算', '移位', '异或'],
    body: `
      <h2>除法和取模</h2>
      <p>两个整数相除是<strong>截断</strong>（向零取整）：<code>-7 / 2 == -3</code>；取模符号跟着被除数：<code>-7 % 2 == -1</code>。取模常用来做哈希和循环队列下标。</p>

      <h2>i++ 和 ++i</h2>
      <pre><code>int i = 1;
int a = i++;   // a=1, i=2  先取值再自增
int b = ++i;   // i=3, b=3  先自增再取值</code></pre>
      <p>单独写一行时两者没区别。<strong>别在同一个表达式里对同一变量多次自增</strong>（<code>i = i++ + ++i</code>），那是未定义行为，不同编译器结果不同，纯属给自己找麻烦。</p>

      <h2>类型转换</h2>
      <ul>
        <li>隐式：<code>char → int → long → float → double</code>，低精度往高精度转。</li>
        <li>显式：<code>(double)5 / 2</code> 得到 2.5，不写就是 2。</li>
        <li>危险方向：把 <code>double</code> 塞回 <code>int</code> 会直接截断小数，<code>(int)3.99 == 3</code>。</li>
      </ul>

      <h2>位运算（数据结构里超常用）</h2>
      <table>
        <tr><th>运算</th><th>含义</th><th>典型用法</th></tr>
        <tr><td><code>a &amp; b</code></td><td>按位与</td><td>取某一位、判奇偶 <code>a &amp; 1</code></td></tr>
        <tr><td><code>a | b</code></td><td>按位或</td><td>置位</td></tr>
        <tr><td><code>a ^ b</code></td><td>异或</td><td>交换两数、找只出现一次的数</td></tr>
        <tr><td><code>~a</code></td><td>按位取反</td><td>配合与运算清位</td></tr>
        <tr><td><code>a &lt;&lt; k</code></td><td>左移 k 位</td><td>乘 2ᵏ，构造掩码</td></tr>
        <tr><td><code>a &gt;&gt; k</code></td><td>右移 k 位</td><td>除 2ᵏ，取中间位</td></tr>
      </table>
      <p>异或三条性质（面试爱考）：<code>a^a=0</code>、<code>a^0=a</code>、满足交换律结合律。所以一堆数里只有一个出现奇数次，全部异或起来就剩它。</p>
      <div class="note">下面程序里那个交换两数的写法很酷，但工程上别用——可读性差，而且 <code>a^b</code> 溢出时在 C 里是未定义行为。知道就行。</div>
    `,
    code: `#include <stdio.h>

int main(void) {
    printf("7 / 2 = %d, 7 %% 2 = %d\\n", 7 / 2, 7 % 2);
    printf("-7 / 2 = %d, -7 %% 2 = %d\\n", -7 / 2, -7 % 2);

    int i = 1;
    printf("\\ni=%d, i++ 返回 %d，之后 i=%d\\n", i, i++, i);
    printf("i=%d, ++i 返回 %d，之后 i=%d\\n", i, ++i, i);

    printf("\\n(int)3.99 = %d\\n", (int)3.99);
    printf("5/2 = %d, (double)5/2 = %.2f\\n", 5 / 2, (double)5 / 2);

    unsigned int x = 12;       // 二进制 1100
    printf("\\nx=%u（二进制 1100）\\n", x);
    printf("x & 4 = %u    取第 3 位\\n", x & 4);
    printf("x | 2 = %u   置第 2 位\\n", x | 2);
    printf("x ^ 15 = %u   翻位\\n", x ^ 15);
    printf("x << 1 = %u       乘 2\\n", x << 1);
    printf("x >> 1 = %u       除 2\\n", x >> 1);
    printf("判奇偶：7 & 1 = %d, 8 & 1 = %d\\n", 7 & 1, 8 & 1);

    // 异或找单身狗
    int arr[] = {2, 3, 2, 4, 4};
    int once = 0;
    for (int k = 0; k < 5; k++) once ^= arr[k];
    printf("\\n{2,3,2,4,4} 里只出现一次的是：%d\\n", once);
    return 0;
}`,
    tips: [
      '优先用 `x & 1` 判奇偶、`x << 1` 乘 2，位运算比乘除快，而且面试官爱看。',
      '写复杂表达式时加括号。C 的优先级表没人背得下来，包括写编译器的那批人。'
    ],
    traps: [
      '`=` 和 `==` 混用是新手第一杀手：`if (a = 5)` 永远为真，编译器只给个警告。',
      '有符号数右移是算术右移（补符号位），无符号才是逻辑右移，负数右移结果不同。'
    ]
  },

  {
    id: 'c-io',
    ch: 'c1',
    title: 'printf / scanf：格式控制与缓冲区的坑',
    tag: '必学',
    brief: 'scanf 忘了 & 会崩，%d 配 double 会输出垃圾，gets 别用。',
    tags: ['printf', 'scanf', '格式符', '缓冲区', 'gets', 'fgets'],
    body: `
      <h2>常用格式符</h2>
      <table>
        <tr><th>格式</th><th>类型</th><th>示例输出</th></tr>
        <tr><td><code>%d</code></td><td>int</td><td>42</td></tr>
        <tr><td><code>%ld</code> / <code>%lld</code></td><td>long / long long</td><td>42</td></tr>
        <tr><td><code>%u</code></td><td>unsigned</td><td>42</td></tr>
        <tr><td><code>%f</code></td><td>float/double</td><td>3.140000（默认 6 位小数）</td></tr>
        <tr><td><code>%.2f</code></td><td>double</td><td>3.14</td></tr>
        <tr><td><code>%c</code></td><td>char</td><td>A</td></tr>
        <tr><td><code>%s</code></td><td>char 数组</td><td>hello</td></tr>
        <tr><td><code>%p</code></td><td>指针</td><td>000000c4f2ff9a0</td></tr>
        <tr><td><code>%zu</code></td><td>size_t</td><td>4</td></tr>
        <tr><td><code>%%</code></td><td>——</td><td>一个百分号</td></tr>
      </table>
      <p>宽度与对齐：<code>%5d</code> 右对齐占 5 位，<code>%-5d</code> 左对齐，<code>%05d</code> 补零。</p>

      <h2>scanf 三条铁律</h2>
      <ol>
        <li><strong>变量要取地址</strong>：<code>scanf("%d", &amp;n)</code>。数组名本身就是地址，所以 <code>scanf("%s", buf)</code> 不加 &amp;。</li>
        <li><strong>检查返回值</strong>：返回成功读入的项数，失败返回 EOF。输入不匹配时变量值不变，后面全乱。</li>
        <li><strong>%c 会吃空白</strong>：上一个 <code>scanf("%d")</code> 留下的 <code>\\n</code> 会被 <code>%c</code> 读走。解决：<code>scanf(" %c", &amp;ch)</code>（%c 前加空格跳过空白）。</li>
      </ol>

      <h2>字符串输入</h2>
      <p><code>gets()</code> 已经在 C11 里被删除，因为它不检查长度，必溢出。<strong>用 <code>fgets(buf, sizeof(buf), stdin)</code></strong>，注意它会连换行符一起读进去，必要时手动去掉。</p>
      <div class="note">下面这个程序用了 scanf，运行前先在底部「标准输入」面板填数字，或者直接默认输入跑。</div>
    `,
    code: `#include <stdio.h>
#include <string.h>

int main(void) {
    int age;
    char name[32];

    printf("请输入年龄和名字（例如：20 Tom）：");
    fflush(stdout);

    // 标准输入面板里给了 "20 Tom"，所以这里能读到
    if (scanf("%d", &age) != 1) {
        printf("\\n没读到整数，检查一下输入格式。\\n");
        return 1;
    }
    scanf("%31s", name);   // %31s 限制长度，防止溢出

    printf("你好，%s，你 %d 岁。\\n", name, age);
    printf("宽 5 右对齐：[%5d]  左对齐：[%-5d]  补零：[%05d]\\n", age, age, age);

    double pi = 3.14159265;
    printf("默认 6 位小数：%f\\n", pi);
    printf("保留 2 位    ：%.2f\\n", pi);
    printf("百分号       ：%.0f%%\\n", pi * 100);

    // fgets 会保留换行符
    char line[64];
    printf("\\n再输入一行文字：");
    fflush(stdout);
    if (fgets(line, sizeof(line), stdin) != NULL) {
        line[strcspn(line, "\\n")] = '\\0';   // 去掉换行
        printf("读到：[%s]，长度 %zu\\n", line, strlen(line));
    }
    return 0;
}`,
    stdin: `20 Tom
我在学数据结构`,
    tips: [
      '输出到屏幕前崩了？加 `fflush(stdout)` 或在 printf 里加 `\\n`。',
      '读一行带空格的字符串用 `fgets`，不要用 `scanf("%s")`（遇空格就停）。'
    ],
    traps: [
      '`scanf("%d", n)` 少了 &，程序大概率直接崩，报错还看不懂。',
      '`scanf("%f", &d)` 里 d 是 double 时必须用 `%lf`，否则读进来的是垃圾。'
    ],
    exercises: ['ex-io-sum']
  },

  {
    id: 'c-flow',
    ch: 'c1',
    title: '分支与循环：switch 穿透和三种循环的选择',
    tag: '必学',
    brief: 'if/switch/for/while/do-while，加上 break 与 continue 的边界。',
    tags: ['if', 'switch', 'for', 'while', 'do while', 'break', 'continue'],
    body: `
      <h2>switch 的两个特点</h2>
      <ul>
        <li><strong>穿透（fall through）</strong>：不写 <code>break</code> 会继续执行下一个 case。有时候是特性（多个 case 共用逻辑），更多时候是 bug。</li>
        <li><strong>只能判整型/字符/枚举</strong>，不能判浮点和字符串。判字符串用 <code>strcmp</code> + if。</li>
      </ul>

      <h2>三种循环怎么选</h2>
      <table>
        <tr><th>循环</th><th>特点</th><th>典型场景</th></tr>
        <tr><td><code>for</code></td><td>次数明确</td><td>遍历数组/链表、计数</td></tr>
        <tr><td><code>while</code></td><td>先判断再执行，可能一次都不执行</td><td>"直到满足条件"</td></tr>
        <tr><td><code>do...while</code></td><td>先执行一次再判断</td><td>菜单、至少读一次输入</td></tr>
      </table>

      <h2>break vs continue</h2>
      <p><code>break</code> 跳出<strong>整个</strong>循环，<code>continue</code> 只跳过<strong>本次</strong>。注意：它们只影响最内层那一层循环，嵌套循环里想跳出两层，要么用标志变量，要么用 <code>goto</code>（对，goto 在这里是干净的写法）。</p>

      <h2>循环写错的经典三种</h2>
      <ul>
        <li>死循环：<code>while (i &lt; n)</code> 里忘了 <code>i++</code>。本程序 5 秒会被强制掐掉。</li>
        <li>差一错误（off-by-one）：<code>i &lt;= n</code> 写成 <code>i &lt; n</code>，或者数组遍历到 <code>a[n]</code>。</li>
        <li>在 for 循环体里改循环变量，把步长逻辑搞乱。</li>
      </ul>
    `,
    code: `#include <stdio.h>

int main(void) {
    // if - else if 链
    int score = 87;
    if (score >= 90)       printf("等级 A\\n");
    else if (score >= 80)  printf("等级 B\\n");
    else if (score >= 60)  printf("等级 C\\n");
    else                   printf("不及格\\n");

    // switch：注意 break
    int day = 3;
    switch (day) {
    case 1: case 2: case 3: case 4: case 5:
        printf("工作日\\n");
        break;
    case 6: case 7:
        printf("周末\\n");
        break;
    default:
        printf("非法输入\\n");
    }

    // for：次数明确
    int sum = 0;
    for (int i = 1; i <= 100; i++) sum += i;
    printf("1..100 的和 = %d\\n", sum);

    // while：条件驱动
    int n = 12345, digits = 0;
    while (n > 0) {
        digits++;
        n /= 10;
    }
    printf("12345 有 %d 位\\n", digits);

    // do-while：至少执行一次
    int count = 0;
    do {
        count++;
    } while (count < 1);
    printf("do-while 至少跑了一次，count=%d\\n", count);

    // break / continue
    printf("\\n1..10 里跳过 3 的倍数：");
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0) continue;
        printf("%d ", i);
    }
    printf("\\n");

    // 嵌套循环 + 标志位跳出
    int found = 0;
    for (int i = 0; i < 5 && !found; i++) {
        for (int j = 0; j < 5; j++) {
            if (i * j == 6) {
                printf("找到 i=%d, j=%d\\n", i, j);
                found = 1;
                break;
            }
        }
    }
    return 0;
}`,
    tips: [
      '`for` 循环里声明循环变量（`for (int i = 0; ...)`）是 C99 特性，现代编译器都支持。',
      '循环里读输入：`while (scanf("%d", &x) == 1)`，这写法能自动处理输入结束。'
    ],
    traps: [
      '`for (i = 0; i < n; i++);` 多了一个分号，循环体变成空语句，后面的代码只执行一次。',
      '`if (a == 1 || a == 2 && b == 3)` 的优先级是 `&&` 高于 `||`，不想要这种效果就加括号。'
    ],
    exercises: ['ex-loop-sum']
  }

  );
})();
