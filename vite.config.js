import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/Christopher/' : '/',
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        resources: resolve(process.cwd(), 'resources.html'),
        resourceStudio: resolve(process.cwd(), 'admin-resources.html'),
      },
    },
  },
});
