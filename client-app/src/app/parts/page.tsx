'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    ArrowUpRight, Cpu, Settings, Box, Search, Filter,
    CheckCircle2, AlertCircle, Zap, Shield,
    Layers, Truck, X, ChevronLeft, ChevronRight, CarFront, Gauge
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

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
    compatibility: string[];
    rareLevel: 1 | 2 | 3 | 4 | 5;
    agency: string; // The brand like TOYOTA, KIA
    carModel: string; // The specific model like CAMRY, K5
}

interface Agency {
    id: string;
    name: string;
    logo: string;
    models: string[];
}

export default function PartsPage() {
    const { isRTL } = useLanguage();
    const [viewMode, setViewMode] = useState<'AGENCIES' | 'MODELS' | 'PARTS'>('AGENCIES');
    const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(false);

    // --- Mock Agencies Data with Bilingual support ---
    const [agencies, setAgencies] = useState<Agency[]>([]);

    useEffect(() => {
        const fetchAgencies = async () => {
            try {
                const res = await api.brands.list('parts');
                if (res?.success && Array.isArray(res.brands)) {
                    setAgencies(res.brands.map((b: any) => ({
                        id: b._id,
                        name: b.name,
                        logo: b.logoUrl || '/images/placeholder.jpg',
                        models: isRTL ? ['كامري', 'كورولا', 'لاند كروزر', 'K5', 'سوناتا'] : ['CAMRY', 'COROLLA', 'LAND CRUISER', 'K5', 'SONATA']
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch agencies", err);
            }
        };
        fetchAgencies();
    }, [isRTL]);

    const MOCK_PARTS: Part[] = [
        {
            id: '1', name: 'CERAMIC BRAKE KIT V2', brand: 'BREMBO', price: 15500,
            img: 'https://images.unsplash.com/photo-1624552467554-ce1aa68cb952?q=80&w=1000',
            condition: 'NEW', category: 'BRAKES', stock: 4, compatibility: ['Toyota Camry'], agency: 'TOYOTA', carModel: 'CAMRY', rareLevel: 4
        },
        // ... more parts can be added here
    ];

    const handleAgencySelect = (agency: Agency) => {
        setSelectedAgency(agency);
        setViewMode('MODELS');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        setViewMode('PARTS');
        loadParts(selectedAgency?.name || '', model);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const loadParts = async (agency: string, model: string) => {
        setLoading(true);
        // Normally fetch from API based on agency and model
        setTimeout(() => {
            setParts(MOCK_PARTS.filter(p => p.agency === agency && (p.carModel === model || model === 'ALL')));
            setLoading(false);
        }, 800);
    };

    const resetToAgencies = () => {
        setViewMode('AGENCIES');
        setSelectedAgency(null);
        setSelectedModel(null);
        setSearchQuery('');
    };

    const resetToModels = () => {
        setViewMode('MODELS');
        setSelectedModel(null);
        setSearchQuery('');
    };

    const filteredAgencies = agencies.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className={`relative min-h-screen bg-[#050505] text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* ── ADVANCED TECH BACKGROUND ── */}
            <div className="fixed inset-0 -z-20">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 brightness-[0.4] contrast-125"
                    style={{ backgroundImage: "url('/images/gata.jpg')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,240,255,0.05)_0%,_transparent_50%)]" />
            </div>

            {/* ── FLOATING PARTICLES ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.4, 0],
                            scale: [0, 1, 0],
                            x: [(i % 5) * 200 - 400, (i % 3) * 300 - 450, (i % 5) * 200 - 400],
                            y: [(i % 4) * 200 - 400, (i % 2) * 400 - 400, (i % 4) * 200 - 400]
                        }}
                        transition={{
                            duration: 15 + (i % 10),
                            repeat: Infinity,
                            delay: i * 0.5
                        }}
                        className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-cinematic-neon-blue rounded-full blur-[3px]"
                    />
                ))}
            </div>

            {/* ── BACK BUTTON ── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className={cn("fixed top-24 z-[60]", isRTL ? "right-12" : "left-12")}
            >
                <button
                    onClick={viewMode === 'AGENCIES' ? () => window.location.href = '/client/dashboard' : (viewMode === 'MODELS' ? resetToAgencies : resetToModels)}
                    className="group w-12 h-12 border border-white/10 rounded-2xl flex items-center justify-center bg-black/60 backdrop-blur-xl hover:border-accent-gold/50 hover:bg-accent-gold/10 transition-all duration-500 shadow-2xl"
                    title={isRTL ? "عودة" : "Back"}
                >
                    {isRTL ? <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-accent-gold transition-colors" /> : <ChevronLeft className="w-5 h-5 text-white/60 group-hover:text-accent-gold transition-colors" />}
                </button>
            </motion.div>

            <main className="relative z-10 pt-32 px-6 pb-20 max-w-[1400px] mx-auto min-h-screen flex flex-col">

                {/* ── HEADER ── */}
                <header className="text-center mb-16 space-y-4">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-[10px] font-black tracking-[0.3em] uppercase text-accent-gold"
                    >
                        {isRTL ? "مستودع المكونات الرقمي" : "DIGITAL COMPONENTS REGISTRY"}
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-6xl font-black uppercase tracking-tighter"
                    >
                        {viewMode === 'AGENCIES' && (isRTL ? "اختر وكالة السيارة" : "SELECT AUTO AGENCY")}
                        {viewMode === 'MODELS' && (isRTL ? `موديلات ${selectedAgency?.name}` : `${selectedAgency?.name} MODELS`)}
                        {viewMode === 'PARTS' && (isRTL ? `قطع غيار ${selectedModel}` : `${selectedModel} SPARE PARTS`)}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-white/40 text-sm font-medium uppercase tracking-[0.2em]"
                    >
                        {viewMode === 'AGENCIES' && (isRTL ? "ابحث عن طريق شعار الشركة المصنعة" : "BROWSE BY MANUFACTURER LOGO")}
                        {viewMode === 'MODELS' && (isRTL ? "حدد موديل السيارة المحدد لمتابعة التوافق" : "SPECIFY THE CAR MODEL TO ENSURE COMPATIBILITY")}
                        {viewMode === 'PARTS' && (isRTL ? "اعثر وكافة المكونات المتاحة لهذا الموديل" : "DISCOVER ALL AVAILABLE COMPONENTS FOR THIS MODEL")}
                    </motion.p>
                </header>

                {/* ── SEARCH (Only for Agencies and Parts) ── */}
                {(viewMode === 'AGENCIES' || viewMode === 'PARTS') && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="relative max-w-2xl mx-auto w-full mb-16"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-accent-gold/5 blur-3xl rounded-full" />
                        <div className="relative flex items-center bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-2xl overflow-hidden group">
                            <div className="flex-1 flex items-center px-4 gap-4">
                                <Search className="w-5 h-5 text-accent-gold group-hover:scale-110 transition-transform" />
                                <input
                                    type="text"
                                    placeholder={viewMode === 'AGENCIES' ? (isRTL ? "ابحث عن شركة (تويوتا، كيا...)" : "Search Agency (Toyota, Kia...)") : (isRTL ? "اسم القطعة..." : "Part Name...")}
                                    className="w-full bg-transparent border-none outline-none py-4 text-sm font-bold placeholder:text-white/20"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── CONTENT VIEWS ── */}
                <AnimatePresence mode="wait">

                    {viewMode === 'AGENCIES' && (
                        <motion.div
                            key="agencies-tech"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
                            className="max-w-6xl mx-auto py-16"
                        >
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-10 md:gap-14">
                                {filteredAgencies.map((agency, idx) => (
                                    <motion.div
                                        key={agency.id}
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.8, ease: "circOut" }}
                                        onClick={() => handleAgencySelect(agency)}
                                        className="group relative cursor-pointer"
                                    >
                                        <div className="aspect-[4/5] glass-card bg-white/[0.01] border border-white/5 rounded-[40px] p-8 flex flex-col items-center justify-between overflow-hidden group-hover:border-cinematic-neon-blue/40 transition-all duration-700">
                                            {/* Tech Background Deco */}
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-1 bg-gradient-to-r from-transparent via-cinematic-neon-blue/20 to-transparent" />
                                            <div className="absolute bottom-10 left-0 w-full h-[1px] bg-white/[0.03]" />

                                            {/* Capsule Shell */}
                                            <div className="relative w-full aspect-square rounded-[30px] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center p-6 group-hover:scale-105 transition-transform duration-700">
                                                <div className="absolute inset-0 rounded-[30px] border border-black/5" />
                                                <Image
                                                    src={agency.logo}
                                                    alt={agency.name}
                                                    fill
                                                    className="object-contain p-2"
                                                />
                                            </div>

                                            <div className="text-center w-full z-10">
                                                <div className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue mb-2 opacity-60 group-hover:opacity-100 transition-opacity">Select Agency</div>
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-cinematic-neon-blue transition-colors">
                                                    {agency.name}
                                                </h3>
                                            </div>

                                            {/* Animated Glow on Hover */}
                                            <div className="absolute -inset-20 bg-cinematic-neon-blue/10 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* 2. MODELS LIST */}
                    {viewMode === 'MODELS' && (
                        <motion.div
                            key="models"
                            initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {selectedAgency?.models.map((model, idx) => (
                                <motion.div
                                    key={model}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    onClick={() => handleModelSelect(model)}
                                    className="group relative cursor-pointer"
                                >
                                    <div className="glass-card bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center justify-between group-hover:border-accent-gold/40 transition-all duration-500">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-accent-gold/10 transition-all">
                                                <CarFront className="w-5 h-5 text-white/20 group-hover:text-accent-gold transition-colors" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">{model}</h3>
                                                <span className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{selectedAgency.name} SERIES</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-accent-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* 3. PARTS LIST */}
                    {viewMode === 'PARTS' && (
                        <motion.div
                            key="parts"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-10"
                        >
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="aspect-[4/5] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : parts.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-16 text-center space-y-8"
                                >
                                    <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-10 h-10 text-accent-gold/40" />
                                    </div>
                                    <h2 className="text-3xl font-black uppercase tracking-tight">{isRTL ? "القطعة المطلوبة غير متوفرة حالياً" : "REQUESTED COMPONENT NOT IN STOCK"}</h2>
                                    <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
                                        {isRTL
                                            ? "لا توجد قطع غيار مدرجة لهذا الموديل في مستودعاتنا العامة. يمكنك تقديم طلب بحث مخصص عبر شبكة خبرائنا وكلاء كيا/تويوتا."
                                            : "No spare parts are currently listed for this model in our general inventory. You can submit a custom sourcing request via our expert network."
                                        }
                                    </p>
                                    <Link href="/concierge">
                                        <button className="btn-gold px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-accent-gold/20 flex items-center gap-3 mx-auto">
                                            {isRTL ? "تقديم طلب بحث خاص" : "SUBMIT SOURCE REQUEST"}
                                            <Zap className="w-4 h-4" />
                                        </button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {parts.map((part, idx) => (
                                        <motion.div
                                            key={part.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group relative"
                                        >
                                            <div className="glass-card bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 hover:border-accent-gold/40 transition-all duration-700">
                                                <div className="relative aspect-square mb-6 rounded-2xl overflow-hidden bg-white/5 border border-white/5">
                                                    <img src={part.img} alt={part.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[7px] font-black uppercase tracking-widest">{part.condition}</div>
                                                </div>
                                                <div className="space-y-4">
                                                    <span className="text-[8px] font-black text-accent-gold uppercase tracking-[0.3em]">{part.brand}</span>
                                                    <h3 className="text-lg font-black uppercase tracking-tight leading-tight min-h-[3rem] group-hover:text-accent-gold transition-colors">{part.name}</h3>
                                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                                        <div className="text-xl font-black gradient-text-gold">{Number(part.price).toLocaleString()} <span className="text-[10px] text-white/30 truncate uppercase">SAR</span></div>
                                                        <Link href={`/parts/${part.id}`} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-accent-gold hover:text-black transition-all">
                                                            <ArrowUpRight className="w-4 h-4" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* STYLES */}
            <style jsx global>{`
                .glass-card {
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                    backdrop-filter: blur(15px);
                    -webkit-backdrop-filter: blur(15px);
                }
                .font-display { font-family: 'Outfit', sans-serif; }
            `}</style>
        </div>
    );
}
