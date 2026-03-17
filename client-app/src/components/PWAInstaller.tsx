'use client';

/**
 * مكون تثبيت التطبيق (PWA Installer)
 * يظهر زر عائم للمستخدم لتثبيت الموقع كتطبيق على شاشة الجوال الرئيسية.
 * يتعامل مع متصفح كروم (Android/Desktop) ومتصفح سفاري (iOS).
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X } from 'lucide-react';

const INSTALLED_KEY = 'pwa_installed';
const DISMISSED_KEY = 'pwa_dismissed_until';
const DISMISS_DAYS = 7;

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null); // حفظ حدث التثبيت لكروم
    const [visible, setVisible] = useState(false);   // إظهار/إخفاء الزر العائم
    const [isIOS, setIsIOS] = useState(false); // هل الجهاز هو آيفون؟
    const [showIOSGuide, setShowIOSGuide] = useState(false); // إظهار دليل تثبيت آيفون
    const [installing, setInstalling] = useState(false); // حالة معالجة التثبيت حالياً

    useEffect(() => {
        // ── تسجيل Service Worker ──
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(r => console.log('[HM CAR SW]', r.scope))
                    .catch(e => console.error('[HM CAR SW]', e));
            });
        }

        // ── كشف وضع Standalone (مثبت فعلاً) ──
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true;

        if (isStandalone) {
            // داخل التطبيق المثبت — لا نعرض زر التثبيت
            localStorage.setItem(INSTALLED_KEY, '1');
            return;
        }

        // ── إذا ليس standalone، نمسح flag القديم (المستخدم حذف التطبيق) ──
        localStorage.removeItem(INSTALLED_KEY);

        // ── التحقق من فترة الرفض ──
        const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) return;

        // ── كشف iOS ──
        const ua = navigator.userAgent;
        const ios = /iphone|ipad|ipod/i.test(ua);
        setIsIOS(ios);

        // ── Android: التقاط حدث التثبيت ──
        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstall);

        // الاستماع لحدث اكتمال التثبيت بنجاح
        window.addEventListener('appinstalled', () => {
            localStorage.setItem(INSTALLED_KEY, '1');
            setVisible(false); // إخفاء الزر فور اكتمال التثبيت
        });

        // ── إظهار الزر بعد ثانيتين ──
        const timer = setTimeout(() => setVisible(true), 2000);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            clearTimeout(timer);
        };
    }, []);

    // ── ضغط زر التثبيت ──
    const handleInstall = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }
        if (!deferredPrompt) return;

        setInstalling(true);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            localStorage.setItem(INSTALLED_KEY, '1');
            setVisible(false);   // ← يختفي الزر بعد التثبيت
        }
        setDeferredPrompt(null);
        setInstalling(false);
    };

    // ── تأجيل الزر ──
    const handleDismiss = () => {
        const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
        localStorage.setItem(DISMISSED_KEY, String(until));
        setVisible(false);
        setShowIOSGuide(false);
    };

    return (
        <>
            {/* ════════════════════════════════
                الزر العائم الثابت — دائماً ظاهر
            ════════════════════════════════ */}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 40 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                        className="fixed bottom-24 left-4 z-[9998] flex flex-col items-start gap-2"
                        dir="rtl"
                    >
                        {/* بطاقة صغيرة */}
                        <motion.div
                            className="flex items-center gap-3 bg-[#0c0c0c] border border-[#c9a96e]/40 rounded-2xl pl-4 pr-2 py-2 shadow-[0_8px_32px_rgba(201,169,110,0.25)] backdrop-blur-xl"
                            whileHover={{ scale: 1.03 }}
                        >
                            {/* أيقونة التطبيق */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a96e] to-[#7a5c2e] flex items-center justify-center text-lg shrink-0 shadow-[0_0_12px_rgba(201,169,110,0.4)]">
                                🚗
                            </div>

                            {/* نص */}
                            <div className="flex flex-col leading-tight">
                                <span className="text-[12px] font-black text-white tracking-wide">HM CAR</span>
                                <span className="text-[10px] text-white/50">ثبّت التطبيق مجاناً</span>
                            </div>

                            {/* زر التثبيت - Install Button */}
                            <button
                                onClick={handleInstall}
                                disabled={installing}
                                title="تثبيت التطبيق"
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a96e] text-black text-[11px] font-black rounded-xl hover:bg-[#e8c97a] active:scale-95 transition-all disabled:opacity-60"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                {installing ? '...' : 'تثبيت'}
                            </button>

                            {/* زر الإغلاق */}
                            <button
                                onClick={handleDismiss}
                                title="إغلاق"
                                className="w-6 h-6 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* دليل التثبيت لنظام iOS (دليل سفاري) */}
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
                            className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/10 rounded-t-3xl p-6 pb-10 shadow-2xl"
                            dir="rtl"
                        >
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

                            <h3 className="text-lg font-black text-white mb-6 text-center">
                                📲 كيف تثبّت HM CAR على iPhone
                            </h3>

                            <div className="space-y-3">
                                {[
                                    { icon: '⬆️', text: 'اضغط زر المشاركة في أسفل المتصفح' },
                                    { icon: '➕', text: 'اختر "إضافة إلى الشاشة الرئيسية"' },
                                    { icon: '✅', text: 'اضغط "إضافة" — وستجد الأيقونة على الشاشة!' },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
                                        <span className="text-2xl">{step.icon}</span>
                                        <p className="text-white/80 text-sm font-bold">{step.text}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="w-full mt-6 py-3 bg-white/5 text-white/50 text-sm font-black rounded-2xl hover:bg-white/10 transition-all"
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
