'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Send, Search, ChevronLeft,
    User, CheckCheck, Circle, RefreshCcw, X
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface Conversation {
    userId: string;
    userName: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    avatar?: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    senderName: string;
    createdAt: string;
    isRead: boolean;
}

export default function AdminMessagesPage() {
    const { isRTL } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [adminId, setAdminId] = useState<string>('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const user = JSON.parse(localStorage.getItem('hm_user') || '{}');
                setAdminId(user.id || user._id || '');
            } catch { }
        }
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadConversations = async () => {
        try {
            setLoading(true);
            const data = await api.messages.conversations();
            if (data.success && Array.isArray(data.conversations)) {
                setConversations(data.conversations);
            } else {
                // Fallback mock if API not ready
                setConversations([
                    { userId: 'u1', userName: 'Ahmed Al-Rashid', lastMessage: 'I need info about the BMW M5', lastMessageAt: new Date().toISOString(), unreadCount: 3 },
                    { userId: 'u2', userName: 'Mohammed Al-Saud', lastMessage: 'Is the Porsche still available?', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), unreadCount: 1 },
                    { userId: 'u3', userName: 'Khalid Al-Otaibi', lastMessage: 'Thank you for the quick response!', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0 },
                ]);
            }
        } catch {
            setConversations([
                { userId: 'u1', userName: 'Ahmed Al-Rashid', lastMessage: 'I need info about the BMW M5', lastMessageAt: new Date().toISOString(), unreadCount: 3 },
                { userId: 'u2', userName: 'Mohammed Al-Saud', lastMessage: 'Is the Porsche still available?', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), unreadCount: 1 },
                { userId: 'u3', userName: 'Khalid Al-Otaibi', lastMessage: 'Thank you for the quick response!', lastMessageAt: new Date(Date.now() - 86400000).toISOString(), unreadCount: 0 },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conv: Conversation) => {
        setSelectedConv(conv);
        try {
            const data = await api.messages.conversation(conv.userId);
            if (data.success && Array.isArray(data.messages)) {
                setMessages(data.messages);
            } else {
                setMessages([
                    { id: 'm1', content: 'Hello, I am interested in the BMW M5', senderId: conv.userId, senderName: conv.userName, createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
                    { id: 'm2', content: 'Of course! Which year and spec are you looking for?', senderId: 'admin', senderName: 'Admin', createdAt: new Date(Date.now() - 3500000).toISOString(), isRead: true },
                    { id: 'm3', content: 'I prefer 2023 Competition Package in black', senderId: conv.userId, senderName: conv.userName, createdAt: new Date(Date.now() - 600000).toISOString(), isRead: false },
                ]);
            }
            // Mark as read
            setConversations(prev => prev.map(c =>
                c.userId === conv.userId ? { ...c, unreadCount: 0 } : c
            ));
        } catch {
            setMessages([]);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConv || sending) return;
        setSending(true);
        const content = newMessage.trim();
        setNewMessage('');
        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            content,
            senderId: adminId || 'admin',
            senderName: 'Admin',
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setMessages(prev => [...prev, tempMsg]);
        try {
            await api.messages.send(selectedConv.userId, content);
            setConversations(prev => prev.map(c =>
                c.userId === selectedConv.userId
                    ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
                    : c
            ));
        } catch {
            // Message was already shown optimistically
        } finally {
            setSending(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return isRTL ? 'الآن' : 'Now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}${isRTL ? ' د' : 'm'}`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}${isRTL ? ' س' : 'h'}`;
        return d.toLocaleDateString();
    };

    const filtered = conversations.filter(c =>
        c.userName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cinematic-neon-blue/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cinematic-neon-red/5 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 pt-28 pb-10 px-4 md:px-6 max-w-7xl mx-auto h-screen">
                {/* Back + Header */}
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group mb-4">
                        <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="h-[2px] w-8 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                            {isRTL ? 'رسائل العملاء' : 'CUSTOMER MESSAGES'}
                        </h1>
                        {conversations.some(c => c.unreadCount > 0) && (
                            <span className="px-3 py-1 bg-cinematic-neon-red text-black text-[10px] font-black rounded-full shadow-[0_0_15px_rgba(255,0,60,0.5)]">
                                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} NEW
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Chat Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">

                    {/* LEFT: Conversations List */}
                    <div className={cn(
                        "md:col-span-1 flex flex-col gap-3 bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden",
                        selectedConv ? "hidden md:flex" : "flex"
                    )}>
                        {/* Search */}
                        <div className="p-4 border-b border-white/5">
                            <div className="relative">
                                <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20", isRTL ? "right-3" : "left-3")} />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={isRTL ? 'بحث في المحادثات...' : 'Search conversations...'}
                                    className={cn(
                                        "w-full bg-white/5 border border-white/10 rounded-xl py-3 text-[11px] font-bold text-white/60 placeholder-white/20 focus:outline-none focus:border-cinematic-neon-blue/40 transition-all",
                                        isRTL ? "pr-9 pl-4 text-right" : "pl-9 pr-4"
                                    )}
                                />
                            </div>
                        </div>

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto space-y-1 p-2">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse h-20" />
                                ))
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-12 text-white/20 text-[11px] uppercase tracking-widest font-black">
                                    {isRTL ? 'لا توجد محادثات' : 'No conversations'}
                                </div>
                            ) : (
                                filtered.map(conv => (
                                    <motion.button
                                        key={conv.userId}
                                        whileHover={{ x: isRTL ? -4 : 4 }}
                                        onClick={() => loadMessages(conv)}
                                        className={cn(
                                            "w-full p-4 rounded-xl text-left transition-all border",
                                            selectedConv?.userId === conv.userId
                                                ? "bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30"
                                                : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 relative">
                                                <User className="w-5 h-5 text-white/40" />
                                                {conv.unreadCount > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-cinematic-neon-red rounded-full text-[8px] font-black flex items-center justify-center shadow-[0_0_8px_rgba(255,0,60,0.8)]">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className={cn("text-[11px] font-black uppercase tracking-wider truncate", conv.unreadCount > 0 ? "text-white" : "text-white/60")}>
                                                        {conv.userName}
                                                    </span>
                                                    <span className="text-[9px] text-white/30 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                                                </div>
                                                <p className={cn("text-[10px] truncate", conv.unreadCount > 0 ? "text-white/70" : "text-white/30")}>
                                                    {conv.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {/* Refresh */}
                        <div className="p-3 border-t border-white/5">
                            <button onClick={loadConversations} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-[10px] font-black uppercase text-white/40 hover:text-white">
                                <RefreshCcw className="w-3 h-3" />
                                {isRTL ? 'تحديث' : 'REFRESH'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Chat Window */}
                    <div className={cn(
                        "md:col-span-2 flex flex-col bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden",
                        !selectedConv ? "hidden md:flex" : "flex"
                    )}>
                        {!selectedConv ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-white/20">
                                <MessageCircle className="w-16 h-16" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em]">
                                    {isRTL ? 'اختر محادثة للبدء' : 'SELECT A CONVERSATION'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-5 border-b border-white/5 flex items-center gap-4">
                                    <button aria-label="Go back" onClick={() => setSelectedConv(null)} className="md:hidden p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                                        <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white/40" />
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-black uppercase tracking-wider text-white">{selectedConv.userName}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                                            <span className="text-[9px] text-green-400 uppercase tracking-widest font-bold">{isRTL ? 'متصل' : 'ONLINE'}</span>
                                        </div>
                                    </div>
                                    <button aria-label="Close conversation" onClick={() => setSelectedConv(null)} className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                    <AnimatePresence initial={false}>
                                        {messages.map(msg => {
                                            const isMe = msg.senderId === adminId || msg.senderId === 'admin';
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className={cn("flex gap-3", isMe ? "flex-row-reverse" : "flex-row")}
                                                >
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black",
                                                        isMe
                                                            ? "bg-cinematic-neon-red/20 border border-cinematic-neon-red/30 text-cinematic-neon-red"
                                                            : "bg-white/10 border border-white/10 text-white/40"
                                                    )}>
                                                        {isMe ? 'A' : msg.senderName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                                                    </div>
                                                    <div className={cn("max-w-[70%] space-y-1", isMe ? "items-end" : "items-start", "flex flex-col")}>
                                                        <div className={cn(
                                                            "px-4 py-3 rounded-2xl text-[12px] leading-relaxed",
                                                            isMe
                                                                ? "bg-cinematic-neon-red/20 border border-cinematic-neon-red/20 text-white rounded-tr-none"
                                                                : "bg-white/5 border border-white/10 text-white/80 rounded-tl-none"
                                                        )}>
                                                            {msg.content}
                                                        </div>
                                                        <div className={cn("flex items-center gap-1", isMe ? "flex-row-reverse" : "flex-row")}>
                                                            <span className="text-[9px] text-white/20">{formatTime(msg.createdAt)}</span>
                                                            {isMe && <CheckCheck className={cn("w-3 h-3", msg.isRead ? "text-cinematic-neon-blue" : "text-white/20")} />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Send Message */}
                                <div className="p-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                                            className={cn(
                                                "flex-1 bg-white/5 border border-white/10 focus:border-cinematic-neon-blue/40 rounded-xl px-4 py-3 text-[12px] text-white placeholder-white/20 focus:outline-none transition-all",
                                                isRTL ? "text-right" : "text-left"
                                            )}
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() || sending}
                                            className="p-3.5 bg-cinematic-neon-blue !text-black rounded-xl disabled:opacity-30 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
                                        >
                                            <Send className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                        </motion.button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
