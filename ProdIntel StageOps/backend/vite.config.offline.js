/**
 * Vite config override for offline mode.
 *
 * To use: copy this file to the project root as vite.config.js
 * (or merge the alias into your existing vite.config.js)
 *
 * This redirects all `@/api/base44Client` imports to the local client switcher,
 * so every page and component automatically uses the offline backend
 * without any import changes.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Redirect base44 cloud client → local switcher
      '../../api/base44Client': path.resolve(root, 'components/api/apiClientSwitcher.js'),
      // Keep standard @ alias
      '@': path.resolve(root, 'src'),
    },
  },
  define: {
    // Set offline mode flag
    'import.meta.env.VITE_OFFLINE_MODE': JSON.stringify('true'),
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3001'),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});