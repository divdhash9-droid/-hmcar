'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import {
    Settings, Bell, Palette, Globe, Moon,
    Save, ChevronLeft, ChevronRight,
    Lock, Eye, EyeOff, Smartphone, Mail, Volume2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

export default function ClientSettingsPage() {
    const { isRTL, lang, toggleLanguage } = useLanguage();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        push: true,
        auctionAlerts: true,
        priceDrops: true,
        newMessages: true,
        marketing: false,
    });

    const [appearance, setAppearance] = useState({
        theme: 'dark',
        animations: true,
        soundEffects: false,
    });

    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: '',
    });
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

    const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
        <button
            onClick={onChange}
            className={cn(
                "w-12 h-6 rounded-full transition-all duration-300 relative shrink-0",
                value ? "bg-cinematic-neon-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]" : "bg-white/10"
            )}
        >
            <motion.div
                layout
                className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-md",
                    value ? (isRTL ? "right-1" : "left-6") : (isRTL ? "right-6" : "left-1")
                )}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
        </button>
    );

    const SettingRow = ({ icon: Icon, title, subtitle, value, onChange, color = 'text-cinematic-neon-blue' }: {
        icon: any; title: string; subtitle?: string; value: boolean; onChange: () => void; color?: string;
    }) => (
        <div className={cn(
            "flex items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-white/5 group",
            isRTL && "flex-row-reverse text-right"
        )}>
            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                <div className={cn("p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white">{title}</div>
                    {subtitle && <div className="text-[10px] text-white/40 mt-0.5">{subtitle}</div>}
                </div>
            </div>
            <Toggle value={value} onChange={onChange} />
        </div>
    );

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,240,255,0.04),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-5xl mx-auto">

                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
                    <Link href="/client/dashboard" className="inline-flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                            {isRTL ? 'لوحة التحكم' : 'DASHBOARD'}
                        </span>
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-2xl bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20">
                            <Settings className="w-8 h-8 text-cinematic-neon-blue" />
                        </div>
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
                                {isRTL ? 'الإعدادات' : 'SETTINGS'}
                            </h1>
                            <p className="text-white/40 text-[11px] uppercase tracking-[0.3em] mt-1 font-bold">
                                {isRTL ? 'تخصيص تجربتك في المنصة' : 'CUSTOMIZE YOUR EXPERIENCE'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Success Banner */}
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-5 bg-green-400/10 border border-green-400/20 rounded-2xl text-center"
                    >
                        <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">
                            ✓ {isRTL ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully'}
                        </span>
                    </motion.div>
                )}

                <div className="space-y-8">

                    {/* ─── Notifications ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass-card p-8 md:p-12 bg-white/[0.01] border-white/5"
                    >
                        <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                            <Bell className="w-6 h-6 text-cinematic-neon-yellow" />
                            <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-white">
                                {isRTL ? 'الإشعارات' : 'NOTIFICATIONS'}
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <SettingRow icon={Mail} title={isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'} subtitle={isRTL ? 'استلام رسائل على بريدك' : 'Receive emails for updates'} value={notifications.email} onChange={() => setNotifications(p => ({ ...p, email: !p.email }))} color="text-cinematic-neon-yellow" />
                            <SettingRow icon={Smartphone} title={isRTL ? 'رسائل SMS' : 'SMS Messages'} subtitle={isRTL ? 'إشعارات عبر الجوال' : 'Text message alerts'} value={notifications.sms} onChange={() => setNotifications(p => ({ ...p, sms: !p.sms }))} color="text-cinematic-neon-yellow" />
                            <SettingRow icon={Bell} title={isRTL ? 'تنبيهات المزادات' : 'Auction Alerts'} subtitle={isRTL ? 'عند بدء مزاد جديد أو انتهائه' : 'New & ending auctions'} value={notifications.auctionAlerts} onChange={() => setNotifications(p => ({ ...p, auctionAlerts: !p.auctionAlerts }))} color="text-cinematic-neon-yellow" />
                            <SettingRow icon={Bell} title={isRTL ? 'تنبيهات انخفاض الأسعار' : 'Price Drop Alerts'} subtitle={isRTL ? 'عند تخفيض سعر سيارة محفوظة' : 'When saved car price drops'} value={notifications.priceDrops} onChange={() => setNotifications(p => ({ ...p, priceDrops: !p.priceDrops }))} color="text-cinematic-neon-yellow" />
                            <SettingRow icon={Mail} title={isRTL ? 'الرسائل الجديدة' : 'New Messages'} subtitle={isRTL ? 'عند وصول رسالة جديدة' : 'When you receive a message'} value={notifications.newMessages} onChange={() => setNotifications(p => ({ ...p, newMessages: !p.newMessages }))} color="text-cinematic-neon-yellow" />
                        </div>
                    </motion.section>

                    {/* ─── Appearance ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="glass-card p-8 md:p-12 bg-white/[0.01] border-white/5"
                    >
                        <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                            <Palette className="w-6 h-6 text-purple-400" />
                            <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-white">
                                {isRTL ? 'المظهر واللغة' : 'APPEARANCE & LANGUAGE'}
                            </h2>
                        </div>

                        {/* Language Toggle */}
                        <div className={cn(
                            "flex items-center justify-between gap-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-4",
                            isRTL && "flex-row-reverse"
                        )}>
                            <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                                <div className="p-3 rounded-xl bg-white/5 text-purple-400">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-[12px] font-black uppercase tracking-[0.2em] text-white">
                                        {isRTL ? 'اللغة' : 'Language'}
                                    </div>
                                    <div className="text-[10px] text-white/40 mt-0.5">
                                        {isRTL ? 'تبديل بين العربية والإنجليزية' : 'Switch between Arabic & English'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={toggleLanguage}
                                className="px-5 py-2.5 rounded-xl border border-purple-400/30 bg-purple-400/10 text-purple-400 text-[11px] font-black uppercase tracking-widest hover:bg-purple-400/20 transition-all"
                            >
                                {lang === 'AR' ? 'EN' : 'AR'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            <SettingRow icon={Moon} title={isRTL ? 'الحركات والانتقالات' : 'Animations & Transitions'} subtitle={isRTL ? 'تأثيرات بصرية عند التنقل' : 'Visual effects while navigating'} value={appearance.animations} onChange={() => setAppearance(p => ({ ...p, animations: !p.animations }))} color="text-purple-400" />
                            <SettingRow icon={Volume2} title={isRTL ? 'المؤثرات الصوتية' : 'Sound Effects'} subtitle={isRTL ? 'أصوات عند الإجراءات' : 'Audio feedback on actions'} value={appearance.soundEffects} onChange={() => setAppearance(p => ({ ...p, soundEffects: !p.soundEffects }))} color="text-purple-400" />
                        </div>
                    </motion.section>

                    {/* ─── Change Password ─── */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="glass-card p-8 md:p-12 bg-white/[0.01] border-white/5"
                    >
                        <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                            <Lock className="w-6 h-6 text-amber-400" />
                            <h2 className="text-[13px] font-black uppercase tracking-[0.5em] text-white">
                                {isRTL ? 'تغيير كلمة المرور' : 'CHANGE PASSWORD'}
                            </h2>
                        </div>

                        {pwdMessage && (
                            <div className={cn(
                                "mb-6 p-4 rounded-xl text-center text-[11px] font-black uppercase tracking-widest",
                                pwdMessage.includes('✓')
                                    ? "bg-green-400/10 border border-green-400/20 text-green-400"
                                    : "bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 text-cinematic-neon-red"
                            )}>
                                {pwdMessage}
                            </div>
                        )}

                        <form onSubmit={handlePasswordChange} className="space-y-5">
                            {[
                                { key: 'current', label: isRTL ? 'كلمة المرور الحالية' : 'Current Password' },
                                { key: 'new', label: isRTL ? 'كلمة المرور الجديدة' : 'New Password' },
                                { key: 'confirm', label: isRTL ? 'تأكيد كلمة المرور' : 'Confirm Password' },
                            ].map((field) => (
                                <div key={field.key}>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">
                                        {field.label}
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={passwords[field.key as keyof typeof passwords]}
                                            onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-12 text-sm font-bold text-white focus:outline-none focus:border-amber-400/40 transition-all"
                                            placeholder="••••••••"
                                        />
                                        {field.key === 'confirm' && (
                                            <button type="button" onClick={() => setShowPwd(v => !v)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <motion.button
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-amber-400/10 border border-amber-400/30 text-amber-400 font-black uppercase text-[11px] tracking-[0.3em] rounded-xl hover:bg-amber-400/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                            >
                                <Lock className="w-5 h-5" />
                                {isRTL ? 'تحديث كلمة المرور' : 'UPDATE PASSWORD'}
                            </motion.button>
                        </form>
                    </motion.section>

                    {/* Save Button */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <motion.button
                            onClick={handleSave}
                            disabled={saving}
                            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0,240,255,0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 bg-cinematic-neon-blue text-black font-black uppercase text-[13px] tracking-[0.4em] rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.3)] transition-all disabled:opacity-50 flex items-center justify-center gap-4"
                        >
                            {saving ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                    className="w-6 h-6 border-3 border-black border-t-transparent rounded-full"
                                />
                            ) : (
                                <>
                                    <Save className="w-6 h-6" />
                                    {isRTL ? 'حفظ جميع الإعدادات' : 'SAVE ALL SETTINGS'}
                                </>
                            )}
                        </motion.button>
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
