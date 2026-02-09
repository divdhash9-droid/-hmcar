'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { User, ShieldCheck, Mail, Lock, ArrowRight, ChevronLeft, Globe, Key, UserCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

export default function Login() {
    const { t, isRTL, lang, toggleLanguage } = useLanguage();
    const [role, setRole] = useState<'buyer' | 'admin'>('buyer');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let response;
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('hm_device_id') || '' : '';

            if (role === 'admin') {
                response = await api.auth.login({
                    identifier: formData.email,
                    password: formData.password,
                    role,
                    rememberMe,
                    deviceId
                });
            } else {
                response = await api.auth.autoLogin({
                    name: formData.email,
                    password: formData.password,
                    deviceId
                });
            }

            if (response.success) {
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));

                if (response.isNewUser) {
                    setSuccessMessage(isRTL ? 'تم إنشاء حسابك بنجاح! جاري الدخول...' : 'Account created! Identifying...');
                }

                setTimeout(() => {
                    const userRole = response.user.role || 'buyer';
                    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
                        window.location.href = "/admin/dashboard";
                    } else {
                        window.location.href = "/client/dashboard";
                    }
                }, 1500);
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-luxury-gold selection:text-black flex items-center justify-center p-6 overflow-hidden">

            {/* Cinematic Ambience */}
            <div className="bg-grid-overlay opacity-20" />
            <div className="fixed inset-0 pointer-events-none">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={role}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        className={cn(
                            "absolute inset-0 blur-[200px]",
                            role === 'admin' ? "bg-cinematic-neon-red shadow-[0_0_1000px_rgba(255,0,60,0.5)]" : "bg-luxury-gold shadow-[0_0_1000px_rgba(197,160,89,0.3)]"
                        )}
                    />
                </AnimatePresence>

                {/* Noise Grain */}
                <div className="absolute inset-0 opacity-[0.03] animate-grain"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* Back to Reality Button */}
            <div className="fixed top-12 left-12 z-50">
                <Link href="/" className="group flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.5em] text-white/30 hover:text-white transition-all duration-500">
                    <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center group-hover:border-white transition-all">
                        <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    </div>
                    {isRTL ? "العودة للرئيسية" : "BACK TO PORTAL"}
                </Link>
            </div>

            {/* Entry Module */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="obsidian-card p-10 md:p-20 relative overflow-hidden group">

                    {/* Security Identification Header */}
                    <div className="text-center space-y-8 mb-16">
                        <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10"
                        >
                            <Key className={cn("w-3 h-3", role === 'admin' ? "text-cinematic-neon-red" : "text-luxury-gold")} />
                            <span className="text-[8px] font-black uppercase tracking-[0.6em] text-white/40 italic">
                                {role === 'admin' ? "ENCRYPTED ADMIN PROTOCOL" : "UNIFIED ELITE ACCESS"}
                            </span>
                        </motion.div>

                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.8] drop-shadow-2xl">
                            {isRTL ? "الدخول" : "ACCESS"} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/30 to-white/10">
                                {isRTL ? "للمنصة" : "TERMINAL"}
                            </span>
                        </h1>
                    </div>

                    {/* Role Bifurcation */}
                    <div className="flex bg-black/40 p-2 rounded-3xl border border-white/5 mb-12">
                        <button
                            onClick={() => setRole('buyer')}
                            className={cn(
                                "flex-1 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all duration-700 text-[10px] font-black uppercase tracking-[0.2em]",
                                role === 'buyer' ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white"
                            )}
                        >
                            <UserCheck className="w-4 h-4" />
                            {isRTL ? "عميل" : "CLIENT"}
                        </button>
                        <button
                            onClick={() => setRole('admin')}
                            className={cn(
                                "flex-1 py-5 rounded-2xl flex items-center justify-center gap-4 transition-all duration-700 text-[10px] font-black uppercase tracking-[0.2em]",
                                role === 'admin' ? "bg-cinematic-neon-red text-white shadow-2xl" : "text-white/30 hover:text-white"
                            )}
                        >
                            <ShieldCheck className="w-4 h-4" />
                            {isRTL ? "مدير" : "MANAGER"}
                        </button>
                    </div>

                    {/* Authentication Matrix */}
                    <form onSubmit={handleLogin} className="space-y-10">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="px-6 py-4 bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 rounded-2xl text-center"
                                >
                                    <span className="text-[10px] font-black text-cinematic-neon-red uppercase tracking-widest leading-loose">{error}</span>
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="px-6 py-4 bg-luxury-gold/10 border border-luxury-gold/20 rounded-2xl text-center"
                                >
                                    <span className="text-[10px] font-black text-luxury-gold uppercase tracking-widest leading-loose">{successMessage}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-8">
                            <div className="space-y-3 relative group">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] block ml-2">{role === 'admin' ? "IDENTIFIER" : "SIGNATURE NAME"}</label>
                                <div className="relative">
                                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white transition-all duration-500", isRTL ? "right-8" : "left-8")} />
                                    <input
                                        type={role === 'admin' ? "email" : "text"}
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={cn(
                                            "w-full glass-input",
                                            isRTL ? "pr-16 pl-8" : "pl-16 pr-8",
                                            role === 'admin' && "focus:border-cinematic-neon-red"
                                        )}
                                        placeholder={role === 'admin' ? "ENTER EMAIL" : "e.g. AHMAD AL-HM"}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 relative group">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] block ml-2">ACCESS DECODE</label>
                                <div className="relative">
                                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-white transition-all duration-500", isRTL ? "right-8" : "left-8")} />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={cn(
                                            "w-full glass-input placeholder:text-white/5",
                                            isRTL ? "pr-16 pl-8" : "pl-16 pr-8",
                                            role === 'admin' && "focus:border-cinematic-neon-red"
                                        )}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                                <div className={cn(
                                    "w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-500",
                                    rememberMe ? (role === 'admin' ? "bg-cinematic-neon-red border-cinematic-neon-red" : "bg-white border-white") : "border-white/10"
                                )}>
                                    {rememberMe && <Sparkles className={cn("w-3 h-3", role === 'admin' ? "text-white" : "text-black")} />}
                                </div>
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{isRTL ? "تذكر الجهاز" : "STAY IDENTIFIED"}</span>
                            </div>
                            {isRTL ? (
                                <Link href="/register" className="text-[9px] font-black text-luxury-gold uppercase tracking-[0.3em] hover:text-white transition-colors">عضوية جديدة؟</Link>
                            ) : (
                                <Link href="/register" className="text-[9px] font-black text-luxury-gold uppercase tracking-[0.3em] hover:text-white transition-colors">NO ACCESS? JOIN</Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full btn-luxury py-7 rounded-3xl group",
                                role === 'admin' ? "bg-cinematic-neon-red text-white hover:bg-cinematic-neon-red shadow-[0_15px_60px_rgba(255,0,60,0.3)] border-transparent" : "",
                                loading && "opacity-50"
                            )}
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>{role === 'admin' ? "INITIALIZE" : (isRTL ? "دخول آمن" : "SECURE ENTRY")}</span>
                                    <ArrowRight className={cn("w-5 h-5 transition-transform", isRTL ? "rotate-180 group-hover:-translate-x-2" : "group-hover:translate-x-2")} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>

            {/* Matrix Static Footer */}
            <div className="fixed bottom-12 flex flex-col items-center gap-4 opacity-10">
                <div className="text-[9px] font-black text-white uppercase tracking-[1em] text-center italic">
                    HM DIGITAL VAULT // AUTHENTICATION CORE v.4.0
                </div>
            </div>
        </div>
    );
}
