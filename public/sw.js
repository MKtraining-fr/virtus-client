// Service Worker pour Virtus PWA
// Version: 1.0.1

const CACHE_NAME = 'virtus-v1.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation en cours...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation en cours...');
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
    }).then(() => self.clients.claim())
  );
});

// Stratégie de cache: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Ne mettre en cache que les requêtes GET
  // Les requêtes POST, PUT, DELETE, etc. ne peuvent pas être mises en cache
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Ne pas mettre en cache les requêtes vers des APIs externes
  const url = new URL(event.request.url);
  if (url.hostname.includes('cloudinary.com') || 
      url.hostname.includes('supabase.co')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Ne mettre en cache que les réponses réussies
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone la réponse car elle ne peut être utilisée qu'une fois
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essayer le cache
        return caches.match(event.request);
      })
  );
});
