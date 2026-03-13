'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import { 
    MessageCircle, Mail, RefreshCw, 
    Search, CheckCircle, 
    User, X, Send,
    CheckCheck, Circle, ArrowLeft
} from "lucide-react";

import { useSearchParams } from 'next/navigation';
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import AdminPageShell from "@/components/AdminPageShell";

// ── Types ──────────────────────────────────────────────────────
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

interface Conversation {
    userId: string;
    userName: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    isFromMe: boolean;
    createdAt: string;
    read: boolean;
}

// ── Tab Constants ──
const MODE_CHATS = 'chats';
const MODE_INQUIRIES = 'inquiries';

function CommsHubContent() {
    const { isRTL } = useLanguage();
    const searchParams = useSearchParams();
    
    const [activeMode, setActiveMode] = useState(searchParams?.get('mode') === MODE_INQUIRIES ? MODE_INQUIRIES : MODE_CHATS);

    // ── Shared State ──
    const [loading, setLoading] = useState(true);

    // ── Inquiries State ──
    const [inquiries, setInquiries] = useState<ContactMessage[]>([]);
    const [inquiryFilter, setInquiryFilter] = useState('all');
    const [inquirySearch] = useState('');
    const [selectedInquiry, setSelectedInquiry] = useState<ContactMessage | null>(null);

    // ── Chats State ──
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [chatMessages, setChatMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [chatSearch, setChatSearch] = useState('');

    // ── Load Inquiries ──
    const loadInquiries = async () => {
        setLoading(true);
        try {
            const res = await api.contact.list({ status: inquiryFilter === 'all' ? '' : inquiryFilter, search: inquirySearch });
            if (res.success) setInquiries(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // ── Load Conversations ──
    const loadConversations = async () => {
        setLoading(true);
        try {
            const res = await api.messages.conversations();
            if (res.success && Array.isArray(res.data)) {
                setConversations(res.data.map((item: any) => ({
                    userId: item.user?._id || item.id,
                    userName: item.user?.name || 'Unknown',
                    lastMessage: item.lastMessage?.content || '',
                    lastMessageAt: item.lastMessage?.createdAt || new Date().toISOString(),
                    unreadCount: item.unreadCount || 0
                })));
            }
        } catch { console.error('Failed to load conversations'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeMode === MODE_CHATS) loadConversations();
        else loadInquiries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMode, inquiryFilter]);

    // ── Actions: Inquiries ──
    const updateInquiryStatus = async (id: string, status: string) => {
        try {
            await api.contact.updateStatus(id, status);
            loadInquiries();
            if (selectedInquiry?._id === id) setSelectedInquiry({ ...selectedInquiry, status: status as any });
        } catch { }
    };

    // ── Actions: Chat ──
    const loadChatHistory = async (conv: Conversation) => {
        setSelectedConv(conv);
        try {
            const res = await api.messages.conversation(conv.userId);
            if (res.success && Array.isArray(res.data)) setChatMessages(res.data);
            setConversations(prev => prev.map(c => c.userId === conv.userId ? { ...c, unreadCount: 0 } : c));
        } catch { setChatMessages([]); }
    };

    const sendChatMessage = async () => {
        if (!newMessage.trim() || !selectedConv || sending) return;
        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');
        try {
            await api.messages.send(selectedConv.userId, content);
            setChatMessages(prev => [...prev, { id: `t-${Date.now()}`, content, isFromMe: true, createdAt: new Date().toISOString(), read: false }]);
            setConversations(prev => prev.map(c => c.userId === selectedConv.userId ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() } : c));
        } catch { }
        finally { setSending(false); }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const diff = Date.now() - d.getTime();
        if (diff < 60000) return isRTL ? 'الآن' : 'Now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}${isRTL ? 'د' : 'm'}`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}${isRTL ? 'س' : 'h'}`;
        return d.toLocaleDateString();
    };

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <AdminPageShell
                title={isRTL ? 'مركز الواصل والمراسلات' : 'COMMS HUB'}
                titleEn="UNIFIED COMMUNICATIONS"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={() => activeMode === MODE_CHATS ? loadConversations() : loadInquiries()} title={isRTL ? "تحديث" : "Refresh"} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-blue-400">
                        <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >
                {/* ── Comms Mode Select ── */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-8 w-full max-w-md">
                    <button onClick={() => setActiveMode(MODE_CHATS)}
                        className={cn('flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeMode === MODE_CHATS ? 'bg-blue-500 text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <MessageCircle size={16} />
                        {isRTL ? 'المحادثات المباشرة' : 'LIVE CHATS'}
                    </button>
                    <button onClick={() => setActiveMode(MODE_INQUIRIES)}
                        className={cn('flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeMode === MODE_INQUIRIES ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <Mail size={16} />
                        {isRTL ? 'رسائل الموقع' : 'INQUIRIES'}
                    </button>
                </div>

                {activeMode === MODE_CHATS ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
                        {/* Conversations List */}
                        <div className={cn('ck-card flex flex-col overflow-hidden', selectedConv ? 'hidden md:flex' : 'flex')}>
                            <div className="p-4 border-b border-white/5">
                                <div className="relative px-2">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                                    <input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder={isRTL ? 'بحث...' : 'Search...'} className="ck-input pl-10 h-10 bg-black/40 text-xs" />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1 ck-scroll">
                                {conversations.filter(c => c.userName.toLowerCase().includes(chatSearch.toLowerCase())).map(conv => (
                                    <button key={conv.userId} onClick={() => loadChatHistory(conv)} title={isRTL ? "فتح المحادثة" : "Open chat"} className={cn('w-full p-4 rounded-xl text-start transition-all border group', selectedConv?.userId === conv.userId ? 'bg-blue-500/10 border-blue-500/20' : 'bg-transparent border-transparent hover:bg-white/5')}>
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 relative">
                                                <User className="w-5 h-5 text-blue-400/50" />
                                                {conv.unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] font-black flex items-center justify-center">{conv.unreadCount}</span>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-xs font-black uppercase text-white/80">{conv.userName}</span>
                                                    <span className="cockpit-mono text-[8px] text-white/20">{formatTime(conv.lastMessageAt)}</span>
                                                </div>
                                                <p className="text-[10px] text-white/40 truncate">{conv.lastMessage}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className={cn('md:col-span-2 ck-card flex flex-col overflow-hidden', !selectedConv ? 'hidden md:flex items-center justify-center' : 'flex')}>
                            {!selectedConv ? (
                                <div className="text-center space-y-4 opacity-20">
                                    <MessageCircle size={48} className="mx-auto" />
                                    <p className="cockpit-mono text-xs tracking-widest uppercase">{isRTL ? 'اختر محادثة للمتابعة' : 'SELECT COMM STREAM'}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-5 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                                        <button onClick={() => setSelectedConv(null)} title={isRTL ? "رجوع" : "Back"} className="md:hidden w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><ArrowLeft size={16} /></button>
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><User size={20} className="text-blue-400" /></div>
                                        <div>
                                            <p className="text-sm font-black uppercase">{selectedConv.userName}</p>
                                            <div className="flex items-center gap-2"><Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" /><span className="text-[10px] font-bold text-green-500/70 uppercase">Online</span></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-4 ck-scroll">
                                        {chatMessages.map(msg => (
                                            <div key={msg.id} className={cn('flex flex-col', msg.isFromMe ? 'items-end' : 'items-start')}>
                                                <div className={cn('px-5 py-3 rounded-2xl text-[12px] max-w-[80%] leading-relaxed border', msg.isFromMe ? 'bg-blue-500/10 border-blue-500/20 text-white rounded-tr-none' : 'bg-white/5 border-white/10 text-white/80 rounded-tl-none')}>
                                                    {msg.content}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 px-1">
                                                    <span className="cockpit-mono text-[8px] text-white/20">{formatTime(msg.createdAt)}</span>
                                                    {msg.isFromMe && <CheckCheck size={12} className={msg.read ? 'text-blue-400' : 'text-white/20'} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 border-t border-white/5 bg-black/40">
                                        <div className="flex gap-3">
                                            <input value={newMessage} title={isRTL ? "الرسالة" : "Message"} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} placeholder={isRTL ? 'اكتب رسالة...' : 'Type message...'} className="flex-1 ck-input h-12 bg-white/5" />
                                            <button onClick={sendChatMessage} title={isRTL ? "إرسال" : "Send"} disabled={!newMessage.trim() || sending} className="w-12 h-12 rounded-xl bg-blue-500 text-black flex items-center justify-center hover:bg-blue-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"><Send size={18} /></button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-6">
                            {['new', 'read', 'replied', 'all'].map(f => (
                                <button key={f} onClick={() => setInquiryFilter(f)} className={cn('ck-tab', inquiryFilter === f && 'ck-tab-active')}>
                                    {isRTL ? (f === 'new' ? 'جديد' : f === 'read' ? 'مقروء' : f === 'replied' ? 'تم الرد' : 'الكل') : f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {inquiries.map(item => (
                                <motion.div key={item._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('ck-card p-5 cursor-pointer hover:bg-white/5 transition-all group', item.status === 'new' && 'border-orange-500/20')} onClick={() => { setSelectedInquiry(item); if (item.status === 'new') updateInquiryStatus(item._id, 'read'); }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><Mail className="w-5 h-5 text-orange-400/50" /></div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase text-white/80">{item.name}</h3>
                                                <p className="text-[10px] text-white/30 truncate max-w-[200px]">{item.email}</p>
                                            </div>
                                        </div>
                                        <span className={cn('ck-badge text-[9px]', item.status === 'new' ? 'ck-badge-danger' : 'ck-badge-inactive')}>{item.status.toUpperCase()}</span>
                                    </div>
                                    <p className="text-xs font-bold text-orange-400/80 mb-3 truncate">{item.subject}</p>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="cockpit-mono text-[9px] text-white/20 uppercase">{formatPriceDate(item.createdAt)}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button title={isRTL ? "فتح" : "Open"} className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest">{isRTL ? 'فتح' : 'OPEN'}</button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </AdminPageShell>

            {/* Inquiry Detail Modal */}
            <AnimatePresence>
                {selectedInquiry && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedInquiry(null)}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={e => e.stopPropagation()} className="ck-modal max-w-2xl w-full p-8 relative">
                            <button onClick={() => setSelectedInquiry(null)} title={isRTL ? "إغلاق" : "Close"} className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={20} /></button>
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center"><User size={28} className="text-orange-400" /></div>
                                <div>
                                    <p className="cockpit-mono text-[10px] text-orange-400 uppercase tracking-widest mb-1">{selectedInquiry.subject}</p>
                                    <h2 className="text-2xl font-black uppercase">{selectedInquiry.name}</h2>
                                    <div className="flex gap-3 cockpit-mono text-[9px] text-white/30 mt-1"><span>{selectedInquiry.email}</span><span>•</span><span>{selectedInquiry.phone}</span></div>
                                </div>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 min-h-[150px]">
                                <p className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap">{selectedInquiry.message}</p>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-3">
                                    <button onClick={() => updateInquiryStatus(selectedInquiry._id, 'replied')} title={isRTL ? "تم الرد" : "Replied"} className="h-11 px-6 rounded-xl bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-orange-400 transition-all"><CheckCircle size={16} />{isRTL ? 'تحديد كـ "تم الرد"' : 'MARK REPLIED'}</button>
                                    <a href={`mailto:${selectedInquiry.email}`} title={isRTL ? "رد" : "Reply"} className="h-11 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-all"><Mail size={16} />{isRTL ? 'الرد عبر الإيميل' : 'EMAIL REPLY'}</a>
                                </div>
                                <span className="cockpit-mono text-[10px] text-white/20">{new Date(selectedInquiry.createdAt).toLocaleString()}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const formatPriceDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function CommsHub() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <CommsHubContent />
        </Suspense>
    );
}
