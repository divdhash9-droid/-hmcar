'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Menu, X, User, LogOut, Settings,
    Car, Gavel, Search, ShoppingBag,
    ShieldCheck, LayoutDashboard, Languages, Bell
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();
    const { user, logout, isLoggedIn, isAdmin } = useAuth();
    const { t, lang, toggleLanguage, isRTL } = useLanguage();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: t('home'), icon: LayoutDashboard },
        { href: '/showroom', label: t('showroom'), icon: Car },
        { href: '/auctions', label: t('auctions'), icon: Gavel },
        { href: '/parts', label: t('spareParts'), icon: ShoppingBag },
    ];

    const adminLinks = [
        { href: '/admin/dashboard', label: t('dashboard'), icon: ShieldCheck },
    ];



    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-transparent",
                scrolled
                    ? "bg-black/80 backdrop-blur-xl border-white/5 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                    : "bg-transparent py-8"
            )}
        >
            <div className="max-w-[1920px] mx-auto px-6 md:px-12 flex items-center justify-between">

                {/* Logo */}
                <Link href="/" className="relative z-50 group">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col leading-none"
                    >
                        <span className="text-3xl font-black italic tracking-tighter text-white group-hover:text-luxury-gold transition-colors duration-500">
                            HM <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold via-yellow-200 to-luxury-gold animate-shimmer">CAR</span>
                        </span>
                        <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/30 group-hover:text-white/60 transition-colors">
                            Systems
                        </span>
                    </motion.div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/5">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href}>
                                <div
                                    className={cn(
                                        "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 relative overflow-hidden group/link",
                                        isActive
                                            ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                                            : "text-white/60 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    <link.icon className={cn("w-3 h-3 transition-transform group-hover/link:scale-110", isActive ? "text-black" : "text-luxury-gold/50")} />
                                    <span className="relative z-10">{link.label}</span>
                                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />}
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Right Actions */}
                <div className="hidden lg:flex items-center gap-6">

                    {/* Admin Link if Admin */}
                    {isAdmin && (
                        <Link href="/admin/dashboard">
                            <button className="px-4 py-2 bg-red-900/20 border border-red-500/30 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-900/40 transition-all flex items-center gap-2 animate-pulse">
                                <ShieldCheck className="w-3 h-3" />
                                {t('dashboard')}
                            </button>
                        </Link>
                    )}

                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-luxury-gold/50 flex items-center justify-center transition-all group"
                    >
                        <span className="text-[10px] font-black uppercase text-white/60 group-hover:text-luxury-gold">{lang}</span>
                    </button>

                    {/* User Actions */}
                    {isLoggedIn ? (
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <NotificationDropdown />

                            <Link href="/profile">
                                <div className="flex items-center gap-3 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-luxury-gold to-yellow-900/50 p-[1px] shadow-[0_0_15px_rgba(197,160,89,0.3)] group-hover:shadow-[0_0_25px_rgba(197,160,89,0.5)] transition-all">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                            {user?.avatar ? (
                                                <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-4 h-4 text-luxury-gold" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-luxury-gold transition-colors">{user?.name || 'User'}</span>
                                        <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">{user?.role === 'vip' ? 'VIP Access' : 'Standard ID'}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                            <Link href="/login">
                                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white transition-colors">
                                    {t('login')}
                                </button>
                            </Link>
                            <Link href="/register">
                                <button className="px-6 py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-luxury-gold transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                    {t('register')}
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden w-12 h-12 flex items-center justify-center text-white/80 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 top-[88px] bg-black/95 z-40 backdrop-blur-2xl border-t border-white/10 lg:hidden"
                    >
                        <div className="p-8 flex flex-col gap-6 h-full overflow-y-auto pb-24">
                            {navLinks.map((link) => (
                                <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                                    <div className="text-3xl font-black uppercase italic tracking-tighter text-white/40 hover:text-white hover:pl-4 transition-all duration-300">
                                        {link.label}
                                    </div>
                                </Link>
                            ))}

                            <div className="h-[1px] bg-white/10 my-4" />

                            <div className="flex flex-col gap-4">
                                {isLoggedIn ? (
                                    <>
                                        <Link href="/profile" onClick={() => setIsOpen(false)}>
                                            <div className="flex items-center gap-4 text-white/60 hover:text-white p-4 bg-white/5 rounded-2xl">
                                                <User className="w-5 h-5" />
                                                <span className="text-xs font-black uppercase tracking-widest">Profile</span>
                                            </div>
                                        </Link>
                                        <button onClick={logout} className="flex items-center gap-4 text-red-500/60 hover:text-red-500 p-4 bg-white/5 rounded-2xl">
                                            <LogOut className="w-5 h-5" />
                                            <span className="text-xs font-black uppercase tracking-widest">Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Link href="/login" onClick={() => setIsOpen(false)}>
                                            <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase text-white">Login</button>
                                        </Link>
                                        <Link href="/register" onClick={() => setIsOpen(false)}>
                                            <button className="w-full py-4 bg-white text-black rounded-xl text-xs font-black uppercase">Register</button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
