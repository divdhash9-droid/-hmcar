'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import ClientPageHeader from '@/components/ClientPageHeader';

export default function ContactPage() {
    const { t, isRTL, locale } = useLocale();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
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
            setResult({
                type: 'success',
                message: isRTL ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Message sent successfully! We will contact you soon.'
            });
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err: any) {
            setResult({
                type: 'error',
                message: err.message || (isRTL ? 'فشل في إرسال الرسالة' : 'Failed to send message')
            });
        } finally {
            setLoading(false);
        }
    };

    const contactInfo = [
        {
            icon: MapPin,
            title: isRTL ? 'العنوان' : 'Address',
            content: isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'
        },
        {
            icon: Phone,
            title: isRTL ? 'الهاتف' : 'Phone',
            content: '+966 50 000 0000'
        },
        {
            icon: Mail,
            title: isRTL ? 'البريد الإلكتروني' : 'Email',
            content: 'info@hmcar.sa'
        },
        {
            icon: Clock,
            title: isRTL ? 'ساعات العمل' : 'Working Hours',
            content: isRTL ? 'السبت - الخميس: 9ص - 9م' : 'Sat - Thu: 9AM - 9PM'
        }
    ];

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <ClientPageHeader />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4">
                <div className="absolute inset-0 bg-gradient-to-b from-[#c5a059]/10 to-transparent" />
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-20 h-20 bg-[#c5a059]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageCircle className="w-10 h-10 text-[#c5a059]" />
                        </div>
                        <h1 className="text-5xl font-black mb-4">
                            {isRTL ? 'تواصل معنا' : 'Contact Us'}
                        </h1>
                        <p className="text-xl text-white/60">
                            {isRTL
                                ? 'نحن هنا لمساعدتك. تواصل معنا للاستفسار أو المساعدة'
                                : 'We are here to help. Contact us for any inquiries or assistance'}
                        </p>
                    </motion.div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Contact Info Cards */}
                    <div className="space-y-6">
                        {contactInfo.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-[#c5a059]/30 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-[#c5a059]/20 rounded-xl flex items-center justify-center">
                                        <item.icon className="w-6 h-6 text-[#c5a059]" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold mb-1">{item.title}</h3>
                                        <p className="text-white/60">{item.content}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* WhatsApp Button */}
                        <motion.a
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            href="https://wa.me/966500000000"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-3 p-6 bg-green-600 rounded-2xl hover:bg-green-700 transition-all"
                        >
                            <MessageCircle className="w-6 h-6" />
                            <span className="font-bold text-lg">
                                {isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                            </span>
                        </motion.a>
                    </div>

                    {/* Contact Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
                            <h2 className="text-2xl font-bold mb-6">
                                {isRTL ? 'أرسل لنا رسالة' : 'Send us a Message'}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">
                                        {isRTL ? 'الاسم' : 'Name'} *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059] transition-colors"
                                        placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">
                                        {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059] transition-colors"
                                        placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">
                                        {isRTL ? 'رقم الهاتف' : 'Phone'}
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059] transition-colors"
                                        placeholder={isRTL ? 'أدخل رقم هاتفك' : 'Enter your phone'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">
                                        {isRTL ? 'الموضوع' : 'Subject'}
                                    </label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059] transition-colors"
                                    >
                                        <option value="">{isRTL ? 'اختر الموضوع' : 'Select Subject'}</option>
                                        <option value="sales">{isRTL ? 'استفسار عن سيارة' : 'Car Inquiry'}</option>
                                        <option value="auction">{isRTL ? 'استفسار عن المزادات' : 'Auction Inquiry'}</option>
                                        <option value="parts">{isRTL ? 'قطع الغيار' : 'Spare Parts'}</option>
                                        <option value="support">{isRTL ? 'دعم فني' : 'Technical Support'}</option>
                                        <option value="other">{isRTL ? 'أخرى' : 'Other'}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-white/60 text-sm mb-2">
                                    {isRTL ? 'الرسالة' : 'Message'} *
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={6}
                                    className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#c5a059] transition-colors resize-none"
                                    placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                                />
                            </div>

                            {result && (
                                <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 ${result.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {result.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                    <span>{result.message}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                {loading
                                    ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
                                    : (isRTL ? 'إرسال الرسالة' : 'Send Message')}
                            </button>
                        </form>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
