'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import { Send, Car, Settings, CheckCircle, Shield, Briefcase, User, Phone, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function ConciergePage() {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<'car' | 'parts'>('car');
    const [formData, setFormData] = useState({
        name: '', phone: '', details: '', budget: '', brand: '', model: '', year: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = `New Request (${activeTab}):\nName: ${formData.name}\nPhone: ${formData.phone}\nDetails: ${formData.details}\nBudget: ${formData.budget}`;
        window.open(`https://wa.me/966500000000?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <ClientPageHeader
                    title={isRTL ? "خدمة الكونسيرج" : "CONCIERGE SERVICE"}
                    subtitle={isRTL ? "خدمة النخبة" : "ELITE SERVICE"}
                    icon={Briefcase}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[40vh] md:h-[45vh] overflow-hidden mt-8 rounded-3xl mx-6 border border-white/5">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.3) contrast(1.2) saturate(1.1)' }}
                >
                    <source src="/videos/hero.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                <div className="video-grain" />

                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-7xl mx-auto w-full px-6 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8"
                        >
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-accent-gold/60 block mb-3">
                                    {isRTL ? "خدمة النخبة" : "ELITE SERVICE"}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase">
                                    {isRTL ? "الكونسيرج" : "CONCIERGE"}
                                </h1>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-8" />
                <div className="orb orb-gold w-[500px] h-[500px] top-[-200px] right-[-100px] animate-breathe opacity-20" />
                <div className="orb orb-blue w-[400px] h-[400px] bottom-[-100px] left-[-100px] animate-breathe delay-1000 opacity-15" />
            </div>

            <main className="relative z-10 pt-12 pb-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* ── INFO PANEL ── */}
                    <div className="lg:col-span-5 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="glass-card p-8 space-y-6">
                                <h3 className="text-2xl font-black tracking-tight">
                                    {isRTL ? "اصنع إرثك." : "Create Your Legacy."}
                                </h3>
                                <p className="text-sm text-white/45 leading-relaxed">
                                    {isRTL
                                        ? "سواء كنت تبحث عن سيارة أحلامك النادرة أو قطع غيار حصرية، فريقنا المتخصص سيتولى المهمة بدقة واحترافية."
                                        : "Whether sourcing a rare hypercar or exclusive components, our specialized team executes with precision and discretion."}
                                </p>
                                <div className="space-y-4 pt-4">
                                    {[
                                        { icon: Car, title: isRTL ? 'توريد السيارات' : 'Vehicle Sourcing', desc: isRTL ? 'شبكة عالمية' : 'Global network access' },
                                        { icon: Settings, title: isRTL ? 'قطع الغيار' : 'Parts Acquisition', desc: isRTL ? 'أصلية ومعدّلة' : 'OEM & Aftermarket elite' },
                                        { icon: Shield, title: isRTL ? 'فحص معتمد' : 'Verified Inspection', desc: isRTL ? 'فحص شامل' : 'Comprehensive checks' },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5 hover:border-accent-gold/15 transition-all">
                                            <div className="w-10 h-10 bg-accent-gold/10 rounded-lg flex items-center justify-center text-accent-gold shrink-0 border border-accent-gold/10">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-tight">{item.title}</h4>
                                                <p className="text-[10px] text-white/35 uppercase tracking-wider">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── FORM PANEL ── */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="obsidian-card p-8 md:p-10">
                                {/* Tabs */}
                                <div className="flex mb-10 p-1.5 bg-white/[0.03] rounded-xl border border-white/5 w-fit">
                                    {[
                                        { id: 'car', icon: Car, label: isRTL ? 'طلب سيارة' : 'VEHICLE' },
                                        { id: 'parts', icon: Settings, label: isRTL ? 'قطع غيار' : 'PARTS' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={cn(
                                                "flex items-center gap-2.5 px-7 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
                                                activeTab === tab.id
                                                    ? "bg-accent-gold text-black shadow-[0_0_15px_var(--accent-gold-glow)]"
                                                    : "text-white/30 hover:text-white/50"
                                            )}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-1">
                                                {isRTL ? "الاسم الكامل" : "FULL NAME"}
                                            </label>
                                            <div className="relative group">
                                                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/30 transition-colors", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    type="text" required
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className={cn("glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                    placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-1">
                                                {isRTL ? "الهاتف" : "PHONE"}
                                            </label>
                                            <div className="relative group">
                                                <Phone className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/30 transition-colors", isRTL ? "right-4" : "left-4")} />
                                                <input
                                                    type="tel" required
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className={cn("glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                    placeholder="+966 ..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-1">
                                                {isRTL ? "الماركة" : "BRAND / MAKE"}
                                            </label>
                                            <input
                                                type="text"
                                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                                className="glass-input"
                                                placeholder={isRTL ? "مثال: مرسيدس" : "e.g. MERCEDES"}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-1">
                                                {isRTL ? "الموديل / السنة" : "MODEL / YEAR"}
                                            </label>
                                            <input
                                                type="text"
                                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                                                className="glass-input"
                                                placeholder={isRTL ? "مثال: S-CLASS 2024" : "e.g. S-CLASS 2024"}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/25 px-1">
                                            {isRTL ? "تفاصيل إضافية" : "SPECIFICATIONS"}
                                        </label>
                                        <div className="relative group">
                                            <FileText className={cn("absolute top-5 w-4 h-4 text-white/10 group-focus-within:text-white/30 transition-colors", isRTL ? "right-4" : "left-4")} />
                                            <textarea
                                                rows={4}
                                                onChange={e => setFormData({ ...formData, details: e.target.value })}
                                                className={cn("glass-input resize-none", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                                placeholder={isRTL ? 'صف المواصفات المطلوبة...' : 'Describe specific features, colors, part numbers...'}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full btn-luxury py-5 rounded-xl group mt-4"
                                    >
                                        <span>{isRTL ? 'إرسال الطلب' : 'SUBMIT REQUEST'}</span>
                                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
