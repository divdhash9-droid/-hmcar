'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, AlertCircle, CheckCircle2, Clock, Shield,
    Trash2, ChevronLeft, RefreshCcw, Terminal,
    ShoppingCart, Users, Gavel, type LucideIcon
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { api } from "@/lib/api";

interface Notification {
    id: string;
    type: 'CRITICAL' | 'TRANSACTION' | 'SYSTEM' | 'WARNING' | 'ORDER' | 'USER' | 'AUCTION';
    title: string;
    content: string;
    time: string;
    status: string;
    isRead: boolean;
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
    CRITICAL: { icon: Shield, color: 'text-cinematic-neon-red', bg: 'bg-cinematic-neon-red/10' },
    TRANSACTION: { icon: CheckCircle2, color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10' },
    SYSTEM: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5' },
    WARNING: { icon: AlertCircle, color: 'text-cinematic-neon-yellow', bg: 'bg-cinematic-neon-yellow/10' },
    ORDER: { icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-400/10' },
    USER: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    AUCTION: { icon: Gavel, color: 'text-orange-400', bg: 'bg-orange-400/10' },
};

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'CRITICAL', title: 'FIREWALL BREACH ATTEMPT', content: 'Suspicious IP 104.28.14.2 detected – SQL injection on /api/auctions/bid.', time: '2m ago', status: 'BLOCKED', isRead: false },
    { id: '2', type: 'TRANSACTION', title: 'PAYMENT VERIFIED: 1.2M SAR', content: 'Fahad Al-Qahtani cleared payment for Porsche 911 GT3 RS.', time: '15m ago', status: 'CLEARED', isRead: false },
    { id: '3', type: 'ORDER', title: 'NEW ORDER PLACED', content: 'Order #ORD-A1B2C3D4 placed — Mercedes-Benz S-Class 2024 — 450,000 SAR.', time: '1h ago', status: 'PENDING', isRead: false },
    { id: '4', type: 'AUCTION', title: 'AUCTION ENDING SOON', content: 'BMW M5 Competition auction closes in 30 minutes. Current bid: 320,000 SAR.', time: '2h ago', status: 'ACTIVE', isRead: true },
    { id: '5', type: 'USER', title: 'NEW USER REGISTERED', content: 'khalid.otaibi@gmail.com just signed up and verified their account.', time: '3h ago', status: 'VERIFIED', isRead: true },
    { id: '6', type: 'SYSTEM', title: 'DATABASE BACKUP COMPLETE', content: 'Nightly incremental backup of RIYADH-DB-01 finished in 4m 12s.', time: '4h ago', status: 'SUCCESS', isRead: true },
    { id: '7', type: 'WARNING', title: 'LATENCY SPIKE DETECTED', content: 'API response time surged 40% in EMEA regions. Auto-scaling triggered.', time: '6h ago', status: 'MONITORING', isRead: true },
    { id: '8', type: 'TRANSACTION', title: 'REFUND PROCESSED: 85,000 SAR', content: 'Refund issued to Mohammed Al-Saud for cancelled order #ORD-Z9Y8X7.', time: '8h ago', status: 'REFUNDED', isRead: true },
];

const FILTER_LABELS: Record<string, { en: string; ar: string }> = {
    ALL: { en: 'ALL', ar: 'الكل' },
    CRITICAL: { en: 'CRITICAL', ar: 'حرجة' },
    ORDER: { en: 'ORDERS', ar: 'الطلبات' },
    TRANSACTION: { en: 'PAYMENTS', ar: 'معاملات' },
    AUCTION: { en: 'AUCTIONS', ar: 'مزادات' },
    USER: { en: 'USERS', ar: 'مستخدمون' },
    SYSTEM: { en: 'SYSTEM', ar: 'النظام' },
    WARNING: { en: 'WARNINGS', ar: 'تحذيرات' },
};

function timeAgo(iso: string, isRTL: boolean) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return isRTL ? 'الآن' : 'Now';
    if (m < 60) return `${m}${isRTL ? ' د' : 'm ago'}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}${isRTL ? ' س' : 'h ago'}`;
    return `${Math.floor(h / 24)}${isRTL ? ' ي' : 'd ago'}`;
}

export default function AdminNotifications() {
    const { isRTL } = useLanguage();
    const [filter, setFilter] = useState('ALL');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async (showRefreshing = false) => {
        if (showRefreshing) setRefreshing(true);
        else setLoading(true);
        try {
            const res = await api.analytics.getSummary();
            // Build live notifications from analytics data
            const live: Notification[] = [];
            const stats = res?.stats || {};

            if (stats.totalOrders > 0) {
                live.push({ id: 'live-1', type: 'ORDER', title: isRTL ? 'إجمالي الطلبات النشطة' : 'ACTIVE ORDERS', content: isRTL ? `${stats.pendingOrders || 0} طلبات معلقة من إجمالي ${stats.totalOrders}` : `${stats.pendingOrders || 0} pending orders out of ${stats.totalOrders} total`, time: new Date().toISOString(), status: 'LIVE', isRead: false });
            }
            if (stats.runningAuctions > 0) {
                live.push({ id: 'live-2', type: 'AUCTION', title: isRTL ? 'مزادات جارية الآن' : 'LIVE AUCTIONS', content: isRTL ? `${stats.runningAuctions} مزاد نشط الآن على المنصة` : `${stats.runningAuctions} auctions currently live`, time: new Date().toISOString(), status: 'ACTIVE', isRead: false });
            }
            if (stats.totalUsers > 0) {
                live.push({ id: 'live-3', type: 'USER', title: isRTL ? 'تقرير المستخدمين' : 'USER SUMMARY', content: isRTL ? `${stats.totalUsers} مستخدم مسجل في المنصة` : `${stats.totalUsers} total registered users on platform`, time: new Date(Date.now() - 3600000).toISOString(), status: 'INFO', isRead: true });
            }

            const merged = [...live, ...MOCK_NOTIFICATIONS];
            setNotifications(merged);
            setUnreadCount(merged.filter(n => !n.isRead).length);
        } catch {
            setNotifications(MOCK_NOTIFICATIONS);
            setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.isRead).length);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isRTL]);

    useEffect(() => { loadNotifications(); }, [loadNotifications]);

    const dismiss = (id: string) => {
        setNotifications(prev => {
            const updated = prev.filter(n => n.id !== id);
            setUnreadCount(updated.filter(n => !n.isRead).length);
            return updated;
        });
    };

    const markRead = (id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
            setUnreadCount(updated.filter(n => !n.isRead).length);
            return updated;
        });
    };

    const clearAll = () => { setNotifications([]); setUnreadCount(0); };
    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const filtered = filter === 'ALL'
        ? notifications
        : notifications.filter(n => n.type === filter);

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">

            {/* Background grid */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>
            <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-cinematic-neon-red/3 blur-[150px] rounded-full pointer-events-none" />

            <main className="relative z-10 p-6 md:p-12 lg:p-20">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="space-y-4">
                        <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group">
                            <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                                {isRTL ? 'الإشعارات' : 'ALERTS'}
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20"> {isRTL ? 'والتنبيهات' : '& NOTIFICATIONS'}</span>
                            </h1>
                            {unreadCount > 0 && (
                                <span className="px-3 py-1 bg-cinematic-neon-red text-black text-[11px] font-black rounded-full shadow-[0_0_15px_rgba(255,0,60,0.6)] animate-pulse shrink-0">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-widest font-bold">
                            <Terminal className="w-3 h-3" />
                            {isRTL ? `${notifications.length} إشعار · ${unreadCount} غير مقروء` : `${notifications.length} alerts · ${unreadCount} unread`}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-white"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {isRTL ? 'تعليم الكل مقروء' : 'MARK ALL READ'}
                        </button>
                        <button
                            onClick={() => loadNotifications(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/60 hover:text-white disabled:opacity-40"
                        >
                            <RefreshCcw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                            {isRTL ? 'تحديث' : 'REFRESH'}
                        </button>
                        <button
                            onClick={clearAll}
                            className="flex items-center gap-2 px-5 py-3 bg-cinematic-neon-red/10 border border-cinematic-neon-red/40 text-cinematic-neon-red rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cinematic-neon-red hover:text-white transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isRTL ? 'مسح الكل' : 'CLEAR ALL'}
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap bg-white/5 p-2 rounded-2xl border border-white/5 w-fit mb-10 gap-1 overflow-x-auto max-w-full">
                    {Object.keys(FILTER_LABELS).map((key) => {
                        const count = key === 'ALL' ? notifications.length : notifications.filter(n => n.type === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                                    filter === key ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                                )}
                            >
                                {isRTL ? FILTER_LABELS[key].ar : FILTER_LABELS[key].en}
                                {count > 0 && (
                                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-black",
                                        filter === key ? "bg-black/20 text-black" : "bg-white/10 text-white/50"
                                    )}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Notification Feed */}
                <div className="space-y-4">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : filtered.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-24 gap-4 text-white/20"
                        >
                            <Bell className="w-16 h-16" />
                            <p className="text-[12px] font-black uppercase tracking-[0.4em]">
                                {isRTL ? 'لا توجد إشعارات' : 'NO ALERTS FOUND'}
                            </p>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((notif, i) => {
                                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG['SYSTEM'];
                                const Icon = cfg.icon;
                                return (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={cn(
                                            "p-6 md:p-8 rounded-2xl border flex flex-col md:flex-row items-start md:items-center gap-6 group relative transition-all hover:bg-white/[0.03]",
                                            notif.isRead
                                                ? "bg-white/[0.01] border-white/5"
                                                : "bg-white/[0.03] border-white/10"
                                        )}
                                    >
                                        {/* Unread indicator */}
                                        {!notif.isRead && (
                                            <div className="absolute top-4 right-4 md:top-6 md:right-6 w-2 h-2 rounded-full bg-cinematic-neon-red shadow-[0_0_8px_rgba(255,0,60,0.8)]" />
                                        )}

                                        {/* Icon */}
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 transition-all group-hover:scale-110",
                                            cfg.bg
                                        )}>
                                            <Icon size={28} className={cfg.color} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest bg-white/5 border border-white/5", cfg.color)}>
                                                    {isRTL ? FILTER_LABELS[notif.type]?.ar || notif.type : notif.type}
                                                </span>
                                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">
                                                    {notif.time.includes('T') ? timeAgo(notif.time, isRTL) : notif.time}
                                                </span>
                                                <span className={cn(
                                                    "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest",
                                                    notif.status === 'BLOCKED' ? 'text-cinematic-neon-red bg-cinematic-neon-red/10' :
                                                        notif.status === 'CLEARED' || notif.status === 'SUCCESS' || notif.status === 'VERIFIED' ? 'text-green-400 bg-green-400/10' :
                                                            notif.status === 'MONITORING' || notif.status === 'ACTIVE' || notif.status === 'LIVE' ? 'text-cinematic-neon-yellow bg-cinematic-neon-yellow/10' :
                                                                'text-white/30 bg-white/5'
                                                )}>
                                                    {notif.status}
                                                </span>
                                            </div>
                                            <h3 className={cn(
                                                "text-base md:text-lg font-black uppercase tracking-tight mb-1 transition-all",
                                                notif.isRead ? "text-white/60" : "text-white"
                                            )}>
                                                {notif.title}
                                            </h3>
                                            <p className="text-[11px] text-white/40 leading-relaxed font-bold">
                                                {notif.content}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            {!notif.isRead && (
                                                <button
                                                    onClick={() => markRead(notif.id)}
                                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white/60"
                                                >
                                                    {isRTL ? 'قرأت' : 'READ'}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => dismiss(notif.id)}
                                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-cinematic-neon-red hover:text-white hover:border-cinematic-neon-red transition-all text-white/40"
                                            >
                                                {isRTL ? 'حذف' : 'DISMISS'}
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <footer className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-[9px] font-black uppercase tracking-[0.6em]">
                    <div className="flex flex-wrap gap-8 justify-center">
                        <div>Uptime: 2,481.42H</div>
                        <div>Buffer: 512MB</div>
                        <div>Latency: <span className="text-cinematic-neon-blue">0.4ms</span></div>
                    </div>
                    <div className="flex gap-8">
                        <span>Secure Mainframe v4.4</span>
                        <span className="text-cinematic-neon-red italic">Encrypted Only</span>
                    </div>
                </footer>

            </main>
        </div>
    );
}
