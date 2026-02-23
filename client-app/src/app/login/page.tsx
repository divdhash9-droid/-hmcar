'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { User, ShieldCheck, Mail, Lock, ArrowRight, ChevronLeft, ChevronRight, Key, UserCheck, Sparkles, Power, Eye, EyeOff, Phone, Search } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { countryDialCodes } from "@/lib/countries";

export default function Login() {
    const { t, isRTL, lang, toggleLanguage } = useLanguage();
    const [role, setRole] = useState<'buyer' | 'admin'>('buyer');
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [method, setMethod] = useState<'name' | 'phone'>('phone');
    const countryList = countryDialCodes.map(c => ({ code: c.code, dial: c.dial, name: isRTL ? (c.nameAr || c.nameEn) : c.nameEn }));
    const [countrySearch, setCountrySearch] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(countryList[0]);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showCountry, setShowCountry] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const DEV_FAKE = process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN === '1';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let response;
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('hm_device_id') || '' : '';

            const identifier = formData.email.trim();
            if (role === 'admin') {
                response = await api.auth.login({
                    identifier: formData.email,
                    password: formData.password,
                    role,
                    rememberMe,
                    deviceId
                });
            } else {
                if (method === 'name') {
                    const parts = identifier.split(/\s+/).filter(Boolean);
                    if (parts.length < 2) {
                        throw new Error('الاسم يجب أن يكون على الأقل اسمين');
                    }
                } else {
                    const digits = phoneNumber.replace(/\D/g, '');
                    if (digits.length < 8 || digits.length > 15) {
                        throw new Error('رقم الهاتف غير صالح');
                    }
                }
                if (formData.password.length < 6) {
                    throw new Error('كلمة المرور يجب أن تكون 6 خانات على الأقل');
                }
                const phoneE164 = `${selectedCountry.dial}${phoneNumber.replace(/\D/g, '')}`;
                if (method === 'phone' && !otpRequested) {
                    try {
                        await api.auth.sendOtp({ phone: phoneE164 });
                        setSuccessMessage(isRTL ? 'تم إرسال رمز التحقق إلى هاتفك' : 'Verification code sent to your phone');
                        setOtpRequested(true);
                        setLoading(false);
                        return;
                    } catch {
                        const mock = String(Math.floor(100000 + Math.random() * 900000));
                        try {
                            localStorage.setItem(`hm_mock_otp_${phoneE164}`, mock);
                        } catch { }
                        setSuccessMessage(isRTL ? `رمز تجريبي: ${mock}` : `Mock code: ${mock}`);
                        setOtpRequested(true);
                        setLoading(false);
                        return;
                    }
                }
                if (method === 'phone' && otpRequested) {
                    if (!otpCode || otpCode.replace(/\D/g, '').length < 4) {
                        throw new Error(isRTL ? 'أدخل رمز التحقق الصحيح' : 'Enter valid verification code');
                    }
                    try {
                        await api.auth.verifyOtp({ phone: phoneE164, code: otpCode });
                    } catch {
                        const saved = typeof window !== 'undefined' ? localStorage.getItem(`hm_mock_otp_${phoneE164}`) : null;
                        if (!saved || saved !== otpCode) {
                            throw new Error(isRTL ? 'رمز التحقق غير صحيح' : 'Invalid verification code');
                        }
                    }
                }
                response = await api.auth.autoLogin({
                    name: method === 'name' ? identifier : phoneE164,
                    password: formData.password,
                    deviceId
                });
            }

            if (response.success) {
                // حفظ التوكن وبيانات المستخدم
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));
                // حفظ الدور منفصلاً لأن dashboard يقرأها بشكل منفصل
                const savedRole = response.user?.role || 'buyer';
                localStorage.setItem('hm_user_role', savedRole);
                // حفظ في Cookie للـ middleware
                document.cookie = `hm_token=${response.token}; path=/; max-age=86400; SameSite=Lax`;

                if (response.isNewUser) {
                    setSuccessMessage(isRTL ? 'تم إنشاء حسابك بنجاح! جاري الدخول...' : 'Account created! Logging in...');
                } else {
                    setSuccessMessage(isRTL ? 'تم تسجيل الدخول بنجاح ✓' : 'Login successful ✓');
                }

                console.log('[Login] Success response:', response);
                setTimeout(() => {
                    const userRole = response.user.role || 'buyer';
                    console.log('[Login] Redirecting as:', userRole);
                    if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
                        window.location.href = "/admin/dashboard";
                    } else {
                        window.location.href = "/client/dashboard";
                    }
                }, 800);
            } else {
                console.warn('[Login] Failure response:', response);
                setError(response.error || 'فشل تسجيل الدخول: استجابة غير متوقعة');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('[Login] Caught Exception:', err);
            const identifier = formData.email.trim();
            if (role === 'admin' && DEV_FAKE && identifier === 'admin@hmcar.com' && formData.password.length >= 6) {
                console.log('[Login] Falling back to DEV_FAKE admin...');
                localStorage.setItem('hm_token', 'dev_admin_token');
                localStorage.setItem('hm_user', JSON.stringify({ role: 'admin', name: 'Admin', email: identifier }));
                document.cookie = `hm_token=dev_admin_token; path=/; max-age=86400; SameSite=Lax`;
                setSuccessMessage(isRTL ? 'تم الدخول كمدير (وضع تجريبي)' : 'Logged in as admin (dev mode)');
                setTimeout(() => {
                    window.location.href = "/admin/dashboard";
                }, 800);
            } else if (role === 'buyer' && method === 'name') {
                const parts = identifier.split(/\s+/).filter(Boolean);
                if (parts.length >= 2 && formData.password.length >= 6) {
                    const localId = `local_${Date.now()}`;
                    localStorage.setItem('hm_token', 'dev_buyer_token');
                    localStorage.setItem('hm_user', JSON.stringify({ _id: localId, role: 'buyer', name: identifier, email: '', phone: '' }));
                    localStorage.setItem('hm_user_role', 'buyer');
                    setSuccessMessage(isRTL ? 'تم الدخول كعميل (وضع تجريبي)' : 'Logged in as client (dev mode)');
                    setTimeout(() => {
                        window.location.href = "/client/dashboard";
                    }, 800);
                } else {
                    setError(err.message || 'Authentication failed');
                    setLoading(false);
                }
            } else if (role === 'buyer' && method === 'phone') {
                const digits = phoneNumber.replace(/\D/g, '');
                const phoneE164 = `${selectedCountry.dial}${digits}`;
                const codeOk = !otpRequested || (otpCode && otpCode.replace(/\D/g, '').length >= 4);
                if (digits.length >= 8 && digits.length <= 15 && formData.password.length >= 6 && codeOk) {
                    const localId = `local_${Date.now()}`;
                    localStorage.setItem('hm_token', 'dev_buyer_token');
                    localStorage.setItem('hm_user', JSON.stringify({ _id: localId, role: 'buyer', name: phoneE164, phone: phoneE164, email: '' }));
                    localStorage.setItem('hm_user_role', 'buyer');
                    setSuccessMessage(isRTL ? 'تم الدخول كعميل (وضع تجريبي)' : 'Logged in as client (dev mode)');
                    setTimeout(() => {
                        window.location.href = "/client/dashboard";
                    }, 800);
                } else {
                    setError(err.message || 'Authentication failed');
                    setLoading(false);
                }
            } else {
                setError(err.message || 'Authentication failed');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        try {
            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            if (path.includes('/admin/login') || sp?.get('role') === 'admin') {
                setRole('admin');
            }
        } catch { }
    }, []);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hm_remember');
            if (saved) {
                const data = JSON.parse(saved);
                if (data && typeof data.identifier === 'string' && typeof data.password === 'string') {
                    setFormData({ email: data.identifier, password: data.password });
                    setRememberMe(true);
                    if (data.role) setRole(data.role);
                }
            }
        } catch { }
    }, []);

    useEffect(() => {
        if (DEV_FAKE && role === 'admin' && !formData.email && !formData.password) {
            setFormData({ email: 'admin@hmcar.com', password: '123456' });
        }
    }, [role]);

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        // تشغيل الفيديو بسرعة سينمائية
        video.playbackRate = 0.8;
        const tryPlay = () => {
            video.play().catch(() => {
                // إذا فشل التشغيل التلقائي، ابق على الصورة الاحتياطية
                if (videoRef.current) {
                    videoRef.current.style.opacity = '0';
                }
            });
        };
        if (video.readyState >= 2) {
            tryPlay();
        } else {
            video.addEventListener('canplay', tryPlay, { once: true });
        }
    }, []);

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>

            {/* ── CINEMATIC VIDEO BACKGROUND ── */}
            <div className="video-bg-wrapper fixed inset-0 z-0">

                {/* Desktop fallback image (always rendered under the video) */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/photo_2026-02-07_22-24-18.jpg')", backgroundColor: '#050505' }}
                />

                {/* Video: يُعرض دائماً — المتصفح يحمله ويشغله فوراً.
                    لا تستخدم hidden على عناصر الفيديو، يمنع التحميل! */}
                <video
                    ref={videoRef}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    poster="/images/photo_2026-02-07_22-24-18.jpg"
                    className="video-bg absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.4) contrast(1.2) saturate(1.2)', opacity: 0.6 }}
                    onError={(e) => {
                        // إذا فشل تحميل الفيديو، أخفيه وأظهر الصورة الاحتياطية
                        (e.target as HTMLVideoElement).style.opacity = '0';
                    }}
                >
                    <source src="/videos/video.mp4" type="video/mp4" />
                    <source src="/videos/hero.mp4" type="video/mp4" />
                </video>

                {/* Mobile overlay: يغطي الفيديو على الأجهزة الصغيرة فقط */}
                <div
                    className="absolute inset-0 z-10 bg-cover bg-center md:hidden"
                    style={{ backgroundImage: "url('/images/hmcar.jpg')", backgroundColor: '#050505' }}
                />

                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
                <div className="scanlines absolute inset-0 z-20" />
            </div>

            {/* ── AMBIENT ORBS ── */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="orb orb-gold w-[600px] h-[600px] top-[-200px] right-[-200px] animate-breathe blur-[100px] opacity-30" />
                <div className="orb orb-blue w-[400px] h-[400px] bottom-[-100px] left-[-100px] animate-breathe delay-1000 blur-[100px] opacity-20" />
            </div>

            {/* ── BACK BUTTON ── */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="fixed top-8 left-8 z-50"
            >
                <Link href="/" className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 hover:text-[#c9a96e] transition-all duration-500">
                    <div className="w-11 h-11 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-[#c9a96e]/50 group-hover:bg-[#c9a96e]/10 transition-all backdrop-blur-md">
                        {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </div>
                    <span className="hidden sm:block">{isRTL ? "الرئيسية" : "HOME"}</span>
                </Link>
            </motion.div>

            {/* ── LOGIN CARD ── */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="glass-card p-8 sm:p-10 md:p-12 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">

                    {/* ── Header ── */}
                    <div className="text-center space-y-6 mb-10">
                        {/* Animated badge */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                        >
                            <Key className={cn("w-3 h-3", role === 'admin' ? "text-accent-red" : "text-accent-gold")} />
                            <span className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/50">
                                {role === 'admin'
                                    ? (isRTL ? "دخول المدير" : "ADMIN ACCESS")
                                    : (isRTL ? "دخول العميل" : "CLIENT ACCESS")
                                }
                            </span>
                        </motion.div>

                        {/* Title */}
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-[-0.04em] uppercase leading-[0.9] text-white">
                                {isRTL ? "تسجيل" : "SIGN"}
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">{isRTL ? "الدخول" : "IN"}</span>
                            </h1>
                        </div>
                    </div>

                    {/* ── Role Switcher ── */}
                    <div className="flex bg-black/20 p-1.5 rounded-xl border border-white/5 mb-8 backdrop-blur-md">
                        <button
                            onClick={() => setRole('buyer')}
                            className={cn(
                                "relative overflow-visible flex-1 py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-500 text-[10px] font-bold uppercase tracking-[0.15em]",
                                role === 'buyer'
                                    ? "bg-white text-black shadow-lg shadow-white/10 ring-1 ring-blue-500/30 border border-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.25)]"
                                    : "text-white/30 hover:text-white/50"
                            )}
                        >
                            {role === 'buyer' && <span className="pointer-events-none absolute inset-0 -m-px rounded-lg bg-blue-500/30 blur-xl opacity-50 -z-10" />}
                            <UserCheck className="w-3.5 h-3.5" />
                            {isRTL ? "عميل" : "CLIENT"}
                        </button>
                        <button
                            onClick={() => setRole('admin')}
                            className={cn(
                                "relative overflow-visible flex-1 py-3.5 rounded-lg flex items-center justify-center gap-3 transition-all duration-500 text-[10px] font-bold uppercase tracking-[0.15em]",
                                role === 'admin'
                                    ? "bg-accent-red text-white shadow-lg shadow-red-500/20 ring-1 ring-red-500/30 border border-red-500/30 shadow-[0_0_25px_rgba(255,0,0,0.25)]"
                                    : "text-white/30 hover:text-white/50"
                            )}
                        >
                            {role === 'admin' && <span className="pointer-events-none absolute inset-0 -m-px rounded-lg bg-red-500/30 blur-xl opacity-50 -z-10" />}
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {isRTL ? "مدير" : "ADMIN"}
                        </button>
                    </div>

                    {/* ── Form ── */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Alert Messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-4 py-3 bg-accent-red/10 border border-accent-red/20 rounded-xl text-center backdrop-blur-md"
                                >
                                    <span className="text-[10px] font-bold text-accent-red uppercase tracking-widest">{error}</span>
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-center backdrop-blur-md"
                                >
                                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">{successMessage}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Identifier */}
                        <div className="space-y-2">
                            {role === 'buyer' ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMethod('name')}
                                            className={cn("flex-1 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                                                method === 'name' ? "border-blue-500/40 bg-blue-500/10 text-white" : "border-white/10 text-white/40 hover:text-white/70")}
                                        >
                                            <User className="w-3.5 h-3.5" />
                                            {isRTL ? "بالاسم" : "Name"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMethod('phone')}
                                            className={cn("flex-1 px-3 py-2 rounded-lg border text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2",
                                                method === 'phone' ? "border-blue-500/40 bg-blue-500/10 text-white" : "border-white/10 text-white/40 hover:text-white/70")}
                                        >
                                            <Phone className="w-3.5 h-3.5" />
                                            {isRTL ? "بالرقم" : "Phone"}
                                        </button>
                                    </div>
                                    {method === 'name' ? (
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-blue-500/25" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={cn("w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-blue-500/30 ring-1 ring-blue-500/20", isRTL ? "pr-4 pl-4" : "pl-4 pr-4")}
                                                placeholder={isRTL ? "اكتب الاسم الكامل" : "Enter full name"}
                                            />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <div className="relative">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowCountry((v) => !v)}
                                                        className="flex items-center px-3 py-2 rounded-lg border border-blue-500/30 bg-blue-500/10 text-white"
                                                    >
                                                        {selectedCountry.dial}
                                                    </button>
                                                    {showCountry && (
                                                        <div className="absolute top-full left-0 mt-2 w-56 bg-black/80 border border-white/10 rounded-xl z-30 shadow-xl">
                                                            <div className="p-2 border-b border-white/10">
                                                                <input
                                                                    type="text"
                                                                    value={countrySearch}
                                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                                    placeholder={isRTL ? "بحث الدولة" : "Search country"}
                                                                    className="w-full glass-input bg-white/5 border-white/10 focus:border-blue-500/40 focus:bg-white/10 outline-none px-3 py-1.5 rounded-lg text-sm"
                                                                />
                                                            </div>
                                                            <div className="max-h-40 overflow-auto">
                                                                {countryList
                                                                    .filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.dial.includes(countrySearch))
                                                                    .map((c) => (
                                                                        <button
                                                                            key={c.code}
                                                                            type="button"
                                                                            onClick={() => { setSelectedCountry(c); setCountrySearch(''); setShowCountry(false); }}
                                                                            className="w-full text-left px-3 py-2 text-white/80 hover:bg-white/10 flex items-center justify-between"
                                                                        >
                                                                            <span>{c.name}</span>
                                                                            <span className="text-white/50">{c.dial}</span>
                                                                        </button>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="tel"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    required
                                                    placeholder={isRTL ? "رقم الهاتف" : "Phone number"}
                                                    className="flex-1 glass-input bg-white/5 border-blue-500/30 focus:bg-white/10 outline-none px-3 py-2 rounded-lg"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-red-500/25" />
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={cn("w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-red-500/30 ring-1 ring-red-500/20", isRTL ? "pr-4 pl-4" : "pl-4 pr-4")}
                                        placeholder="admin@hmcar.com"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                {isRTL ? "كلمة المرور" : "PASSWORD"}
                            </label>
                            <div className="relative group">
                                <span className={cn("pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10", role === 'buyer' ? "bg-blue-500/25" : "bg-red-500/25")} />
                                <Lock className={cn(
                                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#c9a96e] transition-colors",
                                    isRTL ? "right-4" : "left-4"
                                )} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    minLength={6}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={cn(
                                        "w-full glass-input bg-white/5 focus:bg-white/10 outline-none",
                                        isRTL ? "pr-12 pl-4" : "pl-12 pr-4",
                                        role === 'buyer'
                                            ? "border border-blue-500/30 ring-1 ring-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                                            : "border border-red-500/30 ring-1 ring-red-500/20 shadow-[0_0_20px_rgba(255,0,0,0.2)]"
                                    )}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className={cn("absolute top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors", isRTL ? "left-4" : "right-4")}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {method === 'phone' && otpRequested && (
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                    {isRTL ? "رمز التحقق" : "Verification Code"}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/\s/g, ''))}
                                        placeholder={isRTL ? "أدخل الرمز" : "Enter code"}
                                        className="flex-1 glass-input bg-white/5 border-white/10 focus:bg-white/10 outline-none px-3 py-2 rounded-lg"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const phoneE164 = `${selectedCountry.dial}${phoneNumber.replace(/\D/g, '')}`;
                                            try {
                                                await api.auth.sendOtp({ phone: phoneE164 });
                                                setSuccessMessage(isRTL ? 'تم إرسال الرمز مرة أخرى' : 'Code resent');
                                            } catch {
                                                const mock = String(Math.floor(100000 + Math.random() * 900000));
                                                try {
                                                    localStorage.setItem(`hm_mock_otp_${phoneE164}`, mock);
                                                } catch { }
                                                setSuccessMessage(isRTL ? `رمز تجريبي جديد: ${mock}` : `New mock code: ${mock}`);
                                            }
                                        }}
                                        className="px-4 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white hover:bg-white/10"
                                    >
                                        {isRTL ? "إعادة الإرسال" : "Resend"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Options Row */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                                <div className={cn(
                                    "w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all",
                                    rememberMe
                                        ? (role === 'admin' ? "bg-accent-red border-accent-red" : "bg-[#c9a96e] border-[#c9a96e]")
                                        : "border-white/10 bg-white/5"
                                )}>
                                    {rememberMe && <Sparkles className={cn("w-2.5 h-2.5 text-black")} />}
                                </div>
                                <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em] hover:text-white/50 transition-colors">
                                    {isRTL ? "تذكرني" : "REMEMBER ME"}
                                </span>
                            </div>
                            <Link
                                href="/register"
                                className="text-[9px] font-bold text-[#c9a96e]/70 uppercase tracking-[0.15em] hover:text-[#c9a96e] transition-colors hover:underline underline-offset-4 decoration-[#c9a96e]/30"
                            >
                                {isRTL ? "حساب جديد" : "NEW ACCOUNT"}
                            </Link>
                        </div>

                        {/* Submit Button - Start Engine Style */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full btn-start-engine py-5 rounded-xl group mt-4 flex items-center justify-center gap-3",
                                loading && "opacity-50 pointer-events-none"
                            )}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Power className="w-5 h-5 group-hover:animate-pulse" />
                                    <span className="text-sm font-bold tracking-widest">{isRTL ? "بدء المحرك (دخول)" : "START ENGINE (LOGIN)"}</span>
                                    <ArrowRight className={cn("w-4 h-4 transition-transform opacity-50 group-hover:opacity-100", isRTL ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>

            {/* ── Bottom Branding ── */}
            <div className="fixed bottom-8 text-center opacity-20 hover:opacity-40 transition-opacity duration-500">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                    HM CAR SYSTEMS // v4.0 CINEMATIC
                </span>
            </div>
        </div>
    );
}
