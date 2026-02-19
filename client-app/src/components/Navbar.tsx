'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, LogOut, Settings,
    Car, Gavel, Search, ShoppingBag,
    ShieldCheck, LayoutDashboard, Languages, Bell, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { user, isLoggedIn, logout } = useAuth();
    const { t, lang, toggleLanguage, isRTL } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const navLinks = [
        { href: '/showroom', label: isRTL ? 'المعرض' : 'SHOWROOM', icon: Car },
        { href: '/auctions', label: isRTL ? 'المزادات' : 'AUCTIONS', icon: Gavel },
        { href: '/parts', label: isRTL ? 'القطع' : 'PARTS', icon: ShoppingBag },
        { href: '/concierge', label: isRTL ? 'الكونسيرج' : 'CONCIERGE', icon: Settings },
        { href: '/contact', label: isRTL ? 'تواصل' : 'CONTACT', icon: Search },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-700",
                    scrolled
                        ? "bg-black/70 backdrop-blur-xl border-b border-white/5 py-3"
                        : "bg-transparent py-5"
                )}
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                <div className="max-w-[1600px] mx-auto px-6 flex items-center justify-between">
                    {/* Logo + page-specific back */}
                    <div className="group flex flex-col items-start gap-2 shrink-0">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="relative">
                                <span className="text-xl font-black tracking-[-0.04em] text-white group-hover:text-white/80 transition-colors drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                                    HM
                                </span>
                                <span className="text-xl font-display italic text-white/30 ml-1 group-hover:text-[#c9a96e] transition-colors drop-shadow-[0_0_8px_rgba(201,169,110,0.5)]">
                                    CAR
                                </span>
                            </div>
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

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-1"></div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2">
                        {isLoggedIn && pathname !== '/' && (
                            <NotificationDropdown />
                        )}
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
                                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center text-white/40">
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
                                        <button className="w-full btn-luxury py-4 rounded-xl text-[10px]">
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
