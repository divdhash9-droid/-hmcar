'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home, Car, Gavel, Wrench, User
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

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
        if (tab.exact) return pathname === tab.href;
        return tab.matchPaths.some(p => pathname.startsWith(p));
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-500 bg-cinematic-darker/98 border-t border-white/8 backdrop-blur-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            dir="ltr"
        >
            <div className="flex items-center justify-around px-1 pt-2 pb-2 max-w-lg mx-auto">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <Link key={tab.href} href={tab.href} className="flex-1">
                            <motion.div
                                whileTap={{ scale: 0.8 }}
                                className="flex flex-col items-center gap-1"
                            >
                                {/* أيقونة مع مؤشر النشاط */}
                                <div className="relative">
                                    {active && (
                                        <motion.div
                                            layoutId="tab-bg"
                                            className="absolute inset-0 -m-2 rounded-2xl bg-cinematic-neon-gold/15"
                                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-6 h-6 relative z-10 transition-colors duration-200 ${active ? 'text-cinematic-neon-gold' : 'text-white/30'
                                            }`}
                                        strokeWidth={active ? 2.5 : 1.5}
                                    />
                                </div>

                                {/* التسمية */}
                                <span
                                    className={`text-[10px] font-bold tracking-wide transition-colors duration-200 ${active ? 'text-cinematic-neon-gold' : 'text-white/30'
                                        }`}
                                >
                                    {isRTL ? tab.labelAr : tab.labelEn}
                                </span>

                                {/* نقطة المؤشر */}
                                {active && (
                                    <motion.div
                                        layoutId="tab-dot"
                                        className="w-1 h-1 rounded-full bg-cinematic-neon-gold"
                                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
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


