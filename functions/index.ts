// Cloudflare Pages edge function: language-based redirect at root /
// Reads Accept-Language header and redirects to the matching locale path.
// English (default) is served at / with no prefix — only non-English users are redirected.

const LANG_MAP: Record<string, string> = {
  ja: 'ja',
  'zh-cn': 'zh-CN',
  'zh-sg': 'zh-CN',
  'zh-my': 'zh-CN',
  'zh-hans': 'zh-CN',
  zh: 'zh-CN',
  'zh-tw': 'zh-TW',
  'zh-hk': 'zh-TW',
  'zh-mo': 'zh-TW',
  'zh-hant': 'zh-TW',
};

function detectLocale(acceptLanguage: string): string | null {
  const entries = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    if (LANG_MAP[tag]) return LANG_MAP[tag];
    const prefix = tag.split('-')[0];
    if (LANG_MAP[prefix]) return LANG_MAP[prefix];
  }
  return null; // English / unknown → serve default
}

const LOCALE_PREFIXES = ['/zh-CN/', '/zh-TW/', '/ja/'];

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Skip if already on a non-English locale path — prevents redirect loops
  for (const prefix of LOCALE_PREFIXES) {
    if (path.startsWith(prefix) || path === prefix.slice(0, -1)) return context.next();
  }

  const acceptLanguage = context.request.headers.get('Accept-Language') ?? '';
  const locale = detectLocale(acceptLanguage);
  if (locale) {
    const target = new URL(`/${locale}/`, context.request.url).toString();
    return Response.redirect(target, 302);
  }
  return context.next();
};
