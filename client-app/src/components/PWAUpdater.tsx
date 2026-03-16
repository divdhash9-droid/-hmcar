'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function PWAUpdater() {
    const { isRTL } = useLanguage();
    const [showUpdate, setShowUpdate] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        // [[ARABIC_COMMENT]] الاستماع لرسالة التحديث من Service Worker
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log('[HM CAR] New version detected:', event.data.version);
                setShowUpdate(true);
            }
        };

        navigator.serviceWorker.addEventListener('message', handleMessage);

        // [[ARABIC_COMMENT]] فحص التحديثات عند فتح التطبيق
        const checkUpdate = async () => {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                registration.update();
            }
        };

        const timeout = setTimeout(checkUpdate, 5000);

        return () => {
            navigator.serviceWorker.removeEventListener('message', handleMessage);
            clearTimeout(timeout);
        };
    }, []);

    const handleUpdate = () => {
        window.location.reload();
    };

    return (
        <AnimatePresence>
            {showUpdate && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-24 left-4 right-4 z-[9999] md:left-auto md:right-8 md:bottom-8 md:w-96"
                >
                    <div className="relative overflow-hidden glass-card p-5 rounded-3xl border border-cinematic-neon-gold/30 bg-black/80 backdrop-blur-2xl shadow-[0_0_40px_rgba(201,169,110,0.2)]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cinematic-neon-gold to-transparent" />
                        
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-cinematic-neon-gold animate-pulse" />
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                                    {isRTL ? 'تحديث جديد متوفر' : 'NEW UPDATE READY'}
                                </h3>
                                <p className="text-[11px] text-white/50 leading-relaxed font-medium mb-4">
                                    {isRTL 
                                        ? 'قم بتحديث التطبيق الآن للحصول على أحدث الميزات والمجموعات الجديدة.' 
                                        : 'A new cinematic version is available with latest features and cars.'}
                                </p>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleUpdate}
                                        className="flex-1 bg-cinematic-neon-gold hover:bg-cinematic-neon-gold/90 text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        {isRTL ? 'تحديث الآن' : 'UPDATE NOW'}
                                    </button>
                                    <button
                                        onClick={() => setShowUpdate(false)}
                                        title={isRTL ? 'إغلاق' : 'Close'}
                                        aria-label={isRTL ? 'إغلاق' : 'Close'}
                                        className="px-3 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/60 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
