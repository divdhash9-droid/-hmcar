'use client';

/**
 * مكوّن تثبيت PWA
 * يظهر بانر "أضف إلى الشاشة الرئيسية" مرة واحدة فقط
 * بعد الضغط على "لاحقاً" لا يظهر لمدة 7 أيام
 * بعد التثبيت لا يظهر إطلاقاً
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY = 'pwa_dismissed_until';
const INSTALLED_KEY = 'pwa_installed';
const DISMISS_DAYS = 7; // أيام قبل الإظهار مجدداً

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        // ── تسجيل Service Worker ──
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js', { scope: '/' })
                    .then(reg => console.log('[HM CAR PWA] SW registered:', reg.scope))
                    .catch(err => console.error('[HM CAR PWA] SW failed:', err));
            });
        }

        // ── التحقق: هل تم التثبيت أو الرفض مسبقاً؟ ──
        const isInstalled = localStorage.getItem(INSTALLED_KEY);
        const dismissedUntil = localStorage.getItem(DISMISSED_KEY);

        if (isInstalled) return; // مثبت → لا تظهر أبداً

        if (dismissedUntil) {
            const dismissedTime = parseInt(dismissedUntil, 10);
            if (Date.now() < dismissedTime) return; // في فترة الرفض → لا تظهر
        }

        // ── التقاط حدث التثبيت ──
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // أظهر البانر بعد 4 ثوانٍ
            setTimeout(() => setShowBanner(true), 4000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', () => {
            localStorage.setItem(INSTALLED_KEY, '1');
            setShowBanner(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    // ── زر التثبيت ──
    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem(INSTALLED_KEY, '1');
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    // ── زر لاحقاً: يحفظ الرفض لـ 7 أيام ──
    const handleDismiss = () => {
        const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISSED_KEY, String(until));
        setShowBanner(false);
    };

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-6 left-4 right-4 z-[9999] bg-[#0a0a0a] border border-white/10 rounded-3xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-4"
                >
                    {/* أيقونة التطبيق */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#7a5c2e] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(201,169,110,0.3)]">
                        <span className="text-2xl">🚗</span>
                    </div>

                    {/* النص */}
                    <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-white tracking-wider">HM CAR</div>
                        <div className="text-[11px] text-white/50 leading-snug mt-0.5">
                            أضف التطبيق إلى شاشتك الرئيسية
                        </div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex flex-col gap-2 shrink-0">
                        <button
                            onClick={handleInstall}
                            title="تثبيت التطبيق"
                            className="px-4 py-2 bg-[#c9a96e] text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#e0bc7e] transition-all"
                        >
                            تثبيت
                        </button>
                        <button
                            onClick={handleDismiss}
                            title="لاحقاً"
                            className="px-4 py-2 bg-white/5 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
                        >
                            لاحقاً
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
