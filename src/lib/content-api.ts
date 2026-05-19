/**
 * Content API client — fetches articles, categories, etc. from content-api microservice.
 */

const CONTENT_API_BASE =
  import.meta.env.PUBLIC_CONTENT_API_BASE ||
  `${import.meta.env.PUBLIC_API_BASE || 'https://api.tool.tl'}/content`;

/** tool.tl = site_id 2 in the shared content platform */
const SITE_ID = '2';

export interface Article {
  id: number;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  category_id: number;
  category_name?: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  desc: string;
  article_count: number;
  last_updated: string | null;
}

export async function fetchArticles(
  page = 1,
  perPage = 20,
  categorySlug?: string,
  locale = 'en'
): Promise<{ articles: Article[]; total: number; pages: number }> {
  const params = new URLSearchParams({
    site_id: SITE_ID,
    page: String(page),
    per_page: String(perPage),
    lang: locale,
  });
  if (categorySlug) params.set('category', categorySlug);

  const res = await fetch(`${CONTENT_API_BASE}/api/articles?${params}`);
  if (!res.ok) throw new Error(`Articles API error: ${res.status}`);
  const json = await res.json();
  // API returns { data: [...], ok: true, total: N }
  const items = (json.data || json.articles || []).map((d: any) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    summary: d.summary || '',
    content: d.content || '',
    cover_image: d.cover_image || d.og_image,
    category_id: d.category_id || 0,
    category_name: d.category_name || d.category_key || '',
    views: d.view_count ?? d.views ?? 0,
    likes: d.like_count ?? d.likes ?? 0,
    dislikes: d.dislike_count ?? d.dislikes ?? 0,
    created_at: d.created_at || '',
    updated_at: d.updated_at || d.created_at || '',
  }));
  return {
    articles: items,
    total: json.total || 0,
    pages: json.pages || Math.ceil((json.total || 0) / perPage),
  };
}

export async function fetchArticleBySlug(slug: string, locale = 'en'): Promise<Article | null> {
  const res = await fetch(`${CONTENT_API_BASE}/api/articles/${encodeURIComponent(slug)}?site_id=${SITE_ID}&lang=${locale}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Article API error: ${res.status}`);
  const json = await res.json();
  const d = json.data || json;
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    summary: d.summary || '',
    content: d.content || '',
    cover_image: d.cover_image || d.og_image,
    category_id: d.category_id || 0,
    category_name: d.category_name || d.category_key || '',
    views: d.view_count ?? d.views ?? 0,
    likes: d.like_count ?? d.likes ?? 0,
    dislikes: d.dislike_count ?? d.dislikes ?? 0,
    created_at: d.created_at || '',
    updated_at: d.updated_at || d.created_at || '',
  };
}

export async function fetchCategories(locale = 'en'): Promise<Category[]> {
  const res = await fetch(`${CONTENT_API_BASE}/api/categories?site_id=${SITE_ID}&lang=${locale}`);
  if (!res.ok) throw new Error(`Categories API error: ${res.status}`);
  const json = await res.json();
  // API returns { data: [...], ok: true } with key/name/article_count
  const items = json.data || json || [];
  return items.map((c: any) => ({
    id: c.id || 0,
    name: c.name || c.key || '',
    slug: c.slug || c.key || '',
    desc: c.desc || c.description || '',
    article_count: c.article_count || 0,
    last_updated: c.last_updated || null,
  }));
}

export async function postArticleView(slug: string): Promise<void> {
  await fetch(`${CONTENT_API_BASE}/api/articles/${encodeURIComponent(slug)}/view?site_id=${SITE_ID}`, {
    method: 'POST',
  });
}

export async function postArticleLike(slug: string): Promise<void> {
  await fetch(`${CONTENT_API_BASE}/api/articles/${encodeURIComponent(slug)}/like?site_id=${SITE_ID}`, {
    method: 'POST',
  });
}

export async function postArticleDislike(slug: string): Promise<void> {
  await fetch(`${CONTENT_API_BASE}/api/articles/${encodeURIComponent(slug)}/dislike?site_id=${SITE_ID}`, {
    method: 'POST',
  });
}

/* ─── Tool Usage Statistics ───────────────────────────────── */

export async function postToolUsage(toolId: string): Promise<void> {
  try {
    await fetch(`${CONTENT_API_BASE}/api/tool-usage/${encodeURIComponent(toolId)}?site_id=${SITE_ID}`, {
      method: 'POST',
    });
  } catch {
    // Non-critical — silently ignore failures
  }
}

export interface RankedTool {
  tool_id: string;
  usage_count: number;
  recent_usage_count: number;
}

export async function fetchToolUsageRanked(limit = 6): Promise<RankedTool[]> {
  const res = await fetch(`${CONTENT_API_BASE}/api/tool-usage/ranked?site_id=${SITE_ID}&limit=${limit}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}
