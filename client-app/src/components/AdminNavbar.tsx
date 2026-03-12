'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Car, Gavel, Users, ShoppingCart, Settings, Shield,
    LogOut, Radio, Layers, TrendingUp, Bell, Share2, MessageCircle,
    Tag, Briefcase, Mail, Menu, X, Languages, Database, RefreshCcw
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────
type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
interface NavItem {
    id: string;
    icon: IconComponent;
    label: string;
    href: string;
}


interface SidebarProps {
    items: NavItem[];
    pathname: string | null;
    queryString: string;
    isRTL: boolean;
    lang: string;
    time: string;
    dateStr: string;
    ping: number;
    toggleLanguage: () => void;
    onLogout: () => void;
    onBackup: () => void;
    onRefresh: () => void;
    onClose?: () => void;
}

// ── Cockpit Gauge Bar (top-level, no hooks) ───────────────────
function GaugeBar({ value, colorClass }: { value: number; colorClass: string }) {
    return (
        <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${value}%` }}
                transition={{ duration: 2.5, ease: 'easeOut' }}
                className={`h-full rounded-full ${colorClass}`}
            />
        </div>
    );
}

// ── Live Blink Dot ─────────────────────────────────────────────
function LiveDot({ colorClass = 'bg-green-400' }: { colorClass?: string }) {
    return (
        <span className="relative flex h-2 w-2 shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass}`} />
        </span>
    );
}

// ── Sidebar Content — declared at module level (not inside render) ──
function SidebarInner({
    items, pathname, queryString, isRTL, lang, time, dateStr, ping,
    toggleLanguage, onLogout, onBackup, onRefresh, onClose
}: SidebarProps) {
    return (
        <div className="flex flex-col h-full">

            {/* Logo + Clock */}
            <div className="flex flex-col items-center gap-2 px-3 pt-5 pb-4 border-b border-orange-500/10">
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-[-5px] rounded-full border border-dashed border-orange-500/25 pointer-events-none"
                    />
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-orange-500/60 shadow-[0_0_18px_rgba(249,115,22,0.35),inset_0_0_12px_rgba(249,115,22,0.06)]">
                        <span className="font-mono font-black text-[10px] text-orange-400 tracking-tight">HM</span>
                    </div>
                </div>
                <div className="text-center mt-1">
                    <div className="font-mono text-[11px] font-bold tracking-widest text-orange-400 cockpit-glow">
                        {time}
                    </div>
                    <div className="font-mono text-[7px] text-white/20 tracking-wider mt-0.5">{dateStr}</div>
                </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 flex flex-col items-center gap-0.5 py-3 px-2 overflow-y-auto scrollbar-hide">
                {items.map((item) => {
                    const [itemPath, itemQuery = ''] = item.href.split('?');
                    const pathMatch = pathname === itemPath ||
                        (itemPath !== '/admin/dashboard' && !!pathname?.startsWith(itemPath));
                    let queryMatch = true;
                    if (itemQuery) {
                        const required = new URLSearchParams(itemQuery);
                        const current = new URLSearchParams(queryString);
                        queryMatch = Array.from(required.entries()).every(([k, v]) => current.get(k) === v);
                    }
                    const isActive = pathMatch && queryMatch;
                    const Icon = item.icon as IconComponent;
                    return (
                        <Link
                            href={item.href}
                            key={item.id}
                            className="w-full"
                            onClick={onClose}
                        >
                            <motion.div
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                className={cn(
                                    'relative flex flex-col items-center gap-1 py-2.5 px-1.5 rounded-xl w-full cursor-pointer transition-all duration-150',
                                    isActive
                                        ? 'text-orange-400 bg-orange-500/10 shadow-[inset_0_0_20px_rgba(249,115,22,0.05)]'
                                        : 'text-white/20 hover:text-white/50 hover:bg-white/[0.03]'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="cockpitActiveBar"
                                        className={cn(
                                            'absolute top-2 bottom-2 w-[2px] rounded-full bg-orange-500',
                                            isRTL ? 'right-1' : 'left-1'
                                        )}
                                        style={{ boxShadow: '0 0 8px rgba(249,115,22,1), 0 0 20px rgba(249,115,22,0.4)' }}
                                    />
                                )}
                                <Icon
                                    className={cn('transition-all duration-150',
                                        isActive ? 'w-[18px] h-[18px] drop-shadow-[0_0_6px_rgba(249,115,22,0.9)]' : 'w-[16px] h-[16px]'
                                    )}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                                <span className={cn(
                                    'font-mono font-bold uppercase text-center leading-tight',
                                    isActive ? 'text-[6.5px] tracking-[0.06em] text-orange-400' : 'text-[6px] tracking-[0.05em]'
                                )}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Controls */}
            <div className="flex flex-col gap-2.5 px-2.5 py-4 border-t border-orange-500/10">
                {/* Ping gauge */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-[6px] text-white/20 uppercase tracking-widest">SYS</span>
                        <div className="flex items-center gap-1">
                            <LiveDot colorClass="bg-green-400" />
                            <span className="font-mono text-[6px] text-green-400/70">{ping}ms</span>
                        </div>
                    </div>
                    <GaugeBar value={94} colorClass="bg-gradient-to-r from-orange-600 to-orange-400" />
                </div>

                {/* Language */}
                <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-white/60 hover:border-orange-500/20 transition-all"
                >
                    <Languages className="w-3 h-3" />
                    <span className="font-mono text-[7px] font-bold uppercase tracking-widest">{lang}</span>
                </button>

                {/* Backup */}
                <button
                    onClick={onBackup}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-white/30 hover:text-orange-400/60 hover:border-orange-500/20 transition-all"
                    title={isRTL ? 'نسخ احتياطي' : 'Backup'}
                >
                    <Database className="w-3 h-3" />
                    <span className="font-mono text-[7px] font-bold uppercase tracking-widest">{isRTL ? 'نسخة' : 'BCKP'}</span>
                </button>

                {/* Refresh Fix */}
                <button
                    onClick={onRefresh}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-500/[0.08] border border-blue-500/20 text-blue-400/50 hover:text-blue-400 hover:bg-blue-500/15 hover:border-blue-500/40 transition-all font-mono"
                    title={isRTL ? 'إصلاح التنسيق وتحديث' : 'Fix UI & Refresh'}
                >
                    <RefreshCcw className="w-3 h-3" />
                    <span className="font-mono text-[7px] font-bold uppercase tracking-widest">{isRTL ? 'تحديث' : 'SYNC'}</span>
                </button>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-500/[0.08] border border-red-500/20 text-red-400/50 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/40 transition-all"
                    title={isRTL ? 'تسجيل الخروج' : 'Log Out'}
                >
                    <LogOut className="w-3 h-3" />
                    <span className="font-mono text-[7px] font-bold uppercase tracking-widest">{isRTL ? 'خروج' : 'EXIT'}</span>
                </button>
            </div>
        </div>
    );
}

// ── NAV ITEMS factory ──────────────────────────────────────────
function buildNavItems(isRTL: boolean): NavItem[] {
    return [
        { id: 'dashboard', icon: Activity, label: isRTL ? 'المركزية' : 'MAINFRAME', href: '/admin/dashboard' },
        { id: 'cars', icon: Car, label: isRTL ? 'المعرض' : 'SHOWROOM', href: '/admin/cars' },
        { id: 'live-auctions', icon: Radio, label: isRTL ? 'المباشر' : 'LIVE', href: '/admin/live-auctions' },
        { id: 'auctions', icon: Gavel, label: isRTL ? 'المزادات' : 'AUCTIONS', href: '/admin/auctions' },
        { id: 'parts', icon: Layers, label: isRTL ? 'القطع' : 'PARTS', href: '/admin/parts' },
        { id: 'orders', icon: ShoppingCart, label: isRTL ? 'الطلبات' : 'ORDERS', href: '/admin/orders' },
        { id: 'concierge', icon: Briefcase, label: isRTL ? 'خاصة' : 'SPECIAL', href: '/admin/concierge' },
        { id: 'users', icon: Users, label: isRTL ? 'الأعضاء' : 'USERS', href: '/admin/users' },
        { id: 'messages', icon: MessageCircle, label: isRTL ? 'المحادثات' : 'CHATS', href: '/admin/messages' },
        { id: 'contact', icon: Mail, label: isRTL ? 'استفسارات' : 'INQUIRIES', href: '/admin/contact' },
        { id: 'reports', icon: TrendingUp, label: isRTL ? 'التقارير' : 'REPORTS', href: '/admin/reports' },
        { id: 'notifications', icon: Bell, label: isRTL ? 'الإشعارات' : 'ALERTS', href: '/admin/notifications' },
        { id: 'social', icon: Share2, label: isRTL ? 'التواصل' : 'SOCIAL', href: '/admin/social' },
        { id: 'security', icon: Shield, label: isRTL ? 'الأمان' : 'SECURITY', href: '/admin/security' },
        { id: 'brands', icon: Tag, label: isRTL ? 'الوكالات' : 'AGENCIES', href: '/admin/brands' },
        { id: 'settings', icon: Settings, label: isRTL ? 'الإعدادات' : 'SETTINGS', href: '/admin/settings' },
    ];
}

// ── Main Export ────────────────────────────────────────────────
export default function AdminNavbar() {
    const { isRTL, lang, toggleLanguage } = useLanguage();
    const { logout } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [time, setTime] = useState('--:--:--');
    const [dateStr, setDateStr] = useState('');
    const [ping, setPing] = useState(12);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setTime(now.toLocaleTimeString('en-US', { hour12: false }));
            setDateStr(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit' }));
            setPing(Math.floor(Math.random() * 8) + 8);
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    const handleLogout = async () => {
        try { await api.auth.logout(); } catch { /* ignore */ }
        logout(); // استخدام دالة الخروج من AuthContext لمسح كافة البيانات والتوجيه
    };

    const handleBackup = async () => {
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch('/api/v2/backup', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `hm-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch { /* ignore */ }
    };

    const items = buildNavItems(isRTL);
    const handleForceRefresh = () => {
        if (confirm(isRTL ? 'سيتم مسح الذاكرة المؤقتة للتطبيق وتحديث الصفحة لإصلاح التنسيق. هل أنت متأكد؟' : 'Clear cache and fix UI layout? This will perform a hard refresh.')) {
            // Unregister service worker
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    for (const registration of registrations) registration.unregister();
                });
            }
            // Clear caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    for (const name of names) caches.delete(name);
                });
            }
            // Reload page
            window.location.reload();
        }
    };

    const sidebarProps: SidebarProps = {
        items, pathname, queryString: searchParams?.toString() || '', isRTL, lang, time, dateStr, ping,
        toggleLanguage, onLogout: handleLogout, onBackup: handleBackup, onRefresh: handleForceRefresh,
    };

    return (
        <>
            {/* ═══ MOBILE TOP BAR ═══ */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-[120] flex items-center justify-between px-4 py-3 border-b border-orange-500/20 bg-[#070711]/95 backdrop-blur-xl shadow-[0_0_20px_rgba(249,115,22,0.06)]">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                    </span>
                    <span className="font-mono text-[10px] font-black tracking-[0.25em] uppercase text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">
                        HM-CTRL
                    </span>
                </div>
                <div className="font-mono text-[9px] text-white/30 tracking-widest">{time}</div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="p-2 rounded-lg border border-orange-500/20 bg-orange-500/5 text-orange-400/60 hover:text-orange-400 transition-all"
                >
                    {mobileOpen ? <X size={14} /> : <Menu size={14} />}
                </button>
            </div>

            {/* ═══ DESKTOP SIDEBAR ═══ */}
            <aside
                className={cn(
                    'fixed top-0 bottom-0 z-[110] w-[72px] hidden lg:flex flex-col',
                    'bg-gradient-to-b from-[#070711] via-[#0D0D18] to-[#070711]',
                    isRTL
                        ? 'right-0 border-l border-orange-500/12 shadow-[-6px_0_40px_rgba(249,115,22,0.06)]'
                        : 'left-0 border-r border-orange-500/12 shadow-[6px_0_40px_rgba(249,115,22,0.06)]'
                )}
            >
                {/* Animated scan line */}
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent pointer-events-none z-10"
                />
                <SidebarInner {...sidebarProps} />
            </aside>

            {/* ═══ MOBILE DRAWER ═══ */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="lg:hidden fixed inset-0 z-[118] bg-black/70 backdrop-blur-sm"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: isRTL ? '100%' : '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: isRTL ? '100%' : '-100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className={cn(
                                'fixed top-0 bottom-0 z-[119] w-[80px] lg:hidden flex flex-col',
                                'bg-gradient-to-b from-[#070711] via-[#0D0D18] to-[#070711]',
                                isRTL
                                    ? 'right-0 border-l border-orange-500/20'
                                    : 'left-0 border-r border-orange-500/20'
                            )}
                        >
                            <SidebarInner
                                {...sidebarProps}
                                onClose={() => setMobileOpen(false)}
                            />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
