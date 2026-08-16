import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-core',
              test: /node_modules[\\/](react|react-dom|react-router|react-redux|react-is|scheduler)/,
              priority: 40,
            },
            {
              name: 'redux-vendor',
              test: /node_modules[\\/](@reduxjs|redux|axios|use-sync-external-store)/,
              priority: 35,
            },
            {
              name: 'realtime-vendor',
              test: /node_modules[\\/](framer-motion|socket\.io-client|engine\.io-client)/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        ws: true,
      },
    },
  },
});
