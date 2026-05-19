import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://tool.tl',
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
      filter: (page) => !page.includes('/404'),
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
