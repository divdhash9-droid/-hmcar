'use client';

/**
 * مكون مسطرة التنقل العلوي (Navbar)
 * يحتوي على الشعار، روابط التنقل، المفضلة، سلة المشتريات، وتغيير اللغة والعملة.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, Languages,
    Headphones, MessageCircle,
    Car, Gavel, ShoppingBag, Settings, ShoppingCart, Heart
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import { useStandalone } from '@/lib/useStandalone';
import { useUI } from '@/lib/UIContext';
import { Bell } from 'lucide-react';
import CurrencySwitcher from './CurrencySwitcher';

const rawText = (value: string) => value;

export default function Navbar() {
    const isStandalone = useStandalone(); // التحقق مما إذا كان التطبيق يعمل كـ PWA مثبت
    const [isOpen, setIsOpen] = useState(false); // حالة القائمة الجانبية للجوال
    const [scrolled, setScrolled] = useState(false); // حالة التمرير لتغيير شفافية المسطرة
    const [cartCount, setCartCount] = useState(0); // عدد العناصر في السلة
    const pathname = usePathname(); // مسار الصفحة الحالي

    // [[ARABIC_COMMENT]] جلب عدد عناصر السلة من localStorage
    // تحديث عدد عناصر السلة عند التغيير في التخزين المحلي
    useEffect(() => {
        const updateCart = () => {
            try {
                const cart = JSON.parse(localStorage.getItem('hm_cart') || '[]');
                setCartCount(Array.isArray(cart) ? cart.length : 0);
            } catch { setCartCount(0); }
        };
        updateCart();
        window.addEventListener('hm_cart_updated', updateCart);
        window.addEventListener('storage', updateCart);
        return () => {
            window.removeEventListener('hm_cart_updated', updateCart);
            window.removeEventListener('storage', updateCart);
        };
    }, []);

    const { isLoggedIn } = useAuth();
    const { isRTL, toggleLanguage } = useLanguage();
    const { siteInfo } = useSettings();
    const { setFavoritesOpen, setNotificationsOpen } = useUI();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // تأخير الإغلاق لتجنب cascading renders
        const timer = setTimeout(() => { if (isOpen) setIsOpen(false); }, 0);
        return () => clearTimeout(timer);
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    // روابط التنقل الرئيسية
    const navLinks = [
        { href: '/gallery', label: isRTL ? 'المعرض' : 'SHOWROOM', icon: Car },
        { href: '/auctions', label: isRTL ? 'المزادات' : 'AUCTIONS', icon: Gavel },
        { href: '/parts', label: isRTL ? 'القطع' : 'PARTS', icon: ShoppingBag },
        { href: '/concierge', label: isRTL ? 'طلبات خاصة' : 'REQUESTS', icon: Settings },
        { href: '/support', label: isRTL ? 'الدعم' : 'SUPPORT', icon: Headphones },
        { href: '/contact', label: isRTL ? 'تواصل' : 'CONTACT', icon: MessageCircle },
    ];

    const isActive = (href: string) => pathname === href;

    // ── لا يظهر Navbar في صفحات الأدمن - AdminNavbar يتولى التنقل هناك ──
    if (pathname?.startsWith('/admin')) return null;


    // في وضع التطبيق المثبت، لا نعرض الـ Navbar - BottomTabBar يتولى التنقل
    if (isStandalone) return null;

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
                    scrolled
                        ? "bg-black/40 backdrop-blur-xl border-b border-white/10 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                        : "bg-transparent py-6"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="max-w-400 mx-auto px-6 flex items-center justify-between">
                    {/* الشعار - Logo */}
                    <div className="group flex flex-col items-start gap-2 shrink-0">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative flex items-center"
                            >
                                <span className="text-2xl font-black tracking-[-0.04em] text-white transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                    {siteInfo?.siteName?.split(' ')[0] || rawText('HM')}
                                </span>
                                <span className="text-2xl font-display italic text-accent-gold ml-1 transition-all drop-shadow-[0_0_12px_rgba(201,169,110,0.5)]">
                                    {siteInfo?.siteName?.split(' ')[1] || rawText('CAR')}
                                </span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '100%' }}
                                    className="absolute -bottom-1 left-0 h-px bg-accent-gold opacity-50"
                                />
                            </motion.div>
                        </Link>
                        </div>
                    </div>


                    {/* أزرار الإجراءات على اليمين (أو اليسار في RTL) - Right Actions */}
                    <div className="flex items-center gap-2">
                        {pathname !== '/' && (
                            <>
                                {isLoggedIn && (
                                    <button
                                        onClick={() => setNotificationsOpen(true)}
                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all relative"
                                        title={isRTL ? 'الإشعارات' : 'Notifications'}
                                    >
                                        <Bell className="w-4 h-4" />
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cinematic-neon-red animate-pulse" />
                                    </button>
                                )}

                                {!isLoggedIn && (
                                    <Link href="/login" className="hidden sm:block">
                                        <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                            {isRTL ? rawText('دخول') : rawText('SIGN IN')}
                                        </button>
                                    </Link>
                                )}

                                {/* [[ARABIC_COMMENT]] زر المفضلة */}
                                <button 
                                    onClick={() => setFavoritesOpen(true)}
                                    className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all" 
                                    title={isRTL ? 'المفضلة' : 'Favorites'}
                                >
                                    <Heart className="w-4 h-4" />
                                </button>

                                {/* [[ARABIC_COMMENT]] زر السلة مع عداد */}
                                <Link href="/cart" className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                                    <ShoppingCart className="w-4 h-4" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 bg-cinematic-neon-gold text-black text-[9px] font-black rounded-full flex items-center justify-center px-1">
                                            {cartCount > 9 ? rawText('9+') : cartCount}
                                        </span>
                                    )}
                                </Link>

                                {/* [[ARABIC_COMMENT]] محول العملات الجديد */}
                                <CurrencySwitcher variant="minimal" />

                                {/* زر تغيير اللغة - لتبديل الواجهة بين العربية والإنجليزية */}
                                <button
                                    onClick={toggleLanguage}
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                                    title={isRTL ? "English" : "العربية"}
                                >
                                    <Languages className="w-4 h-4 text-accent-gold" />
                                </button>
                            </>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsOpen(true)}
                            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            aria-label={isRTL ? "افتح القائمة" : "Open Menu"}
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* ═══ MOBILE MENU ═══ */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 lg:hidden"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/70 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: isRTL ? '-100%' : '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? '-100%' : '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className={cn(
                                "absolute top-0 bottom-0 w-85 max-w-sm bg-cinematic-dark border-white/5 flex flex-col",
                                isRTL ? "left-0 border-r" : "right-0 border-l"
                            )}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* هيدر القائمة الجانبية - Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <span className="text-lg font-black">
                                    {rawText('HM')} <span className="font-display italic text-white/30">{rawText('CAR')}</span>
                                </span>
                                <button onClick={() => setIsOpen(false)} title="Close" className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center text-white/40">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* الروابط داخل قائمة الجوال - Links */}
                            <div className="flex-1 p-6 space-y-2 overflow-y-auto">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className={cn(
                                                "flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all",
                                                isActive(link.href)
                                                    ? "bg-white/5 text-white border border-white/8"
                                                    : "text-white/30 hover:text-white/60 hover:bg-white/2"
                                            )}
                                        >
                                            <link.icon className="w-4.5 h-4.5" />
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* تذييل القائمة الجانبية - Footer */}
                            <div className="p-6 border-t border-white/5 space-y-3">
                                {!isLoggedIn && (
                                    <Link href="/login" className="block">
                                        <button className="w-full btn-luxury py-4 rounded-xl text-[12px]">
                                            <User className="w-3.5 h-3.5" />
                                            {isRTL ? rawText('تسجيل الدخول') : rawText('SIGN IN')}
                                        </button>
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

