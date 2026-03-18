'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    ShoppingBag,
    Heart,
    Bell,
    Settings,
    User,
    Sparkles,
    LogOut,
    Car,
    Gavel,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Languages,
    Wrench,
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUI } from '@/lib/UIContext';

const rawText = (value: string) => value;

// ── قائمة التنقل الرئيسية ──
const NAV_ITEMS = [
    { href: '/client/dashboard', icon: LayoutGrid, labelAr: 'الرئيسية', labelEn: 'Home', match: ['/client/dashboard'] },
    { href: '/orders', icon: ShoppingBag, labelAr: 'طلباتي', labelEn: 'Orders', match: ['/orders'] },
    { href: '/client/smart-alerts', icon: Sparkles, labelAr: 'تنبيهاتي', labelEn: 'Alerts', match: ['/client/smart-alerts'], highlight: true },
    { href: '/favorites', icon: Heart, labelAr: 'المفضلة', labelEn: 'Favorites', match: ['/favorites'] },
    { href: '/client/settings', icon: Settings, labelAr: 'الإعدادات', labelEn: 'Settings', match: ['/client/settings'] },
    { href: '/client/messages', icon: MessageCircle, labelAr: 'الرسائل', labelEn: 'Messages', match: ['/client/messages'] },
];

// ── روابط الوصول السريع في الشريط الجانبي ──
const QUICK_LINKS = [
    { href: '/gallery', icon: Car, labelAr: 'المعرض', labelEn: 'Showroom' },
    { href: '/auctions', icon: Gavel, labelAr: 'المزادات', labelEn: 'Auctions' },
    { href: '/parts', icon: Wrench, labelAr: 'قطع الغيار', labelEn: 'Parts' },
    { href: '/notifications', icon: Bell, labelAr: 'الإشعارات', labelEn: 'Notifications' },
    { href: '/client/profile', icon: User, labelAr: 'الملف الشخصي', labelEn: 'Profile' },
];

function ClientSidebar() {
    const pathname = usePathname();
    const { isRTL, toggleLanguage } = useLanguage();
    const { user, logout } = useAuth();
    const router = useRouter();
    const { setFavoritesOpen, setNotificationsOpen } = useUI();

    const isActive = (paths: string[]) => paths.some(p => pathname === p || pathname.startsWith(p + '/'));

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <aside className={cn(
            'hidden lg:flex flex-col w-64 xl:w-72 bg-[#0c0c0f] border-white/6 min-h-screen sticky top-0 h-screen overflow-y-auto',
            isRTL ? 'border-l' : 'border-r'
        )}>
            {/* Logo + User */}
            <div className="p-6 border-b border-white/6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 mb-6 group">
                    <div className="w-9 h-9 rounded-xl bg-cinematic-neon-gold/15 border border-cinematic-neon-gold/25 flex items-center justify-center">
                        <span className="font-black text-cinematic-neon-gold text-sm">{rawText('HM')}</span>
                    </div>
                    <div>
                        <div className="font-black text-white text-base leading-none">{rawText('HM')} <span className="text-cinematic-neon-gold">{rawText('CAR')}</span></div>
                        <div className="text-[9px] text-white/25 font-bold uppercase tracking-[0.2em] mt-0.5">
                            {isRTL ? rawText('بوابة العميل') : rawText('Client Portal')}
                        </div>
                    </div>
                </Link>

                {/* User Card */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/3 border border-white/6">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cinematic-neon-gold/30 to-cinematic-neon-gold/10 flex items-center justify-center text-cinematic-neon-gold font-black text-base shrink-0">
                        {user?.name?.charAt(0)?.toUpperCase() || rawText('?')}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-white truncate">{user?.name || (isRTL ? rawText('العميل') : rawText('Guest'))}</div>
                        <div className="text-[10px] text-cinematic-neon-gold/70 font-bold uppercase tracking-wider">
                            {isRTL ? rawText('عضو نشط') : rawText('Active Member')}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Nav */}
            <nav className="flex-1 p-4 space-y-1">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-3 mb-3">
                    {isRTL ? rawText('القائمة') : rawText('Menu')}
                </div>
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.match);
                    const Icon = item.icon;
                    const isDrawerItem = item.href === '/favorites' || item.href === '/notifications';

                    const handleClick = (e: React.MouseEvent) => {
                        if (isDrawerItem) {
                            e.preventDefault();
                            if (item.href === '/favorites') setFavoritesOpen(true);
                            if (item.href === '/notifications') setNotificationsOpen(true);
                        }
                    };

                    return (
                        <Link key={item.href} href={item.href} onClick={handleClick}>
                            <motion.div
                                whileHover={{ x: isRTL ? -4 : 4 }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative',
                                    isRTL ? 'flex-row-reverse text-right' : '',
                                    active
                                        ? 'bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 text-cinematic-neon-gold'
                                        : 'text-white/40 hover:text-white hover:bg-white/4'
                                )}
                            >
                                {item.highlight && !active && (
                                    <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-cinematic-neon-gold animate-pulse" />
                                )}
                                <Icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-cinematic-neon-gold' : '')} strokeWidth={active ? 2.5 : 1.8} />
                                <span className="text-[13px] font-semibold">{isRTL ? item.labelAr : item.labelEn}</span>
                                {active && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className={cn('absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-cinematic-neon-gold', isRTL ? 'right-0' : 'left-0')}
                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}

                {/* Divider */}
                <div className="my-4 border-t border-white/5" />

                <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-3 mb-3">
                    {isRTL ? rawText('الموقع') : rawText('Browse')}
                </div>

                {QUICK_LINKS.map((item) => {
                    const Icon = item.icon;
                    const isDrawerItem = item.href === '/favorites' || item.href === '/notifications';

                    const handleClick = (e: React.MouseEvent) => {
                        if (isDrawerItem) {
                            e.preventDefault();
                            if (item.href === '/favorites') setFavoritesOpen(true);
                            if (item.href === '/notifications') setNotificationsOpen(true);
                        }
                    };

                    return (
                        <Link key={item.href} href={item.href} onClick={handleClick}>
                            <motion.div
                                whileHover={{ x: isRTL ? -4 : 4 }}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/3 transition-all duration-200',
                                    isRTL ? 'flex-row-reverse text-right' : ''
                                )}
                            >
                                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                                <span className="text-[12px] font-medium">{isRTL ? item.labelAr : item.labelEn}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-white/6">
                <button
                    onClick={toggleLanguage}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/3 transition-all mb-1',
                        isRTL ? 'flex-row-reverse' : ''
                    )}
                    title={isRTL ? 'تغيير اللغة' : 'Toggle Language'}
                >
                    <Languages className="w-4 h-4 shrink-0 text-accent-gold" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium">{isRTL ? rawText('English') : rawText('العربية')}</span>
                </button>
                <button
                    onClick={handleLogout}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400/50 hover:text-red-400 hover:bg-red-400/6 transition-all',
                        isRTL ? 'flex-row-reverse' : ''
                    )}
                >
                    <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span className="text-[12px] font-medium">{isRTL ? rawText('تسجيل الخروج') : rawText('Sign Out')}</span>
                </button>
            </div>
        </aside>
    );
}

function ClientBottomBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const { setFavoritesOpen, setNotificationsOpen } = useUI();

    const isActive = (paths: string[]) => paths.some(p => pathname === p || pathname.startsWith(p + '/'));

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0c0c0f]/95 backdrop-blur-2xl border-t border-white/6"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <div className="flex items-center justify-around px-2 pt-2 pb-2 max-w-md mx-auto">
                {NAV_ITEMS.map((item) => {
                    const active = isActive(item.match);
                    const Icon = item.icon;
                    const isDrawerItem = item.href === '/favorites' || item.href === '/notifications';

                    const handleClick = (e: React.MouseEvent) => {
                        if (isDrawerItem) {
                            e.preventDefault();
                            if (item.href === '/favorites') setFavoritesOpen(true);
                            if (item.href === '/notifications') setNotificationsOpen(true);
                        }
                    };

                    return (
                        <Link key={item.href} href={item.href} className="flex-1" onClick={handleClick}>
                            <motion.div
                                whileTap={{ scale: 0.85 }}
                                className="flex flex-col items-center gap-1 relative"
                            >
                                {/* نقطة التنبيه */}
                                {item.highlight && !active && (
                                    <div className="absolute -top-0.5 right-1/4 w-1.5 h-1.5 rounded-full bg-cinematic-neon-gold animate-pulse" />
                                )}

                                {/* أيقونة */}
                                <div className={cn(
                                    'relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-300',
                                    active ? 'bg-cinematic-neon-gold/15' : ''
                                )}>
                                    {active && (
                                        <motion.div
                                            layoutId="bottom-bar-bg"
                                            className="absolute inset-0 rounded-xl bg-cinematic-neon-gold/10"
                                            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                        />
                                    )}
                                    <Icon
                                        className={cn('w-5 h-5 relative z-10 transition-colors duration-200', active ? 'text-cinematic-neon-gold' : 'text-white/25')}
                                        strokeWidth={active ? 2.5 : 1.8}
                                    />
                                </div>

                                {/* التسمية */}
                                <span className={cn(
                                    'text-[9px] font-bold tracking-wide transition-colors duration-200',
                                    active ? 'text-cinematic-neon-gold' : 'text-white/25'
                                )}>
                                    {isRTL ? item.labelAr : item.labelEn}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

function ClientTopBar() {
    const pathname = usePathname();
    const { isRTL } = useLanguage();
    const router = useRouter();
    const { setNotificationsOpen } = useUI();

    // تحديد عنوان الصفحة الحالية
    const getPageTitle = () => {
        if (pathname.includes('/dashboard')) return isRTL ? 'لوحة التحكم' : 'Dashboard';
        if (pathname.includes('/smart-alerts')) return isRTL ? 'التنبيهات الذكية' : 'Smart Alerts';
        if (pathname.includes('/settings')) return isRTL ? 'الإعدادات' : 'Settings';
        if (pathname.includes('/profile')) return isRTL ? 'الملف الشخصي' : 'Profile';
        return 'HM CAR';
    };

    const showBack = pathname !== '/client/dashboard';

    return (
        <header className={cn(
            'lg:hidden sticky top-0 z-40 bg-[#0c0c0f]/95 backdrop-blur-2xl border-b border-white/6 px-4 py-3.5 flex items-center',
            isRTL ? 'flex-row-reverse' : ''
        )}>
            {showBack ? (
                <button
                    onClick={() => router.back()}
                    className={cn(
                        'w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-white/50 hover:text-white transition-all shrink-0',
                        isRTL ? 'ml-3' : 'mr-3'
                    )}
                >
                    {isRTL ? <ChevronRight className="w-4.5 h-4.5" /> : <ChevronLeft className="w-4.5 h-4.5" />}
                </button>
            ) : (
                <div className={cn('flex items-center gap-2 shrink-0', isRTL ? 'ml-3' : 'mr-3')}>
                    <div className="w-7 h-7 rounded-lg bg-cinematic-neon-gold/15 border border-cinematic-neon-gold/25 flex items-center justify-center">
                        <span className="font-black text-cinematic-neon-gold text-[10px]">{rawText('HM')}</span>
                    </div>
                </div>
            )}

            <h1 className="flex-1 text-[15px] font-bold text-white tracking-tight text-center">
                {getPageTitle()}
            </h1>

            <button 
                onClick={() => setNotificationsOpen(true)}
                className={cn(
                    'w-9 h-9 rounded-xl bg-white/4 border border-white/8 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0',
                    isRTL ? 'mr-3' : 'ml-3'
                )}
                title={isRTL ? 'الإشعارات' : 'Notifications'}
            >
                <Bell className="w-4 h-4" />
            </button>
        </header>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isRTL } = useLanguage();
    const pathname = usePathname();

    return (
        <div className={cn('min-h-screen bg-[#080809] text-white flex', isRTL ? 'rtl' : 'ltr')}>
            {/* الشريط الجانبي - شاشات الكمبيوتر */}
            <ClientSidebar />

            {/* المحتوى الرئيسي */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0">
                {/* شريط الأعلى للموبايل */}
                <ClientTopBar />

                {/* المحتوى */}
                <main className="flex-1 pb-24 lg:pb-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* شريط التنقل السفلي - الموبايل */}
            <ClientBottomBar />
        </div>
    );
}



