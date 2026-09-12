import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// 使用本地内容样本检查 SSR 输出，不依赖线上文章或修改内容 API。
const origin = process.argv[2];
assert.ok(origin, '请传入预期规范域名');
const locales = ['', '/ja', '/zh-CN', '/zh-TW'];
const article = { id: 1, slug: 'seo-check', title: 'SEO 验收文章', summary: '验收样本',
  content: '<p>规范网址验收内容</p>', category_key: 'test', created_at: '2026-09-11' };
const records = Array.from({ length: 45 }, (_, i) => ({ ...article, slug: `seo-${i + 1}`, title: `验收文章 ${i + 1}` }));
records.push({ ...article, slug: 'other-article', category_key: 'other', title: '其他分类文章' });
let unavailable = false;
const api = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (unavailable) { res.statusCode = 503; res.end('{}'); return; }
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.endsWith('/categories')) {
    res.end(JSON.stringify({ data: [{ key: 'test', name: '验收分类' }, { key: 'other', name: '其他分类' }] }));
  } else if (url.pathname.endsWith('/articles/seo-check')) {
    res.end(JSON.stringify({ data: article }));
  } else if (url.pathname.endsWith('/articles')) {
    const category = url.searchParams.get('category');
    const rows = category ? records.filter(row => row.category_key === category) : records;
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = Number(url.searchParams.get('limit') || 10);
    res.end(JSON.stringify({ data: rows.slice(offset, offset + limit), total: rows.length }));
  } else { res.statusCode = 404; res.end('{}'); }
});
await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
const server = spawn(process.execPath, ['node_modules/astro/astro.js', 'dev', '--config', 'scripts/seo-test.config.mjs', '--host', '127.0.0.1', '--port', '4387'], {
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', PUBLIC_CONTENT_API_BASE: `http://127.0.0.1:${api.address().port}` },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });
const base = 'http://127.0.0.1:4387';
async function page(path) {
  console.log(`检查 ${path}`);
  const res = await fetch(base + path, { redirect: 'manual', signal: AbortSignal.timeout(120000) });
  assert.equal(res.status, 200, `${path} 应直接返回 200`);
  return res.text();
}
try {
  let ready = false;
  for (let i = 0; i < 180; i++) {
    if (server.exitCode !== null) throw new Error(output);
    try { await fetch(base + '/robots.txt', { signal: AbortSignal.timeout(1000) }); ready = true; break; } catch {}
    await delay(1000);
  }
  assert.ok(ready, `开发服务未启动：${output}`);
  for (const prefix of locales) {
    for (const path of ['/topics/test/seo-check', '/blog/seo-check']) {
      const html = await page(prefix + path);
      const canonicalPath = '/blog/seo-check';
      const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g)];
      assert.equal(canonicals.length, 1);
      assert.equal(canonicals[0][1], origin + prefix + canonicalPath);
      const alternates = [...html.matchAll(/<link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g)];
      assert.equal(alternates.length, 5);
      assert.deepEqual(Object.fromEntries(alternates.map(m => [m[1], m[2]])), {
        en: origin + canonicalPath, 'zh-Hans': origin + '/zh-CN' + canonicalPath,
        'zh-Hant': origin + '/zh-TW' + canonicalPath, ja: origin + '/ja' + canonicalPath,
        'x-default': origin + canonicalPath,
      });
      const ld = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .flatMap(m => JSON.parse(m[1]));
      const articleLd = ld.find(item => item['@type'] === 'Article');
      assert.ok(articleLd);
      assert.equal(articleLd.url, canonicals[0][1]);
      if (path.startsWith('/topics/')) {
        assert.equal(html.includes('{categorySlug}'), false);
        assert.ok(html.split(`href="${prefix}/topics/test"`).length >= 3);
        await page(prefix + '/topics/test');
      }
    }
    for (const path of ['/blog', '/topics/test']) {
      const first = await page(prefix + path);
      const second = await page(prefix + path + '?page=2');
      assert.ok(first.includes('/seo-1"') && !first.includes('/seo-21"'));
      assert.ok(second.includes('/seo-21"') && !second.includes('/seo-1"'));
      assert.ok(second.includes(`rel="canonical" href="${origin}${prefix}${path}?page=2"`));
      assert.ok(!/<link\b[^>]*hreflang=/.test(second));
    }
    const filtered = await page(prefix + '/blog?category=other');
    assert.ok(filtered.includes('/other-article"') && !filtered.includes('/seo-1"'));
    assert.ok(filtered.includes(`rel="canonical" href="${origin}${prefix}/blog?category=other"`));
    const lastCategory = await page(prefix + '/topics/test?page=3');
    assert.ok(lastCategory.includes('/seo-45"') && !lastCategory.includes('/other-article"'));
    for (const path of ['/blog/missing', '/topics/test/missing', '/topics/wrong/seo-check', '/topics/other/seo-check',
      '/topics/wrong', '/blog?category=wrong', '/blog?page=0', '/blog?page=1.5', '/blog?page=abc', '/blog?page=999', '/topics/test?page=999']) {
      const res = await fetch(base + prefix + path, { redirect: 'manual' });
      assert.equal(res.status, 404, prefix + path);
      assert.equal(res.headers.get('location'), null);
    }
    unavailable = true;
    try {
      for (const path of ['/blog', '/topics/test', '/blog/seo-check', '/topics/test/seo-check']) {
        const res = await fetch(base + prefix + path, { redirect: 'manual' });
        assert.equal(res.status, 503, prefix + path);
        assert.equal(res.headers.get('retry-after'), '60');
      }
    } finally { unavailable = false; }
  }
  console.log('通过：四语言文章规范入口、分页内容、分类筛选、非法路径 404 与上游故障 503。');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  server.kill();
  api.closeAllConnections();
  await new Promise(resolve => api.close(resolve));
}
