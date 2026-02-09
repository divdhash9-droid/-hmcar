'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Car,
    Gavel,
    ShoppingBag,
    Heart,
    TrendingUp,
    Clock,
    ArrowRight,
    Zap,
    Activity,
    Package,
    FileText,
    LogOut,
    Bell,
    MessageCircle,
    User,
    Settings,
    ShieldCheck,
    Cpu,
    LayoutGrid
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
        <div className={cn("relative min-h-screen bg-black text-white font-sans", isRTL && "rtl")}>
            <Navbar />

            {/* Background Atmosphere */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-luxury-gold/10 via-black to-black opacity-40" />
                <div className="bg-grid-overlay opacity-10" />
            </div>

            <div className="relative z-10 pt-24 flex">

                {/* Sidebar */}
                <aside className={cn(
                    "hidden lg:flex flex-col w-80 min-h-[calc(100vh-6rem)] bg-white/[0.01] p-8",
                    isRTL ? "border-l border-white/5" : "border-r border-white/5"
                )}>
                    {/* Navigation Stream */}
                    <nav className="space-y-3 mb-8 w-full flex-1">
                        {sideMenuItems.map((item, i) => (
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
                                    <item.icon className={cn("w-5 h-5", item.active ? "text-black" : "text-white/20 group-hover:text-luxury-gold")} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">{item.label}</span>
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
                        <div className="p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-luxury-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            <div className={cn("flex items-center gap-5 mb-6 relative z-10", isRTL && "flex-row-reverse text-right")}>
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-luxury-gold to-white/20 flex items-center justify-center text-2xl font-black text-black shrink-0 shadow-2xl">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-lg truncate uppercase italic tracking-tighter text-white">
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

                            <div className="flex gap-3 relative z-10">
                                <Link href="/profile" className="flex-1 py-3 text-center text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all duration-500">
                                    {isRTL ? 'الملف' : 'PROFILE'}
                                </Link>
                                <Link href="/client/settings" className="flex-1 py-3 text-center text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 rounded-xl hover:bg-white hover:text-black transition-all duration-500">
                                    {isRTL ? 'إعدادات' : 'SETTINGS'}
                                </Link>
                            </div>
                        </div>

                        {/* Termination Protocol */}
                        <button
                            onClick={handleLogout}
                            className={cn(
                                "flex items-center gap-5 p-5 w-full rounded-2xl text-cinematic-neon-red/40 hover:text-white hover:bg-cinematic-neon-red transition-all duration-500",
                                isRTL && "flex-row-reverse text-right"
                            )}
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">{isRTL ? 'خروج آمن' : 'SECURE LOGOUT'}</span>
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
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase italic relative inline-block">
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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 relative z-10">
                        {statCards.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-luxury-gold/20 transition-all duration-700 group hover:bg-white/[0.04] relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className={cn("p-4 rounded-2xl w-fit mb-6", stat.bg)}>
                                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                                </div>
                                <div className="text-4xl font-black tracking-tighter mb-2 italic group-hover:scale-110 transition-transform duration-700 origin-left">{stat.value}</div>
                                <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black group-hover:text-white transition-colors">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <section className="relative z-10">
                        <div className={cn("flex items-center gap-4 mb-10", isRTL && "flex-row-reverse")}>
                            <Zap className="w-5 h-5 text-luxury-gold animate-pulse" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/60">
                                {isRTL ? 'الارتباطات السريعة' : 'NEURAL_SHORTCUTS'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                            {quickActions.map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -10 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={cn(
                                            "p-8 rounded-[2rem] border border-white/5 flex flex-col items-center gap-6 text-center group cursor-pointer transition-all duration-700 bg-white/[0.01] hover:bg-white/[0.06] hover:border-luxury-gold/30",
                                            action.glow
                                        )}
                                    >
                                        <div className={cn("p-6 rounded-2xl transition-all duration-700 group-hover:bg-white group-hover:text-black", action.bg)}>
                                            <action.icon className={cn("w-8 h-8", action.color, "group-hover:text-black")} />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-black uppercase tracking-[0.3em] group-hover:text-luxury-gold transition-colors">{action.label}</div>
                                            <div className="text-[8px] text-white/20 uppercase tracking-[0.4em] font-bold group-hover:text-white/40 transition-colors uppercase italic">{action.subtitle}</div>
                                        </div>
                                    </motion.div>
                                </Link>
                            ))}
                        </div>
                    </section>

                </main>
            </div>
        </div>
    );
}
