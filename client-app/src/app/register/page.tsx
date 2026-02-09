'use client';

import { motion } from "framer-motion";
import { UserPlus, User, Mail, Lock, ArrowRight, ChevronLeft, Globe, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Register() {
    const { t, isRTL, lang, toggleLanguage } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
            return;
        }

        if (formData.name.trim().split(/\s+/).length < 2) {
            setError(isRTL ? 'يجب إدخال الاسم كاملاً (اسمين على الأقل)' : 'Full name must contain at least two names');
            return;
        }

        setLoading(true);

        try {
            const response = await api.auth.register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (response.success) {
                // Save token
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));

                // Redirect
                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden flex items-center justify-center p-6">

            {/* Cinematic Background Atmosphere */}
            <div className="bg-grid-overlay opacity-20" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />

                {/* Floating Light Orbs */}
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-cinematic-neon-blue/5 blur-[180px] rounded-full animate-float-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-luxury-gold/5 blur-[150px] rounded-full" />

                {/* Noise Grain */}
                <div className="absolute inset-0 opacity-[0.03] animate-grain"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* --- TOP HUD BAR --- */}
            <div className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center z-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <ChevronLeft className={cn("w-5 h-5 text-white/20 group-hover:text-white transition-all", isRTL && "rotate-180")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white">{t('home')}</span>
                </Link>
                <button onClick={toggleLanguage} className="p-3 rounded-full bg-white/5 border border-white/10 hover:border-white/40 transition-all text-[10px] font-black">
                    {lang}
                </button>
            </div>

            {/* --- REGISTER CARD --- */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="glass-card p-10 md:p-14 bg-white/[0.02] border-white/5 backdrop-blur-3xl rounded-[3rem] shadow-2xl space-y-12">

                    {/* Logo/Title */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 mb-4">
                            <UserPlus className="w-3.5 h-3.5 text-cinematic-neon-blue" />
                            <span className="text-[8px] font-black uppercase tracking-[0.4em] text-cinematic-neon-blue">New Membership Protocol</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">{t('registerTitle')}</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">{t('registerSubtitle')}</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 rounded-xl text-center">
                            <span className="text-[10px] font-black text-cinematic-neon-red uppercase tracking-widest">{error}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-4">{t('fullName')}</label>
                            <div className="relative group">
                                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors", isRTL ? "right-5" : "left-5")} />
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={isRTL ? "اكتب اسمك بالكامل" : "John Doe"}
                                    className={cn(
                                        "w-full bg-white/5 border border-white/5 rounded-2xl py-5 text-sm text-white focus:outline-none focus:ring-1 focus:border-cinematic-neon-blue/40 focus:ring-cinematic-neon-blue/20 transition-all placeholder:text-white/10",
                                        isRTL ? "pr-14 pl-6" : "pl-14 pr-6"
                                    )}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-4">{t('email')}</label>
                            <div className="relative group">
                                <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors", isRTL ? "right-5" : "left-5")} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className={cn(
                                        "w-full bg-white/5 border border-white/5 rounded-2xl py-5 text-sm text-white focus:outline-none focus:ring-1 focus:border-cinematic-neon-blue/40 focus:ring-cinematic-neon-blue/20 transition-all placeholder:text-white/10",
                                        isRTL ? "pr-14 pl-6" : "pl-14 pr-6"
                                    )}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-4">{t('password')}</label>
                            <div className="relative group">
                                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors", isRTL ? "right-5" : "left-5")} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className={cn(
                                        "w-full bg-white/5 border border-white/5 rounded-2xl py-5 text-sm text-white focus:outline-none focus:ring-1 focus:border-cinematic-neon-blue/40 focus:ring-cinematic-neon-blue/20 transition-all placeholder:text-white/10",
                                        isRTL ? "pr-14 pl-6" : "pl-14 pr-6"
                                    )}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-4">{isRTL ? "تأكيد كلمة المرور" : "CONFIRM"}</label>
                            <div className="relative group">
                                <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-white transition-colors", isRTL ? "right-5" : "left-5")} />
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    className={cn(
                                        "w-full bg-white/5 border border-white/5 rounded-2xl py-5 text-sm text-white focus:outline-none focus:ring-1 focus:border-cinematic-neon-blue/40 focus:ring-cinematic-neon-blue/20 transition-all placeholder:text-white/10",
                                        isRTL ? "pr-14 pl-6" : "pl-14 pr-6"
                                    )}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="col-span-1 md:col-span-2 pt-6">
                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={cn(
                                    "w-full py-5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-[0.5em] transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:bg-cinematic-neon-blue hover:text-white flex items-center justify-center gap-4 group",
                                    loading && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                {loading ? (isRTL ? "جاري التسجيل..." : "REGISTERING...") : t('register')}
                                {!loading && <ArrowRight className={cn("w-4 h-4 transition-transform group-hover:translate-x-2", isRTL && "rotate-180 group-hover:-translate-x-2")} />}
                            </motion.button>
                        </div>
                    </form>

                    <div className="text-center pt-6 border-t border-white/5">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{t('alreadyHaveAccount')} </span>
                        <Link href="/login" className="text-[10px] font-black text-white hover:text-cinematic-neon-blue transition-colors uppercase tracking-widest">
                            {t('login')}
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* --- FOOTER HUD --- */}
            <div className="fixed bottom-10 flex items-center gap-4 text-[8px] font-black text-white/10 uppercase tracking-[0.6em]">
                <ShieldCheck className="w-4 h-4" />
                Encrypted Data Handling Protocol Active
            </div>
        </div>
    );
}
