import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Separate from vite.config.js on purpose: the app's vite.config.js pulls in
// @base44/vite-plugin (HMR notifier, analytics tracker, visual edit agent),
// none of which should run under a jsdom test environment. This config only
// needs the '@' alias and React JSX transform that plugin also happens to set up.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
  },
});
