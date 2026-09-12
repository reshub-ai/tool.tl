import assert from 'node:assert/strict';

// 发布后验证真实分页和分类内容，不只核对 head 元数据。
const base = process.argv[2] || 'https://www.tool.tl';
const origin = 'https://www.tool.tl';
async function get(path, status = 200) {
  const res = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(45000) });
  assert.equal(res.status, status, `${path} 状态错误，Location=${res.headers.get('location')}`);
  return res.text();
}
function canonical(html) {
  const values = [...html.matchAll(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/g)];
  assert.equal(values.length, 1);
  return values[0][1].replaceAll('&amp;', '&');
}
function slugs(html) {
  return [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].flatMap(m => {
    const link = m[1].match(/href="(?:\/(?:ja|zh-CN|zh-TW))?\/(?:blog|topics\/[^/]+)\/([^"/?]+)"/);
    return link ? [link[1]] : [];
  });
}
for (const prefix of ['', '/ja', '/zh-CN', '/zh-TW']) {
  const first = await get(prefix + '/blog');
  const second = await get(prefix + '/blog?page=2');
  const firstSlugs = slugs(first), secondSlugs = slugs(second);
  assert.equal(firstSlugs.length, 20);
  assert.equal(secondSlugs.length, 20);
  assert.ok(secondSlugs.every(slug => !firstSlugs.includes(slug)), '第 2 页重复第 1 页');
  assert.equal(canonical(second), origin + prefix + '/blog?page=2');
  const locale = prefix.slice(1) || 'en';
  const api = await fetch(`https://api.tool.tl/content/api/articles?site_id=2&lang=${locale}&category=ip&limit=20&offset=0`);
  assert.equal(api.status, 200);
  const expected = (await api.json()).data.map(article => article.slug);
  assert.ok(expected.length > 0);
  const category = await get(prefix + '/topics/ip');
  const filtered = await get(prefix + '/blog?category=ip');
  assert.deepEqual(slugs(category), expected, '分类页与分类 API 不一致');
  assert.deepEqual(slugs(filtered), expected, 'blog 分类筛选不一致');
  assert.equal(canonical(filtered), origin + prefix + '/blog?category=ip');
  const slug = 'public-private-ip-differences';
  for (const route of [`/blog/${slug}`, `/topics/ip/${slug}`]) {
    const html = await get(prefix + route);
    assert.equal(canonical(html), origin + prefix + `/blog/${slug}`);
  }
  for (const route of ['/blog/seo-definitely-missing-20260912', '/topics/ip/seo-definitely-missing-20260912',
    `/topics/not-a-real-category/${slug}`, `/topics/tools/${slug}`, '/topics/not-a-real-category',
    '/blog?page=0', '/blog?page=1.5', '/blog?page=999999', '/blog?category=not-a-real-category']) {
    await get(prefix + route, 404);
  }
  console.log(`通过 ${locale}：真实分页、分类列表、统一文章规范入口和错误路径 404。`);
}
