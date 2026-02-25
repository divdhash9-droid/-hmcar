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
    Bell,
    CreditCard,
    LogOut,
    ArrowLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function ProfilePage() {
    const { t, isRTL } = useLanguage();
    const router = useRouter();
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
        // جلب بيانات المستخدم من localStorage
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
            // Update profile via API
            await api.users.updateProfile(userData);

            // Update localStorage
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
            // تنفيذ طلب تغيير كلمة المرور عبر الـ API
            await api.auth.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setMessage(isRTL ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setMessage(err.message || (isRTL ? 'حدث خطأ في النظام' : 'Protocol error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('hm_token');
        localStorage.removeItem('hm_user');
        router.push('/login');
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Background HUD */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-5xl mx-auto">



                {/* Header */}
                <header className="mb-12">
                    <ClientPageHeader
                        title={isRTL ? 'الملف الشخصي' : 'PROFILE SETTINGS'}
                        subtitle={isRTL ? 'إدارة معلوماتك الشخصية وإعدادات الحساب' : 'MANAGE YOUR PERSONAL INFORMATION AND ACCOUNT SETTINGS'}
                        icon={User}
                    />
                </header>

                {/* Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 rounded-2xl text-center"
                    >
                        <p className="text-sm font-bold text-cinematic-neon-blue">{message}</p>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="glass-card p-8 bg-white/[0.01] border-white/5 text-center space-y-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-luxury-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="w-24 h-24 mx-auto rounded-full bg-cinematic-neon-blue/10 border-2 border-cinematic-neon-blue/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                                <User className="w-12 h-12 text-cinematic-neon-blue" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase italic tracking-tight mb-2">{userData.name}</h3>
                                <div className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">{userData.role}</div>
                            </div>
                        </div>

                        {/* Quick Links (hidden for now) */}
                        <div className="hidden" />
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Personal Information */}
                        <div className="glass-card p-10 bg-white/[0.01] border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <Edit3 className="w-6 h-6 text-cinematic-neon-blue" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white">
                                    {isRTL ? 'المعلومات الشخصية' : 'PERSONAL INFORMATION'}
                                </h2>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'الاسم' : 'Full Name'}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="text"
                                            value={userData.name}
                                            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="email"
                                            value={userData.email}
                                            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="tel"
                                            value={userData.phone}
                                            onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-cinematic-neon-blue text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-xl shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_50px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <Save className="w-5 h-5" />
                                    {loading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ التغييرات' : 'SAVE CHANGES')}
                                </motion.button>
                            </form>
                        </div>

                        {/* Change Password */}
                        <div className="glass-card p-10 bg-white/[0.01] border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <Shield className="w-6 h-6 text-cinematic-neon-red" />
                                <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white">
                                    {isRTL ? 'تغيير كلمة المرور' : 'CHANGE PASSWORD'}
                                </h2>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'كلمة المرور الحالية' : 'Current Password'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-red/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'كلمة المرور الجديدة' : 'New Password'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-red/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-red/40 transition-all"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] hover:shadow-[0_0_50px_rgba(255,0,60,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    <Lock className="w-5 h-5" />
                                    {loading ? (isRTL ? 'جاري التحديث...' : 'UPDATING...') : (isRTL ? 'تحديث كلمة المرور' : 'UPDATE PASSWORD')}
                                </motion.button>
                            </form>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}
