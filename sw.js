// NoteZ Service Worker
const CACHE_NAME = 'notez-cache-v1';
const URLS_TO_CACHE = [
    '/Notee/',
    '/Notee/index.html',
    '/Notee/app.js',
    '/Notee/manifest.json',
    '/Notee/sw.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching app shell');
            return cache.addAll(URLS_TO_CACHE).catch((err) => {
                console.log('[Service Worker] Cache addAll error:', err);
                // Don't fail install if some resources can't be cached
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip chrome extensions
    if (request.url.startsWith('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                console.log('[Service Worker] Serving from cache:', request.url);
                return response;
            }

            return fetch(request).then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache successful responses for certain file types
                const url = new URL(request.url);
                const shouldCache = 
                    request.url.endsWith('.js') ||
                    request.url.endsWith('.css') ||
                    request.url.endsWith('.html') ||
                    request.url.endsWith('.json') ||
                    request.url.includes('fonts.googleapis');

                if (shouldCache) {
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseToCache);
                    });
                }

                return response;
            }).catch((error) => {
                console.log('[Service Worker] Fetch error:', error);
                
                // Return a fallback response for failed requests
                if (request.mode === 'navigate') {
                    // Return cached index.html for navigation requests
                    return caches.match('/Notee/index.html');
                }

                // Return offline message for other requests
                return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            });
        })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log('[Service Worker] Cache cleared');
            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
        });
    }
});

// Background sync (requires browser support)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notes') {
        event.waitUntil(
            // Sync notes with server here
            Promise.resolve().then(() => {
                console.log('[Service Worker] Syncing notes...');
            })
        );
    }
});

// Push notifications (for future enhancement)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'NoteZ notification',
        icon: '/Notee/icon.png',
        badge: '/Notee/badge.png',
        tag: 'notez-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('NoteZ', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            // Check if there's already a window with the app open
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === '/Notee/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/Notee/');
            }
        })
    );
});

console.log('[Service Worker] Loaded');
