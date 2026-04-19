import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    optimizeDeps: {
      exclude: ['jspdf', 'jspdf-autotable'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Neutralize core-js polyfill that attempts to overwrite window.fetch
        'core-js/modules/web.url-search-params.constructor.js': path.resolve(__dirname, 'src/lib/empty.ts'),
        'core-js/modules/web.url-search-params.constructor': path.resolve(__dirname, 'src/lib/empty.ts'),
        // Also alias the parent module just in case
        'core-js/modules/web.url-search-params.js': path.resolve(__dirname, 'src/lib/empty.ts'),
        'core-js/modules/web.url-search-params': path.resolve(__dirname, 'src/lib/empty.ts'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
