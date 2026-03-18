'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, CheckCheck, Trash2, Clock,
    Car, Gavel, ShoppingBag, AlertTriangle, Gift,
    Settings, Volume2, VolumeX, Sparkles,
    X, Eye, ArrowLeft, ArrowRight, Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────
const NOTIFICATION_TYPES = {
    bid: { icon: Gavel, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20', label: 'مزايدات', labelEn: 'Bids' },
    order: { icon: ShoppingBag, color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'طلبات', labelEn: 'Orders' },
    car: { icon: Car, color: 'from-blue-500 to-cyan-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'سيارات', labelEn: 'Cars' },
    promo: { icon: Gift, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-500/10', border: 'border-pink-500/20', label: 'عروض', labelEn: 'Promos' },
    system: { icon: Settings, color: 'from-slate-500 to-gray-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'النظام', labelEn: 'System' },
    alert: { icon: AlertTriangle, color: 'from-red-500 to-rose-600', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'تنبيهات', labelEn: 'Alerts' },
};

const MOCK_NOTIFICATIONS: any[] = [];

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
    const { isRTL } = useLanguage();
    const router = useRouter();

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        api.notifications?.list?.().then(res => {
            if (res?.success && Array.isArray(res.data)) {
                setNotifications(res.data);
            }
        }).catch(err => console.error("Failed to load notifications", err));
    }, []);
    const [filter, setFilter] = useState<string>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selected, setSelected] = useState<any>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filtered = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === filter);

    const markRead = (id: number) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));
    const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
    const remove = (id: number) => setNotifications(p => p.filter(n => n.id !== id));
    const clearAll = () => setNotifications([]);

    // sidebar filter items
    const filterItems = [
        { key: 'all', label: 'الكل', labelEn: 'All', icon: Sparkles, count: notifications.length },
        { key: 'unread', label: 'غير مقروء', labelEn: 'Unread', icon: Eye, count: unreadCount },
        ...Object.entries(NOTIFICATION_TYPES).map(([key, val]) => ({
            key, label: val.label, labelEn: val.labelEn, icon: val.icon,
            count: notifications.filter(n => n.type === key).length,
        })),
    ];

    return (
        <div className={cn("min-h-screen bg-black text-white font-sans overflow-x-hidden", isRTL && "rtl")}>
            <Navbar />

            {/* Cinematic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cinematic-neon-blue/8 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
                <motion.div animate={{ y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/3 right-1/4 w-80 h-80 bg-cinematic-neon-blue/10 rounded-full blur-[100px]" />
                <motion.div animate={{ y: [0, 25, 0], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 11, repeat: Infinity, delay: 3 }} className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[90px]" />
            </div>

            <div className="relative z-10 flex h-screen pt-20">

                {/* ── LEFT SIDEBAR (Filters + Stats) ─────── */}
                <aside className={cn(
                    "hidden lg:flex flex-col w-72 shrink-0 h-[calc(100vh-5rem)] sticky top-20",
                    "bg-white/[0.02] backdrop-blur-2xl border-white/5 overflow-y-auto",
                    isRTL ? "border-l" : "border-r"
                )}>
                    <div className="p-6 flex flex-col h-full gap-6">

                        {/* Header */}
                        <div>
                            <button
                                onClick={() => router.back()}
                                title={isRTL ? 'رجوع' : 'Back'}
                                aria-label={isRTL ? 'رجوع' : 'Back'}
                                className={cn(
                                    "inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all mb-5"
                                )}
                            >
                                {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                            </button>

                            {/* Bell Icon + Count */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cinematic-neon-blue to-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)]">
                                        <Bell className="w-6 h-6 text-white" />
                                    </div>
                                    {unreadCount > 0 && (
                                        <motion.span
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cinematic-neon-red rounded-full text-[9px] font-black flex items-center justify-center shadow-[0_0_12px_rgba(255,0,60,0.6)]"
                                        >
                                            {unreadCount}
                                        </motion.span>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-xl font-black uppercase italic tracking-tight">
                                        {isRTL ? 'الإشعارات' : 'Notifications'}
                                    </h1>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest">
                                        {isRTL ? `${unreadCount} غير مقروءة` : `${unreadCount} unread`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Filter List */}
                        <div className="flex-1 space-y-1">
                            <p className={cn("text-[9px] font-black uppercase tracking-[0.3em] text-white/20 mb-3 flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                <Filter className="w-3 h-3" /> {isRTL ? 'تصفية' : 'Filter by'}
                            </p>
                            {filterItems.map(item => (
                                <button
                                    key={item.key}
                                    onClick={() => setFilter(item.key)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider",
                                        isRTL && "flex-row-reverse text-right",
                                        filter === item.key
                                            ? "bg-white text-black shadow-lg"
                                            : item.key === 'unread' && item.count > 0
                                                ? "bg-cinematic-neon-blue/10 text-cinematic-neon-blue border border-cinematic-neon-blue/20 hover:bg-cinematic-neon-blue/20"
                                                : "text-white/50 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <item.icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{isRTL ? item.label : item.labelEn}</span>
                                    {item.count > 0 && (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-md text-[9px] shrink-0",
                                            filter === item.key ? "bg-black/10" : "bg-white/10"
                                        )}>
                                            {item.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Bottom Actions */}
                        <div className="space-y-2 pt-4 border-t border-white/5">
                            {/* Sound Toggle */}
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-[11px] font-black uppercase tracking-wider",
                                    isRTL && "flex-row-reverse",
                                    soundEnabled
                                        ? "bg-cinematic-neon-blue/10 border-cinematic-neon-blue/20 text-cinematic-neon-blue"
                                        : "bg-white/5 border-white/10 text-white/40"
                                )}
                            >
                                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                <span>{isRTL ? (soundEnabled ? 'صوت مفعّل' : 'صوت مكتوم') : (soundEnabled ? 'Sound On' : 'Sound Off')}</span>
                            </button>

                            {/* Mark All Read */}
                            <button
                                onClick={markAllRead}
                                disabled={unreadCount === 0}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                            >
                                <CheckCheck className="w-4 h-4 shrink-0" />
                                <span>{isRTL ? 'قراءة الكل' : 'Mark All Read'}</span>
                            </button>

                            {/* Clear All */}
                            <button
                                onClick={clearAll}
                                disabled={notifications.length === 0}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 text-cinematic-neon-red hover:bg-cinematic-neon-red/20 transition-all text-[11px] font-black uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
                                style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
                            >
                                <Trash2 className="w-4 h-4 shrink-0" />
                                <span>{isRTL ? 'مسح الكل' : 'Clear All'}</span>
                            </button>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ───────────────────────── */}
                <main className="flex-1 h-[calc(100vh-5rem)] overflow-y-auto">
                    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">

                        {/* Mobile Header */}
                        <div className="lg:hidden mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                                </button>
                                <h1 className="text-2xl font-black uppercase italic">
                                    {isRTL ? 'الإشعارات' : 'Notifications'}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            {/* Mobile Filter Scroll */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                {filterItems.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setFilter(item.key)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap shrink-0 transition-all",
                                            filter === item.key ? "bg-white text-black" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
                                        )}
                                    >
                                        <item.icon className="w-3.5 h-3.5" />
                                        {isRTL ? item.label : item.labelEn}
                                        {item.count > 0 && <span className="ml-1 opacity-60">{item.count}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section Title */}
                        <div className={cn("flex items-center justify-between mb-6", isRTL && "flex-row-reverse")}>
                            <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                                <div className="h-[2px] w-8 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-cinematic-neon-blue">
                                    {filter === 'all' ? (isRTL ? 'جميع الإشعارات' : 'All Notifications')
                                        : filter === 'unread' ? (isRTL ? 'غير المقروءة' : 'Unread')
                                            : isRTL ? NOTIFICATION_TYPES[filter as keyof typeof NOTIFICATION_TYPES]?.label : NOTIFICATION_TYPES[filter as keyof typeof NOTIFICATION_TYPES]?.labelEn}
                                </span>
                            </div>
                            <span className="text-[10px] text-white/20 font-black uppercase tracking-wider">
                                {filtered.length} {isRTL ? 'إشعار' : 'items'}
                            </span>
                        </div>

                        {/* Notifications List */}
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {filtered.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="py-24 text-center"
                                    >
                                        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center">
                                            <Bell className="w-9 h-9 text-white/10" />
                                        </div>
                                        <h3 className="text-xl font-black uppercase italic text-white/20 mb-2">
                                            {isRTL ? 'لا توجد إشعارات' : 'No Notifications'}
                                        </h3>
                                        <p className="text-[11px] text-white/10 uppercase tracking-[0.3em]">
                                            {isRTL ? 'أنت على اطلاع بكل شيء!' : "You're all caught up!"}
                                        </p>
                                    </motion.div>
                                ) : (
                                    filtered.map((notification, idx) => (
                                        <NotifCard
                                            key={notification.id}
                                            n={notification}
                                            idx={idx}
                                            isRTL={isRTL}
                                            onRead={() => markRead(notification.id)}
                                            onDelete={() => remove(notification.id)}
                                            onSelect={() => { markRead(notification.id); setSelected(notification); }}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>

                    </div>
                </main>

                {/* ── DETAIL PANEL (right side on wide screens) ── */}
                <AnimatePresence>
                    {selected && (
                        <>
                            {/* Overlay for small screens */}
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                                onClick={() => setSelected(null)}
                            />

                            {/* Panel */}
                            <motion.div
                                initial={{ x: isRTL ? '-100%' : '100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: isRTL ? '-100%' : '100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                                className={cn(
                                    "fixed top-20 bottom-0 z-50 w-full max-w-sm",
                                    "bg-zinc-950/95 backdrop-blur-2xl border-white/10",
                                    "flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.6)]",
                                    isRTL ? "left-72 border-r" : "right-72 border-l",
                                    "lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] lg:w-80 lg:shrink-0 lg:flex"
                                )}
                            >
                                <DetailPanel
                                    n={selected}
                                    isRTL={isRTL}
                                    onClose={() => setSelected(null)}
                                    onDelete={() => { remove(selected.id); setSelected(null); }}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

// ─── Notification Card ─────────────────────────────────────────────────────────
function NotifCard({ n, idx, isRTL, onRead, onDelete, onSelect }: any) {
    const typeInfo = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES];
    const TypeIcon = typeInfo?.icon || Bell;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: isRTL ? -60 : 60, scale: 0.95 }}
            transition={{ delay: idx * 0.04, duration: 0.3 }}
            onClick={onSelect}
            className={cn(
                "group relative flex items-start gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-300",
                n.read
                    ? "bg-white/[0.015] border-white/5 hover:bg-white/[0.03] hover:border-white/10"
                    : "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
                isRTL && "flex-row-reverse"
            )}
        >
            {/* Priority Stripe */}
            {n.priority === 'high' && !n.read && (
                <div className={cn(
                    "absolute top-0 bottom-0 w-[3px] rounded-full bg-gradient-to-b from-cinematic-neon-red via-orange-500 to-cinematic-neon-red",
                    isRTL ? "right-0 rounded-r-2xl" : "left-0 rounded-l-2xl"
                )} />
            )}

            {/* Icon */}
            <div className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg",
                typeInfo?.color || 'from-gray-500 to-slate-600'
            )}>
                <TypeIcon className="w-5 h-5 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className={cn("flex items-start justify-between gap-3 mb-1", isRTL && "flex-row-reverse")}>
                    <h3 className={cn("font-bold text-[14px] leading-snug", n.read ? "text-white/60" : "text-white")}>
                        {isRTL ? n.title : n.titleEn}
                    </h3>
                    <span className={cn("text-[10px] text-white/25 uppercase tracking-wider flex items-center gap-1 shrink-0", isRTL && "flex-row-reverse")}>
                        <Clock className="w-3 h-3" />
                        {isRTL ? n.time : n.timeEn}
                    </span>
                </div>
                <p className={cn("text-[12px] leading-relaxed line-clamp-2", n.read ? "text-white/30" : "text-white/50")}>
                    {isRTL ? n.message : n.messageEn}
                </p>
            </div>

            {/* Unread Dot */}
            {!n.read && (
                <div className="w-2 h-2 rounded-full bg-cinematic-neon-blue mt-1 shrink-0 shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            )}

            {/* Hover Actions */}
            <div className={cn(
                "absolute top-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
                isRTL ? "left-4" : "right-4"
            )}>
                {!n.read && (
                    <button onClick={e => { e.stopPropagation(); onRead(); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-cinematic-neon-blue/20 text-white/30 hover:text-cinematic-neon-blue transition-all">
                        <Check className="w-3.5 h-3.5" />
                    </button>
                )}
                <button onClick={e => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-cinematic-neon-red/20 text-white/30 hover:text-cinematic-neon-red transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

// ─── Detail Panel ──────────────────────────────────────────────────────────────
function DetailPanel({ n, isRTL, onClose, onDelete }: any) {
    const typeInfo = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES];
    const TypeIcon = typeInfo?.icon || Bell;

    return (
        <div className="flex flex-col h-full">
            {/* Panel Header */}
            <div className={cn("flex items-center justify-between p-5 border-b border-white/5", isRTL && "flex-row-reverse")}>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    {isRTL ? 'تفاصيل الإشعار' : 'Notification Detail'}
                </span>
                <button onClick={onClose} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Icon & Badge */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className={cn(
                        "w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-2xl",
                        typeInfo?.color || 'from-gray-500 to-slate-600'
                    )}>
                        <TypeIcon className="w-10 h-10 text-white" />
                    </div>

                    {/* Type Badge */}
                    <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                        typeInfo?.bg, typeInfo?.border,
                        "text-white/70"
                    )}>
                        {isRTL ? typeInfo?.label : typeInfo?.labelEn}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black uppercase italic mb-3 text-center leading-tight">
                    {isRTL ? n.title : n.titleEn}
                </h2>

                {/* Message */}
                <p className="text-white/60 leading-relaxed text-sm text-center mb-6">
                    {isRTL ? n.message : n.messageEn}
                </p>

                {/* Time */}
                <div className={cn("flex items-center justify-center gap-2 text-white/25 text-[11px] uppercase tracking-wider mb-8")}>
                    <Clock className="w-4 h-4" />
                    {isRTL ? n.time : n.timeEn}
                </div>

                {/* Priority Tag */}
                {n.priority === 'high' && (
                    <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 rounded-xl">
                        <AlertTriangle className="w-4 h-4 text-cinematic-neon-red" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-cinematic-neon-red">
                            {isRTL ? 'أولوية عالية' : 'High Priority'}
                        </span>
                    </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/5 mb-6" />

                {/* Actions */}
                <div className="space-y-3">
                    <button className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-cinematic-neon-blue hover:text-white transition-all shadow-lg">
                        {isRTL ? 'عرض التفاصيل' : 'View Details'}
                    </button>
                    <button
                        onClick={onDelete}
                        className="w-full py-3 bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 text-cinematic-neon-red font-black uppercase tracking-[0.2em] text-xs rounded-xl hover:bg-cinematic-neon-red/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isRTL ? 'حذف الإشعار' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
