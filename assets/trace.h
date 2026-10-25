/* ============================================================================
 * trace.h —— C-Learn Studio 可视化埋点头文件
 * ----------------------------------------------------------------------------
 * 干什么用的：
 *   在 C 程序里插几个埋点，程序运行时会把"此刻的数据结构长什么样"打成一行
 *   特殊的 JSON 吐到标准输出，前端拿到这些帧就能一步一步放动画。
 *
 * 一句话记住三件事：
 *   1) 想画一帧，就先调几个 tr_xxx() 描述当前状态，最后一定要 tr_end() 提交。
 *   2) tr_end() 会自动带上 __LINE__，前端拿它去高亮编辑器里对应的那一行代码。
 *   3) 帧是"完整快照"不是"差量"，所以前端可以随便往回拖、跳着看。
 *
 * 埋点输出格式（每帧一行）：
 *   @@TR@@{"line":12,"note":"...","views":[...],"flags":[[2,"cmp"]]}
 * 服务端会把 @@TR@@ 开头的行从普通输出里剥掉，所以不会污染程序的 stdout。
 *
 * 用法示例：
 *   #include "trace.h"
 *
 *   int a[5] = {5, 3, 8, 1, 9};
 *   tr_begin();
 *   tr_arr("a", a, 5);
 *   tr_var("i", "%d", 0);
 *   tr_note("初始状态");
 *   tr_end();                 // ← 第 N 帧
 *
 *   for (int i = 0; i < 4; i++) {
 *       tr_begin();
 *       tr_arr("a", a, 5);
 *       tr_mark(i, "cmp");
 *       tr_mark(i + 1, "cmp");
 *       tr_note("比较 a[%d]=%d 与 a[%d]=%d", i, a[i], i + 1, a[i + 1]);
 *       tr_end();
 *   }
 * ========================================================================== */
#ifndef C_LEARN_TRACE_H
#define C_LEARN_TRACE_H

#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <stdint.h>

#define TR_PREFIX   "@@TR@@"
#define TR_BUF_SIZE 65536
#define TR_MAX_FLAG 256

/* gcc 下屏蔽"定义了但没用"的警告：只用了部分埋点也不至于刷一屏警告 */
#if defined(__GNUC__)
#  define TR_UNUSED __attribute__((unused))
#else
#  define TR_UNUSED
#endif

/* ---------------------------- 帧内部状态 ---------------------------- */

static char _tr_buf[TR_BUF_SIZE];        /* 本帧的 views 数组（已序列化） */
static int  _tr_len = 0;
static int  _tr_nview = 0;

static char _tr_note[1024];              /* 本帧的说明文字 */

static struct { int idx; char kind[12]; } _tr_flag[TR_MAX_FLAG];
static int  _tr_nflag = 0;

static int  _tr_seq = 0;                 /* 帧序号，从 1 开始 */
static int  _tr_overflow = 0;

/* ---------------------------- 缓冲区写入 ---------------------------- */

TR_UNUSED static void _tr_raw(const char *s, int n)
{
    if (n <= 0) return;
    if (_tr_len + n + 1 >= TR_BUF_SIZE) { _tr_overflow = 1; return; }
    memcpy(_tr_buf + _tr_len, s, (size_t)n);
    _tr_len += n;
    _tr_buf[_tr_len] = '\0';
}

TR_UNUSED static void _tr_put(const char *s)
{
    _tr_raw(s, (int)strlen(s));
}

TR_UNUSED static void _tr_printf(const char *fmt, ...)
{
    char tmp[1024];
    va_list ap;
    va_start(ap, fmt);
    int n = vsnprintf(tmp, sizeof tmp, fmt, ap);
    va_end(ap);
    if (n > 0) _tr_raw(tmp, n < (int)sizeof tmp ? n : (int)sizeof tmp - 1);
}

/* 把 s 当 JSON 字符串写进缓冲区（含两端引号）。
 * UTF-8 多字节原样输出即可构成合法 JSON，只需转义 " \ 和控制字符。 */
TR_UNUSED static void _tr_jstr(const char *s)
{
    const unsigned char *p;
    _tr_put("\"");
    for (p = (const unsigned char *)s; p && *p; ++p) {
        switch (*p) {
        case '"':  _tr_put("\\\""); break;
        case '\\': _tr_put("\\\\"); break;
        case '\n': _tr_put("\\n");  break;
        case '\r': _tr_put("\\r");  break;
        case '\t': _tr_put("\\t");  break;
        default:
            if (*p < 0x20) _tr_printf("\\u%04x", (unsigned)*p);
            else           _tr_raw((const char *)p, 1);
        }
    }
    _tr_put("\"");
}

/* 同上，但写到一个 FILE* 上（用于 note —— 它在帧对象的最外层） */
TR_UNUSED static void _tr_jstr_f(FILE *f, const char *s)
{
    const unsigned char *p;
    fputc('"', f);
    for (p = (const unsigned char *)s; p && *p; ++p) {
        switch (*p) {
        case '"':  fputs("\\\"", f);  break;
        case '\\': fputs("\\\\", f);  break;
        case '\n': fputs("\\n", f);   break;
        case '\r': fputs("\\r", f);   break;
        case '\t': fputs("\\t", f);   break;
        default:
            if (*p < 0x20) fprintf(f, "\\u%04x", (unsigned)*p);
            else           fputc((int)*p, f);
        }
    }
    fputc('"', f);
}

/* 视图之间补逗号 */
TR_UNUSED static void _tr_vsep(void)
{
    if (_tr_nview++) _tr_put(",");
}

/* ------------------------------ 公共 API ------------------------------ */

/* 开一帧（会清空上一帧残留；tr_end 之后也会自动清，所以不是必须调用） */
TR_UNUSED static void tr_begin(void)
{
    _tr_len = 0;
    _tr_buf[0] = '\0';
    _tr_nview = 0;
    _tr_nflag = 0;
    _tr_note[0] = '\0';
    _tr_overflow = 0;
}

/* 整型数组：顺序表 / 普通数组 / 排序 / 查找 都用它 */
TR_UNUSED static void tr_arr(const char *name, const int *a, int n)
{
    int i;
    _tr_vsep();
    _tr_put("{\"k\":\"arr\",\"name\":");
    _tr_jstr(name);
    _tr_put(",\"v\":[");
    for (i = 0; i < n; i++) _tr_printf(i ? ",%d" : "%d", a[i]);
    _tr_put("]}");
}

/* 顺序表：额外带 length / capacity，能看出"有效元素"和"空闲槽位" */
TR_UNUSED static void tr_seq(const char *name, const int *a, int len, int cap)
{
    int i;
    _tr_vsep();
    _tr_put("{\"k\":\"arr\",\"name\":");
    _tr_jstr(name);
    _tr_printf(",\"len\":%d,\"cap\":%d,\"v\":[", len, cap);
    for (i = 0; i < len; i++) _tr_printf(i ? ",%d" : "%d", a[i]);
    _tr_put("]}");
}

/* 字符串数组：串 / KMP 之类用得上 */TR_UNUSED static void tr_strs(const char *name, const char *const *s, int n)
{
    int i;
    _tr_vsep();
    _tr_put("{\"k\":\"strs\",\"name\":");
    _tr_jstr(name);
    _tr_put(",\"v\":[");
    for (i = 0; i < n; i++) { if (i) _tr_put(","); _tr_jstr(s[i] ? s[i] : ""); }
    _tr_put("]}");
}

/* 带独立高亮位置的字符串数组。
 * 一帧里有好几个 strs 视图时（比如主串 + 模式串），共用 tr_mark 会互相串——
 * 主串标到第 6 位，模式串也会跟着亮第 6 位。这个版本让每个视图只亮自己的 hi。 */
TR_UNUSED static void tr_strs_at(const char *name, const char *const *s, int n, int hi)
{
    int i;
    _tr_vsep();
    _tr_put("{\"k\":\"strs\",\"name\":");
    _tr_jstr(name);
    _tr_printf(",\"hi\":%d,\"v\":[", hi);
    for (i = 0; i < n; i++) { if (i) _tr_put(","); _tr_jstr(s[i] ? s[i] : ""); }
    _tr_put("]}");
}

/* 内存快照（int 版）：带每格的真实地址，用来讲"数组在内存里是挨着的"。
 *   name 变量名；base 首地址（传数组名即可）；esz 每个元素占几个字节（sizeof(int)）。
 * 地址按 16 进制原样吐给前端，前端只负责显示末几位 —— 别在 C 里做运算，省得溢出。
 * 标记仍然用 tr_mark(i, kind) 按下标打，和 tr_arr 共用一套。 */
TR_UNUSED static void tr_mem(const char *name, const void *base, const int *a, int n, int esz)
{
    int i;
    if (esz <= 0) esz = (int)sizeof(int);
    if (esz > 64) esz = 64;                      /* 别让一个 struct 把地址列撑爆 */
    _tr_vsep();
    _tr_put("{\"k\":\"mem\",\"name\":");
    _tr_jstr(name);
    _tr_printf(",\"sz\":%d,\"addr\":[", esz);
    for (i = 0; i < n; i++)
        _tr_printf(i ? ",\"%llx\"" : "\"%llx\"",
                   (unsigned long long)(uintptr_t)((const char *)base + (size_t)i * (size_t)esz));
    _tr_put("],\"v\":[");
    for (i = 0; i < n; i++) _tr_printf(i ? ",%d" : "%d", a[i]);
    _tr_put("]}");
}

/* 内存快照（字符版）：char 数组 / 字符串用，格子显示成 'a' 而不是 97。
 * '\0' 显示成 \0，不可打印字符显示成 ?，剩下的原样。 */
TR_UNUSED static void tr_memc(const char *name, const void *base, const char *s, int n, int esz)
{
    int i;
    if (esz <= 0) esz = 1;
    _tr_vsep();
    _tr_put("{\"k\":\"mem\",\"ch\":1,\"name\":");
    _tr_jstr(name);
    _tr_printf(",\"sz\":%d,\"addr\":[", esz);
    for (i = 0; i < n; i++)
        _tr_printf(i ? ",\"%llx\"" : "\"%llx\"",
                   (unsigned long long)(uintptr_t)((const char *)base + (size_t)i * (size_t)esz));
    _tr_put("],\"v\":[");
    for (i = 0; i < n; i++) {
        char one[8];
        unsigned char c = (unsigned char)s[i];
        if (i) _tr_put(",");
        if (c == 0)                strcpy(one, "\\0");
        else if (c < 0x20 || c == 0x7f) strcpy(one, "?");
        else { one[0] = (char)c; one[1] = '\0'; }
        _tr_jstr(one);
    }
    _tr_put("]}");
}

/* 指针变量：画成"名字 = 地址 → 指向谁"的小卡片。
 *   to 是给人看的描述，比如 "a[2]" 或 "NULL"；addr 传指针值本身。
 * 想让目标格子亮起来，记得另外 tr_mark(2, "cur")。 */
TR_UNUSED static void tr_ptr(const char *name, const void *addr, const char *to)
{
    _tr_vsep();
    _tr_put("{\"k\":\"ptr\",\"name\":");
    _tr_jstr(name);
    _tr_printf(",\"addr\":\"%llx\",\"to\":",
               (unsigned long long)(uintptr_t)addr);
    _tr_jstr(to ? to : "");
    _tr_put("}");
}

/* 链表节点：id 自己编号（0,1,2…），next 填下一个节点的 id，没有就填 -1 */
TR_UNUSED static void tr_lnode(int id, const char *label, int next)
{
    _tr_vsep();
    _tr_printf("{\"k\":\"lnode\",\"id\":%d,\"v\":", id);
    _tr_jstr(label);
    _tr_printf(",\"n\":%d}", next);
}

/* 二叉树节点：left / right 填子节点 id，没有就填 -1 */
TR_UNUSED static void tr_tnode(int id, const char *label, int left, int right)
{
    _tr_vsep();
    _tr_printf("{\"k\":\"tnode\",\"id\":%d,\"v\":", id);
    _tr_jstr(label);
    _tr_printf(",\"l\":%d,\"r\":%d}", left, right);
}

/* 图顶点 */
TR_UNUSED static void tr_vnode(int id, const char *label)
{
    _tr_vsep();
    _tr_printf("{\"k\":\"vnode\",\"id\":%d,\"v\":", id);
    _tr_jstr(label);
    _tr_put("}");
}

/* 图的一条边（有向看不出方向也没关系，前端画箭头） */
TR_UNUSED static void tr_vedge(int u, int v, const char *label)
{
    _tr_vsep();
    _tr_printf("{\"k\":\"vedge\",\"u\":%d,\"v\":%d,\"w\":", u, v);
    _tr_jstr(label ? label : "");
    _tr_put("}");
}

/* 变量：显示在角落的小标签，比如 i / j / pivot / low / high */
TR_UNUSED static void tr_var(const char *key, const char *fmt, ...)
{
    char val[256];
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(val, sizeof val, fmt, ap);
    va_end(ap);
    _tr_vsep();
    _tr_put("{\"k\":\"var\",\"name\":");
    _tr_jstr(key);
    _tr_put(",\"v\":");
    _tr_jstr(val);
    _tr_put("}");
}

/* 给元素打标记：数组按下标，链表/树/图按节点 id。
 * kind 可选值：cmp（正在比较）swap（正在交换）cur（当前操作）done（已完成）
 *             hit（命中）path（路径）del（待删除）new（新增）
 * 前端认不出的 kind 会当普通高亮处理。 */
TR_UNUSED static void tr_mark(int idx, const char *kind)
{
    if (_tr_nflag >= TR_MAX_FLAG) return;
    _tr_flag[_tr_nflag].idx = idx;
    snprintf(_tr_flag[_tr_nflag].kind, sizeof _tr_flag[_tr_nflag].kind, "%s",
             kind ? kind : "cur");
    _tr_nflag++;
}

/* 本帧说明文字（printf 风格）。一般就是"这一步在干什么" */
TR_UNUSED static void tr_note(const char *fmt, ...)
{
    va_list ap;
    va_start(ap, fmt);
    vsnprintf(_tr_note, sizeof _tr_note, fmt, ap);
    va_end(ap);
}

/* 提交一帧。
 * 两种用法，别混：
 *   - 主流程里直接写 TR_END()，宏会自动把 __LINE__ 填进来；
 *   - 封装的辅助函数里，行号必须是"调用处"的行号，所以要显式传：
 *         void draw(...) { ... tr_commit(line); }
 *         draw(head, __LINE__, "说明");     ← __LINE__ 在调用处展开
 *     如果辅助函数里写 TR_END()，行号会永远指向辅助函数自己那一行。 */
TR_UNUSED static void tr_commit(int line)
{
    int i;
    printf("%s{\"seq\":%d,\"line\":%d,\"note\":", TR_PREFIX, _tr_seq + 1, line);
    _tr_jstr_f(stdout, _tr_note);
    printf(",\"views\":[%.*s]", _tr_len, _tr_buf);
    if (_tr_nflag) {
        printf(",\"flags\":[");
        for (i = 0; i < _tr_nflag; i++) {
            printf("%s[%d,", i ? "," : "", _tr_flag[i].idx);
            _tr_jstr_f(stdout, _tr_flag[i].kind);
            printf("]");
        }
        printf("]");
    }
    if (_tr_overflow) printf(",\"truncated\":1");
    printf("}\n");
    fflush(stdout);

    _tr_seq++;
    tr_begin();
}

/* ------------------------------ 短宏别名 ------------------------------ */
/* 想让代码看着干净点时用这些；本质就是上面那些函数。 */

#define TR_BEGIN()               tr_begin()
#define TR_END()                 tr_commit(__LINE__)
#define TR_NOTE(...)             tr_note(__VA_ARGS__)
#define TR_VAR(k, ...)           tr_var(k, __VA_ARGS__)
#define TR_MARK(i, kind)         tr_mark(i, kind)
#define TR_ARR(nm, a, n)         tr_arr(nm, a, n)
#define TR_SEQ(nm, a, len, cap)  tr_seq(nm, a, len, cap)
#define TR_STRINGS(nm, s, n)     tr_strs(nm, s, n)
#define TR_STRINGS_AT(nm, s, n, hi)   tr_strs_at(nm, s, n, hi)
#define TR_MEM(nm, base, a, n, esz)   tr_mem(nm, base, a, n, esz)
#define TR_MEMC(nm, base, s, n, esz)  tr_memc(nm, base, s, n, esz)
#define TR_PTR(nm, addr, to)     tr_ptr(nm, addr, to)
#define TR_LNODE(id, lab, nx)    tr_lnode(id, lab, nx)
#define TR_TNODE(id, lab, l, r)  tr_tnode(id, lab, l, r)
#define TR_VNODE(id, lab)        tr_vnode(id, lab)
#define TR_VEDGE(u, v, w)        tr_vedge(u, v, w)

#endif /* C_LEARN_TRACE_H */
