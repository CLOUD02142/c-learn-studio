/* ============================================================
   第 3 章：栈与队列
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  {
    id: 'd-stack',
    ch: 'c3',
    title: '栈：后进先出，只在表尾动手',
    tag: '必学·重点',
    brief: '顺序栈、链栈、共享栈。所有操作都是 O(1)。',
    tags: ['栈', 'LIFO', '顺序栈', '链栈', 'push', 'pop', '共享栈'],
    body: `
      <h2>一句话</h2>
      <p>栈是<strong>只能在一端（栈顶）插入和删除</strong>的线性表。后进先出（LIFO），像一摞盘子。</p>

      <h2>顺序栈</h2>
      <pre><code>typedef struct {
    int data[MAXSIZE];
    int top;        // 栈顶下标
} SqStack;</code></pre>
      <p>两种约定，选一种就别改：</p>
      <table>
        <tr><th>约定</th><th>空栈</th><th>满栈</th><th>入栈</th></tr>
        <tr><td>top 指向栈顶元素</td><td><code>top == -1</code></td><td><code>top == MAXSIZE-1</code></td><td><code>data[++top] = x</code></td></tr>
        <tr><td>top 指向栈顶上方</td><td><code>top == 0</code></td><td><code>top == MAXSIZE</code></td><td><code>data[top++] = x</code></td></tr>
      </table>
      <p>本课用第一种（教材主流）。<strong>入栈先判满，出栈先判空</strong>，这两个判断忘了就等着越界。</p>

      <h2>链栈</h2>
      <p>用单链表实现，<strong>只在表头操作</strong>：入栈 = 头插，出栈 = 删第一个。因为表头操作 O(1)，而且不用判满（内存用完才算满）。</p>
      <p>链栈通常<strong>不带头结点</strong>，因为空栈就是 <code>top == NULL</code>，加上头结点反而多一层。</p>

      <h2>共享栈</h2>
      <p>两个栈共用一个数组，一个从左往右长，一个从右往左长，栈满条件是 <code>top1 + 1 == top2</code>。这是为了最大化利用空间，考试会考"栈满条件"。</p>

      <h2>复杂度</h2>
      <p>入栈、出栈、取栈顶都是 <span class="complexity">O(1)</span>。这就是为什么栈能用来做递归、表达式求值、括号匹配——它足够快。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXSIZE 8
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int top;               // 指向栈顶元素，空栈为 -1
} SqStack;

void InitStack(SqStack *S) {
    S->top = -1;
}

int StackEmpty(const SqStack *S) {
    return S->top == -1;
}

int StackFull(const SqStack *S) {
    return S->top == MAXSIZE - 1;
}

int Push(SqStack *S, int x) {
    if (StackFull(S)) return ERROR;
    S->data[++S->top] = x;      // 先加下标再存
    return OK;
}

int Pop(SqStack *S, int *x) {
    if (StackEmpty(S)) return ERROR;
    *x = S->data[S->top--];     // 先取再减
    return OK;
}

int GetTop(const SqStack *S, int *x) {
    if (StackEmpty(S)) return ERROR;
    *x = S->data[S->top];
    return OK;
}

void Show(const SqStack *S) {
    printf("栈底 [");
    for (int i = 0; i <= S->top; i++)
        printf("%d%s", S->data[i], i == S->top ? "" : " ");
    printf("] 栈顶   top=%d\\n", S->top);
}

/* ---------- 链栈 ---------- */
typedef struct SNode {
    int data;
    struct SNode *next;
} SNode;

typedef struct {
    SNode *top;            // 不带头结点
    int count;
} LinkStack;

void InitLinkStack(LinkStack *S) {
    S->top = NULL;
    S->count = 0;
}

int LinkPush(LinkStack *S, int x) {
    SNode *s = (SNode *)malloc(sizeof(SNode));
    if (!s) return ERROR;
    s->data = x;
    s->next = S->top;      // 头插
    S->top = s;
    S->count++;
    return OK;
}

int LinkPop(LinkStack *S, int *x) {
    if (S->top == NULL) return ERROR;
    SNode *p = S->top;
    *x = p->data;
    S->top = p->next;
    free(p);
    S->count--;
    return OK;
}

int main(void) {
    SqStack S;
    InitStack(&S);

    printf("== 顺序栈 ==\\n");
    for (int i = 1; i <= 5; i++) Push(&S, i * 11);
    Show(&S);

    int x;
    GetTop(&S, &x);
    printf("栈顶元素：%d\\n", x);

    Pop(&S, &x);
    printf("弹出一个：%d\\n", x);
    Show(&S);

    printf("\\n全部弹出：");
    while (Pop(&S, &x)) printf("%d ", x);
    printf("\\n空栈再弹：%s\\n", Pop(&S, &x) ? "成功" : "失败（栈空，这就是判空的意义）");

    printf("\\n压满 8 个：");
    for (int i = 1; i <= 8; i++) Push(&S, i);
    Show(&S);
    printf("第 9 个能进吗？%s\\n", Push(&S, 99) ? "能" : "不能（栈满）");

    printf("\\n== 链栈（不会满）==\\n");
    LinkStack LS;
    InitLinkStack(&LS);
    for (int i = 1; i <= 3; i++) LinkPush(&LS, i * 7);
    printf("链栈弹出顺序：");
    while (LinkPop(&LS, &x)) printf("%d ", x);
    printf("\\n");
    return 0;
}`,
    tips: [
      '`data[++top] = x` 和 `x = data[top--]` 这两句背下来，顺序栈就掌握一半了。',
      '写代码前先确定 top 的约定，在注释里写清楚，能省掉 80% 的 off-by-one。'
    ],
    traps: [
      '出栈只写 `top--` 不返回元素，元素就永久丢了（虽然数组里还在，但你没拿到）。',
      '链栈的头插别忘 `s->next = S->top`，否则整条链断掉。'
    ],
    exercises: ['ex-stack']
  },

  {
    id: 'd-stack-app',
    ch: 'c3',
    title: '栈的应用：括号匹配、进制转换、递归消除',
    tag: '重点',
    brief: '凡是"最近的、还没配对的"结构，就该想到栈。',
    tags: ['括号匹配', '进制转换', '栈应用', '回文', '递归消除'],
    body: `
      <h2>为什么栈这么有用</h2>
      <p>因为很多问题需要<strong>记住"最近一次的未完成状态"</strong>。看到左括号要等右括号、递归调用要回来、写运算符要等优先级高的先算——全是"后进先出"。</p>

      <h2>括号匹配</h2>
      <ol>
        <li>遇到左括号 → 入栈。</li>
        <li>遇到右括号 → 栈空则失败；否则弹出栈顶，检查类型是否配对。</li>
        <li>扫描结束 → 栈必须为空。</li>
      </ol>
      <p>三个容易漏的地方：<strong>栈空时来右括号</strong>、<strong>类型不匹配</strong>、<strong>结束时栈里还有左括号</strong>。</p>

      <h2>进制转换</h2>
      <p>十进制转二进制 = 不断除以 2 取余数，但余数是<strong>从低位到高位</strong>产生的，输出要从高位到低位——正好用栈倒过来。这个例子完美解释了 LIFO。</p>

      <h2>递归消除</h2>
      <p>函数调用的本质就是系统栈：每次调用压一个栈帧（参数、返回地址、局部变量），返回时弹出。所以<strong>任何递归都能用显式栈改写成非递归</strong>，只是代码更啰嗦。</p>

      <h2>别的经典应用</h2>
      <ul>
        <li>表达式求值（下一课专讲）。</li>
        <li>浏览器前进后退、编辑器撤销重做（双栈）。</li>
        <li>深度优先搜索 DFS（用栈代替递归）。</li>
        <li>单调栈：求"下一个更大元素"、柱状图最大矩形，O(n)。</li>
      </ul>
    `,
    code: `#include <stdio.h>
#include <string.h>

#define MAXSIZE 64

typedef struct {
    char data[MAXSIZE];
    int top;
} CharStack;

void Init(CharStack *S) { S->top = -1; }
int Empty(const CharStack *S) { return S->top == -1; }
void Push(CharStack *S, char c) { S->data[++S->top] = c; }
char Pop(CharStack *S) { return S->data[S->top--]; }
char Top(const CharStack *S) { return S->data[S->top]; }

int match(char a, char b) {
    return (a == '(' && b == ')') || (a == '[' && b == ']') || (a == '{' && b == '}');
}

// 括号匹配
int check_brackets(const char *s) {
    CharStack S;
    Init(&S);
    for (int i = 0; s[i]; i++) {
        char c = s[i];
        if (c == '(' || c == '[' || c == '{') {
            Push(&S, c);
        } else if (c == ')' || c == ']' || c == '}') {
            if (Empty(&S)) {
                printf("  位置 %d：多了一个 '%c'（栈空）\\n", i, c);
                return 0;
            }
            if (!match(Pop(&S), c)) {
                printf("  位置 %d：'%c' 类型不匹配\\n", i, c);
                return 0;
            }
        }
    }
    if (!Empty(&S)) {
        printf("  结束时还剩 '%c' 没配对\\n", Top(&S));
        return 0;
    }
    return 1;
}

// 十进制转任意进制（2~16）
void convert(int n, int base) {
    CharStack S;
    Init(&S);
    const char *digits = "0123456789ABCDEF";
    int neg = n < 0;
    if (neg) n = -n;
    if (n == 0) Push(&S, '0');
    while (n > 0) {
        Push(&S, digits[n % base]);   // 余数低位先进
        n /= base;
    }
    if (neg) printf("-");
    while (!Empty(&S)) printf("%c", Pop(&S));   // 倒序弹出 = 高位在前
    printf("\\n");
}

// 用栈判断回文
int is_palindrome(const char *s) {
    int n = (int)strlen(s);
    CharStack S;
    Init(&S);
    for (int i = 0; i < n / 2; i++) Push(&S, s[i]);
    for (int i = (n + 1) / 2; i < n; i++)
        if (Pop(&S) != s[i]) return 0;
    return 1;
}

int main(void) {
    printf("== 括号匹配 ==\\n");
    const char *tests[] = {
        "(a+b)*[c-{d+e}]",
        "([)]",
        "(((",
        ")("
    };
    for (int i = 0; i < 4; i++) {
        printf("%-16s -> %s\\n", tests[i], check_brackets(tests[i]) ? "匹配" : "不匹配");
    }

    printf("\\n== 进制转换（栈倒序）==\\n");
    printf("十进制 10 -> 二进制:  "); convert(10, 2);
    printf("十进制 255 -> 十六进制: "); convert(255, 16);
    printf("十进制, 10 -> 八进制:   "); convert(10, 8);

    printf("\\n== 判断回文 ==\\n");
    const char *words[] = {"level", "hello", "abccba", "abc"};
    for (int i = 0; i < 4; i++)
        printf("%-8s -> %s\\n", words[i], is_palindrome(words[i]) ? "是回文" : "不是");
    return 0;
}`,
    tips: [
      '括号匹配写成函数后，可以复用到"配置文件格式校验""代码编辑器高亮"里。',
      '改进制转换时注意 0 和负数这两个边界，很爱考。'
    ],
    traps: [
      '只判断最终栈是否为空、不判断"栈空时来右括号"，`")("` 会被误判成匹配。',
      '进制转换用 `while (n > 0)`，n=0 时什么都不输出，要单独处理。'
    ],
    exercises: ['ex-bracket']
  },

  {
    id: 'd-expr',
    ch: 'c3',
    title: '表达式求值：中缀转后缀 + 后缀计算',
    tag: '重点·难点',
    brief: '两个栈解决四则运算：一个存运算符，一个存操作数。',
    tags: ['表达式求值', '中缀', '后缀', '逆波兰', '运算符优先级', '调度场'],
    body: `
      <h2>为什么要转后缀</h2>
      <p>中缀表达式 <code>1+2*3</code> 对人类友好，对机器不友好——你得先看优先级、处理括号。后缀（逆波兰）<code>1 2 3 * +</code> 没有括号、没有优先级，从左到右一个栈就能算完。</p>

      <h2>中缀 → 后缀（调度场算法）</h2>
      <ol>
        <li>数字：直接输出。</li>
        <li>左括号：入栈。</li>
        <li>右括号：不断弹出并输出，直到遇到左括号（左括号弹出但不输出）。</li>
        <li>运算符：把栈顶<strong>优先级 ≥ 自己</strong>的运算符都弹出输出，然后自己入栈。</li>
        <li>扫描完：把栈里剩下的全弹出。</li>
      </ol>
      <p>注意第 4 条是 <code>&gt;=</code> 不是 <code>&gt;</code>。这保证了同优先级的运算符<strong>从左到右</strong>结合（左结合）。这一条是考试和实现的易错点。</p>

      <h2>后缀求值</h2>
      <p>遇到数字入栈；遇到运算符弹出两个数（<strong>先弹的是右操作数</strong>），算完再压回去。最后栈里剩下唯一一个数就是结果。</p>
      <div class="warn">减法除法的操作数顺序最容易搞反：栈里先弹出的是右边的数。写反了结果全错，而且只有减法除法会错，加减乘都对，特别难查。</div>

      <h2>优先级表</h2>
      <table>
        <tr><th>运算符</th><th>优先级</th><th>结合性</th></tr>
        <tr><td><code>(</code></td><td>入栈后最低（隔离作用）</td><td>——</td></tr>
        <tr><td><code>+ -</code></td><td>1</td><td>左</td></tr>
        <tr><td><code>* / %</code></td><td>2</td><td>左</td></tr>
        <tr><td><code>^</code>（幂）</td><td>3</td><td>右（要特判）</td></tr>
      </table>
      <div class="note">下面代码支持多位数、加减乘除和括号。先跑一遍看输出，再把 <code>2+3*4</code> 改成 <code>(2+3)*4</code> 对比结果。</div>
    `,
    code: `#include <stdio.h>
#include <string.h>
#include <ctype.h>

#define MAX 128

typedef struct {
    char op[MAX];
    int top;
} OpStack;

typedef struct {
    double num[MAX];
    int top;
} NumStack;

void initOp(OpStack *s) { s->top = -1; }
void initNum(NumStack *s) { s->top = -1; }
void pushOp(OpStack *s, char c) { s->op[++s->top] = c; }
char popOp(OpStack *s) { return s->op[s->top--]; }
char topOp(OpStack *s) { return s->op[s->top]; }
void pushNum(NumStack *s, double v) { s->num[++s->top] = v; }
double popNum(NumStack *s) { return s->num[s->top--]; }

int prec(char c) {
    if (c == '+' || c == '-') return 1;
    if (c == '*' || c == '/' || c == '%') return 2;
    return 0;                     // 左括号
}

// 中缀转后缀
void infix_to_postfix(const char *in, char *out) {
    OpStack st;
    initOp(&st);
    int k = 0;
    for (int i = 0; in[i]; i++) {
        char c = in[i];
        if (c == ' ') continue;

        if (isdigit((unsigned char)c) || c == '.') {
            while (in[i] && (isdigit((unsigned char)in[i]) || in[i] == '.'))
                out[k++] = in[i++];
            out[k++] = ' ';
            i--;
        } else if (c == '(') {
            pushOp(&st, c);
        } else if (c == ')') {
            while (st.top >= 0 && topOp(&st) != '(') {
                out[k++] = popOp(&st);
                out[k++] = ' ';
            }
            if (st.top >= 0) popOp(&st);      // 弹出 '('
        } else {
            while (st.top >= 0 && topOp(&st) != '(' && prec(topOp(&st)) >= prec(c)) {
                out[k++] = popOp(&st);
                out[k++] = ' ';
            }
            pushOp(&st, c);
        }
    }
    while (st.top >= 0) {
        out[k++] = popOp(&st);
        out[k++] = ' ';
    }
    out[k] = '\\0';
}

// 后缀求值
double eval_postfix(const char *post) {
    NumStack st;
    initNum(&st);
    for (int i = 0; post[i]; i++) {
        char c = post[i];
        if (c == ' ') continue;
        if (isdigit((unsigned char)c) || c == '.') {
            double v = 0;
            int dot = 0;
            double scale = 0.1;
            while (post[i] && (isdigit((unsigned char)post[i]) || post[i] == '.')) {
                if (post[i] == '.') {
                    dot = 1;
                } else if (!dot) {
                    v = v * 10 + (post[i] - '0');
                } else {
                    v += (post[i] - '0') * scale;
                    scale /= 10;
                }
                i++;
            }
            pushNum(&st, v);
            i--;
        } else {
            double b = popNum(&st);   // 先弹出的是右操作数
            double a = popNum(&st);
            double r = 0;
            switch (c) {
            case '+': r = a + b; break;
            case '-': r = a - b; break;
            case '*': r = a * b; break;
            case '/': r = a / b; break;
            default: break;
            }
            pushNum(&st, r);
        }
    }
    return popNum(&st);
}

int main(void) {
    const char *exprs[] = {
        "1+2*3",
        "(1+2)*3",
        "10+20*3-5",
        "100/4/5",
        "(2+3)*(4-1)",
        "3.5+2*2"
    };
    char post[256];
    for (int i = 0; i < 6; i++) {
        infix_to_postfix(exprs[i], post);
        printf("%-14s -> 后缀: %-20s = %.4g\\n", exprs[i], post, eval_postfix(post));
    }
    printf("\\n注意 100/4/5 = %.4g（从左到右），不是 100/(4/5)=125\\n", eval_postfix("100 4 / 5 / "));
    return 0;
}`,
    tips: [
      '面试手写表达式求值时，先问清"是否只有个位数""是否有括号""是否要处理浮点"，范围决定代码量。',
      '把「转后缀」和「求值」拆成两个函数，调试时能分开验证，比一把梭好查十倍。'
    ],
    traps: [
      '运算符弹栈条件写 `>` 而不是 `>=`，同优先级会变成右结合，`10-3-2` 会算成 9 而不是 5。',
      '后缀求值时把先弹出的当左操作数，减法和除法全错。'
    ]
  },

  {
    id: 'd-queue',
    ch: 'c3',
    title: '队列与循环队列：假溢出是怎么回事',
    tag: '必学·重点',
    brief: '队尾进、队头出；循环队列用取模解决假溢出，判满要浪费一个格子。',
    tags: ['队列', 'FIFO', '循环队列', '假溢出', '取模', '队头队尾'],
    body: `
      <h2>队列</h2>
      <p>先进先出（FIFO），像排队买饭。<strong>入队在队尾，出队在队头</strong>，两端都在动。</p>

      <h2>顺序队列的"假溢出"</h2>
      <p>普通顺序队列里，front 和 rear 只增不减。反复入队出队后，rear 很快到达数组末尾，但数组前面其实大片是空的——这就是<strong>假溢出</strong>。</p>
      <p>解决办法：把数组"弯成一个环"，用取模让下标回到开头。这就是<strong>循环队列</strong>。</p>
      <pre><code>rear  = (rear + 1) % MAXSIZE;
front = (front + 1) % MAXSIZE;</code></pre>

      <h2>三种判空判满的约定（重点）</h2>
      <table>
        <tr><th>方案</th><th>空</th><th>满</th><th>元素个数</th></tr>
        <tr><td>浪费一个单元（主流）</td><td><code>front == rear</code></td><td><code>(rear+1) % MAX == front</code></td><td><code>(rear - front + MAX) % MAX</code></td></tr>
        <tr><td>加 size 计数</td><td><code>size == 0</code></td><td><code>size == MAX</code></td><td><code>size</code></td></tr>
        <tr><td>加 tag 标志</td><td><code>front==rear &amp;&amp; tag==0</code></td><td><code>front==rear &amp;&amp; tag==1</code></td><td>——</td></tr>
      </table>
      <div class="warn">"浪费一个单元"是什么意思？数组长度 MAXSIZE 实际最多只能存 MAXSIZE-1 个元素。因为 front==rear 已经用来表示空了，满也必须让它们相等，只能牺牲一个位置。这是考试必考点。</div>

      <h2>为什么元素个数公式里有 +MAX</h2>
      <p>因为 <code>rear - front</code> 可能是负数（rear 绕回去了）。加上 MAXSIZE 再取模，就把它修回正数。</p>

      <h2>队列的复杂度</h2>
      <p>入队、出队都是 <span class="complexity">O(1)</span>。链队列也是 O(1)，但要多维护一个尾指针。</p>
    `,
    code: `#include <stdio.h>

#define MAXSIZE 6          // 实际最多存 5 个
#define OK 1
#define ERROR 0

typedef struct {
    int data[MAXSIZE];
    int front;             // 队头下标（指向队头元素）
    int rear;              // 队尾下标（指向队尾的下一个空位）
} SqQueue;

void InitQueue(SqQueue *Q) {
    Q->front = Q->rear = 0;
}

int QueueEmpty(const SqQueue *Q) {
    return Q->front == Q->rear;
}

int QueueFull(const SqQueue *Q) {
    return (Q->rear + 1) % MAXSIZE == Q->front;   // 浪费一个单元
}

int EnQueue(SqQueue *Q, int x) {
    if (QueueFull(Q)) return ERROR;
    Q->data[Q->rear] = x;
    Q->rear = (Q->rear + 1) % MAXSIZE;            // 取模实现循环
    return OK;
}

int DeQueue(SqQueue *Q, int *x) {
    if (QueueEmpty(Q)) return ERROR;
    *x = Q->data[Q->front];
    Q->front = (Q->front + 1) % MAXSIZE;
    return OK;
}

int QueueLength(const SqQueue *Q) {
    return (Q->rear - Q->front + MAXSIZE) % MAXSIZE;
}

void Show(const SqQueue *Q, const char *tag) {
    printf("%-12s front=%d rear=%d 长度=%d  内容：[", tag, Q->front, Q->rear, QueueLength(Q));
    for (int i = Q->front; i != Q->rear; i = (i + 1) % MAXSIZE)
        printf("%d%s", Q->data[i], (i + 1) % MAXSIZE == Q->rear ? "" : " ");
    printf("]\\n");
}

int main(void) {
    SqQueue Q;
    InitQueue(&Q);
    Show(&Q, "初始化");

    printf("\\n入队 1..4：\\n");
    for (int i = 1; i <= 4; i++) {
        EnQueue(&Q, i * 10);
        Show(&Q, "  入队后");
    }

    printf("\\n再入队一个（数组长度 %d，只能存 %d 个）：%s\\n",
           MAXSIZE, MAXSIZE - 1, EnQueue(&Q, 50) ? "成功" : "失败（判满）");

    int x;
    printf("\\n出队两次：\\n");
    DeQueue(&Q, &x); printf("  出队 %d\\n", x);
    DeQueue(&Q, &x); printf("  出队 %d\\n", x);
    Show(&Q, "出队后");

    printf("\\n注意现在 front=%d rear=%d —— rear 还差一个就撞到数组末尾了。\\n", Q.front, Q.rear);
    printf("继续入队，取模会绕回开头：\\n");
    for (int i = 0; i < 3; i++) {
        if (EnQueue(&Q, 60 + i)) {
            Show(&Q, "  入队后");
        } else {
            printf("  满了，入队 %d 失败\\n", 60 + i);
        }
    }

    printf("\\n元素个数公式：(rear - front + MAXSIZE) %% MAXSIZE = (%d - %d + %d) %% %d = %d\\n",
           Q.rear, Q.front, MAXSIZE, MAXSIZE, QueueLength(&Q));
    return 0;
}`,
    tips: [
      '循环队列的四个操作（入队、出队、判空、判满）背下来，408 每年都在考。',
      '如果不想浪费一个单元，加 `size` 变量最直观，也最不容易写错。'
    ],
    traps: [
      '`(rear+1) % MAXSIZE == front` 判满，写成 `rear+1 == front` 在绕回时会失效。',
      '入队后忘了取模 `rear`，下一次写就数组越界了。'
    ],
    exercises: ['ex-queue']
  },

  {
    id: 'd-queue-link',
    ch: 'c3',
    title: '链队列与双端队列',
    tag: '了解',
    brief: '链队列要维护队头队尾两个指针；双端队列两头都能进出。',
    tags: ['链队列', '双端队列', 'deque', '队头队尾指针'],
    body: `
      <h2>链队列</h2>
      <p>用单链表实现队列：<strong>队头在表头出，队尾在表尾入</strong>。必须同时维护 <code>front</code> 和 <code>rear</code>，否则入队要 O(n) 找尾巴。</p>
      <pre><code>typedef struct {
    LNode *front;    // 队头，出队
    LNode *rear;     // 队尾，入队
} LinkQueue;</code></pre>
      <p>通常<strong>带头结点</strong>，这样"空队列"和"队列里只有一个元素时出队"都不需要特判——不带头结点的话，删最后一个元素时 rear 会变成野指针。</p>
      <div class="warn">链队列出队时如果删的正好是最后一个结点，必须把 <code>rear</code> 重新指回头结点，否则 rear 悬空。这是链队列唯一的坑，也是最常考的点。</div>

      <h2>双端队列 deque</h2>
      <p>两端都能入队和出队。用数组实现时靠两个方向相反的指针；用双向链表实现更自然。</p>
      <table>
        <tr><th>变体</th><th>限制</th><th>等价于</th></tr>
        <tr><td>输入受限</td><td>只能一端入、两端出</td><td>——</td></tr>
        <tr><td>输出受限</td><td>两端入、只能一端出</td><td>——</td></tr>
        <tr><td>都受限</td><td>一端入一端出</td><td>就是普通队列</td></tr>
      </table>
      <p>考试常问"输入序列 1 2 3 4 能通过双端队列得到哪些输出序列"，本质是考"栈和队列的混合能力"。</p>

      <h2>为什么工程里 deque 很常用</h2>
      <p>因为它同时支持两端 O(1) 插入删除，还能随机访问（C++ 的 <code>std::deque</code> 用分段连续空间实现）。滑动窗口、BFS、单调队列都用它。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

typedef struct QNode {
    int data;
    struct QNode *next;
} QNode;

typedef struct {
    QNode *front;      // 队头（带结点）
    QNode *rear;       // 队尾
} LinkQueue;

void InitQueue(LinkQueue *Q) {
    QNode *head = (QNode *)malloc(sizeof(QNode));
    head->next = NULL;
    Q->front = Q->rear = head;      // 都指向头结点
}

int Empty(const LinkQueue *Q) {
    return Q->front == Q->rear;
}

void EnQueue(LinkQueue *Q, int x) {
    QNode *s = (QNode *)malloc(sizeof(QNode));
    s->data = x;
    s->next = NULL;
    Q->rear->next = s;     // 挂到队尾
    Q->rear = s;           // 更新队尾
}

int DeQueue(LinkQueue *Q, int *x) {
    if (Empty(Q)) return 0;
    QNode *p = Q->front->next;
    *x = p->data;
    Q->front->next = p->next;
    if (Q->rear == p)              // 关键：删的是最后一个结点
        Q->rear = Q->front;
    free(p);
    return 1;
}

void Show(const LinkQueue *Q, const char *tag) {
    printf("%s", tag);
    if (Empty(Q)) { printf("(空)\\n"); return; }
    for (QNode *p = Q->front->next; p; p = p->next)
        printf("%d%s", p->data, p->next ? " " : "");
    printf("\\n");
}

/* ---------- 数组实现双端队列 ---------- */
#define CAP 8
typedef struct {
    int data[CAP];
    int front, rear, size;
} Deque;

void InitDeque(Deque *d) { d->front = 0; d->rear = CAP - 1; d->size = 0; }
int DequeFull(const Deque *d) { return d->size == CAP; }
int DequeEmpty(const Deque *d) { return d->size == 0; }

int PushFront(Deque *d, int x) {
    if (DequeFull(d)) return 0;
    d->front = (d->front - 1 + CAP) % CAP;
    d->data[d->front] = x;
    d->size++;
    return 1;
}
int PushBack(Deque *d, int x) {
    if (DequeFull(d)) return 0;
    d->rear = (d->rear + 1) % CAP;
    d->data[d->rear] = x;
    d->size++;
    return 1;
}
int PopFront(Deque *d, int *x) {
    if (DequeEmpty(d)) return 0;
    *x = d->data[d->front];
    d->front = (d->front + 1) % CAP;
    d->size--;
    return 1;
}
int PopBack(Deque *d, int *x) {
    if (DequeEmpty(d)) return 0;
    *x = d->data[d->rear];
    d->rear = (d->rear - 1 + CAP) % CAP;
    d->size--;
    return 1;
}
void ShowDeque(const Deque *d, const char *tag) {
    printf("%-16s[", tag);
    for (int i = 0, idx = d->front; i < d->size; i++, idx = (idx + 1) % CAP)
        printf("%d%s", d->data[idx], i == d->size - 1 ? "" : " ");
    printf("]\\n");
}

int main(void) {
    printf("== 链队列 ==\\n");
    LinkQueue Q;
    InitQueue(&Q);
    printf("空队列？%s\\n", Empty(&Q) ? "是" : "否");

    for (int i = 1; i <= 5; i++) EnQueue(&Q, i * 11);
    Show(&Q, "入队 5 个：");

    int x;
    for (int i = 0; i < 3; i++) { DeQueue(&Q, &x); printf("出队 %d\\n", x); }
    Show(&Q, "剩余：");

    while (DeQueue(&Q, &x)) printf("清空：出队 %d\\n", x);
    printf("删光后 empty=%s（rear 已回退到头结点，没有悬空）\\n", Empty(&Q) ? "true" : "false");

    printf("\\n== 双端队列 ==\\n");
    Deque d;
    InitDeque(&d);
    PushBack(&d, 2); PushBack(&d, 3);
    PushFront(&d, 1); PushFront(&d, 0);
    ShowDeque(&d, "两头插入后：");

    PopFront(&d, &x); printf("从左弹出：%d\\n", x);
    PopBack(&d, &x);  printf("从右弹出：%d\\n", x);
    ShowDeque(&d, "弹出两端后：");
    return 0;
}`,
    tips: [
      '链队列牢记"删到最后一个要把 rear 拉回头结点"，这一句能救一道 408 大题。',
      '双端队列用数组实现时，两个方向都要用 `(idx ± 1 + CAP) % CAP`，别忘了 +CAP 防负数。'
    ],
    traps: [
      '链队列不带头结点时，出队最后一个元素后 rear 变野指针，下次入队直接崩。',
      'C 语言取模对负数返回负数：`(-1) % 8 == -1`，不是 7。所以必须 `+CAP` 再取模。'
    ]
  },

  {
    id: 'd-queue-app',
    ch: 'c3',
    title: '队列的应用：BFS、滑动窗口、杨辉三角',
    tag: '重点',
    brief: '凡是"一层一层处理"或"按到达顺序处理"，队列就是答案。',
    tags: ['BFS', '滑动窗口', '杨辉三角', '层次遍历', '单调队列'],
    body: `
      <h2>1. 广度优先搜索 BFS</h2>
      <p>从起点开始，先把邻居全放队列，再依次处理——天然按"距离层数"扩展。所以 BFS 求<strong>无权图最短路</strong>是对的，DFS 不是。</p>
      <pre><code>while (!empty(Q)) {
    v = dequeue(Q);
    for (每个邻居 w) if (!visited[w]) { visited[w]=1; enqueue(Q,w); }
}</code></pre>
      <p>关键：<strong>入队时就标记 visited</strong>，不是出队时。否则同一个点会被重复入队，复杂度爆炸。</p>

      <h2>2. 滑动窗口最大值（单调队列）</h2>
      <p>求每个长度为 k 的窗口的最大值。朴素做法 O(nk)，单调队列做到 O(n)：队头永远是当前窗口最大值，入队时把队尾比它小的都踢掉。</p>

      <h2>3. 杨辉三角</h2>
      <p>每一行由上一行相邻两数相加得到。用队列可以在只存一行的情况下逐行生成——虽然实际用数组更简单，但这是教材经典例子。</p>

      <h2>4. 其他应用</h2>
      <ul>
        <li>树的层序遍历（第 5 章要用）。</li>
        <li>操作系统进程调度（FCFS、循环时间片）。</li>
        <li>打印机缓冲、消息队列、生产者消费者。</li>
        <li>迷宫最短路（BFS 走格子）。</li>
      </ul>

      <h2>BFS vs DFS</h2>
      <table>
        <tr><th></th><th>BFS（队列）</th><th>DFS（栈/递归）</th></tr>
        <tr><td>扩展方式</td><td>一层一层</td><td>一条路走到底</td></tr>
        <tr><td>最短路（无权）</td><td>能求</td><td>不能</td></tr>
        <tr><td>空间</td><td>最坏 O(宽度)</td><td>O(深度)</td></tr>
      </table>
    `,
    code: `#include <stdio.h>
#include <string.h>

#define MAXN 32

/* ---------- 1. 杨辉三角（队列版）---------- */
void pascal(int rows) {
    int q[MAXN * 4];
    int front = 0, rear = 0;
    q[rear++] = 1;                    // 第一行
    for (int r = 1; r <= rows; r++) {
        q[rear++] = 0;                // 行末哨兵，方便处理最后一个
        int prev = 0;
        printf("第 %d 行：", r);
        for (int i = 0; i < r; i++) {
            int cur = q[front++];
            printf("%d ", cur);
            q[rear++] = prev + cur;   // 生成下一行
            prev = cur;
        }
        front++;                      // 丢掉哨兵
        printf("\\n");
    }
}

/* ---------- 2. 单调队列：滑动窗口最大值 ---------- */
void sliding_max(const int *a, int n, int k) {
    int dq[MAXN];                     // 存下标
    int head = 0, tail = 0;           // [head, tail)
    printf("窗口大小 %d 的最大值序列：", k);
    for (int i = 0; i < n; i++) {
        while (head < tail && dq[head] <= i - k) head++;              // 过期出队
        while (head < tail && a[dq[tail - 1]] <= a[i]) tail--;        // 小的没用，踢掉
        dq[tail++] = i;
        if (i >= k - 1) printf("%d ", a[dq[head]]);
    }
    printf("\\n");
}

/* ---------- 3. BFS 走迷宫（无权最短路）---------- */
typedef struct { int x, y, d; } Point;

int bfs_maze(char maze[][9], int rows, int cols, Point s, Point e) {
    Point q[128];
    int head = 0, tail = 0;
    int visited[MAXN][MAXN];
    memset(visited, 0, sizeof(visited));

    q[tail++] = (Point){s.x, s.y, 0};
    visited[s.x][s.y] = 1;
    int dx[] = {-1, 1, 0, 0};
    int dy[] = {0, 0, -1, 1};

    while (head < tail) {
        Point cur = q[head++];
        if (cur.x == e.x && cur.y == e.y) return cur.d;
        for (int k = 0; k < 4; k++) {
            int nx = cur.x + dx[k], ny = cur.y + dy[k];
            if (nx < 0 || nx >= rows || ny < 0 || ny >= cols) continue;
            if (maze[nx][ny] == '#' || visited[nx][ny]) continue;
            visited[nx][ny] = 1;                  // 入队时就标记！
            q[tail++] = (Point){nx, ny, cur.d + 1};
        }
    }
    return -1;
}

int main(void) {
    printf("== 杨辉三角 ==\\n");
    pascal(6);

    printf("\\n== 滑动窗口最大值 ==\\n");
    int a[] = {1, 3, -1, -3, 5, 3, 6, 7};
    sliding_max(a, 8, 3);
    printf("（朴素做法 O(nk)，单调队列 O(n)）\\n");

    printf("\\n== BFS 迷宫 ==\\n");
    char maze[5][9] = {
        "S..#....",
        ".#.#.##.",
        ".#...#..",
        ".####.#.",
        "......#E"
    };
    for (int i = 0; i < 5; i++) printf("  %s\\n", maze[i]);
    Point start = {0, 0, 0}, end = {4, 7, 0};
    int d = bfs_maze(maze, 5, 8, start, end);
    printf("最短步数：%d\\n", d);
    printf("BFS 第一次到达终点时的步数就是最短，这是 DFS 做不到的。\\n");
    return 0;
}`,
    tips: [
      'BFS 用数组模拟队列比用结构体快得多，做算法题时常用「静态数组 + head/tail 下标」。',
      '单调队列的关键是「队头过期就扔，队尾不如我就扔」，两句话搞定。'
    ],
    traps: [
      'BFS 出队时才标记 visited，同一个点会被反复入队，规模一大就超时。',
      '滑动窗口里 `dq[head] <= i - k` 的等号：窗口是 [i-k+1, i]，下标等于 i-k 的已经过期了。'
    ],
    exercises: ['ex-queue']
  }

  );
})();
