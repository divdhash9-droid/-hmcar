'use client';

/**
 * [[ARABIC_COMMENT]] مكوّن تسجيل Service Worker للـ PWA
 * [[ARABIC_COMMENT]] يتم تشغيله تلقائياً عند تحميل الصفحة
 * [[ARABIC_COMMENT]] يُمكّن ميزة "إضافة إلى الشاشة الرئيسية" على الجوال
 */

import { useEffect, useState } from 'react';

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // [[ARABIC_COMMENT]] تسجيل Service Worker
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js', { scope: '/' })
                    .then((registration) => {
                        console.log('[HM CAR PWA] Service Worker مُسجَّل بنجاح:', registration.scope);
                    })
                    .catch((error) => {
                        console.error('[HM CAR PWA] فشل تسجيل Service Worker:', error);
                    });
            });
        }

        // [[ARABIC_COMMENT]] التقاط حدث التثبيت قبل ظهوره
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // [[ARABIC_COMMENT]] إظهار البانر بعد 3 ثوانٍ إذا لم يكن مثبتاً
            const alreadyInstalled = localStorage.getItem('pwa_installed');
            if (!alreadyInstalled) {
                setTimeout(() => setShowBanner(true), 3000);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // [[ARABIC_COMMENT]] تسجيل حدث اكتمال التثبيت
        window.addEventListener('appinstalled', () => {
            console.log('[HM CAR PWA] تم تثبيت التطبيق بنجاح!');
            localStorage.setItem('pwa_installed', '1');
            setShowBanner(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    // [[ARABIC_COMMENT]] تشغيل مربع حوار التثبيت عند ضغط المستخدم
    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem('pwa_installed', '1');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        // [[ARABIC_COMMENT]] بانر التثبيت - يظهر في الأسفل على الجوال
        <div
            className="fixed bottom-20 left-4 right-4 z-[9999] bg-black/95 border border-white/10 rounded-3xl p-4 shadow-2xl backdrop-blur-md flex items-center gap-4"
            style={{ animation: 'slideUp 0.4s ease-out' }}
        >
            {/* أيقونة التطبيق */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#a07848] flex items-center justify-center shrink-0 text-2xl font-black text-black shadow-lg">
                🚗
            </div>

            {/* النص */}
            <div className="flex-1 min-w-0">
                <div className="text-[12px] font-black text-white uppercase tracking-wider">HM CAR</div>
                <div className="text-[10px] text-white/50 leading-snug mt-0.5">
                    أضف التطبيق إلى شاشتك الرئيسية
                </div>
            </div>

            {/* أزرار */}
            <div className="flex flex-col gap-2 shrink-0">
                <button
                    onClick={handleInstall}
                    className="px-4 py-2 bg-[#c9a96e] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#e0bc7e] transition-all"
                >
                    تثبيت
                </button>
                <button
                    onClick={() => setShowBanner(false)}
                    className="px-4 py-2 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                >
                    لاحقاً
                </button>
            </div>

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
