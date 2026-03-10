'use client';

/**
 * تبويب الملف الشخصي - ProfileTab
 * يتيح للمسؤول تعديل بياناته الشخصية وتغيير كلمة المرور
 */

import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ProfileData {
    name: string; username: string; email: string; phone: string;
    currentPassword: string; newPassword: string; confirmPassword: string;
}

interface ProfileTabProps {
    profileData: ProfileData;
    loading: boolean;
    isRTL: boolean;
    onProfileChange: (data: ProfileData) => void;
    onSave: () => void;
    onSilentSave: () => void;
}

export default function ProfileTab({ profileData, loading, isRTL, onProfileChange, onSave, onSilentSave }: ProfileTabProps) {
    // حالة إظهار/إخفاء كلمات المرور
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
    const update = (field: keyof ProfileData, val: string) => onProfileChange({ ...profileData, [field]: val });

    // حقول البيانات الشخصية
    const personalFields = [
        { key: 'name', label: isRTL ? 'الاسم' : 'Name', icon: User, type: 'text', autoComplete: 'name' },
        { key: 'email', label: isRTL ? 'البريد الإلكتروني' : 'Email', icon: Mail, type: 'email', autoComplete: 'email' },
        { key: 'username', label: isRTL ? 'اسم المستخدم' : 'Username', icon: User, type: 'text', autoComplete: 'username' },
        { key: 'phone', label: isRTL ? 'الهاتف' : 'Phone', icon: Phone, type: 'tel', autoComplete: 'tel' },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-8">

                {/* ── البيانات الشخصية ── */}
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                        <User className="w-5 h-5 text-cinematic-neon-red" />
                        {isRTL ? 'البيانات الشخصية' : 'Personal Information'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {personalFields.map(field => {
                            const Icon = field.icon;
                            return (
                                <div key={field.key}>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{field.label}</label>
                                    <div className="relative">
                                        <Icon className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-4' : 'left-4')} />
                                        <input
                                            type={field.type}
                                            autoComplete={field.autoComplete}
                                            title={field.label}
                                            placeholder={field.label}
                                            value={profileData[field.key as keyof ProfileData]}
                                            onChange={e => update(field.key as keyof ProfileData, e.target.value)}
                                            // حفظ تلقائي عند مغادرة الحقل
                                            onBlur={onSilentSave}
                                            className={cn('w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40', isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4')}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── تغيير كلمة المرور ── */}
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <h2 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                        <Shield className="w-5 h-5 text-cinematic-neon-red" />
                        {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* كلمة المرور الحالية */}
                        {[
                            { key: 'currentPassword', label: isRTL ? 'كلمة المرور الحالية' : 'Current Password', show: showPass.current, toggle: () => setShowPass(p => ({ ...p, current: !p.current })), autoComplete: 'current-password' },
                            { key: 'newPassword', label: isRTL ? 'كلمة المرور الجديدة' : 'New Password', show: showPass.new, toggle: () => setShowPass(p => ({ ...p, new: !p.new })), autoComplete: 'new-password' },
                            { key: 'confirmPassword', label: isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password', show: showPass.confirm, toggle: () => setShowPass(p => ({ ...p, confirm: !p.confirm })), autoComplete: 'new-password' },
                        ].map(field => (
                            <div key={field.key}>
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block">{field.label}</label>
                                <div className="relative">
                                    <Lock className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-4' : 'left-4')} />
                                    <input
                                        type={field.show ? 'text' : 'password'}
                                        autoComplete={field.autoComplete}
                                        title={field.label}
                                        placeholder={field.label}
                                        value={profileData[field.key as keyof ProfileData]}
                                        onChange={e => update(field.key as keyof ProfileData, e.target.value)}
                                        className={cn('w-full bg-white/5 border border-white/10 rounded-xl py-4 text-sm focus:outline-none focus:border-cinematic-neon-red/40', isRTL ? 'pr-12 pl-12' : 'pl-12 pr-12')}
                                    />
                                    {/* زر إظهار/إخفاء كلمة المرور */}
                                    <button type="button" onClick={field.toggle}
                                        className={cn('absolute top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors', isRTL ? 'left-4' : 'right-4')}>
                                        {field.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* زر الحفظ */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-wider rounded-xl shadow-[0_0_30px_rgba(255,0,60,0.3)] flex items-center justify-center gap-3 transition-all">
                    <Save className="w-5 h-5" />
                    {loading ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ البيانات' : 'Save Profile')}
                </motion.button>
            </form>
        </motion.div>
    );
}
