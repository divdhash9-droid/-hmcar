'use client';

/**
 * صفحة تفاصيل السيارة في المعرض
 * تُعرض عند الضغط على أي سيارة في المعرض أو الصفحة الرئيسية
 * تحتوي على صور، المواصفات الكاملة، وزر طلب الشراء عبر الواتساب
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, MessageCircle, Fuel, Gauge, Settings2,
    Calendar, Car, Tag, CheckCircle, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { cn } from '@/lib/utils';

const toFiniteNumber = (value: unknown): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

export default function ShowroomCarDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, formatPriceFromUsd, currency } = useSettings();

    // حالة البيانات
    const [car, setCar] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [whatsapp, setWhatsapp] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);

    // جلب بيانات السيارة من الـ API
    useEffect(() => {
        const loadCar = async () => {
            try {
                setLoading(true);
                const res = await api.cars.getById(id as string);
                if (res?.success && res.data) {
                    setCar(res.data);
                } else {
                    setError(isRTL ? 'لم يتم العثور على السيارة' : 'Car not found');
                }
            } catch (err) {
                console.error('Failed to load car:', err);
                setError(isRTL ? 'حدث خطأ في تحميل البيانات' : 'Failed to load car data');
            } finally {
                setLoading(false);
            }
        };
        if (id) loadCar();
    }, [id, isRTL]);

    // جلب رقم الواتساب من الإعدادات العامة
    useEffect(() => {
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res.data?.socialLinks?.whatsapp) {
                setWhatsapp(res.data.socialLinks.whatsapp);
            } else {
                // [[ARABIC_COMMENT]] استخدم الرقم الكوري الافتراضي إذا لم يُعيّن الأدمن رقماً
                setWhatsapp('+821080880014');
            }
        }).catch(() => {
            setWhatsapp('+821080880014');
        });
    }, []);

    // إرسال رسالة واتساب مع فاتورة السيارة
    const handleWhatsappPurchase = async () => {
        if (!car) return;
        const carMake = typeof car.make === 'object' ? car.make?.name : car.make;
        const baseUsd = getBaseUsd(car);
        const price = formatPriceFromUsd
            ? formatPriceFromUsd(baseUsd)
            : (formatPrice ? formatPrice(Number(car.priceSar || car.price || 0)) : `${Number(car.priceSar || car.price || 0).toLocaleString()} SAR`);

        // [[ARABIC_COMMENT]] تسجيل الطلب في القاعدة وإنشاء إشعار للأدمن قبل النقل للواتساب
        try {
            let buyerId = null;
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try {
                        const u = JSON.parse(userJson);
                        buyerId = u?._id || u?.id;
                    } catch(e) {}
                }
            }

            await api.orders.create({
                buyerId: buyerId || null,
                items: [{
                    itemType: 'car',
                    refId: (car as any)._id || (car as any).id || id,
                    titleSnapshot: car.title,
                    qty: 1,
                    unitPriceSar: car.priceSar || car.price || 0
                }],
                pricing: {
                    grandTotalSar: car.priceSar || car.price || 0
                },
                channel: 'whatsapp',
                notes: `Clicked buy from Showroom car page`
            });
        } catch (err) {
            console.error('Failed to log order:', err);
        }

        // [[ARABIC_COMMENT]] بناء رسالة الواتساب مع كل تفاصيل السيارة
        const msg = isRTL
            ? `السلام عليكم،\n\n📋 *طلب شراء سيارة من المعرض*\n\n🚗 *معلومات السيارة:*\n• الاسم: ${car.title}\n• الماركة: ${carMake}\n• الموديل: ${car.model}\n• السنة: ${car.year}\n• اللون: ${car.color || 'غير محدد'}\n• المسافة: ${car.mileage ? car.mileage.toLocaleString() + ' كم' : 'غير محدد'}\n• نوع الوقود: ${car.fuelType || 'غير محدد'}\n• ناقل الحركة: ${car.transmission || 'غير محدد'}\n\n💰 *السعر: ${price}*\n\nأرجو التواصل معي للاستفسار عن هذه السيارة.`
            : `Hello,\n\n📋 *Car Purchase Request from Showroom*\n\n🚗 *Car Details:*\n• Name: ${car.title}\n• Make: ${carMake}\n• Model: ${car.model}\n• Year: ${car.year}\n• Color: ${car.color || 'N/A'}\n• Mileage: ${car.mileage ? car.mileage.toLocaleString() + ' km' : 'N/A'}\n• Fuel: ${car.fuelType || 'N/A'}\n• Transmission: ${car.transmission || 'N/A'}\n\n💰 *Price: ${price}*\n\nPlease contact me regarding this vehicle.`;

        // [[ARABIC_COMMENT]] استخدم الرقم المحفوظ أو الافتراضي - دائماً يعمل
        const phone = String(whatsapp || '+821080880014').replace(/\D/g, '');
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };


    // عرض شاشة التحميل
    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Navbar />
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin mx-auto" />
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.4em] font-black animate-pulse">
                        {isRTL ? 'جاري التحميل...' : 'LOADING...'}
                    </p>
                </div>
            </div>
        );
    }

    // عرض رسالة الخطأ
    if (error || !car) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <Navbar />
                <AlertCircle className="w-20 h-20 text-white/10" />
                <h1 className="text-2xl font-black uppercase text-white/30 tracking-widest">
                    {error || (isRTL ? 'لم يتم العثور على السيارة' : 'Car not found')}
                </h1>
                <button
                    onClick={() => router.back()}
                    className="px-8 py-4 bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-2xl text-[#c9a96e] text-[11px] font-black uppercase tracking-widest hover:bg-[#c9a96e]/20 transition-all"
                >
                    {isRTL ? 'العودة' : 'GO BACK'}
                </button>
            </div>
        );
    }

    const getBaseUsd = (payload: any) => {
        const baseUsd = toFiniteNumber(payload?.basePriceUsd);
        if (baseUsd && baseUsd > 0) return baseUsd;

        const priceUsd = toFiniteNumber(payload?.priceUsd);
        if (priceUsd && priceUsd > 0) return priceUsd;

        const priceSar = toFiniteNumber(payload?.priceSar ?? payload?.price);
        if (priceSar && priceSar > 0) return priceSar / Number(currency.usdToSar || 1);

        const priceKrw = toFiniteNumber(payload?.priceKrw);
        if (priceKrw && priceKrw > 0) return priceKrw / Number(currency.usdToKrw || 1);

        return 0;
    };

    const carMake = typeof car.make === 'object' ? car.make?.name : car.make;
    const images = car.images?.filter(Boolean) || [];
    const baseUsd = getBaseUsd(car);
    const displayPrice = formatPriceFromUsd
        ? formatPriceFromUsd(baseUsd)
        : (formatPrice ? formatPrice(Number(car.priceSar || car.price || 0)) : `${Number(car.priceSar || car.price || 0).toLocaleString()} SAR`);

    const specs = [
        { icon: Calendar, label: isRTL ? 'السنة' : 'YEAR', value: car.year },
        { icon: Gauge, label: isRTL ? 'المسافة' : 'MILEAGE', value: car.mileage ? `${car.mileage.toLocaleString()} ${isRTL ? 'كم' : 'KM'}` : '—' },
        { icon: Fuel, label: isRTL ? 'الوقود' : 'FUEL', value: car.fuelType || '—' },
        { icon: Settings2, label: isRTL ? 'ناقل الحركة' : 'TRANSMISSION', value: car.transmission || '—' },
        { icon: Car, label: isRTL ? 'الفئة' : 'CATEGORY', value: car.category || '—' },
        { icon: Tag, label: isRTL ? 'اللون' : 'COLOR', value: car.color || '—' },
    ];

    return (
        <div
            className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden"
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <Navbar />

            {/* خلفية زخرفية */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.05)_0%,transparent_60%)]" />
            </div>

            <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">

                {/* زر العودة */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.back()}
                    className="flex items-center gap-2 mb-10 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group w-fit"
                >
                    <ChevronLeft className={cn('w-4 h-4 transition-transform group-hover:-translate-x-1', isRTL && 'rotate-180 group-hover:translate-x-1')} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {isRTL ? 'العودة للمعرض' : 'BACK TO SHOWROOM'}
                    </span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* قسم الصور */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-4"
                    >
                        {/* الصورة الرئيسية */}
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
                            {images.length > 0 ? (
                                <Image
                                    src={images[activeImage]}
                                    alt={car.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-20 h-20 text-white/10" />
                                </div>
                            )}

                            {/* شارة الحالة */}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <span className="px-3 py-1 bg-[#c9a96e]/20 border border-[#c9a96e]/40 rounded-lg text-[10px] font-black text-[#c9a96e] uppercase tracking-widest backdrop-blur-md">
                                    {isRTL ? 'معرض' : 'SHOWROOM'}
                                </span>
                                {car.isActive && (
                                    <span className="px-3 py-1 bg-green-400/20 border border-green-400/40 rounded-lg text-[10px] font-black text-green-400 uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {isRTL ? 'متوفر' : 'AVAILABLE'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* الصور المصغرة */}
                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        className={cn(
                                            'relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                                            activeImage === idx
                                                ? 'border-[#c9a96e] shadow-[0_0_15px_rgba(201,169,110,0.4)]'
                                                : 'border-white/10 opacity-50 hover:opacity-80'
                                        )}
                                    >
                                        <Image src={img} alt={`صورة ${idx + 1}`} fill className="object-cover" unoptimized />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* قسم التفاصيل */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="space-y-8"
                    >
                        {/* العنوان والسعر */}
                        <div>
                            <div className="text-[11px] font-black text-[#c9a96e]/70 uppercase tracking-[0.4em] mb-2 italic">
                                {carMake}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-tight">
                                {car.title}
                            </h1>
                            <div className="text-3xl font-black text-[#c9a96e]">
                                {displayPrice}
                            </div>
                        </div>

                        {/* المواصفات */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {specs.map((spec, i) => (
                                <motion.div
                                    key={spec.label}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 + 0.2 }}
                                    className="bg-white/[0.02] border border-white/8 rounded-2xl p-4 space-y-2 hover:border-[#c9a96e]/20 transition-all"
                                >
                                    <spec.icon className="w-4 h-4 text-[#c9a96e]/60" />
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{spec.label}</div>
                                    <div className="text-sm font-black text-white/80 capitalize">{spec.value}</div>
                                </motion.div>
                            ))}
                        </div>

                        {/* الوصف */}
                        {car.description && (
                            <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-6">
                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">
                                    {isRTL ? 'الوصف' : 'DESCRIPTION'}
                                </div>
                                <p className="text-white/60 text-sm leading-relaxed">{car.description}</p>
                            </div>
                        )}

                        {/* أزرار الاضافة لطلباتي + واتساب */}
                        <div className="space-y-4 pt-4">
                            {/* زر الشراء عبر الواتساب */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleWhatsappPurchase}
                                className="w-full py-5 bg-green-500/90 hover:bg-green-500 rounded-2xl text-black font-black uppercase text-[13px] tracking-[0.3em] shadow-[0_0_40px_rgba(34,197,94,0.3)] hover:shadow-[0_0_60px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-3"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? 'طلب الشراء عبر واتساب' : 'BUY VIA WHATSAPP'}
                            </motion.button>

                            {/* زر عرض الفاتورة */}
                            <button
                                onClick={() => setShowInvoice(true)}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all"
                            >
                                {isRTL ? 'عرض الفاتورة' : 'VIEW INVOICE'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* [[ARABIC_COMMENT]] نافذة الفاتورة */}
            <AnimatePresence>
                {showInvoice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                        onClick={() => setShowInvoice(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden"
                        >
                            {/* رأس الفاتورة */}
                            <div className="p-8 border-b border-white/5 text-center bg-[#c9a96e]/5">
                                <div className="text-2xl font-black text-[#c9a96e] mb-1">HM CAR</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-[0.3em]">
                                    {isRTL ? 'فاتورة مبدئية' : 'PRELIMINARY INVOICE'}
                                </div>
                            </div>

                            {/* تفاصيل الفاتورة */}
                            <div className="p-8 space-y-4">
                                {[
                                    { label: isRTL ? 'السيارة' : 'VEHICLE', value: car.title },
                                    { label: isRTL ? 'الماركة' : 'MAKE', value: carMake },
                                    { label: isRTL ? 'الموديل' : 'MODEL', value: car.model },
                                    { label: isRTL ? 'السنة' : 'YEAR', value: car.year },
                                    { label: isRTL ? 'اللون' : 'COLOR', value: car.color || '—' },
                                    { label: isRTL ? 'ناقل الحركة' : 'TRANSMISSION', value: car.transmission || '—' },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{item.label}</span>
                                        <span className="text-[12px] font-bold text-white/80">{item.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-4">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#c9a96e]">
                                        {isRTL ? 'السعر الإجمالي' : 'TOTAL PRICE'}
                                    </span>
                                    <span className="text-xl font-black text-[#c9a96e]">{displayPrice}</span>
                                </div>
                            </div>

                            {/* أزرار الفاتورة */}
                            <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleWhatsappPurchase}
                                    className="py-4 bg-green-500/90 rounded-xl text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    {isRTL ? 'شراء' : 'BUY'}
                                </button>
                                <button
                                    onClick={() => setShowInvoice(false)}
                                    className="py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 font-black text-[10px] uppercase tracking-widest"
                                >
                                    {isRTL ? 'إغلاق' : 'CLOSE'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
