import type { Locale } from '@/i18n/config';
import { getLocalizedPath } from '@/i18n/utils';

// 不将负数、小数、非法值或极大页码静默转换为首页。
export function getContentPage(params: URLSearchParams): number | null {
  const values = params.getAll('page');
  if (!values.length) return 1;
  if (values.length !== 1 || !/^[1-9]\d*$/.test(values[0])) return null;
  const page = Number(values[0]);
  return Number.isSafeInteger(page) && Number.isSafeInteger((page - 1) * 20) ? page : null;
}

export function getContentQuery(page: number, category?: string): string {
  const query = new URLSearchParams();
  if (category) query.set('category', category);
  if (page > 1) query.set('page', String(page));
  return query.size ? `?${query}` : '';
}

// 区分内容缺失与上游临时故障，避免 302 到列表后变成假 200。
export function contentError(status: 404 | 503, locale: Locale): Response {
  const messages = {
    en: ['Page not found', 'Content temporarily unavailable', 'Back to articles'],
    'zh-CN': ['页面不存在', '内容暂时无法加载，请稍后重试', '返回文章列表'],
    'zh-TW': ['頁面不存在', '內容暫時無法載入，請稍後重試', '返回文章列表'],
    ja: ['ページが見つかりません', '一時的にコンテンツを読み込めません。後でもう一度お試しください', '記事一覧へ'],
  }[locale];
  const title = messages[status === 404 ? 0 : 1];
  return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | tool.tl</title></head><body><main><h1>${title}</h1><a href="${getLocalizedPath('blog', locale)}">${messages[2]}</a></main></body></html>`, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...(status === 503 ? { 'Retry-After': '60' } : {}) },
  });
}
