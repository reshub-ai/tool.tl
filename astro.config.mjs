import { SITE_URL } from './src/config/site.ts';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  output: 'static',
  adapter: cloudflare({
    platformProxy: {
      enabled: false,
    },
    routes: {
      extend: {
        exclude: [
          { pattern: '/pagefind/*' },
        ],
      },
    },
  }),
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
        return !pathname.includes('/404') && pathname !== '/q';
      },
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          'zh-CN': 'zh-Hans',
          'zh-TW': 'zh-Hant',
          ja: 'ja',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'zh-TW', 'ja'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
