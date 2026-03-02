'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import ClientPageHeader from "@/components/ClientPageHeader";

export default function ContactPage() {
    const { isRTL } = useLanguage();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', subject: '', message: ''
    });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            setResult({
                type: 'error',
                message: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields'
            });
            return;
        }
        try {
            setLoading(true);
            setResult(null);
            await api.contact.send(formData);
            setResult({ type: 'success', message: isRTL ? 'تم إرسال رسالتك بنجاح!' : 'Message sent successfully!' });
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err: any) {
            setResult({ type: 'error', message: err.message || (isRTL ? 'فشل في إرسال الرسالة' : 'Failed to send message') });
        } finally {
            setLoading(false);
        }
    };

    const [contactData, setContactData] = useState({
        phone: '+967781007805',
        email: 'info@hmcar.com',
        address: isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia',
        whatsapp: '+967781007805'
    });

    useEffect(() => {
        api.settings.getPublic().then((res: any) => {
            if (res?.success) {
                setContactData({
                    phone: res.data.contactInfo?.phone || '+967781007805',
                    email: res.data.contactInfo?.email || 'info@hmcar.com',
                    address: res.data.contactInfo?.address || (isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'),
                    whatsapp: res.data.socialLinks?.whatsapp || '+967781007805'
                });
            }
        }).catch(() => { });
    }, [isRTL]);

    const contactInfo = [
        { icon: MapPin, title: isRTL ? 'العنوان' : 'Address', content: contactData.address },
        { icon: Phone, title: isRTL ? 'الهاتف' : 'Phone', content: contactData.phone },
        { icon: Mail, title: isRTL ? 'البريد' : 'Email', content: contactData.email },
        { icon: Clock, title: isRTL ? 'ساعات العمل' : 'Hours', content: isRTL ? 'السبت - الخميس: 9ص - 9م' : 'Sat - Thu: 9AM - 9PM' },
    ];

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-6xl mx-auto">
                <ClientPageHeader
                    title={isRTL ? 'تواصل معنا' : 'CONTACT US'}
                    subtitle={isRTL ? 'نحن هنا لمساعدتك' : 'WE ARE HERE TO HELP'}
                    icon={MessageCircle}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[40vh] md:h-[45vh] overflow-hidden mt-8 mx-6 rounded-3xl border border-white/5">
                <video
                    autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.3) contrast(1.2) saturate(1.1)' }}
                >
                    <source src="/videos/video.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                <div className="video-grain" />

                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-6xl mx-auto w-full px-6 pb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="w-14 h-14 bg-accent-gold/10 rounded-xl flex items-center justify-center mb-5 border border-accent-gold/10">
                                <MessageCircle className="w-6 h-6 text-accent-gold" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase">
                                {isRTL ? 'تواصل معنا' : 'CONTACT US'}
                            </h1>
                            <p className="text-sm text-white/40 mt-3 max-w-lg leading-relaxed">
                                {isRTL
                                    ? 'نحن هنا لمساعدتك. تواصل معنا للاستفسار أو المساعدة'
                                    : 'We are here to help. Reach out for inquiries or assistance'}
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="bg-grid-overlay opacity-8" />
                <div className="orb orb-gold w-[500px] h-[500px] top-0 right-0 animate-breathe opacity-15" />
            </div>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* ── LEFT: INFO CARDS ── */}
                    <div className="space-y-5">
                        {contactInfo.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-card p-5 hover:border-accent-gold/15 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-accent-gold/10 rounded-lg flex items-center justify-center shrink-0 border border-accent-gold/10">
                                        <item.icon className="w-4.5 h-4.5 text-accent-gold" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold mb-0.5">{item.title}</h3>
                                        <p className="text-sm text-white/45">{item.content}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* WhatsApp */}
                        <motion.a
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            href={`https://wa.me/${contactData.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 p-5 bg-[#25D366]/10 border border-[#25D366]/20 rounded-xl hover:bg-[#25D366]/20 transition-all"
                        >
                            <MessageCircle className="w-5 h-5 text-[#25D366]" />
                            <span className="font-bold text-sm text-[#25D366]">
                                {isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                            </span>
                        </motion.a>
                    </div>

                    {/* ── RIGHT: FORM ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <form onSubmit={handleSubmit} className="obsidian-card p-8 md:p-10">
                            <h2 className="text-xl font-bold mb-6 uppercase tracking-tight">
                                {isRTL ? 'أرسل لنا رسالة' : 'SEND A MESSAGE'}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2 px-1">
                                        {isRTL ? 'الاسم' : 'NAME'} *
                                    </label>
                                    <input
                                        type="text" name="name" value={formData.name} onChange={handleChange} required
                                        className="glass-input"
                                        placeholder={isRTL ? 'أدخل اسمك' : 'Your name'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2 px-1">
                                        {isRTL ? 'البريد' : 'EMAIL'} *
                                    </label>
                                    <input
                                        type="email" name="email" value={formData.email} onChange={handleChange} required
                                        className="glass-input"
                                        placeholder={isRTL ? 'بريدك الإلكتروني' : 'Your email'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                <div>
                                    <label className="block text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2 px-1">
                                        {isRTL ? 'الهاتف' : 'PHONE'}
                                    </label>
                                    <input
                                        type="tel" name="phone" value={formData.phone} onChange={handleChange}
                                        className="glass-input"
                                        placeholder={isRTL ? 'رقم هاتفك' : 'Your phone'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2 px-1">
                                        {isRTL ? 'الموضوع' : 'SUBJECT'}
                                    </label>
                                    <select
                                        name="subject" value={formData.subject} onChange={handleChange}
                                        className="glass-input"
                                    >
                                        <option value="">{isRTL ? 'اختر الموضوع' : 'Select...'}</option>
                                        <option value="sales">{isRTL ? 'استفسار سيارة' : 'Car Inquiry'}</option>
                                        <option value="auction">{isRTL ? 'المزادات' : 'Auctions'}</option>
                                        <option value="parts">{isRTL ? 'قطع غيار' : 'Spare Parts'}</option>
                                        <option value="support">{isRTL ? 'دعم فني' : 'Support'}</option>
                                        <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-[9px] font-bold text-white/25 uppercase tracking-[0.2em] mb-2 px-1">
                                    {isRTL ? 'الرسالة' : 'MESSAGE'} *
                                </label>
                                <textarea
                                    name="message" value={formData.message} onChange={handleChange} required rows={5}
                                    className="glass-input resize-none"
                                    placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                />
                            </div>

                            {result && (
                                <div className={cn(
                                    "flex items-center gap-3 p-4 rounded-xl mb-5",
                                    result.type === 'success' ? 'bg-accent-emerald/10 border border-accent-emerald/20 text-accent-emerald' : 'bg-accent-red/10 border border-accent-red/20 text-accent-red'
                                )}>
                                    {result.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    <span className="text-sm font-medium">{result.message}</span>
                                </div>
                            )}

                            <button
                                type="submit" disabled={loading}
                                className="w-full btn-gold py-5 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                {loading
                                    ? (isRTL ? 'جاري الإرسال...' : 'SENDING...')
                                    : (isRTL ? 'إرسال الرسالة' : 'SEND MESSAGE')
                                }
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
