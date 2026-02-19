'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, Car, ArrowUpRight, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ClientPageHeader from "@/components/ClientPageHeader";
import SearchSection from "@/components/SearchSection";

export default function Showroom() {
    const { t, isRTL } = useLanguage();
    const router = useRouter();
    const [filter, setFilter] = useState('ALL');
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<any[]>([]);
    const [brandFilter, setBrandFilter] = useState<string>('ALL');

    useEffect(() => {
        const loadCars = async () => {
            setLoading(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 600));
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
    useEffect(() => {
        try { const raw = localStorage.getItem('hm_brands'); if (raw) setBrands(JSON.parse(raw)); } catch {}
    }, []);

    const filters = [
        { key: 'ALL', label: isRTL ? 'الكل' : 'ALL' },
        { key: 'SPORT', label: isRTL ? 'رياضية' : 'SPORT' },
        { key: 'LUXURY', label: isRTL ? 'فاخرة' : 'LUXURY' },
        { key: 'SUV', label: isRTL ? 'دفع رباعي' : 'SUV' },
    ];

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* خلفية تغطي الصفحة كاملة */}
            <div
                className="fixed inset-0 -z-10 bg-center bg-cover"
                style={{ backgroundImage: "url('/images/photo.jpg')", filter: 'brightness(0.5) contrast(1.2) saturate(1.1)' }}
            />
            <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/70" />

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-10" />
                <div className="orb orb-gold w-[600px] h-[600px] top-0 right-0 animate-breathe opacity-30" />
                <div className="orb orb-blue w-[400px] h-[400px] bottom-0 left-0 animate-breathe delay-1000 opacity-20" />
            </div>

            <main className="relative z-10 pt-12 pb-32 px-6 max-w-[1600px] mx-auto">
                {/* ترويسة صفحة واحدة داخل المحتوى */}
                <div className="w-full max-w-6xl mt-12 px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex items-end gap-6"
                    >
                        {/* Back Button */}
                        <button
                            onClick={() => router.back()}
                            className="group w-12 h-12 rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-md flex items-center justify-center hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/40 mb-2"
                            aria-label={isRTL ? "عودة" : "Back"}
                        >
                            {isRTL
                                ? <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                                : <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                            }
                        </button>

                        <div>
                            <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-accent-gold/60 block mb-3">
                                {isRTL ? "مخزون النخبة" : "ELITE INVENTORY"}
                            </span>
                            <h1 className="text-5xl md:text-7xl font-black tracking-[-0.04em] uppercase">
                                {isRTL ? "المعرض" : "SHOWROOM"}
                            </h1>
                            <div className="separator-gold w-16 mt-4" />
                        </div>
                    </motion.div>
                </div>

                {/* ── FILTER BAR ── */}
                <SearchSection />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-3 mb-16 p-1.5 bg-white/[0.03] border border-white/5 rounded-xl backdrop-blur-xl w-fit"
                >
                    {filters.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                "px-7 py-3 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-400 relative overflow-hidden",
                                filter === f.key
                                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.15)]"
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
                    {brands.map((b: any) => (
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

                {/* ── CARS GRID ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((n) => (
                            <div key={n} className="h-[440px] rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence mode="popLayout">
                            {(brandFilter === 'ALL' ? cars : cars.filter((car) => String(car.make || car.title || '').toLowerCase().includes(String(brandFilter).toLowerCase()))).map((car, i) => (
                                <motion.div
                                    key={car.id}
                                    layout
                                    initial={{ opacity: 0, y: 25 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05, duration: 0.5 }}
                                >
                                    <div className="group obsidian-card obsidian-card-hover h-full flex flex-col overflow-hidden">
                                        {/* Image */}
                                        <div className="relative h-56 overflow-hidden bg-black">
                                            <img
                                                src={car.images?.[0] || car.previewImage || ''}
                                                alt={car.title}
                                                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-70 group-hover:opacity-100"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

                                            {/* Favorite */}
                                            <button className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all">
                                                <Heart className="w-3.5 h-3.5" />
                                            </button>

                                            {/* Category Badge */}
                                            <div className="absolute bottom-3 left-4 z-20 flex items-center gap-2 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-md border border-white/5">
                                                <Sparkles className="w-2.5 h-2.5 text-accent-gold" />
                                                <span className="text-[7px] font-bold text-white/60 uppercase tracking-widest">{car.category?.name || 'STOCK'}</span>
                                            </div>
                                        </div>

                                        {/* Details */}
                                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-2 opacity-50">
                                                    <div className="w-1 h-1 bg-accent-gold rounded-full" />
                                                    <span className="text-[8px] font-bold text-accent-gold tracking-[0.2em] uppercase">{car.make?.name || car.make}</span>
                                                </div>
                                                <h3 className="text-lg font-black tracking-tight uppercase leading-snug line-clamp-2 group-hover:text-accent-gold transition-colors min-h-[2.8rem]">
                                                    {car.title}
                                                </h3>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-3 gap-0 py-2.5 border-y border-white/5 bg-white/[0.01] rounded-lg">
                                                <div className="flex flex-col items-center gap-0.5 border-r border-white/5">
                                                    <span className="text-[7px] font-bold text-white/20 uppercase">Year</span>
                                                    <span className="text-[10px] font-bold text-white/50">{car.year || '2024'}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5 border-r border-white/5">
                                                    <span className="text-[7px] font-bold text-white/20 uppercase">Fuel</span>
                                                    <span className="text-[10px] font-bold text-white/50 truncate max-w-[45px]">{car.fuelType || 'Petrol'}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className="text-[7px] font-bold text-white/20 uppercase">Trans</span>
                                                    <span className="text-[10px] font-bold text-white/50 truncate max-w-[45px]">{car.transmission || 'Auto'}</span>
                                                </div>
                                            </div>

                                            {/* Price + Action */}
                                            <div className="flex items-end justify-between pt-1">
                                                <div>
                                                    <span className="text-[8px] font-bold text-white/15 uppercase tracking-wider block mb-0.5">
                                                        {isRTL ? 'السعر' : 'PRICE'}
                                                    </span>
                                                    <span className="text-lg font-black gradient-text-gold">
                                                        {Number(car.price || 0).toLocaleString()}
                                                        <span className="text-[9px] text-white/20 ml-1 font-normal"> SAR</span>
                                                    </span>
                                                </div>
                                                <Link href={`/showroom/${car.id}`}>
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black hover:border-white transition-all duration-300 group/btn">
                                                        <ArrowUpRight className={cn("w-4 h-4 transition-transform group-hover/btn:scale-110", isRTL && "scale-x-[-1]")} />
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

                {/* ── EMPTY STATE ── */}
                {!loading && cars.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center text-center space-y-6"
                    >
                        <Car className="w-16 h-16 text-white/5" />
                        <h3 className="text-2xl font-bold text-white/15">{isRTL ? "لا توجد سيارات حالياً" : "No vehicles found"}</h3>
                    </motion.div>
                )}

                {/* ── LOAD MORE ── */}
                
            </main>
        </div>
    );
}
