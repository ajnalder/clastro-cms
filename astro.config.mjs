// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

const isBuild = process.argv.includes('build');

export default defineConfig({
  site: 'https://clastro-cms-demo.ajnalder.workers.dev',
  output: 'server',
  integrations: [react()],
  adapter: isBuild ? cloudflare() : undefined,
  server: {
    allowedHosts: true,
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        ...(isBuild
          ? {}
          : {
              'cloudflare:workers': fileURLToPath(
                new URL('./src/lib/shims/cloudflare-workers.ts', import.meta.url),
              ),
            }),
        'use-sync-external-store/shim/index.js': fileURLToPath(
          new URL('./src/lib/shims/use-sync-external-store-shim.ts', import.meta.url),
        ),
        'use-sync-external-store/shim/with-selector.js': fileURLToPath(
          new URL('./src/lib/shims/use-sync-external-store-with-selector.ts', import.meta.url),
        ),
      },
    },
    optimizeDeps: {
      exclude: [
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/core',
        '@tiptap/pm',
        'use-sync-external-store',
        'use-sync-external-store/shim',
        'use-sync-external-store/with-selector',
      ],
    },
  },
});
