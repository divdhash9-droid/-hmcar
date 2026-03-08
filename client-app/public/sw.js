// [[ARABIC_COMMENT]] ملف Service Worker الخاص بـ HM CAR PWA
// [[ARABIC_COMMENT]] يُمكّن العمل دون اتصال بالإنترنت وتحسين الأداء عبر التخزين المؤقت

const CACHE_NAME = 'hmcar-v2';

// [[ARABIC_COMMENT]] الملفات الثابتة التي سيتم تخزينها فور تثبيت التطبيق
const STATIC_ASSETS = [
    '/',
    '/showroom',
    '/parts',
    '/contact',
    '/about',
    '/manifest.json',
];

// [[ARABIC_COMMENT]] تثبيت Service Worker وتخزين الموارد الأساسية
self.addEventListener('install', (event) => {
    console.log('[SW] تثبيت Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] تخزين الموارد الأساسية...');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] فشل تخزين بعض الموارد:', err);
            });
        })
    );
    // [[ARABIC_COMMENT]] تفعيل فوري بدون انتظار إغلاق التبويبات القديمة
    self.skipWaiting();
});

// [[ARABIC_COMMENT]] تفعيل Service Worker وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
    console.log('[SW] تفعيل Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] حذف الكاش القديم:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    // [[ARABIC_COMMENT]] التحكم في جميع الصفحات المفتوحة فوراً
    self.clients.claim();
});

// [[ARABIC_COMMENT]] استراتيجية التخزين المؤقت: Network First للـ API، Cache First للصور
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // [[ARABIC_COMMENT]] تجاهل طلبات API دائماً وجلبها من الشبكة
    if (url.pathname.startsWith('/api/')) {
        return event.respondWith(fetch(request));
    }

    // [[ARABIC_COMMENT]] الصور: Cache First لأسرع تحميل
    if (request.destination === 'image') {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                }).catch(() => {
                    // [[ARABIC_COMMENT]] في حالة فشل الشبكة، إرجاع صورة احتياطية
                    return new Response('', { status: 404 });
                });
            })
        );
        return;
    }

    // [[ARABIC_COMMENT]] بقية الطلبات: Network First مع Fallback للكاش
    event.respondWith(
        fetch(request)
            .then((response) => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, clone);
                    });
                }
                return response;
            })
            .catch(() => {
                return caches.match(request).then((cached) => {
                    if (cached) return cached;
                    // [[ARABIC_COMMENT]] عرض الصفحة الرئيسية كـ fallback نهائي
                    return caches.match('/');
                });
            })
    );
});

// [[ARABIC_COMMENT]] استقبال رسائل Push Notifications (للمستقبل)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    self.registration.showNotification(data.title || 'HM CAR', {
        body: data.body || 'لديك إشعار جديد',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' }
    });
});

// [[ARABIC_COMMENT]] فتح الصفحة عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((windowClients) => {
            for (const client of windowClients) {
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
