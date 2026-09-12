import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

// 使用本地内容样本检查 SSR 输出，不依赖线上文章或修改内容 API。
const origin = process.argv[2];
assert.ok(origin, '请传入预期规范域名');
const locales = ['', '/ja', '/zh-CN', '/zh-TW'];
const article = { id: 1, slug: 'seo-check', title: 'SEO 验收文章', summary: '验收样本',
  content: '<p>规范网址验收内容</p>', category_id: 1, created_at: '2026-09-11' };
const api = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const path = new URL(req.url, 'http://localhost').pathname;
  const data = path.endsWith('/categories')
    ? [{ id: 1, slug: 'test', name: '验收分类' }]
    : path.endsWith('/articles/seo-check') ? article : [article];
  res.end(JSON.stringify({ data, total: 1, pages: 1 }));
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
      const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g)];
      assert.equal(canonicals.length, 1);
      assert.equal(canonicals[0][1], origin + prefix + path);
      const alternates = [...html.matchAll(/<link\b[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"[^>]*>/g)];
      assert.equal(alternates.length, 5);
      assert.deepEqual(Object.fromEntries(alternates.map(m => [m[1], m[2]])), {
        en: origin + path, 'zh-Hans': origin + '/zh-CN' + path,
        'zh-Hant': origin + '/zh-TW' + path, ja: origin + '/ja' + path,
        'x-default': origin + path,
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
  }
  console.log('通过：四语言 topics 与 blog 共 8 个 SSR 页面，含规范网址、语言互链、JSON-LD 和分类导航。');
} catch (error) {
  console.error(output);
  throw error;
} finally {
  server.kill();
  api.closeAllConnections();
  await new Promise(resolve => api.close(resolve));
}
