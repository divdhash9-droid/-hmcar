'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, ChevronRight, Clock, Gavel, ShoppingBag, Car, Gift, Settings, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const NOTIFICATION_TYPES = {
    bid: { icon: Gavel, color: 'from-amber-500 to-orange-600' },
    order: { icon: ShoppingBag, color: 'from-emerald-500 to-green-600' },
    car: { icon: Car, color: 'from-blue-500 to-cyan-600' },
    promo: { icon: Gift, color: 'from-pink-500 to-rose-600' },
    system: { icon: Settings, color: 'from-slate-500 to-gray-600' },
    alert: { icon: AlertTriangle, color: 'from-red-500 to-rose-600' },
};

const SAMPLE_NOTIFICATIONS = [
    { id: 1, type: 'bid', title: 'مزايدة جديدة!', message: 'تم تقديم مزايدة على Mercedes AMG', time: '2 د', read: false },
    { id: 2, type: 'order', title: 'طلبك قيد المعالجة', message: 'طلب #HM-2024-0892 قيد الشحن', time: '15 د', read: false },
    { id: 3, type: 'car', title: 'سيارة أحلامك متوفرة!', message: 'Lamborghini Urus 2024 الآن في معرضنا', time: 'ساعة', read: true },
];

interface NotificationDropdownProps {
    isRTL?: boolean;
}

export default function NotificationDropdown({ isRTL = false }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(SAMPLE_NOTIFICATIONS);
    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="relative">
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative p-3 rounded-xl transition-all",
                    isOpen
                        ? "bg-cinematic-neon-blue/20 border border-cinematic-neon-blue/30"
                        : "bg-white/5 border border-white/10 hover:bg-white/10"
                )}
            >
                <Bell className={cn("w-5 h-5", isOpen && "text-cinematic-neon-blue")} />

                {/* Badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-cinematic-neon-red rounded-full flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(255,0,60,0.5)]"
                        >
                            {unreadCount}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Pulse Animation */}
                {unreadCount > 0 && (
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-xl border-2 border-cinematic-neon-blue"
                    />
                )}
            </motion.button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={cn(
                                "absolute top-full mt-3 z-50 w-96 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden",
                                isRTL ? "left-0" : "right-0"
                            )}
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cinematic-neon-blue to-purple-600 flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">{isRTL ? "الإشعارات" : "Notifications"}</h3>
                                        <span className="text-[10px] text-white/40">{unreadCount} {isRTL ? "جديد" : "new"}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={markAllRead}
                                    className="text-[10px] text-cinematic-neon-blue uppercase tracking-wider font-bold hover:underline"
                                >
                                    {isRTL ? "قراءة الكل" : "Mark all read"}
                                </button>
                            </div>

                            {/* Notifications */}
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Bell className="w-10 h-10 mx-auto mb-3 text-white/10" />
                                        <p className="text-xs text-white/30">{isRTL ? "لا توجد إشعارات" : "No notifications"}</p>
                                    </div>
                                ) : (
                                    notifications.map((notification) => {
                                        const TypeIcon = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.icon || Bell;
                                        const typeColor = NOTIFICATION_TYPES[notification.type as keyof typeof NOTIFICATION_TYPES]?.color || 'from-gray-500 to-slate-600';

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                onClick={() => markAsRead(notification.id)}
                                                className={cn(
                                                    "p-4 border-b border-white/5 flex items-start gap-4 cursor-pointer transition-all hover:bg-white/5",
                                                    !notification.read && "bg-cinematic-neon-blue/5"
                                                )}
                                            >
                                                {/* Icon */}
                                                <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", typeColor)}>
                                                    <TypeIcon className="w-5 h-5 text-white" />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={cn("text-sm font-bold truncate", notification.read ? "text-white/70" : "text-white")}>
                                                            {notification.title}
                                                        </h4>
                                                        {!notification.read && (
                                                            <div className="w-2 h-2 bg-cinematic-neon-blue rounded-full flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-white/40 truncate">{notification.message}</p>
                                                    <span className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {notification.time}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Footer */}
                            <Link href="/notifications" onClick={() => setIsOpen(false)}>
                                <div className="p-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs font-bold text-cinematic-neon-blue uppercase tracking-wider hover:bg-white/5 transition-all">
                                    {isRTL ? "عرض كل الإشعارات" : "View All Notifications"}
                                    <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                </div>
                            </Link>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
