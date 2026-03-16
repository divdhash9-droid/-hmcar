'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    ChevronLeft, MessageCircle, Fuel, Gauge, Settings2,
    Calendar, Car, Tag, CheckCircle, AlertCircle, Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { WhatsAppService } from '@/lib/WhatsAppService';
import { cn } from '@/lib/utils';

const DEFAULT_WHATSAPP = '+821080880014';
const CURRENCY_SAR = 'SAR';
const rawText = (value: string) => value;

const toFiniteNumber = (value: unknown): number | null => {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

export default function LocalCarDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, formatPriceFromUsd, currency } = useSettings();

    const [car, setCar] = useState<{
        title: string;
        make: string | { name: string } | null;
        model: string;
        year: number;
        mileage?: number;
        price?: number;
        priceSar?: number;
        priceUsd?: number;
        basePriceUsd?: number;
        priceKrw?: number;
        fuelType?: string;
        transmission?: string;
        category?: string;
        color?: string;
        description?: string;
        images?: string[];
        isActive?: boolean;
        agency?: {
            name: string;
            logoUrl?: string;
            location?: string;
        };
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImage, setActiveImage] = useState(0);
    const [whatsapp, setWhatsapp] = useState('');
    const [showInvoice, setShowInvoice] = useState(false);

    const loadCar = useCallback(async () => {
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
    }, [id, isRTL]); // Added id and isRTL as dependencies

    useEffect(() => {
        if (id) loadCar();
    }, [id, loadCar]); // Added loadCar as dependency

    useEffect(() => {
        api.settings.getPublic().then((res: { success: boolean; data?: { socialLinks?: { whatsapp?: string } } }) => {
            if (res?.success && res.data?.socialLinks?.whatsapp) {
                setWhatsapp(res.data.socialLinks.whatsapp);
            } else {
                setWhatsapp(DEFAULT_WHATSAPP);
            }
        }).catch(() => {
            setWhatsapp(DEFAULT_WHATSAPP);
        });
    }, []);

    const handleWhatsappPurchase = async () => {
        if (!car) return;
        
        // [[ARABIC_COMMENT]] تسجيل حدث التحويل في Google Analytics
        ReactGA.event({
            category: 'Conversion',
            action: 'WhatsApp_Purchase_Click',
            label: car.title,
            value: Number(car.price || 0)
        });

        // [[ARABIC_COMMENT]] تسجيل الطلب في القاعدة وإنشاء إشعار للأدمن قبل النقل للواتساب
        try {
            let buyerId = null;
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try {
                        const u = JSON.parse(userJson);
                        buyerId = u?._id || u?.id;
                    } catch { }
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
                notes: `Clicked buy from Korean car page`
            });
        } catch (err) {
            console.error('Failed to log order:', err);
        }

        const url = WhatsAppService.generateCarLink(car, whatsapp || DEFAULT_WHATSAPP, isRTL, formatPrice);
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Navbar />
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-2 border-cinematic-neon-gold/30 border-t-cinematic-neon-gold rounded-full animate-spin mx-auto" />
                    <p className="text-white/30 text-[11px] uppercase tracking-[0.4em] font-black animate-pulse">
                        {isRTL ? rawText('جاري التحميل...') : rawText('LOADING...')}
                    </p>
                </div>
            </div>
        );
    }

    if (error || !car) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <Navbar />
                <AlertCircle className="w-20 h-20 text-white/10" />
                <h1 className="text-2xl font-black uppercase text-white/30 tracking-widest">
                    {error || (isRTL ? rawText('لم يتم العثور على السيارة') : rawText('Car not found'))}
                </h1>
                <button
                    onClick={() => router.back()}
                    className="px-8 py-4 bg-cinematic-neon-gold/10 border border-cinematic-neon-gold/30 rounded-2xl text-cinematic-neon-gold text-[11px] font-black uppercase tracking-widest hover:bg-cinematic-neon-gold/20 transition-all"
                >
                    {isRTL ? rawText('العودة') : rawText('GO BACK')}
                </button>
            </div>
        );
    }

    const getBaseUsd = (payload: { basePriceUsd?: number; priceUsd?: number; priceSar?: number; price?: number; priceKrw?: number }) => {
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
        : (formatPrice ? formatPrice(Number(car.priceSar || car.price || 0)) : `${Number(car.priceSar || car.price || 0).toLocaleString()} ${CURRENCY_SAR}`);

    const specs = [
        { icon: Calendar, label: isRTL ? 'السنة' : 'YEAR', value: car.year },
        { icon: Gauge, label: isRTL ? 'المسافة' : 'MILEAGE', value: car.mileage ? `${car.mileage.toLocaleString()} ${isRTL ? 'كم' : 'KM'}` : '—' },
        { icon: Fuel, label: isRTL ? 'الوقود' : 'FUEL', value: car.fuelType || '—' },
        { icon: Settings2, label: isRTL ? 'ناقل الحركة' : 'TRANSMISSION', value: car.transmission || '—' },
        { icon: Car, label: isRTL ? 'الفئة' : 'CATEGORY', value: car.category || '—' },
        { icon: Tag, label: isRTL ? 'اللون' : 'COLOR', value: car.color || '—' },
    ];

    return (
        <div className="relative min-h-screen bg-cinematic-darker text-white overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.05)_0%,transparent_60%)]" />
            </div>

            <main className="relative z-10 pt-28 pb-24 px-4 sm:px-6 max-w-7xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => router.push('/cars')}
                    className="flex items-center gap-2 mb-10 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group w-fit"
                >
                    <ChevronLeft className={cn('w-4 h-4 transition-transform group-hover:-translate-x-1', isRTL && 'rotate-180 group-hover:translate-x-1')} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                        {isRTL ? rawText('العودة إلى معرض HM CAR') : rawText('Back to HM CAR Showroom')}
                    </span>
                </motion.button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-4">
                        <div className="relative aspect-4/3 rounded-3xl overflow-hidden border border-white/10 bg-white/2">
                            {images.length > 0 ? (
                                <Image src={images[activeImage]} alt={car.title} fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-20 h-20 text-white/10" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4 flex gap-2">
                                <span className="px-3 py-1 bg-cinematic-neon-gold/20 border border-cinematic-neon-gold/40 rounded-lg text-[10px] font-black text-cinematic-neon-gold uppercase tracking-widest backdrop-blur-md">
                                    {isRTL ? rawText('متجرنا') : rawText('STORE')}
                                </span>
                                {car.isActive && (
                                    <span className="px-3 py-1 bg-green-400/20 border border-green-400/40 rounded-lg text-[10px] font-black text-green-400 uppercase tracking-widest backdrop-blur-md flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        {isRTL ? rawText('متوفر') : rawText('AVAILABLE')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(idx)}
                                        aria-label={isRTL ? `عرض الصورة ${idx + 1}` : `View image ${idx + 1}`}
                                        className={cn(
                                            'relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                                            activeImage === idx ? 'border-cinematic-neon-gold shadow-[0_0_15px_rgba(201,169,110,0.4)]' : 'border-white/10 opacity-50 hover:opacity-80'
                                        )}
                                    >
                                        <Image src={img} alt={`img ${idx + 1}`} fill className="object-cover" unoptimized />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="space-y-8">
                        <div>
                            <div className="text-[11px] font-black text-cinematic-neon-gold/70 uppercase tracking-[0.4em] mb-2 italic">{carMake}</div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4 leading-tight">{car.title}</h1>
                            <div className="text-3xl font-black text-cinematic-neon-gold">{displayPrice}</div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {specs.map((spec) => (
                                <div key={spec.label} className="bg-white/2 border border-white/8 rounded-2xl p-4 space-y-2 hover:border-cinematic-neon-gold/20 transition-all">
                                    <spec.icon className="w-4 h-4 text-cinematic-neon-gold/60" />
                                    <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{spec.label}</div>
                                    <div className="text-sm font-black text-white/80 capitalize">{spec.value}</div>
                                </div>
                            ))}
                        </div>

                        {car.description && (
                            <div className="bg-white/2 border border-white/8 rounded-2xl p-6">
                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 mb-3">{isRTL ? rawText('الوصف') : rawText('DESCRIPTION')}</div>
                                <p className="text-white/60 text-sm leading-relaxed">{car.description}</p>
                            </div>
                        )}

                        {car.agency && (
                            <div className="bg-white/2 border border-cinematic-neon-gold/10 rounded-2xl p-6 flex items-center gap-6 hover:border-cinematic-neon-gold/30 transition-all group">
                                {car.agency.logoUrl ? (
                                    <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden bg-black/40 p-3 border border-white/5 group-hover:border-cinematic-neon-gold/20 transition-colors">
                                        <Image src={car.agency.logoUrl} alt={car.agency.name} fill className="object-contain p-2" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-20 h-20 shrink-0 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
                                        <Car className="w-8 h-8 text-white/10" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-3 h-3 text-cinematic-neon-gold" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-cinematic-neon-gold/70 italic">
                                            {isRTL ? rawText('الوكالة المعتمدة') : rawText('OFFICIAL AGENCY')}
                                        </span>
                                    </div>
                                    <div className="text-xl font-black italic uppercase tracking-tight text-white">{car.agency.name}</div>
                                    {car.agency.location && (
                                        <div className="text-[10px] text-white/40 font-medium ">{car.agency.location}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleWhatsappPurchase} className="w-full py-5 bg-green-500/90 hover:bg-green-500 rounded-2xl text-black font-black uppercase text-[13px] tracking-[0.3em] shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center justify-center gap-3">
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? rawText('شراء عبر واتساب') : rawText('PURCHASE VIA WHATSAPP')}
                            </motion.button>
                            <button onClick={() => setShowInvoice(true)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white/10 hover:text-white transition-all">
                                {isRTL ? rawText('عرض الفاتورة') : rawText('VIEW INVOICE')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </main>

            <AnimatePresence>
                {showInvoice && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-100 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowInvoice(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()} className="bg-cinematic-dark border border-white/10 rounded-3xl w-full max-w-md overflow-hidden">
                            <div className="p-8 border-b border-white/5 text-center bg-cinematic-neon-gold/5">
                                <div className="text-2xl font-black text-cinematic-neon-gold mb-1">{rawText('HM CAR')}</div>
                                <div className="text-[10px] text-white/40 uppercase tracking-[0.3em]">{isRTL ? rawText('فاتورة مبدئية') : rawText('PRELIMINARY INVOICE')}</div>
                            </div>
                            <div className="p-8 space-y-4">
                                {[
                                    { label: isRTL ? rawText('السيارة') : rawText('VEHICLE'), value: car.title },
                                    { label: isRTL ? rawText('الماركة') : rawText('MAKE'), value: carMake },
                                    { label: isRTL ? rawText('الموديل') : rawText('MODEL'), value: car.model },
                                    { label: isRTL ? rawText('السنة') : rawText('YEAR'), value: car.year },
                                    { label: isRTL ? rawText('اللون') : rawText('COLOR'), value: car.color || rawText('—') },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{item.label}</span>
                                        <span className="text-[12px] font-bold text-white/80">{item.value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center pt-4">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-cinematic-neon-gold">{isRTL ? rawText('السعر') : rawText('PRICE')}</span>
                                    <span className="text-xl font-black text-cinematic-neon-gold">{displayPrice}</span>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/5 grid grid-cols-2 gap-3">
                                <button onClick={handleWhatsappPurchase} className="py-4 bg-green-500/90 rounded-xl text-black font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                    <MessageCircle className="w-4 h-4" />
                                    {isRTL ? rawText('تأكيد') : rawText('CONFIRM')}
                                </button>
                                <button onClick={() => setShowInvoice(false)} className="py-4 bg-white/5 border border-white/10 rounded-xl text-white/60 font-black text-[10px] uppercase tracking-widest">
                                    {isRTL ? rawText('إلغاء') : rawText('CANCEL')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
