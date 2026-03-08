'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Settings, Bell, Palette, Globe,
    Save, Lock, Eye, EyeOff, Smartphone, Mail, Volume2, Moon, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

export default function ClientSettingsPage() {
    const { isRTL, lang, toggleLanguage } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        auctionAlerts: true,
        priceDrops: true,
        newMessages: true,
    });

    const [appearance, setAppearance] = useState({
        animations: true,
        soundEffects: false,
    });

    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [pwdMessage, setPwdMessage] = useState('');

    const handleSave = async () => {
        setSaving(true);
        try {
            await new Promise(r => setTimeout(r, 800));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setPwdMessage(isRTL ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
            return;
        }
        if (passwords.new.length < 6) {
            setPwdMessage(isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
            return;
        }
        setSaving(true);
        try {
            await new Promise(r => setTimeout(r, 600));
            setPwdMessage(isRTL ? '✓ تم تغيير كلمة المرور بنجاح' : '✓ Password changed successfully');
            setPasswords({ current: '', new: '', confirm: '' });
        } finally {
            setSaving(false);
        }
    };

    // مكوّن Toggle
    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-300 shrink-0',
                value ? 'bg-[#c9a96e]' : 'bg-white/10'
            )}
        >
            <div className={cn(
                'absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300',
                value ? (isRTL ? 'right-1' : 'left-6') : (isRTL ? 'right-6' : 'left-1')
            )} />
        </button>
    );

    // مكوّن صف الإعداد
    const SettingRow = ({ icon: Icon, title, subtitle, value, onChange, iconColor = '#c9a96e' }: {
        icon: any; title: string; subtitle?: string; value: boolean; onChange: () => void; iconColor?: string;
    }) => (
        <div className={cn(
            'flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-white/[0.05]',
            isRTL && 'flex-row-reverse text-right'
        )}>
            <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}15` }}>
                    <Icon className="w-4 h-4" style={{ color: iconColor }} strokeWidth={1.8} />
                </div>
                <div>
                    <div className="text-[13px] font-semibold text-white">{title}</div>
                    {subtitle && <div className="text-[11px] text-white/35 mt-0.5">{subtitle}</div>}
                </div>
            </div>
            <Toggle value={value} onChange={onChange} />
        </div>
    );

    return (
        <div className={cn("min-h-full", isRTL && "rtl")}>
            <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-8 max-w-2xl mx-auto lg:mx-0">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
                    <p className="text-[11px] text-white/25 font-bold uppercase tracking-[0.3em] mb-1">
                        {isRTL ? 'تخصيص الحساب' : 'Customize Account'}
                    </p>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                        {isRTL ? 'الإعدادات' : 'Settings'}
                    </h1>
                </motion.div>

                {/* Success Banner */}
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-5 p-4 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center gap-3"
                    >
                        <div className="w-6 h-6 rounded-full bg-green-400/20 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-green-400" />
                        </div>
                        <span className="text-[13px] font-semibold text-green-400">
                            {isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'}
                        </span>
                    </motion.div>
                )}

                <div className="space-y-5">

                    {/* ─── اللغة ─── */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <div className={cn('flex items-center gap-3 px-5 py-4 bg-white/[0.02] border-b border-white/[0.05]', isRTL && 'flex-row-reverse')}>
                                <Globe className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.8} />
                                <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.25em]">
                                    {isRTL ? 'اللغة' : 'Language'}
                                </span>
                            </div>
                            <div className={cn('flex items-center justify-between gap-4 p-4', isRTL && 'flex-row-reverse')}>
                                <div>
                                    <div className="text-[13px] font-semibold text-white">
                                        {isRTL ? 'لغة التطبيق' : 'App Language'}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-0.5">
                                        {isRTL ? 'العربية / الإنجليزية' : 'Arabic / English'}
                                    </div>
                                </div>
                                <button
                                    onClick={toggleLanguage}
                                    className="px-4 py-2 rounded-lg border border-[#c9a96e]/30 bg-[#c9a96e]/10 text-[#c9a96e] text-[12px] font-black uppercase tracking-wider hover:bg-[#c9a96e]/20 transition-all"
                                >
                                    {lang === 'AR' ? 'EN' : 'AR'}
                                </button>
                            </div>
                        </div>
                    </motion.section>

                    {/* ─── الإشعارات ─── */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <div className={cn('flex items-center gap-3 px-5 py-4 bg-white/[0.02] border-b border-white/[0.05]', isRTL && 'flex-row-reverse')}>
                                <Bell className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.8} />
                                <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.25em]">
                                    {isRTL ? 'الإشعارات' : 'Notifications'}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                <SettingRow
                                    icon={Mail}
                                    title={isRTL ? 'إشعارات البريد' : 'Email Notifications'}
                                    subtitle={isRTL ? 'تحديثات عبر البريد الإلكتروني' : 'Updates via email'}
                                    value={notifications.email}
                                    onChange={() => setNotifications(p => ({ ...p, email: !p.email }))}
                                />
                                <SettingRow
                                    icon={Smartphone}
                                    title={isRTL ? 'رسائل SMS' : 'SMS Messages'}
                                    subtitle={isRTL ? 'تنبيهات عبر الجوال' : 'Text message alerts'}
                                    value={notifications.sms}
                                    onChange={() => setNotifications(p => ({ ...p, sms: !p.sms }))}
                                />
                                <SettingRow
                                    icon={Bell}
                                    title={isRTL ? 'تنبيهات المزادات' : 'Auction Alerts'}
                                    subtitle={isRTL ? 'عند بدء أو انتهاء مزاد' : 'Auction start & end alerts'}
                                    value={notifications.auctionAlerts}
                                    onChange={() => setNotifications(p => ({ ...p, auctionAlerts: !p.auctionAlerts }))}
                                />
                                <SettingRow
                                    icon={Bell}
                                    title={isRTL ? 'تنبيهات انخفاض الأسعار' : 'Price Drop Alerts'}
                                    subtitle={isRTL ? 'عند تخفيض سعر سيارة محفوظة' : 'When saved car price drops'}
                                    value={notifications.priceDrops}
                                    onChange={() => setNotifications(p => ({ ...p, priceDrops: !p.priceDrops }))}
                                />
                                <SettingRow
                                    icon={Mail}
                                    title={isRTL ? 'رسائل جديدة' : 'New Messages'}
                                    subtitle={isRTL ? 'عند وصول رسالة جديدة' : 'When you receive a message'}
                                    value={notifications.newMessages}
                                    onChange={() => setNotifications(p => ({ ...p, newMessages: !p.newMessages }))}
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* ─── المظهر ─── */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <div className={cn('flex items-center gap-3 px-5 py-4 bg-white/[0.02] border-b border-white/[0.05]', isRTL && 'flex-row-reverse')}>
                                <Palette className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.8} />
                                <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.25em]">
                                    {isRTL ? 'المظهر' : 'Appearance'}
                                </span>
                            </div>
                            <div className="p-3 space-y-2">
                                <SettingRow
                                    icon={Moon}
                                    title={isRTL ? 'الحركات والتأثيرات' : 'Animations'}
                                    subtitle={isRTL ? 'تأثيرات بصرية عند التنقل' : 'Visual effects while navigating'}
                                    value={appearance.animations}
                                    onChange={() => setAppearance(p => ({ ...p, animations: !p.animations }))}
                                    iconColor="#a78bfa"
                                />
                                <SettingRow
                                    icon={Volume2}
                                    title={isRTL ? 'المؤثرات الصوتية' : 'Sound Effects'}
                                    subtitle={isRTL ? 'أصوات عند الإجراءات' : 'Audio feedback on actions'}
                                    value={appearance.soundEffects}
                                    onChange={() => setAppearance(p => ({ ...p, soundEffects: !p.soundEffects }))}
                                    iconColor="#a78bfa"
                                />
                            </div>
                        </div>
                    </motion.section>

                    {/* ─── تغيير كلمة المرور ─── */}
                    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
                            <div className={cn('flex items-center gap-3 px-5 py-4 bg-white/[0.02] border-b border-white/[0.05]', isRTL && 'flex-row-reverse')}>
                                <Lock className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.8} />
                                <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.25em]">
                                    {isRTL ? 'تغيير كلمة المرور' : 'Change Password'}
                                </span>
                            </div>
                            <div className="p-5">
                                {pwdMessage && (
                                    <div className={cn(
                                        'mb-4 p-3.5 rounded-xl text-[12px] font-semibold flex items-center gap-2',
                                        pwdMessage.includes('✓')
                                            ? 'bg-green-400/10 border border-green-400/20 text-green-400'
                                            : 'bg-red-400/10 border border-red-400/20 text-red-400'
                                    )}>
                                        {pwdMessage}
                                    </div>
                                )}
                                <form onSubmit={handlePasswordChange} className="space-y-4">
                                    {[
                                        { key: 'current', label: isRTL ? 'كلمة المرور الحالية' : 'Current Password' },
                                        { key: 'new', label: isRTL ? 'كلمة المرور الجديدة' : 'New Password' },
                                        { key: 'confirm', label: isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password' },
                                    ].map((field) => (
                                        <div key={field.key}>
                                            <label className="block text-[11px] font-semibold text-white/40 mb-2">
                                                {field.label}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPwd ? 'text' : 'password'}
                                                    value={passwords[field.key as keyof typeof passwords]}
                                                    onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                                                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 px-4 text-[14px] text-white focus:outline-none focus:border-[#c9a96e]/40 transition-all placeholder:text-white/20"
                                                    placeholder="••••••••"
                                                />
                                                {field.key === 'confirm' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPwd(v => !v)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                                                    >
                                                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="w-full py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.08] font-semibold text-[13px] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Lock className="w-4 h-4" strokeWidth={1.8} />
                                        {isRTL ? 'تحديث كلمة المرور' : 'Update Password'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </motion.section>

                    {/* ─── زر الحفظ ─── */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 rounded-2xl bg-[#c9a96e] text-black font-bold text-[14px] tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2.5 hover:bg-[#d4b57a] active:scale-[0.98]"
                        >
                            {saving ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                                />
                            ) : (
                                <>
                                    <Save className="w-4.5 h-4.5" strokeWidth={2} />
                                    {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
                                </>
                            )}
                        </button>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
