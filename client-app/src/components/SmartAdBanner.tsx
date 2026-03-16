'use client';

/**
 * الشريط الإعلاني الذكي - SmartAdBanner
 * ─────────────────────────────────────────
 * يُعرض في الصفحة الرئيسية ويعمل وفق إعدادات الأدمن:
 * - إذا فعّل الأدمن "المزاد المباشر": يعرض سيارات المزادات المباشرة
 * - إذا اختار الأدمن "معرض":           يعرض سيارات المعرض المحدد
 * - عند النقر على سيارة:               تظهر نافذة مواصفاتها
 * - زر الشراء/المزايدة:                 (غير مسجل) → صفحة تسجيل الدخول
 *                                       (مسجل)     → واتساب
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X, ArrowLeft, ArrowRight, ExternalLink, Zap,
    Car, Radio, ChevronRight, MessageCircle,
    Fuel, Gauge, Calendar, Tag, LogIn
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useSettings } from '@/lib/SettingsContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// ── نوع السيارة المستخدمة في الشريط ──
interface BannerCar {
    id: string;
    title?: string;
    name?: string;
    images?: string[];
    price?: number | string;
    year?: number | string;
    make?: string | { name?: string };
    model?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    source: 'live' | 'korean' | 'hmcar'; // مصدر السيارة
    auctionUrl?: string;   // رابط المزاد إن وُجد
}

// ── نوع إعدادات الإعلانات ──
interface AdvertisingSettings {
    showLiveAuction?: boolean;
    showroomSource?: 'none' | 'korean' | 'hmcar' | 'both';
    bannerLabel?: string;
    bannerLabelEn?: string;
}

// ── استخراج اسم الشركة الصانعة بشكل نظيف ──
const getMakeName = (make: BannerCar['make']): string => {
    if (!make) return '';
    if (typeof make === 'object') return make.name || '';
    return make;
};

// ── مكوّن نافذة مواصفات السيارة ──
function CarModal({
    car,
    onClose,
    isRTL,
    formatPrice,
    whatsappNumber,
    isLoggedIn,
}: {
    car: BannerCar;
    onClose: () => void;
    isRTL: boolean;
    formatPrice: (p: number) => string;
    whatsappNumber?: string;
    isLoggedIn: boolean;
}) {
    const router = useRouter();
    const [imgIndex, setImgIndex] = useState(0);
    const images = car.images || [];

    // ── سلوك زر الشراء ──
    const handleBuy = () => {
        if (!isLoggedIn) {
            // غير مسجل → صفحة تسجيل الدخول
            router.push('/auth/login');
            onClose();
            return;
        }
        // مسجل → واتساب
        const phone = whatsappNumber ? String(whatsappNumber).replace(/\D/g, '') : '';
        const carTitle = car.title || car.name || 'سيارة';
        const msg = isRTL
            ? `مرحباً، أودّ الاستفسار عن ${carTitle} (${car.year || ''}) - السعر: ${formatPrice(Number(car.price || 0))}`
            : `Hello, I'm interested in ${carTitle} (${car.year || ''}) - Price: ${formatPrice(Number(car.price || 0))}`;
        const url = phone
            ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
            : `https://wa.me/?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: '100%', scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: '100%', scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full md:max-w-2xl bg-black border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* زر الإغلاق */}
                <button
                    onClick={onClose}
                    title={isRTL ? 'إغلاق' : 'Close'}
                    className="absolute top-5 left-5 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {/* ── معرض الصور ── */}
                <div className="relative w-full aspect-[16/9] bg-black/60 overflow-hidden">
                    {images.length > 0 ? (
                        <>
                            <Image
                                src={images[imgIndex]}
                                alt={car.title || 'سيارة'}
                                fill
                                className="object-cover"
                            />
                            {/* أزرار التنقل بين الصور */}
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}
                                        title={isRTL ? 'السابقة' : 'Previous'}
                                        className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setImgIndex(i => (i + 1) % images.length)}
                                        title={isRTL ? 'التالية' : 'Next'}
                                        className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                                    >
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </button>
                                    {/* نقاط الصور */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {images.slice(0, 8).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setImgIndex(i)}
                                                title={`صورة ${i + 1}`}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIndex ? 'bg-accent-gold w-4' : 'bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        // صورة بديلة عند غياب الصور
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-16 h-16 text-white/10" />
                        </div>
                    )}

                    {/* شارة المصدر */}
                    <div className="absolute top-5 right-5">
                        {car.source === 'live' ? (
                            <span className="px-3 py-1 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Radio className="w-3 h-3 animate-pulse" /> {isRTL ? 'مزاد مباشر' : 'LIVE AUCTION'}
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-accent-gold/20 border border-accent-gold/40 text-accent-gold text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                <Car className="w-3 h-3" /> {car.source === 'korean' ? (isRTL ? 'كوري' : 'KOREAN') : 'HM CAR'}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── تفاصيل السيارة ── */}
                <div className="p-6 space-y-5">
                    {/* العنوان والسعر */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                {car.title || car.name || (isRTL ? 'سيارة' : 'Car')}
                            </h3>
                            <p className="text-white/40 text-sm mt-1">{getMakeName(car.make)} {car.model || ''}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-2xl font-black text-accent-gold">
                                {formatPrice(Number(car.price || 0))}
                            </p>
                        </div>
                    </div>

                    {/* المواصفات */}
                    <div className="grid grid-cols-2 gap-3">
                        {car.year && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Calendar className="w-4 h-4 text-accent-gold flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'الموديل' : 'Year'}</p>
                                    <p className="text-sm font-bold text-white">{car.year}</p>
                                </div>
                            </div>
                        )}
                        {car.mileage !== undefined && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Gauge className="w-4 h-4 text-accent-gold flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'الكيلومترات' : 'Mileage'}</p>
                                    <p className="text-sm font-bold text-white">{Number(car.mileage).toLocaleString()} km</p>
                                </div>
                            </div>
                        )}
                        {car.fuelType && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Fuel className="w-4 h-4 text-accent-gold flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'الوقود' : 'Fuel'}</p>
                                    <p className="text-sm font-bold text-white">{car.fuelType}</p>
                                </div>
                            </div>
                        )}
                        {car.transmission && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                <Tag className="w-4 h-4 text-accent-gold flex-shrink-0" />
                                <div>
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{isRTL ? 'ناقل الحركة' : 'Transmission'}</p>
                                    <p className="text-sm font-bold text-white">{car.transmission}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-3 pt-2">
                        {/* زر الشراء/المزايدة */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBuy}
                            className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 bg-accent-gold text-black shadow-[0_0_30px_rgba(201,169,110,0.3)] hover:shadow-[0_0_50px_rgba(201,169,110,0.5)] transition-all"
                        >
                            {isLoggedIn ? (
                                <>
                                    <MessageCircle className="w-5 h-5" />
                                    {isRTL ? 'تواصل واتساب' : 'WhatsApp'}
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    {isRTL ? 'تسجيل الدخول للشراء' : 'Login to Buy'}
                                </>
                            )}
                        </motion.button>

                        {/* زر عرض التفاصيل الكاملة */}
                        {car.source !== 'live' && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    router.push(`/cars/${car.id}`);
                                    onClose();
                                }}
                                className="px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── المكوّن الرئيسي: الشريط الإعلاني الذكي ──
export default function SmartAdBanner() {
    const { isRTL } = useLanguage();
    const { isLoggedIn } = useAuth();
    const { formatPrice, socialLinks } = useSettings();
    const router = useRouter();

    // ── الحالة ──
    const [adSettings, setAdSettings] = useState<AdvertisingSettings>({});
    const [cars, setCars] = useState<BannerCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<BannerCar | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [showroomType, setShowroomType] = useState<'live' | 'showroom'>('showroom');

    // ── تحميل إعدادات الإعلانات وسيارات الشريط ──
    useEffect(() => {
        const loadAllData = async () => {
            try {
                // أولاً: جلب إعدادات الإعلانات
                const settingsRes = await api.settings.getPublic();
                const adsConfig: AdvertisingSettings = settingsRes?.data?.advertisingSettings || {};
                setAdSettings(adsConfig);

                const allCars: BannerCar[] = [];

                // ثانياً: جلب سيارات المزاد المباشر إذا كانت مفعلة
                if (adsConfig.showLiveAuction) {
                    try {
                        const liveRes = await api.liveAuctions.list({ limit: 20 });
                        if (liveRes.success && liveRes.data) {
                            const liveCars = liveRes.data.flatMap((session: any) =>
                                (session.cars || []).map((c: any) => ({
                                    id: c._id || c.id || session._id,
                                    title: c.title || session.title,
                                    name: c.name,
                                    images: c.images || [],
                                    price: c.price || 0,
                                    year: c.year,
                                    make: c.make,
                                    model: c.model,
                                    mileage: c.mileage,
                                    fuelType: c.fuelType,
                                    transmission: c.transmission,
                                    source: 'live' as const,
                                    auctionUrl: `/auctions/live/${session._id}`,
                                }))
                            );
                            // إضافة الجلسات نفسها كعناصر إذا لم يكن لديها سيارات محددة
                            if (liveCars.length === 0) {
                                liveRes.data.forEach((session: any) => {
                                    allCars.push({
                                        id: session._id,
                                        title: session.title,
                                        images: session.cars?.[0]?.images || [],
                                        price: 0,
                                        source: 'live',
                                        auctionUrl: `/auctions/live/${session._id}`,
                                    });
                                });
                            } else {
                                allCars.push(...liveCars);
                            }
                        }
                    } catch (e) {
                        console.warn('فشل جلب المزادات المباشرة:', e);
                    }
                    setShowroomType('live');
                }

                // ثالثاً: جلب سيارات المعرض المحدد
                const src = adsConfig.showroomSource || 'none';
                if (src !== 'none') {
                    setShowroomType('showroom');
                    try {
                        if (src === 'hmcar' || src === 'both') {
                            // سيارات معرض HM Car من قاعدة البيانات الرئيسية
                            const carsRes = await api.cars.list({ status: 'active', limit: 30 });
                            if (carsRes.success && carsRes.data?.cars) {
                                carsRes.data.cars.forEach((c: any) => {
                                    allCars.push({
                                        id: c._id || c.id,
                                        title: c.title,
                                        name: c.name,
                                        images: c.images || [],
                                        price: c.price || 0,
                                        year: c.year,
                                        make: c.make,
                                        model: c.model,
                                        mileage: c.mileage,
                                        fuelType: c.fuelType,
                                        transmission: c.transmission,
                                        source: 'hmcar',
                                    });
                                });
                            }
                        }
                        if (src === 'korean' || src === 'both') {
                            // سيارات المعرض الكوري (Encar)
                            const korRes = await api.showroom.getCars(1);
                            // [[ARABIC_COMMENT]] المعرض الكوري يرجع البيانات كمصفوفة مباشرة في data
                            const korCars = Array.isArray(korRes.data) ? korRes.data : (korRes.data?.cars || []);
                            
                            if (korRes.success && korCars.length > 0) {
                                korCars.slice(0, 20).forEach((c: any) => {
                                    allCars.push({
                                        id: c._id || c.id || String(Math.random()),
                                        title: c.title || c.name,
                                        name: c.name,
                                        images: c.images || [],
                                        price: c.price || c.priceKrw || 0,
                                        year: c.year,
                                        make: c.make,
                                        model: c.model,
                                        mileage: c.mileage,
                                        fuelType: c.fuelType,
                                        transmission: c.transmission,
                                        source: 'korean',
                                    });
                                });
                            }
                        }
                    } catch (e) {
                        console.warn('فشل جلب سيارات المعرض:', e);
                    }
                }

                setCars(allCars);
            } catch (err) {
                console.error('فشل تحميل بيانات الشريط الإعلاني:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    // ── إذا لم يكن هناك سيارات أو إعدادات، لا نُظهر الشريط ──
    const isEnabled = adSettings.showLiveAuction || (adSettings.showroomSource && adSettings.showroomSource !== 'none');
    if (!isEnabled || (!loading && cars.length === 0)) return null;

    // ── نسخة مضاعفة للتمرير اللانهائي ──
    const displayCars = cars.length > 0 ? [...cars, ...cars] : [];

    // ── رابط "عرض الكل" ──
    const viewAllHref = showroomType === 'live' ? '/auctions/live' : '/cars';

    // ── نص الشعار ──
    const bannerLabel = isRTL
        ? (adSettings.bannerLabel || '⚡ عروض حصرية')
        : (adSettings.bannerLabelEn || '⚡ EXCLUSIVE DEALS');

    return (
        <>
            {/* ── الشريط الإعلاني ── */}
            <section
                className="relative z-20 overflow-hidden my-8"
                dir={isRTL ? 'rtl' : 'ltr'}
            >
                {/* خلفية الشريط */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-accent-gold/[0.03] to-black" />
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

                {/* ── رأس الشريط: الشعار + زر "عرض الكل" ── */}
                <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2">
                        {adSettings.showLiveAuction && showroomType === 'live' ? (
                            <Radio className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                        ) : (
                            <Zap className="w-4 h-4 text-accent-gold" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">
                            {bannerLabel}
                        </span>
                    </div>
                    {/* زر "عرض الكل" */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => router.push(viewAllHref)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:border-accent-gold/30 hover:bg-white/10 transition-all group"
                    >
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/80 transition-colors">
                            {isRTL ? 'عرض الكل' : 'View All'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-accent-gold transition-colors" />
                    </motion.button>
                </div>

                {/* ── بطاقات السيارات المتحركة ── */}
                <div
                    className="py-4 border-y border-white/[0.05] overflow-hidden"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {loading ? (
                        // مؤشر التحميل
                        <div className="flex gap-4 px-6">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex-shrink-0 w-48 h-24 rounded-2xl bg-white/5 animate-pulse border border-white/5"
                                />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            className="flex gap-4 w-max px-6"
                            animate={{ x: isPaused ? undefined : (isRTL ? [0, cars.length * 210] : [0, -(cars.length * 210)]) }}
                            transition={{
                                duration: Math.max(15, cars.length * 6),
                                repeat: Infinity,
                                ease: 'linear',
                                repeatType: 'loop',
                            }}
                            style={{ willChange: 'transform' }}
                        >
                            {displayCars.map((car, idx) => (
                                <motion.button
                                    key={`${car.id}-${idx}`}
                                    onClick={() => setSelectedCar(car)}
                                    whileHover={{ y: -4, scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex-shrink-0 relative w-52 h-28 rounded-2xl overflow-hidden border border-white/10 hover:border-accent-gold/40 transition-colors group cursor-pointer"
                                    title={car.title || car.name || ''}
                                >
                                    {/* صورة السيارة */}
                                    {car.images && car.images.length > 0 ? (
                                        <Image
                                            src={car.images[0]}
                                            alt={car.title || 'سيارة'}
                                            fill
                                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                            <Car className="w-8 h-8 text-white/20" />
                                        </div>
                                    )}

                                    {/* طبقة التدرج السفلية */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                    {/* معلومات السيارة */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                        <p className="text-[9px] font-black uppercase text-white/60 truncate">
                                            {car.title || car.name || (isRTL ? 'سيارة' : 'Car')}
                                        </p>
                                        <p className="text-[11px] font-black text-accent-gold">
                                            {formatPrice(Number(car.price || 0))}
                                        </p>
                                    </div>

                                    {/* شارة المزاد المباشر */}
                                    {car.source === 'live' && (
                                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ── نافذة مواصفات السيارة ── */}
            <AnimatePresence>
                {selectedCar && (
                    <CarModal
                        car={selectedCar}
                        onClose={() => setSelectedCar(null)}
                        isRTL={isRTL}
                        formatPrice={formatPrice}
                        whatsappNumber={(socialLinks as any)?.whatsapp}
                        isLoggedIn={isLoggedIn}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
