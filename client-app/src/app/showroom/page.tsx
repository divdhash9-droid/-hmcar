'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShoppingCart, Heart, Search, Filter, Car, ArrowRight, Gauge, Fuel, Zap, Globe, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function Showroom() {
    const { t, isRTL } = useLanguage();
    const [filter, setFilter] = useState('ALL');
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCars = async () => {
            try {
                // Mock delay for effect
                await new Promise(resolve => setTimeout(resolve, 800));
                const data = await api.cars.list({
                    category: filter === 'ALL' ? '' : filter,
                    limit: 12
                });
                setCars(data.cars || []);
            } catch (err) {
                console.error("Failed to load cars", err);
            } finally {
                setLoading(false);
            }
        };
        loadCars();
    }, [filter]);

    return (
        <div className="relative min-h-screen bg-[#020202] text-white selection:bg-luxury-gold selection:text-black perspective-1000 overflow-x-hidden">
            <Navbar />

            {/* Cinematic Background Atmos */}
            <div className="bg-grid-overlay opacity-20 fixed inset-0 z-0" />
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-luxury-gold/5 blur-[150px] rounded-full animate-float-slow opacity-40" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cinematic-neon-blue/5 blur-[120px] rounded-full opacity-30" />
                <div className="absolute inset-0 scan-lines opacity-10" />
            </div>

            <main className="relative z-10 pt-40 pb-32 px-6 max-w-[1920px] mx-auto">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-end gap-12 mb-24">
                    <div className="w-full lg:w-auto">
                        <ClientPageHeader
                            title={isRTL ? "المعرض" : "THE SHOWROOM"}
                            subtitle={isRTL ? "مخزون النخبة" : "ELITE INVENTORY"}
                            icon={Car}
                        />
                    </div>

                    {/* Neon Filters */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-wrap gap-4 p-2 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-xl shadow-2xl relative"
                    >
                        <div className="absolute inset-0 bg-white/5 rounded-2xl blur-lg -z-10" />
                        {['ALL', 'SPORT', 'LUXURY', 'SUV'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden group",
                                    filter === f
                                        ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105"
                                        : "text-white/40 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <span className="relative z-10">{f}</span>
                                {filter === f && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 animate-shimmer" />}
                            </button>
                        ))}
                    </motion.div>
                </div>

                {/* Car Grid Container */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-[500px] rounded-[2.5rem] bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 perspective-1000">
                        <AnimatePresence mode="popLayout">
                            {cars.map((car, i) => (
                                <motion.div
                                    key={car.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, rotateX: 5 }}
                                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05, duration: 0.5 }}
                                    className="group obsidian-card obsidian-card-hover relative h-full flex flex-col"
                                >
                                    {/* Media Card Segment */}
                                    <div className="relative h-72 rounded-t-[2.5rem] overflow-hidden transform-style-3d bg-black">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10" />
                                        <img
                                            src={car.images?.[0] || car.previewImage || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1000&auto=format&fit=crop'}
                                            alt={car.title}
                                            className="w-full h-full object-cover transition-all duration-[1s] group-hover:scale-110 grayscale group-hover:grayscale-0 relative z-0"
                                        />

                                        {/* Holographic Overlay on Hover */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 holographic mix-blend-overlay pointer-events-none z-20" />

                                        <div className="absolute top-6 right-6 z-30">
                                            <button className="w-10 h-10 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-white hover:bg-red-500 hover:border-red-500 transition-all duration-300 group/heart shadow-lg">
                                                <Heart className="w-4 h-4 group-hover/heart:fill-current transition-all" />
                                            </button>
                                        </div>

                                        <div className="absolute bottom-4 left-6 z-30 flex items-center gap-3 px-3 py-1.5 bg-black/60 border border-white/10 rounded-full backdrop-blur-xl">
                                            <Sparkles className="w-3 h-3 text-luxury-gold animate-pulse" />
                                            <span className="text-[8px] font-black text-white/80 tracking-widest uppercase">{car.category?.name || 'STOCK'}</span>
                                        </div>
                                    </div>

                                    {/* Details Segment */}
                                    <div className="p-8 flex-1 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#0a0a0a] to-[#111] relative z-20 border-t border-white/5">

                                        <div className="space-y-2 transform translate-z-10">
                                            <div className="flex items-center gap-2 mb-2 opacity-50">
                                                <div className="w-1 h-1 bg-luxury-gold rounded-full" />
                                                <span className="text-[8px] font-black text-luxury-gold tracking-[0.3em] uppercase italic">{car.make?.name || car.make}</span>
                                            </div>
                                            <h3 className="text-2xl font-black tracking-tighter uppercase italic leading-[1] text-white group-hover:text-luxury-gold transition-colors line-clamp-2 min-h-[3rem]">{car.title}</h3>
                                        </div>

                                        {/* Tech Stats HUD */}
                                        <div className="grid grid-cols-3 gap-0 py-3 border-y border-white/5 bg-white/[0.02] rounded-xl my-4">
                                            <div className="flex flex-col items-center gap-1 border-r border-white/5 py-1">
                                                <div className="text-[7px] font-black uppercase text-white/20 tracking-tighter mb-1">Year</div>
                                                <span className="text-[9px] font-black uppercase text-white/60">{car.year || '2024'}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 border-r border-white/5 py-1">
                                                <div className="text-[7px] font-black uppercase text-white/20 tracking-tighter mb-1">Fuel</div>
                                                <span className="text-[9px] font-black uppercase text-white/60 truncate max-w-[50px]">{car.fuelType || 'Petrol'}</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 py-1">
                                                <div className="text-[7px] font-black uppercase text-white/20 tracking-tighter mb-1">TRANS</div>
                                                <span className="text-[9px] font-black uppercase text-white/60 truncate max-w-[50px]">{car.transmission || 'Auto'}</span>
                                            </div>
                                        </div>

                                        {/* Action Segment */}
                                        <div className="flex items-end justify-between gap-4 mt-auto pt-2">
                                            <div>
                                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block mb-1">{isRTL ? 'القيمة الحالية' : 'Current Value'}</span>
                                                <div className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 group-hover:from-luxury-gold group-hover:to-yellow-200 transition-all">{Number(car.price || 0).toLocaleString()} <span className="text-[10px] font-bold tracking-normal text-white/20 ml-1 not-italic">SAR</span></div>
                                            </div>
                                            <Link href={`/showroom/${car.id}`}>
                                                <button className="w-12 h-12 rounded-xl bg-white text-black flex items-center justify-center hover:bg-luxury-gold transition-colors duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_#c5a059] group/btn overflow-hidden relative">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                                    <ArrowRight className={cn("w-5 h-5 transition-transform duration-300 relative z-10 group-hover/btn:-rotate-45", isRTL && "rotate-180")} />
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* More Inventory CTA */}
                <div className="mt-40 flex flex-col items-center gap-8 relative z-10">
                    <div className="h-[100px] w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                    <button className="text-xs font-black uppercase tracking-[0.6em] text-white/30 hover:text-luxury-gold hover:tracking-[0.8em] transition-all duration-700">
                        {isRTL ? 'عرض الأرشيف العالمي' : 'View Global Archive'}
                    </button>
                </div>
            </main>
        </div>
    );
}
