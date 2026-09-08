import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Single-file build.
 *
 * One bundle, no code splitting, and every font inlined as a data URI, so the
 * whole app collapses into a single index.html with zero external requests.
 * Used for hand-deploys where a zip or a folder upload is not practical.
 */
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'dist-single',
    target: 'es2020',
    sourcemap: false,
    // Large enough that every woff2 becomes a data URI inside the CSS.
    assetsInlineLimit: 100 * 1024 * 1024,
    cssCodeSplit: false,
    rollupOptions: {
      output: { inlineDynamicImports: true, manualChunks: undefined },
    },
  },
});
