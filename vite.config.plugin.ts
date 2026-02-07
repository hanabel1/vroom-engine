import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, 'src/plugin/main.ts'),
      name: 'plugin',
      fileName: () => 'plugin.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
  },
  resolve: {
    alias: {
      '@/plugin': path.resolve(__dirname, 'src/plugin'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
    },
  },
});
