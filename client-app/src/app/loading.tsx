'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * صفحة التحميل الرئيسية (Root Loading)
 * تظهر أثناء انتقال الصفحات أو جلب البيانات الأولية من السيرفر.
 * مصممة بهوية HM CAR النخبوية.
 */
export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[1000] bg-[#050505] flex flex-col items-center justify-center p-6">
      <div className="relative">
        {/* Glow Effect */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-accent-gold/20 blur-[100px] rounded-full"
        />

        {/* Logo Text Loader */}
        <div className="relative z-10 text-center">
            <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-black italic tracking-tighter text-white mb-2"
            >
                HM <span className="text-accent-gold">CAR</span>
            </motion.h1>
            
            <div className="w-48 h-[1px] bg-white/10 mx-auto relative overflow-hidden">
                <motion.div 
                    animate={{ x: [-200, 200] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-24 bg-accent-gold shadow-[0_0_10px_#c9a96e]"
                />
            </div>
            
            <motion.p 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-white/30"
            >
                Loading Excellence
            </motion.p>
        </div>
      </div>
    </div>
  );
}
