import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-exchange-rates',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Remover query params para la comparación exacta de ruta
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/api/exchange-rates') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              bcv: 42.50,
              euro: 46.20,
              paralelo: 45.80,
              updatedAt: new Date().toISOString(),
              slot: 'morning'
            }));
            return;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 3012,
    host: '127.0.0.1',
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 3012
    }
  }
})
