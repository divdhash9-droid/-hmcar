'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, Languages, ArrowLeft, ArrowRight,
    Headphones, MessageCircle, Search,
    Car, Gavel, ShoppingBag, Settings, ShoppingCart, Heart
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';
import NotificationDropdown from './NotificationDropdown';
import { useStandalone } from '@/lib/useStandalone';

export default function Navbar() {
    const isStandalone = useStandalone();
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);
    const pathname = usePathname();

    // [[ARABIC_COMMENT]] جلب عدد عناصر السلة من localStorage
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

    const router = useRouter();
    const { user, isLoggedIn } = useAuth();
    const { isRTL, toggleLanguage } = useLanguage();
    const { siteInfo, displayCurrency, setDisplayCurrency } = useSettings();

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

    const navLinks = [
        { href: '/showroom', label: isRTL ? 'المعرض' : 'SHOWROOM', icon: Car },
        { href: '/search', label: isRTL ? 'تصفح السيارات' : 'BROWSE', icon: Search },
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
                        ? "bg-black/40 backdrop-blur-[24px] border-b border-white/10 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
                        : "bg-transparent py-6"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo + page-specific back */}
                    <div className="group flex flex-col items-start gap-2 shrink-0">
                        <Link href="/" className="flex items-center gap-3">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="relative flex items-center"
                            >
                                <span className="text-2xl font-black tracking-[-0.04em] text-white transition-all drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                    {siteInfo?.siteName?.split(' ')[0] || 'HM'}
                                </span>
                                <span className="text-2xl font-display italic text-accent-gold ml-1 transition-all drop-shadow-[0_0_12px_rgba(201,169,110,0.5)]">
                                    {siteInfo?.siteName?.split(' ')[1] || 'CAR'}
                                </span>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '100%' }}
                                    className="absolute -bottom-1 left-0 h-[1px] bg-accent-gold opacity-50"
                                />
                            </motion.div>
                        </Link>
                        {pathname === '/profile' && (
                            <div className="w-full">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                                    aria-label={isRTL ? 'عودة' : 'Back'}
                                >
                                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── التنقل الرئيسي ── */}
                    <div className="hidden lg:flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 backdrop-blur-xl">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-[0.1em] transition-all relative group",
                                    isActive(link.href)
                                        ? "text-white bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                        : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                                )}
                            >
                                {link.label}
                                {link.href === '/showroom' && (
                                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cinematic-neon-red opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cinematic-neon-red"></span>
                                    </span>
                                )}
                                {isActive(link.href) && (
                                    <motion.div
                                        layoutId="nav-active"
                                        className="absolute -bottom-1 left-6 right-6 h-[1px] bg-white opacity-40"
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {isLoggedIn && (
                            <div className="flex items-center gap-2">
                                <NotificationDropdown />
                                <Link
                                    href={user?.role === 'admin' ? '/admin' : '/profile'}
                                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                >
                                    <User className="w-4 h-4" />
                                </Link>
                            </div>
                        )}

                        {!isLoggedIn && (
                            <Link href="/login" className="hidden sm:block">
                                <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
                                    {isRTL ? 'دخول' : 'SIGN IN'}
                                </button>
                            </Link>
                        )}

                        {/* زر البحث */}
                        <div className="relative">
                            <button
                                onClick={() => { setSearchOpen(o => !o); setTimeout(() => searchRef.current?.focus(), 100); }}
                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                title={isRTL ? 'بحث' : 'Search'}
                            >
                                <Search className="w-4 h-4" />
                            </button>
                            <AnimatePresence>
                                {searchOpen && (
                                    <motion.form
                                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                        onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery(''); } }}
                                        className="absolute top-12 right-0 z-50 bg-[#0a0a0a] border border-white/10 rounded-2xl p-2 flex gap-2 shadow-[0_20px_60px_rgba(0,0,0,0.8)] min-w-[260px]"
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                    >
                                        <input
                                            ref={searchRef}
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder={isRTL ? 'ابحث عن سيارة أو قطعة...' : 'Search cars or parts...'}
                                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30 transition-all"
                                        />
                                        <button type="submit" className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl transition-all">
                                            <Search className="w-4 h-4" />
                                        </button>
                                    </motion.form>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* [[ARABIC_COMMENT]] زر المفضلة */}
                        <Link href="/favorites" className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all" title={isRTL ? 'المفضلة' : 'Favorites'}>
                            <Heart className="w-4 h-4" />
                        </Link>

                        {/* [[ARABIC_COMMENT]] زر السلة مع عداد */}
                        <Link href="/cart" className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <ShoppingCart className="w-4 h-4" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#c9a96e] text-black text-[9px] font-black rounded-full flex items-center justify-center px-1">
                                    {cartCount > 9 ? '9+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* [[ARABIC_COMMENT]] زر تدوير العملة بين SAR → USD → KRW → SAR */}
                        <button
                            onClick={() => setDisplayCurrency(
                                displayCurrency === 'SAR' ? 'USD' : displayCurrency === 'USD' ? 'KRW' : 'SAR'
                            )}
                            className={`w-10 h-10 rounded-xl bg-white/5 border flex items-center justify-center font-black text-[9px] transition-all ${displayCurrency === 'KRW'
                                ? 'border-yellow-400/40 text-yellow-400'
                                : displayCurrency === 'USD'
                                    ? 'border-cinematic-neon-blue/40 text-cinematic-neon-blue'
                                    : 'border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            title={isRTL ? "تغيير العملة" : "Change Currency"}
                        >
                            {displayCurrency === 'KRW' ? '₩' : displayCurrency === 'USD' ? '$' : 'ر.س'}
                        </button>
                        {/* [[ARABIC_COMMENT]] زر تغيير اللغة */}
                        <button
                            onClick={toggleLanguage}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            title={isRTL ? "تغيير اللغة" : "Change Language"}
                        >
                            <Languages className="w-5 h-5 text-accent-gold" />
                        </button>

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
                                "absolute top-0 bottom-0 w-[85%] max-w-sm bg-[#0a0a0a] border-white/5 flex flex-col",
                                isRTL ? "left-0 border-r" : "right-0 border-l"
                            )}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <span className="text-lg font-black">
                                    HM <span className="font-display italic text-white/30">CAR</span>
                                </span>
                                <button onClick={() => setIsOpen(false)} title="Close" className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center text-white/40">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Links */}
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
                                                "flex items-center gap-4 px-5 py-4 rounded-xl text-sm font-bold uppercase tracking-[0.1em] transition-all",
                                                isActive(link.href)
                                                    ? "bg-white/5 text-white border border-white/8"
                                                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.02]"
                                            )}
                                        >
                                            <link.icon className="w-4.5 h-4.5" />
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-6 border-t border-white/5 space-y-3">
                                {!isLoggedIn && (
                                    <Link href="/login" className="block">
                                        <button className="w-full btn-luxury py-4 rounded-xl text-[12px]">
                                            <User className="w-3.5 h-3.5" />
                                            {isRTL ? 'تسجيل الدخول' : 'SIGN IN'}
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
