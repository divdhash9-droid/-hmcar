'use client';

/**
 * اللوحات الجانبية العالمية (Global Drawers)
 * مكون واحد يتحكم في عرض لوحة "المفضلة" أو "الإشعارات" بناءً على حالة الـ UI.
 * يستخدم التصميم السينمائي الغامق مع تأثيرات ضبابية (Blur) وحركات سلسة.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Bell, X, ArrowRight, Clock, Gavel, ShoppingBag, Car, Gift, Settings, AlertTriangle } from 'lucide-react';
import { useUI } from '@/lib/UIContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const rawText = (value: string) => value;

// --- أنواع البيانات للمفضلة (Favorites) ---
interface FavoriteItem {
    id: string;
    type: 'car' | 'part';
    title: string;
    price: number;
    image: string;
    brand?: string;
}

// --- أنواع الإشعارات وأيقوناتها وألوانها ---
const NOTIFICATION_TYPES = {
    bid: { icon: Gavel, color: 'from-amber-500 to-orange-600' }, // مزايدة
    order: { icon: ShoppingBag, color: 'from-emerald-500 to-green-600' }, // طلب شراء
    car: { icon: Car, color: 'from-blue-500 to-cyan-600' }, // سيارة جديدة
    promo: { icon: Gift, color: 'from-pink-500 to-rose-600' }, // عرض ترويجي
    system: { icon: Settings, color: 'from-slate-500 to-gray-600' }, // نظام
    alert: { icon: AlertTriangle, color: 'from-red-500 to-rose-600' }, // تنبيه هام
};

const SAMPLE_NOTIFICATIONS = [
    { id: 1, type: 'bid', title: 'مزايدة جديدة!', message: 'تم تقديم مزايدة على Mercedes AMG', time: '2 د', read: false },
    { id: 2, type: 'order', title: 'طلبك قيد المعالجة', message: 'طلب #HM-2024-0892 قيد الشحن', time: '15 د', read: false },
    { id: 3, type: 'car', title: 'سيارة أحلامك متوفرة!', message: 'Lamborghini Urus 2024 الآن في معرضنا', time: 'ساعة', read: true },
];

export default function GlobalDrawers() {
    const { isFavoritesOpen, setFavoritesOpen, isNotificationsOpen, setNotificationsOpen } = useUI();
    const { isRTL } = useLanguage();
    const { formatPrice, socialLinks } = useSettings();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [notifications] = useState(SAMPLE_NOTIFICATIONS);

    const WHATSAPP_NUMBER = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');

    useEffect(() => {
        if (isFavoritesOpen) {
            const data = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
            setFavorites(data);
        }
    }, [isFavoritesOpen]);

    const removeFromFavorites = (id: string) => {
        const updated = favorites.filter(f => f.id !== id);
        setFavorites(updated);
        localStorage.setItem('hm_favorites', JSON.stringify(updated));
    };

    const addToCart = (item: FavoriteItem) => {
        const cart = JSON.parse(localStorage.getItem('hm_cart') || '[]');
        const exists = cart.find((c: { id: string }) => c.id === item.id);
        if (!exists) {
            cart.push({ id: item.id, type: item.type, title: item.title, price: item.price, image: item.image });
            localStorage.setItem('hm_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('hm_cart_updated'));
        }
    };

    return (
        <AnimatePresence>
            {(isFavoritesOpen || isNotificationsOpen) && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setFavoritesOpen(false); setNotificationsOpen(false); }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: isRTL ? -450 : 450 }}
                        animate={{ x: 0 }}
                        exit={{ x: isRTL ? -450 : 450 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed top-0 bottom-0 w-full max-w-[450px] bg-[#0c0c0f] border-white/10 z-[101] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)]",
                            isRTL ? "left-0 border-r" : "right-0 border-l"
                        )}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
                                    isFavoritesOpen ? "bg-red-500/10 text-red-500" : "bg-cinematic-neon-blue/10 text-cinematic-neon-blue"
                                )}>
                                    {isFavoritesOpen ? <Heart className="w-6 h-6 fill-current" /> : <Bell className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black italic uppercase tracking-tight">
                                        {isFavoritesOpen 
                                            ? (isRTL ? rawText('المفضلة') : rawText('Favorites'))
                                            : (isRTL ? rawText('الإشعارات') : rawText('Notifications'))
                                        }
                                    </h2>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                                        {isFavoritesOpen 
                                            ? `${favorites.length} ${isRTL ? 'عنصر' : 'items'}`
                                            : (isRTL ? 'تنبيهاتك الذكية' : 'Smart Alerts')
                                        }
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => { setFavoritesOpen(false); setNotificationsOpen(false); }}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                title={isRTL ? 'إغلاق' : 'Close'}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {isFavoritesOpen ? (
                                favorites.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                                        <Heart className="w-16 h-16 text-white/5" />
                                        <p className="text-sm text-white/20 font-bold italic">{isRTL ? 'قائمة المفضلة فارغة حالياً' : 'Your wishlist is empty'}</p>
                                    </div>
                                ) : (
                                    favorites.map((item) => (
                                        <div key={item.id} className="group relative bg-white/3 border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all duration-300">
                                            <div className="flex p-3 gap-4">
                                                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                                                    <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                                                        <button 
                                                            onClick={() => removeFromFavorites(item.id)} 
                                                            className="text-white/20 hover:text-red-500 transition-colors"
                                                            title={isRTL ? 'إزالة' : 'Remove'}
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="text-red-400 font-black text-sm mt-1">{formatPrice(item.price)}</div>
                                                    <div className="flex gap-2 mt-3">
                                                        <button 
                                                            onClick={() => addToCart(item)}
                                                            className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10"
                                                        >
                                                            {isRTL ? 'السلة' : 'Cart'}
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                const msg = `💝 Request: ${item.title}`;
                                                                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
                                                            }}
                                                            className="flex-1 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white"
                                                        >
                                                            {isRTL ? 'شراء' : 'Buy'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                <div className="space-y-3">
                                    {notifications.map((n) => {
                                        const TypeIcon = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]?.icon || Bell;
                                        const typeColor = NOTIFICATION_TYPES[n.type as keyof typeof NOTIFICATION_TYPES]?.color || 'from-gray-500 to-slate-600';
                                        
                                        return (
                                            <div key={n.id} className={cn(
                                                "p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                                                n.read ? "bg-white/2 border-white/5" : "bg-cinematic-neon-blue/5 border-cinematic-neon-blue/20"
                                            )}>
                                                {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.5)]" />}
                                                <div className="flex gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg", typeColor)}>
                                                        <TypeIcon className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white mb-0.5">{n.title}</h4>
                                                        <p className="text-xs text-white/40 line-clamp-2">{n.message}</p>
                                                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/20 font-bold">
                                                            <Clock className="w-3 h-3" />
                                                            {n.time}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-black/20">
                            <button 
                                onClick={() => { setFavoritesOpen(false); setNotificationsOpen(false); }}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                            >
                                {isRTL ? 'إغلاق اللوحة الذكية' : 'Close smart panel'}
                                <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
