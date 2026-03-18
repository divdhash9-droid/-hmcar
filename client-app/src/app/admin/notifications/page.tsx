'use client';

import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, AlertCircle, CheckCircle2, Clock, Shield,
    Trash2, RefreshCcw, Terminal, Send, X,
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
    CRITICAL: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    TRANSACTION: { icon: CheckCircle2, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    SYSTEM: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
    WARNING: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    ORDER: { icon: ShoppingCart, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    USER: { icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    AUCTION: { icon: Gavel, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
};

const MOCK_NOTIFICATIONS: Notification[] = [];

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

    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', url: '' });

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!broadcastForm.title || !broadcastForm.message) return;
        setIsBroadcasting(true);
        try {
            const res = await api.notifications.broadcast(broadcastForm.title, broadcastForm.message, broadcastForm.url);
            if (res.success) {
                setShowBroadcastModal(false);
                setBroadcastForm({ title: '', message: '', url: '' });
                alert(isRTL ? 'تم إرسال الإشعار بنجاح!' : 'Broadcast sent successfully!');
                loadNotifications(true);
            } else {
                alert(isRTL ? 'فشل إرسال الإشعار' : 'Failed to send broadcast');
            }
        } catch (err: any) {
            console.error('Broadcast failed:', err);
            alert(isRTL ? 'حدث خطأ' : 'Error occurred');
        } finally {
            setIsBroadcasting(false);
        }
    };

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

            const merged = [...live];
            setNotifications(merged);
            setUnreadCount(merged.filter(n => !n.isRead).length);
        } catch {
            setNotifications([]);
            setUnreadCount(0);
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
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* HUD Header */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'الإشعارات' : 'ALERTS'}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase">NOTIFICATION CENTER</p>
                                {unreadCount > 0 && <span className="ck-badge ck-badge-danger ck-badge-live">{unreadCount}</span>}
                            </div>
                            <h1 className="ck-page-title">{isRTL ? 'الإشعارات' : 'ALERTS HUB'}</h1>
                            <div className="flex items-center gap-2 mt-1 cockpit-mono text-[9px] text-white/30 uppercase">
                                <Terminal className="w-3 h-3" />
                                {isRTL ? `${notifications.length} إشعار · ${unreadCount} غير مقروء` : `${notifications.length} alerts · ${unreadCount} unread`}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowBroadcastModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 text-cinematic-neon-blue rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-cinematic-neon-blue hover:text-black transition-all">
                                <Send className="w-3.5 h-3.5" />{isRTL ? 'إرسال للكل' : 'BROADCAST'}
                            </button>
                            <button onClick={markAllRead} className="ck-btn-ghost flex items-center gap-2 text-[9px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />{isRTL ? 'تعليم الكل' : 'MARK ALL'}
                            </button>
                            <button onClick={() => loadNotifications(true)} disabled={refreshing}
                                className="ck-btn-ghost flex items-center gap-2 text-[9px] disabled:opacity-40">
                                <RefreshCcw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />{isRTL ? 'تحديث' : 'REFRESH'}
                            </button>
                            <button onClick={clearAll} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 className="w-3.5 h-3.5" />{isRTL ? 'مسح الكل' : 'CLEAR ALL'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="ck-tab-group flex-wrap mb-8">
                    {Object.keys(FILTER_LABELS).map((key) => {
                        const count = key === 'ALL' ? notifications.length : notifications.filter(n => n.type === key).length;
                        return (
                            <button key={key} onClick={() => setFilter(key)}
                                className={cn('ck-tab flex items-center gap-1.5', filter === key && 'ck-tab-active')}>
                                {isRTL ? FILTER_LABELS[key].ar : FILTER_LABELS[key].en}
                                {count > 0 && <span className="cockpit-mono text-[8px] px-1 py-0.5 rounded bg-orange-500/10">{count}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Notification Feed */}
                <div className="space-y-3">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white/[0.02] animate-pulse border border-orange-500/10" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="ck-empty py-24">
                            <div className="ck-empty-icon"><Bell className="w-8 h-8" /></div>
                            <p className="cockpit-mono">{isRTL ? 'لا توجد إشعارات' : 'NO ALERTS FOUND'}</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((notif, i) => {
                                const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG['SYSTEM'];
                                const Icon = cfg.icon;
                                return (
                                    <motion.div key={notif.id} layout
                                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.04 }}
                                        className={cn(
                                            'ck-card p-5 flex flex-col md:flex-row items-start md:items-center gap-5 group relative',
                                            !notif.isRead && 'border-orange-500/20'
                                        )}>

                                        {!notif.isRead && (
                                            <div className="absolute top-4 end-4 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                                        )}

                                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border', cfg.bg)}>
                                            <Icon size={24} className={cfg.color} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className={cn('cockpit-mono text-[9px] px-2 py-0.5 rounded-lg uppercase tracking-widest bg-white/5 border border-white/5', cfg.color)}>
                                                    {isRTL ? FILTER_LABELS[notif.type]?.ar || notif.type : notif.type}
                                                </span>
                                                <span className="cockpit-mono text-[9px] text-white/20">
                                                    {notif.time.includes('T') ? timeAgo(notif.time, isRTL) : notif.time}
                                                </span>
                                                <span className={cn('cockpit-mono text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest',
                                                    notif.status === 'BLOCKED' ? 'text-red-400 bg-red-400/10' :
                                                        notif.status === 'CLEARED' || notif.status === 'SUCCESS' || notif.status === 'VERIFIED' ? 'text-green-400 bg-green-400/10' :
                                                            notif.status === 'MONITORING' || notif.status === 'ACTIVE' || notif.status === 'LIVE' ? 'text-yellow-400 bg-yellow-400/10' :
                                                                'text-white/30 bg-white/5'
                                                )}>{notif.status}</span>
                                            </div>
                                            <h3 className={cn('text-sm font-bold uppercase tracking-tight mb-0.5', notif.isRead ? 'text-white/50' : 'text-white')}>
                                                {notif.title}
                                            </h3>
                                            <p className="cockpit-mono text-[10px] text-white/35 leading-relaxed">{notif.content}</p>
                                        </div>

                                        <div className="flex gap-2 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            {!notif.isRead && (
                                                <button onClick={() => markRead(notif.id)}
                                                    className="px-3 py-1.5 ck-btn-ghost text-[9px]">{isRTL ? 'قرأت' : 'READ'}</button>
                                            )}
                                            <button onClick={() => dismiss(notif.id)}
                                                className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all">
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
                <footer className="mt-16 pt-8 border-t border-orange-500/10 flex flex-wrap justify-between items-center gap-4 opacity-30 cockpit-mono text-[9px] uppercase tracking-[0.4em]">
                    <div className="flex flex-wrap gap-6">
                        <span>Uptime: 2,481H</span><span>Latency: 0.4ms</span><span>Buffer: 512MB</span>
                    </div>
                    <div className="flex gap-6">
                        <span>HM-CTRL v4.0</span><span className="text-orange-400">COCKPIT SECURE</span>
                    </div>
                </footer>

            </main>

            {/* Broadcast Modal */}
            <AnimatePresence>
                {showBroadcastModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-950 border border-white/10 p-8 rounded-3xl w-full max-w-lg relative"
                        >
                            <button onClick={() => setShowBroadcastModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-all"><X className="w-6 h-6" /></button>
                            <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 flex items-center gap-3 text-cinematic-neon-blue">
                                <Send className="w-6 h-6" />
                                {isRTL ? 'إرسال إشعار للكل' : 'NEW BROADCAST'}
                            </h2>
                            <form onSubmit={handleBroadcast} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{isRTL ? 'عنوان الإشعار' : 'TITLE'}</label>
                                    <input required placeholder={isRTL ? 'مثال: عرض جديد!' : 'e.g., NEW OFFER!'} value={broadcastForm.title} onChange={e => setBroadcastForm(prev => ({ ...prev, title: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cinematic-neon-blue focus:outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{isRTL ? 'نص الإشعار' : 'MESSAGE CONTENT'}</label>
                                    <textarea required rows={4} placeholder={isRTL ? 'اكتب رسالتك للمستخدمين هنا...' : 'Write your message...'} value={broadcastForm.message} onChange={e => setBroadcastForm(prev => ({ ...prev, message: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cinematic-neon-blue focus:outline-none transition-all resize-none"></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{isRTL ? 'رابط اختياري (عند النقر)' : 'OPTIONAL LINK'}</label>
                                    <input placeholder={isRTL ? 'مثال: /cars/xxx' : 'e.g., /cars/xxx'} value={broadcastForm.url} onChange={e => setBroadcastForm(prev => ({ ...prev, url: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-cinematic-neon-blue focus:outline-none transition-all" />
                                </div>
                                <button type="submit" disabled={isBroadcasting} className="w-full py-4 bg-cinematic-neon-blue text-black font-black uppercase text-[11px] tracking-widest rounded-xl hover:shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50">
                                    {isBroadcasting ? (isRTL ? 'جاري الإرسال...' : 'SENDING...') : (isRTL ? 'نشر الإشعار' : 'PUBLISH BROADCAST')}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
