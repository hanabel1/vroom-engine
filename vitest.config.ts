import { defineConfig } from 'vitest/config';
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/catalog': path.resolve(__dirname, 'src/catalog'),
      '@/plugin': path.resolve(__dirname, 'src/plugin'),
    },
  },
});
