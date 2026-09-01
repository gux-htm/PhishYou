import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // The browser never talks to the LLM provider directly — every /api/*
      // call is proxied to the PhishYou FastAPI backend (backend/main.py)
      // in development. The API key stays server-side at all times.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
