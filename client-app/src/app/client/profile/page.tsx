'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    User,
    Mail,
    Phone,
    Lock,
    Save,
    Edit3,
    Shield,
    LogOut
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import ClientPageHeader from "@/components/ClientPageHeader";

const rawText = (value: string) => value;

export default function ClientProfilePage() {
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [userData, setUserData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'buyer'
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        // [[ARABIC_COMMENT]] جلب بيانات المستخدم من localStorage
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('hm_user');
            if (user) {
                try {
                    const data = JSON.parse(user);
                    setUserData({
                        name: data.name || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        role: data.role || 'buyer'
                    });
                } catch (e) {
                    console.error('Error parsing user data', e);
                }
            }
        }
    }, []);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            await api.users.updateProfile(userData);
            const currentUser = JSON.parse(localStorage.getItem('hm_user') || '{}');
            const updatedUser = { ...currentUser, ...userData };
            localStorage.setItem('hm_user', JSON.stringify(updatedUser));
            setMessage(isRTL ? 'تم تحديث البيانات بنجاح' : 'Profile updated successfully');
        } catch (err: any) {
            setMessage(err.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await api.auth.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            if (res.success && res.token) {
                localStorage.setItem('hm_token', res.token);
                // Also set cookie for middleware
                document.cookie = `hm_token=${res.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
                
                setMessage(isRTL ? '✅ تم تغيير كلمة المرور بنجاح' : '✅ Password changed successfully');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                setMessage(res.message || (isRTL ? 'فشل تغيير كلمة المرور' : 'Failed to change password'));
            }
        } catch (err: any) {
            console.error('Password change error:', err);
            setMessage(err.message || (isRTL ? 'حدث خطأ في النظام' : 'Protocol error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('hm_token');
        localStorage.removeItem('hm_user');
        window.location.href = '/login';
    };

    return (
        <div className="flex flex-col h-full bg-[#080809]">
            <ClientPageHeader
                title={isRTL ? 'الملف الشخصي' : 'Profile Settings'}
                subtitle={isRTL ? 'إدارة معلوماتك الشخصية وإعدادات الحساب' : 'MANAGE ACCOUNT DETAILS'}
                icon={User}
            />

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 space-y-8 pb-32 lg:pb-12">
                {/* Message Banner */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 rounded-2xl text-center"
                    >
                        <p className="text-xs font-bold text-cinematic-neon-gold">{message}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* User Card */}
                    <div className="xl:col-span-4 space-y-6">
                        <div className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 text-center relative overflow-hidden group">
                           <div className="absolute inset-0 bg-cinematic-neon-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-3xl" />
                           <div className="relative">
                               <div className="w-24 h-24 mx-auto rounded-[2rem] bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 flex items-center justify-center mb-6 shadow-2xl">
                                   <User className="w-10 h-10 text-cinematic-neon-gold" />
                               </div>
                               <h3 className="text-xl font-black text-white italic tracking-tight mb-2 uppercase">{userData.name || rawText('GUEST')}</h3>
                               <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mb-8">{userData.role}</div>
                               
                               <button 
                                onClick={handleLogout}
                                className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                               >
                                   <LogOut className="w-4 h-4" />
                                   {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
                               </button>
                           </div>
                        </div>

                        {/* Security Info */}
                        <div className="bg-cinematic-neon-gold/[0.02] border border-cinematic-neon-gold/10 rounded-[2rem] p-6 flex flex-col items-center text-center gap-3">
                            <Shield className="w-6 h-6 text-cinematic-neon-gold/40" />
                            <div className="text-[11px] font-black text-cinematic-neon-gold/60 uppercase tracking-widest">{isRTL ? 'اتصال مؤمن' : 'SECURE ENCRYPTION'}</div>
                            <p className="text-[10px] text-white/20 leading-relaxed">
                                {isRTL ? 'نظام التشفير لدينا يضمن حماية بياناتك الشخصية بالكامل' : 'END-TO-END AES-256 PROTECTION FOR ALL USER DATA'}
                            </p>
                        </div>
                    </div>

                    {/* Forms */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Personal Info */}
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                    <Edit3 className="w-5 h-5 text-cinematic-neon-gold" />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-1">{isRTL ? 'المعلومات الشخصية' : 'PERSONAL DETAILS'}</h2>
                                    <div className="h-0.5 w-12 bg-cinematic-neon-gold/30 rounded-full" />
                                </div>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'اسم المستخدم' : 'NAME'}</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                            <input 
                                                type="text"
                                                value={userData.name}
                                                onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                                placeholder={isRTL ? 'الاسم' : 'Name'}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 flex pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'البريد الإلكتروني' : 'EMAIL'}</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                            <input 
                                                type="email"
                                                value={userData.email}
                                                onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white/60 focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'رقم الهاتف' : 'PHONE'}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                        <input 
                                            type="tel"
                                            value={userData.phone}
                                            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                            placeholder={isRTL ? 'رقم الهاتف' : 'Phone'}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-gold/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-10 py-4 bg-cinematic-neon-gold text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cinematic-neon-gold/10 flex items-center justify-center gap-3"
                                >
                                    <Save className="w-4.5 h-4.5" />
                                    {isRTL ? 'حفظ البيانات' : 'UPDATE PROFILE'}
                                </button>
                            </form>
                        </section>

                        {/* Password */}
                        <section className="bg-white/3 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-red-500">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-[11px] font-black text-white uppercase tracking-[0.5em] mb-1">{isRTL ? 'تعديل كلمة المرور' : 'SECURITY & PASS'}</h2>
                                    <div className="h-0.5 w-12 bg-red-500/30 rounded-full" />
                                </div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'كلمة المرور الحالية' : 'CURRENT PASSWORD'}</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/10" />
                                        <input 
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'جديد' : 'NEW'}</label>
                                        <input 
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 rtl:mr-2 rtl:ml-0">{isRTL ? 'تأكيد' : 'CONFIRM'}</label>
                                        <input 
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            placeholder="••••••••"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:w-auto px-10 py-4 bg-white text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
                                >
                                    <Shield className="w-4.5 h-4.5" />
                                    {isRTL ? 'تغيير كلمة المرور' : 'CHANGE PASSWORD'}
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
