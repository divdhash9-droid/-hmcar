'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Check, CheckCheck,
    Headphones, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import ClientPageHeader from '@/components/ClientPageHeader';

interface Message {
    id: string;
    content: string;
    isFromMe: boolean;
    read: boolean;
    createdAt: string;
}

export default function ClientMessagesPage() {
    const { isRTL } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [supportName, setSupportName] = useState('خدمة العملاء HM CAR');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('hm_token') || sessionStorage.getItem('hm_token')) : null;
        if (token) {
            loadMessages();
            pollRef.current = setInterval(loadMessages, 10000);
        } else {
            setLoading(false);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            const data = await api.messages.getSupportMessages();
            if (data.success) {
                setMessages(data.data || []);
                if (data.supportName) setSupportName(data.supportName);
                setError('');
            } else {
                setError(data.error || 'فشل في تحميل الرسائل');
            }
        } catch {
            setError('تعذر الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        const text = newMessage.trim();
        if (!text || sending) return;

        setSending(true);
        const tempId = `temp-${Date.now()}`;
        setMessages(prev => [...prev, {
            id: tempId,
            content: text,
            isFromMe: true,
            read: false,
            createdAt: new Date().toISOString()
        }]);
        setNewMessage('');

        try {
            const data = await api.messages.sendSupportMessage(text);
            if (data.success) {
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, id: data.data.id } : m
                ));
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempId));
                setError(data.error || 'فشل الإرسال');
            }
        } catch {
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setError('فشل الإرسال، تحقق من اتصالك');
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days === 0) return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        if (days === 1) return isRTL ? 'أمس' : 'Yesterday';
        if (days < 7) return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'short' });
        return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-cinematic-neon-gold border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
            <ClientPageHeader
                title={isRTL ? 'الرسائل' : 'Messages'}
                subtitle="DIRECT SUPPORT CHAT"
                icon={Headphones}
            />

            <div className="flex-1 flex flex-col rounded-3xl overflow-hidden bg-white/3 border border-white/5 mt-6 min-h-0 backdrop-blur-md">
                {/* Chat Header */}
                <div className="flex items-center gap-4 p-4 border-b border-white/5 bg-black/20">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/20 flex items-center justify-center">
                            <Headphones className="w-5 h-5 text-cinematic-neon-gold" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-cinematic-dark" />
                    </div>
                    <div className="flex-1">
                        <div className="font-bold text-white text-sm">{supportName}</div>
                        <div className="text-[10px] text-green-400 flex items-center gap-1 opacity-80">
                            <span className="w-1 h-1 bg-green-400 rounded-full inline-block animate-pulse" />
                            {isRTL ? 'متاح للمساعدة' : 'Online'}
                        </div>
                    </div>
                    <button
                        onClick={loadMessages}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-white/30 hover:text-white"
                        title={isRTL ? 'تحديث' : 'Refresh'}
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%] bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-sm text-white/80">
                                    {isRTL ? 'مرحباً! 👋 أنا هنا لمساعدتك. كيف يمكنني خدمتك اليوم؟' : 'Hello! 👋 I am here to help. How can I assist you today?'}
                                </p>
                                <div className="text-[10px] text-white/30 mt-2 font-display italic">
                                    HM CAR Support Team
                                </div>
                            </div>
                        </div>
                    )}

                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-3.5 shadow-xl ${msg.isFromMe
                                    ? 'bg-cinematic-neon-gold/15 text-cinematic-neon-gold rounded-2xl rounded-tr-none border border-cinematic-neon-gold/20'
                                    : 'bg-white/5 text-white/90 rounded-2xl rounded-tl-none border border-white/5'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`flex items-center gap-1.5 mt-2 text-[10px] ${msg.isFromMe ? 'text-cinematic-neon-gold/60 justify-end' : 'text-white/30'}`}>
                                        <span>{formatTime(msg.createdAt)}</span>
                                        {msg.isFromMe && (
                                            msg.read
                                                ? <CheckCheck className="w-3 h-3" />
                                                : <Check className="w-3 h-3" />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError('')} className="p-1 hover:bg-white/5 rounded-md">✕</button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-black/10">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Type your message...'}
                            className="flex-1 bg-white/3 border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:outline-none focus:border-cinematic-neon-gold/40 transition-all placeholder:text-white/20"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={sending || !newMessage.trim()}
                            className="w-12 h-12 bg-cinematic-neon-gold text-black rounded-2xl flex items-center justify-center hover:bg-accent-gold-hover disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all shadow-lg"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
