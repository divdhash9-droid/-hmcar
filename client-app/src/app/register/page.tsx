'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { User, Mail, Lock, ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";

export default function Register() {
    const { isRTL } = useLanguage();
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { socket, isConnected } = useSocket();
    const { user } = useAuth();

    // تتبع دخول العميل لصفحة الإنشاء وإبلاغ الأدمن
    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('user_navigation', {
                userName: user?.name || (isRTL ? 'زائر جديد' : 'New Guest'),
                page: isRTL ? 'صفحة إنشاء حساب' : 'Register Page',
                timestamp: new Date()
            });
        }
    }, [socket, isConnected, isRTL, user]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.auth.register({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    window.location.href = "/login";
                }, 2000);
            } else {
                setError(response.error || (isRTL ? 'فشل إنشاء الحساب' : 'Registration failed'));
            }
        } catch (err: any) {
            setError(err.message || (isRTL ? 'حدث خطأ ما' : 'Something went wrong'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Cinematic Background */}
            <div className="video-bg-wrapper fixed inset-0 z-0" style={{ backgroundColor: '#050505' }}>
                {/* Mobile Poster Image */}
                <div
                    className="absolute inset-0 bg-no-repeat md:hidden"
                    style={{
                        backgroundImage: "url('/images/hmcar.jpg')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center top'
                    }}
                />
                <video
                    autoPlay loop muted playsInline preload="auto"
                    poster="/images/photo_2026-02-07_22-24-18.jpg"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 md:opacity-100"
                    style={{ filter: 'brightness(0.4) contrast(1.2)' }}
                >
                    <source src="/videos/hero.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-black/40 to-black/60" />
            </div>

            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="fixed top-8 left-8 z-50"
            >
                <Link href="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-[#c9a96e] transition-all">
                    <div className="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#c9a96e]/50 backdrop-blur-md">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                </Link>
            </motion.div>

            {/* Register Card */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-md px-2"
            >
                <div className="glass-card p-10 md:p-12 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                            {isRTL ? "إنشاء" : "CREATE"} <span className="text-[#c9a96e]">{isRTL ? "حساب" : "ACCOUNT"}</span>
                        </h1>
                        <p className="text-white/40 text-xs uppercase tracking-widest">{isRTL ? "انضم لنخبة مقتني السيارات" : "JOIN THE ELITE COLLECTORS"}</p>
                    </div>

                    {success ? (
                        <div className="text-center py-10 space-y-4">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-10 h-10 text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold">{isRTL ? "تم بنجاح!" : "Success!"}</h2>
                            <p className="text-white/60">{isRTL ? "جاري تحويلك لصفحة الدخول..." : "Redirecting to login..."}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                        placeholder={isRTL ? "الاسم الكامل" : "Full Name"}
                                    />
                                </div>

                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                        placeholder={isRTL ? "البريد الإلكتروني" : "Email Address"}
                                    />
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 outline-none focus:border-[#c9a96e]/50 focus:bg-white/10 transition-all"
                                        placeholder={isRTL ? "كلمة المرور" : "Password"}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#c9a96e] hover:bg-[#d4b57d] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="uppercase tracking-widest">{isRTL ? "إنشاء الحساب" : "CREATE ACCOUNT"}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-4">
                                <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                    {isRTL ? "لديك حساب بالفعل؟ " : "ALREADY HAVE AN ACCOUNT? "}
                                    <Link href="/login" className="text-[#c9a96e] hover:underline transition-all">
                                        {isRTL ? "سجل الدخول" : "LOGIN NOW"}
                                    </Link>
                                </span>
                            </div>
                        </form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
