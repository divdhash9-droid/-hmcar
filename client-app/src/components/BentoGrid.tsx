"use client";

/**
 * شبكة التصنيف الجذابة (Bento Grid)
 * تعرض فئات الموقع (قطع غيار، سيارات، عروض، مزادات) بتنسيق هندسي عصري.
 * يتميز بصور خلفية عالية الجودة وتأثيرات حركية عند التمرير (Scroll Reveal).
 */

import { motion } from "framer-motion";
import { Wrench, Car, Tag, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function BentoGrid() {
    const { isRTL } = useLanguage();

    return (
        <section className="py-16 px-4 md:py-24 md:px-6 bg-transparent relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#c9a96e]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-6 text-white tracking-tight">
                        {isRTL ? "استكشف الفئات" : "Explore Categories"}
                    </h2>
                    <p className="text-white/40 max-w-2xl mx-auto text-lg">
                        {isRTL ? "تصفح مجموعتنا الواسعة من السيارات وقطع الغيار والعروض الحصرية" : "Browse our extensive collection of cars, spare parts, and exclusive offers"}
                    </p>
                </motion.div>

                {/* ── شبكة بينتو (Bento Grid) ── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-auto md:h-[600px]">
                    {/* Item 1: Spare Parts (Large - 2x2) */}
                    <motion.div
                        className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black border border-white/10"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity duration-700 md:group-hover:scale-110 md:transition-transform md:duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        <div className="absolute top-8 right-8 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/10 group-hover:bg-[#c9a96e] group-hover:text-black transition-colors duration-300">
                            <ArrowUpRight className="w-6 h-6 text-white group-hover:text-black" />
                        </div>

                        <div className="absolute bottom-0 left-0 p-10 w-full">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-[#c9a96e] flex items-center justify-center">
                                    <Wrench className="w-6 h-6 text-black" />
                                </div>
                                <span className="text-[#c9a96e] text-xs font-bold uppercase tracking-widest">
                                    {isRTL ? "الأكثر طلباً" : "Most Popular"}
                                </span>
                            </div>
                            <h3 className="text-4xl font-black text-white mb-4 group-hover:translate-x-2 transition-transform duration-300">
                                {isRTL ? "قطع الغيار الأصلية" : "Genuine Spare Parts"}
                            </h3>
                            <p className="text-white/60 mb-6 max-w-md line-clamp-2 md:line-clamp-none group-hover:text-white/80 transition-colors">
                                {isRTL
                                    ? "اكتشف آلاف قطع الغيار الأصلية لمحركاتك. جودة مضمونة وشحن مباشر."
                                    : "Discover thousands of genuine parts for your engines. Guaranteed quality and direct shipping."}
                            </p>
                            <Link href="/parts">
                                <button className="px-8 py-3 bg-white/10 hover:bg-[#c9a96e] hover:text-black text-white font-bold rounded-xl backdrop-blur-md border border-white/20 hover:border-[#c9a96e] transition-all duration-300 flex items-center gap-2 group-hover:translate-x-2">
                                    {isRTL ? "تصفح القطع" : "Browse Parts"}
                                    <ArrowRight className="w-4 h-4 group-hover:ml-2 transition-all" />
                                </button>
                            </Link>
                        </div>

                        {/* 3D Effect Placeholder */}
                        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#c9a96e]/20 blur-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
                    </motion.div>

                    {/* Item 2: Cars (Tall - 1x2) */}
                    <motion.div
                        className="md:col-span-1 md:row-span-2 relative group overflow-hidden rounded-[2.5rem] bg-black border border-white/10"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2600&auto=format&fit=crop')] bg-cover bg-center opacity-50 group-hover:opacity-70 transition-opacity duration-700 group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />

                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 text-[#c9a96e]">
                                <Car className="w-5 h-5" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:-translate-y-1 transition-transform">
                                {isRTL ? "سيارات للبيع" : "Cars for Sale"}
                            </h3>
                            <p className="text-white/50 text-sm mb-4 line-clamp-3">
                                {isRTL ? "سيارات فاخرة بأسعار تنافسية." : "Luxury cars at competitive prices."}
                            </p>
                            <Link href="/showroom" className="text-[#c9a96e] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                                {isRTL ? "عرض السيارات" : "View Cars"} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Item 3: Offers (Wide - 1x1) */}
                    <motion.div
                        className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-[#c9a96e] border border-[#c9a96e]"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />

                        <div className="relative p-8 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <Tag className="w-8 h-8 text-black" />
                                <span className="px-3 py-1 bg-black text-[#c9a96e] text-[10px] font-bold uppercase rounded-full">
                                    {isRTL ? "محدود" : "Limited"}
                                </span>
                            </div>

                            <div>
                                <h3 className="text-3xl font-black text-black mb-1">
                                    -20%
                                </h3>
                                <p className="text-black/70 font-bold uppercase text-xs tracking-wider">
                                    {isRTL ? "على أول طلب" : "On First Order"}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* العنصر 4: المزادات الحية (Live Auctions) */}
                    <motion.div
                        className="md:col-span-1 relative group overflow-hidden rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_1px,transparent_1px,transparent_10px)]" />

                        <div className="relative p-8 h-full flex flex-col justify-end">
                            <div className="absolute top-8 right-8">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {isRTL ? "المزادات الحية" : "Live Auctions"}
                            </h3>
                            <Link href="/auctions" className="text-white/50 text-xs font-bold uppercase tracking-widest hover:text-[#c9a96e] transition-colors flex items-center gap-2">
                                {isRTL ? "زايد الآن" : "Bid Now"} <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
