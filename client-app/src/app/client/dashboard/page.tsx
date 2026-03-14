'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Car,
    Gavel,
    ShoppingBag,
    Heart,
    Package,
    FileText,
    Activity,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Clock,
    Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { useSettings } from "@/lib/SettingsContext";
import { api } from "@/lib/api";
import Link from "next/link";

const rawText = (value: string) => value;

export default function ClientDashboard() {
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { user, isLoading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState<{
        stats?: {
            availableCars: number;
            liveAuctions: number;
            myOrders: number;
            myFavorites: number;
        };
        recentCars?: { id?: string; title: string; image?: string; img?: string; price?: number }[];
        auctions?: { id?: string; label: string; endsIn: string }[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    const userName = user?.name || (isRTL ? 'العميل' : 'Guest');
    const hour = new Date().getHours();
    const greeting = isRTL
        ? (hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور')
        : (hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await api.dashboard.getClientData();
                if (data.success) setDashboardData(data.data);
            } catch (err) {
                console.error("Failed to load dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) loadDashboard();
    }, [authLoading]);

    const stats = dashboardData?.stats || {
        availableCars: 0,
        liveAuctions: 0,
        myOrders: 0,
        myFavorites: 0,
    };

    const statCards = [
        { label: isRTL ? 'سيارات متاحة' : 'Available Cars', value: stats.availableCars, icon: Car, color: '#3b82f6', href: '/cars' },
        { label: isRTL ? 'مزادات مباشرة' : 'Live Auctions', value: stats.liveAuctions, icon: Activity, color: '#ef4444', href: '/auctions' },
        { label: isRTL ? 'طلباتي' : 'My Orders', value: stats.myOrders, icon: ShoppingBag, color: '#c9a96e', href: '/orders' },
        { label: isRTL ? 'المفضلة' : 'Favorites', value: stats.myFavorites, icon: Heart, color: '#ec4899', href: '/favorites' },
    ];

    const quickActions = [
        {
            icon: Car,
            label: isRTL ? 'معرض HM CAR' : 'HM CAR Showroom',
            desc: isRTL ? 'اكتشف أحدث السيارات' : 'Discover latest vehicles',
            href: '/cars',
            color: '#3b82f6',
            bg: 'rgba(59, 130, 246, 0.08)',
        },
        {
            icon: Gavel,
            label: isRTL ? 'المزادات' : 'Live Auctions',
            desc: isRTL ? 'شارك في المزايدة الآن' : 'Join bidding now',
            href: '/auctions',
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.08)',
        },
        {
            icon: Package,
            label: isRTL ? 'قطع الغيار' : 'Spare Parts',
            desc: isRTL ? 'تسوق القطع الأصلية' : 'Shop genuine parts',
            href: '/parts',
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.08)',
        },
        {
            icon: FileText,
            label: isRTL ? 'طلب VIP' : 'VIP Request',
            desc: isRTL ? 'اطلب سيارتك الخاصة' : 'Order your dream car',
            href: '/concierge',
            color: '#c9a96e',
            bg: 'rgba(201, 169, 110, 0.08)',
        },
        {
            icon: Sparkles,
            label: isRTL ? 'تنبيهات ذكية' : 'Smart Alerts',
            desc: isRTL ? 'لا تفوّت عروضاً' : 'Never miss a deal',
            href: '/client/smart-alerts',
            color: '#a78bfa',
            bg: 'rgba(167, 139, 250, 0.08)',
        },
        {
            icon: Heart,
            label: isRTL ? 'المفضلة' : 'Favorites',
            desc: isRTL ? 'السيارات المحفوظة' : 'Saved vehicles',
            href: '/favorites',
            color: '#ec4899',
            bg: 'rgba(236, 72, 153, 0.08)',
        },
    ];

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-10 h-10 border-2 border-cinematic-neon-gold/30 border-t-cinematic-neon-gold rounded-full"
                />
            </div>
        );
    }

    return (
        <div className={cn("min-h-full", isRTL && "rtl")}>
            {/* ── Header ── */}
            <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-4 flex items-start justify-between">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-[12px] text-white/30 font-medium mb-1">{greeting}{rawText(',')}</p>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">{userName} {rawText('👋')}</h1>
                </motion.div>
                
                {/* PWA Notifications Quick Access */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="show-in-app">
                    <Link href="/notifications">
                        <div className="relative p-2.5 bg-white/5 rounded-full border border-white/10 text-white/70 hover:bg-white/10 transition-colors">
                            <Bell className="w-5 h-5" />
                            <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cinematic-neon-red border-2 border-black" />
                        </div>
                    </Link>
                </motion.div>
            </div>

            {/* ── Stats ── */}
            <div className="px-5 lg:px-8 mb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {statCards.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Link href={stat.href}>
                                    <div className="relative p-4 rounded-2xl bg-white/3 border border-white/7 hover:bg-white/5 hover:border-white/10 transition-all group overflow-hidden">
                                        {/* خلفية اللون */}
                                        <div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                            style={{ background: `radial-gradient(circle at top right, ${stat.color}10 0%, transparent 70%)` }}
                                        />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-3">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                    style={{ background: `${stat.color}15` }}
                                                >
                                                    <Icon className="w-4.5 h-4.5" style={{ color: stat.color }} strokeWidth={2} />
                                                </div>
                                                {isRTL
                                                    ? <ArrowLeft className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                                                    : <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 transition-colors" />
                                                }
                                            </div>
                                            <div className="text-2xl font-black text-white mb-0.5" style={{ color: stat.color }}>
                                                {stat.value}
                                            </div>
                                            <div className="text-[11px] text-white/40 font-medium">{stat.label}</div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="px-5 lg:px-8 mb-6">
                <h2 className="text-[11px] font-black text-white/25 uppercase tracking-[0.3em] mb-3">
                    {isRTL ? rawText('إجراءات سريعة') : rawText('Quick Actions')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 + i * 0.05 }}
                            >
                                <Link href={action.href}>
                                    <div
                                        className="p-4 rounded-2xl border border-white/6 hover:border-white/12 transition-all group cursor-pointer"
                                        style={{ background: action.bg }}
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                                            style={{ background: `${action.color}20` }}
                                        >
                                            <Icon className="w-4.5 h-4.5" style={{ color: action.color }} strokeWidth={2} />
                                        </div>
                                        <div className="text-[13px] font-bold text-white/80 group-hover:text-white transition-colors mb-0.5">
                                            {action.label}
                                        </div>
                                        <div className="text-[11px] text-white/30 font-medium">{action.desc}</div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* ── Recent Cars ── */}
            {dashboardData?.recentCars && dashboardData.recentCars.length > 0 && (
                <div className="px-5 lg:px-8 mb-6">
                    <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
                        <h2 className="text-[11px] font-black text-white/25 uppercase tracking-[0.3em]">
                            {isRTL ? rawText('سيارات موصى بها') : rawText('Recommended Cars')}
                        </h2>
                        <Link href="/showroom" className="text-[11px] text-cinematic-neon-gold/70 hover:text-cinematic-neon-gold font-semibold transition-colors flex items-center gap-1">
                            {isRTL ? <><ArrowLeft className="w-3 h-3" /> {rawText('عرض الكل')}</> : <>{rawText('View All')} <ArrowRight className="w-3 h-3" /></>}
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dashboardData.recentCars.slice(0, 3).map((car, i: number) => (
                            <Link key={car.id || i} href={`/showroom/${car.id || ''}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="rounded-2xl overflow-hidden border border-white/6 hover:border-white/12 bg-white/2 group transition-all"
                                >
                                    <div className="h-40 overflow-hidden relative">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={car.image || car.img || '/images/placeholder.jpg'}
                                            alt={car.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                                    </div>
                                    <div className="p-3.5">
                                        <div className="text-[13px] font-bold text-white truncate mb-1">{car.title}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-[12px] text-cinematic-neon-gold font-semibold">
                                                {formatPrice ? formatPrice(Number(car.price || 0)) : `${Number(car.price || 0).toLocaleString()} SAR`}
                                            </div>
                                            {isRTL
                                                ? <ArrowLeft className="w-3.5 h-3.5 text-white/20" />
                                                : <ArrowRight className="w-3.5 h-3.5 text-white/20" />
                                            }
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Live Auctions Ticker ── */}
            {dashboardData?.auctions && dashboardData.auctions.length > 0 && (
                <div className="px-5 lg:px-8 mb-8">
                    <div className={cn("flex items-center justify-between mb-3", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                            <h2 className="text-[11px] font-black text-white/25 uppercase tracking-[0.3em]">
                                {isRTL ? rawText('مزادات مباشرة') : rawText('Live Auctions')}
                            </h2>
                        </div>
                        <Link href="/auctions" className="text-[11px] text-cinematic-neon-gold/70 hover:text-cinematic-neon-gold font-semibold transition-colors flex items-center gap-1">
                            {isRTL ? <><ArrowLeft className="w-3 h-3" /> {rawText('عرض الكل')}</> : <>{rawText('View All')} <ArrowRight className="w-3 h-3" /></>}
                        </Link>
                    </div>
                    <div className="overflow-x-auto scrollbar-hide">
                        <div className="flex gap-2 pb-1">
                            {dashboardData.auctions.map((a, i: number) => (
                                <div
                                    key={a.id || i}
                                    className="shrink-0 px-4 py-2.5 rounded-xl bg-red-400/6 border border-red-400/15 flex items-center gap-2.5"
                                >
                                    <Clock className="w-3 h-3 text-red-400/70" strokeWidth={2} />
                                    <span className="text-[12px] font-bold text-white/70">{a.label}</span>
                                    <span className="text-[11px] text-red-400 font-black">{a.endsIn}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
