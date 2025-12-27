// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

const isProduction = process.env.NODE_ENV === 'production';

// https://astro.build/config
export default defineConfig({
  site: 'https://mustknowislam.com',
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [react(), sitemap()],
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()],
    // Only apply SSR config for production builds (Cloudflare Workers)
    // Local dev with Node 23 can't handle react-dom/server.edge
    ...(isProduction ? {
      ssr: {
        external: ['react-dom/server']
      },
      resolve: {
        alias: {
          'react-dom/server': 'react-dom/server.edge'
        }
      }
    } : {})
  },
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en', 'fr'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});