'use client';

/**
 * شريط التنقل السفلي (Bottom Tab Bar) الواسع
 * مخصص لواجهة الجوال (PWA) ليوفر تجربة أسهل في القراءة والتمرير
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Home, Car, Bell, Wrench, User
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

// قائمة التبويبات (Tabs) والروابط المرتبطة بها - معدلة حسب طلب المستخدم
const TABS = [
    {
        href: '/gallery',
        icon: Car,
        labelAr: 'السيارات',
        labelEn: 'Cars',
        matchPaths: ['/gallery', '/showroom', '/cars'],
    },
    {
        href: '/parts',
        icon: Wrench,
        labelAr: 'قطع الغيار',
        labelEn: 'Parts',
        matchPaths: ['/parts'],
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
        href: '/notifications',
        icon: Bell,
        labelAr: 'الإشعارات',
        labelEn: 'Notifications',
        matchPaths: ['/notifications'],
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
            // جعلنا حجم الشريط وأزراره أكبر قليلاً، وأضفنا تأثيرات تجعل التمرير والضغط سلساً
            className="fixed bottom-0 left-0 right-0 z-[100] bg-[#0A0A0A] border-t border-white/10 backdrop-blur-3xl shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }} 
            dir="ltr"
        >
            <div className="flex items-center justify-around px-2 pt-4 pb-3 max-w-lg mx-auto overflow-hidden touch-pan-x">
                {TABS.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <Link key={tab.href} href={tab.href} className="flex-1 group" prefetch={true}>
                            <motion.div
                                whileTap={{ scale: 0.9 }} // تصغير خفيف جدا لزيادة السلاسة
                                className="flex flex-col items-center gap-1.5 cursor-pointer relative"
                            >
                                {/* أيقونة مع مؤشر النشاط */}
                                <div className="relative">
                                    {active && (
                                        <motion.div
                                            layoutId="tab-bg"
                                            className="absolute -inset-3 rounded-xl bg-cinematic-neon-gold/10"
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                        />
                                    )}
                                    <Icon
                                        className={`w-7 h-7 relative z-10 transition-all duration-300 ease-in-out ${
                                            active ? 'text-cinematic-neon-gold scale-110 drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]' : 'text-white/40 group-hover:text-white/70'
                                        }`}
                                        strokeWidth={active ? 2.5 : 2}
                                    />
                                </div>

                                {/* التسمية - حجم خط أكبر */}
                                <span
                                    className={`text-[12px] md:text-[13px] font-bold tracking-wide transition-all duration-300 ${
                                        active ? 'text-cinematic-neon-gold' : 'text-white/40 group-hover:text-white/70'
                                    }`}
                                >
                                    {isRTL ? tab.labelAr : tab.labelEn}
                                </span>

                                {/* نقطة المؤشر */}
                                {active && (
                                    <motion.div
                                        layoutId="tab-dot"
                                        className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-cinematic-neon-gold"
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


