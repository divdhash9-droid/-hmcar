'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Shield, AlertOctagon, Unlock,
    User, Cpu, Calendar, RefreshCw, WifiOff, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';

interface Device {
    _id: string;
    banCode?: string;
    ip: string;
    linkedUsername?: string;
    banned: boolean;
    exemptFromSecurity: boolean;
    updatedAt: string;
    failedAttempts?: number;
}

export default function SecurityPage() {
    const { isRTL } = useLanguage();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'banned' | 'exempt' | 'clean'>('all');
    const [error, setError] = useState<string | null>(null);

    const fetchDevices = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/devices?search=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) setDevices(data.devices || data.data || []);
            else setError(data.message || 'Failed to load');
        } catch (err) {
            console.error('Failed to fetch devices', err);
            setError(isRTL ? 'تعذر تحميل الأجهزة' : 'Failed to load devices');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [searchQuery, isRTL]);

    useEffect(() => { fetchDevices(); }, [fetchDevices]);

    const toggleBan = async (id: string, currentlyBanned: boolean) => {
        if (!confirm(currentlyBanned
            ? (isRTL ? 'فك الحظر عن هذا الجهاز؟' : 'Unban this device?')
            : (isRTL ? 'حظر هذا الجهاز فوراً؟' : 'Ban this device immediately?'))) return;
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-ban/${id}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchDevices(true);
            } else {
                console.error('[Ban Toggle Error]:', data);
                alert(data.message || (isRTL ? 'فشلت العملية' : 'Process failed'));
            }
        } catch (err) {
            console.error('[Ban Toggle Fetch Catch]:', err);
            alert(isRTL ? 'خطأ في معالجة الطلب' : 'Error processing request');
        }
    };

    const toggleExempt = async (id: string, currentlyExempt: boolean) => {
        if (!confirm(currentlyExempt
            ? (isRTL ? 'إلغاء الإعفاء من نظام الحماية؟' : 'Remove security exemption?')
            : (isRTL ? 'السماح لهذا المستخدم بالدخول بأكثر من اسم/رقم؟' : 'Exempt this user?'))) return;
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-exempt/${id}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchDevices(true);
            } else {
                console.error('[Exempt Toggle Error]:', data);
                alert(data.message || (isRTL ? 'فشلت العملية' : 'Process failed'));
            }
        } catch (err) {
            console.error('[Exempt Toggle Fetch Catch]:', err);
            alert(isRTL ? 'خطأ في معالجة الطلب' : 'Error processing request');
        }
    };

    // Filter logic
    const filtered = devices.filter(d => {
        if (filterTab === 'banned') return d.banned;
        if (filterTab === 'exempt') return d.exemptFromSecurity && !d.banned;
        if (filterTab === 'clean') return !d.banned && !d.exemptFromSecurity;
        return true;
    });

    const bannedCount = devices.filter(d => d.banned).length;
    const exemptCount = devices.filter(d => d.exemptFromSecurity && !d.banned).length;
    const cleanCount = devices.filter(d => !d.banned && !d.exemptFromSecurity).length;

    const tabs = [
        { id: 'all', label: isRTL ? 'الكل' : 'ALL', count: devices.length, color: '#f97316' },
        { id: 'banned', label: isRTL ? 'محظور' : 'BANNED', count: bannedCount, color: '#ef4444' },
        { id: 'exempt', label: isRTL ? 'مستثنى' : 'EXEMPT', count: exemptCount, color: '#34d399' },
        { id: 'clean', label: isRTL ? 'سليم' : 'CLEAN', count: cleanCount, color: '#60a5fa' },
    ];

    return (
        <div className="relative min-h-screen text-white font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* HUD Header */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'الأمان' : 'SECURITY'}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">DEVICE MANAGEMENT &amp; ACCESS CONTROL</p>
                            <h1 className="ck-page-title">{isRTL ? 'الأمان والأجهزة' : 'SECURITY & DEVICES'}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                <Shield className="w-4 h-4 text-red-400" />
                                <span className="cockpit-mono text-[9px] text-red-400 uppercase tracking-widest">{isRTL ? 'الحماية نشطة' : 'PROTECTION ACTIVE'}</span>
                            </div>
                            <button onClick={() => fetchDevices(true)} disabled={refreshing}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <RefreshCw className={cn('w-4 h-4 text-white/40', refreshing && 'animate-spin text-orange-400')} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: isRTL ? 'إجمالي الأجهزة' : 'TOTAL DEVICES', val: devices.length, color: '#f97316', icon: Cpu },
                        { label: isRTL ? 'محظورة' : 'BANNED', val: bannedCount, color: '#ef4444', icon: WifiOff },
                        { label: isRTL ? 'مستثناة' : 'EXEMPTED', val: exemptCount, color: '#34d399', icon: Unlock },
                        { label: isRTL ? 'سليمة' : 'CLEAN', val: cleanCount, color: '#60a5fa', icon: CheckCircle2 },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="ck-card p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                                style={{ background: `${s.color}12`, border: `1px solid ${s.color}20` }}>
                                <s.icon className="w-4 h-4" style={{ color: s.color }} />
                            </div>
                            <div>
                                <div className="cockpit-num text-2xl font-black" style={{ color: s.color }}>{loading ? '—' : s.val}</div>
                                <p className="cockpit-mono text-[8px] text-white/30 uppercase">{s.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Search + Filter Tabs */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                    <div className="flex-1 relative">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/30', isRTL ? 'right-3' : 'left-3')} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isRTL ? 'ابحث برمز الحظر، الـ IP، أو الاسم...' : 'Search by ban code, IP, or name...'}
                            className={cn('ck-input', isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4')} />
                    </div>
                    <div className="ck-tab-group">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setFilterTab(tab.id as typeof filterTab)}
                                className={cn('ck-tab flex items-center gap-1.5', filterTab === tab.id && 'ck-tab-active')}>
                                <span>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span className="cockpit-mono text-[8px] px-1.5 py-0.5 rounded-md bg-white/10">{tab.count}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 cockpit-mono text-[10px] uppercase tracking-widest">
                        ⚠ {error}
                    </div>
                )}

                {/* Devices Grid */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-56 rounded-2xl bg-white/[0.02] animate-pulse border border-orange-500/5" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ck-empty py-24">
                            <div className="ck-empty-icon"><Shield className="w-8 h-8" /></div>
                            <p className="cockpit-mono text-[11px] text-white/30 uppercase tracking-widest mt-2">
                                {searchQuery ? (isRTL ? 'لا نتائج للبحث' : 'NO RESULTS FOUND') : (isRTL ? 'لا توجد أجهزة' : 'NO DEVICES FOUND')}
                            </p>
                            {!searchQuery && (
                                <p className="cockpit-mono text-[9px] text-white/15 mt-1">
                                    {isRTL ? 'ستظهر الأجهزة عند دخول المستخدمين' : 'Devices appear when users log in'}
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filtered.map((device, idx) => (
                                <motion.div key={device._id}
                                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={cn(
                                        'ck-card p-5 relative overflow-hidden group',
                                        device.banned && 'border-red-500/30 bg-red-500/[0.03]',
                                        device.exemptFromSecurity && !device.banned && 'border-green-500/20 bg-green-500/[0.02]'
                                    )}>

                                    {/* Status Badge */}
                                    <div className="absolute top-4 end-4 flex gap-1.5">
                                        {device.banned && (
                                            <span className="ck-badge ck-badge-danger flex items-center gap-1 text-[8px]">
                                                <AlertOctagon className="w-2.5 h-2.5" />
                                                {isRTL ? 'محظور' : 'BANNED'}
                                            </span>
                                        )}
                                        {device.exemptFromSecurity && !device.banned && (
                                            <span className="ck-badge text-[8px] flex items-center gap-1 bg-green-500/15 text-green-400 border-green-500/20">
                                                <Unlock className="w-2.5 h-2.5" />
                                                {isRTL ? 'مستثنى' : 'EXEMPT'}
                                            </span>
                                        )}
                                        {!device.banned && !device.exemptFromSecurity && (
                                            <span className="ck-badge text-[8px] bg-blue-500/10 text-blue-400 border-blue-500/15">
                                                {isRTL ? 'سليم' : 'CLEAN'}
                                            </span>
                                        )}
                                    </div>

                                    {/* BAN CODE */}
                                    <div className="mb-4 mt-1">
                                        <p className="cockpit-mono text-[8px] text-white/25 uppercase mb-1">{isRTL ? 'رمز الحظر' : 'BAN CODE'}</p>
                                        <p className={cn('cockpit-num text-xl font-black tracking-widest',
                                            device.banned ? 'text-red-400' : 'text-white/15')}>
                                            {device.banCode || '— — —'}
                                        </p>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-orange-500/8 mb-3">
                                        <div className="space-y-1">
                                            <p className="cockpit-mono text-[8px] text-white/25 flex items-center gap-1">
                                                <User className="w-2.5 h-2.5" />{isRTL ? 'المستخدم' : 'USER'}
                                            </p>
                                            <p className="text-[10px] font-bold truncate text-white/80">
                                                {device.linkedUsername || <span className="text-white/20">{isRTL ? 'غير مرتبط' : 'None'}</span>}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="cockpit-mono text-[8px] text-white/25 flex items-center gap-1">
                                                <Cpu className="w-2.5 h-2.5" />IP
                                            </p>
                                            <p className="cockpit-mono text-[9px] text-orange-400 truncate">{device.ip || '—'}</p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                            <p className="cockpit-mono text-[8px] text-white/25 flex items-center gap-1">
                                                <Calendar className="w-2.5 h-2.5" />{isRTL ? 'آخر تحديث' : 'LAST SEEN'}
                                            </p>
                                            <p className="cockpit-mono text-[9px] text-white/35">
                                                {new Date(device.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                        {(device.failedAttempts ?? 0) > 0 && (
                                            <div className="col-span-2 flex items-center gap-1 mt-1 px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/15">
                                                <AlertOctagon className="w-3 h-3 text-yellow-400" />
                                                <span className="cockpit-mono text-[8px] text-yellow-400">
                                                    {device.failedAttempts} {isRTL ? 'محاولات فاشلة' : 'failed attempts'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleBan(device._id, device.banned)}
                                            className={cn('flex-1 py-2 rounded-xl cockpit-mono text-[8px] font-bold uppercase tracking-widest transition-all border',
                                                device.banned
                                                    ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-400'
                                                    : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-400'
                                            )}>
                                            {device.banned ? (isRTL ? '🔓 فك الحظر' : 'UNBAN') : (isRTL ? '🔒 حظر' : 'BAN')}
                                        </button>
                                        <button onClick={() => toggleExempt(device._id, device.exemptFromSecurity)}
                                            className={cn('flex-1 py-2 rounded-xl cockpit-mono text-[8px] font-bold uppercase tracking-widest transition-all border',
                                                device.exemptFromSecurity
                                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white hover:border-orange-400'
                                                    : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-400'
                                            )}>
                                            {device.exemptFromSecurity ? (isRTL ? 'إلغاء الإعفاء' : 'REVOKE') : (isRTL ? 'إعفاء' : 'EXEMPT')}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}