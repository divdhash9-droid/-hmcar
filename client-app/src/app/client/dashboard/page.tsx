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
    LayoutGrid,
    Sparkles
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
            href: '/cars',
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
        { icon: Gavel, label: isRTL ? 'مزايداتي' : 'My Bids', href: '/auctions/my-bids' },
        { icon: Heart, label: isRTL ? 'المفضلة' : 'Favorites', href: '/favorites' },
        { icon: Sparkles, label: isRTL ? 'تنبيهاتي الذكية' : 'Smart Alerts', href: '/client/smart-alerts', highlight: true },
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
            glow: 'shadow-[0_0_20px_rgba(255,0,60,0.3)]'
        },
        {
            label: isRTL ? 'سيارات متاحة' : 'AVAILABLE CARS',
            value: stats.availableCars,
            icon: Car,
            color: 'text-cinematic-neon-blue',
            bg: 'bg-cinematic-neon-blue/10',
            glow: 'shadow-[0_0_20px_rgba(0,240,255,0.3)]'
        },
        {
            label: isRTL ? 'طلباتي' : 'MY ORDERS',
            value: stats.myOrders,
            icon: ShoppingBag,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]'
        },
        {
            label: isRTL ? 'المفضلة' : 'FAVORITES',
            value: stats.myFavorites,
            icon: Heart,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            glow: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]'
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
                    "hidden lg:flex flex-col w-80 mr-6 min-h-[calc(100vh-6rem)] bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-6 rounded-r-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden",
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
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:shadow-[0_0_18px_rgba(201,169,110,0.35)] transition-all">
                                        <item.icon className={cn("w-6 h-6", item.active ? "text-black" : "text-white/30 group-hover:text-luxury-gold")} />
                                    </div>
                                    <span className="text-[16px] font-bold tracking-normal">{item.label}</span>
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
                                        <qa.icon className={cn("w-7 h-7 text-white/20 group-hover:text-luxury-gold")} />
                                        <span className="text-[16px] font-bold tracking-normal">{qa.label}</span>
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
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:shadow-[0_0_18px_rgba(201,169,110,0.35)] transition-all">
                                        <item.icon className={cn("w-6 h-6", item.active ? "text-black" : "text-white/30 group-hover:text-luxury-gold")} />
                                    </div>
                                    <span className="text-[16px] font-bold tracking-normal">{item.label}</span>
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
                            <LogOut className="w-6 h-6 text-cinematic-neon-red" />
                            <span className="text-[16px] font-bold tracking-normal">{isRTL ? 'تسجيل الخروج' : 'Log Out'}</span>
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

                    {/* Stats Grid - Floating Capsules */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16 relative z-10">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.1, duration: 0.8 }}
                                className="relative group cursor-default"
                            >
                                <div className={cn(
                                    "relative z-10 p-8 rounded-[2.5rem] bg-white/[0.03] backdrop-blur-2xl border border-white/10 overflow-hidden transition-all duration-700",
                                    "group-hover:translate-y-[-10px] group-hover:border-white/20",
                                    stat.glow
                                )}>
                                    {/* Ambient Glow */}
                                    <div className={cn("absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 rounded-full", stat.bg.replace('bg-', 'bg-'))} />

                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 mb-6 transition-transform duration-700 group-hover:rotate-[360deg]", stat.color)}>
                                        <stat.icon className="w-7 h-7" />
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-5xl font-black italic tracking-tighter text-white">
                                            {stat.value}
                                        </div>
                                        <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/80 transition-colors">
                                            {stat.label}
                                        </div>
                                    </div>
                                </div>
                                {/* Shadow Capsule */}
                                <div className="absolute inset-0 translate-y-4 blur-2xl opacity-20 bg-black -z-10 group-hover:opacity-40 transition-all duration-700" />
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions moved to sidebar icons; keep main clean */}

                    {/* Activity section removed per request */}

                    {/* [[ARABIC_COMMENT]] عرض سيارات المعرض الحقيقية وإخفاء القسم إذا لم تكن هناك سيارات */}
                    {dashboardData?.recentCars && dashboardData.recentCars.length > 0 && (
                        <section className="mt-16 relative z-10">
                            <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                                <Car className="w-5 h-5 text-luxury-gold" />
                                <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-white/60">
                                    {isRTL ? "تشكيلة المعرض الموصى بها" : "RECOMMENDED SHOWROOM CARS"}
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {dashboardData.recentCars.map((car: { id?: string; title: string; price: number; image?: string; img?: string }, i: number) => (
                                    <Link key={car.id || i} href={`/cars/${car.id || ""}`}>
                                        <motion.div
                                            whileHover={{ y: -10 }}
                                            className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02] backdrop-blur-md"
                                        >
                                            <div className="h-64 overflow-hidden relative">
                                                {/* HUD Overlay for Car */}
                                                <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                                    <div className="absolute top-4 left-4 w-10 h-10 border-l border-t border-accent-gold/40" />
                                                    <div className="absolute bottom-4 right-4 w-10 h-10 border-r border-b border-accent-gold/40" />
                                                </div>

                                                <img
                                                    src={car.image || car.img || "/images/placeholder.jpg"}
                                                    alt={car.title}
                                                    className="w-full h-full object-cover grayscale brightness-75 transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 group-hover:brightness-100"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                            </div>
                                            <div className="p-8">
                                                <div className="text-[11px] font-black text-accent-gold uppercase tracking-[0.2em] mb-2">{isRTL ? "موصى به" : "RECOMMENDED"}</div>
                                                <div className="flex items-end justify-between gap-4">
                                                    <div className="text-2xl font-black uppercase tracking-tighter italic line-clamp-1 text-white">{car.title}</div>
                                                    <div className="text-lg font-black italic text-white/90 shrink-0">
                                                        {Number(car.price).toLocaleString()}
                                                        <span className="text-[10px] opacity-40 ml-2">SAR</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    <section className="mt-16 relative z-10">
                        <div className={cn("flex items-center gap-4 mb-6", isRTL && "flex-row-reverse")}>
                            <Gavel className="w-5 h-5 text-cinematic-neon-red" />
                            <h2 className="text-[13px] font-black uppercase tracking-[0.4em] text-white/60">
                                {isRTL ? "مزادات مباشرة" : "LIVE AUCTIONS"}
                            </h2>
                        </div>
                        <div className="overflow-x-auto whitespace-nowrap scrollbar-hide border border-white/5 rounded-xl p-4 bg-white/[0.02]">
                            {(dashboardData?.auctions || [
                                { id: "a1", label: "Ferrari F8", endsIn: "00:28:35" },
                                { id: "a2", label: "BMW M5", endsIn: "01:12:09" },
                                { id: "a3", label: "G63 AMG", endsIn: "00:07:51" },
                            ]).map((a: { id?: string; label: string; endsIn: string }, i: number) => (
                                <span key={a.id || i} className="inline-block mx-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[12px] font-black uppercase tracking-widest">
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
