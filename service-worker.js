const CACHE_NAME = "financeiro-pwa-v1";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/app.jsx",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/recharts@2.12.7/umd/Recharts.js",
  "https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js",
  "https://unpkg.com/lucide-react@0.383.0/dist/umd/lucide-react.js",
  "https://unpkg.com/@babel/standalone/babel.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
];

// Install — cache all static assets
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn("Cache miss:", url, err))
        )
      );
    })
  );
});

// Activate — clean up old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — Cache First strategy with network fallback
self.addEventListener("fetch", event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/index.html").then(fallback => {
              return fallback || new Response(
                `<!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                  <title>Offline — Personnalité Financeiro</title>
                  <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    body { background: #111; color: #fff; font-family: sans-serif;
                           display: flex; align-items: center; justify-content: center;
                           min-height: 100vh; flex-direction: column; gap: 16px; padding: 24px; text-align: center; }
                    .icon { width: 64px; height: 64px; background: #EC7000; border-radius: 16px;
                            display: flex; align-items: center; justify-content: center;
                            font-size: 32px; margin-bottom: 8px; }
                    h1 { font-size: 20px; color: #EC7000; }
                    p { font-size: 14px; color: #666; max-width: 280px; line-height: 1.5; }
                    button { background: #EC7000; color: #fff; border: none; padding: 12px 24px;
                             border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 8px; }
                  </style>
                </head>
                <body>
                  <div class="icon">₢</div>
                  <h1>Sem conexão</h1>
                  <p>Você está offline. Seus dados locais estão seguros. Conecte-se à internet para carregar o app.</p>
                  <button onclick="window.location.reload()">Tentar novamente</button>
                </body>
                </html>`,
                { headers: { "Content-Type": "text/html" } }
              );
            });
          }
        });
    })
  );
});
