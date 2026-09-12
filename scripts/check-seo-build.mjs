import assert from 'node:assert/strict';
import { readdirSync as readdir, readFileSync as readFile } from 'node:fs';
import { join } from 'node:path';

// 完整构建后检查静态页面与 sitemap；SSR 详情页另由 check-seo-ssr 验收。
const origin = 'https://www.tool.tl';
const strictPaths = process.argv.includes('--strict-paths');
console.log('读取 sitemap…');
const sitemapFiles = (await readdir('dist')).filter(name => /^sitemap-.*\.xml$/.test(name));
assert.ok(sitemapFiles.includes('sitemap-index.xml'), '缺少 sitemap index');
const locs = [];
for (const name of sitemapFiles) {
  const xml = await readFile(join('dist', name), 'utf8');
  assert.ok(xml.includes(name === 'sitemap-index.xml' ? '<sitemapindex' : '<urlset'));
  const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(entries.length > 0, `${name} 为空`);
  for (const url of [...entries, ...[...xml.matchAll(/href="([^"]+)"/g)].map(m => m[1])]) {
    assert.equal(new URL(url).origin, origin, `${name} 包含错误域名`);
  }
  if (name !== 'sitemap-index.xml') locs.push(...entries);
  else for (const url of entries) assert.ok(sitemapFiles.includes(new URL(url).pathname.slice(1)));
}
assert.equal(new Set(locs).size, locs.length, 'sitemap 包含重复条目');
const key = value => {
  const url = new URL(value);
  if (!strictPaths && url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');
  return url.href;
};
const sitemapSet = new Set(locs.map(key));
console.log(`检查 ${locs.length} 条 sitemap URL 对应页面…`);
for (const url of locs) assert.ok(!/\/(?:q|404)\/?$/.test(new URL(url).pathname), `不应纳入 sitemap：${url}`);
let checked = 0;
const staticUrls = new Set();
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name === 'pagefind') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) { await walk(path); continue; }
    if (!entry.name.endsWith('.html')) continue;
    assert.ok(entry.name !== 'index.html' || dir === 'dist', `${path} 会触发 Pages 目录尾斜杠重定向`);
    if (process.env.SEO_DEBUG) console.log(path);
    const html = await readFile(path, 'utf8');
    const relative = path.replaceAll('\\', '/').replace(/^dist\//, '').replace(/(?:\/)?index\.html$/, '').replace(/\.html$/, '');
    if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/.test(html)) {
      assert.ok(!sitemapSet.has(key(`${origin}/${relative}`)), `${path} 为 noindex，却进入 sitemap`);
      continue;
    }
    const canonical = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)];
    assert.equal(canonical.length, 1, `${path} canonical 数量错误`);
    const url = canonical[0][1];
    assert.equal(new URL(url).origin, origin, path);
    assert.ok(!html.includes('https://tool.tl'), `${path} 残留裸域`);
    if (strictPaths) assert.ok(sitemapSet.has(key(url)), `${path} canonical 不在 sitemap 中：${url}`);
    if (strictPaths) assert.equal(key(url), key(`${origin}/${relative}`), `${path} canonical 指向其他页面`);
    const alternates = [...html.matchAll(/<link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)];
    assert.equal(alternates.length, 5, path);
    assert.equal(new Set(alternates.map(m => m[1])).size, 5, path);
    for (const m of alternates) {
      assert.equal(new URL(m[2]).origin, origin);
      if (strictPaths) assert.ok(sitemapSet.has(key(m[2])), `${path} hreflang 不在 sitemap 中：${m[2]}`);
    }
    staticUrls.add(key(`${origin}/${relative}`));
    checked++;
    if (checked % 200 === 0) console.log(`已检查 ${checked} 个静态页面`);
  }
}
await walk('dist');
assert.ok(checked > 0, '没有检查任何页面');
// 固定 SSR 列表路由会进入 sitemap，但没有静态 HTML；动态文章由另一个脚本验收。
const ssrPaths = new Set(['', '/ja', '/zh-CN', '/zh-TW'].flatMap(prefix => ['/blog', '/topics', '/top-tools'].map(path => key(origin + prefix + path))));
for (const url of sitemapSet) assert.ok(staticUrls.has(url) || ssrPaths.has(url), `未覆盖的 sitemap 条目：${url}`);
const robots = await readFile('dist/robots.txt', 'utf8');
assert.equal(robots, `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap-index.xml\n`);
console.log(`通过：${checked} 个静态页面、${locs.length} 条 sitemap URL、robots.txt${strictPaths ? '，路径形式严格一致' : ''}。`);
