'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Car,
    Gavel,
    ShoppingBag,
    Heart,
    Zap,
    Activity,
    Package,
    FileText,
    LogOut,
    Bell,
    MessageCircle,
    User,
    Settings,
    LayoutGrid
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardBackdrop from "@/components/DashboardBackdrop";
import ParticleBackground from "@/components/ParticleBackground";

export default function ClientDashboard() {
    const { t, isRTL } = useLanguage();
    const { user, isLoggedIn, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const userName = user?.name || (isRTL ? 'العميل' : 'Guest');
    const userRole = user?.role || 'buyer';

    useEffect(() => {
        // جلب بيانات لوحة التحكم
        const loadDashboard = async () => {
            try {
                const data = await api.dashboard.getClientData();
                if (data.success) {
                    setDashboardData(data.data);
                }
            } catch (err) {
                console.error("Failed to load dashboard", err);
            } finally {
                setLoading(false);
            }
        };

        // Only load after auth is ready
        if (!authLoading) {
            loadDashboard();
        }
    }, [authLoading]);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const stats = dashboardData?.stats || {
        availableCars: 127,
        liveAuctions: 8,
        myOrders: 3,
        pendingOrders: 1,
        myFavorites: 12
    };

    const quickActions = [
        {
            icon: Car,
            label: isRTL ? 'تصفح السيارات' : 'BROWSE CARS',
            subtitle: isRTL ? 'ابحث عن السيارة المناسبة' : 'Find your perfect ride',
            href: '/showroom',
            color: 'text-cinematic-neon-blue',
            bg: 'bg-cinematic-neon-blue/10',
            glow: 'shadow-[0_0_30px_rgba(0,240,255,0.2)]'
        },
        {
            icon: Gavel,
            label: isRTL ? 'المزادات المباشرة' : 'LIVE AUCTIONS',
            subtitle: isRTL ? 'شارك في المزايدة الآن' : 'Join the bidding now',
            href: '/auctions',
            color: 'text-cinematic-neon-red',
            bg: 'bg-cinematic-neon-red/10',
            glow: 'shadow-[0_0_30px_rgba(255,0,60,0.2)]'
        },
        {
            icon: Heart,
            label: isRTL ? 'المفضلة' : 'FAVORITES',
            subtitle: isRTL ? 'تابع السيارات المحفوظة' : 'Track saved vehicles',
            href: '/favorites',
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            glow: 'shadow-[0_0_30px_rgba(236,72,153,0.2)]'
        },
        {
            icon: Package,
            label: isRTL ? 'قطع الغيار' : 'SPARE PARTS',
            subtitle: isRTL ? 'تسوق القطع الأصلية' : 'Shop genuine parts',
            href: '/parts',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            glow: 'shadow-[0_0_20px_rgba(52,211,153,0.2)]'
        },
        {
            icon: FileText,
            label: isRTL ? 'خدمة VIP' : 'VIP CONCIERGE',
            subtitle: isRTL ? 'اطلب سيارتك الخاصة' : 'Request bespoke vehicle',
            href: '/concierge',
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]'
        },
    ];

    const sideMenuItems = [
        { icon: LayoutGrid, label: isRTL ? 'لوحة التحكم' : 'Dashboard', href: '/client/dashboard', active: true },
        { icon: ShoppingBag, label: isRTL ? 'طلباتي' : 'My Orders', href: '/orders' },
        { icon: Heart, label: isRTL ? 'المفضلة' : 'Favorites', href: '/favorites' },
        { icon: Bell, label: isRTL ? 'الإشعارات' : 'Notifications', href: '/notifications' },
        { icon: MessageCircle, label: isRTL ? 'الرسائل' : 'Messages', href: '/messages' },
        { icon: User, label: isRTL ? 'الملف الشخصي' : 'Profile', href: '/profile' },
        { icon: Settings, label: isRTL ? 'الإعدادات' : 'Settings', href: '/client/settings' },
    ];
    const navBeforeIcons = sideMenuItems.slice(0, 2);
    const navAfterIcons = sideMenuItems.slice(2);

    const statCards = [
        {
            label: isRTL ? 'مزادات مباشرة' : 'LIVE AUCTIONS',
            value: stats.liveAuctions,
            icon: Activity,
            color: 'text-cinematic-neon-red',
            bg: 'bg-cinematic-neon-red/10',
            trend: '+12%'
        },
        {
            label: isRTL ? 'سيارات متاحة' : 'AVAILABLE CARS',
            value: stats.availableCars,
            icon: Car,
            color: 'text-cinematic-neon-blue',
            bg: 'bg-cinematic-neon-blue/10',
            trend: '+8%'
        },
        {
            label: isRTL ? 'طلباتي' : 'MY ORDERS',
            value: stats.myOrders,
            icon: ShoppingBag,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            trend: ''
        },
        {
            label: isRTL ? 'المفضلة' : 'FAVORITES',
            value: stats.myFavorites,
            icon: Heart,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            trend: ''
        },
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className={cn("relative min-h-screen text-white font-sans overflow-x-hidden", isRTL && "rtl")}>
            <Navbar />

            {/* Enhanced Space Background with Parallax and 3D Elements */}
            <DashboardBackdrop />
            
            <div className="relative z-10 pt-24 flex min-h-screen">

                {/* Sidebar - Enhanced Glassmorphism */}
                <aside className={cn(
                    "hidden lg:flex flex-col w-72 mr-6 min-h-[calc(100vh-6rem)] bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 rounded-r-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden",
                    isRTL ? "border-l border-r-0 rounded-l-3xl rounded-r-none ml-6 mr-0" : "border-r border-l-0"
                )}>
                    <div className="absolute inset-0 -z-10 pointer-events-none">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-luxury-gold/10 rounded-full blur-[60px]" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cinematic-neon-blue/10 rounded-full blur-[60px]" />
                    </div>

                    {/* Dashboard Logo Section */}
                    <div className="flex items-center gap-3 mb-8 px-2">
                        <div className="w-10 h-10 bg-luxury-gold/20 rounded-lg flex items-center justify-center border border-luxury-gold/30 shadow-[0_0_15px_rgba(201,169,110,0.3)]">
                             <span className="font-black text-luxury-gold text-xl drop-shadow-md">HM</span>
                        </div>
                        <span className="font-black text-2xl text-white tracking-tighter italic drop-shadow-lg">
                            HM <span className="text-luxury-gold">CAR</span>
                        </span>
                    </div>

                    {/* Navigation Stream */}
                    <nav className="space-y-3 mb-8 w-full flex-1">
                        {navBeforeIcons.map((item, i) => (
                            <Link key={i} href={item.href}>
                                <motion.div
                                    whileHover={{ x: isRTL ? -8 : 8 }}
                                    className={cn(
                                        "flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 group",
                                        isRTL && "flex-row-reverse text-right",
                                        item.active
                                            ? "bg-white text-black shadow-2xl"
                                            : "hover:bg-white/5 text-white/30 hover:text-white"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:shadow-[0_0_18px_rgba(201,169,110,0.35)] transition-all">
                                        <item.icon className={cn("w-5 h-5", item.active ? "text-black" : "text-white/30 group-hover:text-luxury-gold")} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">{item.label}</span>
                                    {item.active && (
                                        <div className={cn("ml-auto", isRTL && "mr-auto ml-0")}>
                                            <Activity className="w-4 h-4 text-black/20" />
                                        </div>
                                    )}
                                </motion.div>
                            </Link>
                        ))}

                        <div className="mt-4 space-y-3">
                            {quickActions.map((qa, i) => (
                                <Link key={i} href={qa.href}>
                                    <motion.div
                                        whileHover={{ x: isRTL ? -8 : 8 }}
                                        className={cn(
                                            "flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 group",
                                            isRTL && "flex-row-reverse text-right",
                                            "hover:bg-white/5 text-white/30 hover:text-white"
                                        )}
                                    >
                                        <qa.icon className={cn("w-6 h-6 text-white/20 group-hover:text-luxury-gold")} />
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">{qa.label}</span>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>

                        {navAfterIcons.map((item, i) => (
                            <Link key={i} href={item.href}>
                                <motion.div
                                    whileHover={{ x: isRTL ? -8 : 8 }}
                                    className={cn(
                                        "flex items-center gap-5 p-5 rounded-2xl transition-all duration-500 group",
                                        isRTL && "flex-row-reverse text-right",
                                        item.active
                                            ? "bg-white text-black shadow-2xl"
                                            : "hover:bg-white/5 text-white/30 hover:text-white"
                                    )}
                                >
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:shadow-[0_0_18px_rgba(201,169,110,0.35)] transition-all">
                                        <item.icon className={cn("w-5 h-5", item.active ? "text-black" : "text-white/30 group-hover:text-luxury-gold")} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">{item.label}</span>
                                    {item.active && (
                                        <div className={cn("ml-auto", isRTL && "mr-auto ml-0")}>
                                            <Activity className="w-4 h-4 text-black/20" />
                                        </div>
                                    )}
                                </motion.div>
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom Section: User Identity & Logout */}
                    <div className="mt-auto w-full space-y-4">
                        {/* User Identity Module */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/8 relative overflow-hidden group">

                            <div className={cn("flex items-center gap-3 mb-4 relative z-10", isRTL && "flex-row-reverse text-right")}>
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-luxury-gold to-white/20 flex items-center justify-center text-lg font-black text-black shrink-0 shadow-lg">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-sm truncate uppercase italic tracking-tighter text-white">
                                        {userName}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-luxury-gold animate-pulse" />
                                        <span className="text-[9px] text-luxury-gold uppercase tracking-[0.2em] font-black">
                                            {userRole === 'buyer' ? (isRTL ? 'عضوية النخبة' : 'ELITE MEMBER') : userRole}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 relative z-10 hidden" />
                        </div>

                        {/* Termination Protocol */}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "btn-glow-red flex items-center gap-3 p-5 w-full rounded-2xl border border-white/10 text-white/80 hover:text-white transition-all",
                                isRTL && "flex-row-reverse text_right"
                            )}
                        >
                            <LogOut className="w-5 h-5 text-cinematic-neon-red" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isRTL ? 'تسجيل الخروج' : 'LOG OUT'}</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8 max-w-6xl">

                    {/* Standard Elite Header */}
                    <header className="mb-12 flex items-end justify-between">
                        <motion.div
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={cn("space-y-4", isRTL && "text-right ml-auto")}
                        >
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic relative inline-block text-glow-white">
                                <span className="relative z-10">{isRTL ? 'لوحة القيادة' : 'DASHBOARD'}</span>
                                <span className="absolute -bottom-2 right-0 w-1/3 h-1 bg-luxury-gold rounded-full" />
                            </h1>
                            <p className="text-sm text-white/40 font-medium uppercase tracking-widest gap-2 flex items-center">
                                {isRTL ? (
                                    <>
                                        <span>نظرة عامة على النظام</span>
                                        <Activity className="w-3 h-3 text-luxury-gold" />
                                    </>
                                ) : (
                                    <>
                                        <Activity className="w-3 h-3 text-luxury-gold" />
                                        <span>SYSTEM OVERVIEW</span>
                                    </>
                                )}
                            </p>
                        </motion.div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10 pt-8">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-[2rem] bg-white/[0.03] backdrop-blur-md border border-white/10 hover:border-luxury-gold/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] group relative overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className={cn("p-4 rounded-2xl w-fit mb-4 bg-white/5 border border-white/10 backdrop-blur-sm group-hover:bg-white/10 transition-colors", stat.bg.replace('bg-', 'text-').replace('/10', ''))}>
                                    <stat.icon className={cn("w-6 h-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]", stat.color)} />
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-2 italic text-white drop-shadow-lg">{stat.value}</div>
                                <div className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold group-hover:text-white transition-colors">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions moved to sidebar icons; keep main clean */}

                    {/* Activity section removed per request */}

                    <section className="mt-16 relative z-10">
                        <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                            <Car className="w-5 h-5 text-luxury-gold" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/60">
                                {isRTL ? "توصيات لك" : "RECOMMENDED FOR YOU"}
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {(dashboardData?.recommended || [
                                { id: "c1", title: "Lexus LX600 2024", price: 620000, img: "https://images.unsplash.com/photo-1619767886558-efdc259b66a4?q=80&w=1200" },
                                { id: "c2", title: "Porsche 911 Turbo", price: 950000, img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1200" },
                                { id: "c3", title: "Range Rover Sport", price: 480000, img: "https://images.unsplash.com/photo-1520170359211-7ad475a968b6?q=80&w=1200" },
                            ]).map((car: { id?: string; title: string; price: number; img: string }, i: number) => (
                                <Link key={car.id || i} href={`/showroom/${car.id || ""}`}>
                                    <motion.div
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        className="rounded-2xl overflow-hidden border border-white/5 bg-white/[0.01]"
                                    >
                                        <div className="h-48 overflow-hidden">
                                            <motion.img
                                                src={car.img}
                                                alt={car.title}
                                                className="w-full h-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                                                animate={{ x: [0, 8, 0, -8, 0], y: [8, 0, -8, 0, 8] }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                whileHover={{ scale: 1.1 }}
                                            />
                                        </div>
                                        <div className="p-6 flex items-center justify-between">
                                            <div className="text-sm font-black uppercase tracking-tighter line-clamp-1">{car.title}</div>
                                            <div className="text-sm font-black italic">{Number(car.price).toLocaleString()} <span className="text-[10px] opacity-40">SAR</span></div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    <section className="mt-16 relative z-10">
                        <div className={cn("flex items-center gap-4 mb-6", isRTL && "flex-row-reverse")}>
                            <Gavel className="w-5 h-5 text-cinematic-neon-red" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/60">
                                {isRTL ? "مزادات مباشرة" : "LIVE AUCTIONS"}
                            </h2>
                        </div>
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide border border-white/5 rounded-xl p-4 bg-white/[0.02]">
                            {(dashboardData?.auctions || [
                                { id: "a1", label: "Ferrari F8", endsIn: "00:28:35" },
                                { id: "a2", label: "BMW M5", endsIn: "01:12:09" },
                                { id: "a3", label: "G63 AMG", endsIn: "00:07:51" },
                            ]).map((a: { id?: string; label: string; endsIn: string }, i: number) => (
                                <span key={a.id || i} className="inline-block mx-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest">
                                    {a.label} • {a.endsIn}
                                </span>
                            ))}
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}
