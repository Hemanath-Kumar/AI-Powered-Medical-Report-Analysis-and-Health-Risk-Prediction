import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/

export default {
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // VERY IMPORTANT
    port: 5173,
  }
}