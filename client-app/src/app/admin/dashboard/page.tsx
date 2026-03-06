'use client';

import { motion } from "framer-motion";
import {
    Activity,
    PlusCircle,
    Car,
    Layers,
    Gavel,
    Users,
    Bell,
    ShoppingCart,
    Settings,
    Shield,
    Search,
    LogOut,
    Menu,
    X,
    FileText,
    Share2,
    MessageCircle,
    Tag,
    TrendingUp,
    Mail,
    ChevronLeft,
    Radio
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import DashboardBackdrop from "@/components/DashboardBackdrop";
import ParticleBackground from "@/components/ParticleBackground";
import LiveNotificationsList from "@/components/LiveNotificationsList";

interface DashboardStats {
    totalCars?: number;
    totalUsers?: number;
    runningAuctions?: number;
    totalOrders?: number;
    totalRevenue?: number;
    pendingOrders?: number;
    totalParts?: number;
    totalBrands?: number;
    newContacts?: number;
}

interface AuditLogEntry {
    target: string;
    action: string;
    description: string;
    createdAt: string;
    user?: {
        name: string;
        email: string;
    };
}

export default function AdminDashboard() {
    const { t, lang, isRTL, toggleLanguage } = useLanguage();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.auth.logout();
        } catch (err) {
            console.error("Logout failed on server", err);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('hm_token');
                localStorage.removeItem('hm_user_role');
                localStorage.removeItem('hm_user_name');
            }
            router.push('/login');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentActivities, setRecentActivities] = useState<AuditLogEntry[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [summaryRes, activitiesRes] = await Promise.all([
                    api.analytics.getSummary(),
                    api.analytics.getActivities(5)
                ]);

                if (summaryRes.success) {
                    setStats(summaryRes.stats);
                }
                if (activitiesRes.success) {
                    setRecentActivities(activitiesRes.activities);
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err);
                setError(isRTL ? "تعذر تحميل البيانات" : "Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('hm_token');
            const roleKey = localStorage.getItem('hm_user_role');
            // أيضاً نقرأ الدور من hm_user إذا لم يكن hm_user_role موجوداً
            let userRole = roleKey;
            if (!userRole) {
                try {
                    const userData = JSON.parse(localStorage.getItem('hm_user') || '{}');
                    userRole = userData.role || null;
                } catch { userRole = null; }
            }
            if (!token || !userRole) {
                router.push('/login');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const adminStats = [
        { label: t('activeInventory'), val: stats?.totalCars || "...", sub: isRTL ? "السيارات والقطع" : "Cars & Components", icon: Car, color: "text-cinematic-neon-blue", shadow: "shadow-[0_0_20px_rgba(0,240,255,0.3)]" },
        { label: t('totalUsers'), val: stats?.totalUsers || "...", sub: isRTL ? "العملاء حول العالم" : "Global Clients", icon: Users, color: "text-cinematic-neon-red", shadow: "shadow-[0_0_20px_rgba(255,0,60,0.3)]" },
        { label: t('urgentAlerts'), val: stats?.runningAuctions || "0", sub: isRTL ? "المزادات الجارية" : "Live Events", icon: Bell, color: "text-cinematic-neon-yellow", shadow: "shadow-[0_0_20px_rgba(252,238,10,0.3)]" },
        { label: isRTL ? 'إجمالي الإيرادات' : 'REVENUE', val: stats?.totalRevenue ? `${(stats.totalRevenue / 1000).toFixed(0)}K` : "0", sub: isRTL ? "إجمالي المبيعات" : "Total Revenue", icon: FileText, color: "text-white", shadow: "shadow-[0_0_20px_rgba(255,255,255,0.1)]" },
    ];

    const quickActions = [
        { icon: PlusCircle, label: t('addCar'), href: '/admin/cars', accent: 'bg-cinematic-neon-blue/20 text-cinematic-neon-blue' },
        { icon: Gavel, label: t('createAuction'), href: '/admin/auctions', accent: 'bg-cinematic-neon-red/20 text-cinematic-neon-red' },
        { icon: Radio, label: isRTL ? 'المعرض المباشر' : 'LIVE SHOWROOM', href: '/admin/live-auctions', accent: 'bg-cinematic-neon-red/30 text-cinematic-neon-red shadow-[0_0_15px_rgba(255,0,60,0.3)]' },
        { icon: Layers, label: isRTL ? 'قطع الغيار' : 'SPARE PARTS', href: '/admin/parts', accent: 'bg-cinematic-neon-yellow/20 text-cinematic-neon-yellow' },
        { icon: ShoppingCart, label: isRTL ? 'الطلبات' : 'ORDERS', href: '/admin/orders', accent: 'bg-white/10 text-white' },
        { icon: Users, label: isRTL ? 'إدارة الأعضاء' : 'MEMBER DIR', href: '/admin/users', accent: 'bg-white/10 text-white' },
        { id: 'contact', icon: Mail, label: isRTL ? 'استفسارات الموقع' : 'INQUIRIES', href: '/admin/contact', accent: 'bg-cinematic-neon-red/20 text-cinematic-neon-red' },
        { icon: MessageCircle, label: isRTL ? 'المحادثات المباشرة' : 'DIRECT CHATS', href: '/admin/messages', accent: 'bg-cinematic-neon-blue/20 text-cinematic-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.3)]' },
        { icon: TrendingUp, label: isRTL ? 'التقارير' : 'REPORTS', href: '/admin/reports', accent: 'bg-green-400/20 text-green-400' },
        { icon: Tag, label: t('brands'), href: '/admin/brands', accent: 'bg-cinematic-neon-yellow/30 text-cinematic-neon-yellow shadow-[0_0_15px_rgba(252,238,10,0.3)]' },
        { icon: Settings, label: t('settings'), href: '/admin/settings', accent: 'bg-white/5 text-white/40' },
    ];

    const sidebarItems = [
        { id: 'overview', icon: Activity, label: isRTL ? 'المركزية' : 'MAINFRAME', href: '/admin/dashboard' },
        { id: 'inventory', icon: Car, label: isRTL ? 'المخزون' : 'INVENTORY', href: '/admin/cars' },
        { id: 'live-showroom', icon: Radio, label: isRTL ? 'المعرض المباشر' : 'LIVE SHOW', href: '/admin/live-auctions' },
        { id: 'parts', icon: Layers, label: isRTL ? 'قطع الغيار' : 'PARTS', href: '/admin/parts' },
        { id: 'auctions', icon: Gavel, label: isRTL ? 'المزادات' : 'AUCTIONS', href: '/admin/auctions' },
        { id: 'brands', icon: Tag, label: t('brands'), href: '/admin/brands' },
        { id: 'orders', icon: ShoppingCart, label: isRTL ? 'الطلبات' : 'ORDERS', href: '/admin/orders' },
        { id: 'users', icon: Users, label: isRTL ? 'المستخدمون' : 'DIRECTORY', href: '/admin/users' },
        { id: 'contact', icon: Mail, label: isRTL ? 'الاستفسارات' : 'INQUIRIES', href: '/admin/contact' },
        { id: 'messages', icon: MessageCircle, label: isRTL ? 'المحادثات' : 'CHATS', href: '/admin/messages' },
        { id: 'reports', icon: TrendingUp, label: isRTL ? 'التقارير' : 'REPORTS', href: '/admin/reports' },
        { id: 'notifications', icon: Bell, label: isRTL ? 'الإشعارات' : 'ALERTS', href: '/admin/notifications' },
        { id: 'social', icon: Share2, label: t('social'), href: '/admin/social' },
        { id: 'security', icon: Shield, label: isRTL ? 'الأمان والحظر' : 'SECURITY', href: '/admin/security' },
        { id: 'settings', icon: Settings, label: isRTL ? 'الإعدادات' : 'SETTINGS', href: '/admin/settings' },
    ];

    if (!mounted) return null;

    const getActivityIcon = (target: string) => {
        switch (target) {
            case 'Car': return Car;
            case 'Auction': return Gavel;
            case 'Order': return ShoppingCart;
            case 'User': return Users;
            case 'Brand': return Tag;
            case 'SparePart': return Layers;
            default: return Activity;
        }
    };

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'CREATE': return { color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10' };
            case 'UPDATE': return { color: 'text-cinematic-neon-yellow', bg: 'bg-cinematic-neon-yellow/10' };
            case 'DELETE': return { color: 'text-cinematic-neon-red', bg: 'bg-cinematic-neon-red/10' };
            case 'LOGIN': return { color: 'text-green-400', bg: 'bg-green-400/10' };
            default: return { color: 'text-white', bg: 'bg-white/10' };
        }
    };

    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return isRTL ? 'الآن' : 'Now';
        if (minutes < 60) return `${minutes}${isRTL ? 'د' : 'm ago'}`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}${isRTL ? 'س' : 'h ago'}`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-cinematic-neon-red selection:text-white">

            <DashboardBackdrop />
            <ParticleBackground />

            {/* --- ADMIN SIDEBAR --- */}
            <aside className={cn(
                "fixed top-0 bottom-0 z-[100] transition-all duration-500 bg-black/40 border-white/5 backdrop-blur-3xl flex flex-col items-center py-10 justify-between",
                isRTL ? "right-0 border-l" : "left-0 border-r",
                isSidebarOpen ? "w-64" : "w-0 lg:w-40 overflow-hidden lg:overflow-visible shadow-2xl"
            )}>
                <Link href="/" className="mb-10">
                    <div className="w-16 h-16 rounded-full border-2 border-cinematic-neon-red flex items-center justify-center shadow-[0_0_20px_rgba(255,0,60,0.3)] shrink-0 group hover:rotate-12 transition-all">
                        <span className="text-3xl font-black italic text-cinematic-neon-red tracking-tighter">HM</span>
                    </div>
                </Link>

                <div className="flex-1 flex flex-col gap-6 w-full px-4 overflow-y-auto scrollbar-hide">
                    {sidebarItems.map((item) => (
                        <Link href={item.href} key={item.id}>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex flex-col items-center gap-3 group transition-all w-full py-4 rounded-2xl relative",
                                    pathname === item.href ? "text-cinematic-neon-red bg-white/5 shadow-inner" : "text-white/20 hover:text-white hover:bg-white/[0.02]"
                                )}
                            >
                                <item.icon className={cn("w-10 h-10 lg:w-11 lg:h-11 shrink-0 transition-transform group-hover:scale-110", pathname === item.href && "drop-shadow-[0_0_15px_rgba(255,0,60,1)]")} />
                                <span className="text-[12px] lg:text-[13px] font-black uppercase tracking-[0.1em] lg:tracking-[0.12em] text-center leading-tight">{item.label}</span>
                                {pathname === item.href && <motion.div layoutId="activeInd" className="absolute left-0 top-0 bottom-0 w-[3px] bg-cinematic-neon-red" />}
                            </button>
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-12 w-full items-center pb-8">
                    <button onClick={toggleLanguage} className="text-white/20 hover:text-white transition-colors p-4 uppercase text-[14px] font-black border border-white/5 bg-white/5 rounded-lg active:scale-95">
                        {lang}
                    </button>
                    <button onClick={handleLogout} className="btn-glow-red flex items-center gap-4 px-8 py-4 rounded-xl border border-white/10 text-white/80 hover:text-white transition-all">
                        <LogOut className="w-7 h-7 text-cinematic-neon-red" />
                        <span className="text-[13px] font-black uppercase tracking-[0.2em]">{isRTL ? "تسجيل الخروج" : "LOG OUT"}</span>
                    </button>
                </div>
            </aside>

            {/* --- MOBILE ADMIN HEADER --- */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[90] bg-black/80 backdrop-blur-3xl border-b border-cinematic-neon-red/10 px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cinematic-neon-red shadow-[0_0_10px_rgba(255,0,60,0.8)]" />
                    <div className="text-xl font-black italic tracking-tighter uppercase shrink-0">ADMIN <span className="text-cinematic-neon-red">ROOT</span></div>
                </div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white">
                    {isSidebarOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* --- MAIN MAIN BATTLESTATION --- */}
            <main className={cn(
                "min-h-screen relative z-10 py-28 lg:py-12 px-6 sm:px-12 lg:px-20 transition-all duration-500",
                isRTL ? "lg:pr-48" : "lg:pl-48"
            )}>

                {/* Header HUD */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20 border-b border-white/5 pb-16">
                    <div className="space-y-6 w-full lg:w-auto">

                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] mb-4 text-center text-glow-white">
                            {isRTL ? (
                                <span className="inline-block mx-auto px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.06] text-white font-black tracking-[0.1em] not-italic text-center ring-1 ring-white/10 hover:ring-cinematic-neon-red/40 transition-all hover:scale-[1.02] shadow-[0_0_25px_rgba(255,0,60,0.25)] bg-gradient-to-r from-white/[0.06] via-white/[0.02] to-white/[0.06] backdrop-blur-sm">
                                    لوحة التحكم
                                </span>
                            ) : (
                                <>GOLDEN <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">CONTROL</span></>
                            )}
                        </h1>
                        <div className="flex items-center gap-6 text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">
                            <Link href="/" className="hover:text-white transition-all flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-cinematic-neon-red/40 rounded-xl">
                                <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} /> {isRTL ? "المنصة الرئيسية" : "MAIN TERMINAL"}
                            </Link>
                            <div className="w-[1px] h-4 bg-white/10" />
                            <span className="text-cinematic-neon-red/80 tracking-widest">{isRTL ? "بروتوكول الإدارة" : "SECURE ADMIN PROTOCOL"}</span>
                        </div>
                        {error && (
                            <div className="mt-6 p-4 rounded-xl border border-cinematic-neon-red/30 bg-cinematic-neon-red/10 text-white/80 text-[10px] font-black uppercase tracking-widest">
                                {error}
                            </div>
                        )}
                        <div className="relative group w-full mt-6">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-6" : "left-6")} />
                            <input
                                type="text"
                                placeholder={isRTL ? "بحث في السجلات..." : "SEARCH RECORDS..."}
                                className={cn(
                                    "bg-white/[0.03] border border-white/10 rounded-full py-5 text-[10px] font-black tracking-[0.2em] text-white/60 focus:outline-none focus:border-cinematic-neon-red/40 transition-all w-full focus-visible:ring-2 focus-visible:ring-cinematic-neon-red/30",
                                    isRTL ? "pr-14 pl-8 text-right" : "pl-14 pr-8 text-left"
                                )}
                            />
                        </div>
                    </div>

                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
                    {loading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="glass-card p-10 md:p-12 bg-white/[0.02] border-white/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-white/[0.01]" />
                                <div className="relative z-10 space-y-6">
                                    <div className="p-5 rounded-2xl bg-white/5 w-16 h-16 shadow-xl animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-10 bg-white/10 rounded-md animate-pulse" />
                                        <div className="h-3 bg-white/5 rounded-md animate-pulse w-3/4" />
                                        <div className="h-2 bg-white/5 rounded-md animate-pulse w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        adminStats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-10 md:p-12 bg-white/[0.01] border-white/5 relative group cursor-default overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0">
                                    <stat.icon className="w-24 h-24" />
                                </div>
                                <div className="relative z-10 space-y-6">
                                    <div className={cn("p-5 rounded-2xl bg-white/5 w-fit shadow-xl transition-all", stat.color, stat.shadow)}>
                                        <stat.icon className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-7xl font-black tracking-tighter text-white drop-shadow-2xl">{stat.val}</div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[13px] font-black text-white uppercase italic tracking-[0.1em]">{stat.label}</span>
                                            <span className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-bold">{stat.sub}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={cn("absolute bottom-0 left-0 h-[3px] w-0 bg-white group-hover:w-full transition-all duration-700", stat.color.replace('text-', 'bg-'))} />
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 lg:gap-12">

                    <div className="xl:col-span-2 space-y-12">

                        {/* Quick Actions Grid */}
                        <div className="glass-card p-10 md:p-14 bg-white/[0.01] border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cinematic-neon-red/5 blur-[100px] pointer-events-none" />
                            <div className="flex items-center gap-5 mb-12">
                                <div className="h-[2px] w-12 bg-cinematic-neon-red" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white">{isRTL ? "أدوات السيطرة" : "CONTROL TERMINAL"}</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {quickActions.map((action, i) => (
                                    <Link key={i} href={action.href}>
                                        <motion.div
                                            whileHover={{ scale: 1.05, y: -5 }}
                                            whileTap={{ scale: 0.95 }}
                                            className={cn(
                                                "p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-6 text-center group cursor-pointer transition-all relative",
                                                "bg-white/[0.02] hover:bg-white/[0.05] hover:border-cinematic-neon-red/20 shadow-2xl"
                                            )}
                                        >
                                            {action.id === 'contact' && stats?.newContacts && stats.newContacts > 0 && (
                                                <div className="absolute top-6 right-6 w-8 h-8 bg-cinematic-neon-red rounded-full flex items-center justify-center text-[10px] font-black shadow-[0_0_15px_rgba(255,0,60,1)] animate-pulse">
                                                    {stats.newContacts}
                                                </div>
                                            )}
                                            <div className={cn("p-5 rounded-2xl transition-all group-hover:scale-125 duration-500", action.accent)}>
                                                <action.icon className="w-8 h-8" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed italic">{action.label}</span>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Live Alerts & Recent Activity */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Live Notifications from Sockets */}
                            <div className="glass-card p-10 md:p-14 bg-white/[0.01] border-white/5 relative overflow-hidden">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-[2px] w-12 bg-cinematic-neon-red" />
                                        <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white">{isRTL ? 'تنبيهات مباشرة' : 'LIVE ALERTS'}</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-cinematic-neon-red animate-pulse" />
                                        <span className="text-[9px] font-black text-cinematic-neon-red uppercase tracking-widest">Real-time</span>
                                    </div>
                                </div>
                                <LiveNotificationsList isRTL={isRTL} />
                            </div>

                            {/* Recent Activity (Dynamic from Audit Logs) */}
                            <div className="glass-card p-10 md:p-14 bg-white/[0.01] border-white/5 relative overflow-hidden">
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="h-[2px] w-12 bg-cinematic-neon-yellow" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white">{isRTL ? 'آخر الأنشطة' : 'RECENT ACTIVITY'}</h2>
                                </div>
                                {/* Activity Log */}
                                <div className="space-y-5">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
                                        ))
                                    ) : recentActivities.length === 0 ? (
                                        <div className="text-center py-10 text-white/20 text-[10px] uppercase font-black tracking-widest">
                                            {isRTL ? 'لا يوجد أنشطة مؤخراً' : 'NO RECENT ACTIVITY'}
                                        </div>
                                    ) : (
                                        recentActivities.map((activity, i) => {
                                            const Icon = getActivityIcon(activity.target);
                                            const { color, bg } = getActivityColor(activity.action);
                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-center gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                                                >
                                                    <div className={cn("p-4 rounded-xl shrink-0", bg)}>
                                                        <Icon className={cn("w-6 h-6", color)} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[12px] font-black uppercase tracking-wider text-white/80">{activity.description}</div>
                                                        <div className="text-[10px] text-white/30 truncate font-bold">
                                                            {activity.user?.name || (isRTL ? 'النظام' : 'System')} • {activity.action}
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] text-white/20 font-black shrink-0 italic">{timeAgo(activity.createdAt)}</div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Admin Sidebar Widgets */}
                    <div className="space-y-12">





                        {/* Load & Performance Monitor */}
                        <div className="glass-card p-12 bg-white/[0.01] border-white/5 space-y-8">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-5">
                                <Activity className="w-6 h-6 text-cinematic-neon-blue" /> {isRTL ? "أداء النظام" : "CORE PERFORMANCE"}
                            </h2>
                            <div className="h-32 flex items-end gap-1.5 px-2">
                                {[4, 7, 3, 9, 5, 8, 10, 6, 4, 9, 12, 8, 5].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h * 8}%` }}
                                        transition={{ delay: i * 0.05, duration: 1.5, ease: "easeOut" }}
                                        className="flex-1 bg-cinematic-neon-blue/20 rounded-t-md group relative"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-cinematic-neon-blue opacity-0 group-hover:opacity-100 transition-opacity rounded-t-md" />
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
                                <div className="flex justify-between text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">
                                    <span>Latency: 14ms</span>
                                    <span className="text-cinematic-neon-blue">Peak Efficiency</span>
                                </div>
                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: "94%" }}
                                        transition={{ duration: 2, delay: 1 }}
                                        className="h-full bg-gradient-to-r from-cinematic-neon-blue to-white"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>



            </main>

            {/* Side HUD Lines Decorative */}
            <div className={cn(
                "fixed top-32 w-24 md:w-32 flex justify-center pointer-events-none transition-all hidden lg:flex",
                isRTL ? "left-0 rotate-180" : "right-0"
            )}>
                <div className="w-[1px] h-96 bg-gradient-to-b from-cinematic-neon-red via-transparent to-transparent opacity-40 shadow-[0_0_20px_rgba(255,0,60,0.5)]" />
            </div>

        </div>
    );
}
