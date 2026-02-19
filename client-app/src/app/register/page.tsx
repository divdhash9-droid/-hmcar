'use client';

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, User, Mail, Lock, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useState } from "react";
import { api } from "@/lib/api";

export default function Register() {
    const { t, isRTL, lang, toggleLanguage } = useLanguage();
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', confirmPassword: ''
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
                name: formData.name, email: formData.email, password: formData.password
            });
            if (response.success) {
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));
                window.location.href = "/dashboard";
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* ── VIDEO BACKGROUND ── */}
            <div className="video-bg-wrapper">
                <video
                    autoPlay loop muted playsInline
                    className="video-bg"
                    style={{ filter: 'brightness(0.3) contrast(1.2) saturate(1.1)' }}
                >
                    <source src="/videos/video_2026-02-07_22-24-58.mp4" type="video/mp4" />
                </video>
                <div className="video-overlay-dark" />
                <div className="video-grain" />
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="orb orb-blue w-[600px] h-[600px] top-[-200px] right-[-200px] animate-breathe" />
                <div className="orb orb-gold w-[400px] h-[400px] bottom-[-100px] left-[-100px] animate-breathe delay-1000" />
            </div>

            {/* ── BACK BUTTON ── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="fixed top-8 left-8 z-50"
            >
                <Link href="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 hover:text-white/70 transition-all duration-500">
                    <div className="w-11 h-11 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-white/25 group-hover:bg-white/5 transition-all backdrop-blur-md">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                    <span className="hidden sm:block">{isRTL ? "الرئيسية" : "HOME"}</span>
                </Link>
            </motion.div>

            {/* ── REGISTER CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-lg"
            >
                <div className="obsidian-card p-8 sm:p-10 md:p-12">

                    {/* Header */}
                    <div className="text-center space-y-5 mb-10">
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/8"
                        >
                            <UserPlus className="w-3 h-3 text-accent-blue" />
                            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/30">
                                {isRTL ? "حساب جديد" : "NEW ACCOUNT"}
                            </span>
                        </motion.div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] uppercase leading-[0.9]">
                            {isRTL ? "إنشاء" : "CREATE"}
                            <br />
                            <span className="gradient-text-platinum">{isRTL ? "حساب" : "ACCOUNT"}</span>
                        </h1>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-center mb-6"
                            >
                                <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest">{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">{isRTL ? "الاسم الكامل" : "FULL NAME"}</label>
                            <div className="relative group">
                                <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors", isRTL ? "right-4" : "left-4")} />
                                <input
                                    type="text" required value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={isRTL ? "اسمك الكامل" : "John Doe"}
                                    className={cn("w-full glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">{isRTL ? "البريد الإلكتروني" : "EMAIL"}</label>
                            <div className="relative group">
                                <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors", isRTL ? "right-4" : "left-4")} />
                                <input
                                    type="email" required value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className={cn("w-full glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">{isRTL ? "كلمة المرور" : "PASSWORD"}</label>
                                <div className="relative group">
                                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors", isRTL ? "right-4" : "left-4")} />
                                    <input
                                        type="password" required minLength={6} value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        className={cn("w-full glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/20 uppercase tracking-[0.3em] px-1">{isRTL ? "تأكيد" : "CONFIRM"}</label>
                                <div className="relative group">
                                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white/40 transition-colors", isRTL ? "right-4" : "left-4")} />
                                    <input
                                        type="password" required minLength={6} value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className={cn("w-full glass-input", isRTL ? "pr-12 pl-4" : "pl-12 pr-4")}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit" disabled={loading}
                            className={cn("w-full btn-luxury py-5 rounded-xl group mt-4", loading && "opacity-50 pointer-events-none")}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{isRTL ? "إنشاء الحساب" : "CREATE ACCOUNT"}</span>
                                    <ArrowRight className={cn("w-4 h-4 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-6 mt-6 border-t border-white/5">
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{isRTL ? "لديك حساب؟" : "ALREADY HAVE AN ACCOUNT?"} </span>
                        <Link href="/login" className="text-[10px] font-bold text-accent-gold hover:text-accent-gold/80 transition-colors uppercase tracking-widest">
                            {isRTL ? "تسجيل الدخول" : "SIGN IN"}
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <div className="fixed bottom-8 text-center opacity-10">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                    HM CAR SYSTEMS // v4.0
                </span>
            </div>
        </div>
    );
}
