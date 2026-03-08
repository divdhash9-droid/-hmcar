'use client';

import { motion } from "framer-motion";
import { User, Mail, Shield, Save, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";

export default function Profile() {
    const { isRTL } = useLanguage();
    const { user } = useAuth();

    const userName = user?.name || (isRTL ? 'العميل' : 'Guest');
    const userEmail = user?.email || '';

    return (
        <div className={cn("min-h-full", isRTL && "rtl")}>
            <div className="px-5 lg:px-8 pt-6 lg:pt-8 pb-8 max-w-2xl mx-auto lg:mx-0">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-7">
                    <p className="text-[11px] text-white/25 font-bold uppercase tracking-[0.3em] mb-1">
                        {isRTL ? 'بيانات الحساب' : 'Account Details'}
                    </p>
                    <h1 className="text-2xl lg:text-3xl font-bold text-white">
                        {isRTL ? 'الملف الشخصي' : 'Profile'}
                    </h1>
                </motion.div>

                {/* Avatar */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="mb-6"
                >
                    <div className={cn("flex items-center gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]", isRTL && "flex-row-reverse")}>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9a96e]/30 to-[#c9a96e]/10 flex items-center justify-center text-[#c9a96e] font-black text-2xl shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                            <div className="text-[17px] font-bold text-white">{userName}</div>
                            <div className="text-[12px] text-[#c9a96e]/60 font-semibold mt-0.5">
                                {isRTL ? 'عضو نشط' : 'Active Member'}
                            </div>
                            {userEmail && (
                                <div className="text-[12px] text-white/35 mt-1">{userEmail}</div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="rounded-2xl border border-white/[0.06] overflow-hidden mb-4">
                        <div className={cn('flex items-center gap-3 px-5 py-4 bg-white/[0.02] border-b border-white/[0.05]', isRTL && 'flex-row-reverse')}>
                            <User className="w-4 h-4 text-[#c9a96e]/70" strokeWidth={1.8} />
                            <span className="text-[12px] font-bold text-white/50 uppercase tracking-[0.25em]">
                                {isRTL ? 'البيانات الشخصية' : 'Personal Info'}
                            </span>
                        </div>
                        <form className="p-5 space-y-4">
                            {/* الاسم */}
                            <div>
                                <label className="block text-[11px] font-semibold text-white/40 mb-2">
                                    {isRTL ? 'الاسم الكامل' : 'Full Name'}
                                </label>
                                <div className="relative">
                                    <User
                                        className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-3.5" : "left-3.5")}
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="text"
                                        defaultValue={userName}
                                        className={cn(
                                            "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 text-[14px] text-white focus:outline-none focus:border-[#c9a96e]/40 transition-all placeholder:text-white/20",
                                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* البريد */}
                            <div>
                                <label className="block text-[11px] font-semibold text-white/40 mb-2">
                                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                                </label>
                                <div className="relative">
                                    <Mail
                                        className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-3.5" : "left-3.5")}
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="email"
                                        defaultValue={userEmail}
                                        className={cn(
                                            "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 text-[14px] text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-all placeholder:text-white/20",
                                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* الجوال */}
                            <div>
                                <label className="block text-[11px] font-semibold text-white/40 mb-2">
                                    {isRTL ? 'رقم الجوال' : 'Phone Number'}
                                </label>
                                <div className="relative">
                                    <Phone
                                        className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-3.5" : "left-3.5")}
                                        strokeWidth={1.5}
                                    />
                                    <input
                                        type="tel"
                                        placeholder="+966 5X XXX XXXX"
                                        className={cn(
                                            "w-full bg-white/[0.03] border border-white/[0.08] rounded-xl py-3.5 text-[14px] text-white focus:outline-none focus:border-[#c9a96e]/40 transition-all placeholder:text-white/20",
                                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                        )}
                                    />
                                </div>
                            </div>

                            {/* المنطقة */}
                            <div>
                                <label className="block text-[11px] font-semibold text-white/40 mb-2">
                                    {isRTL ? 'المنطقة' : 'Region'}
                                </label>
                                <div className="relative">
                                    <MapPin
                                        className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-3.5" : "left-3.5")}
                                        strokeWidth={1.5}
                                    />
                                    <select
                                        aria-label={isRTL ? 'المنطقة' : 'Region'}
                                        className={cn(
                                            "w-full bg-[#0c0c0f] border border-white/[0.08] rounded-xl py-3.5 text-[14px] text-white/60 focus:outline-none focus:border-[#c9a96e]/40 transition-all appearance-none",
                                            isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                                        )}
                                    >
                                        <option>Riyadh, KSA</option>
                                        <option>Jeddah, KSA</option>
                                        <option>Dubai, UAE</option>
                                        <option>London, UK</option>
                                    </select>
                                </div>
                            </div>

                            {/* زر الحفظ */}
                            <button
                                type="submit"
                                className="w-full py-4 rounded-2xl bg-[#c9a96e] text-black font-bold text-[14px] transition-all hover:bg-[#d4b57a] active:scale-[0.98] flex items-center justify-center gap-2.5"
                            >
                                <Save className="w-4 h-4" strokeWidth={2} />
                                {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Security Badge */}
                    <div className={cn(
                        "flex items-center gap-3.5 p-4 rounded-2xl bg-[#c9a96e]/[0.05] border border-[#c9a96e]/15",
                        isRTL && "flex-row-reverse"
                    )}>
                        <Shield className="w-5 h-5 text-[#c9a96e]/60 shrink-0" strokeWidth={1.8} />
                        <div className={isRTL ? "text-right" : ""}>
                            <div className="text-[12px] font-bold text-white/60">
                                {isRTL ? 'بياناتك محمية' : 'Your data is protected'}
                            </div>
                            <div className="text-[11px] text-white/30 mt-0.5">
                                {isRTL ? 'تشفير AES-256 - لا مشاركة مع أطراف خارجية' : 'AES-256 encryption · No third-party sharing'}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
