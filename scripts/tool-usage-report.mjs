#!/usr/bin/env node
/**
 * 生成「工具埋点覆盖 + 使用记录 + 接口可达性」报告。
 *
 *   node scripts/tool-usage-report.mjs                 # 全量（含接口探测，较慢）
 *   node scripts/tool-usage-report.mjs --no-probe      # 跳过接口探测
 *   node scripts/tool-usage-report.mjs --out FILE.md   # 指定输出路径
 *
 * 三个数据来源：
 *   1. src/data/tools.json          —— 工具清单
 *   2. src/pages/**\/[slug].astro   —— 模拟路由条件，算出每个工具实际渲染哪个组件
 *   3. api.tool.tl                  —— 线上使用排行 + 各后端接口可达性
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.tool.tl';
const SITE_ID = 2;

const argv = process.argv.slice(2);
const NO_PROBE = argv.includes('--no-probe');
const OUT = (() => {
  const i = argv.indexOf('--out');
  return i >= 0 && argv[i + 1] ? path.resolve(argv[i + 1]) : path.join(ROOT, 'TOOLS_USAGE_COVERAGE.md');
})();

const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

/* ── 1. 工具清单 ─────────────────────────────────────────── */
const tools = JSON.parse(read('src/data/tools.json')).tools;

/* ── 2. 路由模拟：算出每个工具主页面实际渲染的组件 ─────────── */
function renderBlocks(file) {
  const src = read(file);
  // 注意：不能加 s 标志。条件必须限定在同一行内，否则 .+? 会从文件更早的 `{` 跨行吞进无关内容。
  const re = /\{(.+?)\s*&&\s*\(\s*\n\s*<([A-Za-z0-9]+Tool)\b/g;
  const out = [];
  for (const m of src.matchAll(re)) out.push({ cond: m[1].trim(), comp: m[2] });
  return out;
}
function evalCond(cond, tool) {
  const js = cond.replace(/tool\.(\w+)/g, (_, k) => JSON.stringify(tool[k] ?? null));
  try {
    // eslint-disable-next-line no-new-func
    return new Function(`return (${js});`)();
  } catch {
    return false;
  }
}
const MAIN_ROUTE = 'src/pages/[slug].astro';
const VARIANT_ROUTE = 'src/pages/[slug]/[variant].astro';
const mainBlocks = renderBlocks(MAIN_ROUTE);
const variantBlocks = renderBlocks(VARIANT_ROUTE);

const compDir = path.join(ROOT, 'src/components/tools');
const compSrc = Object.fromEntries(
  fs.readdirSync(compDir).filter((f) => f.endsWith('.tsx'))
    .map((f) => [f.replace(/\.tsx$/, ''), fs.readFileSync(path.join(compDir, f), 'utf8')]),
);
const caseNames = (comp) =>
  new Set([...(compSrc[comp] ?? '').matchAll(/case '([A-Za-z0-9]+)':/g)].map((m) => m[1]));
const GEN_CASES = caseNames('GeneratorTool');
const TXT_CASES = caseNames('TextProcessTool');

function resolveRender(tool, blocks) {
  const hits = blocks.filter((b) => evalCond(b.cond, tool)).map((b) => b.comp);
  if (hits.length === 0) return { comp: null, issue: '没有任何组件渲染' };
  if (hits.length > 1) return { comp: hits[0], issue: `重复渲染：${hits.join(' + ')}` };
  const comp = hits[0];
  if (comp === 'GeneratorTool' && !GEN_CASES.has(tool.component))
    return { comp, issue: 'GeneratorTool 无对应 case，只会显示空文本框' };
  if (comp === 'TextProcessTool' && !TXT_CASES.has(tool.component))
    return { comp, issue: 'TextProcessTool 无对应 case，只会原样回显' };
  return { comp, issue: null };
}

/* ── 3. 线上使用排行 ─────────────────────────────────────── */
async function fetchRanked() {
  try {
    const res = await fetch(`${API}/content/api/tool-usage/ranked?site_id=${SITE_ID}&limit=500`);
    if (!res.ok) return { map: new Map(), err: `HTTP ${res.status}` };
    const json = await res.json();
    // 注意：服务端硬上限 50 条，传更大的 limit 也只返回 50
    return { map: new Map((json.data ?? []).map((r) => [r.tool_id, r])), err: null };
  } catch (e) {
    return { map: new Map(), err: e.message };
  }
}

/* ── 4. 接口可达性探测 ───────────────────────────────────── */
const B64 = {
  png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  jpg: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
};
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\nxref\n0 4\n0000000000 65535 f \n' +
  '0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF\n',
  'latin1',
);
const fixture = (kind) =>
  kind === 'pdf' ? PDF : Buffer.from(B64[kind], 'base64');

/**
 * 各工具的探测方式。返回 null 表示该工具无后端接口。
 *
 * 注意两类容易踩的坑：
 *   1. 部分组件会在 apiEndpoint 后面再拼一段路径（webp-to 拼 api、gif-split 拼 upload、
 *      to-mp4 拼 convert、pdf-to-word 拼模式名），直接用 apiEndpoint 探测会拿到 404。
 *   2. dns-leak-test / ip-blocktest 的 apiEndpoint 里已经含 /network 前缀，不能再加。
 */
const ENDPOINT_SUFFIX = {
  'webp-to': 'api',
  'gif-split': 'upload',
  'to-mp4': 'convert',
  'compress-pdf': 'api',
  'pdf-to-word': '/basic',
  'jpg-to-pdf': 'a4',
};

function probePlan(tool) {
  const { slug, apiType, apiEndpoint, category } = tool;
  if (apiType === 'frontend') return null;
  if (!apiEndpoint) return null; // svg-to-png 等纯浏览器实现

  if (apiType === 'network') {
    let body;
    if (slug === 'http-header') body = { url: 'https://example.com' };
    else if (slug === 'dns' || slug === 'cdncheck') body = { domain: 'example.com' };
    else if (slug === 'asn') body = { ip: '8.8.8.8' };
    else if (slug === 'dns-leak-test') body = {};
    else if (slug === 'ip-blocktest') body = { ip: '8.8.8.8' };
    else body = { target: 'example.com' };
    // 已含 /network 前缀的不再重复拼接
    const base = apiEndpoint.startsWith('/network') ? API : `${API}/network`;
    return { kind: 'json', url: `${base}${apiEndpoint}`, body };
  }

  if (category === 'email' || apiEndpoint.startsWith('/email-diagnostics')) {
    // 聚合入口 /email-diagnostics/api/ 本身不是路由，前端会拼具体检查名
    const url = apiEndpoint.replace(/\/$/, '') === '/email-diagnostics/api'
      ? `${API}/email-diagnostics/api/spf`
      : `${API}${apiEndpoint}`;
    let target = 'gmail.com';
    if (slug === 'ptr-lookup' || slug === 'dnsbl-checker') target = '8.8.8.8';
    if (slug === 'tls-handshake-test') target = 'smtp.gmail.com';
    const body = { target };
    if (slug === 'dkim-checker') body.selector = 'default';
    return { kind: 'json', url, body };
  }

  // convert：multipart 上传
  const suffix = ENDPOINT_SUFFIX[slug] ?? '';
  const url = `${API}${apiEndpoint}${suffix}`;
  const pdfish = /pdf/.test(slug) && slug !== 'jpg-to-pdf' && slug !== 'image-to-pdf';
  const file = pdfish ? 'pdf' : slug.startsWith('jpg') || /exif/.test(slug) ? 'jpg' : 'png';
  // exif 系列后端读取的字段名是 image，其余是 file
  const field = slug === 'exif-viewer' || slug === 'exif-auto-orient' ? 'image' : 'file';
  return { kind: 'upload', url, field, file };
}

/**
 * 探测样本本来就不合法的工具：它们需要 .ico/.webp/.gif/视频 等特定输入，
 * 用通用样本只能触发格式校验。这类返回值代表「接口活着」，不算不可达。
 */
const SAMPLE_MISMATCH = new Set([
  'favicon-inspect', 'webp-to', 'gif-split', 'to-mp4',
  'barcode-decoder', 'barcode-reader', 'barcode-qr-decoder',
]);

async function probe(plan, timeoutMs = 90_000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    let res;
    if (plan.kind === 'json') {
      res = await fetch(plan.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan.body),
        signal: ctl.signal,
      });
    } else {
      const fd = new FormData();
      fd.append(plan.field, new Blob([fixture(plan.file)]), `probe.${plan.file}`);
      res = await fetch(plan.url, { method: 'POST', body: fd, signal: ctl.signal });
    }
    const ms = Date.now() - t0;
    const ct = res.headers.get('content-type') ?? '';
    let detail = '';
    // state: ok=接口正常 | sample=接口活着但拒了我们的测试样本 | down=不可达
    let state = res.ok ? 'ok' : 'down';
    if (!res.ok) detail = `HTTP ${res.status}`;
    if (ct.includes('application/json')) {
      const j = await res.json().catch(() => ({}));
      // 后端普遍返回 HTTP 200 + {ok:false} 或 {error:...}，必须看 body 才算数
      if (j.ok === false || j.error || j.success === false) {
        state = 'sample';
        detail = String(j.error ?? j.detail ?? '').slice(0, 90);
      }
      // 这类文案代表后端自己对外连不通，属于真实故障
      if (typeof j.result === 'string' && /timed out|unreachable/i.test(j.result)) {
        state = 'down';
        detail = j.result.slice(0, 90);
      }
      if (/timed out|unreachable|resolution lifetime/i.test(detail)) state = 'down';
    }
    return { state, ok: state === 'ok', status: res.status, ms, detail };
  } catch (e) {
    return {
      state: 'down', ok: false, status: 0, ms: Date.now() - t0,
      detail: e.name === 'AbortError' ? '超时' : e.message.slice(0, 90),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function pool(items, worker, size = 6) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await worker(items[idx], idx);
      }
    }),
  );
  return out;
}

/* ── 5. 汇总 ─────────────────────────────────────────────── */
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');

async function main() {
  const { map: ranked, err: rankErr } = await fetchRanked();

  const rows = tools.map((t) => {
    const main = resolveRender(t, mainBlocks);
    const hasVariants = (t.variants ?? []).length > 0;
    const variant = hasVariants ? resolveRender(t, variantBlocks) : null;
    const comp = main.comp;
    const tracked = comp ? (compSrc[comp] ?? '').includes('__trackToolUsed') : false;
    const usage = ranked.get(t.slug);
    return {
      slug: t.slug,
      category: t.category,
      component: t.component,
      render: comp ?? '（无）',
      tracked,
      routeIssue: [main.issue && `主页面：${main.issue}`, variant?.issue && `variant：${variant.issue}`]
        .filter(Boolean).join('；'),
      usage: usage ? usage.usage_count : 0,
      recent: usage ? usage.recent_usage_count : 0,
      inRanking: Boolean(usage),
      plan: probePlan(t),
    };
  });

  // 接口探测
  const apiRows = rows.filter((r) => r.plan);
  if (!NO_PROBE) {
    process.stderr.write(`探测 ${apiRows.length} 个后端接口…\n`);
    // whois 这类接口本身偶发超时（后端 subprocess 限时 10s），失败重试一次再判定，
    // 避免把偶发写成故障。仍然失败才算不可达，并在报告里标注为重试后依旧失败。
    const results = await pool(apiRows, async (r) => {
      let res = await probe(r.plan);
      if (res.state === 'down') {
        await new Promise((s) => setTimeout(s, 1500));
        const retry = await probe(r.plan);
        retry.retried = true;
        res = retry;
      }
      return res;
    }, 4);
    apiRows.forEach((r, i) => {
      const res = results[i];
      // 需要 .ico/.webp/.gif/视频 等特定输入的工具，格式校验失败说明接口是活的
      if (res.state === 'sample' && SAMPLE_MISMATCH.has(r.slug)) res.state = 'ok';
      res.ok = res.state === 'ok';
      r.probe = res;
    });
  }

  const zero = rows.filter((r) => r.usage === 0);
  const noTrack = rows.filter((r) => !r.tracked);
  const routeBad = rows.filter((r) => r.routeIssue);
  const apiDown = apiRows.filter((r) => r.probe && r.probe.state === 'down');
  const apiSample = apiRows.filter((r) => r.probe && r.probe.state === 'sample');

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
  const L = [];
  L.push('# 工具埋点覆盖与使用记录报告', '');
  L.push(`> 由 \`node scripts/tool-usage-report.mjs\` 自动生成，请勿手工编辑。`);
  L.push(`> 生成时间：${now}${NO_PROBE ? '（本次跳过接口探测）' : ''}`, '');

  L.push('## 概览', '');
  L.push('| 指标 | 数量 |', '|---|---|');
  L.push(`| 工具总数 | ${rows.length} |`);
  L.push(`| 渲染组件文件数 | ${new Set(rows.map((r) => r.render)).size} |`);
  L.push(`| 已接入埋点 | ${rows.length - noTrack.length} |`);
  L.push(`| **未接入埋点** | **${noTrack.length}** |`);
  L.push(`| **零使用记录** | **${zero.length}** |`);
  L.push(`| 有后端接口的工具 | ${apiRows.length} |`);
  L.push(`| **接口不可达** | **${NO_PROBE ? '未探测' : apiDown.length}** |`);
  L.push(`| 路由渲染异常 | ${routeBad.length} |`);
  L.push('');
  if (rankErr) L.push(`⚠️ 排行接口读取失败：${rankErr}，使用次数一列不可信。`, '');
  L.push('> 说明：排行接口服务端硬上限 50 条，排名 50 名之外的工具一律显示为 0 次，');
  L.push('> 因此「零使用记录」应理解为「未进入前 50」。埋点对同一浏览器同一工具有 5 分钟去重。', '');

  const section = (title, list, render) => {
    L.push(`## ${title}`, '');
    if (list.length === 0) { L.push('无。', ''); return; }
    render(list);
    L.push('');
  };

  section(`未接入埋点的工具（${noTrack.length}）`, noTrack, (list) => {
    L.push('| 工具 | 分类 | 渲染组件 |', '|---|---|---|');
    for (const r of list) L.push(`| \`${esc(r.slug)}\` | ${esc(r.category)} | ${esc(r.render)} |`);
  });

  section(`接口不可达的工具（${NO_PROBE ? '未探测' : apiDown.length}）`, NO_PROBE ? [] : apiDown, (list) => {
    L.push('判定口径：连接失败、超时、4xx/5xx，或返回体自述连不通（timed out / unreachable / DNS 解析失败）。', '');
    L.push('| 工具 | 分类 | 接口 | 状态 | 耗时 | 返回 |', '|---|---|---|---|---|---|');
    for (const r of list) {
      const note = r.probe.retried ? '（已重试仍失败）' : '';
      L.push(`| \`${esc(r.slug)}\` | ${esc(r.category)} | \`${esc(r.plan.url.replace(API, ''))}\` | ${r.probe.status || '连接失败'} | ${(r.probe.ms / 1000).toFixed(1)}s | ${esc(r.probe.detail) || '—'}${note} |`);
    }
  });

  if (!NO_PROBE) {
    section(`接口可达但本次调用未成功（${apiSample.length}）`, apiSample, (list) => {
      L.push('接口本身是活的（有正常 HTTP 响应），未成功的原因通常是本脚本的通用样本不满足格式要求，');
      L.push('也可能是并发探测下的偶发失败。**不计入不可达**，但若某项长期出现在这里，值得单独复核。', '');
      L.push('| 工具 | 接口 | 返回 |', '|---|---|---|');
      for (const r of list) {
        L.push(`| \`${esc(r.slug)}\` | \`${esc(r.plan.url.replace(API, ''))}\` | ${esc(r.probe.detail) || '—'} |`);
      }
    });
  }

  section(`零使用记录的工具（${zero.length}）`, zero, (list) => {
    L.push('可能原因分三类：页面渲染坏了、后端接口不通、或真实低流量。前两类已在上面两节标出。', '');
    L.push('| 工具 | 分类 | 渲染组件 | 埋点 | 接口 | 备注 |', '|---|---|---|---|---|---|');
    for (const r of list) {
      const api = !r.plan ? '纯前端' : NO_PROBE ? '未探测' : r.probe?.ok ? '✅ 正常' : '❌ 不可达';
      const note = r.routeIssue ? `⚠️ ${esc(r.routeIssue)}` : !r.tracked ? '⚠️ 未埋点' : '';
      L.push(`| \`${esc(r.slug)}\` | ${esc(r.category)} | ${esc(r.render)} | ${r.tracked ? '✅' : '❌'} | ${api} | ${note} |`);
    }
  });

  section(`路由渲染异常（${routeBad.length}）`, routeBad, (list) => {
    L.push('| 工具 | 问题 |', '|---|---|');
    for (const r of list) L.push(`| \`${esc(r.slug)}\` | ${esc(r.routeIssue)} |`);
  });

  L.push('## 完整覆盖表', '');
  L.push('| 分类 | 工具 | component | 渲染组件 | 埋点 | 累计 | 近7天 | 接口 |');
  L.push('|---|---|---|---|---|---:|---:|---|');
  const sorted = [...rows].sort((a, b) =>
    a.category.localeCompare(b.category) || b.usage - a.usage || a.slug.localeCompare(b.slug));
  for (const r of sorted) {
    const api = !r.plan ? '纯前端' : NO_PROBE ? '—' : r.probe?.ok ? '✅' : '❌';
    L.push(`| ${esc(r.category)} | \`${esc(r.slug)}\` | ${esc(r.component)} | ${esc(r.render)} | ${r.tracked ? '✅' : '❌'} | ${r.usage} | ${r.recent} | ${api} |`);
  }
  L.push('');

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  process.stderr.write(
    `已写入 ${path.relative(ROOT, OUT)}\n` +
    `  工具 ${rows.length}｜未埋点 ${noTrack.length}｜零使用 ${zero.length}｜` +
    `接口不可达 ${NO_PROBE ? '未探测' : apiDown.length}｜路由异常 ${routeBad.length}\n`,
  );
}

main().catch((e) => { console.error(e); process.exit(1); });
