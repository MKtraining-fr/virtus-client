const CACHE_NAME = 'virtus-pwa-v2-supabase';
// Add all assets that make up the app shell.
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json'
    // JS modules and other assets will be cached on the fly by the fetch handler
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('[Service Worker] Pre-caching App Shell');
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Clearing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
    // We only want to cache GET requests.
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Cache-first strategy for all GET requests.
    // Good for static assets and CDN resources that don't change often.
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            
            return fetch(event.request).then(networkResponse => {
                // Check if we received a valid response to cache
                if (!networkResponse || networkResponse.status !== 200) {
                    return networkResponse;
                }
                
                // Don't cache chrome-extension URLs
                if (event.request.url.startsWith('chrome-extension://')) {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                
                return networkResponse;
            });
        })
    );
});