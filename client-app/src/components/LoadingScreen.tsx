'use client';

/**
 * شاشة التحميل السينمائية (Loading Screen)
 * تظهر عند فتح التطبيق لأول مرة أو أثناء تحميل الموارد الأساسية.
 * تحتوي على شريط تقدم (Progress Bar) وشعار متحرك مع تأثيرات إضاءة "Orb".
 */

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function LoadingScreen() {
    const { isRTL } = useLanguage();
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // محاكاة عملية التحميل لزيادة شريط التقدم بشكل عشوائي ومنتظم
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    // إخفاء الشاشة بعد اكتمال التحميل بمدة قصيرة
                    setTimeout(() => setIsVisible(false), 600);
                    return 100;
                }
                return prev + Math.random() * 15 + 5;
            });
        }, 120);

        return () => clearInterval(timer);
    }, []);

    return (
        <AnimatePresence mode="wait">
            {isVisible && (
                <motion.div
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className={cn(
                        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black",
                        isRTL && "font-arabic"
                    )}
                >
                    {/* Film grain */}
                    <div className="video-grain" />

                    {/* Background glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="orb orb-gold w-[500px] h-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-breathe" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        {/* Logo */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="text-center space-y-2"
                        >
                            <h1 className="text-6xl md:text-8xl font-black tracking-[-0.06em] leading-none">
                                <span className="gradient-text-platinum block">HM</span>
                                <span className="font-display italic gradient-text-gold">CAR</span>
                            </h1>
                        </motion.div>

                        {/* Progress bar */}
                        <motion.div
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '200px' }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="h-[2px] bg-white/5 rounded-full overflow-hidden relative"
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-accent-gold to-transparent"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        </motion.div>

                        {/* Status */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-4"
                        >
                            <div className="w-1 h-1 rounded-full bg-accent-gold animate-pulse" />
                            <span className="text-[7px] font-bold uppercase tracking-[0.6em] text-white/25">
                                {isRTL ? "جاري التحميل..." : "LOADING..."}
                            </span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
