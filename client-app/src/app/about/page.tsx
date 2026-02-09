'use client';

import { motion } from "framer-motion";
import { ShieldCheck, Target, Award, Users, MapPin, Globe, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function About() {
    const { t, isRTL } = useLanguage();

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* --- HERO BACKGROUND --- */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40" />
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-20" />
            </div>

            <main className="relative z-10 pt-48 pb-32 px-6 max-w-7xl mx-auto space-y-32">

                {/* Intro Section */}
                <section className="text-center space-y-10 max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/10"
                    >
                        <Globe className="w-4 h-4 text-cinematic-neon-blue" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em]">{isRTL ? "من نحن" : "GLOBAL LEGACY"}</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8]"
                    >
                        {t('aboutTitle')}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm md:text-lg text-white/40 uppercase tracking-[0.2em] font-medium leading-relaxed max-w-2xl mx-auto"
                    >
                        {t('aboutSubtitle')}
                    </motion.p>
                </section>

                {/* Stats / Numbers Grid */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    {[
                        { val: "2024", label: isRTL ? "سنة التأسيس" : "ESTABLISHED" },
                        { val: "+500", label: isRTL ? "سيارة حصرية" : "ELITE ASSETS" },
                        { val: "12K", label: isRTL ? "عضو فائق" : "GLOBAL MEMBERS" },
                        { val: "99.9%", label: isRTL ? "رضا العملاء" : "TRUST SCORE" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="text-center space-y-2 group"
                        >
                            <div className="text-4xl md:text-6xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 group-hover:to-cinematic-neon-blue transition-all duration-700">{stat.val}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{stat.label}</div>
                        </motion.div>
                    ))}
                </section>

                {/* Story Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                                <Target className="w-8 h-8 text-cinematic-neon-red" />
                                {isRTL ? "مهمتنا الاستراتيجية" : "OUR STRATEGIC MISSION"}
                            </h2>
                            <p className="text-base text-white/60 leading-relaxed font-bold tracking-wide uppercase italic">
                                {isRTL ? "نحن لا نبيع السيارات فحسب، بل نبني جسوراً من الثقة لمحبي النوادر والمقتنين حول العالم. تهدف إتش إم كار إلى أن تكون المنصة الأولى عالمياً في قطاع المزادات الفاخرة." : "Beyond distribution, we architect trust. HM CAR aims to dominate the global luxury automotive sector by merging transparency with cinematic acquisition experiences."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4 p-8 bg-white/5 border-l-2 border-cinematic-neon-blue rounded-r-3xl">
                                <ShieldCheck className="w-6 h-6 text-cinematic-neon-blue" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest">{isRTL ? "أمان مطلق" : "ABSOLUTE SECURITY"}</h3>
                                <p className="text-[9px] text-white/30 uppercase leading-relaxed">{isRTL ? "نظام تشفير مالي معتمد دولياً لهويتك ومعاملاتك." : "Tier-4 encryption for every transaction and identity sync."}</p>
                            </div>
                            <div className="space-y-4 p-8 bg-white/5 border-l-2 border-cinematic-neon-red rounded-r-3xl">
                                <Award className="w-6 h-6 text-cinematic-neon-red" />
                                <h3 className="text-[11px] font-black uppercase tracking-widest">{isRTL ? "جودة مضمونة" : "VERIFIED EXCELLENCE"}</h3>
                                <p className="text-[9px] text-white/30 uppercase leading-relaxed">{isRTL ? "فحص دقيق بـ 300 نقطة لكل قطعة أو سيارة." : "300-point rigorous audit on all assets before listing."}</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-square rounded-[4rem] overflow-hidden group">
                        <img
                            src="https://images.unsplash.com/photo-1542362567-b05500269774?q=80&w=1000&auto=format&fit=crop"
                            className="w-full h-full object-cover grayscale-[50%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        <div className="absolute bottom-12 left-12 right-12 p-8 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl">
                            <div className="text-[10px] font-black text-cinematic-neon-blue uppercase tracking-[0.5em] mb-4">Central Headquarters</div>
                            <div className="text-xl font-black italic uppercase tracking-tighter">Riyadh, Saudi Arabia</div>
                        </div>
                    </div>
                </section>

                {/* Location / Contact HUD */}
                <section className="glass-card p-12 md:p-20 bg-white/[0.01] border-white/5 relative overflow-hidden text-center space-y-12">
                    <MapPin className="w-16 h-16 text-cinematic-neon-blue mx-auto animate-pulse" />
                    <div className="space-y-6">
                        <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter underline decoration-cinematic-neon-blue/20 underline-offset-16">{isRTL ? "تواصل مع المركز الرئيسي" : "SYNC WITH HQ"}</h2>
                        <p className="text-[11px] text-white/30 uppercase tracking-[0.5em] font-black">{isRTL ? "نحن متاحون 24/7 لخدمة النخبة" : "24/7 ELITE LIAISON RESPONSE"}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                        <button className="px-12 py-5 bg-white text-black font-black uppercase text-[10px] tracking-[0.5em] rounded-2xl hover:bg-cinematic-neon-blue hover:text-white transition-all shadow-2xl">
                            {isRTL ? "إرسال رسالة مشفرة" : "SEND ENCRYPTED LOG"}
                        </button>
                        <button className="px-12 py-5 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.5em] rounded-2xl hover:bg-white/10 transition-all">
                            {isRTL ? "عرض الخريطة الرقمية" : "OPEN DIGITAL MAP"}
                        </button>
                    </div>
                </section>
            </main>

            {/* --- FOOTER HUD --- */}
            <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 opacity-20 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.6em] italic">
                <div>© 2026 HM CAR GLOBAL NETWORK</div>
                <div className="flex gap-8">
                    <span>Identity Verified</span>
                    <span>Riyadh District 01</span>
                </div>
            </footer>
        </div>
    );
}
