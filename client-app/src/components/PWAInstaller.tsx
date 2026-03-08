'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISSED_KEY = 'pwa_dismissed_until';
const INSTALLED_KEY = 'pwa_installed';
const DISMISS_DAYS = 7;

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    useEffect(() => {
        // ── تسجيل Service Worker ──
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js', { scope: '/' })
                    .then(reg => console.log('[HM CAR PWA] SW:', reg.scope))
                    .catch(err => console.error('[HM CAR PWA] SW error:', err));
            });
        }

        // ── التحقق من الحالة ──
        const installed = localStorage.getItem(INSTALLED_KEY);
        if (installed) { setIsInstalled(true); return; }

        const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) return;

        // ── كشف iOS ──
        const ua = navigator.userAgent;
        const iosDevice = /iphone|ipad|ipod/i.test(ua);
        const standalone = (window.navigator as any).standalone === true;
        setIsIOS(iosDevice);

        if (standalone) {
            localStorage.setItem(INSTALLED_KEY, '1');
            setIsInstalled(true);
            return;
        }

        // ── Android: التقاط حدث التثبيت ──
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowBanner(true), 3000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', () => {
            localStorage.setItem(INSTALLED_KEY, '1');
            setIsInstalled(true);
            setShowBanner(false);
        });

        // ── iOS: إظهار البانر بعد 3 ثوانٍ ──
        if (iosDevice && !standalone) {
            setTimeout(() => setShowBanner(true), 3000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallAndroid = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            localStorage.setItem(INSTALLED_KEY, '1');
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setShowBanner(false);
    };

    const handleDismiss = () => {
        const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISSED_KEY, String(until));
        setShowBanner(false);
        setShowIOSGuide(false);
    };

    if (isInstalled) return null;

    return (
        <>
            {/* ── بانر السفلي (Android + iOS) ── */}
            <AnimatePresence>
                {showBanner && (
                    <motion.div
                        initial={{ y: 120, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 120, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#0a0a0a] border-t border-[#c9a96e]/30 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl"
                        dir="rtl"
                    >
                        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
                            {/* أيقونة التطبيق */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a96e] to-[#7a5c2e] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(201,169,110,0.4)]">
                                <span className="text-xl">🚗</span>
                            </div>

                            {/* النص */}
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-black text-white">HM CAR</div>
                                <div className="text-[11px] text-white/50 mt-0.5">
                                    {isIOS ? 'أضفه لشاشتك الرئيسية للتجربة الكاملة' : 'ثبّت التطبيق على جهازك'}
                                </div>
                            </div>

                            {/* الأزرار */}
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={isIOS ? () => { setShowIOSGuide(true); setShowBanner(false); } : handleInstallAndroid}
                                    title="تثبيت التطبيق"
                                    className="px-4 py-2 bg-[#c9a96e] text-black text-[11px] font-black rounded-xl hover:bg-[#e0bc7e] transition-all whitespace-nowrap"
                                >
                                    تثبيت
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    title="لاحقاً"
                                    className="px-3 py-2 bg-white/5 text-white/40 text-[11px] font-black rounded-xl hover:bg-white/10 transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── دليل التثبيت لـ iOS ── */}
            <AnimatePresence>
                {showIOSGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] flex items-end justify-center"
                        onClick={handleDismiss}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-t-3xl p-6 shadow-2xl"
                            dir="rtl"
                        >
                            {/* مؤشر السحب */}
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                            <h3 className="text-lg font-black text-white mb-6 text-center">
                                📲 كيفية تثبيت التطبيق على iPhone
                            </h3>

                            {/* الخطوات */}
                            <div className="space-y-4">
                                {[
                                    { step: '1', icon: '⬆️', text: 'اضغط على زر المشاركة في المتصفح' },
                                    { step: '2', icon: '➕', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
                                    { step: '3', icon: '✅', text: 'اضغط "إضافة" — وستظهر الأيقونة!' },
                                ].map(item => (
                                    <div key={item.step} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                                        <div className="w-10 h-10 rounded-xl bg-[#c9a96e]/20 border border-[#c9a96e]/30 flex items-center justify-center text-lg shrink-0">
                                            {item.icon}
                                        </div>
                                        <p className="text-white/80 text-sm font-bold">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            {/* السهم الإرشادي */}
                            <div className="mt-6 flex justify-center">
                                <div className="px-2 py-1 rounded-lg bg-[#c9a96e]/10 border border-[#c9a96e]/20">
                                    <p className="text-[#c9a96e] text-xs font-black text-center">
                                        ابحث عن زر ⬆️ في أسفل المتصفح
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="w-full mt-4 py-3 bg-white/5 text-white/50 text-sm font-black rounded-2xl hover:bg-white/10 transition-all"
                            >
                                فهمت، شكراً
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
