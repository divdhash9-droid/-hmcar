'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Shield, AlertOctagon, Unlock,
    User, Cpu, Calendar
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
}

export default function SecurityPage() {
    const { isRTL } = useLanguage();
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchDevices = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/devices?search=${searchQuery}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setDevices(data.data || []);
        } catch (err) {
            console.error('Failed to fetch devices', err);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => { fetchDevices(); }, [fetchDevices]);

    const toggleBan = async (id: string, currentlyBanned: boolean) => {
        if (!confirm(currentlyBanned
            ? (isRTL ? 'فك الحظر عن هذا الجهاز؟' : 'Unban this device?')
            : (isRTL ? 'حظر هذا الجهاز فوراً؟' : 'Ban this device immediately?'))) return;
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-ban/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) fetchDevices();
            else alert(data.message || 'Error');
        } catch { alert('Error processing request'); }
    };

    const toggleExempt = async (id: string, currentlyExempt: boolean) => {
        if (!confirm(currentlyExempt
            ? (isRTL ? 'إلغاء الإعفاء من نظام الحماية؟' : 'Remove security exemption?')
            : (isRTL ? 'السماح لهذا المستخدم بالدخول بأكثر من اسم/رقم؟' : 'Exempt this user from multi-account restrictions?'))) return;
        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-exempt/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) fetchDevices();
            else alert(data.message || 'Error');
        } catch { alert('Error processing request'); }
    };

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
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                            <Shield className="w-4 h-4 text-red-400" />
                            <span className="cockpit-mono text-[9px] text-red-400 uppercase tracking-widest">{isRTL ? 'نظام الحماية نشط' : 'PROTECTION ACTIVE'}</span>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-8">
                    <Search className={cn('absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/30', isRTL ? 'right-3' : 'left-3')} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={isRTL ? 'ابحث برمز الحظر، الـ IP، أو الاسم...' : 'Search by ban code, IP, or name...'}
                        className={cn('ck-input', isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4')} />
                </div>

                {/* Devices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-56 rounded-2xl bg-white/[0.02] animate-pulse border border-orange-500/10" />
                        ))
                    ) : devices.length === 0 ? (
                        <div className="col-span-full ck-empty py-20">
                            <div className="ck-empty-icon"><Shield className="w-8 h-8" /></div>
                            <p className="cockpit-mono">{isRTL ? 'لا توجد أجهزة مسجلة' : 'NO DEVICES FOUND'}</p>
                        </div>
                    ) : (
                        devices.map((device) => (
                            <motion.div key={device._id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    'ck-card p-5 relative overflow-hidden group',
                                    device.banned && 'border-red-500/25',
                                    device.exemptFromSecurity && !device.banned && 'border-green-500/20'
                                )}>

                                <div className="absolute top-4 end-4 flex gap-2">
                                    {device.banned && (
                                        <span className="ck-badge ck-badge-danger flex items-center gap-1">
                                            <AlertOctagon className="w-2.5 h-2.5" />
                                            {isRTL ? 'محظور' : 'BANNED'}
                                        </span>
                                    )}
                                    {device.exemptFromSecurity && !device.banned && (
                                        <span className="ck-badge flex items-center gap-1 bg-green-500/15 text-green-400 border-green-500/20">
                                            <Unlock className="w-2.5 h-2.5" />
                                            {isRTL ? 'مستثنى' : 'EXEMPTED'}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 mt-6">
                                    <div>
                                        <p className="cockpit-mono text-[9px] text-white/30 uppercase mb-1">{isRTL ? 'رمز الحظر' : 'BAN CODE'}</p>
                                        <p className={cn('cockpit-num text-2xl font-black tracking-widest', device.banned ? 'text-red-400' : 'text-white/20')}>
                                            {device.banCode || '---'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-orange-500/10">
                                        <div>
                                            <p className="cockpit-mono text-[9px] text-white/30 flex items-center gap-1 mb-1"><User className="w-2.5 h-2.5" />{isRTL ? 'الحساب' : 'ACCOUNT'}</p>
                                            <p className="text-[11px] font-bold truncate">{device.linkedUsername || (isRTL ? 'لا يوجد' : 'None')}</p>
                                        </div>
                                        <div>
                                            <p className="cockpit-mono text-[9px] text-white/30 flex items-center gap-1 mb-1"><Cpu className="w-2.5 h-2.5" />IP</p>
                                            <p className="cockpit-mono text-[10px] text-orange-400">{device.ip}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="cockpit-mono text-[9px] text-white/30 flex items-center gap-1 mb-1"><Calendar className="w-2.5 h-2.5" />{isRTL ? 'آخر تحديث' : 'LAST UPDATE'}</p>
                                            <p className="cockpit-mono text-[10px] text-white/40">{new Date(device.updatedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2 border-t border-orange-500/10">
                                        <button onClick={() => toggleBan(device._id, device.banned)}
                                            className={cn('flex-1 py-2.5 rounded-xl cockpit-mono text-[9px] font-bold uppercase tracking-widest transition-all',
                                                device.banned
                                                    ? 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                                                    : 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white'
                                            )}>
                                            {device.banned ? (isRTL ? 'فك الحظر' : 'UNBAN') : (isRTL ? 'حظر فوري' : 'BAN NOW')}
                                        </button>
                                        <button onClick={() => toggleExempt(device._id, device.exemptFromSecurity)}
                                            className={cn('flex-1 py-2.5 rounded-xl cockpit-mono text-[9px] font-bold uppercase tracking-widest transition-all',
                                                device.exemptFromSecurity
                                                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white'
                                                    : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white'
                                            )}>
                                            {device.exemptFromSecurity ? (isRTL ? 'إلغاء الاستثناء' : 'REVOKE') : (isRTL ? 'تخطي الحماية' : 'EXEMPT')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}