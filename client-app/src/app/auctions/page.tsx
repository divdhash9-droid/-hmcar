'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Timer, Gavel, Users, TrendingUp, ChevronRight, AlertCircle, Radio } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function Auctions() {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState('LIVE');
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAuctions = async () => {
            setLoading(true);
            try {
                const status = activeTab === 'LIVE' ? 'running' : 'scheduled';
                const data = await api.auctions.list({ status });
                if (data.success) {
                    setAuctions(data.data || []);
                }
            } catch (err) {
                console.error("Failed to load auctions", err);
            } finally {
                setLoading(false);
            }
        };
        loadAuctions();
    }, [activeTab]);

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-[1500px] mx-auto">
                <ClientPageHeader
                    title={isRTL ? "المزادات" : "AUCTIONS"}
                    subtitle={isRTL ? "بث مباشر" : "LIVE FEED"}
                    icon={Gavel}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[85vh] md:h-[60vh] overflow-hidden mt-8 mx-6 rounded-3xl border border-white/5">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.45) contrast(1.25) saturate(1.1)' }}
                >
                    <source src="/videos/video_2026-02-07_22-24-50.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />

                {/* Animated scan line */}
                <motion.div
                    animate={{ y: [-50, 800] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-accent-red/30 to-transparent pointer-events-none"
                />
                <div className="video-grain" />

                {/* Hero Content */}
                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-[1500px] mx-auto w-full px-6 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8"
                        >
                            <div>
                                <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-accent-red/80 block mb-3">
                                    {isRTL ? "بث مباشر" : "LIVE FEED"}
                                </span>
                                <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase">
                                    {isRTL ? "المزادات" : "AUCTIONS"}
                                </h1>
                            </div>

                            {/* Tabs */}
                            <div className="flex bg-white/[0.04] p-1.5 rounded-xl border border-white/5 backdrop-blur-xl">
                                <button
                                    onClick={() => setActiveTab('LIVE')}
                                    className={cn(
                                        "px-8 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-400 flex items-center gap-3",
                                        activeTab === 'LIVE'
                                            ? "bg-accent-red text-white shadow-[0_8px_25px_rgba(232,54,78,0.25)]"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <Radio className={cn("w-3.5 h-3.5", activeTab === 'LIVE' && "animate-pulse")} />
                                    {isRTL ? "مباشر" : "LIVE"}
                                </button>
                                <button
                                    onClick={() => setActiveTab('UPCOMING')}
                                    className={cn(
                                        "px-8 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-400",
                                        activeTab === 'UPCOMING'
                                            ? "bg-white text-black shadow-lg"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    {isRTL ? "قادمة" : "UPCOMING"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-8" />
                <div className="orb orb-red w-[500px] h-[500px] top-0 left-0 animate-breathe opacity-20" />
            </div>

            <main className="relative z-10 pt-16 pb-32 px-6 max-w-[1500px] mx-auto">

                {/* ── AUCTION CARDS ── */}
                <div className="space-y-8">
                    <AnimatePresence mode="popLayout">
                        {auctions.map((auction, i) => (
                            <motion.div
                                key={auction.id}
                                layout
                                initial={{ opacity: 0, y: 25 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ delay: i * 0.1 }}
                                className="group obsidian-card obsidian-card-hover flex flex-col lg:flex-row overflow-hidden"
                            >
                                {/* Image */}
                                <div className="relative w-full lg:w-[40%] h-60 lg:h-auto min-h-[320px] overflow-hidden">
                                    <img
                                        src={auction.car?.images?.[0] || ''}
                                        alt={auction.car?.title}
                                        className="w-full h-full object-cover grayscale-[30%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105 opacity-70 group-hover:opacity-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0a] hidden lg:block" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent lg:hidden" />

                                    {/* Live Badge */}
                                    <div className="absolute top-6 left-6 flex items-center gap-2.5 px-3.5 py-1.5 bg-black/60 backdrop-blur-xl border border-accent-red/30 rounded-lg">
                                        <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse shadow-[0_0_10px_rgba(232,54,78,0.8)]" />
                                        <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">{isRTL ? "مباشر" : "LIVE"}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center gap-8">
                                    <div>
                                        <span className="text-[9px] font-bold text-accent-red/50 tracking-[0.4em] uppercase">{auction.car?.make}</span>
                                        <h2 className="text-3xl lg:text-5xl font-black tracking-[-0.03em] uppercase leading-tight mt-2 line-clamp-1">
                                            {auction.car?.title}
                                        </h2>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-y border-white/5">
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
                                                <TrendingUp className="w-3.5 h-3.5 text-accent-red" /> {t('currentBid')}
                                            </div>
                                            <div className="text-2xl lg:text-3xl font-black gold-glow">
                                                {Number(auction.currentBid).toLocaleString()}
                                                <span className="text-xs text-white/30 ml-1.5 font-medium">SAR</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
                                                <Timer className="w-3.5 h-3.5 text-white/40" /> {t('timeLeft')}
                                            </div>
                                            <div className="text-xl lg:text-2xl font-black text-white/70 tracking-wide">
                                                {new Date(auction.endsAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="hidden sm:block">
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">
                                                <Users className="w-3.5 h-3.5 text-white/40" /> {isRTL ? 'المشاركين' : 'BIDDERS'}
                                            </div>
                                            <div className="text-xl lg:text-2xl font-black text-white/70">
                                                {auction.bidders || '0'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <Link href={`/auctions/${auction.id}`} className="flex-1">
                                            <button className="w-full btn-luxury bg-accent-red text-white py-5 rounded-xl shadow-[0_8px_30px_rgba(232,54,78,0.2)]">
                                                <span>{t('bidNow')}</span>
                                                <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                            </button>
                                        </Link>
                                        <button className="btn-luxury-outline px-8 py-5 rounded-xl">
                                            {isRTL ? "مراقبة" : "WATCH"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* ── EMPTY STATE ── */}
                {auctions.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 flex flex-col items-center justify-center text-center space-y-8"
                    >
                        <AlertCircle className="w-16 h-16 text-white/5" />
                        <div className="space-y-3">
                            <h3 className="text-3xl font-black uppercase tracking-tight text-white/10">
                                {isRTL ? "لا توجد مزادات نشطة" : "NO ACTIVE AUCTIONS"}
                            </h3>
                            <button
                                onClick={() => setActiveTab('UPCOMING')}
                                className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent-gold/60 hover:text-accent-gold transition-colors"
                            >
                                {isRTL ? 'عرض القادمة' : 'VIEW UPCOMING'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── LOADING ── */}
                {loading && (
                    <div className="space-y-8">
                        {[1, 2].map((n) => (
                            <div key={n} className="h-[350px] rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
