'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Check, CheckCheck, Trash2, Filter, Clock,
    Car, Gavel, ShoppingBag, AlertTriangle, Gift,
    Megaphone, Settings, Volume2, VolumeX, Sparkles,
    ChevronRight, X, Eye, Archive, ArrowLeft
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';

// Notification Types with icons and colors
const NOTIFICATION_TYPES = {
    bid: { icon: Gavel, color: 'from-amber-500 to-orange-600', label: 'مزايدات', labelEn: 'Bids' },
    order: { icon: ShoppingBag, color: 'from-emerald-500 to-green-600', label: 'طلبات', labelEn: 'Orders' },
    car: { icon: Car, color: 'from-blue-500 to-cyan-600', label: 'سيارات', labelEn: 'Cars' },
    promo: { icon: Gift, color: 'from-pink-500 to-rose-600', label: 'عروض', labelEn: 'Promos' },
    system: { icon: Settings, color: 'from-slate-500 to-gray-600', label: 'النظام', labelEn: 'System' },
    alert: { icon: AlertTriangle, color: 'from-red-500 to-rose-600', label: 'تنبيهات', labelEn: 'Alerts' },
};

// Mock notifications data
const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'bid', title: 'مزايدة جديدة!', titleEn: 'New Bid!', message: 'تم تقديم مزايدة بقيمة 450,000 ر.س على Mercedes AMG GT', messageEn: 'A bid of 450,000 SAR was placed on Mercedes AMG GT', time: '2 دقيقة', timeEn: '2 min ago', read: false, priority: 'high' },
    { id: 2, type: 'order', title: 'طلبك قيد المعالجة', titleEn: 'Order Processing', message: 'طلب #HM-2024-0892 قيد المعالجة وسيتم الشحن قريباً', messageEn: 'Order #HM-2024-0892 is being processed', time: '15 دقيقة', timeEn: '15 min ago', read: false, priority: 'medium' },
    { id: 3, type: 'car', title: 'سيارة أحلامك متوفرة!', titleEn: 'Your Dream Car Available!', message: 'Lamborghini Urus 2024 الآن في معرضنا', messageEn: 'Lamborghini Urus 2024 now in our showroom', time: 'ساعة', timeEn: '1 hour ago', read: false, priority: 'high' },
    { id: 4, type: 'promo', title: 'عرض حصري 🎉', titleEn: 'Exclusive Offer 🎉', message: 'خصم 15% على جميع قطع الغيار لفترة محدودة', messageEn: '15% off on all spare parts for limited time', time: '3 ساعات', timeEn: '3 hours ago', read: true, priority: 'low' },
    { id: 5, type: 'alert', title: 'تنبيه أمني', titleEn: 'Security Alert', message: 'تم تسجيل دخول جديد من جهاز غير معروف', messageEn: 'New login detected from unknown device', time: '5 ساعات', timeEn: '5 hours ago', read: true, priority: 'high' },
    { id: 6, type: 'system', title: 'تحديث النظام', titleEn: 'System Update', message: 'تم تحديث سياسة الخصوصية. اطلع على التفاصيل.', messageEn: 'Privacy policy updated. Check details.', time: 'أمس', timeEn: 'Yesterday', read: true, priority: 'low' },
    { id: 7, type: 'bid', title: 'تم قبول مزايدتك!', titleEn: 'Bid Accepted!', message: 'تهانينا! فزت بالمزاد على BMW M5 Competition', messageEn: 'Congratulations! You won the auction on BMW M5 Competition', time: 'أمس', timeEn: 'Yesterday', read: true, priority: 'high' },
];

export default function NotificationsPage() {
    const { isRTL } = useLanguage();
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<string>('all');
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications.filter(n => n.type === filter);

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <div className={cn("min-h-screen bg-black text-white font-sans", isRTL && "rtl")}>
            <Navbar />

            {/* Cinematic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cinematic-neon-blue/10 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

                {/* Floating Orbs */}
                <motion.div
                    animate={{ y: [0, -30, 0], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute top-1/4 right-1/4 w-96 h-96 bg-cinematic-neon-blue/10 rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ y: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, delay: 2 }}
                    className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px]"
                />
            </div>

            <main className="relative z-10 pt-28 pb-20 px-6 max-w-6xl mx-auto">



                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between flex-wrap gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cinematic-neon-blue to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(0,240,255,0.3)]">
                                        <Bell className="w-8 h-8 text-white" />
                                    </div>
                                    {unreadCount > 0 && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-2 -right-2 w-7 h-7 bg-cinematic-neon-red rounded-full flex items-center justify-center text-xs font-black shadow-[0_0_20px_rgba(255,0,60,0.5)]"
                                        >
                                            {unreadCount}
                                        </motion.div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">
                                        {isRTL ? "الإشعارات" : "Notifications"}
                                    </h1>
                                    <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-bold mt-1">
                                        {isRTL ? `${unreadCount} غير مقروءة` : `${unreadCount} Unread`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSoundEnabled(!soundEnabled)}
                                className={cn(
                                    "p-3 rounded-xl border transition-all",
                                    soundEnabled
                                        ? "bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30 text-cinematic-neon-blue"
                                        : "bg-white/5 border-white/10 text-white/40"
                                )}
                            >
                                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={markAllAsRead}
                                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {isRTL ? "قراءة الكل" : "Mark All Read"}
                            </button>
                            <button
                                onClick={clearAll}
                                className="px-5 py-3 rounded-xl bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 text-cinematic-neon-red hover:bg-cinematic-neon-red/20 transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isRTL ? "مسح الكل" : "Clear All"}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Filter Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-8 overflow-x-auto scrollbar-hide"
                >
                    <div className="flex gap-2 p-1.5 bg-white/[0.02] rounded-2xl border border-white/5 w-fit min-w-full">
                        <FilterButton
                            active={filter === 'all'}
                            onClick={() => setFilter('all')}
                            icon={<Sparkles className="w-4 h-4" />}
                            label={isRTL ? "الكل" : "All"}
                            count={notifications.length}
                        />
                        <FilterButton
                            active={filter === 'unread'}
                            onClick={() => setFilter('unread')}
                            icon={<Eye className="w-4 h-4" />}
                            label={isRTL ? "غير مقروء" : "Unread"}
                            count={unreadCount}
                            highlight
                        />
                        {Object.entries(NOTIFICATION_TYPES).map(([key, val]) => (
                            <FilterButton
                                key={key}
                                active={filter === key}
                                onClick={() => setFilter(key)}
                                icon={<val.icon className="w-4 h-4" />}
                                label={isRTL ? val.label : val.labelEn}
                                count={notifications.filter(n => n.type === key).length}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Notifications List */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredNotifications.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-32 text-center"
                            >
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                    <Bell className="w-10 h-10 text-white/20" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic text-white/40 mb-2">
                                    {isRTL ? "لا توجد إشعارات" : "No Notifications"}
                                </h3>
                                <p className="text-xs text-white/20 uppercase tracking-[0.2em]">
                                    {isRTL ? "أنت على اطلاع بكل شيء!" : "You're all caught up!"}
                                </p>
                            </motion.div>
                        ) : (
                            filteredNotifications.map((notification, index) => (
                                <NotificationCard
                                    key={notification.id}
                                    notification={notification}
                                    index={index}
                                    isRTL={isRTL}
                                    onRead={() => markAsRead(notification.id)}
                                    onDelete={() => deleteNotification(notification.id)}
                                    onSelect={() => setSelectedNotification(notification)}
                                />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Notification Detail Modal */}
            <AnimatePresence>
                {selectedNotification && (
                    <NotificationModal
                        notification={selectedNotification}
                        isRTL={isRTL}
                        onClose={() => setSelectedNotification(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Filter Button Component
function FilterButton({ active, onClick, icon, label, count, highlight = false }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-wider whitespace-nowrap",
                active
                    ? "bg-white text-black shadow-lg"
                    : highlight && count > 0
                        ? "bg-cinematic-neon-blue/10 text-cinematic-neon-blue border border-cinematic-neon-blue/30"
                        : "text-white/40 hover:text-white hover:bg-white/5"
            )}
        >
            {icon}
            <span>{label}</span>
            {count > 0 && (
                <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px]",
                    active ? "bg-black/10" : highlight ? "bg-cinematic-neon-blue/20" : "bg-white/10"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

// Notification Card Component
function NotificationCard({ notification, index, isRTL, onRead, onDelete, onSelect }: any) {
    const TypeIcon = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.icon || Bell;
    const typeColor = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.color || 'from-gray-500 to-slate-600';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isRTL ? -100 : 100, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => { onRead(); onSelect(); }}
            className={cn(
                "group relative p-6 rounded-3xl border cursor-pointer transition-all duration-300 overflow-hidden",
                notification.read
                    ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                    : "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] shadow-[0_0_30px_rgba(0,240,255,0.05)]"
            )}
        >
            {/* Unread Indicator */}
            {!notification.read && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                        "absolute top-6 w-2.5 h-2.5 rounded-full bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)]",
                        isRTL ? "left-6" : "right-6"
                    )}
                />
            )}

            {/* Priority Bar */}
            {notification.priority === 'high' && !notification.read && (
                <div className={cn(
                    "absolute top-0 bottom-0 w-1 bg-gradient-to-b from-cinematic-neon-red via-orange-500 to-cinematic-neon-red",
                    isRTL ? "right-0" : "left-0"
                )} />
            )}

            <div className="flex items-start gap-5">
                {/* Icon */}
                <div className={cn(
                    "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg",
                    typeColor
                )}>
                    <TypeIcon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className={cn(
                            "font-bold text-lg leading-tight",
                            notification.read ? "text-white/70" : "text-white"
                        )}>
                            {isRTL ? notification.title : notification.titleEn}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {isRTL ? notification.time : notification.timeEn}
                            </span>
                        </div>
                    </div>
                    <p className={cn(
                        "text-sm leading-relaxed",
                        notification.read ? "text-white/40" : "text-white/60"
                    )}>
                        {isRTL ? notification.message : notification.messageEn}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRead(); }}
                            className="p-2 rounded-lg bg-white/5 hover:bg-cinematic-neon-blue/20 text-white/40 hover:text-cinematic-neon-blue transition-all"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-cinematic-neon-red/20 text-white/40 hover:text-cinematic-neon-red transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className={cn("w-5 h-5 text-white/20", isRTL && "rotate-180")} />
                </div>
            </div>

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-5", typeColor)} />
            </div>
        </motion.div>
    );
}

// Notification Modal
function NotificationModal({ notification, isRTL, onClose }: any) {
    const TypeIcon = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.icon || Bell;
    const typeColor = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.color || 'from-gray-500 to-slate-600';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-black/90 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                >
                    <X className="w-5 h-5 text-white/60" />
                </button>

                {/* Icon */}
                <div className={cn(
                    "w-20 h-20 rounded-3xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-2xl",
                    typeColor
                )}>
                    <TypeIcon className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h2 className="text-2xl font-black uppercase italic mb-3">
                    {isRTL ? notification.title : notification.titleEn}
                </h2>
                <p className="text-white/60 leading-relaxed mb-6">
                    {isRTL ? notification.message : notification.messageEn}
                </p>

                {/* Time */}
                <div className="flex items-center gap-2 text-white/30 text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    {isRTL ? notification.time : notification.timeEn}
                </div>

                {/* Action Button */}
                <button className="w-full mt-8 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-xl hover:bg-cinematic-neon-blue hover:text-white transition-all">
                    {isRTL ? "عرض التفاصيل" : "View Details"}
                </button>

                {/* Background Glow */}
                <div className={cn("absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-20 bg-gradient-to-br", typeColor)} />
            </motion.div>
        </motion.div>
    );
}
