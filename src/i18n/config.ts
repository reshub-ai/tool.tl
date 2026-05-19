export const defaultLocale = 'en';
export const locales = ['en', 'zh-CN', 'zh-TW', 'ja'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
};

export const hreflangMap: Record<Locale, string> = {
  en: 'en',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  ja: 'ja',
};

export const toolCategories = [
  { key: 'pdf', icon: '📄' },
  { key: 'image', icon: '🖼️' },
  { key: 'barcode', icon: '📊' },
  { key: 'network', icon: '🌐' },
  { key: 'email', icon: '📧' },
  { key: 'dev', icon: '💻' },
  { key: 'video', icon: '🎬' },
  { key: 'password', icon: '🔐' },
  { key: 'finance', icon: '💰' },
] as const;
