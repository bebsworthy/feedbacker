import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL || '/',
  resolve: {
    alias: {
      '@feedbacker/core': path.resolve(__dirname, '../feedbacker/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});