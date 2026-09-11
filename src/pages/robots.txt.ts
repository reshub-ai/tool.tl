import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';

// 构建为静态文件，避免 Sitemap 声明与站点域名配置分离。
export const prerender = true;

export const GET: APIRoute = () => new Response(
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap-index.xml\n`,
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
