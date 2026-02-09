'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingCart, Search, Filter, Wrench, ArrowRight, Gauge, Cpu, Box, Database, Sparkles } from "lucide-react";
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

    useEffect(() => {
        const loadParts = async () => {
            try {
                // Mock delay
                await new Promise(resolve => setTimeout(resolve, 800));

                // Mock Data for now as backend might be limited
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

    return (
        <div className="relative min-h-screen bg-[#020202] text-white selection:bg-cinematic-neon-yellow selection:text-black perspective-1000 overflow-x-hidden">
            <Navbar />

            {/* Cinematic Background Atmosphere */}
            <div className="bg-grid-overlay opacity-20 fixed inset-0 z-0" />
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cinematic-neon-yellow/5 blur-[150px] rounded-full animate-float-slow opacity-40" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cinematic-neon-blue/5 blur-[120px] rounded-full opacity-30" />
                <div className="absolute inset-0 scan-lines opacity-10" />
            </div>

            <main className="relative z-10 pt-40 pb-32 px-6 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-24">
                    <div className="w-full lg:w-auto">
                        <ClientPageHeader
                            title={isRTL ? "قطع الغيار" : "SPARE LOGS"}
                            subtitle={isRTL ? "سجل المكونات النادرة" : "RARE COMPONENT REGISTRY"}
                            icon={Database}
                        />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex flex-wrap gap-3 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl">
                        {['ALL', 'ENGINE', 'BODY', 'INTERIOR', 'WHEELS'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 relative overflow-hidden group",
                                    filter === f
                                        ? "bg-cinematic-neon-yellow text-black shadow-[0_0_20px_rgba(252,238,10,0.4)]"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span className="relative z-10">{f}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Parts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-[400px] rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        <AnimatePresence mode="popLayout">
                            {parts.map((part, i) => (
                                <motion.div
                                    key={part.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group obsidian-card obsidian-card-hover p-8 relative overflow-hidden"
                                >
                                    {/* Holographic Background Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cinematic-neon-yellow/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                    <div className="relative z-10">
                                        {/* Image Container */}
                                        <div className="aspect-square bg-black/40 rounded-[2rem] overflow-hidden mb-8 border border-white/5 relative group-hover:border-cinematic-neon-yellow/30 transition-colors">
                                            <img src={part.img} alt={part.name} className="w-full h-full object-contain p-8 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />

                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{part.condition}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 opacity-50">
                                                    <Cpu className="w-3 h-3 text-cinematic-neon-yellow" />
                                                    <span className="text-[8px] font-black text-cinematic-neon-yellow tracking-[0.3em] uppercase">{part.brand}</span>
                                                </div>
                                                <h3 className="text-xl font-black tracking-tighter uppercase italic leading-[1.1] text-white group-hover:text-cinematic-neon-yellow transition-colors line-clamp-2 h-[2.75rem]">{part.name}</h3>
                                            </div>

                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                <div>
                                                    <div className="text-xl font-black italic gold-glow">{Number(part.price).toLocaleString()} <span className="text-[10px] tracking-normal opacity-40 not-italic font-bold">SAR</span></div>
                                                </div>
                                                <Link href={`/parts/${part.id}`}>
                                                    <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-cinematic-neon-yellow hover:text-black flex items-center justify-center transition-all group/btn">
                                                        <ArrowRight className="w-4 h-4 group-hover/btn:-rotate-45 transition-transform" />
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Secure Request CTA */}
                <div className="mt-32">
                    <div className="obsidian-card p-12 md:p-20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-cinematic-neon-yellow/10 via-transparent to-transparent opacity-20" />
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                            <div className="space-y-6 text-center lg:text-left">
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">MISSING <span className="text-cinematic-neon-yellow">COMPONENT?</span></h2>
                                <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold max-w-xl leading-loose">
                                    Our global database is vast, but some artifacts are hidden. Initiate a priority search request for specific engineering components.
                                </p>
                            </div>
                            <Link href="/concierge">
                                <button className="px-12 py-6 bg-cinematic-neon-yellow text-black rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-white transition-colors shadow-[0_0_30px_rgba(252,238,10,0.3)]">
                                    Initiate Request
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
