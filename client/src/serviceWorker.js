/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'retail-master-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const OFFLINE_DB_NAME = 'offlineDB';
const OFFLINE_STORE = 'offlineActions';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/static/js/main.chunk.js',
    '/static/js/bundle.js',
    '/static/js/vendors~main.chunk.js',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

const API_ROUTES = [
    '/api/inventory',
    '/api/sales',
    '/api/customers',
    '/api/suppliers',
    '/api/purchase-orders'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(STATIC_ASSETS);
            })
    );
});

// Listen for requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle API requests
    if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
        event.respondWith(handleApiRequest(request));
    }
    // Handle static assets
    else {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(request).then((response) => {
                        return caches.open(DYNAMIC_CACHE)
                            .then((cache) => {
                                cache.put(request, response.clone());
                                return response;
                            });
                    });
                })
                .catch(() => {
                    // Return offline page if available
                    return caches.match('/offline.html');
                })
        );
    }
});

// Handle API requests
async function handleApiRequest(request) {
    try {
        const response = await fetch(request);
        return response;
    } catch (error) {
        // If offline, store the request for later
        if (!navigator.onLine) {
            if (request.method !== 'GET') {
                await storeOfflineAction(request);
            }
            // Return cached data for GET requests
            return caches.match(request);
        }
        throw error;
    }
}

// Store offline actions in IndexedDB
async function storeOfflineAction(request) {
    const db = await openDB();
    const tx = db.transaction(OFFLINE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_STORE);

    const action = {
        url: request.url,
        method: request.method,
        headers: Array.from(request.headers.entries()),
        body: await request.clone().text(),
        timestamp: Date.now()
    };

    await store.add(action);
    await tx.complete;
}

// Open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(OFFLINE_DB_NAME, 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(OFFLINE_STORE)) {
                db.createObjectStore(OFFLINE_STORE, { 
                    keyPath: 'timestamp' 
                });
            }
        };
    });
}

// Sync offline actions when back online
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-offline-actions') {
        event.waitUntil(syncOfflineActions());
    }
});

// Process offline actions
async function syncOfflineActions() {
    const db = await openDB();
    const tx = db.transaction(OFFLINE_STORE, 'readwrite');
    const store = tx.objectStore(OFFLINE_STORE);
    const actions = await store.getAll();

    for (const action of actions) {
        try {
            const response = await fetch(action.url, {
                method: action.method,
                headers: new Headers(action.headers),
                body: action.method !== 'GET' ? action.body : undefined
            });

            if (response.ok) {
                await store.delete(action.timestamp);
            }
        } catch (error) {
            console.error('Error syncing offline action:', error);
        }
    }

    await tx.complete;
}

// Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                    return null;
                })
            );
        })
    );
});
