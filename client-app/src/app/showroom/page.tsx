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
    const [viewMode, setViewMode] = useState<'AGENCIES' | 'CARS'>('AGENCIES');
    const [selectedAgency, setSelectedAgency] = useState<any>(null);
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Mock Brands for Agencies ---
    const AGENCIES = [
        { id: 'toyota', name: isRTL ? 'تويوتا' : 'TOYOTA', logo: '/images/شعارات/TOYOTA.jpg' },
        { id: 'kia', name: isRTL ? 'كيا' : 'KIA', logo: '/images/شعارات/photo_6_2026-02-05_20-57-23.jpg' },
        { id: 'hyundai', name: isRTL ? 'هيونداي' : 'HYUNDAI', logo: '/images/شعارات/photo_7_2026-02-05_20-57-23.jpg' },
        { id: 'ford', name: isRTL ? 'فورد' : 'FORD', logo: '/images/شعارات/photo_8_2026-02-05_20-57-23.jpg' },
        { id: 'nissan', name: isRTL ? 'نيسان' : 'NISSAN', logo: '/images/شعارات/photo_9_2026-02-05_20-57-23.jpg' },
        { id: 'mercedes', name: isRTL ? 'مرسيدس' : 'MERCEDES', logo: '/images/شعارات/photo_10_2026-02-05_20-57-23.jpg' },
    ];

    const handleAgencySelect = async (agency: any) => {
        setSelectedAgency(agency);
        setViewMode('CARS');
        setLoading(true);
        try {
            const data = await api.cars.list({ limit: 50 });
            // Filter by agency name or ID if supported by API
            const filtered = (data.cars || []).filter((c: any) =>
                String(c.make?.name || c.make || '').toLowerCase().includes(agency.id.toLowerCase())
            );
            setCars(filtered);
        } catch { } finally {
            setLoading(false);
        }
    };

    const resetToAgencies = () => {
        setViewMode('AGENCIES');
        setSelectedAgency(null);
    };

    const filters = [
        { key: 'ALL', label: isRTL ? 'الكل' : 'ALL' },
        { key: 'SPORT', label: isRTL ? 'رياضية' : 'SPORT' },
        { key: 'LUXURY', label: isRTL ? 'فاخرة' : 'LUXURY' },
        { key: 'SUV', label: isRTL ? 'دفع رباعي' : 'SUV' },
    ];

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── CINEMATIC BACKGROUND ── */}
            <div className="fixed inset-0 -z-20 bg-[#050505]" />
            <div
                className="fixed inset-0 -z-10 bg-center bg-cover opacity-40 mix-blend-overlay"
                style={{ backgroundImage: "url('/images/photo.jpg')" }}
            />

            {/* ── DYNAMIC AMBIENT ORBS ── */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[10%] -right-[10%] w-[600px] h-[600px] bg-luxury-gold/20 blur-[150px] rounded-full"
                />
                <motion.div
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 120, 0],
                        opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[10%] -left-[5%] w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full"
                />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 contrast-150 mix-blend-overlay pointer-events-none" />
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
                        {/* Back Button */}
                        <button
                            onClick={viewMode === 'AGENCIES' ? () => router.back() : resetToAgencies}
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
                            <h1 className="text-4xl md:text-6xl font-black tracking-[-0.04em] uppercase leading-tight">
                                {viewMode === 'AGENCIES' ? (isRTL ? "اختر الوكالة" : "SELECT AGENCY") : (isRTL ? `سيارات ${selectedAgency?.name}` : `${selectedAgency?.name} COLLECTION`)}
                            </h1>
                            <div className="separator-gold w-16 mt-4" />
                        </div>
                    </motion.div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'AGENCIES' ? (
                        <motion.div
                            key="agencies-creative"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="max-w-4xl mx-auto py-20"
                        >
                            <div className="text-center mb-16">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100px" }}
                                    className="h-[1px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mx-auto mb-6"
                                />
                                <h2 className="text-[10px] font-black uppercase tracking-[1em] text-accent-gold mb-2">Heritage</h2>
                                <p className="text-white/30 text-[9px] uppercase tracking-widest">{isRTL ? "اختر علامتك التجارية المفضلة" : "Select Your Preferred Legacy"}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-20">
                                {AGENCIES.map((agency, idx) => (
                                    <motion.div
                                        key={agency.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.15, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                                        whileHover={{ y: -10 }}
                                        onClick={() => handleAgencySelect(agency)}
                                        className="group relative flex flex-col items-center cursor-pointer"
                                    >
                                        {/* Disc Component */}
                                        <div className="relative w-40 h-40 md:w-56 md:h-56">
                                            {/* Outer Glowing Ring */}
                                            <div className="absolute inset-0 rounded-full border border-white/5 group-hover:border-accent-gold/40 transition-all duration-700" />
                                            <div className="absolute -inset-4 rounded-full border border-accent-gold/0 group-hover:border-accent-gold/10 group-hover:scale-110 transition-all duration-1000 opacity-0 group-hover:opacity-100 blur-sm" />

                                            {/* Main Circle Body */}
                                            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/[0.08] to-transparent backdrop-blur-3xl border border-white/10 overflow-hidden flex items-center justify-center p-6 shadow-2xl group-hover:shadow-accent-gold/5 transition-all duration-700">
                                                <div className="relative w-full h-full bg-white rounded-full flex items-center justify-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.2)] p-4 transform group-hover:scale-105 transition-transform duration-700">
                                                    <img
                                                        src={agency.logo}
                                                        alt={agency.name}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                            </div>

                                            {/* Floating Badge */}
                                            <motion.div
                                                animate={{ y: [0, -5, 0] }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-accent-gold/10 border border-accent-gold/20 backdrop-blur-md flex items-center justify-center"
                                            >
                                                <ArrowUpRight className="w-4 h-4 text-accent-gold" />
                                            </motion.div>
                                        </div>

                                        {/* Name Label */}
                                        <div className="mt-8 text-center">
                                            <span className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white/20 group-hover:text-white transition-all duration-500 group-hover:tracking-widest">
                                                {agency.name}
                                            </span>
                                            <div className="h-[2px] w-0 group-hover:w-12 bg-accent-gold mx-auto mt-2 transition-all duration-500 shadow-[0_0_10px_rgba(201,169,110,1)]" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="cars-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-12"
                        >
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
                                        {cars.map((car, i) => (
                                            <motion.div
                                                key={car.id}
                                                layout
                                                initial={{ opacity: 0, y: 25 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ delay: i * 0.05, duration: 0.5 }}
                                            >
                                                {/* (Same car card code as before) */}
                                                <div className="group obsidian-card obsidian-card-hover h-full flex flex-col overflow-hidden">
                                                    <div className="relative h-56 overflow-hidden bg-black">
                                                        <img
                                                            src={car.images?.[0] || car.previewImage || ''}
                                                            alt={car.title}
                                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-70 group-hover:opacity-100"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                                                        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                                                            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 transition-all">
                                                                <Heart className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
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
                                                        <div className="flex items-end justify-between pt-1">
                                                            <div>
                                                                <span className="text-[8px] font-bold text-white/15 uppercase tracking-wider block mb-0.5">{isRTL ? 'السعر' : 'PRICE'}</span>
                                                                <span className="text-lg font-black gradient-text-gold">{Number(car.price || 0).toLocaleString()}<span className="text-[9px] text-white/20 ml-1 font-normal"> SAR</span></span>
                                                            </div>
                                                            <Link href={`/showroom/${car.id}`}>
                                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                                                                    <ArrowUpRight className={cn("w-4 h-4", isRTL && "scale-x-[-1]")} />
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
                                    <h3 className="text-2xl font-bold text-white/15">{isRTL ? "لا توجد سيارات حالياً لهذه الوكالة" : "No vehicles found for this agency"}</h3>
                                    <button onClick={resetToAgencies} className="px-6 py-2 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/5">{isRTL ? "العودة للوكالات" : "BACK TO AGENCIES"}</button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

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
