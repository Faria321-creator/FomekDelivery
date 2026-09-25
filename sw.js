// Service Worker para FOMEK seu app de Delivery
const CACHE_NAME = 'fomek-cache-v1';
const ASSETS_TO_CACHE = [
  './pedido.html',
  './manifest.json',
  './css/style.css',
  './js/data.js',
  './js/frete.js',
  './js/cloud.js',
  './img/logo.png',
  './img/icon-192.png',
  './img/icon-512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Falha ao pré-cachear alguns itens:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: Network First com fallback para Cache
self.addEventListener('fetch', (event) => {
  // Ignora chamadas de API externas e requisições não-GET
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Se a resposta for válida, clonar e atualizar cache
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se estiver sem internet, retorna o cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./pedido.html');
          }
        });
      })
  );
});
