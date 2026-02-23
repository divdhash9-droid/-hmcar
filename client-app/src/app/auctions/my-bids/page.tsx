'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Gavel, Trophy, Clock, XCircle, TrendingUp,
    ChevronLeft, ChevronRight,
    Flame
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";

type BidStatus = 'won' | 'lost' | 'active' | 'outbid';

interface MyBid {
    id: string;
    auction: {
        id: string;
        title: string;
        image: string;
        endDate: string;
        basePrice: number;
    };
    myAmount: number;
    currentHighest: number;
    status: BidStatus;
    bidTime: string;
    totalBids: number;
}

export default function MyBidsPage() {
    const { isRTL } = useLanguage();
    const [bids, setBids] = useState<MyBid[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | BidStatus>('all');

    useEffect(() => {
        loadBids();
    }, []);

    const loadBids = async () => {
        try {
            const res = await api.bids?.myBids?.();
            if (res?.success) {
                setBids(res.data);
            } else throw new Error();
        } catch {
            // Mock data
            setBids([
                {
                    id: '1',
                    auction: {
                        id: 'a1',
                        title: 'FERRARI F8 TRIBUTO 2023',
                        image: 'https://images.unsplash.com/photo-1586464831261-c3b7f68ea2b1?q=80&w=1200',
                        endDate: new Date(Date.now() - 3600000).toISOString(),
                        basePrice: 850000,
                    },
                    myAmount: 920000,
                    currentHighest: 920000,
                    status: 'won',
                    bidTime: new Date(Date.now() - 7200000).toISOString(),
                    totalBids: 34,
                },
                {
                    id: '2',
                    auction: {
                        id: 'a2',
                        title: 'LAMBORGHINI URUS 2024',
                        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200',
                        endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
                        basePrice: 1200000,
                    },
                    myAmount: 1250000,
                    currentHighest: 1350000,
                    status: 'outbid',
                    bidTime: new Date(Date.now() - 1800000).toISOString(),
                    totalBids: 61,
                },
                {
                    id: '3',
                    auction: {
                        id: 'a3',
                        title: 'PORSCHE 911 TURBO S 2024',
                        image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200',
                        endDate: new Date(Date.now() + 3600000 * 5).toISOString(),
                        basePrice: 700000,
                    },
                    myAmount: 750000,
                    currentHighest: 750000,
                    status: 'active',
                    bidTime: new Date(Date.now() - 600000).toISOString(),
                    totalBids: 22,
                },
                {
                    id: '4',
                    auction: {
                        id: 'a4',
                        title: 'BMW M8 COMPETITION 2023',
                        image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200',
                        endDate: new Date(Date.now() - 86400000 * 5).toISOString(),
                        basePrice: 480000,
                    },
                    myAmount: 500000,
                    currentHighest: 520000,
                    status: 'lost',
                    bidTime: new Date(Date.now() - 86400000 * 5).toISOString(),
                    totalBids: 45,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const filtered = filter === 'all' ? bids : bids.filter(b => b.status === filter);

    const stats = {
        total: bids.length,
        won: bids.filter(b => b.status === 'won').length,
        active: bids.filter(b => b.status === 'active').length,
        outbid: bids.filter(b => b.status === 'outbid').length,
        lost: bids.filter(b => b.status === 'lost').length,
    };

    const getStatusMeta = (status: BidStatus) => ({
        won: { label: isRTL ? 'فزت' : 'WON', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/30', icon: Trophy },
        active: { label: isRTL ? 'مشارك' : 'ACTIVE', color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30', icon: Flame },
        outbid: { label: isRTL ? 'تم تجاوزك' : 'OUTBID', color: 'text-cinematic-neon-yellow', bg: 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30', icon: TrendingUp },
        lost: { label: isRTL ? 'خسرت' : 'LOST', color: 'text-cinematic-neon-red', bg: 'bg-cinematic-neon-red/10 border-cinematic-neon-red/30', icon: XCircle },
    }[status]);

    const formatCountdown = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - Date.now();
        if (diff <= 0) return isRTL ? 'انتهى' : 'Ended';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        return `${h}h ${m}m`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-14 h-14 border-4 border-cinematic-neon-red border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,0,60,0.05),_transparent_55%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto">

                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
                    <Link href="/auctions" className="inline-flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                            {isRTL ? 'المزادات' : 'AUCTIONS'}
                        </span>
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="flex items-center gap-5">
                        <div className="p-4 rounded-2xl bg-cinematic-neon-red/10 border border-cinematic-neon-red/20">
                            <Gavel className="w-8 h-8 text-cinematic-neon-red" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                {isRTL ? 'مزايداتي' : 'MY BIDS'}
                            </h1>
                            <p className="text-white/40 text-[11px] uppercase tracking-[0.3em] mt-1 font-bold">
                                {isRTL ? 'سجل مشاركاتك في المزادات' : 'YOUR AUCTION PARTICIPATION HISTORY'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
                    {[
                        { key: 'all', label: isRTL ? 'الكل' : 'ALL', value: stats.total, color: 'text-white' },
                        { key: 'won', label: isRTL ? 'فزت' : 'WON', value: stats.won, color: 'text-green-400' },
                        { key: 'active', label: isRTL ? 'مشارك' : 'ACTIVE', value: stats.active, color: 'text-cinematic-neon-blue' },
                        { key: 'outbid', label: isRTL ? 'تجاوزوك' : 'OUTBID', value: stats.outbid, color: 'text-cinematic-neon-yellow' },
                        { key: 'lost', label: isRTL ? 'خسرت' : 'LOST', value: stats.lost, color: 'text-cinematic-neon-red' },
                    ].map((s) => (
                        <motion.button
                            key={s.key}
                            onClick={() => setFilter(s.key as any)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            className={cn(
                                "glass-card p-6 bg-white/[0.01] border-white/5 text-center transition-all",
                                filter === s.key && "border-cinematic-neon-red/30 bg-cinematic-neon-red/5"
                            )}
                        >
                            <div className={cn("text-3xl font-black tracking-tighter mb-2", s.color)}>{s.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/50">{s.label}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Bids List */}
                <AnimatePresence mode="popLayout">
                    {filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32">
                            <Gavel className="w-24 h-24 text-white/10 mx-auto mb-8" />
                            <h3 className="text-2xl font-black uppercase tracking-tight text-white/40">
                                {isRTL ? 'لا توجد مزايدات' : 'NO BIDS FOUND'}
                            </h3>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {filtered.map((bid, i) => {
                                const meta = getStatusMeta(bid.status);
                                const StatusIcon = meta.icon;
                                const isLeading = bid.myAmount >= bid.currentHighest && bid.status === 'active';
                                return (
                                    <motion.div
                                        key={bid.id}
                                        layout
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: i * 0.08 }}
                                        className={cn(
                                            "glass-card bg-white/[0.01] border-white/5 overflow-hidden hover:border-white/10 transition-all",
                                            bid.status === 'won' && "border-green-400/20 shadow-[0_0_30px_rgba(74,222,128,0.08)]",
                                            bid.status === 'outbid' && "border-cinematic-neon-yellow/10",
                                        )}
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                                            {/* Image */}
                                            <div className="lg:col-span-3 relative overflow-hidden h-52 lg:h-auto">
                                                <img
                                                    src={bid.auction.image}
                                                    alt={bid.auction.title}
                                                    className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 to-transparent" />
                                                {bid.status === 'won' && (
                                                    <div className="absolute top-4 left-4 bg-green-400 text-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                                        <Trophy className="w-3 h-3" />
                                                        {isRTL ? 'فائز!' : 'WINNER!'}
                                                    </div>
                                                )}
                                                {bid.status === 'outbid' && (
                                                    <div className="absolute top-4 left-4 bg-cinematic-neon-yellow text-black px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                        {isRTL ? 'تجاوزوك!' : 'OUTBID!'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Info */}
                                            <div className="lg:col-span-9 p-8 flex flex-col justify-between gap-6">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter mb-2">
                                                            {bid.auction.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 flex-wrap">
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                                <Clock className="w-3 h-3 inline mr-1" />
                                                                {formatCountdown(bid.auction.endDate)}
                                                            </span>
                                                            <span className="text-white/20">·</span>
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                                {bid.totalBids} {isRTL ? 'مزايدة' : 'bids'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className={cn(
                                                        "px-4 py-2 rounded-xl border flex items-center gap-2 text-[11px] font-black uppercase tracking-wider",
                                                        meta.bg, meta.color
                                                    )}>
                                                        <StatusIcon className="w-4 h-4" />
                                                        {meta.label}
                                                    </div>
                                                </div>

                                                {/* Bid amounts */}
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">
                                                            {isRTL ? 'مزايدتي' : 'MY BID'}
                                                        </div>
                                                        <div className={cn(
                                                            "text-2xl font-black italic",
                                                            isLeading ? "text-green-400" : "text-white"
                                                        )}>
                                                            {Number(bid.myAmount).toLocaleString()}
                                                            <span className="text-xs font-bold ml-1 opacity-60">SAR</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">
                                                            {isRTL ? 'أعلى مزايدة' : 'HIGHEST BID'}
                                                        </div>
                                                        <div className="text-2xl font-black italic text-cinematic-neon-blue">
                                                            {Number(bid.currentHighest).toLocaleString()}
                                                            <span className="text-xs font-bold ml-1 opacity-60">SAR</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">
                                                            {isRTL ? 'وقت المزايدة' : 'BID TIME'}
                                                        </div>
                                                        <div className="text-sm font-bold text-white/60">
                                                            {new Date(bid.bidTime).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
                                                                month: 'short', day: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Difference bar (outbid) */}
                                                {bid.status === 'outbid' && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-widest">
                                                            <span>{isRTL ? 'أنت متأخر بـ:' : 'You are behind by:'}</span>
                                                            <span className="text-cinematic-neon-yellow">
                                                                {(bid.currentHighest - bid.myAmount).toLocaleString()} SAR
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-cinematic-neon-yellow rounded-full transition-all duration-700"
                                                                data-width={Math.min((bid.myAmount / bid.currentHighest) * 100, 100)}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* CTA */}
                                                <div className="flex gap-4 flex-wrap">
                                                    {bid.status === 'outbid' && (
                                                        <Link href={`/auctions/${bid.auction.id}`}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                className="px-6 py-3 bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 text-cinematic-neon-red rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-cinematic-neon-red/20 transition-all"
                                                            >
                                                                {isRTL ? '⚡ زايد مجدداً' : '⚡ BID AGAIN'}
                                                            </motion.button>
                                                        </Link>
                                                    )}
                                                    {bid.status === 'active' && (
                                                        <Link href={`/auctions/${bid.auction.id}`}>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                className="px-6 py-3 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 text-cinematic-neon-blue rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-cinematic-neon-blue/20 transition-all"
                                                            >
                                                                {isRTL ? 'متابعة المزاد' : 'VIEW AUCTION'}
                                                            </motion.button>
                                                        </Link>
                                                    )}
                                                    {bid.status === 'won' && (
                                                        <Link href="/orders">
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                                className="px-6 py-3 bg-green-400/10 border border-green-400/30 text-green-400 rounded-xl text-[11px] font-black uppercase tracking-wide hover:bg-green-400/20 transition-all"
                                                            >
                                                                {isRTL ? '📦 عرض الطلب' : '📦 VIEW ORDER'}
                                                            </motion.button>
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
