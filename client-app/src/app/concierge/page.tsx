'use client';

import { motion } from "framer-motion";
import { useState } from "react";
import { Send, Upload, Car, Settings, CheckCircle, Shield, Briefcase, User, Phone, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";
import ClientPageHeader from "@/components/ClientPageHeader";

export default function ConciergePage() {
    const { t, isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<'car' | 'parts'>('car');
    const [formData, setFormData] = useState({
        name: '', phone: '', details: '', budget: '', brand: '', model: '', year: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = `New Request (${activeTab}):\nName: ${formData.name}\nPhone: ${formData.phone}\nDetails: ${formData.details}\nBudget: ${formData.budget}`;
        window.open(`https://wa.me/966555555555?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className="relative min-h-screen bg-[#020202] text-white selection:bg-luxury-gold selection:text-black perspective-1000 overflow-x-hidden">
            <Navbar />

            {/* Background Atmosphere */}
            <div className="bg-grid-overlay opacity-20 fixed inset-0 z-0" />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[50vh] h-[50vh] bg-luxury-gold/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[60vh] h-[60vh] bg-cinematic-neon-blue/5 blur-[120px] rounded-full animate-pulse delay-1000" />
                <div className="absolute inset-0 scan-lines opacity-10" />
            </div>

            <main className="relative z-10 pt-40 pb-24 px-6 max-w-7xl mx-auto">

                <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
                    <ClientPageHeader
                        title={isRTL ? "الكونسيرج" : "CONCIERGE"}
                        subtitle={isRTL ? "خدمة الطلبات الخاصة" : "ELITE REQUEST SERVICE"}
                        icon={Briefcase}
                    />

                    {/* Trust Indicators */}
                    <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-white/40">
                        <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-luxury-gold" /> Secure System</div>
                        <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Verified Dealers</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Info Panel */}
                    <div className="lg:col-span-5 space-y-12">
                        <div className="relative group perspective-1000">
                            <div className="absolute inset-0 bg-gradient-to-br from-luxury-gold/20 to-transparent blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative p-10 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl transform-style-3d group-hover:rotate-x-2 transition-transform duration-700">
                                <h3 className="text-3xl font-black italic mb-6">Create Your Legacy.</h3>
                                <p className="text-white/60 leading-relaxed mb-8">
                                    {isRTL
                                        ? "سواء كنت تبحث عن سيارة أحلامك النادرة أو قطع غيار حصرية، فريقنا المتخصص سيتولى المهمة بدقة واحترافية."
                                        : "Whether sourcing a rare hypercar or exclusive components, our specialized team executes with precision and discretion."}
                                </p>
                                <div className="space-y-6">
                                    {[
                                        { icon: Car, title: 'Vehicle Sourcing', desc: 'Global network access' },
                                        { icon: Settings, title: 'Parts Acquisition', desc: 'OEM & Aftermarket elite parts' },
                                        { icon: Shield, title: 'Verified Inspection', desc: 'Comprehensive quality checks' }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                                            <div className="w-12 h-12 bg-luxury-gold/10 rounded-xl flex items-center justify-center text-luxury-gold">
                                                <item.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold uppercase tracking-wider">{item.title}</h4>
                                                <p className="text-[10px] text-white/40 uppercase tracking-widest">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Panel */}
                    <div className="lg:col-span-7">
                        <div className="obsidian-card p-10 md:p-14 relative overflow-hidden">
                            {/* Tabs */}
                            <div className="flex mb-12 p-1.5 bg-black/40 rounded-2xl border border-white/5 relative z-10 w-fit mx-auto lg:mx-0">
                                {[
                                    { id: 'car', icon: Car, label: isRTL ? 'طلب سيارة' : 'VEHICLE REQUEST' },
                                    { id: 'parts', icon: Settings, label: isRTL ? 'قطع غيار' : 'PARTS REQUEST' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex items-center gap-3 px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                                            activeTab === tab.id
                                                ? "bg-luxury-gold text-black shadow-[0_0_20px_rgba(197,160,89,0.3)]"
                                                : "text-white/40 hover:text-white"
                                        )}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-luxury-gold transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/10"
                                                placeholder="ENTER NAME"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Phone</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-luxury-gold transition-colors" />
                                            <input
                                                type="tel"
                                                required
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/10"
                                                placeholder="+966 ..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Brand / Make</label>
                                        <input
                                            type="text"
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/10"
                                            placeholder="e.g. MERCEDES"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Model / Year</label>
                                        <input
                                            type="text"
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/10"
                                            placeholder="e.g. S-CLASS 2024"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/40 ml-2">Additional Specifications</label>
                                    <div className="relative group">
                                        <FileText className="absolute left-4 top-6 w-4 h-4 text-white/20 group-hover:text-luxury-gold transition-colors" />
                                        <textarea
                                            rows={4}
                                            onChange={e => setFormData({ ...formData, details: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-white/10 resize-none"
                                            placeholder="Describe specific features, colors, part numbers..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-6 bg-white text-black rounded-xl font-black uppercase tracking-[0.3em] hover:bg-luxury-gold transition-all shadow-lg flex items-center justify-center gap-4 group mt-8"
                                >
                                    <span>{isRTL ? 'إرسال الطلب' : 'INITIATE REQUEST'}</span>
                                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
