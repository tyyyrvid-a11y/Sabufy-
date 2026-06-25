import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script',
        includeAssets: ['icon.svg', 'icon_192.png', 'icon_512.png'],
        manifest: {
          name: 'Sabufy',
          short_name: 'Sabufy',
          description: 'Aura Music Player for Sabufy',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/icon_192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon_512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      {
        name: 'yt-search-middleware',
        configureServer(server) {
          server.middlewares.use('/api/yt-search', async (req, res) => {
            const url = new URL(req.url!, `http://${req.headers.host}`);
            const query = url.searchParams.get('q');
            if (!query) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: 'Missing query' }));
            }
            try {
              const ytRes = await fetch('https://www.youtube.com/results?search_query=' + encodeURIComponent(query));
              const html = await ytRes.text();
              const match = html.match(/"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"/);
              res.setHeader('Content-Type', 'application/json');
              if (match) {
                res.end(JSON.stringify({ videoId: match[1] }));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Video not found' }));
              }
            } catch (e) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(e) }));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      proxy: {
        '/api/saavn': {
          target: 'https://saavn-api.vercel.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/saavn/, '')
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
