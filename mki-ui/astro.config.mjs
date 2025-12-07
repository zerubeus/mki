// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: 'static',
  server: {
    host: '0.0.0.0',
    port: 4321
  },
  vite: {
    plugins: [tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 4321,
      // Allow Replit preview domains
      allowedHosts: ['.replit.dev'],
      // Ensure HMR connects over HTTPS through Replit's proxy
      hmr: {
        clientPort: 443
      }
    }
  },
  i18n: {
    defaultLocale: 'ar',
    locales: ['ar', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});