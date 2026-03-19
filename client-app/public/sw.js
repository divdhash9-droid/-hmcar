// [[ARABIC_COMMENT]] ملف Service Worker المُحسَّن لـ HM CAR PWA
// [[ARABIC_COMMENT]] الإصدار يتغير مع كل نشر جديد لإجبار المتصفح على التحديث الفوري
// [[ARABIC_COMMENT]] استراتيجية: Network First للصفحات (للتحديثات الفورية) + Cache for Images (للسرعة)

// [[ARABIC_COMMENT]] رقم الإصدار - يتغير مع كل نشر جديد تلقائياً
const SW_VERSION = 'mmy2vi6n'; // ستقوم هذه النسخة بتحديث أجهزة العملاء فوراً
const CACHE_NAME = `hmcar-cache-${SW_VERSION}`;
const IMAGE_CACHE = `hmcar-images-${SW_VERSION}`;

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] حدث التثبيت - خفيف وسريع
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', () => {
    console.log(`[HM CAR SW v${SW_VERSION}] تثبيت...`);
    // [[ARABIC_COMMENT]] تفعيل فوري بدون انتظار إغلاق التبويبات القديمة
    self.skipWaiting();
});

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] حدث التفعيل - حذف الكاش القديم فوراً
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    console.log(`[HM CAR SW v${SW_VERSION}] تفعيل وتنظيف الكاش القديم...`);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    // [[ARABIC_COMMENT]] احذف أي كاش لا ينتمي للإصدار الحالي
                    .filter((name) => name !== CACHE_NAME && name !== IMAGE_CACHE)
                    .map((name) => {
                        console.log(`[HM CAR SW] حذف كاش قديم: ${name}`);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // [[ARABIC_COMMENT]] تحكم فوري في جميع الصفحات المفتوحة
            return self.clients.claim();
        }).then(() => {
            // [[ARABIC_COMMENT]] إخبار كل الصفحات بأن تحديثاً جديداً متوفر
            return self.clients.matchAll({ type: 'window' }).then((clients) => {
                clients.forEach(client => {
                    client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
                });
            });
        })
    );
});

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] استراتيجيات الكاش حسب نوع الطلب
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // [[ARABIC_COMMENT]] 1. تجاهل طلبات الـ API تماماً - دائماً من الشبكة
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
        return; // [[ARABIC_COMMENT]] اتركها للمتصفح الافتراضي
    }

    // [[ARABIC_COMMENT]] 2. تجاهل طلبات غير GET
    if (request.method !== 'GET') return;

    // [[ARABIC_COMMENT]] 3. تجاهل طلبات chrome-extension و non-http
    if (!url.protocol.startsWith('http')) return;

    // [[ARABIC_COMMENT]] 4. الصور: Stale-While-Revalidate للسرعة + التحديث
    if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i)) {
        event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
        return;
    }

    // [[ARABIC_COMMENT]] 5. الصفحات HTML: Network First للتحديثات الفورية
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // [[ARABIC_COMMENT]] 6. ملفات CSS/JS الثابتة: Cache First (تحتوي على hash في اسمها)
    if (url.pathname.match(/\.(css|js|woff|woff2|ttf)$/i) && url.pathname.includes('/_next/static/')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
        return;
    }
});

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] استراتيجية Network First - للصفحات
// [[ARABIC_COMMENT]] يجلب من الشبكة أولاً، وإذا فشل يرجع للكاش
// ─────────────────────────────────────────────────────────────
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            // [[ARABIC_COMMENT]] احفظ نسخة في الكاش للطوارئ فقط
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        // [[ARABIC_COMMENT]] في حالة انقطاع الإنترنت فقط
        const cached = await caches.match(request);
        return cached || new Response(
            `<!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>HM CAR - غير متصل</title>
                <style>
                    body { background: #000; color: #fff; font-family: system-ui, sans-serif;
                           display: flex; align-items: center; justify-content: center;
                           min-height: 100vh; margin: 0; text-align: center; padding: 20px; }
                    h1 { font-size: 2rem; font-weight: 900; margin: 0 0 1rem;
                         background: linear-gradient(135deg, #c9a96e, #a07848);
                         -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                    p { color: rgba(255,255,255,0.5); font-size: 0.9rem; margin: 0 0 2rem; }
                    button { background: #c9a96e; color: #000; border: none; padding: 12px 28px;
                             border-radius: 12px; font-weight: 900; font-size: 0.85rem;
                             cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase; }
                </style>
            </head>
            <body>
                <div>
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🚗</div>
                    <h1>HM CAR</h1>
                    <p>لا يوجد اتصال بالإنترنت حالياً</p>
                    <button onclick="window.location.reload()">إعادة المحاولة</button>
                </div>
            </body>
            </html>`,
            {
                status: 503,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
        );
    }
}

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] استراتيجية Cache First - للملفات الثابتة
// ─────────────────────────────────────────────────────────────
async function cacheFirstStrategy(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
    }
    return networkResponse;
}

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] استراتيجية Stale-While-Revalidate - للصور
// [[ARABIC_COMMENT]] يعرض الصورة المخزنة فوراً ثم يحدثها في الخلفية
// ─────────────────────────────────────────────────────────────
async function staleWhileRevalidateStrategy(request, cacheName) {
    const cached = await caches.match(request);
    const networkPromise = fetch(request).then(response => {
        if (response.ok) {
            caches.open(cacheName).then(cache => cache.put(request, response.clone()));
        }
        return response;
    }).catch(() => null);

    return cached || await networkPromise;
}

// ─────────────────────────────────────────────────────────────
// [[ARABIC_COMMENT]] Push Notifications - إشعارات للمستقبل
// ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;
    try {
        const data = event.data.json();
        event.waitUntil(
            self.registration.showNotification(data.title || 'HM CAR', {
                body: data.body || 'لديك إشعار جديد',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                dir: 'rtl',
                lang: 'ar',
                vibrate: [200, 100, 200],
                data: { url: data.url || '/' },
                actions: [
                    { action: 'open', title: 'عرض' },
                    { action: 'close', title: 'تجاهل' },
                ]
            })
        );
    } catch (e) {
        console.warn('[HM CAR SW] Push notification error:', e);
    }
});

// [[ARABIC_COMMENT]] استجابة لنقر الإشعار
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // [[ARABIC_COMMENT]] إذا كانت الصفحة مفتوحة، ركّز عليها
            for (const client of windowClients) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            // [[ARABIC_COMMENT]] وإلا افتح نافذة جديدة
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
