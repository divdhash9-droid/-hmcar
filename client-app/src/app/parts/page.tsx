'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    ArrowUpRight, Cpu, Settings, Box, Search, Filter,
    CheckCircle2, AlertCircle, Zap, Shield,
    Layers, Truck, X, ChevronLeft, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";

// --- Types ---
interface Part {
    id: string;
    name: string;
    brand: string;
    price: number;
    img: string;
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    category: string;
    stock: number;
    compatibility: string[]; // List of compatible models
    rareLevel: 1 | 2 | 3 | 4 | 5; // 5 is most rare
}

export default function PartsPage() {
    const { isRTL } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [compatibilityModel, setCompatibilityModel] = useState('');
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [showFilters, setShowFilters] = useState(false);

    // --- Mock Data (Will fallback if API fails) ---
    const MOCK_PARTS: Part[] = [
        {
            id: '1', name: 'CERAMIC BRAKE KIT V2', brand: 'BREMBO', price: 15500,
            img: 'https://images.unsplash.com/photo-1624552467554-ce1aa68cb952?q=80&w=1000',
            condition: 'NEW', category: 'BRAKES', stock: 4, compatibility: ['Ferrari 488', 'Lamborghini Huracan'], rareLevel: 4
        },
        {
            id: '2', name: 'CARBON FIBER AERODYNAMICS HOOD', brand: 'MANSORY', price: 42000,
            img: 'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=1000',
            condition: 'NEW', category: 'BODY', stock: 1, compatibility: ['Rolls Royce Cullinan'], rareLevel: 5
        },
        {
            id: '3', name: 'TITANIUM EXHAUST SYSTEM', brand: 'AKRAPOVIC', price: 28900,
            img: 'https://images.unsplash.com/photo-1605634584281-d1f8f9d0c9f1?q=80&w=1000',
            condition: 'NEW', category: 'ENGINE', stock: 2, compatibility: ['BMW M5', 'BMW M8'], rareLevel: 3
        },
        {
            id: '4', name: 'OLED DASHBOARD DISPLAY UNIT', brand: 'BOSCH', price: 8400,
            img: 'https://images.unsplash.com/photo-1635771382436-1e68710317e0?q=80&w=1000',
            condition: 'USED', category: 'ELECTRONICS', stock: 1, compatibility: ['Audi RS6', 'Audi RS7'], rareLevel: 2
        },
        {
            id: '5', name: 'FORGED WHEEL SET - 21"', brand: 'VOSSEN', price: 32000,
            img: 'https://images.unsplash.com/photo-1551522435-a13afa10f103?q=80&w=1000',
            condition: 'NEW', category: 'WHEELS', stock: 8, compatibility: ['All Supercars'], rareLevel: 3
        },
        {
            id: '6', name: 'HIGH PERFORMANCE TURBOCHARGER', brand: 'GARRETT', price: 19000,
            img: 'https://images.unsplash.com/photo-1611003229202-e22557406606?q=80&w=1000',
            condition: 'REFURBISHED', category: 'ENGINE', stock: 2, compatibility: ['Porsche 911 Turbo'], rareLevel: 4
        }
    ];

    useEffect(() => {
        const loadParts = async () => {
            setLoading(true);
            try {
                // Simulate delay for cinematic feel
                await new Promise(resolve => setTimeout(resolve, 800));
                const data = await api.parts.list({ limit: 50 }).catch(() => ({ parts: MOCK_PARTS }));
                setParts(data.parts && data.parts.length > 0 ? data.parts : MOCK_PARTS);
            } catch (err) {
                setParts(MOCK_PARTS);
            } finally {
                setLoading(false);
            }
        };
        loadParts();
    }, []);

    const categories = [
        { key: 'ALL', label: isRTL ? 'الكل' : 'ALL', icon: Layers },
        { key: 'ENGINE', label: isRTL ? 'المحرك' : 'ENGINE', icon: Cpu },
        { key: 'BODY', label: isRTL ? 'الهيكل' : 'BODY', icon: Box },
        { key: 'BRAKES', label: isRTL ? 'الفرامل' : 'BRAKES', icon: Shield },
        { key: 'ELECTRONICS', label: isRTL ? 'الكترونيات' : 'ELECTRONICS', icon: Zap },
        { key: 'WHEELS', label: isRTL ? 'العجلات' : 'WHEELS', icon: Settings },
    ];

    const filteredParts = parts.filter(part => {
        const matchesSearch = part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            part.brand.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'ALL' || part.category === activeCategory;
        const matchesPrice = part.price >= priceRange[0] && part.price <= priceRange[1];
        const matchesComp = !compatibilityModel || part.compatibility.some(c => c.toLowerCase().includes(compatibilityModel.toLowerCase()));

        return matchesSearch && matchesCategory && matchesPrice && matchesComp;
    });

    return (
        <div className={`relative min-h-screen bg-[#050505] text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── BACK BUTTON ── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={cn("fixed top-8 z-[60]", isRTL ? "right-8" : "left-8")}
            >
                <Link href="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-accent-gold transition-all duration-500">
                    <div className="w-11 h-11 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-accent-gold/50 group-hover:bg-accent-gold/10 transition-all backdrop-blur-md">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                    <span className="hidden lg:block">{isRTL ? "الرئيسية" : "HOME"}</span>
                </Link>
            </motion.div>

            {/* ── CINEMATIC HERO ── */}
            <section className="relative h-[85vh] flex items-center justify-center pt-20">
                <CinematicVideoBackground
                    videoSrc="/videos/hero.mp4"
                    fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                    mobileImage="/images/hmcar.jpg"
                    overlayOpacity={0.65}
                />

                <div className="relative z-20 w-full max-w-6xl px-6 text-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold tracking-[0.4em] uppercase text-accent-gold mb-6">
                            {isRTL ? "مركز تكنولوجيا قطع الغيار" : "SPARE PARTS TECH HUB"}
                        </span>
                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.95] mb-6">
                            {isRTL ? "اعثر على الـ" : "FIND THE"} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 italic">
                                {isRTL ? "مكون المفقود" : "MISSING PART"}
                            </span>
                        </h1>
                        <p className="text-white/40 text-sm md:text-base max-w-2xl mx-auto font-medium leading-relaxed uppercase tracking-widest">
                            {isRTL ? "سجل حصري لقطع السيارات الفاخرة والنادرة. تقنية البحث الذكي تضمن التوافق التام." : "EXCLUSIVe REGISTRY FOR LUXURY & RARE COMPONENTS. SMART SEARCH GUARANTEES PERFECT COMPATIBILITY."}
                        </p>
                    </motion.div>

                    {/* SEARCH BOX */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="relative max-w-3xl mx-auto group"
                    >
                        <div className="absolute inset-0 bg-accent-gold/10 blur-[80px] rounded-full group-hover:bg-accent-gold/20 transition-all duration-700 opacity-50" />
                        <div className="relative flex items-center bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl p-2 md:p-3 shadow-2xl overflow-hidden">
                            <div className="flex-1 flex items-center px-4 gap-4">
                                <Search className="w-6 h-6 text-accent-gold" />
                                <input
                                    type="text"
                                    placeholder={isRTL ? "ماذا تبحث عنه؟ (مثال: Brembo kit)" : "Deep Search Spare Parts... (e.g. Brembo kit)"}
                                    className="w-full bg-transparent border-none outline-none py-4 text-lg font-bold placeholder:text-white/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="hidden md:flex items-center gap-2 pr-2">
                                <div className="h-10 w-[1px] bg-white/10 mx-2" />
                                <button className="btn-gold px-8 py-4 rounded-xl font-black flex items-center gap-2 text-xs">
                                    {isRTL ? "استكشاف" : "EXPLORE"}
                                    <ArrowUpRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* QUICK CATEGORIES */}
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-10">
                        {categories.map((cat, idx) => (
                            <motion.button
                                key={cat.key}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + (idx * 0.1) }}
                                onClick={() => setActiveCategory(cat.key)}
                                className={cn(
                                    "px-6 py-3 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                                    activeCategory === cat.key
                                        ? "bg-accent-gold border-accent-gold text-black shadow-lg shadow-accent-gold/20"
                                        : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                                )}
                            >
                                <cat.icon className="w-3 h-3" />
                                {cat.label}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* SCROLL INDICATOR */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 orientation-vertical">SCROLL TO DISCOVER</span>
                    <div className="w-px h-16 bg-gradient-to-b from-accent-gold/60 to-transparent" />
                </div>
            </section>

            <main className="relative z-30 max-w-[1700px] mx-auto px-6 py-20 bg-gradient-to-t from-[#050505] to-transparent">

                {/* ── TOOLBAR ── */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-16">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase tracking-tight">
                            {isRTL ? "المكونات المكتشفة" : "DISCOVERED "}
                            <span className="text-accent-gold">{isRTL ? "" : "COMPONENTS"}</span>
                        </h2>
                        <div className="flex items-center gap-3 text-white/30 text-xs">
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> {isRTL ? "مفحوصة تقنياً" : "Technical Checked"}</span>
                            <div className="w-1 h-1 rounded-full bg-white/10" />
                            <span>{filteredParts.length} {isRTL ? "عنصر تم العثور عليه" : "Results found"}</span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                        {/* Compatibility Check */}
                        <div className="relative group flex-1 min-w-[300px]">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-accent-gold">
                                <Shield className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder={isRTL ? "تحقق من التوافق: اكتب موديل سيارتك..." : "Compatibility Checker: Enter car model..."}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold focus:border-accent-gold/40 transition-all outline-none"
                                value={compatibilityModel}
                                onChange={(e) => setCompatibilityModel(e.target.value)}
                            />
                            {compatibilityModel && (
                                <button onClick={() => setCompatibilityModel('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-4 rounded-xl border font-bold text-[10px] uppercase tracking-widest transition-all",
                                showFilters ? "bg-white text-black border-white" : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            {isRTL ? "تصفية متطورة" : "Advanced Filters"}
                        </button>
                    </div>
                </div>

                {/* ADVANCED FILTERS PANEL */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-xl">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{isRTL ? "نطاق السعر (SAR)" : "PRICE RANGE (SAR)"}</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            placeholder="From"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-accent-gold/40"
                                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                        />
                                        <div className="w-4 h-[1px] bg-white/10" />
                                        <input
                                            type="number"
                                            placeholder="To"
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs outline-none focus:border-accent-gold/40"
                                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 1000000])}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{isRTL ? "الحالة التقنية" : "CONDITION"}</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['NEW', 'USED', 'REFURBISHED'].map(cond => (
                                            <button key={cond} className="px-4 py-2 rounded-lg bg-white/5 border border-white/5 text-[9px] font-bold hover:bg-accent-gold/10 hover:border-accent-gold/20 transition-all uppercase">
                                                {cond}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{isRTL ? "الماركات المشهورة" : "POPULAR BRANDS"}</label>
                                    <div className="flex flex-wrap gap-2 text-[9px] text-white/40">
                                        {['BREMBO', 'AKRAPOVIC', 'MANSORY', 'NOVITEC', 'BOSCH'].map(brand => (
                                            <span key={brand} className="cursor-pointer hover:text-accent-gold transition-colors">#{brand}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── GRID ── */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="aspect-[4/5] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : filteredParts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-40 space-y-6"
                    >
                        <AlertCircle className="w-20 h-20 text-white/10 mx-auto" />
                        <h3 className="text-2xl font-black uppercase tracking-tight">{isRTL ? "لا توجد نتائج مطابقة" : "NO MATCHING RESULTS"}</h3>
                        <p className="text-white/30 text-sm max-w-md mx-auto">{isRTL ? "جرب تصفية مختلفة أو تواصل مع فريق الكونسيرج للبحث عن القطعة في مستودعاتنا الخاصة." : "Try adjusting your filters or connect with our Concierge team to source this part from our private inventory."}</p>
                        <button onClick={() => { setSearchQuery(''); setActiveCategory('ALL'); setCompatibilityModel(''); }} className="text-accent-gold font-bold uppercase text-[10px] tracking-widest border-b border-accent-gold/30 hover:border-accent-gold transition-all pb-1">{isRTL ? "إعادة الضغط التلقائي" : "RESET ALL PARAMETERS"}</button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredParts.map((part, idx) => (
                                <motion.div
                                    key={part.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative"
                                >
                                    {/* RARITY INDICATOR */}
                                    <div className="absolute -top-1 -right-1 z-20 flex gap-0.5 pointer-events-none">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-1 h-3 rounded-full blur-[2px]",
                                                    i < part.rareLevel ? "bg-accent-gold shadow-[0_0_5px_var(--accent-gold)]" : "bg-white/5"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <div className="glass-card overflow-hidden h-full flex flex-col border border-white/5 group-hover:border-accent-gold/30 transition-all duration-700 bg-black/40 backdrop-blur-3xl rounded-3xl p-6">

                                        {/* Status Badge */}
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full animate-pulse",
                                                    part.stock > 0 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500"
                                                )} />
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">
                                                    {part.stock > 0 ? (isRTL ? `متوفر: ${part.stock}` : `IN STOCK: ${part.stock}`) : (isRTL ? "غير متوفر" : "OUT OF STOCK")}
                                                </span>
                                            </div>
                                            <span className="text-[7px] font-bold px-2 py-0.5 rounded border border-white/10 text-white/30 uppercase tracking-widest">{part.condition}</span>
                                        </div>

                                        {/* Image Section */}
                                        <div className="relative aspect-square mb-8 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 overflow-hidden flex items-center justify-center">
                                            <div className="absolute inset-0 bg-grid-white/[0.02] opacity-20" />
                                            <img
                                                src={part.img}
                                                alt={part.name}
                                                className="w-4/5 h-4/5 object-contain grayscale-[30%] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 ease-out"
                                            />

                                            {/* Quick Specs Overlay */}
                                            <div className="absolute bottom-0 inset-x-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-black/80 backdrop-blur-md border-t border-white/10 flex flex-col gap-2">
                                                <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-white/40">
                                                    <span>COMPATIBILITY</span>
                                                    <span className="text-accent-gold">{part.compatibility[0]}...</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-white/40">
                                                    <span>ENGINEERED BY</span>
                                                    <span className="text-white/80">{part.brand}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <span className="text-[9px] font-bold text-accent-gold/60 uppercase tracking-[0.3em] block mb-1">{part.brand}</span>
                                                <h3 className="text-lg font-black tracking-tight leading-tight uppercase group-hover:text-accent-gold transition-colors duration-500 line-clamp-2 min-h-[3rem]">
                                                    {part.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-center gap-4 text-[9px] text-white/30 font-bold overflow-hidden">
                                                <span className="flex items-center gap-1.5 shrink-0"><CheckCircle2 className="w-3 h-3 text-accent-gold" /> {isRTL ? "مضمون" : "AUTHENTIC"}</span>
                                                <div className="w-px h-3 bg-white/10" />
                                                <span className="flex items-center gap-1.5 truncate"><Truck className="w-3 h-3" /> {isRTL ? "شحن دولي" : "GLOBAL DIST."}</span>
                                            </div>

                                            <div className="pt-6 mt-auto flex items-end justify-between border-t border-white/5">
                                                <div className="space-y-1">
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{isRTL ? "سجل السعر" : "PRICE UNIT"}</span>
                                                    <div className="text-2xl font-black gradient-text-gold tracking-tight">
                                                        {Number(part.price).toLocaleString()}
                                                        <span className="text-[10px] text-white/30 ml-1.5 font-bold uppercase">SAR</span>
                                                    </div>
                                                </div>

                                                <Link href={`/parts/${part.id}`}>
                                                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group/btn hover:bg-accent-gold hover:border-accent-gold transition-all duration-500">
                                                        <ArrowUpRight className="w-5 h-5 group-hover/btn:scale-125 group-hover/btn:text-black transition-all" />
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

                {/* ── CONCIERGE BANNER ── */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 relative group"
                >
                    <div className="absolute inset-0 bg-accent-gold/5 blur-[120px] rounded-full opacity-50" />
                    <div className="relative overflow-hidden obsidian-card p-12 md:p-20 rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                        {/* Background Abstract */}
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-accent-gold/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]" />

                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-accent-gold/10 border border-accent-gold/20">
                                    <Layers className="w-4 h-4 text-accent-gold" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-gold">{isRTL ? "خدمة البحث العالمي" : "GLOBAL SEARCH NETWORK"}</span>
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-[0.95]">
                                    {isRTL ? "لم تجد ما" : "COULDN'T FIND"} <br />
                                    <span className="gradient-text-gold italic">{isRTL ? "تبحث عنه؟" : "YOUR PART?"}</span>
                                </h2>
                                <p className="text-white/40 text-base font-medium max-w-lg leading-relaxed">
                                    {isRTL
                                        ? "لدينا شبكة علاقات دولية تتيح لنا الوصول إلى قطع نادرة غير موجودة في القائمة العامة. دع فريق الخبراء لدينا يبحث لك."
                                        : "Our international network grants access to rare components not listed publicly. Let our field engineers locate it for you."
                                    }
                                </p>
                                <div className="flex flex-wrap gap-6 pt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Zap className="w-4 h-4 text-accent-gold" /></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{isRTL ? "استجابة 24 ساعة" : "24H RESPONSE"}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"><Shield className="w-4 h-4 text-accent-gold" /></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{isRTL ? "فحص أصالة" : "AUTHENTICITY CHECK"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[32px] space-y-6">
                                <h3 className="text-lg font-black uppercase tracking-tight">{isRTL ? "طلب بحث خاص المخصص" : "CUSTOM SOURCE REQUEST"}</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder={isRTL ? "اسم القطعة أو رقمها" : "Part Name or Serial Number"} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-accent-gold-40" />
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-accent-gold-40 text-white/40">
                                        <option>{isRTL ? "اختر الفئة" : "Select Category"}</option>
                                        <option>Engine</option>
                                        <option>Aero/Body</option>
                                        <option>Wheels</option>
                                    </select>
                                    <textarea placeholder={isRTL ? "تفاصيل إضافية (موديل السيارة، السنة...)" : "Additional Details (Car Model, Year...)"} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none focus:border-accent-gold-40 h-32 resize-none" />
                                </div>
                                <Link href="/concierge">
                                    <button className="w-full btn-gold py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] mt-4 flex items-center justify-center gap-3">
                                        {isRTL ? "إرسال طلب البحث" : "SUBMIT SOURCE REQUEST"}
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* STYLES FOR GRIDS & EFFECTS */}
            <style jsx global>{`
                .orientation-vertical {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                }
                .bg-grid-white {
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='white'%3E%3Cpath d='M0 .5H31.5V32' /%3E%3C/svg%3E");
                }
            `}</style>
        </div>
    );
}
