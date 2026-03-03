'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Check, CheckCheck,
    Headphones, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import Navbar from '@/components/Navbar';
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

export default function MessagesPage() {
    const { isRTL } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [supportName, setSupportName] = useState('خدمة العملاء HM CAR');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const token = typeof window !== 'undefined' ? (localStorage.getItem('hm_token') || sessionStorage.getItem('hm_token')) : null;
        if (token) {
            setIsLoggedIn(true);
            loadMessages();
            // Auto-refresh every 10 seconds
            pollRef.current = setInterval(loadMessages, 10000);
        } else {
            setIsLoggedIn(false);
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
        // Optimistic update
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
                // Replace temp with real
                setMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, id: data.data.id } : m
                ));
            } else {
                // Remove temp on failure
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
        if (days === 0) return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        if (days === 1) return 'أمس';
        if (days < 7) return date.toLocaleDateString('ar-SA', { weekday: 'short' });
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    };

    // Not logged in
    if (!isLoggedIn) {
        return (
            <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />
                <main className="pt-24 pb-8 px-4 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-screen">
                    <div className="text-center p-12 rounded-3xl bg-white/5 border border-white/10">
                        <Headphones className="w-20 h-20 text-[#c5a059] mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-3">تواصل مع خدمة العملاء</h2>
                        <p className="text-white/60 mb-8">يجب تسجيل الدخول أولاً للتحدث مع فريق الدعم</p>
                        <a href="/login" className="px-8 py-3 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-colors">
                            تسجيل الدخول
                        </a>
                    </div>
                </main>
            </div>
        );
    }

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <main className="pt-20 h-screen flex flex-col max-w-4xl mx-auto px-4">
                <div className="py-4">
                    <ClientPageHeader
                        title="تواصل مع الدعم"
                        subtitle="CUSTOMER SUPPORT"
                        icon={Headphones}
                    />
                </div>

                {/* Chat Container */}
                <div className="flex-1 flex flex-col rounded-3xl overflow-hidden bg-white/5 border border-white/10 mb-4 min-h-0">

                    {/* Chat Header */}
                    <div className="flex items-center gap-4 p-4 border-b border-white/10 bg-black/30">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center">
                                <Headphones className="w-6 h-6 text-[#c5a059]" />
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white">{supportName}</div>
                            <div className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                متاح للمساعدة
                            </div>
                        </div>
                        <button
                            onClick={loadMessages}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
                            title="تحديث"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">

                        {/* Welcome message */}
                        {messages.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="max-w-[80%] bg-white/10 rounded-2xl rounded-bl-none p-4">
                                    <p className="text-white">
                                        مرحباً! 👋 أنا هنا لمساعدتك. كيف يمكنني خدمتك اليوم؟
                                    </p>
                                    <div className="text-xs text-white/40 mt-1">
                                        فريق خدمة العملاء HM CAR
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    {!msg.isFromMe && (
                                        <div className="w-8 h-8 rounded-full bg-[#c5a059]/20 flex items-center justify-center ml-2 flex-shrink-0 self-end">
                                            <Headphones className="w-4 h-4 text-[#c5a059]" />
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] ${msg.isFromMe
                                        ? 'bg-[#c5a059] text-black rounded-2xl rounded-br-none'
                                        : 'bg-white/10 text-white rounded-2xl rounded-bl-none'
                                        } p-3 shadow-lg`}>
                                        <p className="leading-relaxed">{msg.content}</p>
                                        <div className={`flex items-center gap-1 mt-1 text-xs ${msg.isFromMe ? 'text-black/50 justify-end' : 'text-white/40'}`}>
                                            <span>{formatTime(msg.createdAt)}</span>
                                            {msg.isFromMe && (
                                                msg.read
                                                    ? <CheckCheck className="w-3.5 h-3.5" />
                                                    : <Check className="w-3.5 h-3.5" />
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
                        <div className="mx-4 mb-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                            <button onClick={() => setError('')} className="mr-auto text-red-300 hover:text-white">✕</button>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <div className="flex items-center gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="اكتب رسالتك هنا..."
                                maxLength={2000}
                                className="flex-1 bg-black/50 border border-white/10 rounded-2xl py-3 px-5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#c5a059] transition-colors"
                            />
                            <button
                                onClick={sendMessage}
                                disabled={sending || !newMessage.trim()}
                                className="w-12 h-12 bg-[#c5a059] rounded-2xl flex items-center justify-center hover:bg-[#d4af68] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            >
                                {sending
                                    ? <Loader2 className="w-5 h-5 text-black animate-spin" />
                                    : <Send className="w-5 h-5 text-black" />
                                }
                            </button>
                        </div>
                        <p className="text-xs text-white/20 mt-2 text-center">
                            سيرد عليك فريق الدعم في أقرب وقت ممكن
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
