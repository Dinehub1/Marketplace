/**
 * SarkarSarkar — Service Worker v1.0
 * Provides offline caching, background sync, and push notification support
 * Cache strategy: Stale-While-Revalidate for HTML, Cache-First for assets
 */

const CACHE_NAME = 'sarkarsarkar-v3';
const STATIC_CACHE = 'sarkarsarkar-static-v3';
const DYNAMIC_CACHE = 'sarkarsarkar-dynamic-v3';

// Core app shell assets — cached on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/services.html',
  '/eligibility.html',
  '/tracker.html',
  '/dashboard.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/robots.txt',
  '/sitemap.xml'
];

// External assets to cache
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2'
];

// ===== INSTALL EVENT =====
// Pre-cache the app shell so the portal works offline
self.addEventListener('install', function(event) {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(function(cache) {
        return cache.addAll(SHELL_ASSETS);
      }),
      caches.open(DYNAMIC_CACHE).then(function(cache) {
        return cache.addAll(EXTERNAL_ASSETS).catch(function() {
          // External assets may fail (CORS), that's OK
          console.log('[SW] Some external assets could not be pre-cached');
        });
      })
    ]).then(function() {
      return self.skipWaiting();
    })
  );
});

// ===== ACTIVATE EVENT =====
// Clean up old caches from previous versions
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== CACHE_NAME;
          })
          .map(function(name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ===== FETCH EVENT =====
// Stale-While-Revalidate for HTML pages, Cache-First for static assets
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // HTML pages: Stale-While-Revalidate
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // CSS/JS: Cache-First with network fallback
  if (url.pathname.match(/\.(css|js)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Images: Cache-First with expiration
  if (request.headers.get('accept') && request.headers.get('accept').includes('image')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Fonts: Cache-First (long-lived)
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Default: Network-First with cache fallback
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// ===== CACHE STRATEGIES =====

// Stale-While-Revalidate: Serve cached version immediately, update cache in background
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cachedResponse) {
      var fetchPromise = fetch(request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(function() {
        return cachedResponse;
      });
      return cachedResponse || fetchPromise;
    });
  });
}

// Cache-First: Check cache, fall back to network
function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(request).then(function(cachedResponse) {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      });
    });
  });
}

// Network-First: Try network, fall back to cache
function networkFirst(request, cacheName) {
  return fetch(request)
    .then(function(networkResponse) {
      if (networkResponse && networkResponse.status === 200) {
        var responseClone = networkResponse.clone();
        caches.open(cacheName).then(function(cache) {
          cache.put(request, responseClone);
        });
      }
      return networkResponse;
    })
    .catch(function() {
      return caches.match(request).then(function(cachedResponse) {
        if (cachedResponse) return cachedResponse;
        // Return offline fallback for navigation requests
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    });
}

// ===== PUSH NOTIFICATIONS =====
// Handle incoming push messages (for application status updates)
self.addEventListener('push', function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'SarkarSarkar', body: event.data ? event.data.text() : 'New notification' };
  }

  var options = {
    body: data.body || 'You have a new notification from SarkarSarkar',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'sarkarsarkar-notification',
    renotify: true,
    data: data.url ? { url: data.url } : {},
    actions: data.actions || [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'SarkarSarkar', options)
  );
});

// ===== NOTIFICATION CLICK =====
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  var targetUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Focus existing window if open
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('sarkarsarkar') && 'focus' in clientList[i]) {
          clientList[i].navigate(targetUrl);
          return clientList[i].focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ===== BACKGROUND SYNC =====
// Queue form submissions when offline, sync when back online
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-applications') {
    event.waitUntil(syncPendingApplications());
  }
});

function syncPendingApplications() {
  return new Promise(function(resolve) {
    // In production, this would read from IndexedDB and POST to API
    console.log('[SW] Syncing pending applications...');
    resolve();
  });
}

// ===== MESSAGE HANDLING =====
// Communicate with the main app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(function(cache) {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
