// OIM Executive Suite - Service Worker for Offline PWA
// Version: 2.2.0 - Added Daily Reporting System (hazserve.html)
// Optimized for all devices: iPad, iPhone, Android, PC

const CACHE_VERSION = 'oim-suite-v2.2.0';
const CACHE_NAME = `oim-executive-${CACHE_VERSION}`;

// Files to cache for offline use
const STATIC_ASSETS = [
  // Main application
  './',
  './index.html',
  
  // All module pages in /pages/ directory
  './pages/OIM Assist.html',
  './pages/operation.html',
  './pages/key_equipment.html',
  './pages/my_kpi.html',
  './pages/handover.html',
  './pages/meme.html',
  './pages/share.html',
  './pages/safety.html',
  './pages/hazserve.html',
  './pages/calculator_failplay.html',
  './pages/turnaroundapp.html',
  './pages/analytics.html',
  
  // PWA manifest
  './manifest.json',
  
  // Reusable components
  './components/txt-export.js',
  './components/pdf-annotator.js'
];

// Essential CDN resources to cache (lightweight only)
const ESSENTIAL_CDN = [
  // Google Fonts (Inter font family) - Lightweight
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2',
  
  // PDF.js for share.html viewing only (keep this)
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache main files first
        return cache.addAll(STATIC_ASSETS.filter(url => 
          !url.includes('turnaroundapp') && !url.includes('analytics')
        )).catch(error => {
          console.warn('[SW] Some files not found (OK if missing):', error);
          // Continue even if some files don't exist
        });
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install error:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // CRITICAL FIX: Handle navigation requests (for iOS PWA reopen)
  // When user reopens PWA from home screen, iOS makes navigation request
  // Must serve index.html from cache IMMEDIATELY
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html')
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] 📱 Serving index.html from cache (iOS reopen)');
            return cachedResponse;
          }
          
          // Fallback: Try to fetch from network
          return fetch(event.request)
            .catch(() => {
              // If offline and no cache, show error
              return new Response(
                '<h1>Offline</h1><p>App is not cached yet. Connect to internet and visit all pages first.</p>',
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'text/html'
                  })
                }
              );
            });
        })
    );
    return;
  }
  
  // Handle external CDN requests
  if (requestUrl.origin !== location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving from cache:', requestUrl.pathname);
            return cachedResponse;
          }
          
          // Fetch from network and cache if it's an essential CDN
          return fetch(event.request)
            .then((response) => {
              // Only cache successful responses
              if (!response || response.status !== 200 || response.type === 'error') {
                return response;
              }
              
              // Check if this is an essential CDN resource
              const isEssential = ESSENTIAL_CDN.some(cdn => 
                event.request.url.includes(cdn.replace('https://', ''))
              );
              
              if (isEssential) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  console.log('[SW] Caching CDN:', event.request.url);
                  cache.put(event.request, responseToCache);
                });
              }
              
              return response;
            })
            .catch((error) => {
              console.error('[SW] Fetch failed for:', requestUrl.pathname);
              // Return generic error response for CDN failures
              return new Response('Resource unavailable offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
    );
    return;
  }
  
  // Handle same-origin requests (app pages, images, etc.)
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', requestUrl.pathname);
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Only cache successful responses
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone and cache the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME).then((cache) => {
              console.log('[SW] Caching:', requestUrl.pathname);
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', requestUrl.pathname);
            
            // If this is a navigation request, return the main page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // For other requests, return error
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

// Message event - handle commands from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
        .then(() => {
          console.log('[SW] Additional URLs cached');
        })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared');
      })
    );
  }
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Sync logic here if needed
      Promise.resolve()
    );
  }
});

console.log('[SW] Service Worker loaded successfully');
