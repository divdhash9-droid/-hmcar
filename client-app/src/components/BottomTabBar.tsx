'use client';

/**
 * شريط التنقل السفلي (Bottom Tab Bar)
 * مخصص لواجهة الجوال (PWA) ليوفر تجربة مشابهة للتطبيقات الأصلية.
 * يتيح الانتقال السريع بين المعرض، المزادات، الصفحة الرئيسية، القطع، والحساب الشخصي.
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home, Car, Gavel, Wrench, User
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

// قائمة التبويبات (Tabs) والروابط المرتبطة بها
const TABS = [
    {
        href: '/gallery',
        icon: Car,
        labelAr: 'المعرض',
        labelEn: 'Cars',
        matchPaths: ['/gallery', '/showroom', '/cars'],
    },
    {
        href: '/auctions',
        icon: Gavel,
        labelAr: 'المزادات',
        labelEn: 'Auctions',
        matchPaths: ['/auctions'],
    },
    {
        href: '/',
        icon: Home,
        labelAr: 'الرئيسية',
        labelEn: 'Home',
        matchPaths: ['/'],
        exact: true,
    },
    {
        href: '/parts',
        icon: Wrench,
        labelAr: 'قطع الغيار',
        labelEn: 'Parts',
        matchPaths: ['/parts'],
    },
    {
        href: '/client/dashboard',
        icon: User,
        labelAr: 'حسابي',
        labelEn: 'Account',
        matchPaths: ['/client', '/profile', '/orders'],
    },
];

export default function BottomTabBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();

    const isActive = (tab: typeof TABS[0]) => {
        // التحقق مما إذا كان المسار الحالي يطابق التبويب (سواء مطابقة تامة أو بداية المسار)
        if (tab.exact) return pathname === tab.href;
        return tab.matchPaths.some(p => pathname.startsWith(p));
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-500 bg-black/95 border-t border-white/10 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
            style={{ 
                paddingBottom: 'env(safe-area-inset-bottom, 12px)',
                height: 'calc(75px + env(safe-area-inset-bottom, 0px))'
            }}
            dir="ltr"
        >
            <div className="flex items-center justify-around h-full px-2 max-w-lg mx-auto">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <Link key={tab.href} href={tab.href} className="flex-1 h-full flex flex-col items-center justify-center">
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                className="flex flex-col items-center gap-1.5 relative py-1"
                            >
                                {/* أيقونة مع مؤشر النشاط */}
                                <div className="relative">
                                    {active && (
                                        <motion.div
                                            layoutId="tab-bg"
                                            className="absolute inset-0 -m-3 rounded-2xl bg-gradient-to-br from-cinematic-neon-gold/20 to-cinematic-neon-gold/5 blur-sm"
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-7 h-7 relative z-10 transition-all duration-300 ${
                                            active ? 'text-cinematic-neon-gold drop-shadow-[0_0_8px_rgba(201,169,110,0.5)]' : 'text-white/40'
                                        }`}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                </div>

                                {/* التسمية */}
                                <span
                                    className={`text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                                        active ? 'text-cinematic-neon-gold scale-105' : 'text-white/30'
                                    }`}
                                >
                                    {isRTL ? tab.labelAr : tab.labelEn}
                                </span>

                                {/* خط المؤشر النشط تحت الأيقونة */}
                                {active && (
                                    <motion.div
                                        layoutId="tab-line"
                                        className="absolute -bottom-1 w-6 h-0.5 rounded-full bg-cinematic-neon-gold shadow-[0_0_10px_#c9a96e]"
                                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}


