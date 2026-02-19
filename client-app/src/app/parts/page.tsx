'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ArrowUpRight, Cpu, Database, Box } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function PartsPage() {
    const { t, isRTL } = useLanguage();
    const [filter, setFilter] = useState('ALL');
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [brandFilter, setBrandFilter] = useState<string>('ALL');

    useEffect(() => {
        const loadParts = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 600));
                const mockParts = [
                    { id: '1', name: 'CERAMIC BRAKE KIT', brand: 'BREMBO', price: 15000, img: 'https://images.unsplash.com/photo-1624552467554-ce1aa68cb952?q=80&w=1000', condition: 'NEW' },
                    { id: '2', name: 'CARBON FIBER HOOD', brand: 'MANSORY', price: 45000, img: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1000', condition: 'USED' },
                    { id: '3', name: 'TITANIUM EXHAUST', brand: 'AKRAPOVIC', price: 28000, img: 'https://images.unsplash.com/photo-1605634584281-d1f8f9d0c9f1?q=80&w=1000', condition: 'NEW' },
                    { id: '4', name: 'ECU TUNING MODULE', brand: 'NOVITEC', price: 12000, img: 'https://images.unsplash.com/photo-1635771382436-1e68710317e0?q=80&w=1000', condition: 'NEW' },
                ];
                const data = await api.parts.list({
                    category: filter === 'ALL' ? undefined : filter,
                    limit: 12
                }).catch(() => ({ parts: mockParts }));
                setParts(data.parts && data.parts.length > 0 ? data.parts : mockParts);
            } catch (err) {
                console.error("Failed to load parts", err);
            } finally {
                setLoading(false);
            }
        };
        loadParts();
    }, [filter]);
    useEffect(() => {
        try { const raw = localStorage.getItem('hm_brands'); if (raw) setBrands(JSON.parse(raw)); } catch {}
    }, []);

    const filters = [
        { key: 'ALL', label: isRTL ? 'الكل' : 'ALL' },
        { key: 'ENGINE', label: isRTL ? 'محرك' : 'ENGINE' },
        { key: 'BODY', label: isRTL ? 'هيكل' : 'BODY' },
        { key: 'INTERIOR', label: isRTL ? 'داخلي' : 'INTERIOR' },
        { key: 'WHEELS', label: isRTL ? 'عجلات' : 'WHEELS' },
    ];

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-[1600px] mx-auto">
                <ClientPageHeader
                    title={isRTL ? "قطع الغيار" : "SPARE PARTS"}
                    subtitle={isRTL ? "سجل المكونات" : "COMPONENT REGISTRY"}
                    icon={Cpu}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[45vh] md:h-[50vh] overflow-hidden mt-8 mx-6 rounded-3xl border border-white/5">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.25) contrast(1.3) saturate(0.9)' }}
                >
                    <source src="/videos/video_2026-02-07_22-25-04.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                <div className="video-grain" />

                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-[1600px] mx-auto w-full px-6 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-accent-gold/60 block mb-3">
                                {isRTL ? "سجل المكونات" : "COMPONENT REGISTRY"}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase">
                                {isRTL ? "قطع الغيار" : "SPARE PARTS"}
                            </h1>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-8" />
                <div className="orb orb-gold w-[500px] h-[500px] top-0 right-0 animate-breathe opacity-20" />
            </div>

            <main className="relative z-10 pt-12 pb-32 px-6 max-w-[1600px] mx-auto">

                {/* ── FILTERS ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-2.5 mb-16 p-1.5 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-xl w-fit"
                >
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                "px-5 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-400",
                                filter === f.key
                                    ? "bg-accent-gold text-black shadow-[0_0_15px_var(--accent-gold-glow)]"
                                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.03]"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-10">
                    <button onClick={() => setBrandFilter('ALL')} className={cn("p-4 rounded-xl border text-center", brandFilter === 'ALL' ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white")}>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em]">{isRTL ? 'كل الماركات' : 'All Brands'}</div>
                    </button>
                    {brands.filter((b:any)=> b.category === 'parts' || b.category === 'both').map((b:any) => (
                        <Link key={b.id} href={`/brands/${(b.key || b.name || '').toLowerCase()}`}>
                            <div className={cn("p-4 rounded-xl border text-center group cursor-pointer", brandFilter === b.name ? "bg-white text-black border-white" : "bg-white/[0.03] border-white/10 text-white/60 hover:text-white")}>
                                <div className="w-12 h-12 mx-auto rounded-lg bg-white/5 border border-white/10 overflow-hidden mb-2">
                                    {b.logo ? <img src={b.logo} alt={b.name} className="w-full h-full object-cover" /> : <span className="text-xs">{b.name[0]}</span>}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em]">{b.name}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* ── PARTS GRID ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-[380px] rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {(brandFilter === 'ALL' ? parts : parts.filter((p:any) => String(p.brand || '').toLowerCase().includes(String(brandFilter).toLowerCase()))).map((part, i) => (
                                <motion.div
                                    key={part.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <div className="group obsidian-card obsidian-card-hover p-6 h-full">
                                        {/* Image */}
                                        <div className="aspect-square bg-black/40 rounded-xl overflow-hidden mb-6 border border-white/5 relative group-hover:border-accent-gold/20 transition-colors">
                                            <img
                                                src={part.img}
                                                alt={part.name}
                                                className="w-full h-full object-contain p-6 grayscale-[40%] opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                                            />
                                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5">
                                                <span className="text-[7px] font-bold uppercase tracking-widest text-white/50">{part.condition}</span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5 opacity-50">
                                                    <Cpu className="w-2.5 h-2.5 text-accent-gold" />
                                                    <span className="text-[8px] font-bold text-accent-gold tracking-[0.2em] uppercase">{part.brand}</span>
                                                </div>
                                                <h3 className="text-base font-black tracking-tight uppercase leading-snug group-hover:text-accent-gold transition-colors line-clamp-2 min-h-[2.5rem]">
                                                    {part.name}
                                                </h3>
                                            </div>

                                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                <span className="text-lg font-black gradient-text-gold">
                                                    {Number(part.price).toLocaleString()}
                                                    <span className="text-[9px] text-white/20 ml-1 font-normal">SAR</span>
                                                </span>
                                                <Link href={`/parts/${part.id}`}>
                                                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-accent-gold hover:text-black hover:border-accent-gold transition-all group/btn">
                                                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* ── CTA BANNER ── */}
                <div className="mt-24">
                    <div className="obsidian-card p-10 md:p-16 relative overflow-hidden">
                        {/* Accent glow */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] orb orb-gold opacity-20" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            <div className="space-y-4 text-center lg:text-start">
                                <h2 className="text-3xl font-black uppercase tracking-tight">
                                    {isRTL ? "قطعة مفقودة؟" : "MISSING A "}
                                    <span className="gradient-text-gold">{isRTL ? "" : "PART?"}</span>
                                </h2>
                                <p className="text-sm text-white/35 max-w-lg leading-relaxed">
                                    {isRTL
                                        ? "قاعدة بياناتنا واسعة، لكن بعض القطع نادرة. أرسل طلب بحث مخصص للمكونات الخاصة."
                                        : "Our database is vast, but some components are rare. Submit a custom search request for specific engineering parts."
                                    }
                                </p>
                            </div>
                            <Link href="/concierge">
                                <button className="btn-gold px-10 py-5 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px]">
                                    {isRTL ? "إرسال طلب" : "SUBMIT REQUEST"}
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
