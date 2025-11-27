// Service Worker pour Virtus PWA
// Version: 2.0.1 - Correction PWA Cloudflare avec support Cloudinary

const CACHE_NAME = 'virtus-v2.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation v2.0.1 en cours...');
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
  console.log('[Service Worker] Activation v2.0.1 en cours...');
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
  // Ne mettre en cache que les requêtes GET
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  const url = new URL(event.request.url);
  
  // Ne JAMAIS mettre en cache les requêtes vers Supabase (authentification, données)
  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('supabase.in')) {
    console.log('[Service Worker] Bypass cache pour Supabase:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('[Service Worker] Erreur réseau Supabase:', error);
          throw error;
        })
    );
    return;
  }

  // Autoriser Cloudinary mais ne PAS le mettre en cache (pour avoir toujours les dernières icônes)
  if (url.hostname.includes('cloudinary.com') || 
      url.hostname.includes('res.cloudinary.com')) {
    console.log('[Service Worker] Bypass cache pour Cloudinary:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.error('[Service Worker] Erreur réseau Cloudinary:', error);
          throw error;
        })
    );
    return;
  }

  // Ne pas mettre en cache les requêtes vers des CDN externes
  if (url.hostname.includes('cdn.') ||
      url.hostname.includes('flaticon.com')) {
    event.respondWith(fetch(event.request));
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
