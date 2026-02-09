'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    MessageCircle, Send, Search, User, Check, CheckCheck,
    ArrowLeft, ArrowRight, MoreVertical
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import ClientPageHeader from '@/components/ClientPageHeader';

interface Conversation {
    id: string;
    user: { name: string; email?: string };
    lastMessage: { content: string; createdAt: string; isFromMe: boolean };
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    isFromMe: boolean;
    read: boolean;
    createdAt: string;
}

export default function MessagesPage() {
    const { t, isRTL } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConvo) {
            loadMessages(selectedConvo.id);
        }
    }, [selectedConvo]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            setLoading(true);
            const response = await api.messages.conversations();
            if (response.success) {
                setConversations(response.data);
            }
        } catch (err) {
            console.error('Failed to load conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const response = await api.messages.conversation(userId);
            if (response.success) {
                setMessages(response.data);
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConvo) return;

        try {
            setSending(true);
            const response = await api.messages.send(selectedConvo.id, newMessage.trim());
            if (response.success) {
                setMessages([...messages, {
                    id: response.data.id,
                    content: newMessage.trim(),
                    isFromMe: true,
                    read: false,
                    createdAt: new Date().toISOString()
                }]);
                setNewMessage('');
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (days === 1) {
            return isRTL ? 'أمس' : 'Yesterday';
        } else if (days < 7) {
            return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
        }
    };

    const filteredConversations = conversations.filter(convo =>
        convo.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

            <main className="pt-24 pb-8 px-4 max-w-7xl mx-auto h-screen flex flex-col">
                <ClientPageHeader
                    title={isRTL ? 'الرسائل' : 'MESSAGES'}
                    subtitle={isRTL ? 'المحادثات' : 'CONVERSATIONS'}
                    icon={MessageCircle}
                />

                <div className="flex-1 mt-8 flex rounded-3xl overflow-hidden bg-white/5 border border-white/10">
                    {/* Conversations List */}
                    <div className={cn(
                        "w-full md:w-96 border-r border-white/10 flex flex-col",
                        selectedConvo && "hidden md:flex"
                    )}>
                        {/* Search */}
                        <div className="p-4 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={isRTL ? 'بحث...' : 'Search...'}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#c5a059]"
                                />
                            </div>
                        </div>

                        {/* Conversation List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredConversations.length === 0 ? (
                                <div className="p-8 text-center text-white/40">
                                    {isRTL ? 'لا توجد محادثات' : 'No conversations'}
                                </div>
                            ) : (
                                filteredConversations.map((convo) => (
                                    <button
                                        key={convo.id}
                                        onClick={() => setSelectedConvo(convo)}
                                        className={cn(
                                            "w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5",
                                            selectedConvo?.id === convo.id && "bg-white/10"
                                        )}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#c5a059]/20 flex items-center justify-center">
                                            <User className="w-6 h-6 text-[#c5a059]" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold">{convo.user.name}</span>
                                                <span className="text-xs text-white/40">{formatTime(convo.lastMessage.createdAt)}</span>
                                            </div>
                                            <p className="text-sm text-white/50 truncate">
                                                {convo.lastMessage.isFromMe && (
                                                    <span className="text-[#c5a059]">{isRTL ? 'أنت: ' : 'You: '}</span>
                                                )}
                                                {convo.lastMessage.content}
                                            </p>
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <div className="w-6 h-6 bg-[#c5a059] rounded-full flex items-center justify-center text-xs font-bold text-black">
                                                {convo.unreadCount}
                                            </div>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className={cn(
                        "flex-1 flex flex-col",
                        !selectedConvo && "hidden md:flex"
                    )}>
                        {selectedConvo ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-white/10 flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedConvo(null)}
                                        className="md:hidden p-2 hover:bg-white/10 rounded-xl"
                                    >
                                        {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                                    </button>
                                    <div className="w-10 h-10 rounded-full bg-[#c5a059]/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-[#c5a059]" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold">{selectedConvo.user.name}</div>
                                    </div>
                                    <button className="p-2 hover:bg-white/10 rounded-xl">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "flex",
                                                msg.isFromMe ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div className={cn(
                                                "max-w-[70%] p-4 rounded-2xl",
                                                msg.isFromMe
                                                    ? "bg-[#c5a059] text-black rounded-br-none"
                                                    : "bg-white/10 rounded-bl-none"
                                            )}>
                                                <p>{msg.content}</p>
                                                <div className={cn(
                                                    "flex items-center gap-1 mt-1 text-xs",
                                                    msg.isFromMe ? "text-black/60 justify-end" : "text-white/40"
                                                )}>
                                                    <span>{formatTime(msg.createdAt)}</span>
                                                    {msg.isFromMe && (
                                                        msg.read ? <CheckCheck className="w-4 h-4" /> : <Check className="w-4 h-4" />
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-white/10">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-[#c5a059]"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={sending || !newMessage.trim()}
                                            className="w-12 h-12 bg-[#c5a059] rounded-xl flex items-center justify-center hover:bg-[#d4af68] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-5 h-5 text-black" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-white/40">
                                <MessageCircle className="w-24 h-24 mb-4 opacity-20" />
                                <p>{isRTL ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
