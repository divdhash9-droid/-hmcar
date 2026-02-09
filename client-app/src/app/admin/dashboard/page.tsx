'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    BarChart3,
    Users,
    Car,
    Gavel,
    Layers,
    Bell,
    ShoppingCart,
    Settings,
    Activity,
    PlusCircle,
    Database,
    Lock,
    ChevronLeft,
    Search,
    LogOut,
    AlertCircle,
    CheckCircle2,
    Clock,
    Menu,
    X,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";

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

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await api.analytics.getSummary();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (err) {
                console.error("Failed to load stats", err);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const adminStats = [
        { label: t('activeInventory'), val: stats?.totalCars || "...", sub: isRTL ? "السيارات والقطع" : "Cars & Components", icon: Car, color: "text-cinematic-neon-blue", shadow: "shadow-[0_0_20px_rgba(0,240,255,0.3)]" },
        { label: t('totalUsers'), val: stats?.totalUsers || "...", sub: isRTL ? "العملاء حول العالم" : "Global Clients", icon: Users, color: "text-cinematic-neon-red", shadow: "shadow-[0_0_20px_rgba(255,0,60,0.3)]" },
        { label: t('urgentAlerts'), val: stats?.runningAuctions || "0", sub: isRTL ? "المزادات الجارية" : "Live Events", icon: Bell, color: "text-cinematic-neon-yellow", shadow: "shadow-[0_0_20px_rgba(252,238,10,0.3)]" },
        { label: isRTL ? 'طلبات خاصة' : 'CONCIERGE', val: stats?.totalOrders || "0", sub: isRTL ? "طلبات VIP" : "VIP Requests", icon: FileText, color: "text-white", shadow: "shadow-[0_0_20px_rgba(255,255,255,0.1)]" },
    ];

    const quickActions = [
        { icon: PlusCircle, label: t('addCar'), href: '/admin/cars', accent: 'bg-cinematic-neon-blue/20 text-cinematic-neon-blue' },
        { icon: Gavel, label: t('createAuction'), href: '/admin/auctions', accent: 'bg-cinematic-neon-red/20 text-cinematic-neon-red' },
        { icon: Layers, label: isRTL ? 'قطع الغيار' : 'SPARE PARTS', href: '/admin/parts', accent: 'bg-cinematic-neon-yellow/20 text-cinematic-neon-yellow' },
        { icon: FileText, label: isRTL ? 'طلبات الكونسيرج' : 'VIP REQUESTS', href: '/admin/orders', accent: 'bg-white/10 text-white' },
        { icon: Users, label: isRTL ? 'إدارة الأعضاء' : 'MEMBER DIR', href: '/admin/users', accent: 'bg-white/10 text-white' },
        { icon: Bell, label: t('notifications'), href: '/admin/notifications', accent: 'bg-cinematic-neon-yellow/20 text-cinematic-neon-yellow' },
        { icon: ShoppingCart, label: t('orders'), href: '/admin/orders', accent: 'bg-white/10 text-white' },
        { icon: Settings, label: t('settings'), href: '/admin/settings', accent: 'bg-white/5 text-white/40' },
    ];

    const sidebarItems = [
        { id: 'overview', icon: Activity, label: isRTL ? 'المركزية' : 'MAINFRAME', href: '/admin/dashboard' },
        { id: 'inventory', icon: Car, label: isRTL ? 'المخزون' : 'INVENTORY', href: '/admin/cars' },
        { id: 'parts', icon: Layers, label: isRTL ? 'قطع الغيار' : 'PARTS', href: '/admin/parts' },
        { id: 'auctions', icon: Gavel, label: isRTL ? 'المزادات' : 'AUCTIONS', href: '/admin/auctions' },
        { id: 'users', icon: Users, label: isRTL ? 'المستخدمون' : 'DIRECTORY', href: '/admin/users' },
        { id: 'security', icon: Lock, label: isRTL ? 'الأمان' : 'SECURITY', href: '/admin/notifications' },
    ];

    if (!mounted) return null;

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden selection:bg-cinematic-neon-red selection:text-white">

            {/* Background HUD Grid */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.03)_1px,transparent_1px)] bg-[size:50px:50px] sm:bg-[size:100px:100px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cinematic-neon-red/5 rounded-full animate-spin-slow" />
            </div>

            {/* --- ADMIN SIDEBAR --- */}
            <aside className={cn(
                "fixed top-0 bottom-0 z-[100] transition-all duration-500 bg-black/40 border-white/5 backdrop-blur-3xl flex flex-col items-center py-10 justify-between",
                isRTL ? "right-0 border-l" : "left-0 border-r",
                isSidebarOpen ? "w-64" : "w-0 lg:w-32 overflow-hidden lg:overflow-visible shadow-2xl"
            )}>
                <Link href="/" className="mb-8">
                    <div className="w-14 h-14 rounded-full border-2 border-cinematic-neon-red flex items-center justify-center shadow-[0_0_20px_rgba(255,0,60,0.3)] shrink-0 group hover:rotate-12 transition-all">
                        <span className="text-2xl font-black italic text-cinematic-neon-red tracking-tighter">HM</span>
                    </div>
                </Link>

                <div className="flex flex-col gap-10 w-full px-6">
                    {sidebarItems.map((item) => (
                        <Link href={item.href} key={item.id}>
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className={cn(
                                    "flex flex-col items-center gap-2 group transition-all w-full py-4 rounded-2xl relative",
                                    pathname === item.href ? "text-cinematic-neon-red bg-white/5 shadow-inner" : "text-white/20 hover:text-white hover:bg-white/[0.02]"
                                )}
                            >
                                <item.icon className={cn("w-7 h-7 shrink-0 transition-transform group-hover:scale-110", pathname === item.href && "drop-shadow-[0_0_15px_rgba(255,0,60,1)]")} />
                                <span className="text-[7px] font-black uppercase tracking-[0.3em]">{item.label}</span>
                                {pathname === item.href && <motion.div layoutId="activeInd" className="absolute left-0 top-0 bottom-0 w-[2px] bg-cinematic-neon-red" />}
                            </button>
                        </Link>
                    ))}
                </div>

                <div className="flex flex-col gap-8 w-full items-center">
                    <button onClick={toggleLanguage} className="text-white/20 hover:text-white transition-colors p-2 uppercase text-[10px] font-black border border-white/5 bg-white/5 rounded-lg active:scale-95">
                        {lang}
                    </button>
                    <button onClick={handleLogout} className="flex flex-col items-center gap-2 text-white/20 hover:text-cinematic-neon-blue transition-all active:scale-90">
                        <LogOut className="w-6 h-6 shrink-0" />
                        <span className="text-[7px] font-black uppercase tracking-[0.2em]">{isRTL ? "خروج" : "EXIT"}</span>
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
                isRTL ? "lg:pr-40" : "lg:pl-40"
            )}>

                {/* Header HUD */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-20 border-b border-white/5 pb-16">
                    <div className="space-y-6 w-full lg:w-auto">
                        <div className="flex items-center gap-4">
                            <ShieldCheck className="w-6 h-6 text-cinematic-neon-red" />
                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 italic">System Protocol: Active / Level 10 Root</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-4">
                            {isRTL ? "لوحة" : "GOLDEN"} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? "التحكم الذهبية" : "CONTROL"}</span>
                        </h1>
                        <div className="flex items-center gap-6 text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">
                            <Link href="/" className="hover:text-white transition-all flex items-center gap-3 group">
                                <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} /> {isRTL ? "المنصة الرئيسية" : "MAIN TERMINAL"}
                            </Link>
                            <div className="w-[1px] h-4 bg-white/10" />
                            <span className="text-cinematic-neon-red/80 tracking-widest">{isRTL ? "بروتوكول الإدارة" : "SECURE ADMIN PROTOCOL"}</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-auto">
                            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-6" : "left-6")} />
                            <input
                                type="text"
                                placeholder={isRTL ? "بحث في السجلات..." : "SEARCH RECORDS..."}
                                className={cn(
                                    "bg-white/[0.03] border border-white/10 rounded-full py-5 text-[10px] font-black tracking-[0.2em] text-white/60 focus:outline-none focus:border-cinematic-neon-red/40 transition-all w-full sm:w-80",
                                    isRTL ? "pr-14 pl-8 text-right" : "pl-14 pr-8 text-left"
                                )}
                            />
                        </div>
                        <div className="flex items-center gap-5 bg-white/[0.02] p-2 pr-6 border border-white/5 rounded-full backdrop-blur-3xl w-full sm:w-auto justify-between sm:justify-start">
                            <div className="text-right">
                                <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Master Admin</div>
                                <div className="text-[11px] font-black text-white tracking-[0.1em] italic">AD-9920-LUX</div>
                            </div>
                            <div className="w-14 h-14 rounded-full bg-cinematic-neon-red/10 flex items-center justify-center border border-cinematic-neon-red/20 shadow-[0_0_20px_rgba(255,0,60,0.1)]">
                                <Database className="w-7 h-7 text-cinematic-neon-red" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">
                    {adminStats.map((stat, i) => (
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
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">{stat.val}</div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[11px] font-black text-white uppercase italic tracking-[0.1em]">{stat.label}</span>
                                        <span className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-bold">{stat.sub}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={cn("absolute bottom-0 left-0 h-[3px] w-0 bg-white group-hover:w-full transition-all duration-700", stat.color.replace('text-', 'bg-'))} />
                        </motion.div>
                    ))}
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
                                                "p-10 rounded-[2.5rem] border border-white/5 flex flex-col items-center gap-6 text-center group cursor-pointer transition-all",
                                                "bg-white/[0.02] hover:bg-white/[0.05] hover:border-cinematic-neon-red/20 shadow-2xl"
                                            )}
                                        >
                                            <div className={cn("p-5 rounded-2xl transition-all group-hover:scale-125 duration-500", action.accent)}>
                                                <action.icon className="w-8 h-8" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.5em] leading-relaxed italic">{action.label}</span>
                                        </motion.div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* System Logs */}
                        <div className="glass-card p-10 md:p-14 bg-white/[0.01] border-white/5">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 gap-6">
                                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-5">
                                    <Bell className="w-6 h-6 text-cinematic-neon-yellow" /> {t('notifications')}
                                </h2>
                                <Link href="/admin/notifications" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-cinematic-neon-red transition-all border-b border-white/0 hover:border-cinematic-neon-red/20 pb-2 uppercase italic tracking-[0.2em]">{isRTL ? "عرض جميع السجلات" : "AUDIT ENTIRE MAINFRAME"}</Link>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { type: 'alert', title: isRTL ? 'محاولة وصول غير مصرح بها' : 'UNAUTHORIZED ACCESS ATTEMPT', user: 'IP: 192.168.1.5', time: isRTL ? 'منذ دقيقة' : '1M AGO', icon: AlertCircle, color: 'text-cinematic-neon-red', bg: 'bg-cinematic-neon-red/10' },
                                    { type: 'info', title: isRTL ? 'طلب كونسيرج جديد' : 'NEW CONCIERGE REQUEST', user: 'CLIENT: ABDULLAH', time: isRTL ? 'منذ 5 دقيقة' : '5M AGO', icon: FileText, color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10' },
                                    { type: 'success', title: isRTL ? 'تصفية مزاد: Ferrari Daytona' : 'SETTLED: FERRARI DAYTONA SP3', user: 'BUYER: FAHAD_H', time: isRTL ? 'منذ 15 دقيقة' : '15M AGO', icon: CheckCircle2, color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10' },
                                    { type: 'info', title: isRTL ? 'تحديث قاعدة بيانات القطع' : 'SYNCED: COMPONENT DATABASE', user: 'STAFF: AD_SARAH', time: isRTL ? 'منذ ساعة' : '1H AGO', icon: Clock, color: 'text-white/40', bg: 'bg-white/5' },
                                ].map((note, i) => (
                                    <Link href="/admin/notifications" key={i}>
                                        <div className="flex flex-col md:flex-row items-center gap-8 p-8 border-b border-white/5 hover:bg-white/[0.03] transition-all group cursor-pointer mb-2 rounded-2xl">
                                            <div className={cn("w-16 h-16 rounded-[1.2rem] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 group-hover:-rotate-6", note.bg, note.color)}>
                                                <note.icon className="w-8 h-8" />
                                            </div>
                                            <div className="flex-grow space-y-2 text-center md:text-left">
                                                <div className="text-[13px] font-black uppercase tracking-widest italic">{note.title}</div>
                                                <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{note.user}</div>
                                            </div>
                                            <div className="text-[10px] font-black text-cinematic-neon-red/40 uppercase tracking-[0.5em] shrink-0">{note.time}</div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Admin Sidebar Widgets */}
                    <div className="space-y-12">

                        {/* Server Status Center */}
                        <div className="glass-card p-12 bg-white/[0.01] border-white/5 space-y-10 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-cinematic-neon-blue transition-all group-hover:w-4" />
                            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white flex items-center gap-5 pl-4">
                                <Database className="w-6 h-6 text-cinematic-neon-blue" /> {t('serverStatus')}
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { label: 'Database Sync', status: 'Optimal', pulse: 'bg-cinematic-neon-blue' },
                                    { label: 'Asset Storage', status: 'Active', pulse: 'bg-cinematic-neon-blue' },
                                    { label: 'Payments Core', status: 'Verified', pulse: 'bg-cinematic-neon-blue' },
                                    { label: 'Automated Logs', status: 'Pending', pulse: 'bg-cinematic-neon-yellow' },
                                ].map((stat, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white/[0.02] p-5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">{stat.label}</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">{stat.status}</span>
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", stat.pulse, "shadow-[0_0_10px_rgba(0,240,255,0.5)]")} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Security Shield Access */}
                        <div className="glass-card p-12 bg-gradient-to-tr from-cinematic-neon-red/15 to-transparent border border-cinematic-neon-red/20 relative group overflow-hidden">
                            <Lock className="absolute -bottom-6 -right-6 w-32 h-32 text-cinematic-neon-red opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-1000" />
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <ShieldCheck className="w-6 h-6 text-cinematic-neon-red animate-pulse" />
                                    <div className="text-[12px] font-black uppercase tracking-[0.6em] text-white italic">CYBER SECURITY</div>
                                </div>
                                <p className="text-[11px] text-white/40 leading-relaxed uppercase font-bold tracking-[0.2em]">
                                    {isRTL ? "جميع قنوات الاتصال والبيانات الإدارية تخضع للتشفير العسكري AES-512 لضمان السيطرة التامة." : "All administrative channels & transaction data are locked under AES-512 military-grade encryption."}
                                </p>
                                <Link href="/admin/settings" className="block">
                                    <button className="w-full py-6 text-[10px] font-black uppercase tracking-[0.6em] bg-white text-black rounded-2xl hover:bg-cinematic-neon-red hover:text-white transition-all shadow-2xl">
                                        {isRTL ? "تدقيق السجلات الأمنية" : "AUDIT VAULT LOGS"}
                                    </button>
                                </Link>
                            </div>
                        </div>

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

                {/* Console Bottom HUD Lines */}
                <footer className="mt-48 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 opacity-30 text-[9px] font-black uppercase tracking-[0.8em]">
                    <div className="flex flex-wrap gap-12 justify-center">
                        <div>Uptime: 2,481.42H</div>
                        <div>Node Process: #HM-CORE-AUX-1</div>
                        <div>Memory Load: <span className="text-cinematic-neon-red">22%</span></div>
                    </div>
                    <div className="flex gap-12">
                        <span className="text-white">Admin Hub v2.4</span>
                        <span className="text-cinematic-neon-red">Restricted Zone</span>
                    </div>
                </footer>

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
