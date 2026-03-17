'use client';

import React from 'react';

/**
 * AppBackground - خلفية احترافية خاصة بنمط التطبيق (App Mode)
 * ──────────────────────────────────────────────────
 * تعتمد على تدرجات لونية عميقة (Mesh Gradients) وتأثيرات ضوئية خفيفة
 * بدلاً من الفيديو، لضمان السرعة، توفير البطارية، والمظهر التقني الفخم.
 */
export default function AppBackground() {
    return (
        <div className="fixed inset-0 -z-10 bg-[#050505] overflow-hidden">
            {/* 1. التدرج اللوني الثابت (Mesh Gradient) - يعطي مظهراً فخماً بأقل استهلاك للموارد */}
            <div className="absolute inset-0 opacity-[0.4]" 
                style={{
                    background: `
                        radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 80% 40%, rgba(201, 169, 110, 0.05) 0%, transparent 40%),
                        radial-gradient(circle at 40% 80%, rgba(255, 59, 48, 0.02) 0%, transparent 40%)
                    `
                }}
            />

            {/* 2. طبقة الملمس (Texture Layer) - نمط ألياف الكربون (Carbon Fibre) للمظهر التقني الرياضي */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            
            {/* 3. تدرج السطح الشعاعي - لتركيز الضوء في المنتصف وتحسين تجربة القراءة */}
            <div className="absolute inset-0 bg-radial-at-t from-transparent via-black/20 to-black/95" />
        </div>
    );
}
