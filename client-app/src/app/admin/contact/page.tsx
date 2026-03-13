'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
    Mail, Search, Trash2, CheckCircle,
    Clock, User, Phone, MessageSquare, X, ArrowLeft, RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from "@/components/AdminPageShell";

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
    const { isRTL, rawText } = useLanguage();
    const { showToast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

    const loadMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.contact.list({ status: filter === 'all' ? '' : filter, search: searchTerm });
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
        loadMessages();
    }, [loadMessages]);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await api.contact.updateStatus(id, status);
            loadMessages();
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
                loadMessages();
            } catch (err) {
                console.error('Failed to delete message', err);
            }
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'new': return 'ck-badge ck-badge-danger';
            case 'read': return 'ck-badge ck-badge-active';
            case 'replied': return 'ck-badge' + ' bg-green-500/15 text-green-400 border-green-500/20';
            default: return 'ck-badge';
        }
    };

    return (
        <>
            <AdminPageShell
                title={isRTL ? 'استشارات ورسائل الموقع' : 'CONSULTATIONS & INQUIRIES'}
                titleEn="WEBSITE COMMS"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                subtitle={isRTL ? 'إدارة الرسائل والطلبات الواردة من نموذج الاتصال في الموقع' : 'Manage messages and requests sent via website contact forms'}
                actions={
                    <button onClick={loadMessages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-orange-500">
                        <RefreshCcw className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/30', isRTL ? 'right-3' : 'left-3')} />
                        <input type="text"
                            placeholder={isRTL ? 'بحث عن طريق الاسم أو البريد...' : 'Search by name or email...'}
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            className={cn('ck-input', isRTL ? 'pr-8 pl-4' : 'pl-8 pr-4')} />
                    </div>
                    <div className="ck-tab-group">
                        {['new', 'read', 'replied', 'all'].map((s) => (
                            <button key={s} onClick={() => setFilter(s)}
                                className={cn('ck-tab', filter === s && 'ck-tab-active')}>
                                {isRTL ? (s === 'new' ? 'جديد' : s === 'read' ? 'مقروء' : s === 'replied' ? 'تم الرد' : 'الكل') : s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Messages List */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/[0.02] animate-pulse border border-orange-500/10" />
                        ))}
                    </div>
                ) : messages.length === 0 ? (
                    <div className="ck-empty py-24">
                        <div className="ck-empty-icon"><Mail className="w-8 h-8" /></div>
                        <p className="cockpit-mono">{isRTL ? 'لا توجد رسائل' : 'NO MESSAGES FOUND'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((item, i) => (
                            <motion.div key={item._id}
                                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { setSelectedMsg(item); if (item.status === 'new') handleUpdateStatus(item._id, 'read'); }}
                                className={cn(
                                    'ck-card p-4 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:bg-white/5',
                                    item.status === 'new' && 'border-orange-500/25'
                                )}>
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0">
                                        <Mail className="w-4 h-4 text-orange-400/60" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold truncate">{item.name}</h3>
                                        <div className="flex items-center gap-3 cockpit-mono text-[9px] text-white/30 mt-0.5">
                                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{item.email}</span>
                                            {item.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{item.phone}</span>}
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(item.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={getStatusBadge(item.status)}>
                                        {isRTL ? (item.status === 'new' ? 'جديد' : item.status === 'read' ? 'مقروء' : 'تم الرد') : item.status.toUpperCase()}
                                    </span>
                                    <span className="cockpit-mono text-[9px] text-white/30 px-2 py-1 bg-white/5 rounded-lg border border-white/5 truncate max-w-[120px]">{item.subject}</span>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }}
                                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AdminPageShell>

            {/* Modal Detail */}
            <AnimatePresence>
                {selectedMsg && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMsg(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-cinematic-dark border border-white/10 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">

                            <button onClick={() => setSelectedMsg(null)}
                                className="absolute top-5 end-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                                    <User className="w-6 h-6 text-orange-400/60" />
                                </div>
                                <div>
                                    <p className="cockpit-mono text-[9px] text-orange-400/70 uppercase mb-0.5">{selectedMsg.subject}</p>
                                    <h2 className="text-xl font-bold uppercase">{selectedMsg.name}</h2>
                                    <p className="cockpit-mono text-[10px] text-white/30">{selectedMsg.email}{selectedMsg.phone && ` · ${selectedMsg.phone}`}</p>
                                </div>
                            </div>

                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl relative overflow-hidden mb-6 min-h-[150px]">
                                <MessageSquare className="absolute -top-3 -end-3 w-20 h-20 text-white/[0.02]" />
                                <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap relative z-10">{selectedMsg.message}</p>
                            </div>

                            <div className="flex flex-wrap gap-3 pt-6 border-t border-orange-500/10 items-center justify-between">
                                <div className="flex gap-3">
                                    <button onClick={() => handleUpdateStatus(selectedMsg._id, 'replied')}
                                        className="px-4 py-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-orange-500 hover:text-white transition-all">
                                        <CheckCircle className="w-4 h-4" />
                                        {isRTL ? 'تحديد كـ "تم الرد"' : 'MARK AS REPLIED'}
                                    </button>
                                    <a href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject}`}
                                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 transition-all">
                                        <Mail className="w-3.5 h-3.5" />
                                        {isRTL ? 'رد عبر البريد' : 'REPLY VIA EMAIL'}
                                    </a>
                                </div>
                                <span className="cockpit-mono text-[9px] text-white/20">
                                    {new Date(selectedMsg.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
