/* ============================================================
   学习路线 + 判断题的结构约束
   ------------------------------------------------------------
   LEARNING_PATH：零基础到能写题的顺序（62 个知识点全部覆盖，顺序比章节更"可执行"）
                  同时承担"前置依赖"——路径上的前一个就是后一个的前置。
   EX_RULES    ：每道练习题"应该练什么"的轻量结构约束。
                  只做提示，不判错——输出对了但没用到该用的东西，会提醒一句，
                  因为把答案 printf 死也能过判题，这层是防那种情况。
   ============================================================ */
(function () {
  'use strict';

  window.LEARNING_PATH = [
    {
      name: '第 1 站 · 先让它跑起来',
      desc: '编译四阶段、怎么读报错、大 O。这三个不过关，后面全是撞墙。',
      ids: ['w-welcome', 'w-debug', 'w-complexity', 'c-hello', 'c-types', 'c-var', 'c-io']
    },
    {
      name: '第 2 站 · C 的底子',
      desc: '运算、流程、数组、指针、字符串、结构体、内存、文件、宏。指针这一关必须自己写一遍。',
      ids: ['c-op', 'c-flow', 'c-array', 'c-pointer', 'c-pointer2', 'c-string',
            'c-struct', 'c-union-enum', 'c-malloc', 'c-file', 'c-macro']
    },
    {
      name: '第 3 站 · 线性结构',
      desc: '顺序表 / 链表 / 栈 / 队列 / 串。这一段的目标是"能手写增删查改"，不是看懂。',
      ids: ['d-adt', 'd-seqlist', 'd-seqlist-app', 'd-linklist', 'd-linklist-ops',
            'd-linklist-app', 'd-dlink', 'd-static', 'd-linear-compare',
            'd-stack', 'd-stack-app', 'd-expr', 'd-queue', 'd-queue-link', 'd-queue-app',
            'd-string', 'd-kmp']
    },
    {
      name: '第 4 站 · 树与图',
      desc: '遍历是地基，BST/AVL 是平衡，图是应用。B 树和关键路径可以先跳过，回头再补。',
      ids: ['d-tree-basic', 'd-tree-store', 'd-tree-traverse', 'd-tree-build', 'd-thread',
            'd-huffman', 'd-bst', 'd-avl', 'd-btree', 'd-unionfind',
            'd-graph-store', 'd-graph-traverse', 'd-mst', 'd-shortest', 'd-topo', 'd-critical']
    },
    {
      name: '第 5 站 · 查找与排序',
      desc: '哈希和快排是面试高频，八大排序的对比表要能默写。',
      ids: ['d-search-seq', 'd-search-block', 'd-hash', 'd-sort-basic', 'd-sort-insert',
            'd-sort-shell', 'd-sort-swap', 'd-sort-select', 'd-sort-merge',
            'd-sort-radix', 'd-sort-compare']
    }
  ];

  /* 路径里所有 id 的扁平顺序，用来算"前置"和"下一站" */
  window.PATH_ORDER = window.LEARNING_PATH.reduce(function (acc, s) {
    return acc.concat(s.ids);
  }, []);

  /* ------------------------------------------------------------
     结构约束：只写"这题的重点"，正则命中任意一条即可；全不命中才提醒。
     why 是给用户看的一句话，别写成教条。
     ------------------------------------------------------------ */
  window.EX_RULES = {
    'ex-hello': { must: [/printf\s*\(/], why: '这题就是练 printf 的格式控制' },
    'ex-io-sum': { must: [/scanf\s*\(/], why: '要用 scanf 真的把两个数读进来' },
    'ex-loop-sum': { must: [/for\s*\(|while\s*\(/], why: '题目要求用循环，不许手写每个数字' },
    'ex-array-reverse': { must: [/for\s*\(|while\s*\(/], why: '原地逆置要靠循环交换，不是倒着 printf' },
    'ex-pointer-swap': { must: [/\*\s*\w/, /&\s*\w/], why: '这题要练的是指针：取地址与解引用' },
    'ex-string-len': { must: [/(for|while)\s*\(/, /\bs\[/], why: '手写 strlen 要自己遍历字符' },
    'ex-struct-avg': { must: [/struct\s+\w+/, /\.\s*\w+/], why: '要用结构体数组，并按成员访问' },
    'ex-malloc-array': { must: [/\bmalloc\s*\(/, /\bfree\s*\(/], why: '动态数组必须 malloc 申请、free 归还' },
    'ex-seqlist': { must: [/(data|elem)\s*\[/, /\blen\b/], why: '顺序表题要操作 data[] 和长度 len' },
    'ex-linklist-create': { must: [/->\s*next/, /\bmalloc\s*\(/], why: '建链表要 malloc 结点并串 next' },
    'ex-linklist-del': { must: [/->\s*next/, /\bfree\s*\(/], why: '删除结点要改 next 并 free' },
    'ex-linklist-reverse': { must: [/->\s*next/], why: '逆置靠改 next 指针，不是把 data 倒着存' },
    'ex-stack': { must: [/\btop\b/], why: '顺序栈的核心是 top 下标' },
    'ex-bracket': { must: [/\btop\b|\bstack\b/i], why: '括号匹配要用栈' },
    'ex-queue': { must: [/\brear\b/, /%\s*\w+/], why: '循环队列靠 rear/front 取模绕回来' },
    'ex-kmp-next': { must: [/\bnext\b/], why: 'KMP 的重点就是 next 数组' },
    'ex-tree-props': { must: [/(lchild|left)/i], why: '统计叶子/高度要递归左右子树' },
    'ex-tree-traverse': { must: [/(lchild|left)/i], why: '遍历要递归左右孩子' },
    'ex-tree-build': { must: [/(lchild|left)/i, /(pre|in)\w*/i], why: '建树要根据前序和中序切分' },
    'ex-bst': { must: [/(lchild|left)/i], why: 'BST 插入要比较大小后往左/右走' },
    'ex-unionfind': { must: [/\bfind\b|\bfa\b|\bfather\b/i], why: '并查集的核心是 find 找根' },
    'ex-graph-traverse': { must: [/(queue|front|rear|q\[)/i], why: 'BFS 必须用队列' },
    'ex-mst': { must: [/(min|INF|lowcost|dist)/i], why: 'Prim 每轮要找当前最小的边' },
    'ex-dijkstra': { must: [/(dist|INF)/i], why: 'Dijkstra 的核心是 dist 数组的松弛' },
    'ex-topo': { must: [/(indeg|in_deg|\bdeg\b)/i], why: '拓扑排序要统计入度' },
    'ex-binary-search': { must: [/\bmid\b/], why: '折半查找的核心是 mid 与区间收缩' },
    'ex-hash': { must: [/%\s*\w+/, /\bkey\b/], why: '哈希表要真的算 key % m 得到下标' },
    'ex-insert-sort': { must: [/for\s*\(/, /\ba\[/], why: '插入排序要边比较边后移' },
    'ex-quicksort': { must: [/(partition|pivot|基准)/i], why: '快排重点是 partition 分区' },
    'ex-merge-sort': { must: [/(merge|tmp|temp)/i], why: '归并要用临时数组合并两段' },
    'ex-io-stats': { must: [/scanf\s*\(/, /for\s*\(|while\s*\(/], why: '要从输入读数据，不能把答案写死' },
    'ex-io-count': { must: [/fgets\s*\(/], why: '这题要用 fgets 读整行（scanf %s 遇空格就停）' },
    'ex-io-reverse': { must: [/scanf\s*\(/, /\ba\s*\[/], why: '要先把数读进数组再倒着输出' },
    'ex-io-primes': { must: [/for\s*\(/, /%\s*\w+/], why: '素数判断靠试除取余' }
  };
})();
