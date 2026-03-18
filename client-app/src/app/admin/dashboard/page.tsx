'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Activity, Car, Layers, Gavel, Users, ShoppingCart,
    Settings, MessageCircle, Tag, TrendingUp,
    Database, Zap, ArrowUpRight, Shield, BarChart2, Search
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
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
    user?: { name: string; email: string };
}

export default function AdminDashboard() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState<AuditLogEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleBackup = async () => {
        setBackingUp(true);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch('/api/v2/backup', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) throw new Error('backup failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `hm-car-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
            showToast(isRTL ? '✅ تم تحميل النسخة الاحتياطية!' : '✅ Backup downloaded!', 'success');
        } catch { showToast(isRTL ? '❌ فشل التحميل' : '❌ Backup failed', 'error'); }
        finally { setBackingUp(false); }
    };

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('hm_token');
            const roleKey = localStorage.getItem('hm_user_role');
            let userRole = roleKey;
            if (!userRole) {
                try { const u = JSON.parse(localStorage.getItem('hm_user') || '{}'); userRole = u.role || null; }
                catch { userRole = null; }
            }
            if (!token || !userRole) router.push('/login');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, a] = await Promise.all([api.analytics.getSummary(), api.analytics.getActivities(6)]);
                if (s.success) setStats(s.stats);
                if (a.success) setRecentActivities(a.activities);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const statCards = [
        { label: isRTL ? 'السيارات' : 'VEHICLES', val: stats?.totalCars ?? '—', sub: isRTL ? 'سيارات في المعرض' : 'Cars in Showroom', icon: Car, color: '#f97316', glow: 'rgba(249,115,22,0.25)' },
        { label: isRTL ? 'قطع مستوردة' : 'PARTS', val: stats?.totalParts ?? '—', sub: isRTL ? 'قطع غيار مستوردة' : 'Imported Spare Parts', icon: Layers, color: '#fbbf24', glow: 'rgba(251,191,36,0.25)' },
        { label: isRTL ? 'الأعضاء' : 'MEMBERS', val: stats?.totalUsers ?? '—', sub: isRTL ? 'عملاء مسجلون' : 'Registered Clients', icon: Users, color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
        { label: isRTL ? 'الطلبات' : 'ORDERS', val: stats?.totalOrders ?? '—', sub: isRTL ? 'طلبات الشراء' : 'Purchase Orders', icon: ShoppingCart, color: '#34d399', glow: 'rgba(52,211,153,0.25)' },
        { label: isRTL ? 'الإيرادات' : 'REVENUE', val: stats?.totalRevenue ? `${(stats.totalRevenue / 1000).toFixed(0)}K` : '0', sub: isRTL ? 'إجمالي المبيعات' : 'Total Sales', icon: TrendingUp, color: '#a78bfa', glow: 'rgba(167,139,250,0.25)' },
    ];

    const quickLinks = [
        { icon: Car, label: isRTL ? 'معرض السيارات' : 'SHOWROOM', href: '/admin/cars', color: '#f97316' },
        { icon: Gavel, label: isRTL ? 'سوق المزادات' : 'MARKET HUB', href: '/admin/market', color: '#ef4444' },
        { icon: ShoppingCart, label: isRTL ? 'مركز التنفيذ' : 'FULFILLMENT', href: '/admin/orders', color: '#34d399' },
        { icon: MessageCircle, label: isRTL ? 'مركز التواصل' : 'COMMS HUB', href: '/admin/comms', color: '#60a5fa' },
        { icon: Layers, label: isRTL ? 'قطع الغيار' : 'PARTS', href: '/admin/parts', color: '#fbbf24' },
        { icon: Users, label: isRTL ? 'الأعضاء' : 'USERS', href: '/admin/users', color: '#8b5cf6' },
        { icon: Shield, label: isRTL ? 'الأمان' : 'SECURITY', href: '/admin/security', color: '#f43f5e' },
        { icon: Activity, label: isRTL ? 'الترصد والتشخيص' : 'DIAGNOSTICS', href: '/admin/health', color: '#10b981' },
        { icon: Tag, label: isRTL ? 'الوكالات' : 'AGENCIES', href: '/admin/brands', color: '#f59e0b' },
        { icon: BarChart2, label: isRTL ? 'التقارير' : 'REPORTS', href: '/admin/reports', color: '#10b981' },
        { icon: Settings, label: isRTL ? 'الإعدادات' : 'SITE CTRL', href: '/admin/settings', color: '#64748b' },
        { icon: Database, label: isRTL ? 'نسخ احتياطي' : 'BACKUP', isButton: true, onClick: handleBackup, color: '#f97316' },
    ];

    const getActivityIcon = (target: string) => {
        const m: Record<string, typeof Car> = { Car, Auction: Gavel, Order: ShoppingCart, User: Users, Brand: Tag, SparePart: Layers };
        return m[target] || Activity;
    };
    
    const timeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return isRTL ? 'الآن' : 'Now';
        if (m < 60) return `${m}${isRTL ? 'د' : 'm'}`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}${isRTL ? 'س' : 'h'}`;
        return new Date(date).toLocaleDateString();
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen text-white bg-black/95" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

                {/* ── HUD Header ── */}
                <div className="mb-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.3em] uppercase mb-1">
                                {isRTL ? 'أنظمة HM لتجارة السيارات // المحرك الأساسي' : 'HM CAR SYSTEMS // CORE ENGINE'}
                            </p>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                                {isRTL ? <><span className="text-orange-500">لوحة</span> القيادة</> : <>COMMAND <span className="text-orange-500">DECK</span></>}
                            </h1>
                        </div>

                        {/* Search / Command Bar */}
                        <div className={cn(
                            "relative w-full lg:max-w-md transition-all duration-300",
                            isSearchFocused ? "lg:max-w-xl scale-[1.02]" : "opacity-80"
                        )}>
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder={isRTL ? "أدخل أمر الخدمة أو ابحث..." : "EXECUTE COMMAND OR SEARCH..."}
                                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 cockpit-mono text-xs uppercase tracking-widest focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.08] transition-all"
                                title={isRTL ? "بحث" : "Search"}
                            />
                            
                            <AnimatePresence>
                                {isSearchFocused && searchQuery && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                        className="absolute top-full left-0 right-0 mt-2 z-[100] bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] max-h-[60vh] overflow-auto"
                                    >
                                        <div className="p-3 border-b border-white/5 mb-1">
                                            <span className="cockpit-mono text-[8px] text-white/20 uppercase">{isRTL ? 'تطابق النتائج' : 'Match Results'}</span>
                                        </div>
                                        {quickLinks.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase())).map((link, idx) => (
                                            <Link key={idx} href={link.href || '#'} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/5 group-hover:border-white/20">
                                                    <link.icon className="w-3.5 h-3.5" style={{ color: link.color }} />
                                                </div>
                                                <span className="cockpit-mono text-[10px] uppercase font-bold text-white/60">{link.label}</span>
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                <span className="cockpit-mono text-[9px] text-orange-400 uppercase tracking-widest">{isRTL ? 'بث بيانات مباشر' : 'LIVE DATA FEED'}</span>
                            </div>
                            <Link href="/" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 cockpit-mono text-[9px] text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-1" title={isRTL ? "زيارة الموقع" : "Visit Site"}>
                                <ArrowUpRight className="w-3 h-3" />
                                {isRTL ? 'الموقع' : 'SITE'}
                            </Link>
                        </div>
                    </div>

                    {/* System Pulse Ticker */}
                    <div className="bg-white/[0.02] border-y border-white/5 h-8 flex items-center overflow-hidden" dir="ltr">
                        <motion.div 
                            animate={{ x: [0, "-50%"] }} 
                            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                            className="flex w-max"
                        >
                            {[...Array(10), ...Array(10)].map((_, i) => (
                                <div key={i} className="flex items-center gap-6 px-6 text-[10px] cockpit-mono text-white/30 uppercase tracking-[0.2em] shrink-0">
                                    <span className="text-orange-500/80 font-bold">{isRTL ? `نظام:${String(i % 10).padStart(3, '0')}` : `SYSTEM:${String(i % 10).padStart(3, '0')}`}</span>
                                    <span>{isRTL ? 'اتصال آمن' : 'SECURE_LINK'}</span>
                                    <span className="text-emerald-500/70">{isRTL ? 'استجابة:14MS' : 'LATENCY:14MS'}</span>
                                    <span>{isRTL ? 'نقطة البيانات تعمل' : 'DATA_NODE_OK'}</span>
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60 animate-pulse" />
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
                    {statCards.map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="ck-card p-5 relative overflow-hidden group cursor-default">
                            <div 
                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow} 0%, transparent 60%)` }}
                            />
                            <div className="flex items-start justify-between mb-4">
                                <div 
                                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10"
                                    style={{ borderColor: s.color, borderStyle: 'solid', borderWidth: '1px' }}
                                >
                                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                                </div>
                                <Zap className="w-3 h-3 opacity-20 group-hover:opacity-60 transition-opacity" style={{ color: s.color }} />
                            </div>
                            {loading ? (
                                <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse mb-1" />
                            ) : (
                                <div className="cockpit-num text-3xl font-black" style={{ color: s.color }}>{s.val}</div>
                            )}
                            <p className="cockpit-mono text-[9px] text-white/30 uppercase tracking-widest mt-1">{s.label}</p>
                            <p className="text-[10px] text-white/20 mt-0.5">{s.sub}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                    {/* Quick Access Grid */}
                    <div className="xl:col-span-2 ck-card p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-6 rounded-full bg-orange-500" />
                            <h2 className="cockpit-mono text-[12px] font-black uppercase tracking-widest text-white/80">
                                {isRTL ? 'مركز التحكم والعمليات' : 'OPERATIONS TERMINAL'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                            {quickLinks.map((link, i) => {
                                const Inner = (
                                    <motion.div
                                        whileHover={{ scale: 1.05, y: -4 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="relative flex flex-col items-center gap-3 p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.08] hover:border-white/10 transition-all cursor-pointer group">
                                        <div 
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg bg-white/5"
                                            style={{ borderColor: `${link.color}40`, borderStyle: 'solid', borderWidth: '1px' }}
                                        >
                                            <link.icon className="w-5 h-5" style={{ color: link.color }} />
                                        </div>
                                        <span className="cockpit-mono text-[9px] text-white/50 uppercase font-black tracking-widest text-center leading-tight group-hover:text-white transition-colors">
                                            {link.label}
                                        </span>
                                    </motion.div>
                                );
                                return link.isButton
                                    ? <button key={i} onClick={link.onClick} className="w-full" disabled={backingUp} title={link.label}>{Inner}</button>
                                    : <Link key={i} href={link.href!} title={link.label}>{Inner}</Link>;
                            })}
                        </div>
                    </div>

                    {/* Activity & Performance */}
                    <div className="space-y-4">
                        <div className="ck-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 rounded-full bg-orange-500" />
                                    <h2 className="cockpit-mono text-[12px] font-black uppercase tracking-widest text-white/80">
                                        {isRTL ? 'سجل العمليات' : 'LOG STREAM'}
                                    </h2>
                                </div>
                                <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                            </div>
                            <div className="space-y-3">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="h-14 rounded-2xl bg-white/[0.03] animate-pulse" />
                                    ))
                                ) : (
                                    recentActivities.map((act, i) => {
                                        const Icon = getActivityIcon(act.target);
                                        const color = (action: string) => {
                                            const m: Record<string, string> = { CREATE: '#60a5fa', UPDATE: '#fbbf24', DELETE: '#ef4444', LOGIN: '#34d399' };
                                            return m[action] || '#9ca3af';
                                        };
                                        const actColor = color(act.action);
                                        return (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all">
                                                <div 
                                                    className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-white/5"
                                                    style={{ borderColor: `${actColor}40`, borderStyle: 'solid', borderWidth: '1px' }}
                                                >
                                                    <Icon className="w-4 h-4" style={{ color: actColor }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-white/80 font-bold truncate">{act.description}</p>
                                                    <p className="cockpit-mono text-[8px] text-white/30 uppercase mt-0.5">{timeAgo(act.createdAt)}</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="ck-card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 rounded-full bg-orange-500" />
                                <h2 className="cockpit-mono text-[12px] font-black uppercase tracking-widest text-white/80">
                                    {isRTL ? 'النشاط المباشر' : 'LIVE FEED'}
                                </h2>
                            </div>
                            <LiveNotificationsList isRTL={isRTL} />
                        </div>

                        <div className="ck-card p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1.5 h-6 rounded-full bg-orange-500" />
                                <h2 className="cockpit-mono text-[12px] font-black uppercase tracking-widest text-white/80">
                                    {isRTL ? 'كفاءة النظام' : 'EFFICIENCY'}
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: isRTL ? 'زمن الاستجابة' : 'Latency', pct: 98, color: '#34d399' },
                                    { label: isRTL ? 'وقت التشغيل' : 'Uptime', pct: 99.9, color: '#60a5fa' },
                                ].map((m, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="cockpit-mono text-[9px] text-white/40 uppercase">{m.label}</span>
                                            <span className="cockpit-mono text-[9px] font-black" style={{ color: m.color }}>{m.pct}%</span>
                                        </div>
                                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} 
                                                className="h-full rounded-full" 
                                                style={{ backgroundColor: m.color }} 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
