'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Bell, AlertCircle, CheckCircle2, Clock, Shield, Search, Filter, Trash2, ChevronLeft, RefreshCcw, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

export default function AdminNotifications() {
    const { t, isRTL, lang } = useLanguage();
    const [filter, setFilter] = useState('ALL');

    const logs = [
        { id: 1, type: 'CRITICAL', title: 'FIREWALL BREACH ATTEMPT', content: 'Suspicious IP 104.28.14.2 detected performing SQL injection on /api/auctions/bid.', time: '2M AGO', status: 'BLOCKED', icon: Shield, color: 'text-cinematic-neon-red', bg: 'bg-cinematic-neon-red/10' },
        { id: 2, type: 'TRANSACTION', title: 'PAYMENT VERIFIED: 1.2M SAR', content: 'Fahad Al-Qahtani successfully cleared payment for Porsche 911 GT3 RS.', time: '15M AGO', status: 'CLEARED', icon: CheckCircle2, color: 'text-cinematic-neon-blue', bg: 'bg-cinematic-neon-blue/10' },
        { id: 3, type: 'SYSTEM', title: 'DATABASE BACKUP COMPLETE', content: 'Nightly incremental backup of RIYADH-DB-01 finished in 4m 12s.', time: '4H AGO', status: 'SUCCESS', icon: Clock, color: 'text-white/40', bg: 'bg-white/5' },
        { id: 4, type: 'WARNING', title: 'LATENCY SPIKE DETECTED', content: 'Response time on API nodes surged by 40% in EMEA regions.', time: '6H AGO', status: 'MONITORING', icon: AlertCircle, color: 'text-cinematic-neon-yellow', bg: 'bg-cinematic-neon-yellow/10' },
    ];

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">

            {/* Background HUD Matrix Style */}
            <div className="fixed inset-0 pointer-events-none opacity-5">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <main className="relative z-10 p-6 md:p-12 lg:p-20">

                {/* Navigation HUD */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Link href="/admin/dashboard" className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                                <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                            </Link>
                            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/30 italic">Admin Root / Mainframe Alerts</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">{isRTL ? "سجلات النظام" : "MAINFRAME LOGS"}</h1>
                    </div>

                    <div className="flex gap-4">
                        <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                            <RefreshCcw className="w-4 h-4 animate-spin-slow" /> REFRESH FEED
                        </button>
                        <button className="flex items-center gap-3 px-8 py-4 bg-cinematic-neon-red/10 border border-cinematic-neon-red/40 text-cinematic-neon-red rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cinematic-neon-red hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" /> CLEAR ALL
                        </button>
                    </div>
                </div>

                {/* Command Terminal Filter */}
                <div className="flex flex-wrap bg-white/5 p-2 rounded-2xl border border-white/5 w-fit mb-12 gap-2 overflow-x-auto max-w-full">
                    {['ALL', 'CRITICAL', 'TRANSACTION', 'SYSTEM', 'WARNING'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={cn(
                                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                filter === t ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* --- LOG FEED --- */}
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {logs.filter(l => filter === 'ALL' || l.type === filter).map((log, i) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-card p-10 bg-white/[0.01] border-white/5 flex flex-col md:flex-row items-center gap-10 group relative transition-all hover:bg-white/[0.03]"
                            >
                                <div className={cn(
                                    "w-20 h-20 rounded-[1.5rem] flex items-center justify-center shrink-0 border transition-all group-hover:scale-110",
                                    log.bg, log.color, "border-white/5"
                                )}>
                                    <log.icon className="w-10 h-10" />
                                </div>

                                <div className="flex-grow space-y-4 text-center md:text-left">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 justify-center md:justify-start">
                                            <span className={cn("text-[11px] font-black px-3 py-1 rounded-lg uppercase tracking-widest bg-white/5", log.color)}>{log.type}</span>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] italic">{log.time}</span>
                                        </div>
                                        <div className="flex items-center gap-3 justify-center md:justify-end">
                                            <Terminal className="w-4 h-4 text-white/10" />
                                            <span className="text-[10px] font-black text-white/40 tracking-[0.2em]">{log.status}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter decoration-white/10 group-hover:decoration-white/40 transition-all underline underline-offset-8">
                                        {log.title}
                                    </h3>
                                    <p className="text-[11px] md:text-sm text-white/40 uppercase tracking-widest leading-relaxed max-w-4xl font-bold italic">
                                        {log.content}
                                    </p>
                                </div>

                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-4 w-full md:w-auto mt-6 md:mt-0 justify-center">
                                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">AUDIT</button>
                                    <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-cinematic-neon-red hover:text-white transition-all">DISMISS</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Matrix HUD Footer */}
                <footer className="mt-20 pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 opacity-30 text-[9px] font-black uppercase tracking-[0.8em]">
                    <div className="flex flex-wrap gap-12 justify-center">
                        <div>Uptime: 2,481.42H</div>
                        <div>Logs Buffer: 512MB</div>
                        <div>Latency: <span className="text-cinematic-neon-blue">0.4ms</span></div>
                    </div>
                    <div className="flex gap-10">
                        <span>Secure Mainframe v4.4</span>
                        <span className="text-cinematic-neon-red italic">Encrypted Connection Only</span>
                    </div>
                </footer>
            </main>

        </div>
    );
}
