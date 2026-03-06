'use client';

import { cn } from '@/lib/utils';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { AlertOctagon, Shield, ChevronLeft, Unlock, Search, Calendar, Cpu, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityPage() {
    const { isRTL } = useLanguage();
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchDevices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const fetchDevices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/devices?search=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDevices(data.devices || []);
            }
        } catch (error) {
            console.error('Error fetching devices', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBan = async (id: string, currentlyBanned: boolean) => {
        if (!confirm(currentlyBanned ? (isRTL ? 'هل أنت متأكد من فك الحظر عن هذا الجهاز؟' : 'Unban device?') : (isRTL ? 'هل أنت متأكد من حظر هذا الجهاز؟' : 'Ban device?'))) return;

        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-ban/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchDevices();
            } else {
                alert(data.message || 'Error');
            }
        } catch {
            alert('Error processing request');
        }
    };

    const toggleExempt = async (id: string, currentlyExempt: boolean) => {
        if (!confirm(currentlyExempt ? (isRTL ? 'إلغاء الإعفاء من نظام الحماية؟' : 'Remove security exemption?') : (isRTL ? 'السماح لهذا المستخدم بالدخول بأكثر من اسم/رقم؟' : 'Exempt this user from multi-account restrictions?'))) return;

        try {
            const token = localStorage.getItem('hm_token');
            const res = await fetch(`/api/v2/security/toggle-exempt/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                fetchDevices();
            } else {
                alert(data.message || 'Error');
            }
        } catch {
            alert('Error processing request');
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden text-right rtl">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-red/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,60,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,60,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-10">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-3 mb-8 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all group w-fit">
                        <ChevronLeft className={cn("w-5 h-5 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للترسانة' : 'BACK TO DASHBOARD'}</span>
                    </Link>
                </header>

                <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/40 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                <Shield className="w-7 h-7 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                                    {isRTL ? "الأمان وصلاحيات الأجهزة" : "SECURITY & DEVICES"}
                                </h1>
                                <p className="text-white/40 text-sm font-medium mt-1">
                                    {isRTL ? "إدارة وصول الأجهزة، حظر المخالفين، ومنح صلاحيات استثنائية." : "Manage device access, ban violators, and grant exemptions."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 ${isRTL ? 'right-4' : 'left-4'}`} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={isRTL ? "ابحث برمز الحظر، الـ IP، أو الاسم..." : "Search by ban code, IP, or name..."}
                            className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 focus:bg-black/60 focus:border-red-500/40 outline-none text-white transition-all backdrop-blur-md ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                        />
                    </div>

                    {/* Devices Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="h-64 bg-white/5 animate-pulse rounded-3xl border border-white/10"></div>
                            ))
                        ) : devices.length === 0 ? (
                            <div className="col-span-full py-20 text-center glass-card border rounded-3xl border-white/5">
                                <Shield className="w-12 h-12 text-white/20 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-white/60">{isRTL ? "لا توجد أجهزة مسجلة" : "No devices found"}</h3>
                                <p className="text-white/40 text-sm mt-2">{isRTL ? "جميع الأجهزة والعملاء في حالة سليمة." : "All devices and clients are in good standing."}</p>
                            </div>
                        ) : (
                            devices.map((device) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={device._id}
                                    className={`border rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl group ${device.banned ? 'bg-gradient-to-br from-black/80 to-red-950/20 border-red-500/20' : device.exemptFromSecurity ? 'bg-gradient-to-br from-black/80 to-emerald-950/20 border-emerald-500/20' : 'bg-black/60 border-white/10'}`}
                                >
                                    <div className="absolute top-0 right-0 p-4 flex gap-2">
                                        {device.banned && (
                                            <span className="px-3 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold tracking-widest uppercase rounded-full border border-red-500/20 flex items-center gap-1.5">
                                                <AlertOctagon className="w-3 h-3" />
                                                {isRTL ? "محظور" : "BANNED"}
                                            </span>
                                        )}
                                        {device.exemptFromSecurity && !device.banned && (
                                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-widest uppercase rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                                                <Unlock className="w-3 h-3" />
                                                {isRTL ? "مستثنى من الحماية" : "EXEMPTED"}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-4 mt-4">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-white/30">{isRTL ? "رمز الحظر" : "BAN CODE"}</p>
                                            <p className={`text-2xl font-mono font-bold mt-1 tracking-widest ${device.banned ? 'text-red-500' : 'text-white/20'}`}>{device.banCode || '---'}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-1.5"><User className="w-3 h-3" /> {isRTL ? "الحساب المرتبط" : "LINKED ACCOUNT"}</p>
                                                <p className="text-white font-medium mt-1 text-sm truncate">{device.linkedUsername || (isRTL ? "لا يوجد" : "None")}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-1.5"><Cpu className="w-3 h-3" /> IP ADDRESS</p>
                                                <p className="text-white/80 font-mono mt-1 text-sm">{device.ip}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/30 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {isRTL ? "آخر تحديث" : "LAST UPDATE"}</p>
                                                <p className="text-white/60 mt-1 text-xs">{new Date(device.updatedAt).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full mt-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => toggleBan(device._id, device.banned)}
                                                className={`flex-1 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${device.banned ? 'bg-green-500/10 hover:bg-green-500 border-green-500/20 hover:border-green-500 text-green-400 hover:text-white group-hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-red-500/10 hover:bg-red-500 border-red-500/20 hover:border-red-500 text-red-500 hover:text-white'}`}
                                            >
                                                {device.banned ? (isRTL ? "فك الحظر" : "UNBAN") : (isRTL ? "حظر فوري" : "BAN NOW")}
                                            </button>

                                            <button
                                                onClick={() => toggleExempt(device._id, device.exemptFromSecurity)}
                                                className={`flex-1 py-3 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${device.exemptFromSecurity ? 'bg-orange-500/10 hover:bg-orange-500 border-orange-500/20 hover:border-orange-500 text-orange-400 hover:text-white' : 'bg-emerald-500/10 hover:bg-emerald-500 border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white'}`}
                                            >
                                                {device.exemptFromSecurity ? (isRTL ? "إلغاء الاستثناء" : "REVOKE EXEMPT") : (isRTL ? "تخطي الحماية" : "BYPASS S.C")}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
