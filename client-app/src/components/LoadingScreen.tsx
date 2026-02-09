'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function LoadingScreen() {
    const { isRTL } = useLanguage();
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(timer);
                    setTimeout(() => setIsVisible(false), 800);
                    return 100;
                }
                return prev + Math.floor(Math.random() * 5) + 1;
            });
        }, 50);

        return () => clearInterval(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(20px)" }}
            className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* 3D Tunnel Effect */}
            <div className="absolute inset-0 perspective-1000">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-luxury-gold/5 via-transparent to-transparent opacity-20 animate-pulse" />
                <div className="absolute inset-0 scan-lines opacity-10" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-12 max-w-md w-full px-6">
                {/* Logo Glitch */}
                <div className="relative group">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-6xl md:text-8xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 mix-blend-screen relative z-10"
                    >
                        HM <span className="text-luxury-gold gold-glow">CAR</span>
                    </motion.h1>
                    <div className="absolute inset-0 text-6xl md:text-8xl font-black italic tracking-tighter text-cinematic-neon-blue opacity-50 blur-[2px] animate-pulse mix-blend-screen translate-x-[2px]">
                        HM CAR
                    </div>
                    <div className="absolute inset-0 text-6xl md:text-8xl font-black italic tracking-tighter text-cinematic-neon-red opacity-50 blur-[2px] animate-pulse mix-blend-screen -translate-x-[2px]">
                        HM CAR
                    </div>
                </div>

                {/* Progress Ring with 3D Rotate */}
                <div className="relative w-24 h-24 perspective-500">
                    <motion.div
                        animate={{ rotateX: 360, rotateY: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-2 border-white/5 border-t-luxury-gold shadow-[0_0_30px_rgba(197,160,89,0.3)]"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-2 border-white/5 border-b-cinematic-neon-blue shadow-[0_0_30px_rgba(0,240,255,0.2)]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center font-mono font-black text-xl text-white">
                        {Math.min(progress, 100)}%
                    </div>
                </div>

                {/* Loading Status Text */}
                <div className="space-y-2 text-center w-full">
                    <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-luxury-gold via-white to-luxury-gold"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-white/40">
                        <span>{isRTL ? "جار التحميل" : "LOADING SYSTEM"}</span>
                        <span>{isRTL ? "يرجى الانتظار" : "ESTABLISHING LINK"}</span>
                    </div>
                </div>

                {/* System Logs */}
                <div className="absolute bottom-12 font-mono text-[9px] text-white/20 text-center tracking-widest uppercase space-y-2">
                    <div className="animate-pulse">Initializing Secure Protocol...</div>
                    <div>Verifying User Credentials...</div>
                    <div className="text-luxury-gold/50">Access Granted</div>
                </div>
            </div>
        </motion.div>
    );
}
