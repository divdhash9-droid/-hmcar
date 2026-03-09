'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Send, Search,
    User, CheckCheck, Circle, RefreshCcw, X
} from 'lucide-react';
import Link from 'next/link';
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
    isFromMe: boolean;
    createdAt: string;
    read: boolean;
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
            if (data.success && Array.isArray(data.data)) {
                setConversations(data.data.map((item: any) => ({
                    userId: item.user?._id || item.id,
                    userName: item.user?.name || 'Unknown',
                    lastMessage: item.lastMessage?.content || '',
                    lastMessageAt: item.lastMessage?.createdAt || new Date().toISOString(),
                    unreadCount: item.unreadCount || 0
                })));
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
            if (data.success && Array.isArray(data.data)) {
                setMessages(data.data);
            } else {
                setMessages([
                    { id: 'm1', content: 'Hello, I am interested in the BMW M5', isFromMe: false, createdAt: new Date(Date.now() - 3600000).toISOString(), read: true },
                    { id: 'm2', content: 'Of course! Which year and spec are you looking for?', isFromMe: true, createdAt: new Date(Date.now() - 3500000).toISOString(), read: true },
                    { id: 'm3', content: 'I prefer 2023 Competition Package in black', isFromMe: false, createdAt: new Date(Date.now() - 600000).toISOString(), read: false },
                ]);
            }
            // Mark as read
            setConversations((prev: Conversation[]) => prev.map((c: Conversation) =>
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
            isFromMe: true,
            createdAt: new Date().toISOString(),
            read: false,
        };
        setMessages((prev: Message[]) => [...prev, tempMsg]);
        try {
            await api.messages.send(selectedConv.userId, content);
            setConversations((prev: Conversation[]) => prev.map((c: Conversation) =>
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
        <div className="min-h-screen text-white overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

            <main className="relative z-10 pt-6 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto h-screen flex flex-col">

                {/* HUD Header */}
                <div className="ck-page-header pb-4 mb-4">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'رسائل العملاء' : 'MESSAGES'}</span>
                    </nav>
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="ck-page-title text-2xl md:text-3xl">{isRTL ? 'رسائل العملاء' : 'CUSTOMER COMMS'}</h1>
                        {conversations.some(c => c.unreadCount > 0) && (
                            <span className="ck-badge ck-badge-danger ck-badge-live">
                                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)} {isRTL ? 'جديد' : 'NEW'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Main Chat Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">

                    {/* LEFT: Conversations List */}
                    <div className={cn(
                        'md:col-span-1 flex flex-col ck-card overflow-hidden',
                        selectedConv ? 'hidden md:flex' : 'flex'
                    )}>
                        {/* Search */}
                        <div className="p-4 border-b border-orange-500/10">
                            <div className="relative">
                                <Search className={cn('absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/30', isRTL ? 'right-3' : 'left-3')} />
                                <input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    placeholder={isRTL ? 'بحث في المحادثات...' : 'Search conversations...'}
                                    className={cn('ck-input text-xs py-2', isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3')} />
                            </div>
                        </div>

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto space-y-1 p-2 ck-scroll">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="p-4 rounded-xl bg-white/5 animate-pulse h-16" />
                                ))
                            ) : filtered.length === 0 ? (
                                <div className="ck-empty py-8">
                                    <div className="ck-empty-icon"><MessageCircle className="w-6 h-6" /></div>
                                    <p className="cockpit-mono text-[10px]">{isRTL ? 'لا توجد محادثات' : 'NO CONVERSATIONS'}</p>
                                </div>
                            ) : (
                                filtered.map((conv: Conversation) => (
                                    <motion.button key={conv.userId}
                                        whileHover={{ x: isRTL ? -2 : 2 }}
                                        onClick={() => loadMessages(conv)}
                                        className={cn(
                                            'w-full p-3 rounded-xl text-start transition-all border',
                                            selectedConv?.userId === conv.userId
                                                ? 'bg-orange-500/10 border-orange-500/25'
                                                : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-orange-500/10'
                                        )}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center shrink-0 relative">
                                                <User className="w-4 h-4 text-orange-400/60" />
                                                {conv.unreadCount > 0 && (
                                                    <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 rounded-full cockpit-mono text-[8px] font-black flex items-center justify-center">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <span className={cn('text-[11px] font-bold truncate', conv.unreadCount > 0 ? 'text-white' : 'text-white/60')}>
                                                        {conv.userName}
                                                    </span>
                                                    <span className="cockpit-mono text-[9px] text-white/25 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                                                </div>
                                                <p className={cn('text-[10px] truncate', conv.unreadCount > 0 ? 'text-white/60' : 'text-white/25')}>
                                                    {conv.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {/* Refresh */}
                        <div className="p-3 border-t border-orange-500/10">
                            <button onClick={loadConversations}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/20 border border-white/5 transition-all cockpit-mono text-[9px] font-bold uppercase text-white/35 hover:text-orange-400">
                                <RefreshCcw className="w-3 h-3" />
                                {isRTL ? 'تحديث' : 'REFRESH'}
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Chat Window */}
                    <div className={cn(
                        'md:col-span-2 flex flex-col ck-card overflow-hidden min-h-0',
                        !selectedConv ? 'hidden md:flex' : 'flex'
                    )}>
                        {!selectedConv ? (
                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                <div className="ck-empty-icon w-16 h-16">
                                    <MessageCircle className="w-8 h-8" />
                                </div>
                                <p className="cockpit-mono text-[11px] text-white/20">
                                    {isRTL ? 'اختر محادثة للبدء' : 'SELECT A CONVERSATION'}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-orange-500/10 flex items-center gap-3">
                                    <button aria-label="Go back" onClick={() => setSelectedConv(null)}
                                        className="md:hidden w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center">
                                        <User className="w-4 h-4 text-orange-400/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{selectedConv.userName}</p>
                                        <div className="flex items-center gap-1.5">
                                            <Circle className="w-1.5 h-1.5 fill-green-400 text-green-400" />
                                            <span className="cockpit-mono text-[9px] text-green-400 uppercase">{isRTL ? 'متصل' : 'ONLINE'}</span>
                                        </div>
                                    </div>
                                    <button aria-label="Close conversation" onClick={() => setSelectedConv(null)}
                                        className="ms-auto w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white flex items-center justify-center">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 ck-scroll">
                                    <AnimatePresence initial={false}>
                                        {messages.map((msg: Message) => {
                                            const isMe = msg.isFromMe;
                                            return (
                                                <motion.div key={msg.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0 }}
                                                    className={cn('flex gap-3', isMe ? 'flex-row-reverse' : 'flex-row')}>
                                                    <div className={cn(
                                                        'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 cockpit-mono text-[9px] font-black',
                                                        isMe ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' : 'bg-white/8 border border-white/10 text-white/40'
                                                    )}>
                                                        {isMe ? 'A' : (selectedConv?.userName?.[0] || 'U')}
                                                    </div>
                                                    <div className={cn('max-w-[70%] flex flex-col', isMe ? 'items-end' : 'items-start')}>
                                                        <div className={cn(
                                                            'px-4 py-2.5 rounded-2xl text-[12px] leading-relaxed',
                                                            isMe
                                                                ? 'bg-orange-500/15 border border-orange-500/20 text-white rounded-te-none'
                                                                : 'bg-white/5 border border-white/8 text-white/80 rounded-ts-none'
                                                        )}>{msg.content}</div>
                                                        <div className={cn('flex items-center gap-1 mt-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
                                                            <span className="cockpit-mono text-[9px] text-white/20">{formatTime(msg.createdAt)}</span>
                                                            {isMe && <CheckCheck className={cn('w-3 h-3', msg.read ? 'text-orange-400' : 'text-white/20')} />}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Send Message */}
                                <div className="p-4 border-t border-orange-500/10">
                                    <div className="flex items-center gap-3">
                                        <input type="text" value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                                            className="flex-1 ck-input text-[12px] py-2.5" />
                                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                            onClick={sendMessage} disabled={!newMessage.trim() || sending}
                                            className="ck-btn-primary p-3 disabled:opacity-30">
                                            <Send className={cn('w-4 h-4', isRTL && 'rotate-180')} />
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
