'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
    Gavel, Car, ShoppingBag, Settings, 
    Bell, User, ChevronRight, MessageCircle, Star 
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/AuthContext';
import CurrencySwitcher from './CurrencySwitcher';

/**
 * AppHome - الواجهة الرئيسية المخصصة للجوال (نمط التطبيق)
 * ──────────────────────────────────────────────────
 * بدلاً من صفحة الهبوط الطويلة، نقدم للعميل "مركز عمليات" سريع
 * يحتوي على أهم الاختصارات، آخر السيارات، وحالة حسابه.
 */
export default function AppHome({ isRTL, latestCars, formatPrice }: { isRTL: boolean; latestCars: any[]; formatPrice: (p: number) => string }) {
    const { user, isLoggedIn } = useAuth();

    const quickActions = [
        { href: '/auctions/live', labelAr: 'المزاد المباشر', labelEn: 'Live Auction', icon: Gavel, color: 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/20' },
        { href: '/gallery', labelAr: 'المعرض', labelEn: 'Showroom', icon: Car, color: 'bg-accent-gold/10 text-accent-gold border-accent-gold/20' },
        { href: '/parts', labelAr: 'قطع الغيار', labelEn: 'Parts Store', icon: ShoppingBag, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
        { href: '/concierge', labelAr: 'طلب خاص', labelEn: 'Requests', icon: Settings, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    ];

    const userProfileImage = (user as any)?.image || null;

    return (
        <div className="flex flex-col gap-8 pb-10 px-5 pt-8 max-w-lg mx-auto overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            
            {/* 1. ترحيب العميل (Header) */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {isLoggedIn && userProfileImage ? (
                            <Image src={userProfileImage} alt="User" width={48} height={48} className="object-cover" />
                        ) : (
                            <User className="w-6 h-6 text-white/20" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white leading-tight">
                            {isRTL ? 'أهلاً بك،' : 'Welcome,'} <br />
                            <span className="text-accent-gold text-sm font-bold opacity-80">
                                {isLoggedIn ? (user?.name || (isRTL ? 'عميلنا العزيز' : 'Dear Client')) : (isRTL ? 'زائرنا العزيز' : 'Guest User')}
                            </span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60"
                        title={isRTL ? 'الإشعارات' : 'Notifications'}
                    >
                        <Bell className="w-4.5 h-4.5" />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-cinematic-neon-red" />
                    </button>
                    <CurrencySwitcher variant="minimal" />
                    {!isLoggedIn && (
                        <Link href="/login" className="px-4 py-2 rounded-xl bg-accent-gold text-black text-[10px] font-black uppercase tracking-widest">
                            {isRTL ? 'دخول' : 'LOGIN'}
                        </Link>
                    )}
                </div>
            </header>

            {/* 2. الوصول السريع (Quick Actions Grid) */}
            <section className="grid grid-cols-2 gap-4">
                {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <Link key={i} href={action.href}>
                            <motion.div 
                                whileTap={{ scale: 0.95 }}
                                className={`flex flex-col items-start gap-4 p-5 rounded-[2rem] border transition-all ${action.color}`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-xs font-black uppercase tracking-wider">
                                    {isRTL ? action.labelAr : action.labelEn}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </section>

            {/* 3. بطاقة حالة الحساب (Status Card) */}
            {isLoggedIn && (
                <section className="p-6 rounded-[2.5rem] bg-linear-to-br from-white/[0.08] to-transparent border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative group">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-accent-gold/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
                     <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-accent-gold" />
                        {isRTL ? 'حالة النشاط' : 'ACTIVITY STATUS'}
                     </h3>
                     <div className="grid grid-cols-2 gap-8">
                        <div className="relative">
                            <p className="text-3xl font-black text-white tracking-tighter">0</p>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{isRTL ? 'طلبات نشطة' : 'Active Orders'}</p>
                        </div>
                        <div className="relative">
                            <p className="text-3xl font-black text-accent-gold tracking-tighter">0</p>
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">{isRTL ? 'مزادات متابعة' : 'Watched Auctions'}</p>
                        </div>
                     </div>
                </section>
            )}

            {/* 4. آخر السيارات المضافة (Trending Section) */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-white italic uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-4 h-4 text-accent-gold" />
                        {isRTL ? 'أحدث السيارات' : 'LATEST ARRIVALS'}
                    </h2>
                    <Link href="/gallery" className="text-[9px] font-black text-accent-gold uppercase tracking-widest flex items-center gap-1">
                        {isRTL ? 'عرض الكل' : 'VIEW ALL'}
                        <ChevronRight className={`w-3 h-3 ${isRTL ? 'rotate-180' : ''}`} />
                    </Link>
                </div>

                <div className="flex flex-col gap-4">
                    {latestCars.slice(0, 3).map((car, i) => (
                        <motion.button 
                            key={car.id || i}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => window.location.href = `/cars/${car.id}`}
                            className="group relative flex items-center gap-4 p-3 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all text-right"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                <Image src={car.images?.[0] || '/images/placeholder.jpg'} alt={car.title} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white uppercase truncate mb-1">
                                    {car.title || car.name}
                                </h4>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[9px] font-bold text-white/40">{car.year}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/10" />
                                    <span className="text-[9px] font-bold text-white/40 truncate">{car.make?.name || car.make}</span>
                                </div>
                                <p className="text-xs font-black text-accent-gold">
                                    {formatPrice(Number(car.price || car.priceSar || (Number(car.priceUsd || 0) * 3.75) || 0))}
                                </p>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-white/10 group-hover:text-accent-gold transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                        </motion.button>
                    ))}
                </div>
            </section>

            {/* 5. تواصل سريع (Support Card) */}
            <section className="p-6 rounded-[2rem] bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">{isRTL ? 'تحتاج مساعدة؟' : 'NEED HELP?'}</h3>
                    <p className="text-[10px] text-white/40 font-bold">{isRTL ? 'فريقنا متاح 24/7 لمساعدتك' : 'Our team is available 24/7'}</p>
                </div>
                <button 
                    className="w-12 h-12 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    title={isRTL ? 'تواصل معنا' : 'Contact Support'}
                >
                    <MessageCircle className="w-6 h-6" />
                </button>
            </section>

        </div>
    );
}
