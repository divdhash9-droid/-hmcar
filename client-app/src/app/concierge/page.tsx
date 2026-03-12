'use client';

/**
 * صفحة الطلبات الخاصة
 * تتيح للعملاء تقديم طلب سيارة خاصة أو طلب قطعة غيار
 * يُرسل الطلب عبر واتساب وإلى الأدمن في النظام
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import {
    Send, Car, Settings, CheckCircle, Shield,
    User, Phone, FileText, Upload, X, ChevronDown, Palette
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import ClientPageHeader from '@/components/ClientPageHeader';

const TAB_CAR = 'car';
const TAB_PARTS = 'parts';
const rawText = (value: string) => value;

// ── قائمة الألوان ──
const CAR_COLORS = [
    { name: 'أبيض', nameEn: 'White', hex: '#FFFFFF' },
    { name: 'أسود', nameEn: 'Black', hex: '#0A0A0A' },
    { name: 'فضي', nameEn: 'Silver', hex: '#C0C0C0' },
    { name: 'رمادي', nameEn: 'Gray', hex: '#6B7280' },
    { name: 'أحمر', nameEn: 'Red', hex: '#DC2626' },
    { name: 'أزرق', nameEn: 'Blue', hex: '#2563EB' },
    { name: 'أزرق سماوي', nameEn: 'Sky Blue', hex: '#0EA5E9' },
    { name: 'أخضر', nameEn: 'Green', hex: '#16A34A' },
    { name: 'ذهبي', nameEn: 'Gold', hex: '#D97706' },
    { name: 'بيج / شامبيني', nameEn: 'Beige/Champagne', hex: '#C9A96E' },
    { name: 'بني', nameEn: 'Brown', hex: '#92400E' },
    { name: 'برتقالي', nameEn: 'Orange', hex: '#EA580C' },
    { name: 'بنفسجي', nameEn: 'Purple', hex: '#7C3AED' },
    { name: 'أخضر زيتوني', nameEn: 'Olive', hex: '#4D7C0F' },
    { name: 'وردي', nameEn: 'Pink', hex: '#EC4899' },
    { name: 'أبيض لؤلؤي', nameEn: 'Pearl White', hex: '#F0F0F0' },
];

// ── قائمة السنوات ──
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);

export default function ConciergePage() {
    const { isRTL } = useLanguage();
    const [activeTab, setActiveTab] = useState<'car' | 'parts'>(TAB_CAR);
    const [whatsappNumber, setWhatsappNumber] = useState('+967781007805');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [partImagePreview, setPartImagePreview] = useState<string | null>(null);
    const [partImageFile, setPartImageFile] = useState<File | null>(null);

    // بيانات طلب السيارة
    const [carForm, setCarForm] = useState({
        name: '',
        phone: '',
        carName: '',
        model: '',
        color: '',
        colorName: '',
        year: '',
        description: '',
    });

    // بيانات طلب قطع الغيار
    const [partsForm, setPartsForm] = useState({
        name: '',
        phone: '',
        partName: '',
        carName: '',
        year: '',
        description: '',
    });

    // تعبئة تلقائية للحقول عند التحويل من المعرض الكوري عبر query params
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const source = params.get('source');
        const carName = params.get('carName') || '';
        const model = params.get('model') || '';
        const year = params.get('year') || '';
        const description = params.get('description') || '';
        const externalUrl = params.get('externalUrl') || '';

        if (source === 'korean_showroom') {
            setActiveTab(TAB_CAR);
            setCarForm(prev => ({
                ...prev,
                carName: carName || prev.carName,
                model: model || prev.model,
                year: year || prev.year,
                description: [description, externalUrl ? `الرابط: ${externalUrl}` : '']
                    .filter(Boolean)
                    .join('\n'),
            }));
        }

        // تعبئة الاسم/الهاتف من حساب المستخدم إن وُجد
        const userRaw = localStorage.getItem('hm_user');
        if (userRaw) {
            try {
                const user = JSON.parse(userRaw);
                const name = user?.name || '';
                const phone = user?.phone || '';

                if (name || phone) {
                    setCarForm(prev => ({
                        ...prev,
                        name: prev.name || name,
                        phone: prev.phone || phone,
                    }));
                    setPartsForm(prev => ({
                        ...prev,
                        name: prev.name || name,
                        phone: prev.phone || phone,
                    }));
                }
            } catch (e) {
                // تجاهل أي خطأ parsing
            }
        }
    }, []);

    // جلب رقم الواتساب من الإعدادات
    useEffect(() => {
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res?.data?.socialLinks?.whatsapp) {
                setWhatsappNumber(res.data.socialLinks.whatsapp);
            }
        }).catch(() => { });
    }, []);

    // إغلاق منتقي اللون عند النقر خارجه
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
                setShowColorPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // معاينة صورة قطعة الغيار
    const handlePartImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPartImageFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setPartImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    // إرسال طلب السيارة
    const handleCarSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. إرسال للأدمن عبر API (يُنشئ إشعار أدمن تلقائياً)
            const res = await api.concierge.create({
                type: 'car',
                name: carForm.name,
                phone: carForm.phone,
                carName: carForm.carName,
                model: carForm.model,
                color: carForm.color,
                colorName: carForm.colorName,
                year: carForm.year,
                description: carForm.description,
            });

            // 2. رسالة الأدمن عبر واتساب
            const adminMsg = [
                `🚗 *طلب سيارة خاص - CARHM*`,
                `━━━━━━━━━━━━━━`,
                `👤 الاسم: ${carForm.name}`,
                `📱 الهاتف: ${carForm.phone}`,
                `🚗 اسم السيارة: ${carForm.carName}`,
                `📋 الموديل: ${carForm.model}`,
                `🎨 اللون: ${carForm.colorName || carForm.color}`,
                `📅 السنة: ${carForm.year}`,
                `📝 الوصف: ${carForm.description}`,
            ].join('\n');
            const cleanAdminNum = whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanAdminNum}?text=${encodeURIComponent(adminMsg)}`, '_blank');

            // 3. رسالة تأكيد للعميل عبر واتساب (تفتح بعد ثانية)
            const confirmText = res?.data?.confirmWhatsApp;
            const clientPhone = carForm.phone.replace(/[^0-9]/g, '');
            if (confirmText && clientPhone.length >= 9) {
                setTimeout(() => {
                    window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(confirmText)}`, '_blank');
                }, 1200);
            }

            setSubmitted(true);
        } catch (err) {
            console.error('Car request error:', err);
            // حتى لو فشل API، نرسل واتساب للأدمن
            const adminMsg = [
                `🚗 *طلب سيارة خاص - CARHM*`,
                `👤 الاسم: ${carForm.name}`,
                `📱 الهاتف: ${carForm.phone}`,
                `🚗 اسم السيارة: ${carForm.carName}`,
                `📋 الموديل: ${carForm.model}`,
                `🎨 اللون: ${carForm.colorName || carForm.color}`,
                `📅 السنة: ${carForm.year}`,
                `📝 الوصف: ${carForm.description}`,
            ].join('\n');
            const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(adminMsg)}`, '_blank');
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    // إرسال طلب قطع الغيار
    const handlePartsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let imageUrl = '';
            // رفع الصورة إن وجدت
            if (partImageFile) {
                try {
                    const formData = new FormData();
                    formData.append('image', partImageFile);
                    const uploadRes = await api.upload.image(formData);
                    if (uploadRes?.success) imageUrl = uploadRes.url;
                } catch { /* تجاهل خطأ الرفع */ }
            }

            // 1. إرسال للأدمن (يُنشئ إشعار أدمن تلقائياً)
            const res = await api.concierge.create({
                type: 'parts',
                name: partsForm.name,
                phone: partsForm.phone,
                partName: partsForm.partName,
                carName: partsForm.carName,
                year: partsForm.year,
                description: partsForm.description,
                imageUrl,
            });

            // 2. واتساب للأدمن
            const adminMsg = [
                `🔧 *طلب قطعة غيار - CARHM*`,
                `━━━━━━━━━━━━━━`,
                `👤 الاسم: ${partsForm.name}`,
                `📱 الهاتف: ${partsForm.phone}`,
                `🔩 اسم القطعة: ${partsForm.partName}`,
                `🚗 السيارة: ${partsForm.carName}`,
                `📅 السنة: ${partsForm.year}`,
                `📝 الوصف: ${partsForm.description}`,
                imageUrl ? `🖼️ صورة القطعة: ${imageUrl}` : '',
            ].filter(Boolean).join('\n');
            const cleanAdminNum = whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanAdminNum}?text=${encodeURIComponent(adminMsg)}`, '_blank');

            // 3. رسالة تأكيد للعميل (بعد ثانية)
            const confirmText = res?.data?.confirmWhatsApp;
            const clientPhone = partsForm.phone.replace(/[^0-9]/g, '');
            if (confirmText && clientPhone.length >= 9) {
                setTimeout(() => {
                    window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(confirmText)}`, '_blank');
                }, 1200);
            }

            setSubmitted(true);
        } catch (err) {
            console.error('Parts request error:', err);
            const adminMsg = [
                `🔧 *طلب قطعة غيار - CARHM*`,
                `👤 الاسم: ${partsForm.name}`,
                `📱 الهاتف: ${partsForm.phone}`,
                `🔩 اسم القطعة: ${partsForm.partName}`,
                `🚗 السيارة: ${partsForm.carName}`,
                `📅 السنة: ${partsForm.year}`,
                `📝 الوصف: ${partsForm.description}`,
            ].join('\n');
            const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
            window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(adminMsg)}`, '_blank');
            setSubmitted(true);
        } finally {
            setLoading(false);
        }
    };

    // مشترك بين كلا النموذجين
    const inputClass = 'w-full bg-white/[0.04] border border-white/10 rounded-xl py-3.5 px-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all';
    const labelClass = 'text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1.5 block';

    // شاشة النجاح
    if (submitted) return (
        <div className={`min-h-screen bg-black text-white flex items-center justify-center ${isRTL ? 'font-arabic' : ''}`}>
            <Navbar />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center px-8 max-w-md"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-24 h-24 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-8"
                >
                    <CheckCircle className="w-12 h-12 text-amber-500" />
                </motion.div>
                <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">
                    {isRTL ? rawText('تم إرسال طلبك!') : rawText('Request Sent!')}
                </h2>
                <p className="text-white/40 text-sm mb-8">
                    {isRTL
                        ? rawText('تم إرسال طلبك للفريق المختص وعبر الواتساب. سنتواصل معك قريباً.')
                        : rawText('Your request has been sent to our team and via WhatsApp. We\'ll be in touch soon.')}
                </p>
                <button
                    onClick={() => { setSubmitted(false); setPartImagePreview(null); setPartImageFile(null); }}
                    className="px-8 py-4 bg-amber-500 text-black font-black uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-all"
                >
                    {isRTL ? rawText('طلب جديد') : rawText('NEW REQUEST')}
                </button>
            </motion.div>
        </div>
    );

    return (
        <div className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            <div className="pt-24 px-6 max-w-7xl mx-auto">
                <ClientPageHeader
                    title={isRTL ? rawText('طلبات خاصة') : rawText('SPECIAL REQUESTS')}
                    subtitle={isRTL ? rawText('خدمة مخصصة لك') : rawText('PERSONALIZED SERVICE')}
                    icon={Shield}
                />
            </div>

            {/* ── VIDEO HERO ── */}
            <div className="relative h-[35vh] overflow-hidden mt-8 rounded-3xl mx-6 border border-white/5">
                <video autoPlay loop muted playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.25) contrast(1.2)' }}>
                    <source src="/videos/hero.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black" />
                <div className="absolute inset-0 flex items-end z-10">
                    <div className="max-w-7xl mx-auto w-full px-8 pb-10">
                        <span className="text-[9px] font-bold uppercase tracking-[0.5em] text-amber-500/70 block mb-2">
                            {isRTL ? rawText('خدمة حصرية') : rawText('EXCLUSIVE SERVICE')}
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black tracking-[-0.04em] uppercase">
                            {isRTL ? rawText('طلبات خاصة') : rawText('SPECIAL REQUESTS')}
                        </h1>
                    </div>
                </div>
            </div>

            {/* ── AMBIENT ── */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="orb w-125 h-125 -top-50 -right-25 opacity-10 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.4), transparent)' }} />
            </div>

            <main className="relative z-10 pt-10 pb-32 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* ── INFO PANEL ── */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <div className="p-7 bg-white/2 border border-white/8 rounded-3xl space-y-5">
                                <h3 className="text-xl font-black tracking-tight">
                                    {isRTL ? rawText('اطلب ما تريد') : rawText('Request Anything')}
                                </h3>
                                <p className="text-sm text-white/40 leading-relaxed">
                                    {isRTL
                                        ? rawText('سواء كنت تبحث عن سيارة بمواصفات محددة أو قطعة غيار نادرة، فريقنا جاهز لمساعدتك.')
                                        : rawText('Whether you need a specific car or a rare part, our team is ready to help.')}
                                </p>
                                <div className="space-y-3 pt-2">
                                    {[
                                        { icon: Car, title: isRTL ? rawText('توريد السيارات') : rawText('Vehicle Sourcing'), desc: isRTL ? rawText('بالمواصفات الدقيقة') : rawText('Exact specifications') },
                                        { icon: Settings, title: isRTL ? rawText('قطع الغيار') : rawText('Parts & Accessories'), desc: isRTL ? rawText('أصلية ومعدّلة') : rawText('OEM & Aftermarket') },
                                        { icon: Shield, title: isRTL ? rawText('فحص معتمد') : rawText('Certified Inspection'), desc: isRTL ? rawText('فحص شامل بكل التفاصيل') : rawText('Full detailed checks') },
                                    ].map((item) => (
                                        <div key={item.title} className="flex items-center gap-4 p-4 bg-white/2 rounded-xl border border-white/5 hover:border-amber-500/20 transition-all">
                                            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/15">
                                                <item.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold">{item.title}</h4>
                                                <p className="text-[10px] text-white/30 uppercase tracking-wider">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── FORM PANEL ── */}
                    <div className="lg:col-span-8">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                            <div className="bg-white/2 border border-white/8 rounded-3xl p-8 md:p-10">

                                {/* ── TABS ── */}
                                <div className="flex mb-8 p-1.5 bg-black/40 rounded-2xl border border-white/8 gap-2">
                                    {[
                                        { id: TAB_CAR, icon: Car, label: isRTL ? rawText('طلب سيارة') : rawText('CAR REQUEST') },
                                        { id: TAB_PARTS, icon: Settings, label: isRTL ? rawText('طلب قطع غيار') : rawText('PARTS REQUEST') },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id as 'car' | 'parts')}
                                            className={cn(
                                                'flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300',
                                                activeTab === tab.id
                                                    ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                    : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                                            )}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* ── نموذج طلب سيارة ── */}
                                <AnimatePresence mode="wait">
                                    {activeTab === TAB_CAR && (
                                        <motion.form
                                            key="car"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25 }}
                                            onSubmit={handleCarSubmit}
                                            className="space-y-5"
                                        >
                                            {/* الاسم والهاتف */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('الاسم الكامل') : rawText('FULL NAME')}</label>
                                                    <div className="relative">
                                                        <User className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="text" required
                                                            value={carForm.name}
                                                            onChange={e => setCarForm({ ...carForm, name: e.target.value })}
                                                            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('رقم الهاتف') : rawText('PHONE NUMBER')}</label>
                                                    <div className="relative">
                                                        <Phone className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="tel" required
                                                            value={carForm.phone}
                                                            onChange={e => setCarForm({ ...carForm, phone: e.target.value })}
                                                            placeholder="+966 ..."
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* اسم السيارة والموديل */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('اسم السيارة (الماركة)') : rawText('CAR NAME / MAKE')}</label>
                                                    <div className="relative">
                                                        <Car className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="text" required
                                                            value={carForm.carName}
                                                            onChange={e => setCarForm({ ...carForm, carName: e.target.value })}
                                                            placeholder={isRTL ? 'مثال: مرسيدس، BMW، كيا' : 'e.g. Mercedes, BMW, KIA'}
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('الموديل') : rawText('MODEL')}</label>
                                                    <input
                                                        type="text"
                                                        value={carForm.model}
                                                        onChange={e => setCarForm({ ...carForm, model: e.target.value })}
                                                        placeholder={isRTL ? 'مثال: S-Class، X5، Sonata' : 'e.g. S-Class, X5, Sonata'}
                                                        className={inputClass}
                                                    />
                                                </div>
                                            </div>

                                            {/* اللون والسنة */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* منتقي اللون */}
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('اللون') : rawText('COLOR')}</label>
                                                    <div className="relative" ref={colorPickerRef}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowColorPicker(!showColorPicker)}
                                                            className={cn(
                                                                inputClass,
                                                                'flex items-center gap-3 text-left cursor-pointer',
                                                                !carForm.colorName && 'text-white/25'
                                                            )}
                                                        >
                                                            {carForm.color ? (
                                                                <>
                                                                    <span
                                                                        className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                                                                        style={{ background: carForm.color }}
                                                                    />
                                                                    <span className="text-white text-sm">{carForm.colorName}</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Palette className="w-4 h-4 text-white/25" />
                                                                    <span>{isRTL ? rawText('اختر اللون') : rawText('Pick a color')}</span>
                                                                </>
                                                            )}
                                                            <ChevronDown className="w-4 h-4 text-white/30 mr-auto ml-auto" />
                                                        </button>

                                                        {/* قائمة الألوان */}
                                                        <AnimatePresence>
                                                            {showColorPicker && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 8 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    exit={{ opacity: 0, y: 8 }}
                                                                    className="absolute z-50 top-full mt-2 left-0 right-0 bg-[#111] border border-white/10 rounded-2xl p-4 shadow-2xl max-h-64 overflow-y-auto"
                                                                >
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {CAR_COLORS.map((c) => (
                                                                            <button
                                                                                key={c.hex}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setCarForm({ ...carForm, color: c.hex, colorName: isRTL ? c.name : c.nameEn });
                                                                                    setShowColorPicker(false);
                                                                                }}
                                                                                className={cn(
                                                                                    'flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-left',
                                                                                    carForm.color === c.hex && 'bg-white/10 border border-amber-500/30'
                                                                                )}
                                                                            >
                                                                                <span
                                                                                    className="w-6 h-6 rounded-full border border-white/20 shrink-0"
                                                                                    style={{ background: c.hex }}
                                                                                />
                                                                                <span className="text-xs text-white/70">
                                                                                    {isRTL ? c.name : c.nameEn}
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>

                                                {/* السنة */}
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('السنة') : rawText('YEAR')}</label>
                                                    <div className="relative">
                                                        <select
                                                            value={carForm.year}
                                                            onChange={e => setCarForm({ ...carForm, year: e.target.value })}
                                                            title={isRTL ? 'السنة' : 'Year'}
                                                            className={cn(inputClass, 'appearance-none cursor-pointer')}
                                                        >
                                                            <option value="" className="bg-black">{isRTL ? rawText('-- اختر السنة --') : rawText('-- Select Year --')}</option>
                                                            {YEARS.map(y => (
                                                                <option key={y} value={y} className="bg-black">{y}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronDown className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none', isRTL ? 'left-3.5' : 'right-3.5')} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* الوصف العام */}
                                            <div>
                                                <label className={labelClass}>{isRTL ? rawText('وصف عام / المواصفات المطلوبة') : rawText('GENERAL DESCRIPTION / SPECS')}</label>
                                                <div className="relative">
                                                    <FileText className={cn('absolute top-4 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                    <textarea
                                                        rows={4}
                                                        value={carForm.description}
                                                        onChange={e => setCarForm({ ...carForm, description: e.target.value })}
                                                        placeholder={isRTL ? 'صف المواصفات المطلوبة: المحرك، الإضافات، ناقل الحركة، أي تفاصيل أخرى...' : 'Describe specs: engine, options, transmission, any other details...'}
                                                        className={cn(inputClass, 'resize-none', isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                    />
                                                </div>
                                            </div>

                                            {/* زر الإرسال */}
                                            <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all disabled:opacity-60"
                                            >
                                                {loading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        {isRTL ? rawText('إرسال طلب السيارة') : rawText('SEND CAR REQUEST')}
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.form>
                                    )}

                                    {/* ── نموذج طلب قطع الغيار ── */}
                                    {activeTab === TAB_PARTS && (
                                        <motion.form
                                            key="parts"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25 }}
                                            onSubmit={handlePartsSubmit}
                                            className="space-y-5"
                                        >
                                            {/* الاسم والهاتف */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('الاسم الكامل') : rawText('FULL NAME')}</label>
                                                    <div className="relative">
                                                        <User className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="text" required
                                                            value={partsForm.name}
                                                            onChange={e => setPartsForm({ ...partsForm, name: e.target.value })}
                                                            placeholder={isRTL ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('رقم الهاتف') : rawText('PHONE NUMBER')}</label>
                                                    <div className="relative">
                                                        <Phone className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="tel" required
                                                            value={partsForm.phone}
                                                            onChange={e => setPartsForm({ ...partsForm, phone: e.target.value })}
                                                            placeholder="+966 ..."
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* اسم القطعة واسم السيارة */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('اسم القطعة') : rawText('PART NAME')}</label>
                                                    <div className="relative">
                                                        <Settings className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="text" required
                                                            value={partsForm.partName}
                                                            onChange={e => setPartsForm({ ...partsForm, partName: e.target.value })}
                                                            placeholder={isRTL ? 'مثال: فلتر زيت، كاميرا خلفية' : 'e.g. Oil filter, Rear camera'}
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>{isRTL ? rawText('اسم السيارة') : rawText('CAR NAME')}</label>
                                                    <div className="relative">
                                                        <Car className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                        <input
                                                            type="text"
                                                            value={partsForm.carName}
                                                            onChange={e => setPartsForm({ ...partsForm, carName: e.target.value })}
                                                            placeholder={isRTL ? 'مثال: كيا سونيتا 2020' : 'e.g. KIA Sonata 2020'}
                                                            className={cn(inputClass, isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* السنة */}
                                            <div>
                                                <label className={labelClass}>{isRTL ? rawText('سنة السيارة') : rawText('CAR YEAR')}</label>
                                                <div className="relative">
                                                    <select
                                                        value={partsForm.year}
                                                        onChange={e => setPartsForm({ ...partsForm, year: e.target.value })}
                                                        title={isRTL ? 'سنة السيارة' : 'Car Year'}
                                                        className={cn(inputClass, 'appearance-none cursor-pointer')}
                                                    >
                                                        <option value="" className="bg-black">{isRTL ? rawText('-- اختر سنة السيارة --') : rawText('-- Select Car Year --')}</option>
                                                        {YEARS.map(y => (
                                                            <option key={y} value={y} className="bg-black">{y}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none', isRTL ? 'left-3.5' : 'right-3.5')} />
                                                </div>
                                            </div>

                                            {/* وصف القطعة */}
                                            <div>
                                                <label className={labelClass}>{isRTL ? rawText('وصف القطعة / تفاصيل إضافية') : rawText('PART DESCRIPTION')}</label>
                                                <div className="relative">
                                                    <FileText className={cn('absolute top-4 w-4 h-4 text-white/20', isRTL ? 'right-3.5' : 'left-3.5')} />
                                                    <textarea
                                                        rows={3}
                                                        value={partsForm.description}
                                                        onChange={e => setPartsForm({ ...partsForm, description: e.target.value })}
                                                        placeholder={isRTL ? 'صف القطعة بشكل دقيق: رقم القطعة، الإصدار، أي تفاصيل مهمة...' : 'Part number, version, any important details...'}
                                                        className={cn(inputClass, 'resize-none', isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4')}
                                                    />
                                                </div>
                                            </div>

                                            {/* رفع صورة القطعة */}
                                            <div>
                                                <label className={labelClass}>{isRTL ? rawText('صورة القطعة (اختياري)') : rawText('PART IMAGE (OPTIONAL)')}</label>
                                                <div
                                                    className={cn(
                                                        'relative flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                                                        partImagePreview
                                                            ? 'border-amber-500/40 bg-amber-500/5'
                                                            : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/4'
                                                    )}
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        title={isRTL ? 'رفع صورة القطعة' : 'Upload part image'}
                                                        onChange={handlePartImageChange}
                                                    />
                                                    {partImagePreview ? (
                                                        <div className="relative w-full">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img src={partImagePreview} alt="part" className="w-full max-h-48 object-contain rounded-xl" />
                                                            <button
                                                                type="button"
                                                                onClick={e => { e.stopPropagation(); setPartImagePreview(null); setPartImageFile(null); }}
                                                                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-all"
                                                            >
                                                                <X className="w-3 h-3 text-white" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 text-white/20" />
                                                            <span className="text-xs text-white/30 text-center">
                                                                {isRTL ? rawText('اضغط لرفع صورة للقطعة') : rawText('Click to upload a part image')}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* زر الإرسال */}
                                            <motion.button
                                                type="submit"
                                                disabled={loading}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-[0.15em] rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_50px_rgba(245,158,11,0.5)] transition-all disabled:opacity-60"
                                            >
                                                {loading ? (
                                                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                                        className="w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                                                ) : (
                                                    <>
                                                        <Send className="w-4 h-4" />
                                                        {isRTL ? rawText('إرسال طلب القطعة') : rawText('SEND PARTS REQUEST')}
                                                    </>
                                                )}
                                            </motion.button>
                                        </motion.form>
                                    )}
                                </AnimatePresence>

                            </div>
                        </motion.div>
                    </div>

                </div>
            </main>
        </div>
    );
}
