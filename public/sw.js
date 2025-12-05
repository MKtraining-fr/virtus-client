// Service Worker pour Virtus PWA
// Version: 2.0.2 - Correction CORS pour requêtes externes

const CACHE_NAME = 'virtus-v2.0.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation v2.0.2 en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Installation terminée, activation forcée');
        return self.skipWaiting();
      })
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation v2.0.2 en cours...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression du cache obsolète:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activation terminée, prise de contrôle');
      return self.clients.claim();
    })
  );
});

// Stratégie de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // NE PAS intercepter les requêtes vers des domaines externes
  // Laisser le navigateur gérer directement ces requêtes pour éviter les problèmes CORS
  if (url.origin !== self.location.origin) {
    console.log('[Service Worker] Requête externe ignorée:', url.hostname);
    // Ne pas appeler event.respondWith() - laisser le navigateur gérer la requête normalement
    return;
  }
  
  // Ne mettre en cache que les requêtes GET pour les ressources locales
  if (event.request.method !== 'GET') {
    return;
  }

  // Pour les ressources locales: Network First avec fallback sur le cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Ne mettre en cache que les réponses réussies
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = response.clone();
        
        // Mettre en cache uniquement les ressources statiques
        if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff|woff2|ttf|eot)$/)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch((error) => {
        console.log('[Service Worker] Erreur réseau, tentative de récupération depuis le cache:', url.pathname);
        // Si le réseau échoue, essayer le cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[Service Worker] Ressource trouvée dans le cache:', url.pathname);
            return cachedResponse;
          }
          console.error('[Service Worker] Ressource non trouvée dans le cache:', url.pathname);
          throw error;
        });
      })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Message SKIP_WAITING reçu');
    self.skipWaiting();
  }
});
