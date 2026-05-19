import { defaultLocale, locales, hreflangMap, type Locale } from './config';

import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import ja from './locales/ja.json';

const translations: Record<Locale, Record<string, string>> = {
  en,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  ja,
};

/** Get translated text by key. Falls back to English if missing. */
export function t(key: string, locale: Locale = defaultLocale): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

/** Extract locale from URL pathname. */
export function getLocaleFromUrl(url: URL): Locale {
  const segments = url.pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && (locales as readonly string[]).includes(first)) {
    return first as Locale;
  }
  return defaultLocale;
}

/**
 * Get the path portion without locale prefix.
 * E.g. "/zh-CN/json-formatter" → "json-formatter"
 */
export function getPathWithoutLocale(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && (locales as readonly string[]).includes(first)) {
    return segments.slice(1).join('/');
  }
  return segments.join('/');
}

/** Generate a localized path for a given locale. */
export function getLocalizedPath(path: string, locale: Locale): string {
  const clean = path.replace(/^\/+|\/+$/g, '');
  // Strip any existing locale prefix
  const withoutLocale = getPathWithoutLocale('/' + clean);
  if (locale === defaultLocale) {
    return '/' + withoutLocale;
  }
  return withoutLocale ? `/${locale}/${withoutLocale}` : `/${locale}`;
}

/** Generate alternate hreflang links for a given path (no locale prefix). */
export function getAlternateLinks(path: string): Array<{ hreflang: string; href: string }> {
  const clean = path.replace(/^\/+|\/+$/g, '');
  const base = 'https://tool.tl';
  const links: Array<{ hreflang: string; href: string }> = [];

  for (const locale of locales) {
    const localePath = locale === defaultLocale ? `/${clean}` : `/${locale}/${clean}`;
    links.push({
      hreflang: hreflangMap[locale],
      href: `${base}${localePath}`,
    });
  }

  // x-default points to default locale
  links.push({
    hreflang: 'x-default',
    href: `${base}/${clean}`,
  });

  return links;
}
