/* ============================================================
   第 0 章：开始之前 —— 全局数据容器 + 学习路线 / 调试 / 复杂度
   ============================================================ */
window.CURRICULUM = window.CURRICULUM || { chapters: [], lessons: [], exercises: [] };

(function () {
  var C = window.CURRICULUM;

  C.chapters = [
    { id: 'ch0', name: '第 0 章 · 开始之前' },
    { id: 'c1', name: '第 1 章 · C 语言核心语法' },
    { id: 'c2', name: '第 2 章 · 线性表' },
    { id: 'c3', name: '第 3 章 · 栈与队列' },
    { id: 'c4', name: '第 4 章 · 串与 KMP' },
    { id: 'c5', name: '第 5 章 · 树与二叉树' },
    { id: 'c6', name: '第 6 章 · 图' },
    { id: 'c7', name: '第 7 章 · 查找' },
    { id: 'c8', name: '第 8 章 · 排序' },
    { id: 'ex', name: '练习题' }
  ];

  C.lessons.push(

  /* ─────────────────────────── 欢迎 ─────────────────────────── */
  {
    id: 'w-welcome',
    ch: 'ch0',
    title: '欢迎：怎么用这个台子',
    tag: '从这里开始',
    brief: '先搞清楚界面怎么用、代码怎么跑、内容怎么组织，再开始敲。',
    tags: ['入门', '使用说明', '学习路线', '大纲'],
    body: `
      <h2>这玩意儿是什么</h2>
      <p>你眼前这个界面长得像 VS Code，不是因为我怀旧，而是因为你要习惯它——以后写 C、写 Python、写啥都在这种界面里。左边选知识点，中间敲代码，右边看讲解，下面看真实输出。</p>
      <p>和那些"在线教程 + 假输出"不一样：<strong>你写的每一行代码都会真的交给本机的 gcc 编译、真的执行</strong>。编译不过会红着告诉你哪一行错了，死循环会在 5 秒后被掐死。</p>

      <h2>四步用法</h2>
      <ol>
        <li><strong>选</strong>：点左侧大纲里的知识点，右边出现讲解，中间自动载入示例代码。</li>
        <li><strong>跑</strong>：<code>Ctrl+Enter</code> 或点右上「运行」。先看输出，再看代码，比反过来有效十倍。</li>
        <li><strong>改</strong>：把示例改坏、改好、改得面目全非。改完再跑，看结果怎么变。这一步才叫学。</li>
        <li><strong>练</strong>：练习题里有骨架和标准输出，点「检查答案」自动判对错。</li>
      </ol>

      <h2>内容怎么组织的</h2>
      <p>两条线并行：<em>语言线</em>（C 语法，第 1 章）和<em>结构线</em>（第 2–8 章，数据结构）。<strong>别跳过第 1 章</strong>，因为你后面写链表、写树的代码，全靠指针和结构体撑着；指针没搞明白，链表就是天书。</p>
      <table>
        <tr><th>章节</th><th>核心内容</th><th>前置</th></tr>
        <tr><td>第 1 章</td><td>类型、指针、数组、结构体、动态内存、文件</td><td>无</td></tr>
        <tr><td>第 2 章</td><td>顺序表、单/双/循环链表、静态链表</td><td>指针 + 结构体</td></tr>
        <tr><td>第 3 章</td><td>栈、队列、循环队列、表达式求值</td><td>数组 + 链表</td></tr>
        <tr><td>第 4 章</td><td>串、KMP</td><td>数组</td></tr>
        <tr><td>第 5 章</td><td>二叉树、遍历、线索树、哈夫曼、BST、AVL、B 树</td><td>指针 + 递归</td></tr>
        <tr><td>第 6 章</td><td>图的存储、DFS/BFS、最小生成树、最短路、拓扑排序</td><td>队列 + 数组</td></tr>
        <tr><td>第 7 章</td><td>顺序/折半/分块查找、哈希表</td><td>数组</td></tr>
        <tr><td>第 8 章</td><td>插入/希尔/冒泡/快排/选择/堆/归并/基数排序</td><td>数组 + 递归</td></tr>
      </table>

      <h2>三个真的建议</h2>
      <ul>
        <li><strong>手敲，别复制。</strong>复制粘贴的代码过不了手，考试和面试也不给复制。</li>
        <li><strong>先让它跑起来，再让它优雅。</strong>初学者最常见的死法是想一次写对，然后编译错误堆成山，直接劝退。</li>
        <li><strong>每个数据结构都手写一遍"初始化 + 插入 + 删除 + 遍历"。</strong>这四个操作写顺了，这章就过了。</li>
      </ul>
      <div class="note">下面这段代码先跑一下，确认环境通了。跑不动就说明 gcc 没配好，去左下角「设置」看一眼编译器状态。</div>
    `,
    code: `#include <stdio.h>

int main(void) {
    printf("C-Learn Studio 就绪。\\n");
    printf("本机 gcc 真编译，不是假输出。\\n\\n");

    for (int i = 1; i <= 5; i++) {
        printf("第 %d 次：边写边跑，才是学 C 的正确姿势\\n", i);
    }
    return 0;
}`,
    tips: [
      '`Ctrl+Enter` 运行，`Ctrl+S` 存草稿（其实每 0.5 秒也自动存）。',
      '点左下角状态栏的 `C11` 那里不会有反应，别乱点。',
      '教程面板可以拖中间的竖线调宽，读代码时很爽。'
    ],
    traps: [
      '别把「运行」当成「保存」，代码不会自动同步到磁盘项目里，只存在浏览器 localStorage。'
    ]
  },

  /* ─────────────────────────── 调试 ─────────────────────────── */
  {
    id: 'w-debug',
    ch: 'ch0',
    title: '怎么读报错：编译期 / 运行期 / 逻辑错',
    tag: '必学',
    brief: '90% 的"我不会写 C"其实是"我不会读报错"。',
    tags: ['调试', 'gcc', '错误', '段错误', 'warning', 'printf'],
    body: `
      <h2>错误分三种，处理方式完全不同</h2>
      <table>
        <tr><th>类型</th><th>什么时候报</th><th>典型信息</th><th>怎么查</th></tr>
        <tr><td>编译错误</td><td>还没运行就报</td><td><code>error: expected ';'</code></td><td>看行号，从第一个错误改起</td></tr>
        <tr><td>运行错误</td><td>跑起来才崩</td><td>程序直接退出 / 退出码 -1073741819</td><td>printf 打点 + 边界检查</td></tr>
        <tr><td>逻辑错误</td><td>不报错，结果不对</td><td>无</td><td>打印中间变量，手算对比</td></tr>
      </table>

      <h2>读编译错误的三个规矩</h2>
      <ol>
        <li><strong>只看第一个 error。</strong>后面的错误大概率是第一个引发的连锁反应，改完第一个再重新编译。</li>
        <li><strong>行号可能偏一行。</strong>gcc 常把"少个分号"报到下一行，往上找找。</li>
        <li><strong>warning 别当没看见。</strong>没初始化的变量、类型不匹配、返回值缺失，warning 往往就是 bug 的预告片。</li>
      </ol>

      <h2>段错误（Segmentation fault）怎么活下来</h2>
      <p>在 Windows 上通常表现为程序没有任何输出就结束，退出码是一串负数。原因基本就四个：</p>
      <ul>
        <li>指针没初始化就用（<em>野指针</em>）。</li>
        <li>数组越界：<code>int a[5]</code> 你访问了 <code>a[5]</code>。</li>
        <li><code>malloc</code> 失败没判断就解引用。</li>
        <li>free 之后继续用（<em>悬空指针</em>）。</li>
      </ul>
      <div class="note">定位方法：在可疑位置插 <code>printf("到这里了 %d\\n", __LINE__);</code>，看它停在哪一句前面。土，但好用，全世界都在用。</div>

      <h2>下面这段代码有 3 个坑</h2>
      <p>运行一下，看看你能不能靠输出找出问题在哪。找到后把它改对。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    // 坑 1：未初始化的指针
    int *p;
    // *p = 10;   // 取消注释这行，程序会直接崩

    // 坑 2：数组越界（合法下标是 0..4）
    int a[5] = {1, 2, 3, 4, 5};
    printf("a[4] = %d\\n", a[4]);
    // printf("a[5] = %d\\n", a[5]);   // 越界，值是垃圾

    // 坑 3：malloc 后没 free（这里演示正确写法）
    int *q = (int *)malloc(sizeof(int) * 3);
    if (q == NULL) {
        printf("内存分配失败\\n");
        return 1;
    }
    q[0] = 7;
    printf("q[0] = %d\\n", q[0]);
    free(q);
    q = NULL;

    printf("到这里都没崩，说明三个坑都躲过去了\\n");
    return 0;
}`,
    tips: [
      '编译时加 `-Wall -Wextra`（本程序默认就开着），gcc 会免费帮你抓一堆问题。',
      '把 `printf` 打点和 `__LINE__` 结合，是这个世界上性价比最高的调试手段。',
      'Windows 下退出码看起来像 3221225477，那其实就是 0xC0000005 访问冲突。'
    ],
    traps: [
      '别用中文标点写代码：`；` `，` `（）` 会让 gcc 报一堆看不懂的错。',
      '`void main()` 是老教材写法，标准写法是 `int main(void)` 并 `return 0;`。'
    ],
    exercises: ['ex-hello']
  },

  /* ─────────────────────────── 复杂度 ─────────────────────────── */
  {
    id: 'w-complexity',
    ch: 'ch0',
    title: '复杂度：大 O 到底怎么算',
    tag: '必学',
    brief: '只看最高阶项、丢掉常数。会数循环嵌套，就够应付 95% 的题。',
    tags: ['时间复杂度', '空间复杂度', '大O', 'O(n)', '算法分析', 'ASL'],
    body: `
      <h2>一句话定义</h2>
      <p>时间复杂度不是"跑了几秒"，而是<strong>基本操作次数随问题规模 n 增长的量级</strong>。写 <code>O(f(n))</code> 时只保留最高阶项，并且丢掉系数。</p>
      <p><code>3n² + 5n + 100</code> → <code>O(n²)</code>。因为 n 大了以后，n² 一项就把其他全盖住了。</p>

      <h2>常见量级从快到慢</h2>
      <table>
        <tr><th>量级</th><th>典型场景</th><th>n = 10⁶ 时的量级</th></tr>
        <tr><td>O(1)</td><td>数组随机访问、哈希查找</td><td>1</td></tr>
        <tr><td>O(log n)</td><td>折半查找、平衡树、堆调整</td><td>20</td></tr>
        <tr><td>O(n)</td><td>一次遍历、顺序查找</td><td>10⁶</td></tr>
        <tr><td>O(n log n)</td><td>快排/归并/堆排序</td><td>2×10⁷</td></tr>
        <tr><td>O(n²)</td><td>冒泡、插入、选择、朴素匹配</td><td>10¹²（基本没戏）</td></tr>
        <tr><td>O(2ⁿ) / O(n!)</td><td>子集枚举、全排列</td><td>别想了</td></tr>
      </table>

      <h2>三招数循环</h2>
      <ul>
        <li><strong>单层循环</strong>：循环体 O(1) 且跑 n 次 → O(n)。</li>
        <li><strong>嵌套循环</strong>：各层相乘。<code>for(i&lt;n) for(j&lt;n)</code> → O(n²)。</li>
        <li><strong>循环变量成倍变化</strong>：<code>i *= 2</code> 跑 log₂n 次 → O(log n)。</li>
      </ul>
      <p>易错点：<code>for (i = 0; i &lt; n; i++) for (j = i; j &lt; n; j++)</code> 的执行次数是 <code>n(n+1)/2</code>，还是 <code>O(n²)</code>，不是 O(n)。</p>

      <h2>空间复杂度</h2>
      <p>只算<strong>额外</strong>开辟的空间，输入本身不算。原地算法 O(1)，开一个长度 n 的辅助数组就是 O(n)，递归还要算栈深度（快速排序递归深度平均 O(log n)，最坏 O(n)）。</p>

      <h2>数据结构里那个 ASL</h2>
      <p>查找成功时的平均查找长度 <code>ASL = Σ pᵢcᵢ</code>，等概率时就是"每个元素查找次数的平均值"。折半查找的 ASL 约 <code>log₂(n+1) − 1</code>，这是考试常客。</p>
      <div class="note">跑一下下面的代码，看同一件事用 O(n) 和 O(n²) 做，操作次数差多少。n 从 10 加到 1000 的时候，你就明白为什么要抠复杂度了。</div>
    `,
    code: `#include <stdio.h>

// O(1)：一次运算
long long constant_work(int n) {
    return (long long)n * (n + 1) / 2;
}

// O(n)：循环累加
long long linear_work(int n) {
    long long s = 0;
    for (int i = 1; i <= n; i++) s += i;
    return s;
}

// O(n^2)：双重循环
long long quad_work(int n) {
    long long s = 0;
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            s++;
    return s;
}

// O(log n)：i 每次翻倍
int log_work(int n) {
    int cnt = 0;
    for (int i = 1; i < n; i *= 2) cnt++;
    return cnt;
}

int main(void) {
    int sizes[] = {10, 100, 1000};
    for (int k = 0; k < 3; k++) {
        int n = sizes[k];
        printf("n = %-5d  O(1)=%-8lld  O(n)=%-10lld  O(n^2)=%-10lld  O(log n)=%d\\n",
               n, constant_work(n), linear_work(n), quad_work(n), log_work(n));
    }
    printf("\\n注意：O(n^2) 那列的倍数增长是平方级的。\\n");
    return 0;
}`,
    tips: [
      '分析递归算法：写出递推式 `T(n) = aT(n/b) + f(n)`，或者直接数「每个结点做多少事 × 结点数」。',
      '面试/考试里说复杂度，务必说清是「平均」「最坏」还是「最好」，三者可能差很远（快排就是典型）。'
    ],
    traps: [
      'O(2n) 和 O(n+100) 都写成 O(n)，别写成 O(2n) 让老师扣分。',
      '空间复杂度别把输入数组算进去。'
    ],
    exercises: ['ex-loop-sum']
  }

  );
})();
