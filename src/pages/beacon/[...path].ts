import type { APIRoute } from 'astro';

// 自建 Google Analytics 反向代理，避免 googletagmanager.com / google-analytics.com
// 被广告拦截器屏蔽。BaseLayout 通过 /beacon/gtag/js 加载脚本，并把 GA4 的
// transport_url 设为 /beacon/，collect 请求走 /beacon/g/collect。
// 需要在边缘运行时执行，因此不预渲染。
export const prerender = false;

const GTM_HOST = 'https://www.googletagmanager.com';
const GA_HOST = 'https://www.google-analytics.com';

// 不应原样透传的逐跳/内容编码相关响应头（Workers 的 fetch 已解压 body）
const STRIP_HEADERS = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailers', 'transfer-encoding', 'upgrade',
  'content-encoding', 'content-length', 'host',
  'set-cookie', 'alt-svc',
]);

async function proxy(request: Request, path: string): Promise<Response> {
  // path 形如 "gtag/js" 或 "g/collect"
  const url = new URL(request.url);
  const upstreamBase = path.startsWith('gtag/') ? GTM_HOST : GA_HOST;
  const target = `${upstreamBase}/${path}${url.search}`;

  const headers = new Headers();
  const forward = ['user-agent', 'accept', 'accept-language', 'content-type', 'referer'];
  for (const h of forward) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }
  // 把真实客户端 IP 透传给 GA，保证地域统计准确
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch {
    // 上游异常时对 collect 返回 204，避免控制台报错影响页面
    return new Response(null, { status: 204 });
  }

  const respHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_HEADERS.has(key.toLowerCase())) respHeaders.set(key, value);
  });
  // gtag/js 脚本适度缓存，减少回源
  if (path.startsWith('gtag/')) {
    respHeaders.set('cache-control', 'public, max-age=900, stale-while-revalidate=86400');
  } else {
    respHeaders.set('cache-control', 'no-store');
  }

  return new Response(upstream.body, { status: upstream.status, headers: respHeaders });
}

export const ALL: APIRoute = ({ request, params }) => proxy(request, params.path ?? '');
