// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import partytown from '@astrojs/partytown';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react(), partytown(), vercel()],
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
  },
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en', 'fr'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});