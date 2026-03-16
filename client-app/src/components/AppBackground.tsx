'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * AppBackground - خلفية احترافية خاصة بنمط التطبيق (App Mode)
 * ──────────────────────────────────────────────────
 * تعتمد على تدرجات لونية عميقة (Mesh Gradients) وتأثيرات ضوئية خفيفة
 * بدلاً من الفيديو، لضمان السرعة، توفير البطارية، والمظهر التقني الفخم.
 */
export default function AppBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden">
            {/* 1. تأثير الكربون / النسيج التقني (Subtle Pattern) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            {/* 2. الأضواء الغامضة (Ambient Glows) */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-cinematic-neon-blue/20 blur-[120px]"
            />

            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.05, 0.1, 0.05],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[40%] -right-[15%] w-[60%] h-[60%] rounded-full bg-accent-gold/10 blur-[100px]"
            />

            <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-cinematic-neon-red/5 blur-[150px]" />

            {/* 3. تأثير الضوضاء البصري (Digital Grain) */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* 4. تدرج السطح لتركيز الانتباه على المحتوى الوسطي */}
            <div className="absolute inset-0 bg-radial-at-t from-transparent via-black/20 to-black/80" />
        </div>
    );
}
