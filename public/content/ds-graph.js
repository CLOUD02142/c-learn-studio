/* ============================================================
   第 6 章：图 —— 存储、遍历、最小生成树、最短路径、拓扑排序、关键路径
   ============================================================ */
(function () {
  var C = window.CURRICULUM;

  C.lessons.push(

  {
    id: 'd-graph-store',
    ch: 'c6',
    title: '图的存储：邻接矩阵 vs 邻接表',
    tag: '必学·重点',
    brief: '稠密图用矩阵，稀疏图用邻接表。空间差一个数量级。',
    tags: ['图', '邻接矩阵', '邻接表', '有向图', '无向图', '度', '十字链表'],
    body: `
      <h2>基本概念</h2>
      <ul>
        <li><strong>有向图 / 无向图</strong>：边有没有方向。</li>
        <li><strong>度</strong>：无向图里连了几条边；有向图分<strong>入度</strong>（指向我的）和<strong>出度</strong>（我指出去的）。</li>
        <li><strong>路径、回路、连通、强连通</strong>：无向图说"连通"，有向图说"强连通"。</li>
        <li><strong>完全图</strong>：无向图有 n(n−1)/2 条边，有向图有 n(n−1) 条。</li>
        <li><strong>生成树</strong>：包含全部 n 个顶点、只有 n−1 条边的连通子图。</li>
      </ul>

      <h2>邻接矩阵</h2>
      <pre><code>int M[n][n];        // M[i][j] = 1 表示有边，或存权值
// 无向图：M[i][j] == M[j][i]，矩阵对称
// 有向图：不一定对称</code></pre>
      <table>
        <tr><th>优点</th><th>缺点</th></tr>
        <tr><td>判断两点是否相邻 O(1)</td><td>空间 O(n²)，稀疏图大量浪费</td></tr>
        <tr><td>适合稠密图、Floyd 算法</td><td>遍历某点的邻居要扫一整行 O(n)</td></tr>
      </table>

      <h2>邻接表</h2>
      <pre><code>typedef struct ArcNode {      // 边结点
    int adjvex;               // 邻接点下标
    int weight;
    struct ArcNode *next;
} ArcNode;

typedef struct VNode {        // 顶点结点
    int data;
    ArcNode *first;
} VNode, AdjList[MAXV];</code></pre>
      <p>空间 <strong>O(n + e)</strong>，稀疏图友好。缺点是判断两点是否相邻要扫链表，最坏 O(n)。</p>

      <h2>怎么选</h2>
      <table>
        <tr><th>场景</th><th>选择</th></tr>
        <tr><td>稠密图（e 接近 n²）</td><td>邻接矩阵</td></tr>
        <tr><td>稀疏图（e 远小于 n²）</td><td>邻接表</td></tr>
        <tr><td>要频繁判断两点是否相邻</td><td>邻接矩阵</td></tr>
        <tr><td>要遍历某个点的所有邻居</td><td>邻接表</td></tr>
        <tr><td>Floyd 求多源最短路</td><td>邻接矩阵</td></tr>
      </table>

      <h2>其他存储</h2>
      <ul>
        <li><strong>十字链表</strong>：有向图专用，同时能找入边和出边。</li>
        <li><strong>邻接多重表</strong>：无向图专用，每条边只存一次（邻接表里无向边存两次）。</li>
        <li><strong>边集数组</strong>：只存所有边，Kruskal 算法用它。</li>
      </ul>
      <div class="note">下面代码同时用两种方式存同一张图，可以对照着看。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXV 8
#define INF 99999

typedef char VertexType;

/* ---------- 邻接矩阵 ---------- */
typedef struct {
    VertexType vex[MAXV];
    int edge[MAXV][MAXV];
    int n, e;
} MGraph;

void initMGraph(MGraph *G, int n) {
    G->n = n;
    G->e = 0;
    for (int i = 0; i < n; i++) G->vex[i] = (VertexType)('A' + i);
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            G->edge[i][j] = (i == j) ? 0 : INF;
}

void addEdgeM(MGraph *G, int i, int j, int w, int directed) {
    G->edge[i][j] = w;
    if (!directed) G->edge[j][i] = w;
    G->e++;
}

void printMGraph(const MGraph *G) {
    printf("     ");
    for (int i = 0; i < G->n; i++) printf("%4c", G->vex[i]);
    printf("\\n");
    for (int i = 0; i < G->n; i++) {
        printf("%4c ", G->vex[i]);
        for (int j = 0; j < G->n; j++) {
            if (G->edge[i][j] == INF) printf("   ∞");
            else printf("%4d", G->edge[i][j]);
        }
        printf("\\n");
    }
}

/* ---------- 邻接表 ---------- */
typedef struct ArcNode {
    int adjvex;
    int weight;
    struct ArcNode *next;
} ArcNode;

typedef struct {
    VertexType data;
    ArcNode *first;
} VNode;

typedef struct {
    VNode list[MAXV];
    int n, e;
} ALGraph;

void initALGraph(ALGraph *G, int n) {
    G->n = n;
    G->e = 0;
    for (int i = 0; i < n; i++) {
        G->list[i].data = (VertexType)('A' + i);
        G->list[i].first = NULL;
    }
}

void addEdgeAL(ALGraph *G, int i, int j, int w, int directed) {
    ArcNode *p = (ArcNode *)malloc(sizeof(ArcNode));
    p->adjvex = j;
    p->weight = w;
    p->next = G->list[i].first;      // 头插
    G->list[i].first = p;
    if (!directed) {
        ArcNode *q = (ArcNode *)malloc(sizeof(ArcNode));
        q->adjvex = i;
        q->weight = w;
        q->next = G->list[j].first;
        G->list[j].first = q;
    }
    G->e++;
}

void printALGraph(const ALGraph *G) {
    for (int i = 0; i < G->n; i++) {
        printf("%c", G->list[i].data);
        for (ArcNode *p = G->list[i].first; p; p = p->next)
            printf(" -> %c(%d)", G->list[p->adjvex].data, p->weight);
        printf("\\n");
    }
}

/* 用邻接表统计度 */
void degrees(const ALGraph *G, int directed) {
    printf("\\n各顶点度数：\\n");
    for (int i = 0; i < G->n; i++) {
        int out = 0;
        for (ArcNode *p = G->list[i].first; p; p = p->next) out++;
        if (!directed) {
            printf("  %c 的度 = %d\\n", G->list[i].data, out);
        } else {
            int in = 0;
            for (int j = 0; j < G->n; j++)
                for (ArcNode *p = G->list[j].first; p; p = p->next)
                    if (p->adjvex == i) in++;
            printf("  %c 的入度 = %d, 出度 = %d, 度 = %d\\n",
                   G->list[i].data, in, out, in + out);
        }
    }
}

int main(void) {
    int n = 5;
    MGraph M;
    initMGraph(&M, n);
    addEdgeM(&M, 0, 1, 1, 0);
    addEdgeM(&M, 0, 2, 1, 0);
    addEdgeM(&M, 1, 3, 1, 0);
    addEdgeM(&M, 2, 3, 1, 0);
    addEdgeM(&M, 3, 4, 1, 0);

    printf("== 无向图（邻接矩阵）==\\n");
    printMGraph(&M);

    printf("\\n== 同一张图（邻接表）==\\n");
    ALGraph G;
    initALGraph(&G, n);
    addEdgeAL(&G, 0, 1, 1, 0);
    addEdgeAL(&G, 0, 2, 1, 0);
    addEdgeAL(&G, 1, 3, 1, 0);
    addEdgeAL(&G, 2, 3, 1, 0);
    addEdgeAL(&G, 3, 4, 1, 0);
    printALGraph(&G);

    degrees(&G, 0);

    printf("\\n空间对比：\\n");
    printf("  邻接矩阵 = n² = %d 个 int = %zu 字节\\n", n * n, sizeof(int) * n * n);
    printf("  邻接表   = n 个头 + 2e 条边 = %d + %d = %d 个结点\\n", n, 2 * G.e, n + 2 * G.e);
    printf("  图越稀疏，邻接表越省。\\n");
    return 0;
}`,
    tips: [
      '建图前先想清楚「有向还是无向」「带不带权」「点下标从 0 还是 1 开始」，这三件事决定代码怎么写。',
      '邻接表用头插法建图，输出顺序和输入顺序相反，这是正常的，别以为是 bug。'
    ],
    traps: [
      '邻接矩阵对角线一般设 0（到自己的距离），但求最短路时要注意别把 0 当成"没有边"。',
      '无向图用邻接表存边会存两份，统计边数时别重复计数。'
    ]
  },

  {
    id: 'd-graph-traverse',
    ch: 'c6',
    title: 'DFS 与 BFS：图的两种走法',
    tag: '必学·重点',
    brief: 'DFS 用递归/栈，一条路走到底；BFS 用队列，一层一层扩散。',
    tags: ['DFS', 'BFS', '深度优先', '广度优先', '遍历', '连通分量'],
    body: `
      <h2>DFS（深度优先）</h2>
      <p>从起点出发，能走就走，走不动就回退。<strong>本质是递归（或显式栈）</strong>，和树的前序遍历一个模子。</p>
      <pre><code>void DFS(Graph G, int v) {
    visited[v] = 1;  visit(v);
    for (每个邻接点 w)
        if (!visited[w]) DFS(G, w);
}</code></pre>

      <h2>BFS（广度优先）</h2>
      <p>从起点出发，先把所有邻居走完，再走邻居的邻居。<strong>本质是队列</strong>，和树的层序遍历一个模子。</p>
      <pre><code>void BFS(Graph G, int v) {
    visited[v] = 1; enqueue(v);
    while (!empty(Q)) {
        u = dequeue(Q); visit(u);
        for (每个邻接点 w) if (!visited[w]) { visited[w] = 1; enqueue(w); }
    }
}</code></pre>

      <h2>复杂度</h2>
      <table>
        <tr><th>存储</th><th>DFS</th><th>BFS</th></tr>
        <tr><td>邻接矩阵</td><td>O(n²)</td><td>O(n²)</td></tr>
        <tr><td>邻接表</td><td>O(n+e)</td><td>O(n+e)</td></tr>
      </table>
      <p>因为邻接矩阵要扫完整行（n 个），邻接表只扫实际存在的边。</p>

      <h2>几个重要结论</h2>
      <ul>
        <li><strong>非连通图</strong>要遍历完，需要在外层对每个未访问点调一次 DFS/BFS，调用次数 = 连通分量个数。</li>
        <li><strong>BFS 能求无权图最短路</strong>，DFS 不能。</li>
        <li>DFS 序列和 BFS 序列都不唯一，取决于邻接点的访问顺序。</li>
        <li>DFS 的递归深度最坏是 n（单链图），n 很大时要改成显式栈。</li>
      </ul>
      <div class="warn">遍历序列题一定要看清题目给的邻接表顺序（通常按编号从小到大），否则答案对不上。<strong>下标小的先访问</strong>是默认约定。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXV 8

typedef struct ArcNode {
    int adjvex;
    struct ArcNode *next;
} ArcNode;

typedef struct {
    char data;
    ArcNode *first;
} VNode;

typedef struct {
    VNode list[MAXV];
    int n, e;
} ALGraph;

void init(ALGraph *G, int n) {
    G->n = n;
    G->e = 0;
    for (int i = 0; i < n; i++) {
        G->list[i].data = (char)('A' + i);
        G->list[i].first = NULL;
    }
}

// 头插会让遍历顺序反过来，这里用尾插保证按编号从小到大
void addEdge(ALGraph *G, int i, int j) {
    ArcNode *p = (ArcNode *)malloc(sizeof(ArcNode));
    p->adjvex = j;
    p->next = NULL;
    if (!G->list[i].first) {
        G->list[i].first = p;
    } else {
        ArcNode *q = G->list[i].first;
        while (q->next) q = q->next;
        q->next = p;
    }
    G->e++;
}

void addUndirected(ALGraph *G, int i, int j) {
    addEdge(G, i, j);
    addEdge(G, j, i);
}

void print(ALGraph *G) {
    for (int i = 0; i < G->n; i++) {
        printf("  %c:", G->list[i].data);
        for (ArcNode *p = G->list[i].first; p; p = p->next)
            printf(" %c", G->list[p->adjvex].data);
        printf("\\n");
    }
}

int visited[MAXV];

void DFS(ALGraph *G, int v) {
    visited[v] = 1;
    printf("%c ", G->list[v].data);
    for (ArcNode *p = G->list[v].first; p; p = p->next)
        if (!visited[p->adjvex]) DFS(G, p->adjvex);
}

// 非递归 DFS（显式栈），注意入栈顺序要反过来
void DFS_iter(ALGraph *G, int start) {
    int stack[MAXV * 2];
    int top = -1;
    int vis[MAXV] = {0};

    stack[++top] = start;
    while (top >= 0) {
        int v = stack[top--];
        if (vis[v]) continue;
        vis[v] = 1;
        printf("%c ", G->list[v].data);

        // 为了让小编号先出栈，先把大连号压进去
        int tmp[MAXV], cnt = 0;
        for (ArcNode *p = G->list[v].first; p; p = p->next)
            if (!vis[p->adjvex]) tmp[cnt++] = p->adjvex;
        for (int i = cnt - 1; i >= 0; i--) stack[++top] = tmp[i];
    }
}

void BFS(ALGraph *G, int start) {
    int q[MAXV * 2];
    int head = 0, tail = 0;
    int vis[MAXV] = {0};

    vis[start] = 1;
    q[tail++] = start;
    while (head < tail) {
        int v = q[head++];
        printf("%c ", G->list[v].data);
        for (ArcNode *p = G->list[v].first; p; p = p->next) {
            if (!vis[p->adjvex]) {
                vis[p->adjvex] = 1;
                q[tail++] = p->adjvex;
            }
        }
    }
}

int main(void) {
    ALGraph G;
    init(&G, 6);
    addUndirected(&G, 0, 1);
    addUndirected(&G, 0, 2);
    addUndirected(&G, 1, 3);
    addUndirected(&G, 2, 4);
    addUndirected(&G, 3, 4);
    addUndirected(&G, 3, 5);

    printf("== 邻接表（无向图）==\\n");
    print(&G);

    printf("\\nDFS（递归）：");
    for (int i = 0; i < G.n; i++) visited[i] = 0;
    DFS(&G, 0);
    printf("\\n");

    printf("DFS（非递归）：");
    DFS_iter(&G, 0);
    printf("\\n");

    printf("BFS（队列）  ：");
    BFS(&G, 0);
    printf("\\n");

    printf("\\n== 非连通图 ==\\n");
    ALGraph G2;
    init(&G2, 6);
    addUndirected(&G2, 0, 1);
    addUndirected(&G2, 2, 3);
    // 4 和 5 各自孤立
    printf("边：A-B, C-D，E 和 F 孤立\\n");
    for (int i = 0; i < G2.n; i++) visited[i] = 0;
    printf("对每个未访问点调 DFS：\\n");
    int comp = 0;
    for (int i = 0; i < G2.n; i++) {
        if (!visited[i]) {
            comp++;
            printf("  第 %d 个连通分量：", comp);
            DFS(&G2, i);
            printf("\\n");
        }
    }
    printf("共 %d 个连通分量（这也说明图不连通）\\n", comp);
    return 0;
}`,
    tips: [
      'DFS 递归写起来三行，但大图会爆栈；BFS 一定要用队列，别用递归硬凑。',
      '求连通分量个数：外层循环 + 每次 DFS 计数加一，模板固定。'
    ],
    traps: [
      'BFS 忘了在入队时标记 visited，同一个点会重复入队，队列爆炸。',
      'DFS 非递归时压栈顺序搞反，输出会变成反序。'
    ],
    exercises: ['ex-graph-traverse']
  },

  {
    id: 'd-mst',
    ch: 'c6',
    title: '最小生成树：Prim 与 Kruskal',
    tag: '重点',
    brief: 'Prim 加点（适合稠密图），Kruskal 加边（适合稀疏图）。',
    tags: ['最小生成树', 'Prim', 'Kruskal', '贪心', '并查集', 'MST'],
    body: `
      <h2>问题</h2>
      <p>在连通带权无向图里，找一棵包含所有顶点的树，使边权之和最小。这就是最小生成树（MST）。</p>
      <p>应用：铺网线、修路、电路布线——用最少的钱把所有点连起来。</p>

      <h2>Prim：加点法</h2>
      <ol>
        <li>从任意一个顶点开始，加入集合 U。</li>
        <li>找一条<strong>一端在 U 内、一端在 U 外</strong>的最小边，把外面的顶点加进来。</li>
        <li>重复 n−1 次。</li>
      </ol>
      <p>复杂度 <strong>O(n²)</strong>（邻接矩阵），和边数无关 → <strong>适合稠密图</strong>。</p>

      <h2>Kruskal：加边法</h2>
      <ol>
        <li>把所有边按权值从小到大排序。</li>
        <li>依次取边，如果两端<strong>不属于同一个集合</strong>就加入（用并查集判断）。</li>
        <li>取够 n−1 条边就停。</li>
      </ol>
      <p>复杂度 <strong>O(e log e)</strong>（排序为主），和顶点数关系小 → <strong>适合稀疏图</strong>。</p>

      <h2>两个关键结论</h2>
      <ul>
        <li>MST 的边权之和<strong>唯一</strong>，但树的形状可能不唯一（有相同权值的边时）。</li>
        <li>如果图里所有边权都不同，MST 唯一。</li>
        <li>MST 一定包含图中<strong>最短的边</strong>（不构成环时），这是切分定理。</li>
      </ul>

      <h2>Prim vs Kruskal 怎么选</h2>
      <table>
        <tr><th></th><th>Prim</th><th>Kruskal</th></tr>
        <tr><td>思路</td><td>加点</td><td>加边</td></tr>
        <tr><td>复杂度</td><td>O(n²)</td><td>O(e log e)</td></tr>
        <tr><td>适合</td><td>稠密图</td><td>稀疏图</td></tr>
        <tr><td>需要</td><td>邻接矩阵</td><td>边集 + 并查集</td></tr>
      </table>
      <div class="note">Kruskal 里"判断会不会成环"就是并查集（上一章刚学的）。这是数据结构里最漂亮的组合之一。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXV 7
#define INF 99999

/* ---------------- Prim ---------------- */
int prim(int cost[MAXV][MAXV], int n, int start, int parent[]) {
    int lowcost[MAXV];      // 到已选集合的最小边权
    int visited[MAXV] = {0};
    int total = 0;

    for (int i = 0; i < n; i++) {
        lowcost[i] = cost[start][i];
        parent[i] = start;
    }
    visited[start] = 1;
    lowcost[start] = 0;

    for (int k = 1; k < n; k++) {
        int min = INF, u = -1;
        for (int i = 0; i < n; i++)
            if (!visited[i] && lowcost[i] < min) {
                min = lowcost[i];
                u = i;
            }
        if (u == -1) return -1;          // 图不连通

        visited[u] = 1;
        total += min;
        printf("  加入顶点 %c（边 %c-%c，权 %d）\\n",
               'A' + u, 'A' + parent[u], 'A' + u, min);

        for (int i = 0; i < n; i++)
            if (!visited[i] && cost[u][i] < lowcost[i]) {
                lowcost[i] = cost[u][i];
                parent[i] = u;
            }
    }
    return total;
}

/* ---------------- Kruskal ---------------- */
typedef struct {
    int u, v, w;
} Edge;

int cmpEdge(const void *a, const void *b) {
    return ((const Edge *)a)->w - ((const Edge *)b)->w;
}

int uf[MAXV];
int find(int x) { return uf[x] == x ? x : (uf[x] = find(uf[x])); }

int kruskal(Edge *edges, int e, int n) {
    for (int i = 0; i < n; i++) uf[i] = i;
    qsort(edges, e, sizeof(Edge), cmpEdge);

    int total = 0, used = 0;
    for (int i = 0; i < e && used < n - 1; i++) {
        int ru = find(edges[i].u), rv = find(edges[i].v);
        if (ru == rv) {
            printf("  跳过 %c-%c（权 %d，会成环）\\n",
                   'A' + edges[i].u, 'A' + edges[i].v, edges[i].w);
            continue;
        }
        uf[ru] = rv;
        total += edges[i].w;
        used++;
        printf("  选边 %c-%c（权 %d）\\n", 'A' + edges[i].u, 'A' + edges[i].v, edges[i].w);
    }
    return used == n - 1 ? total : -1;
}

int main(void) {
    int n = 6;
    int cost[MAXV][MAXV];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    /* 经典教材图：
       A-B 6, A-C 1, A-D 5, B-C 5, B-E 3, C-D 5, C-E 6, C-F 4, D-F 2, E-F 6 */
    int raw[][3] = {
        {0,1,6},{0,2,1},{0,3,5},{1,2,5},{1,4,3},
        {2,3,5},{2,4,6},{2,5,4},{3,5,2},{4,5,6}
    };
    int e = sizeof(raw) / sizeof(raw[0]);
    for (int i = 0; i < e; i++) {
        cost[raw[i][0]][raw[i][1]] = raw[i][2];
        cost[raw[i][1]][raw[i][0]] = raw[i][2];
    }

    printf("=== Prim（从 A 开始）===\\n");
    int parent[MAXV];
    int t1 = prim(cost, n, 0, parent);
    printf("最小生成树总权值 = %d\\n", t1);

    printf("\\n=== Kruskal（按边权排序）===\\n");
    Edge edges[32];
    for (int i = 0; i < e; i++) {
        edges[i].u = raw[i][0];
        edges[i].v = raw[i][1];
        edges[i].w = raw[i][2];
    }
    int t2 = kruskal(edges, e, n);
    printf("最小生成树总权值 = %d\\n", t2);

    printf("\\n两种算法结果必须相同：%s\\n", t1 == t2 ? "一致" : "不一致（有 bug）");
    printf("\\nPrim 选边顺序取决于起点，Kruskal 取决于排序，所以树的形状可能不同，\\n但总权值一定一样。\\n");
    return 0;
}`,
    tips: [
      'Prim 的 `lowcost` 数组意思是"U 到每个未选点的最短边"，每次更新它就行，不用重算。',
      'Kruskal 的排序比较函数返回 `a-b` 对权值很安全（权值不大时），大权值要改成比较。'
    ],
    traps: [
      'Kruskal 里判环用并查集，不能用"是否访问过"，因为一个顶点可以在多条边里。',
      'Prim 忘了判"u == -1"（图不连通），会返回一个错误的总权值。'
    ],
    exercises: ['ex-mst']
  },

  {
    id: 'd-shortest',
    ch: 'c6',
    title: '最短路径：Dijkstra 与 Floyd',
    tag: '重点·难点',
    brief: 'Dijkstra 单源（不能有负权），Floyd 多源（可以负权，不能负环）。',
    tags: ['最短路径', 'Dijkstra', 'Floyd', '单源', '多源', '松弛', '负权'],
    body: `
      <h2>Dijkstra：单源最短路</h2>
      <p>求一个起点到所有点的最短距离。<strong>贪心 + 松弛</strong>：每次选当前距离最小的未确定点，用它去更新邻居。</p>
      <pre><code>dist[start] = 0;
for (i = 0; i &lt; n; i++) {
    u = 未确定点中 dist 最小的;
    final[u] = 1;
    for (每个邻居 v)
        if (dist[u] + w(u,v) &lt; dist[v]) {
            dist[v] = dist[u] + w(u,v);
            path[v] = u;
        }
}</code></pre>
      <p>复杂度 O(n²)（朴素版），用优先队列能到 O((n+e)log n)。</p>
      <div class="warn">Dijkstra 的前提是<strong>没有负权边</strong>。因为它是贪心：一旦确定某个点最短就再不更改。负权边会让"已经确定"的点还能更短，贪心基础就崩了。有负权要用 Bellman-Ford 或 SPFA。</div>

      <h2>Floyd：多源最短路</h2>
      <p>求任意两点之间的最短距离。三重循环，中间点 k 放在最外层：</p>
      <pre><code>for (k = 0; k &lt; n; k++)
    for (i = 0; i &lt; n; i++)
        for (j = 0; j &lt; n; j++)
            if (d[i][k] + d[k][j] &lt; d[i][j])
                d[i][j] = d[i][k] + d[k][j];</code></pre>
      <p>本质是<strong>动态规划</strong>：<code>d[i][j]</code> 表示"只允许经过前 k 个点作为中间点"时的最短距离。复杂度 O(n³)，n ≤ 200 才用。</p>
      <div class="note">k 必须在最外层！写成 i,j,k 的顺序就变成"允许重复使用中间点"的错误算法，答案会偏小。这是 Floyd 唯一的坑，也是最常考的。</div>

      <h2>对比</h2>
      <table>
        <tr><th></th><th>Dijkstra</th><th>Floyd</th></tr>
        <tr><td>求什么</td><td>单源到所有点</td><td>所有点对</td></tr>
        <tr><td>复杂度</td><td>O(n²)</td><td>O(n³)</td></tr>
        <tr><td>负权边</td><td><b>不支持</b></td><td>支持（不能有负环）</td></tr>
        <tr><td>适用</td><td>n 大、只问一个起点</td><td>n 小、要问很多对</td></tr>
      </table>

      <h2>路径怎么输出</h2>
      <p>Dijkstra 用 <code>path[v] = u</code> 记录前驱，最后从终点倒着回溯。Floyd 也可以维护一个 <code>next[i][j]</code> 矩阵。</p>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXV 8
#define INF 99999

/* ---------------- Dijkstra ---------------- */
void dijkstra(int cost[MAXV][MAXV], int n, int start, int dist[], int prev[]) {
    int final[MAXV] = {0};

    for (int i = 0; i < n; i++) {
        dist[i] = cost[start][i];
        prev[i] = (dist[i] < INF && i != start) ? start : -1;
    }
    dist[start] = 0;
    prev[start] = -1;
    final[start] = 1;

    for (int k = 1; k < n; k++) {
        int min = INF, u = -1;
        for (int i = 0; i < n; i++)
            if (!final[i] && dist[i] < min) {
                min = dist[i];
                u = i;
            }
        if (u == -1) break;              // 剩下的点不可达
        final[u] = 1;

        for (int v = 0; v < n; v++) {
            if (!final[v] && cost[u][v] < INF && dist[u] + cost[u][v] < dist[v]) {
                dist[v] = dist[u] + cost[u][v];
                prev[v] = u;
            }
        }
    }
}

void print_path(int prev[], int v) {
    if (v == -1) return;
    print_path(prev, prev[v]);
    printf("%c", 'A' + v);
}

/* ---------------- Floyd ---------------- */
void floyd(int d[MAXV][MAXV], int n, int next[MAXV][MAXV]) {
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            next[i][j] = (d[i][j] < INF && i != j) ? j : -1;

    for (int k = 0; k < n; k++)                 // k 必须在最外层
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j]) {
                    d[i][j] = d[i][k] + d[k][j];
                    next[i][j] = next[i][k];
                }
}

int main(void) {
    int n = 5;
    int cost[MAXV][MAXV];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            cost[i][j] = (i == j) ? 0 : INF;

    /* 有向图：A->B 10, A->C 3, B->D 2, C->B 4, C->D 8, C->E 2, D->E 5 */
    cost[0][1] = 10; cost[0][2] = 3;
    cost[1][3] = 2;
    cost[2][1] = 4;  cost[2][3] = 8; cost[2][4] = 2;
    cost[3][4] = 5;

    printf("=== Dijkstra（起点 A）===\\n");
    int dist[MAXV], prev[MAXV];
    dijkstra(cost, n, 0, dist, prev);
    for (int i = 0; i < n; i++) {
        printf("  A -> %c : ", 'A' + i);
        if (dist[i] >= INF) {
            printf("不可达\\n");
        } else {
            printf("距离 %2d，路径 ", dist[i]);
            print_path(prev, i);
            printf("\\n");
        }
    }

    printf("\\n=== Floyd（所有点对）===\\n");
    int d[MAXV][MAXV], next[MAXV][MAXV];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            d[i][j] = cost[i][j];
    floyd(d, n, next);

    printf("     ");
    for (int i = 0; i < n; i++) printf("%6c", 'A' + i);
    printf("\\n");
    for (int i = 0; i < n; i++) {
        printf("%4c ", 'A' + i);
        for (int j = 0; j < n; j++) {
            if (d[i][j] >= INF) printf("%6s", "∞");
            else printf("%6d", d[i][j]);
        }
        printf("\\n");
    }

    printf("\\n对照：Dijkstra 从 A 出发的结果应该和 Floyd 第一行一致\\n  ");
    for (int i = 0; i < n; i++) printf("%d ", dist[i]);
    printf("\\n  ");
    for (int i = 0; i < n; i++) printf("%d ", d[0][i]);
    printf("\\n");

    printf("\\n== 为什么 Dijkstra 不能有负权边 ==\\n");
    printf("假设 A->B 为 1，A->C 为 2，C->B 为 -2。\\n");
    printf("Dijkstra 先确定 B 的最短路是 1，然后发现 A->C->B = 0，比 1 更短，\\n");
    printf("但 B 已经被标记为 final，不会更新 —— 结果就错了。\\n");
    return 0;
}`,
    tips: [
      'Dijkstra 的 `final[]` 数组（有的书写 `S[]`）是关键，它保证每个点只被"确定"一次。',
      'Floyd 三重循环的 k 放最外层，写在注释里提醒自己，能少一个 bug。'
    ],
    traps: [
      'INF 用 99999 时，两个 INF 相加会溢出吗？用 int 不会，但判断 `d[i][k]+d[k][j]` 前最好先判 INF。',
      '有负权边还硬上 Dijkstra，得到的不是最短路，考试里会直接判错。'
    ],
    exercises: ['ex-dijkstra']
  },

  {
    id: 'd-topo',
    ch: 'c6',
    title: '拓扑排序：AOV 网与依赖关系',
    tag: '重点',
    brief: '反复找入度为 0 的点，能全部输出说明没有环。',
    tags: ['拓扑排序', 'AOV', '入度', '有向无环图', 'DAG', '依赖'],
    body: `
      <h2>AOV 网</h2>
      <p>用<strong>顶点表示活动</strong>、有向边表示先后关系（比如"先学 C 再学数据结构"）。这种图叫 AOV 网，必须是<strong>有向无环图（DAG）</strong>，否则依赖关系矛盾。</p>

      <h2>算法步骤</h2>
      <ol>
        <li>统计每个顶点的入度。</li>
        <li>把入度为 0 的点入队（这些是没有前置依赖的）。</li>
        <li>出队输出，把它指向的所有点入度减 1。</li>
        <li>如果某点入度变成 0，入队。</li>
        <li>重复直到队空。如果输出个数 &lt; 顶点数，说明<strong>有环</strong>。</li>
      </ol>
      <p>复杂度 <strong>O(n+e)</strong>。用栈或队列都行，得到的序列可能不同，但都合法。</p>

      <h2>为什么能判环</h2>
      <p>环上的点入度永远不可能变成 0（它们互相依赖），所以永远不会被输出。所以"输出数量 != 顶点数"就等价于"有环"。</p>

      <h2>应用</h2>
      <ul>
        <li>课程安排（先修课）。</li>
        <li>编译器的依赖编译顺序、makefile。</li>
        <li>任务调度、包管理器解决依赖。</li>
        <li>判断是否有循环依赖（比如 npm 的循环引用）。</li>
      </ul>

      <h2>拓扑序列唯一吗</h2>
      <p>不唯一。如果某一时刻有多个入度为 0 的点，它们的相对顺序可以互换。<strong>只有图是一条链时序列才唯一</strong>（这也是考试的一个小结论）。</p>
      <div class="note">下面代码用邻接表 + 栈实现，最后会输出"能不能完成所有课程"这种真实场景的结论。</div>
    `,
    code: `#include <stdio.h>
#include <stdlib.h>

#define MAXV 10

typedef struct ArcNode {
    int adjvex;
    struct ArcNode *next;
} ArcNode;

typedef struct {
    char name[32];
    ArcNode *first;
} VNode;

typedef struct {
    VNode list[MAXV];
    int n, e;
    int indegree[MAXV];
} Graph;

void init(Graph *G, int n) {
    G->n = n;
    G->e = 0;
    for (int i = 0; i < n; i++) {
        G->list[i].first = NULL;
        G->indegree[i] = 0;
        snprintf(G->list[i].name, sizeof(G->list[i].name), "V%d", i);
    }
}

void addEdge(Graph *G, int u, int v) {   // u -> v
    ArcNode *p = (ArcNode *)malloc(sizeof(ArcNode));
    p->adjvex = v;
    p->next = G->list[u].first;
    G->list[u].first = p;
    G->e++;
    G->indegree[v]++;
}

int topoSort(Graph *G, int order[]) {
    int stack[MAXV], top = -1;
    int indeg[MAXV];
    int cnt = 0;

    for (int i = 0; i < G->n; i++) indeg[i] = G->indegree[i];
    for (int i = 0; i < G->n; i++)
        if (indeg[i] == 0) stack[++top] = i;

    while (top >= 0) {
        int u = stack[top--];
        order[cnt++] = u;
        for (ArcNode *p = G->list[u].first; p; p = p->next) {
            if (--indeg[p->adjvex] == 0)
                stack[++top] = p->adjvex;
        }
    }
    return cnt;          // 返回能输出的顶点数
}

int main(void) {
    Graph G;
    int n = 6;
    init(&G, n);

    const char *names[] = {"高数", "C语言", "离散数学", "数据结构", "算法", "操作系统"};
    for (int i = 0; i < n; i++) snprintf(G.list[i].name, sizeof(G.list[i].name), "%s", names[i]);

    /* 依赖关系：
       高数 -> 离散数学 -> 数据结构
       C语言 -> 数据结构
       数据结构 -> 算法
       数据结构 -> 操作系统
       算法 -> 操作系统 */
    addEdge(&G, 0, 2);   // 高数 -> 离散
    addEdge(&G, 2, 3);   // 离散 -> 数据结构
    addEdge(&G, 1, 3);   // C -> 数据结构
    addEdge(&G, 3, 4);   // 数据结构 -> 算法
    addEdge(&G, 3, 5);   // 数据结构 -> 操作系统
    addEdge(&G, 4, 5);   // 算法 -> 操作系统

    printf("== 课程依赖 ==\\n");
    for (int i = 0; i < n; i++) {
        printf("  %-10s 入度 %d，后继：", G.list[i].name, G.indegree[i]);
        for (ArcNode *p = G.list[i].first; p; p = p->next)
            printf("%s ", G.list[p->adjvex].name);
        printf("\\n");
    }

    int order[MAXV];
    int cnt = topoSort(&G, order);

    printf("\\n拓扑排序结果（一种合法的学习顺序）：\\n  ");
    for (int i = 0; i < cnt; i++) printf("%s%s", G.list[order[i]].name, i == cnt - 1 ? "" : " -> ");
    printf("\\n");

    if (cnt < n) {
        printf("\\n只输出了 %d/%d 个顶点 —— 存在环，无法完成所有课程\\n", cnt, n);
    } else {
        printf("\\n全部 %d 门课都能排上 —— 没有循环依赖\\n", n);
    }

    /* 加一条反向边制造环 */
    printf("\\n== 加一条 操作系统 -> 高数 的依赖 ==\\n");
    addEdge(&G, 5, 0);
    cnt = topoSort(&G, order);
    printf("能输出的顶点数：%d / %d\\n", cnt, n);
    printf("结论：%s\\n", cnt < n ? "存在循环依赖，排不出顺序" : "仍然可以");
    printf("\\n这就是 npm 提示「circular dependency」的原理。\\n");
    return 0;
}`,
    tips: [
      '拓扑排序用栈或队列都行，只影响输出顺序，不影响正确性。',
      '要判断"是否唯一"，看每一步入度为 0 的点是不是只有一个。'
    ],
    traps: [
      '入度数组要复制一份再用，直接改原数组会把图弄坏（想复用就得复原）。',
      '只判断"队列空了"不够，必须比较输出数量与顶点总数，否则有环也看不出来。'
    ],
    exercises: ['ex-topo']
  },

  {
    id: 'd-critical',
    ch: 'c6',
    title: '关键路径：AOE 网与工期',
    tag: '难点',
    brief: 've 正推取最大，vl 逆推取最小，l−e=0 的活动就是关键活动。',
    tags: ['关键路径', 'AOE', 've', 'vl', 'e', 'l', '最早开始', '最晚开始'],
    body: `
      <h2>AOE 网</h2>
      <p><strong>顶点表示事件，边表示活动</strong>（边的权是活动持续时间）。问：整个工程最短多久完成？哪些活动不能拖？</p>
      <ul>
        <li><strong>ve[i]</strong>：事件 i 的最早发生时间 —— 正推，取所有前驱的 <code>max(ve[j] + w)</code>。</li>
        <li><strong>vl[i]</strong>：事件 i 的最晚发生时间 —— 逆推，取所有后继的 <code>min(vl[k] − w)</code>。</li>
        <li><strong>e[i]</strong>：活动最早开始 = 起点的 ve。</li>
        <li><strong>l[i]</strong>：活动最晚开始 = 终点的 vl − 活动时长。</li>
        <li><strong>关键活动</strong>：<code>l[i] == e[i]</code>（时间余量为 0，一天都不能拖）。</li>
      </ul>

      <h2>算法四步</h2>
      <ol>
        <li>拓扑排序求 ve（正推取 max）。</li>
        <li>逆拓扑序求 vl（逆推取 min）。</li>
        <li>对每条边算 e 和 l。</li>
        <li>e == l 的边组成关键路径。</li>
      </ol>
      <div class="warn">关键路径可能不止一条，而且<strong>缩短一条关键路径上的活动，可能导致它变成非关键路径</strong>，同时另一条关键路径浮现出来。所以"压缩工期"要做全局分析，不能只盯一条路。</div>

      <h2>典型考题</h2>
      <ul>
        <li>求 ve、vl 数组。</li>
        <li>求关键活动 / 关键路径。</li>
        <li>求某活动的时间余量 <code>l − e</code>。</li>
        <li>缩短某个活动能不能缩短总工期。</li>
      </ul>
      <div class="note">别和 AOV 搞混：<strong>AOV 是顶点表示活动（拓扑排序），AOE 是边表示活动（关键路径）</strong>。</div>
    `,
    code: `#include <stdio.h>

#define MAXV 8
#define INF 99999

/* 用邻接矩阵存 AOE 网：w[i][j] 表示事件 i->j 的活动时长 */
int main(void) {
    int n = 6;                    // 事件 0..5
    int w[MAXV][MAXV];
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            w[i][j] = INF;        // 这里没有「自己到自己」的边，全部先设成不可达

    /* 经典 AOE 图：
       0->1 (3), 0->2 (2)
       1->3 (2), 1->4 (3)
       2->3 (4), 2->5 (3)
       3->4 (2)
       4->5 (1)  */
    w[0][1] = 3; w[0][2] = 2;
    w[1][3] = 2; w[1][4] = 3;
    w[2][3] = 4; w[2][5] = 3;
    w[3][4] = 2;
    w[4][5] = 1;

    /* 1. 拓扑排序 */
    int indeg[MAXV] = {0};
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (w[i][j] < INF) indeg[j]++;

    int topo[MAXV], cnt = 0;
    int stack[MAXV], top = -1;
    for (int i = 0; i < n; i++) if (indeg[i] == 0) stack[++top] = i;
    while (top >= 0) {
        int u = stack[top--];
        topo[cnt++] = u;
        for (int v = 0; v < n; v++)
            if (w[u][v] < INF && --indeg[v] == 0) stack[++top] = v;
    }

    printf("拓扑序列：");
    for (int i = 0; i < cnt; i++) printf("V%d ", topo[i]);
    printf("\\n\\n");

    /* 2. 正推求 ve：取最大 */
    int ve[MAXV] = {0};
    for (int k = 0; k < cnt; k++) {
        int u = topo[k];
        for (int v = 0; v < n; v++)
            if (w[u][v] < INF && ve[u] + w[u][v] > ve[v])
                ve[v] = ve[u] + w[u][v];
    }

    /* 3. 逆推求 vl：取最小 */
    int vl[MAXV];
    for (int i = 0; i < n; i++) vl[i] = ve[n - 1];
    for (int k = cnt - 1; k >= 0; k--) {
        int u = topo[k];
        for (int v = 0; v < n; v++)
            if (w[u][v] < INF && vl[v] - w[u][v] < vl[u])
                vl[u] = vl[v] - w[u][v];
    }

    printf("事件  ve  vl  时间余量\\n");
    for (int i = 0; i < n; i++)
        printf("V%-3d %3d %3d %6d\\n", i, ve[i], vl[i], vl[i] - ve[i]);

    printf("\\n活动（边）  e   l   l-e   关键？\\n");
    int total = ve[n - 1];
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            if (w[i][j] >= INF) continue;
            int e = ve[i];
            int l = vl[j] - w[i][j];
            printf("V%d->V%d(%d)  %2d  %2d  %3d    %s\\n",
                   i, j, w[i][j], e, l, l - e, (l == e) ? "★ 关键" : "");
        }
    }

    printf("\\n工程最短工期 = ve[%d] = %d\\n", n - 1, total);

    printf("\\n关键路径上的活动：");
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (w[i][j] < INF && vl[j] - w[i][j] == ve[i])
                printf("V%d->V%d ", i, j);
    printf("\\n（这些活动一天都不能拖，拖了总工期就变长）\\n");

    printf("\\n注意 V0 到 V3 有两条路：\\n");
    printf("  V0->V1->V3 = 3+2 = 5\\n");
    printf("  V0->V2->V3 = 2+4 = 6  <- 更长，所以 V3 的最早时间是 6\\n");
    printf("这就是「正推取 max」的含义：必须等所有前驱都完成。\\n");
    return 0;
}`,
    tips: [
      '正推求 ve 用 max、逆推求 vl 用 min，方向别搞反。',
      '工期 = 汇点的 ve；关键活动整条连起来就是关键路径，可能有多条。'
    ],
    traps: [
      'vl 的初值要设成汇点的 ve，设成 0 或 INF 都会算错。',
      'AOE 网里"活动的时间余量"是 l−e，不是 vl−ve（后者是事件余量）。'
    ]
  }

  );
})();
