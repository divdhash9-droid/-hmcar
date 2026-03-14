'use client';

import { motion } from "framer-motion";
import { ShieldCheck, Target, Award, Users, MapPin, Globe, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function About() {
    const { t, isRTL } = useLanguage();

    const stats = [
        { val: "2024", label: isRTL ? "سنة التأسيس" : "ESTABLISHED" },
        { val: "+500", label: isRTL ? "سيارة حصرية" : "ELITE ASSETS" },
        { val: "12K", label: isRTL ? "عضو فائق" : "GLOBAL MEMBERS" },
        { val: "99.9%", label: isRTL ? "رضا العملاء" : "TRUST SCORE" },
    ];

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <ClientPageHeader
                    title={isRTL ? "من نحن" : "ABOUT US"}
                    subtitle={isRTL ? "قصتنا ورؤيتنا" : "OUR STORY & VISION"}
                    icon={Globe}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[55vh] md:h-[65vh] overflow-hidden mt-8 mx-6 rounded-3xl border border-white/5">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.3) contrast(1.2) saturate(1.1)' }}
                >
                    <source src="/videos/video_2026-02-07_21-07-18.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
                <div className="video-grain" />

                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-7xl mx-auto w-full px-6 pb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <h1 className="text-5xl md:text-8xl font-black tracking-[-0.05em] uppercase leading-[0.85]">
                                {isRTL ? "اتش ام" : "HM"}<br />
                                <span className="font-display italic gradient-text-gold">{isRTL ? "كار" : "CAR"}</span>
                            </h1>
                            <p className="text-sm text-white/35 max-w-lg leading-relaxed mt-4">
                                {isRTL
                                    ? "المنصة الأولى عالمياً في تصدير السيارات الفاخرة وقطع الغيار الأصلية من كوريا الجنوبية"
                                    : "The world's premier platform for luxury vehicle exports and genuine parts sourcing from South Korea"}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-8" />
                <div className="orb orb-gold w-[600px] h-[600px] top-0 right-0 animate-breathe opacity-15" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-6 space-y-32 pb-32">

                {/* ── STATS ── */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-10 py-16 border-b border-white/5">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center space-y-2"
                        >
                            <div className="text-4xl md:text-6xl font-black tracking-[-0.04em] gradient-text-platinum">{stat.val}</div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">{stat.label}</div>
                        </motion.div>
                    ))}
                </section>

                {/* ── MISSION ── */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-10"
                    >
                        <div className="space-y-5">
                            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/20">
                                {isRTL ? "المهمة" : "OUR MISSION"}
                            </span>
                            <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] uppercase leading-tight">
                                {isRTL ? "بناء جسور الثقة" : "BUILDING BRIDGES OF TRUST"}
                            </h2>
                            <p className="text-sm text-white/40 leading-relaxed">
                                {isRTL
                                    ? "نحن لا نبيع السيارات فحسب، بل نبني جسوراً من الثقة لمحبي النوادر والمقتنين حول العالم. تهدف إتش إم كار إلى أن تكون المنصة الأولى عالمياً في قطاع المزادات الفاخرة."
                                    : "Beyond distribution, we architect trust. HM CAR aims to dominate the global luxury automotive sector by merging transparency with premium acquisition experiences."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="glass-card p-6 space-y-4 hover:border-accent-gold/15 transition-all">
                                <ShieldCheck className="w-5 h-5 text-accent-gold" />
                                <h3 className="text-sm font-black uppercase tracking-tight">{isRTL ? "أمان مطلق" : "ABSOLUTE SECURITY"}</h3>
                                <p className="text-[10px] text-white/30 leading-relaxed">{isRTL ? "نظام تشفير معتمد دولياً لمعاملاتك" : "Internationally certified encryption for all transactions"}</p>
                            </div>
                            <div className="glass-card p-6 space-y-4 hover:border-accent-gold/15 transition-all">
                                <Award className="w-5 h-5 text-accent-emerald" />
                                <h3 className="text-sm font-black uppercase tracking-tight">{isRTL ? "جودة مضمونة" : "VERIFIED EXCELLENCE"}</h3>
                                <p className="text-[10px] text-white/30 leading-relaxed">{isRTL ? "فحص دقيق لكل قطعة وسيارة" : "Rigorous audits on all assets before listing"}</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative aspect-square rounded-3xl overflow-hidden group"
                    >
                        <img
                            src="https://images.unsplash.com/photo-1542362567-b05500269774?q=80&w=1000&auto=format&fit=crop"
                            className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000"
                            alt="About HM CAR"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-8 left-8 right-8 glass-card p-6">
                            <div className="text-[9px] font-bold text-accent-gold uppercase tracking-[0.5em] mb-2">
                                {isRTL ? "المقر الرئيسي" : "HEADQUARTERS"}
                            </div>
                            <div className="text-xl font-black tracking-tight">{isRTL ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}</div>
                        </div>
                    </motion.div>
                </section>

                {/* ── CTA ── */}
                <section className="obsidian-card p-12 md:p-20 text-center space-y-10 relative overflow-hidden">
                    <div className="orb orb-gold w-[400px] h-[400px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                    <div className="relative z-10 space-y-10">
                        <MapPin className="w-10 h-10 text-accent-gold mx-auto opacity-40" />
                        <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] uppercase">
                            {isRTL ? "تواصل معنا" : "GET IN TOUCH"}
                        </h2>
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-bold">
                            {isRTL ? "نحن متاحون 24/7 لخدمتك" : "AVAILABLE 24/7 FOR ELITE CLIENTS"}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
                            <a href="/contact">
                                <button className="btn-luxury px-12 py-5 rounded-xl">
                                    {isRTL ? "إرسال رسالة" : "SEND MESSAGE"}
                                </button>
                            </a>
                            <a href="/concierge">
                                <button className="btn-luxury-outline px-12 py-5 rounded-xl">
                                    {isRTL ? "طلب خاص" : "CONCIERGE REQUEST"}
                                </button>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto px-6 py-16 border-t border-white/5 flex justify-between items-center text-[8px] font-bold uppercase tracking-[0.4em] text-white/10 hide-in-app">
                <span>© 2026 HM CAR</span>
                <span>Riyadh, Saudi Arabia</span>
            </footer>
        </div>
    );
}
