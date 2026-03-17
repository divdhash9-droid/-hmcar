'use client';

/**
 * قائمة الإشعارات الحية (Live Notifications List)
 * تعرض آخر الأنشطة في النظام (مثل تسجيل دخول المستخدمين) بشكل مباشر باستخدام Socket.IO.
 * تدعم الرسوم المتحركة لدخول المكونات الجديدة.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/lib/SocketContext';
import { User, Bell, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveNotificationsList({ isRTL }: { isRTL: boolean }) {
    const { socket } = useSocket();
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        // معالج استقبال الإشعارات الإدارية من السيرفر
        const handleNotification = (notification: any) => {
            // الاحتفاظ بآخر 10 إشعارات فقط لضمان أداء المتصفح
            setNotifications(prev => [notification, ...prev].slice(0, 10));
        };

        socket.on('admin_notification', handleNotification);

        return () => {
            socket.off('admin_notification', handleNotification);
        };
    }, [socket]);

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Bell className="w-12 h-12 mb-4 opacity-10" />
                <p className="text-[10px] uppercase tracking-[0.4em] font-black">
                    {isRTL ? "بانتظار النشاط..." : "AWAITING ACTIVITY..."}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
            <AnimatePresence initial={false}>
                {notifications.map((notif, i) => (
                    <motion.div
                        key={notif.timestamp || i}
                        initial={{ opacity: 0, x: isRTL ? 50 : -50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-cinematic-neon-red/20 transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "p-2.5 rounded-xl shrink-0 shadow-lg",
                                notif.type === 'USER_LOGIN' ? "bg-cinematic-neon-red/20 text-cinematic-neon-red shadow-cinematic-neon-red/10" : "bg-cinematic-neon-blue/20 text-cinematic-neon-blue shadow-cinematic-neon-blue/10"
                            )}>
                                {notif.type === 'USER_LOGIN' ? <User className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-white">
                                        {notif.title}
                                    </span>
                                    <span className="text-[8px] text-white/20 font-bold">
                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-[11px] text-white/60 leading-relaxed">
                                    {notif.message}
                                </p>
                                {notif.data?.ip && (
                                    <div className="mt-2 flex items-center gap-2 text-[8px] text-white/20 font-bold uppercase tracking-widest">
                                        <MapPin className="w-2.5 h-2.5" />
                                        <span>IP: {notif.data.ip}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
