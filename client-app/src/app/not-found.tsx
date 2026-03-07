'use client';

// [[ARABIC_COMMENT]] صفحة الخطأ 404 - تظهر تلقائياً عند أي رابط غير موجود في النظام

import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
            <Navbar />

            {/* [[ARABIC_COMMENT]] خلفية الصفحة - شبكة نيون حمراء */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,59,48,0.08),_transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,59,48,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,59,48,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            {/* [[ARABIC_COMMENT]] المحتوى الرئيسي */}
            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-24">

                {/* [[ARABIC_COMMENT]] رقم 404 الكبير */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mb-8"
                >
                    <span
                        className="text-[clamp(8rem,25vw,16rem)] font-black tracking-tighter select-none"
                        style={{
                            color: 'transparent',
                            WebkitTextStroke: '2px rgba(255,59,48,0.3)',
                            textShadow: '0 0 80px rgba(255,59,48,0.2)',
                        }}
                    >
                        404
                    </span>
                    {/* [[ARABIC_COMMENT]] النص المتوهج فوق الرقم */}
                    <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                        className="absolute inset-0 flex items-center justify-center text-[clamp(8rem,25vw,16rem)] font-black tracking-tighter select-none text-cinematic-neon-red"
                        style={{ filter: 'blur(40px)', opacity: 0.15 }}
                    >
                        404
                    </motion.div>
                </motion.div>

                {/* [[ARABIC_COMMENT]] العنوان والوصف */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="text-center max-w-lg"
                >
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-[1px] w-12 bg-cinematic-neon-red/50" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-red">
                            الصفحة غير موجودة
                        </span>
                        <div className="h-[1px] w-12 bg-cinematic-neon-red/50" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 text-white">
                        لم يتم العثور على الصفحة
                    </h1>
                    <p className="text-white/40 text-sm md:text-base font-medium leading-relaxed mb-10">
                        الرابط الذي طلبته غير موجود أو ربما تم نقله إلى مكان آخر.
                        <br />
                        <span className="text-white/20">The page you requested does not exist.</span>
                    </p>

                    {/* [[ARABIC_COMMENT]] أزرار التنقل */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="px-8 py-4 bg-cinematic-neon-red text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-xl shadow-[0_0_30px_rgba(255,59,48,0.3)] hover:shadow-[0_0_50px_rgba(255,59,48,0.5)] transition-all"
                            >
                                🏠 الصفحة الرئيسية
                            </motion.button>
                        </Link>

                        <Link href="/showroom">
                            <motion.button
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className="px-8 py-4 bg-white/5 border border-white/10 text-white/70 font-black uppercase text-[11px] tracking-[0.3em] rounded-xl hover:bg-white/10 hover:text-white transition-all"
                            >
                                🚗 تصفح السيارات
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>

                {/* [[ARABIC_COMMENT]] رقم الخطأ الصغير في الأسفل */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 text-[10px] font-black uppercase tracking-[0.5em] text-white/10"
                >
                    ERROR CODE 404 · PAGE NOT FOUND · HM CAR
                </motion.div>
            </main>
        </div>
    );
}
