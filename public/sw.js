// [[ARABIC_HEADER]] هذا الملف (public/sw.js) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

const CACHE_NAME = 'hmcar-cache-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll([
      '/',
      '/public/manifest.json',
      '/public/css/single-section.css',
      '/public/css/modern-design.css',
      '/public/css/header-modern.css',
      '/public/css/footer-modern.css',
      '/public/css/rtl-support.css',
      '/public/css/modern-auth.css',
      '/public/js/payment.js',
      '/public/js/notifications.js',
      '/public/js/countdown.js',
      '/public/js/chat.js',
      '/public/images/icons/icon.svg',
      '/public/images/icons/icon-192x192.png',
      '/public/images/icons/icon-512x512.png',
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
      'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Montserrat:wght@400;500;600;700;800&display=swap'
    ]).catch(() => undefined))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cache-first for static assets
  if (url.pathname.startsWith('/public/') || url.hostname === 'cdnjs.cloudflare.com' || url.hostname === 'fonts.googleapis.com') {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => undefined);
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first for pages/APIs with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => undefined);
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
  );
});

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'HM CAR Auction - تحديث جديد',
    icon: '/public/images/icons/icon-192x192.png',
    badge: '/public/images/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'استكشف',
        icon: '/public/images/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: '/public/images/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HM CAR Auction', options)
  );
});

// Notification Click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
