'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Timer, Gavel, Users, TrendingUp, ChevronRight, Activity, AlertCircle, Sparkles, Radio } from "lucide-react";
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
        <div className="relative min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black">
            <Navbar />

            {/* Atmosphere HUD */}
            <div className="bg-grid-overlay opacity-20" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-red/5 via-black to-black opacity-30" />

                {/* Precision Scanning Line */}
                <motion.div
                    animate={{ y: [-200, 1200] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                />
            </div>

            <main className="relative z-10 pt-48 pb-32 px-6 max-w-[1700px] mx-auto">

                {/* Header Container */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-32">
                    <div className="w-full lg:w-auto">
                        <ClientPageHeader
                            title={isRTL ? "المزادات الحية" : "THE LIVE ARENA"}
                            subtitle={isRTL ? "مصفوفة المنافسة العالمية" : "Global Competition Matrix"}
                            icon={Gavel}
                        />

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-white/40 text-lg md:text-xl font-medium leading-relaxed max-w-xl uppercase tracking-tighter mt-4"
                        >
                            {isRTL
                                ? "انضم إلى ساحة المنافسة العالمية حيث يجتمع الشغف بالهندسة مع القيمة الحقيقية في مزادات حية فائقة الدقة."
                                : "Step into the high-stakes arena where engineering passion meets true value in high-precision real-time auctions."
                            }
                        </motion.p>
                    </div>

                    {/* Elite Tabs */}
                    <div className="flex bg-white/5 p-2 rounded-[2.5rem] border border-white/5 backdrop-blur-3xl animate-reveal shrink-0">
                        <button
                            onClick={() => setActiveTab('LIVE')}
                            className={cn(
                                "px-12 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-4",
                                activeTab === 'LIVE' ? "bg-cinematic-neon-red text-white shadow-[0_10px_40px_rgba(255,0,60,0.3)]" : "text-white/30 hover:text-white"
                            )}
                        >
                            <Radio className={cn("w-4 h-4", activeTab === 'LIVE' && "animate-pulse")} />
                            {isRTL ? "مزادات مباشرة" : "LIVE ARENA"}
                        </button>
                        <button
                            onClick={() => setActiveTab('UPCOMING')}
                            className={cn(
                                "px-12 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all duration-500",
                                activeTab === 'UPCOMING' ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white"
                            )}
                        >
                            {isRTL ? "الجدول الزمني" : "SCHEDULE"}
                        </button>
                    </div>
                </div>

                {/* Auction Stream */}
                <div className="space-y-10">
                    <AnimatePresence mode="popLayout">
                        {auctions.map((auction, i) => (
                            <motion.div
                                key={auction.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.1 }}
                                className="group obsidian-card obsidian-card-hover min-h-[450px] flex flex-col lg:flex-row overflow-hidden"
                            >
                                {/* Media Section */}
                                <div className="relative w-full lg:w-[45%] h-64 lg:h-auto overflow-hidden">
                                    <img
                                        src={auction.car?.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop'}
                                        alt={auction.car?.title}
                                        className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black hidden lg:block" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent lg:hidden" />

                                    {/* Live Pulse Indicator */}
                                    <div className="absolute top-10 left-10 flex items-center gap-4 px-5 py-2.5 bg-black/60 backdrop-blur-2xl border border-cinematic-neon-red/40 rounded-full">
                                        <div className="w-2.5 h-2.5 rounded-full bg-cinematic-neon-red animate-pulse shadow-[0_0_15px_rgba(255,0,60,1)]" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{isRTL ? "بث مباشر" : "LIVE FEED"}</span>
                                    </div>
                                </div>

                                {/* Data Section */}
                                <div className="flex-grow p-10 lg:p-16 flex flex-col justify-center gap-10">
                                    <div className="space-y-4">
                                        <span className="text-[10px] font-black text-cinematic-neon-red/60 tracking-[0.6em] uppercase italic">{auction.car?.make}</span>
                                        <h2 className="text-4xl lg:text-7xl font-black tracking-tighter uppercase italic leading-none line-clamp-1">{auction.car?.title}</h2>
                                    </div>

                                    {/* Stats HUD Matrix */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 py-10 border-y border-white/5">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                <TrendingUp className="w-4 h-4 text-cinematic-neon-red" /> {t('currentBid')}
                                            </div>
                                            <div className="text-3xl lg:text-5xl font-black italic gold-glow">
                                                {Number(auction.currentBid).toLocaleString()} <span className="text-sm font-medium tracking-normal text-white/40 ml-1 italic">SAR</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                <Timer className="w-4 h-4 text-white/40" /> {t('timeLeft')}
                                            </div>
                                            <div className="text-3xl lg:text-4xl font-black text-white italic tracking-widest uppercase">
                                                {new Date(auction.endsAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="space-y-3 hidden md:block">
                                            <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-widest">
                                                <Users className="w-4 h-4 text-white/40" /> {isRTL ? 'نشط' : 'ACTIVE'}
                                            </div>
                                            <div className="text-3xl lg:text-4xl font-black text-white italic tracking-tighter">
                                                {auction.bidders || '0'} <span className="text-xs text-white/20 ml-2">{isRTL ? 'وحدات' : 'UNITS'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                                        <Link href={`/auctions/${auction.id}`} className="w-full sm:flex-1">
                                            <button className="btn-luxury w-full bg-cinematic-neon-red text-white hover:bg-cinematic-neon-red/80 shadow-[0_10px_40px_rgba(255,0,60,0.2)] py-6 rounded-2xl">
                                                <span>{t('bidNow')}</span>
                                                <ChevronRight className={cn("w-4 h-4 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2")} />
                                            </button>
                                        </Link>
                                        <button className="btn-luxury-outline px-12 py-6 rounded-2xl w-full sm:w-auto">
                                            {isRTL ? "مراقبة" : "WATCH"}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Empty State */}
                {auctions.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-48 flex flex-col items-center justify-center text-center space-y-10"
                    >
                        <AlertCircle className="w-24 h-24 text-white/5 animate-pulse" />
                        <div className="space-y-4">
                            <h3 className="text-4xl font-black uppercase italic tracking-tighter opacity-20">{isRTL ? "لا توجد فعاليات نشطة" : "NO ACTIVE COMPETITION"}</h3>
                            <button onClick={() => setActiveTab('UPCOMING')} className="text-[10px] font-black uppercase tracking-[0.5em] text-luxury-gold underline underline-offset-8 decoration-luxury-gold/20 hover:text-white transition-colors cursor-pointer">
                                {isRTL ? 'فتح جدول المواعيد القادمة' : 'Open Upcoming Matrix'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Elite Arena Footer */}
            <footer className="max-w-[1700px] mx-auto px-12 py-32 border-t border-white/5 opacity-40 flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] font-black uppercase tracking-[0.5em]">
                <div className="flex items-center gap-6">
                    <span className="text-cinematic-neon-red text-shadow-neon">{isRTL ? 'بث مباشر للساحة' : 'BATTLE FEED LIVE'}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-cinematic-neon-red animate-pulse" />
                </div>
                <div className="flex gap-12 text-white/30">
                    <span>Terminal Access v4.0.1</span>
                    <span className="hidden sm:block italic">Secure Transmission AES-256</span>
                </div>
            </footer>
        </div>
    );
}
