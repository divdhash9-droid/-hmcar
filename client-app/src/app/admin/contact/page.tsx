'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Mail,
    Search,
    ChevronLeft,
    Trash2,
    CheckCircle,
    Clock,
    User,
    Phone,
    MessageSquare,
    X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

interface ContactMessage {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'new' | 'read' | 'replied' | 'closed';
    createdAt: string;
}

export default function AdminContactPage() {
    const { isRTL } = useLanguage();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.contact.list({ status: filter, search: searchTerm });
            if (res.success) {
                setMessages(res.data);
            }
        } catch (err) {
            console.error("Failed to load contact messages", err);
        } finally {
            setLoading(false);
        }
    }, [filter, searchTerm]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Use useCallback if needed, but for now just move it or wrap it
    // Actually, making it a stable dependency:
    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.contact.updateStatus(id, status);
            loadData();
            if (selectedMsg?._id === id) {
                setSelectedMsg({ ...selectedMsg, status: status as any });
            }
        } catch (err) {
            console.error('Failed to update status', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه الرسالة؟' : 'Are you sure you want to delete this message?')) {
            try {
                await api.contact.delete(id);
                if (selectedMsg?._id === id) setSelectedMsg(null);
                loadData();
            } catch (err) {
                console.error('Failed to delete message', err);
            }
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new': return 'bg-cinematic-neon-red text-white shadow-[0_0_10px_rgba(255,0,60,0.5)]';
            case 'read': return 'bg-cinematic-neon-blue text-white shadow-[0_0_10px_rgba(0,240,255,0.5)]';
            case 'replied': return 'bg-green-400 text-black font-bold';
            default: return 'bg-white/10 text-white/40';
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">

                <header className="mb-16">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group w-fit">
                        <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Website Inquiries</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] mb-6">
                        {isRTL ? 'رسائل' : 'CONTACT'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'الموقع' : 'INQUIRIES'}</span>
                    </h1>
                </header>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-8 mb-16">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                        <input
                            type="text"
                            placeholder={isRTL ? 'بحث عن طريق الاسم أو البريد...' : 'SEARCH BY NAME OR EMAIL...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-base font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        {['new', 'read', 'replied', 'all'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s)}
                                className={cn(
                                    "px-8 py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.3em] transition-colors select-none",
                                    filter === s
                                        ? "bg-cinematic-neon-blue text-white shadow-[0_0_35px_rgba(0,240,255,0.45)] ring-2 ring-cinematic-neon-blue"
                                        : "bg-white/[0.14] text-white hover:bg-white/[0.18] ring-1 ring-white/10"
                                )}
                            >
                                {isRTL ? (s === 'new' ? 'جديد' : s === 'read' ? 'مقروء' : s === 'replied' ? 'تم الرد' : 'الكل') : s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages List Table-like Desktop, Card-like Mobile */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="text-white text-2xl font-black uppercase tracking-widest animate-pulse">Establishing Connection...</div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-32 bg-white/[0.02] rounded-3xl border border-white/5">
                        <Mail className="w-16 h-16 text-white/10 mx-auto mb-6" />
                        <p className="text-white/40 uppercase tracking-widest font-black">{isRTL ? 'لا توجد رسائل' : 'NO MESSAGES FOUND'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((item, i) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => {
                                    setSelectedMsg(item);
                                    if (item.status === 'new') handleUpdateStatus(item._id, 'read');
                                }}
                                className={cn(
                                    "p-6 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
                                    item.status === 'new' ? "bg-white/[0.05] border-cinematic-neon-blue/40" : "bg-white/[0.01] border-white/5 hover:bg-white/[0.03]"
                                )}
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", getStatusColor(item.status))}>
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-lg font-black uppercase italic tracking-tighter truncate">{item.name}</h3>
                                        <div className="flex items-center gap-4 text-[10px] text-white/30 uppercase font-black mt-1">
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.email}</span>
                                            {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {item.phone}</span>}
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white/5 rounded-lg border border-white/10 whitespace-nowrap">
                                        {item.subject}
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                        className="p-3 bg-cinematic-neon-red/10 text-cinematic-neon-red border border-cinematic-neon-red/30 rounded-xl hover:bg-cinematic-neon-red hover:text-white transition-all shadow-[0_0_15px_rgba(255,0,60,0.2)]"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </main>

            {/* Modal Detail */}
            <AnimatePresence>
                {selectedMsg && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
                        onClick={() => setSelectedMsg(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card bg-black/60 border-white/10 p-10 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
                        >
                            <button onClick={() => setSelectedMsg(null)} className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-6 mb-10">
                                <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", getStatusColor(selectedMsg.status))}>
                                    <User className="w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-cinematic-neon-blue uppercase tracking-[0.4em] mb-2">{selectedMsg.subject}</div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{selectedMsg.name}</h2>
                                    <p className="text-white/40 text-xs font-bold mt-1">{selectedMsg.email} {selectedMsg.phone && `| ${selectedMsg.phone}`}</p>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="p-8 bg-white/[0.03] border border-white/5 rounded-[2rem] relative overflow-hidden">
                                    <MessageSquare className="absolute -top-4 -right-4 w-24 h-24 text-white/[0.02]" />
                                    <p className="text-lg leading-relaxed text-white/80 relative z-10 whitespace-pre-wrap">
                                        {selectedMsg.message}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => handleUpdateStatus(selectedMsg._id, 'replied')}
                                            className="px-8 py-4 bg-green-400 !text-black rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            {isRTL ? 'تحديد كتم الرد' : 'MARK AS REPLIED'}
                                        </button>
                                        <a
                                            href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:bg-white/10 transition-all"
                                        >
                                            <Mail className="w-5 h-5" />
                                            {isRTL ? 'رد عبر البريد' : 'REPLY VIA EMAIL'}
                                        </a>
                                    </div>
                                    <div className="text-[10px] text-white/20 uppercase font-black">
                                        {new Date(selectedMsg.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .glass-card {
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                }
            `}</style>
        </div>
    );
}
