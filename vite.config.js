import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-exchange-rates-and-routes',
      configureServer(server) {
        let cachedRates = null;
        let lastFetch = 0;

        server.middlewares.use(async (req, res, next) => {
          const urlPath = req.url.split('?')[0];
          if (urlPath === '/api/exchange-rates') {
            const now = Date.now();
            if (cachedRates && now - lastFetch < 60000) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(cachedRates));
              return;
            }

            try {
              const [bcvRes, euroRes, parRes] = await Promise.all([
                fetch('https://ve.dolarapi.com/v1/dolares/oficial').catch(() => null),
                fetch('https://ve.dolarapi.com/v1/euros/oficial').catch(() => null),
                fetch('https://ve.dolarapi.com/v1/dolares/paralelo').catch(() => null),
              ]);

              let bcv = 791.67;
              let euro = 921.88;
              let paralelo = 922.97;

              if (bcvRes?.ok) {
                const d = await bcvRes.json();
                if (d?.promedio) bcv = Number(d.promedio);
              }
              if (euroRes?.ok) {
                const d = await euroRes.json();
                if (d?.promedio) euro = Number(d.promedio);
              }
              if (parRes?.ok) {
                const d = await parRes.json();
                if (d?.promedio) paralelo = Number(d.promedio);
              }

              cachedRates = {
                success: true,
                bcv,
                euro,
                paralelo,
                updatedAt: new Date().toISOString(),
                slot: 'live'
              };
              lastFetch = now;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(cachedRates));
              return;
            } catch (err) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                bcv: 791.67,
                euro: 921.88,
                paralelo: 922.97,
                updatedAt: new Date().toISOString(),
                slot: 'fallback'
              }));
              return;
            }
          }
          if (urlPath === '/web' || urlPath === '/landing') {
            req.url = '/landing.html';
          }
          next();
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        landing: resolve(__dirname, 'landing.html'),
      },
    },
  },
  server: {
    port: 3012,
    host: true,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '127.0.0.1',
      port: 3012
    }
  }
})
