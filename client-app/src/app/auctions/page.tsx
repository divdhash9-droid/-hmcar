'use client';

/**
 * صفحة المزادات (Auctions Page)
 * تعرض جميع جلسات المزايدة المتاحة للمستخدم.
 * تنقسم الجلسات إلى:
 * 1. مباشر (LIVE): مزادات تجري في الوقت الحالي.
 * 2. المعرض (SHOWROOM): سيارات معروضة للمزايدة يدوياً.
 * 3. قادمة (UPCOMING): مزادات ستبدأ قريباً.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Gavel, AlertCircle, Radio, Car } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useSettings } from "@/lib/SettingsContext";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function Auctions() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { isLoggedIn } = useAuth();
    const [activeTab, setActiveTab] = useState('LIVE');
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    const normalizeImage = (src?: string) => (typeof src === 'string' ? src.trim() : '');

    useEffect(() => {
        // تحميل البيانات بناءً على التبويب المختار (LIVE, SHOWROOM, UPCOMING)
        const loadData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'SHOWROOM') {
                    // جلب المزادات المباشرة اليدوية من قاعدة البيانات
                    const data = await api.liveAuctions.list();
                    if (data.success) setAuctions(data.data || []);
                } else {
                    // الحالات الصحيحة للـ API: 'live' للمباشر و 'upcoming' للقادم
                    const status = activeTab === 'LIVE' ? 'live' : 'upcoming';
                    const data = await api.auctions.list({ status });
                    if (data.success) setAuctions(data.data || []);
                }

            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [activeTab]);

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-[1500px] mx-auto">
                <ClientPageHeader
                    title={isRTL ? "المزادات" : "AUCTIONS"}
                    subtitle={activeTab === 'SHOWROOM' ? (isRTL ? "المعرض المباشر" : "LIVE SHOWROOM") : (isRTL ? "بث مباشر" : "LIVE FEED")}
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
                                <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase italic">
                                    {activeTab === 'SHOWROOM' ? (isRTL ? "المعرض المباشر" : "SHOW SHOWROOM") : (isRTL ? "المزادات" : "AUCTIONS")}
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
                                    onClick={() => setActiveTab('SHOWROOM')}
                                    className={cn(
                                        "px-8 py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-400 flex items-center gap-3",
                                        activeTab === 'SHOWROOM'
                                            ? "bg-cinematic-neon-blue text-black shadow-lg"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <Gavel className="w-3.5 h-3.5" />
                                    {isRTL ? "المعرض" : "SHOWROOM"}
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

            <main className="relative z-10 pt-16 pb-32 px-6 max-w-[1500px] mx-auto">
                <div className="grid grid-cols-1 gap-8">
                    <AnimatePresence mode="popLayout">
                        {auctions.map((item, i) => (
                            <motion.div key={item._id || item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                                className="group obsidian-card overflow-hidden flex flex-col lg:flex-row"
                            >
                                {activeTab === 'SHOWROOM' ? (
                                    <>
                                        <div className="lg:w-[40%] h-64 lg:h-auto overflow-hidden relative">
                                            {(() => {
                                                const imageKey = `${item._id || item.id}-live`;
                                                const imageSrc = normalizeImage((item.cars && item.cars[0]?.images?.[0]) || '');
                                                const showFallback = !imageSrc || imageErrors[imageKey];
                                                return showFallback ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                                        <div className="text-center">
                                                            <Car className="w-10 h-10 text-white/15 mx-auto mb-2" />
                                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">No Image</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={imageSrc}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                        alt=""
                                                        onError={() => setImageErrors(prev => ({ ...prev, [imageKey]: true }))}
                                                    />
                                                );
                                            })()}
                                            {item.status === 'live' && (
                                                <div className="absolute top-6 left-6 px-4 py-2 bg-cinematic-neon-red/20 border border-cinematic-neon-red/40 rounded-lg backdrop-blur-md">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-cinematic-neon-red animate-pulse" /> {isRTL ? 'بث مباشر' : 'LIVE'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-10 space-y-8 flex flex-col justify-center">
                                            <div>
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter">{item.title}</h2>
                                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-2">{item.externalUrl ? 'Linked to Official Platform' : 'Internal Selection'}</p>
                                            </div>
                                            <div className="flex items-center gap-10">
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1">Cars Available</span>
                                                    <div className="text-2xl font-black">{item.cars?.length || 0}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] block mb-1">Session Status</span>
                                                    <div className={cn("text-xs font-black uppercase tracking-widest", item.status === 'live' ? "text-cinematic-neon-blue" : "text-white/40")}>{item.status}</div>
                                                </div>
                                            </div>
                                            <div 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (!isLoggedIn) router.push('/login');
                                                    else router.push(`/auctions/live/${item._id || item.id}`);
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <button className="w-full lg:w-fit px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] hover:bg-cinematic-neon-blue hover:text-black hover:shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all">
                                                    {isRTL ? 'دخول قاعة العرض' : 'ENTER SHOWROOM'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="lg:w-[40%] h-64 lg:h-auto overflow-hidden relative">
                                            {(() => {
                                                const imageKey = `${item._id || item.id}-classic`;
                                                const imageSrc = normalizeImage(item.car?.images?.[0]);
                                                const showFallback = !imageSrc || imageErrors[imageKey];
                                                return showFallback ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                                        <div className="text-center">
                                                            <Car className="w-10 h-10 text-white/15 mx-auto mb-2" />
                                                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">No Image</div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={imageSrc}
                                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                        alt=""
                                                        onError={() => setImageErrors(prev => ({ ...prev, [imageKey]: true }))}
                                                    />
                                                );
                                            })()}
                                            {item.status === 'running' && (
                                                <div className="absolute top-6 left-6 flex items-center gap-2.5 px-3.5 py-1.5 bg-black/60 backdrop-blur-xl border border-accent-red/30 rounded-lg">
                                                    <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
                                                    <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em]">{isRTL ? "مباشر" : "LIVE"}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-10 space-y-8 flex flex-col justify-center">
                                            <div>
                                                <span className="text-[10px] font-black text-accent-red/60 uppercase tracking-widest">{item.car?.make}</span>
                                                <h2 className="text-4xl font-black italic uppercase tracking-tighter">{item.car?.title}</h2>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 border-y border-white/5 py-6">
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase mb-1 block">Current Bid</span>
                                                    <div className="text-2xl font-black text-cinematic-neon-blue">{formatPrice(Number(item.currentBid))}</div>
                                                </div>
                                                <div>
                                                    <span className="text-[9px] font-black text-white/20 uppercase mb-1 block">Ends On</span>
                                                    <div className="text-xl font-black">{new Date(item.endsAt).toLocaleDateString()}</div>
                                                </div>
                                                <div className="hidden lg:block">
                                                    <span className="text-[9px] font-black text-white/20 uppercase mb-1 block">Total Bids</span>
                                                    <div className="text-xl font-black">{item.bidders || 0}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <div 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (!isLoggedIn) router.push('/login');
                                                        else router.push(`/auctions/${item.id}`);
                                                    }}
                                                    className="flex-1 cursor-pointer"
                                                >
                                                    <button className="w-full py-5 bg-accent-red text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.5em] hover:shadow-[0_0_30px_rgba(232,54,78,0.4)] transition-all">
                                                        {isRTL ? 'زايد الآن' : 'PLACE BID'}
                                                    </button>
                                                </div>
                                                <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10">WATCH</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {auctions.length === 0 && !loading && (
                    <div className="py-32 text-center space-y-4">
                        <AlertCircle className="w-16 h-16 text-white/5 mx-auto" />
                        <h3 className="text-2xl font-black text-white/20 uppercase tracking-widest">{isRTL ? "لا توجد نتائج حالياً" : "NO SESSIONS FOUND"}</h3>
                    </div>
                )}

                {loading && (
                    <div className="space-y-8">
                        {[1, 2].map((n) => (
                            <div key={n} className="h-80 rounded-3xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
