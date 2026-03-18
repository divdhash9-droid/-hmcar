'use client';

/**
 * صفحة تسجيل الدخول (Login Page)
 * تتيح للمستخدمين (سواء عملاء أو مدراء) الدخول إلى النظام.
 * تدعم تسجيل الدخول بالاسم أو برقم الهاتف مع التحقق عبر رمز OTP.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { User, ShieldCheck, Lock, ArrowRight, ChevronLeft, ChevronRight, Key, UserCheck, Sparkles, Power, Eye, EyeOff, Phone, AlertOctagon, Copy, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { countryDialCodes } from "@/lib/countries";
import { useSocket } from "@/lib/SocketContext";
import { useAuth } from "@/lib/AuthContext";
import CinematicVideoBackground from "@/components/CinematicVideoBackground";

export default function Login() {
    const { isRTL } = useLanguage();
    
    // --- حالات الواجهة (States) ---
    const [role, setRole] = useState<'buyer' | 'admin'>('buyer'); // دور المستخدم الحالي
    const [formData, setFormData] = useState({ email: '', password: '' }); // بيانات النموذج الأساسية
    const [loading, setLoading] = useState(false); // حالة التحميل أثناء الإرسال
    const [error, setError] = useState(''); // رسائل الخطأ
    const [rememberMe, setRememberMe] = useState(false); // خيار "تذكرني"
    const [successMessage, setSuccessMessage] = useState(''); // رسائل النجاح
    const [showPassword, setShowPassword] = useState(false); // إظهار أو إخفاء كلمة المرور
    const [method, setMethod] = useState<'name' | 'phone'>('name'); // طريقة الدخول: بالاسم أو الهاتف
    const [banInfo, setBanInfo] = useState<{ banned: boolean, banCode: string, message: string } | null>(null); // معلومات الحظر في حال تم حظر الجهاز
    
    // --- معالجة الدول والأرقام ---
    const countryList = countryDialCodes.map(c => ({ 
        code: c.code, 
        dial: c.dial, 
        name: isRTL ? (c.nameAr || c.nameEn) : c.nameEn 
    }));
    const [countrySearch, setCountrySearch] = useState(''); // البحث عن دولة
    const [selectedCountry, setSelectedCountry] = useState(countryList[0]); // الدولة المختارة للرمز الدولي
    const [phoneNumber, setPhoneNumber] = useState(''); // رقم الهاتف المدخل
    const [showCountry, setShowCountry] = useState(false); // إظهار قائمة الدول
    
    // --- التحقق عبر OTP ---
    const [otpRequested, setOtpRequested] = useState(false); // هل تم طلب رمز التحقق؟
    const [otpCode, setOtpCode] = useState(''); // الرمز المدخل من المستخدم
    const [showRoleSwitcher, setShowRoleSwitcher] = useState(false); // إظهار محول الأدوار (عميل/مدير)

    const { socket, isConnected } = useSocket();
    const { user } = useAuth();
    const DEV_FAKE = process.env.NEXT_PUBLIC_ENABLE_DEV_ADMIN === '1';

    // عند تحميل الصفحة للمرة الأولى
    useEffect(() => {
        try {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

            const path = typeof window !== 'undefined' ? window.location.pathname : '';
            const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
            
            // التمييز بين الويب والتطبيق
            if (!isStandalone) {
                // على الموقع، نظهر محول الأدوار دائماً
                setShowRoleSwitcher(true);
                if (path.includes('/admin/login') || sp?.get('role') === 'admin') {
                    setRole('admin');
                }
            } else {
                // على التطبيق، نبدأ كعميل فوراً ونخفي المحول
                setRole('buyer');
                setShowRoleSwitcher(false);
            }
        } catch { }
    }, []);

    // تتبع دخول العميل لصفحة تسجيل الدخول وإبلاغ الأدمن
    useEffect(() => {
        if (socket && isConnected) {
            socket.emit('user_navigation', {
                userName: user?.name || (isRTL ? 'زائر' : 'Guest'),
                page: isRTL ? 'صفحة تسجيل الدخول' : 'Login Page',
                timestamp: new Date()
            });
        }
    }, [socket, isConnected, isRTL, user]);

    /**
     * معالجة عملية تسجيل الدخول عند الضغط على الزر
     */
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            let response;
            const deviceId = typeof window !== 'undefined' ? localStorage.getItem('hm_device_id') || '' : '';

            const identifier = formData.email.trim();
            
            // --- أولاً: معالجة دخول المدير ---
            if (role === 'admin') {
                response = await api.auth.login({
                    identifier: identifier,
                    password: formData.password,
                    role,
                    rememberMe,
                    deviceId
                });
            } else {
                // --- ثانياً: معالجة دخول العميل ---

                // التحقق من صحة الاسم إذا كانت الطريقة بالاسم
                if (method === 'name') {
                    const parts = identifier.split(/\s+/).filter(Boolean);
                    if (parts.length < 2) {
                        throw new Error('الاسم يجب أن يكون على الأقل اسمين');
                    }
                } else {
                    // التحقق من صحة رقم الهاتف
                    const digits = phoneNumber.replace(/\D/g, '');
                    if (digits.length < 8 || digits.length > 15) {
                        throw new Error('رقم الهاتف غير صالح');
                    }
                }
                
                // التحقق من طول كلمة المرور
                if (formData.password.length < 6) {
                    throw new Error('كلمة المرور يجب أن تكون 6 خانات على الأقل');
                }

                const phoneE164 = `${selectedCountry.dial}${phoneNumber.replace(/\D/g, '')}`;

                // معالجة طلب رمز OTP إذا لم يطلب بعد (في حال الدخول بالهاتف)
                if (method === 'phone' && !otpRequested) {
                    try {
                        await api.auth.sendOtp({ phone: phoneE164 });
                        setSuccessMessage(isRTL ? 'تهانينا، تم إرسال رمز التحقق إلى هاتفك' : 'Verification code sent to your phone');
                        setOtpRequested(true);
                        setLoading(false);
                        return;
                    } catch (err: any) {
                        setError(err.message || (isRTL ? 'فشل إرسال رمز التحقق' : 'Failed to send OTP'));
                        setLoading(false);
                        return;
                    }
                }

                // التحقق من رمز OTP إذا كان مطلوباً
                if (method === 'phone' && otpRequested) {
                    if (!otpCode || otpCode.replace(/\D/g, '').length < 4) {
                        throw new Error(isRTL ? 'أدخل رمز التحقق الصحيح' : 'Enter valid verification code');
                    }
                    try {
                        await api.auth.verifyOtp({ phone: phoneE164, code: otpCode });
                    } catch (err: any) {
                        throw new Error(err.message || (isRTL ? 'رمز التحقق غير صحيح، أو انتهت صلاحيته' : 'Invalid or expired verification code'));
                    }
                }

                // تنفيذ تسجيل الدخول التلقائي أو العادي للعميل
                response = await api.auth.autoLogin({
                    name: method === 'name' ? identifier : phoneE164,
                    password: formData.password,
                    deviceId
                });
            }

            if (response.success) {
                // حفظ التوكن وبيانات المستخدم في التخزين المحلي (LocalStorage)
                localStorage.setItem('hm_token', response.token);
                localStorage.setItem('hm_user', JSON.stringify(response.user));
                const savedRole = response.user?.role || 'buyer';
                localStorage.setItem('hm_user_role', savedRole);

                // حفظ في Cookie للـ middleware - لضمان حماية المسارات من جهة الخادم (Server-side)
                const maxAge = rememberMe ? 604800 : 86400; // أسبوع في حال تذكرني، أو يوم واحد
                document.cookie = `hm_token=${response.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
                document.cookie = `hm_user_role=${savedRole}; path=/; max-age=${maxAge}; SameSite=Lax`;

                if (response.isNewUser) {
                    setSuccessMessage(isRTL ? 'تم إنشاء حسابك بنجاح! جاري الدخول...' : 'Account created! Logging in...');
                } else {
                    setSuccessMessage(isRTL ? 'تم تسجيل الدخول بنجاح ✓' : 'Login successful ✓');
                }

                // التوجيه التلقائي بناءً على دور المستخدم أو المعلمة 'redirect'
                setTimeout(() => {
                    const userRole = response.user.role || 'buyer';
                    const params = new URLSearchParams(window.location.search);
                    const redirectTo = params.get('redirect');
                    if (redirectTo && redirectTo.startsWith('/')) {
                        window.location.href = redirectTo;
                    } else if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
                        window.location.href = "/admin/dashboard";
                    } else {
                        window.location.href = "/client/dashboard";
                    }
                }, 800);

            } else {
                setError(response.error || (isRTL ? 'فشل تسجيل الدخول' : 'Login failed'));
                setLoading(false);
            }
        } catch (err: any) {
            if (err.banned) {
                setBanInfo({ banned: true, banCode: err.banCode, message: err.message || (isRTL ? 'تم حظر جهازك' : 'Your device is banned') });
                setLoading(false);
                return;
            }

            const errMsg = err.message || '';
            const identifier = formData.email.trim();
            // All other login failures show the error - no local bypass allowed
            setError(errMsg || (isRTL ? 'فشل تسجيل الدخول. تحقق من البيانات أو تواصل مع الدعم.' : 'Login failed. Check your credentials or contact support.'));
            setLoading(false);
        }
    };

    useEffect(() => {
        try {
            const saved = localStorage.getItem('hm_remember');
            if (saved) {
                const data = JSON.parse(saved);
                if (data && typeof data.identifier === 'string' && typeof data.password === 'string') {
                    // لأسباب أمنية: لا نقوم بتعبئة معرف الأدمن تلقائياً حتى لا يراه أي شخص يقف بجانب الشاشة
                    const isSystemAccount = data.role === 'admin' || data.identifier.toLowerCase().includes('admin');
                    setFormData({
                        email: isSystemAccount ? '' : data.identifier,
                        password: data.password
                    });
                    setRememberMe(true);
                    if (data.role) setRole(data.role);
                }
            }
        } catch { }
    }, []);

    // تم حذف التعبئة التلقائية لبيانات الأدمن لأسباب أمنية

    return (
        <div className={`relative min-h-screen bg-black text-white flex items-center justify-center p-6 overflow-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* الخلفية السينمائية - Cinematic Background */}
            <CinematicVideoBackground
                videoSrc="/videos/video.mp4"
                fallbackImage="/images/photo_2026-02-07_22-24-18.jpg"
                mobileImage="/images/hmcar.jpg"
                overlayOpacity={0.55}
            />

            {/* الكرات الضوئية الخلفية - AMBIENT ORBS */}
            <div className="fixed inset-0 pointer-events-none z-[1]">
                <div className="orb orb-gold w-[600px] h-[600px] top-[-200px] right-[-200px] animate-breathe blur-[100px] opacity-30" />
                <div className="orb orb-blue w-[400px] h-[400px] bottom-[-100px] left-[-100px] animate-breathe delay-1000 blur-[100px] opacity-20" />
            </div>



            {/* بطاقة تسجيل الدخول أو بطاقة الحظر - LOGIN CARD OR BAN CARD */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md px-2"
            >
                {banInfo ? (
                    <div className="relative glass-card p-6 sm:p-10 md:p-12 rounded-3xl border border-red-500/20 bg-red-950/20 backdrop-blur-3xl shadow-2xl overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_20px_rgba(239,68,68,0.5)]"></div>
                        <div className="text-center space-y-6">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="mx-auto w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20"
                            >
                                <AlertOctagon className="w-10 h-10 text-red-500" />
                            </motion.div>
                            <div>
                                <h2 className="text-3xl font-black text-white">{isRTL ? "تم حظر الجهاز" : "DEVICE BANNED"}</h2>
                                <p className="text-white/60 mt-2 text-sm max-w-xs mx-auto text-balance font-medium leading-relaxed">{banInfo.message}</p>
                            </div>

                            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3">
                                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{isRTL ? "رمز الحظر" : "BAN CODE"}</span>
                                <div className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10 group hover:border-red-500/30 transition-all">
                                    <span className="font-mono text-xl tracking-[0.2em] font-bold text-red-400">{banInfo.banCode}</span>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(banInfo.banCode);
                                            setSuccessMessage(isRTL ? 'تم النسخ!' : 'Copied!');
                                            setTimeout(() => setSuccessMessage(''), 2000);
                                        }}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                        title={isRTL ? "نسخ الرمز" : "Copy Code"}
                                    >
                                        <Copy className="w-5 h-5" />
                                    </button>
                                </div>
                                {successMessage && <div className="text-green-400 text-xs text-center font-bold mt-2">{successMessage}</div>}
                            </div>

                            <a
                                href={`https://wa.me/967781007805?text=${encodeURIComponent(isRTL ? `مرحباً، تم حظر جهازي وهذا هو رمز الحظر:\n*${banInfo.banCode}*` : `Hello, my device is banned. Ban code:\n*${banInfo.banCode}*`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 rounded-xl font-bold bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366] hover:text-black transition-all duration-300"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? "التواصل لفك الحظر" : "CONTACT SUPPORT"}
                            </a>

                            <button
                                onClick={() => { setBanInfo(null); setFormData({ email: '', password: '' }); setError(''); }}
                                className="w-full py-3 text-xs font-bold text-white/30 hover:text-white/70 tracking-wider uppercase transition-colors"
                            >
                                {isRTL ? "العودة لتسجيل الدخول" : "BACK TO LOGIN"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative glass-card p-6 sm:p-10 md:p-12 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-2xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} z-20`}
                        >
                            <Link href="/">
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    title={isRTL ? 'الرئيسية' : 'Home'}
                                    className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center text-white/40 hover:text-accent-gold hover:border-accent-gold/40 hover:bg-accent-gold/10 transition-all duration-300 shadow-lg"
                                >
                                    {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                                </motion.div>
                            </Link>
                        </motion.div>

                        {/* الهيدر والعنوان - Header */}
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
                                        ? (isRTL ? "دخول النظام" : "SYSTEM ACCESS")
                                        : (isRTL ? "من دخول العميل" : "CLIENT ACCESS")
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

                        {/* محول الأدوار - Role Switcher */}
                        {showRoleSwitcher && (
                            <div className="flex bg-black/20 p-1 rounded-xl border border-white/5 mb-8 backdrop-blur-md">
                                <button
                                    onClick={() => setRole('buyer')}
                                    className={cn(
                                        "relative overflow-hidden flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]",
                                        role === 'buyer'
                                            ? "bg-white text-black shadow-lg shadow-white/10"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <UserCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    {isRTL ? "عميل" : "CLIENT"}
                                </button>
                                <button
                                    onClick={() => {
                                        setRole('admin');
                                        if (formData.email.toLowerCase().includes('admin')) {
                                            setFormData(prev => ({ ...prev, email: '' }));
                                        }
                                    }}
                                    className={cn(
                                        "relative overflow-hidden flex-1 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]",
                                        role === 'admin'
                                            ? "bg-accent-red text-white shadow-lg shadow-red-500/20"
                                            : "text-white/30 hover:text-white/50"
                                    )}
                                >
                                    <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                                    {isRTL ? "مدير" : "ADMIN"}
                                </button>
                            </div>
                        )}

                        {/* نموذج البيانات - Form */}
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
                                            <div className="relative group">
                                                <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-blue-500/25" />
                                                <User className={cn(
                                                    "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-blue-400 transition-colors",
                                                    isRTL ? "right-4" : "left-4"
                                                )} />
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    className={cn(
                                                        "w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-blue-500/30 ring-1 ring-blue-500/20",
                                                        isRTL ? "pr-12 pl-4" : "pl-12 pr-4"
                                                    )}
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
                                                            <div className={cn("absolute top-full mt-2 w-64 bg-[#0a0a0a]/95 border border-white/10 rounded-xl z-50 shadow-2xl backdrop-blur-2xl", isRTL ? "right-0" : "left-0")}>
                                                                <div className="p-2 border-b border-white/10">
                                                                    <input
                                                                        type="text"
                                                                        value={countrySearch}
                                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                                        placeholder={isRTL ? "بحث الدولة..." : "Search country..."}
                                                                        className={cn("w-full bg-white/5 border border-white/10 focus:border-blue-500/40 focus:bg-white/10 outline-none px-3 py-2 rounded-lg text-xs text-white", isRTL ? "text-right" : "text-left")}
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
                                                                                className={cn("w-full px-4 py-3 text-white/80 hover:bg-white/10 flex items-center justify-between transition-colors border-b border-white/[0.03] last:border-0", isRTL ? "flex-row-reverse" : "flex-row")}
                                                                            >
                                                                                <span className="text-[11px] font-medium">{c.name}</span>
                                                                                <span className="text-[11px] font-bold text-blue-400">{c.dial}</span>
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
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] block px-1">
                                            {isRTL ? "اسم المستخدم / المعرّف" : "USERNAME / ACCESS ID"}
                                        </label>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-0 -m-px rounded-xl blur-xl opacity-50 -z-10 bg-red-500/25" />
                                            <input
                                                type="text"
                                                required
                                                value={formData.email}
                                                autoCapitalize="none"
                                                autoCorrect="off"
                                                spellCheck="false"
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className={cn("w-full glass-input bg-white/5 focus:bg-white/10 outline-none border border-red-500/30 ring-1 ring-red-500/20", isRTL ? "pr-4 pl-4" : "pl-4 pr-4")}
                                                placeholder={isRTL ? "ايميل   (ACCESS ID)" : "SECRET ACCESS ID"}
                                            />
                                        </div>
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
                                        autoCapitalize="none"
                                        autoCorrect="off"
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
                                                } catch (err: any) {
                                                    setSuccessMessage(isRTL ? 'فشل إرسال الرمز مرة أخرى' : 'Failed to resend code');
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
                )}
            </motion.div>

            {/* ── Bottom Branding ── */}
            <div className="fixed bottom-8 text-center opacity-20 hover:opacity-40 transition-opacity duration-500">
                <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white">
                    HM CAR // PREMIER EXPERIENCE
                </span>
            </div>
        </div >
    );
}
