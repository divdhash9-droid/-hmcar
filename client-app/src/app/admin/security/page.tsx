'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, ShieldAlert, ShieldCheck, Lock, Unlock,
    Smartphone, Search, RefreshCw, History,
    AlertTriangle, Server, X
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';
import AdminPageShell from '@/components/AdminPageShell';

interface SecurityDevice {
    _id: string;
    deviceId?: string;
    banCode?: string;
    ip?: string;
    userAgent?: string;
    banned: boolean;
    exemptFromSecurity: boolean;
    banReason?: string;
    lastSeenAt?: string;
    updatedAt?: string;
    createdAt?: string;
    deviceInfo?: string;
}

export default function AdminSecurity() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [devices, setDevices] = useState<SecurityDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'banned' | 'clean' | 'exempt'>('all');
    const [selectedDevice, setSelectedDevice] = useState<SecurityDevice | null>(null);
    const [stats, setStats] = useState({ total: 0, banned: 0, exempt: 0 });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.security.getDevices();
            const deviceList = Array.isArray(res.data) ? res.data : (Array.isArray(res.devices) ? res.devices : []);
            
            if (deviceList.length > 0) {
                const seen = new Set();
                const unique = deviceList
                    .sort((a: SecurityDevice, b: SecurityDevice) => {
                        const dateA = new Date(a.lastSeenAt || a.updatedAt || a._id).getTime();
                        const dateB = new Date(b.lastSeenAt || b.updatedAt || b._id).getTime();
                        return dateB - dateA;
                    })
                    .filter((d: SecurityDevice) => {
                        const key = d.deviceId || d.banCode || d.ip;
                        if (!key || seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });
                setDevices(unique as SecurityDevice[]);
                setStats({
                    total: unique.length,
                    banned: unique.filter((d: SecurityDevice) => d.banned).length,
                    exempt: unique.filter((d: SecurityDevice) => d.exemptFromSecurity).length
                });
            } else {
                setDevices([]);
                setStats({ total: 0, banned: 0, exempt: 0 });
            }
        } catch (err) {
            console.error('Failed to load security data:', err);
            showToast(isRTL ? 'فشل تحميل بيانات الأمان' : 'Failed to load security data', 'error');
        } finally {
            setLoading(false);
        }
    }, [isRTL, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const toggleBan = async (device: any) => {
        try {
            const res = await api.security.toggleBan(device._id);
            if (res.success) {
                setDevices(prev => prev.map(d =>
                    d._id === device._id ? { ...d, banned: !d.banned } : d
                ));
                showToast(device.banned ? '✅ تم فك الحظر' : '🚫 تم الحظر', 'success');
            } else {
                showToast(res.message || 'فشل تحديث الحظر', 'error');
            }
        } catch (err: any) {
            console.error('Toggle ban error:', err);
            const msg = err.response?.data?.message || err.message || 'فشل تحديث الحظر';
            showToast(msg, 'error');
        }
    };

    const toggleExempt = async (device: SecurityDevice) => {
        try {
            const res = await api.security.toggleExempt(device._id);
            if (res.success) {
                showToast(isRTL ? 'تم تحديث الاستثناء' : 'Exemption updated', 'success');
                loadData();
            }
        } catch {
            showToast(isRTL ? 'فشل تحديث الاستثناء' : 'Failed to update exemption', 'error');
        }
    };

    const filtered = devices.filter(d => {
        const matchesSearch = (d.banCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (d.deviceId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (d.ip?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            (d.deviceInfo?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        if (filterTab === 'banned') return d.banned;
        if (filterTab === 'exempt') return d.exemptFromSecurity && !d.banned;
        if (filterTab === 'clean') return !d.banned && !d.exemptFromSecurity;
        return true;
    });

    return (
        <div className="min-h-screen text-white bg-black overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,59,48,0.1),transparent_70%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]" />
            </div>

            <AdminPageShell
                title={isRTL ? 'الأمن والحماية' : 'SECURITY OPS'}
                titleEn="ENDPOINT PROTECTION"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button 
                        onClick={loadData} 
                        title={isRTL ? 'تحديث البيانات' : 'Refresh Data'}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-red-500 shadow-[0_0_15px_rgba(255,59,48,0.2)]"
                    >
                        <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="ck-card p-6 border-red-500/10 bg-red-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="cockpit-mono text-[10px] text-red-500/50 uppercase">Tracked</span>
                        </div>
                        <div className="text-3xl font-black mb-1 italic">{stats.total}</div>
                        <div className="cockpit-mono text-[9px] text-white/30 uppercase tracking-widest">{isRTL ? 'إجمالي الأجهزة' : 'TOTAL ENDPOINTS'}</div>
                    </div>

                    <div className="ck-card p-6 border-red-500/10 bg-red-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="cockpit-mono text-[10px] text-red-500/50 uppercase">Restricted</span>
                        </div>
                        <div className="text-3xl font-black mb-1 italic text-red-500">{stats.banned}</div>
                        <div className="cockpit-mono text-[9px] text-white/30 uppercase tracking-widest">{isRTL ? 'المحظورين' : 'BANNED DEVICES'}</div>
                    </div>

                    <div className="ck-card p-6 border-red-500/10 bg-red-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-red-500" />
                            </div>
                            <span className="cockpit-mono text-[10px] text-red-500/50 uppercase">Whitelisted</span>
                        </div>
                        <div className="text-3xl font-black mb-1 italic">{stats.exempt}</div>
                        <div className="cockpit-mono text-[9px] text-white/30 uppercase tracking-widest">{isRTL ? 'المستثنون' : 'EXEMPTED LIST'}</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-4' : 'left-4')} />
                        <input 
                            type="text"
                            placeholder={isRTL ? 'بحث عن طريق IP، معرف الجهاز، أو المتصفح...' : 'Search by IP, Device ID, or UA...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn('ck-input h-12 text-sm focus:border-red-500/40', isRTL ? 'pr-12' : 'pl-12')}
                        />
                    </div>
                    <div className="ck-tab-group p-1 bg-red-500/5 border border-red-500/10 rounded-2xl flex">
                        {[
                            { id: 'all', label: isRTL ? 'الكل' : 'ALL' },
                            { id: 'banned', label: isRTL ? 'محظور' : 'BANNED' },
                            { id: 'clean', label: isRTL ? 'نشط' : 'ACTIVE' },
                            { id: 'exempt', label: isRTL ? 'مستثنى' : 'EXEMPT' },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setFilterTab(t.id as 'all' | 'banned' | 'clean' | 'exempt')}
                                title={t.label}
                                className={cn(
                                    'px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all',
                                    filterTab === t.id ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(255,59,48,0.5)]' : 'text-white/40 hover:text-white/70'
                                )}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto ck-scroll space-y-3 pb-8">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="ck-empty py-24">
                            <div className="ck-empty-icon"><Shield className="w-8 h-8" /></div>
                            <p className="cockpit-mono text-sm">{isRTL ? 'لا توجد أجهزة مطابقة للبحث' : 'NO ENDPOINTS MATCH YOUR SEARCH'}</p>
                        </div>
                    ) : (
                        filtered.map((device, i) => (
                            <motion.div
                                key={device._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                    'ck-card group hover:bg-white/[0.03] p-5 transition-all flex flex-col md:flex-row items-start md:items-center gap-6 border',
                                    device.banned ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/5 bg-white/[0.01]'
                                )}
                            >
                                <div className={cn(
                                    'w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all',
                                    device.banned ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(255,59,48,0.1)]' : 'bg-red-500/5 border-white/10 text-white/40'
                                )}>
                                    {device.banned ? <ShieldAlert className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                        <h3 className="text-sm font-black tracking-tight font-mono">
                                            {device.deviceId || device.banCode || device.ip || (isRTL ? 'غير معرف' : 'UNKNOWN ID')}
                                        </h3>
                                        {device.ip && <span className="ck-badge bg-white/5 text-white/40 border-white/10 font-mono text-[9px]">{device.ip}</span>}
                                        {device.banned && <span className="ck-badge ck-badge-danger text-[8px]">{isRTL ? 'محظور نأئياً' : 'HARD BANNED'}</span>}
                                        {device.exemptFromSecurity && <span className="ck-badge bg-green-500/10 text-green-400 border-green-500/20 text-[8px]">{isRTL ? 'مستثنى من الحماية' : 'SECURITY EXEMPT'}</span>}
                                    </div>
                                    <p className="text-[10px] text-white/30 truncate max-w-2xl font-mono">
                                        {device.deviceInfo || device.userAgent || 'No hardware details available'}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1 cockpit-mono text-[8px] text-white/20 uppercase tracking-widest">
                                            <History className="w-3 h-3" />
                                            {isRTL ? 'آخر نشاط:' : 'LAST SEEN:'} {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : '---'}
                                        </div>
                                        {device.banReason && (
                                            <div className="flex items-center gap-1 cockpit-mono text-[8px] text-red-400/50 uppercase tracking-widest">
                                                <AlertTriangle className="w-3 h-3" />
                                                {isRTL ? 'السبب:' : 'REASON:'} {device.banReason}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={() => toggleBan(device)}
                                        title={device.banned ? (isRTL ? 'إلغاء الحظر' : 'Unban') : (isRTL ? 'حظر' : 'Ban')}
                                        className={cn(
                                            "flex-1 md:flex-none h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                                            device.banned ? "bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-black" : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                                        )}
                                    >
                                        {device.banned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                        {device.banned ? (isRTL ? 'فك الحظر' : 'UNBAN') : (isRTL ? 'حظر' : 'RESTRICT')}
                                    </button>
                                    
                                    <button 
                                        onClick={() => toggleExempt(device)}
                                        className={cn(
                                            'flex-1 md:flex-none h-10 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border',
                                            device.exemptFromSecurity 
                                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20' 
                                                : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                                        )}
                                        title={isRTL ? 'استثناء من فحوصات الأمان' : 'Exempt from security checks'}
                                    >
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        {isRTL ? 'استثناء' : 'EXEMPT'}
                                    </button>

                                    <button 
                                        onClick={() => setSelectedDevice(device)}
                                        title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <Server className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </AdminPageShell>

            <AnimatePresence>
                {selectedDevice && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={() => setSelectedDevice(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} 
                            animate={{ scale: 1, y: 0 }} 
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-cinematic-dark border border-white/15 rounded-[2.5rem] p-8 max-w-2xl w-full shadow-[0_0_100px_rgba(59,130,246,0.15)] relative overflow-hidden"
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,1)] rounded-full" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <Smartphone className="w-7 h-7 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="cockpit-mono text-[10px] text-red-400 tracking-[0.3em] uppercase mb-1">ENDPOINT ANALYTICS</div>
                                        <h2 className="text-2xl font-black italic tracking-tighter truncate max-w-[300px]">{selectedDevice.deviceId || selectedDevice.banCode || 'INTERNAL-ID'}</h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedDevice(null)} 
                                    title={isRTL ? 'إغلاق' : 'Close'}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5">{isRTL ? 'عنوان الـ IP' : 'NETWORK IP'}</div>
                                    <div className="font-mono text-sm text-blue-400">{selectedDevice.ip || '---.---.---.---'}</div>
                                </div>
                                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                                    <div className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1.5">{isRTL ? 'الحالة الأمنية' : 'SECURITY STATUS'}</div>
                                    <div className={cn('font-black text-sm uppercase', selectedDevice.banned ? 'text-red-500' : 'text-green-500')}>
                                        {selectedDevice.banned ? (isRTL ? 'محظور نأئياً' : 'BANNED') : (isRTL ? 'نشط / آمن' : 'SECURE / ACTIVE')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-black/40 border border-white/8 rounded-3xl mb-8">
                                <div className="text-[10px] font-black text-red-400/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Server className="w-3.5 h-3.5" />
                                    {isRTL ? 'بصمة الجهاز والبيئة:' : 'HARDWARE FINGERPRINT & AGENT:'}
                                </div>
                                <div className="font-mono text-[11px] leading-relaxed text-white/60 bg-white/[0.02] p-4 rounded-xl border border-white/5 break-all">
                                    {selectedDevice.userAgent || 'No User Agent string recorded.'}
                                </div>
                                <div className="mt-4 font-mono text-xs text-red-400/60 break-all">
                                    {selectedDevice.deviceInfo || 'Detailed hardware identifiers not available.'}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => { toggleBan(selectedDevice); setSelectedDevice(null); }}
                                    className={cn(
                                        "flex-1 h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all",
                                        selectedDevice.banned ? "bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]" : "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                                    )}
                                >
                                    {selectedDevice.banned ? (isRTL ? 'إلغاء الحظر الآن' : 'RESTORE ACCESS') : (isRTL ? 'حظر الجهاز نهائياً' : 'PERMANENT BAN')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}