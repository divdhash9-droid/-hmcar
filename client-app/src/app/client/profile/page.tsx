'use client';

import { motion } from "framer-motion";
import { User, Mail, Shield, Bell, CreditCard, ChevronLeft, Save, LogOut } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function Profile() {
    const { t, isRTL, toggleLanguage, lang } = useLanguage();

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">

            {/* Background HUD */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-5xl mx-auto">

                {/* Header HUD */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16 border-b border-white/5 pb-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                            </Link>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">User Central / Account Vault</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">{isRTL ? "إعدادات الحساب" : "ACCOUNT VAULT"}</h1>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={toggleLanguage}
                            className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all"
                        >
                            {lang}
                        </button>
                        <button className="px-6 py-2.5 rounded-full bg-cinematic-neon-red/10 border border-cinematic-neon-red/40 text-[10px] font-black uppercase tracking-widest text-cinematic-neon-red hover:bg-cinematic-neon-red hover:text-white transition-all">
                            {t('logout')}
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Sidebar Navigation */}
                    <div className="space-y-4">
                        {[
                            { label: isRTL ? "البيانات الشخصية" : "IDENTITY", icon: User, active: true },
                            { label: isRTL ? "الأمان والخصوصية" : "SECURITY", icon: Shield },
                            { label: isRTL ? "التنبيهات" : "ALERTS", icon: Bell },
                        ].map((item, i) => (
                            <button
                                key={i}
                                className={cn(
                                    "w-full p-6 rounded-2xl border flex items-center gap-5 transition-all group",
                                    item.active ? "bg-white/5 border-cinematic-neon-blue/40 text-white" : "bg-transparent border-white/5 text-white/30 hover:bg-white/[0.02]"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5", item.active ? "text-cinematic-neon-blue" : "text-white/20")} />
                                <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-2 space-y-12">
                        <div className="glass-card p-10 md:p-14 bg-white/[0.01] border-white/5 space-y-10">

                            <div className="flex items-center gap-8 pb-10 border-b border-white/5">
                                <div className="w-24 h-24 rounded-full bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 flex items-center justify-center relative group cursor-pointer">
                                    <User className="w-10 h-10 text-cinematic-neon-blue" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center text-[8px] font-black uppercase tracking-widest">{isRTL ? "تغيير" : "CHANGE"}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-2xl font-black italic uppercase tracking-tighter">عبدالله الشهري</div>
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">USER_ID: #HM-9920-ALX</div>
                                </div>
                            </div>

                            <form className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">{t('fullName')}</label>
                                    <input
                                        type="text"
                                        defaultValue="عبدالله الشهري"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm text-white focus:outline-none focus:border-cinematic-neon-blue transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">{t('email')}</label>
                                    <input
                                        type="email"
                                        defaultValue="abdullah@hmcar.sa"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm text-white/60 focus:outline-none focus:border-cinematic-neon-blue transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">{isRTL ? "رقم الجوال" : "PHONE NUMBER"}</label>
                                    <input
                                        type="text"
                                        defaultValue="+966 50 123 4567"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm text-white focus:outline-none focus:border-cinematic-neon-blue transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] ml-2">{isRTL ? "المنطقة" : "REGION"}</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm text-white/60 focus:outline-none focus:border-cinematic-neon-blue transition-all appearance-none">
                                        <option>Riyadh, KSA</option>
                                        <option>Dubai, UAE</option>
                                        <option>London, UK</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 pt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full py-5 bg-white text-black font-black uppercase text-[10px] tracking-[0.5em] rounded-2xl flex items-center justify-center gap-4 hover:bg-cinematic-neon-blue hover:text-white transition-all shadow-2xl"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isRTL ? "حفظ التغييرات" : "SYNC IDENTITY"}
                                    </motion.button>
                                </div>
                            </form>
                        </div>

                        {/* Security Badge */}
                        <div className="glass-card p-10 bg-gradient-to-r from-cinematic-neon-blue/10 to-transparent border border-cinematic-neon-blue/20 flex items-center gap-10">
                            <Shield className="w-12 h-12 text-cinematic-neon-blue shrink-0 animate-pulse" />
                            <div className="space-y-2">
                                <h3 className="text-base font-black italic uppercase tracking-tighter">{isRTL ? "نظام حماية البيانات النشط" : "ACTIVE VAULT PROTECTION"}</h3>
                                <p className="text-[9px] text-white/30 uppercase leading-relaxed font-bold tracking-[0.2em]">{isRTL ? "يتم تشفير جميع بياناتك الشخصية بواسطة AES-256 ولا يتم مشاركتها مع أطراف خارجية." : "Your data is secured under military AES-256 standards with zero third-party disclosure."}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            {/* --- FOOTER HUD --- */}
            <footer className="max-w-5xl mx-auto px-6 py-20 border-t border-white/5 opacity-20 flex justify-between items-center text-[7px] font-black uppercase tracking-[0.8em]">
                <div>HM VAULT UI v2.4.0</div>
                <div>© 2026 RIYADH HEAD OFFICE</div>
            </footer>
        </div>
    );
}
