import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import path from 'path';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  root: 'src/ui',
  build: {
    outDir: '../../dist',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ui/index.html'),
    },
  },
  resolve: {
    alias: {
      '@/ui': path.resolve(__dirname, 'src/ui'),
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/catalog': path.resolve(__dirname, 'src/catalog'),
    },
  },
});
