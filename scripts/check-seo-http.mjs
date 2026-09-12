import assert from 'node:assert/strict';

// 默认检查线上全部 sitemap URL；可传本地 Pages 地址验证相同托管行为。
const base = process.argv[2] || 'https://www.tool.tl';
const origin = 'https://www.tool.tl';
const sample = process.argv.includes('--sample');
async function get(path) {
  const response = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  return { status: response.status, headers: response.headers, html: await response.text() };
}
const index = await get('/sitemap-index.xml');
assert.equal(index.status, 200);
assert.ok(index.html.includes('<sitemapindex'));
const sitemapUrls = [...index.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert.ok(sitemapUrls.length > 0);
const urls = [];
for (const sitemap of sitemapUrls) {
  assert.equal(new URL(sitemap).origin, origin);
  const result = await get(new URL(sitemap).pathname);
  assert.equal(result.status, 200);
  assert.ok(result.html.includes('<urlset'));
  const locs = [...result.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.length > 0);
  for (const url of locs) {
    assert.equal(new URL(url).origin, origin);
    assert.ok(!/\/(q|404)\/?$/.test(new URL(url).pathname));
  }
  urls.push(...locs);
}
assert.equal(new Set(urls).size, urls.length);
const prefixes = ['', '/ja', '/zh-CN', '/zh-TW'];
const samples = prefixes.flatMap(prefix => ['', '/about', '/changelog', '/totp-generator', '/totp-generator/online'].map(path => origin + prefix + path));
const targets = sample ? samples.filter(url => urls.some(item => new URL(item).href === new URL(url).href)) : [...urls];
targets.push(...prefixes.flatMap(prefix => ['/blog/qr-code-mechanism-practice', '/topics/ip/public-private-ip-differences'].map(path => origin + prefix + path)));
let cursor = 0;
let checked = 0;
const errors = [];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < targets.length) {
    const expected = new URL(targets[cursor++]);
    try {
      const { status, headers, html } = await get(expected.pathname);
      assert.equal(status, 200, `状态 ${status}，Location=${headers.get('location')}`);
      assert.ok(!/noindex/i.test(headers.get('x-robots-tag') || ''));
      assert.ok(!/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(html));
      const canonical = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)];
      assert.equal(canonical.length, 1);
      assert.equal(new URL(canonical[0][1]).href, expected.href);
      const og = html.match(/<meta[^>]+property="og:url"[^>]+content="([^"]+)"/);
      assert.ok(og);
      assert.equal(new URL(og[1]).href, expected.href);
      const links = [...html.matchAll(/<link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)];
      assert.equal(links.length, 5);
      const path = expected.pathname.replace(/^\/(?:ja|zh-CN|zh-TW)(?=\/|$)/, '').replace(/\/$/, '');
      const expectedLinks = { en: origin + (path || '/'), 'x-default': origin + (path || '/'),
        ja: origin + '/ja' + path, 'zh-Hans': origin + '/zh-CN' + path, 'zh-Hant': origin + '/zh-TW' + path };
      assert.deepEqual(Object.fromEntries(links.map(m => [m[1], m[2]])), expectedLinks);
      if (path.startsWith('/blog/') || path.startsWith('/topics/')) {
        const ld = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m => JSON.parse(m[1]));
        assert.equal(ld.find(item => item['@type'] === 'Article')?.url, expected.href);
        assert.ok(!html.includes('{categorySlug}'));
      }
    } catch (error) { errors.push(`${expected.href}: ${error.message}`); }
    checked++;
    if (checked % 100 === 0) console.log(`已检查 ${checked}/${targets.length}`);
  }
}));
const robots = await get('/robots.txt');
assert.equal(robots.status, 200);
assert.ok(robots.html.includes(`Sitemap: ${origin}/sitemap-index.xml`));
if (errors.length) console.error(errors.join('\n'));
assert.equal(errors.length, 0, `${errors.length} 个 URL 验收失败`);
console.log(`通过：${targets.length} 个 HTTP 页面、${urls.length} 条 sitemap URL 和 robots.txt（${base}）。`);
