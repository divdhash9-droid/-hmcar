'use client';

import { motion } from "framer-motion";
import {
    Activity, PlusCircle, Car, Layers, Gavel, Users, Bell, ShoppingCart,
    Settings, FileText, MessageCircle, Tag, TrendingUp,
    Mail, Radio, Database, Briefcase, Zap, ArrowUpRight,
    Shield, BarChart2
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";

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
    const { t, isRTL } = useLanguage();
    const { showToast } = useToast();
    const [mounted, setMounted] = useState(false);
    const [backingUp, setBackingUp] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentActivities, setRecentActivities] = useState<AuditLogEntry[]>([]);

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
        { label: isRTL ? 'المركبات' : 'VEHICLES', val: stats?.totalCars ?? '—', sub: isRTL ? 'السيارات والقطع' : 'Cars & Parts', icon: Car, color: '#f97316', glow: 'rgba(249,115,22,0.25)' },
        { label: isRTL ? 'الأعضاء' : 'MEMBERS', val: stats?.totalUsers ?? '—', sub: isRTL ? 'عملاء مسجلون' : 'Registered Clients', icon: Users, color: '#60a5fa', glow: 'rgba(96,165,250,0.25)' },
        { label: isRTL ? 'الطلبات' : 'ORDERS', val: stats?.totalOrders ?? '—', sub: isRTL ? 'طلبات الشراء' : 'Purchase Orders', icon: ShoppingCart, color: '#34d399', glow: 'rgba(52,211,153,0.25)' },
        { label: isRTL ? 'الإيرادات' : 'REVENUE', val: stats?.totalRevenue ? `${(stats.totalRevenue / 1000).toFixed(0)}K` : '0', sub: isRTL ? 'إجمالي المبيعات' : 'Total Sales', icon: TrendingUp, color: '#a78bfa', glow: 'rgba(167,139,250,0.25)' },
    ];

    const quickLinks = [
        { icon: PlusCircle, label: isRTL ? 'إضافة سيارة' : 'ADD CAR', href: '/admin/cars', color: '#f97316' },
        { icon: Gavel, label: isRTL ? 'المزادات' : 'AUCTIONS', href: '/admin/auctions', color: '#ef4444' },
        { icon: Radio, label: isRTL ? 'المباشر' : 'LIVE', href: '/admin/live-auctions', color: '#f97316' },
        { icon: Layers, label: isRTL ? 'القطع' : 'PARTS', href: '/admin/parts', color: '#fbbf24' },
        { icon: ShoppingCart, label: isRTL ? 'الطلبات' : 'ORDERS', href: '/admin/orders', color: '#34d399' },
        { icon: Users, label: isRTL ? 'الأعضاء' : 'MEMBERS', href: '/admin/users', color: '#60a5fa' },
        { icon: Mail, id: 'contact', label: isRTL ? 'الاستفسارات' : 'INQUIRIES', href: '/admin/contact', color: '#f97316' },
        { icon: Briefcase, label: isRTL ? 'الخاصة' : 'CONCIERGE', href: '/admin/concierge', color: '#fbbf24' },
        { icon: MessageCircle, label: isRTL ? 'المحادثات' : 'MESSAGES', href: '/admin/messages', color: '#60a5fa' },
        { icon: BarChart2, label: isRTL ? 'التقارير' : 'REPORTS', href: '/admin/reports', color: '#34d399' },
        { icon: Shield, label: isRTL ? 'الأمان' : 'SECURITY', href: '/admin/security', color: '#ef4444' },
        { icon: Tag, label: isRTL ? 'الوكالات' : 'AGENCIES', href: '/admin/brands', color: '#fbbf24' },
        { icon: Settings, label: isRTL ? 'الإعدادات' : 'SETTINGS', href: '/admin/settings', color: '#9ca3af' },
        { icon: Database, label: isRTL ? 'نسخ احتياطي' : 'BACKUP', isButton: true, onClick: handleBackup, color: '#f97316' },
    ];

    const getActivityIcon = (target: string) => {
        const m: Record<string, typeof Car> = { Car, Auction: Gavel, Order: ShoppingCart, User: Users, Brand: Tag, SparePart: Layers };
        return m[target] || Activity;
    };
    const getActivityColor = (action: string) => {
        const m: Record<string, string> = { CREATE: '#60a5fa', UPDATE: '#fbbf24', DELETE: '#ef4444', LOGIN: '#34d399' };
        return m[action] || '#9ca3af';
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
        <div className="min-h-screen text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">

                {/* ── HUD Header ── */}
                <div className="mb-8">
                    <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.3em] uppercase mb-1">HM CAR SYSTEMS // ADMIN PROTOCOL</p>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                                {isRTL ? 'لوحة التحكم' : 'CONTROL'}{' '}
                                <span className="text-orange-400">COCKPIT</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                <span className="cockpit-mono text-[9px] text-orange-400 uppercase tracking-widest">SYSTEM ONLINE</span>
                            </div>
                            <Link href="/" className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cockpit-mono text-[9px] text-white/40 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-1">
                                <ArrowUpRight className="w-3 h-3" />
                                {isRTL ? 'الموقع' : 'SITE'}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {statCards.map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="ck-card p-5 relative overflow-hidden group cursor-default">
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{ background: `radial-gradient(circle at 80% 20%, ${s.glow} 0%, transparent 60%)` }} />
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: `${s.color}15`, border: `1px solid ${s.color}25` }}>
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
                            <div className="absolute bottom-0 start-0 h-[2px] w-0 group-hover:w-full transition-all duration-500"
                                style={{ background: s.color }} />
                        </motion.div>
                    ))}
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                    {/* Quick Actions */}
                    <div className="xl:col-span-2 ck-card p-5">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-1 h-5 rounded-full bg-orange-400" />
                            <h2 className="cockpit-mono text-[11px] font-bold uppercase tracking-widest text-white/80">
                                {isRTL ? 'مركز التحكم' : 'CONTROL TERMINAL'}
                            </h2>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                            {quickLinks.map((link, i) => {
                                const Inner = (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.04, y: -2 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="relative flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group">
                                        {link.id === 'contact' && stats?.newContacts && stats.newContacts > 0 && (
                                            <div className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-black shadow-[0_0_12px_rgba(249,115,22,0.8)] animate-pulse">
                                                {stats.newContacts}
                                            </div>
                                        )}
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                                            style={{ background: `${link.color}12`, border: `1px solid ${link.color}20` }}>
                                            <link.icon className="w-4 h-4" style={{ color: link.color }} />
                                        </div>
                                        <span className="cockpit-mono text-[8px] text-white/40 uppercase tracking-wider text-center leading-tight group-hover:text-white/70 transition-colors">
                                            {link.label}
                                        </span>
                                    </motion.div>
                                );
                                return link.isButton
                                    ? <button key={i} onClick={link.onClick} className="w-full">{Inner}</button>
                                    : <Link key={i} href={link.href!}>{Inner}</Link>;
                            })}
                        </div>
                    </div>

                    {/* Sidebar: Activity + Performance */}
                    <div className="space-y-4">

                        {/* Recent Activity */}
                        <div className="ck-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-5 rounded-full bg-orange-400" />
                                    <h2 className="cockpit-mono text-[11px] font-bold uppercase tracking-widest text-white/80">
                                        {isRTL ? 'آخر الأنشطة' : 'ACTIVITY LOG'}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                                    <span className="cockpit-mono text-[8px] text-orange-400/70">LIVE</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-12 rounded-xl bg-white/[0.03] animate-pulse" />
                                    ))
                                ) : recentActivities.length === 0 ? (
                                    <div className="text-center py-8 cockpit-mono text-[10px] text-white/20 uppercase">
                                        {isRTL ? 'لا يوجد أنشطة' : 'NO ACTIVITY'}
                                    </div>
                                ) : (
                                    recentActivities.map((act, i) => {
                                        const Icon = getActivityIcon(act.target);
                                        const color = getActivityColor(act.action);
                                        return (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: isRTL ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.06 }}
                                                className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                                                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                                                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                                                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] text-white/70 font-medium truncate">{act.description}</p>
                                                    <p className="cockpit-mono text-[8px] text-white/25 truncate">{act.user?.name || (isRTL ? 'النظام' : 'System')}</p>
                                                </div>
                                                <span className="cockpit-mono text-[8px] text-white/25 shrink-0">{timeAgo(act.createdAt)}</span>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* System Performance */}
                        <div className="ck-card p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-5 rounded-full bg-orange-400" />
                                <h2 className="cockpit-mono text-[11px] font-bold uppercase tracking-widest text-white/80">
                                    {isRTL ? 'أداء النظام' : 'SYSTEM PERF'}
                                </h2>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: isRTL ? 'الاستجابة' : 'RESPONSE', val: '14ms', pct: 94, color: '#34d399' },
                                    { label: isRTL ? 'التوفر' : 'UPTIME', val: '99.9%', pct: 99, color: '#60a5fa' },
                                    { label: isRTL ? 'الأداء' : 'THROUGHPUT', val: 'HIGH', pct: 87, color: '#f97316' },
                                ].map((m, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="cockpit-mono text-[9px] text-white/40 uppercase">{m.label}</span>
                                            <span className="cockpit-mono text-[9px] font-bold" style={{ color: m.color }}>{m.val}</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }}
                                                transition={{ delay: 0.5 + i * 0.2, duration: 1.2, ease: 'easeOut' }}
                                                className="h-full rounded-full" style={{ background: m.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 pt-4 border-t border-orange-500/10">
                                <div className="h-12 flex items-end gap-0.5">
                                    {[4, 7, 3, 9, 5, 8, 10, 6, 4, 9, 12, 8, 5, 7, 11, 9, 6].map((h, i) => (
                                        <motion.div key={i}
                                            initial={{ height: 0 }} animate={{ height: `${(h / 12) * 100}%` }}
                                            transition={{ delay: i * 0.04, duration: 0.8, ease: 'easeOut' }}
                                            className="flex-1 rounded-t-sm bg-orange-500/20 hover:bg-orange-500/50 transition-colors" />
                                    ))}
                                </div>
                                <p className="cockpit-mono text-[8px] text-white/20 text-center mt-1 uppercase">7-DAY TRAFFIC</p>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}
