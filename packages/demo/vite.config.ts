import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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