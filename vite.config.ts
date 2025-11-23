import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/catalog-beer': {
            target: 'https://api.catalog.beer',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/catalog-beer/, ''),
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.CATALOG_BEER_API_KEY': JSON.stringify(env.CATALOG_BEER_API_KEY),
        'process.env.CATALOG_BEER_PROXY': JSON.stringify(env.CATALOG_BEER_PROXY || '/catalog-beer'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
