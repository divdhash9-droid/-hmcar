'use client';

/* oxlint-disable react-native/no-raw-text, tailwindcss/no-unnecessary-arbitrary-value */
/* eslint-disable */

/**
 * صفحة المعرض - The Showroom
 * ──────────────────────────
 * تعرض سيارات كورية من موقع Encar.com مترجمة للعربية.
 * عند اختيار أي سيارة يُفتح واتساب الأدمن مع بيانات السيارة جاهزة.
 * رابط المصدر يُتحكم فيه من لوحة الأدمن.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import {
    Car, MessageCircle, Search,
    ChevronLeft, ChevronRight, RefreshCw,
    MapPin, Gauge, Fuel, Settings2, Sparkles,
    ExternalLink, X, ArrowLeft, Heart, ShoppingBag
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api';
import { WhatsAppService } from '@/lib/WhatsAppService';
import Image from 'next/image';
import CurrencySwitcher from '@/components/CurrencySwitcher';
import { useRouter } from 'next/navigation';

const rawText = (value: string) => value;

// ─── نوع بيانات السيارة الكورية ───
interface KoreanCar {
    id: string;
    manufacturer: string;
    manufacturerAr: string;
    model: string;
    badge: string;
    title: string;
    titleKr: string;
    year: number;
    mileage: number;
    priceKrw: number;
    priceUsd?: number;
    priceSar?: number;
    fuel: string;
    fuelAr: string;
    transmission: string;
    transmissionAr: string;
    region: string;
    regionAr: string;
    imageUrl: string | null;
    images?: string[];
    image?: string | null;
    encarUrl: string;
    isInspected: boolean;
}

function resolveCarImage(car: KoreanCar): string | null {
    const candidate = car.imageUrl || car.images?.[0] || car.image || null;
    if (!candidate || typeof candidate !== 'string') return null;
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : null;
}

// ─── تنسيق الأرقام ───
function formatMileage(km: number): string {
    if (km >= 10000) return `${(km / 10000).toFixed(1)} 만km`;
    return `${km.toLocaleString()} km`;
}

// ─── كارد السيارة ───
function CarCard({ car, onContact, onViewDetails, priceText }: {
    car: KoreanCar;
    onContact: (car: KoreanCar) => void;
    onViewDetails: (car: KoreanCar) => void;
    priceText: string;
}) {
    const [imgErr, setImgErr] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [isInCart, setIsInCart] = useState(false);
    const carImage = resolveCarImage(car);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            className="group bg-cinematic-dark border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
        >
            {/* ─ الجزء القابل للنقر للتفاصيل ─ */}
            <div className="cursor-pointer flex-1 flex flex-col" onClick={() => onViewDetails(car)}>
                {/* ─ صورة السيارة ─ */}
                <div className="relative h-48 bg-zinc-900 overflow-hidden">
                    {carImage && !imgErr ? (
                        <Image
                            src={carImage} alt={car.title}
                            fill sizes="(max-width:768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgErr(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-16 h-16 text-white/10" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
                    {car.isInspected && (
                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {rawText('فحص إنكار')}
                        </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                        {car.year}
                    </div>
                </div>

                {/* ─ بيانات السيارة ─ */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                    <div>
                        <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1">
                            {car.manufacturerAr}
                        </div>
                        <h3 className="text-base font-black text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {car.title}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        {[
                            { icon: Gauge, label: formatMileage(car.mileage) },
                            { icon: Fuel, label: car.fuelAr },
                            { icon: Settings2, label: car.transmissionAr },
                            { icon: MapPin, label: car.regionAr },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-[10px] text-white/40">
                                <Icon className="w-3 h-3 shrink-0 text-white/25" />
                                <span className="truncate">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/3 border border-white/8 rounded-2xl p-5 flex items-center justify-between">
                        <div>
                            <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-1">{rawText('السعر التقديري')}</div>
                            <div className="text-3xl font-black text-white">{priceText}</div>
                        </div>
                        <CurrencySwitcher variant="minimal" />
                    </div>
                </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="px-4 pb-4 flex gap-2">
                <button
                    onClick={() => onContact(car)}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-400 text-white text-xs font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {rawText('شراء')}
                </button>
                
                {/* زر المفضلة */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite); }}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all border shrink-0",
                        isFavorite 
                            ? "bg-red-500/20 border-red-500/40 text-red-500" 
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                    title={isFavorite ? rawText('حذف من المفضلات') : rawText('إضافة للمفضلات')}
                >
                    <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                </button>

                {/* زر السلة */}
                <button
                    onClick={(e) => { e.stopPropagation(); setIsInCart(!isInCart); }}
                    className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all border shrink-0",
                        isInCart 
                            ? "bg-amber-500/20 border-amber-500/40 text-amber-500" 
                            : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                    )}
                    title={isInCart ? rawText('حذف من السلة') : rawText('إضافة للسلة')}
                >
                    <ShoppingBag className={cn("w-4 h-4", isInCart && "fill-current")} />
                </button>
            </div>
        </motion.div>
    );
}

// ─── مودال تفاصيل السيارة ───
function CarModal({ car, onClose, onContact, isRTL, priceText }: {
    car: KoreanCar;
    onClose: () => void;
    onContact: () => void;
    isRTL: boolean;
    priceText: string;
}) {
    const [imgErr, setImgErr] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const carImage = resolveCarImage(car);
    const detailsRows = [
        { label: rawText('السنة'), value: car.year.toString() },
        { label: rawText('المسافة'), value: formatMileage(car.mileage) },
        { label: rawText('الوقود'), value: car.fuelAr },
        { label: rawText('ناقل الحركة'), value: car.transmissionAr },
        { label: rawText('المنطقة'), value: car.regionAr },
        { label: rawText('الفحص'), value: car.isInspected ? rawText('✅ مفحوصة') : rawText('غير مفحوص') },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-cinematic-dark border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden"
            >
                {/* الصورة والجاليري */}
                <div className="relative group/modal-img">
                    <div className="relative h-64 sm:h-72 bg-zinc-900">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={car.images?.[activeImageIndex] || carImage}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full"
                            >
                                {(car.images?.[activeImageIndex] || carImage) ? (
                                    <Image 
                                        src={car.images?.[activeImageIndex] || carImage!} 
                                        alt={car.title} 
                                        fill 
                                        className="object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Car className="w-20 h-20 text-white/10" />
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                        <div className="absolute inset-0 bg-linear-to-t from-cinematic-dark via-transparent to-transparent" />
                        
                        {/* أزرار التنقل بين الصور */}
                        {car.images && car.images.length > 1 && (
                            <>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => (prev === 0 ? car.images!.length - 1 : prev - 1))}
                                    title={isRTL ? "السابق" : "Previous"}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/modal-img:opacity-100"
                                >
                                    <ChevronRight className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                </button>
                                <button 
                                    onClick={() => setActiveImageIndex(prev => (prev === car.images!.length - 1 ? 0 : prev + 1))}
                                    title={isRTL ? "التالي" : "Next"}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-all opacity-0 group-hover/modal-img:opacity-100"
                                >
                                    <ChevronLeft className={cn("w-5 h-5", !isRTL && "rotate-180")} />
                                </button>
                            </>
                        )}

                        <button onClick={onClose} title={isRTL ? "إغلاق" : "Close"}
                            className="absolute top-4 left-4 w-9 h-9 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/20 transition-all z-20">
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* مؤشر الصور */}
                        {car.images && car.images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                                {car.images.slice(0, 10).map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all",
                                            idx === activeImageIndex ? "bg-white w-4" : "bg-white/30"
                                        )} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* المحتوى */}
                <div className="p-6 space-y-4">
                    <div>
                        <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">{car.manufacturerAr}</div>
                        <h2 className="text-2xl font-black text-white">{car.title}</h2>
                        <div className="text-xs text-white/30 mt-1">{car.titleKr}</div>
                    </div>

                    {/* مسار الشحن (Creative Addition) */}
                    <div className="bg-white/2 border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">{rawText('Seoul')}</span>
                                <span className="text-[8px] text-white/30 font-bold">{rawText('Origin Port')}</span>
                            </div>
                            <div className="flex-1 px-4 relative">
                                <div className="h-px bg-white/10 w-full" />
                                <motion.div
                                    animate={{ left: ['0%', '100%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cinematic-dark px-2">
                                    <Car className="w-3 h-3 text-white/20" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">{rawText('Destination')}</span>
                                <span className="text-[8px] text-white/30 font-bold">{rawText('Port of Entry')}</span>
                            </div>
                        </div>
                    </div>

                    {/* التفاصيل */}
                    <div className="grid grid-cols-2 gap-3">
                        {detailsRows.map(({ label, value }) => (
                            <div key={label} className="bg-white/3 border border-white/5 p-3 rounded-xl">
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{label}</div>
                                <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* السعر */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <div className="text-[9px] text-blue-400 uppercase tracking-widest">{rawText('السعر')}</div>
                        <div className="text-3xl font-black text-white mt-1">{priceText}</div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex gap-3">
                        <button onClick={onContact}
                            className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <MessageCircle className="w-4 h-4" />
                            {rawText('شراء')}
                        </button>
                        <a href={car.encarUrl} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-3.5 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all flex items-center gap-2 text-sm font-bold">
                            <ExternalLink className="w-4 h-4" />
                            {rawText('الإعلان')}
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ShowroomPage() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const { socialLinks, currency, formatPriceFromUsd } = useSettings();

    // ─ حالة البيانات ─
    const [cars, setCars] = useState<KoreanCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // ─ حالة الواجهة ─
    const [search, setSearch] = useState('');
    const [yearFrom, setYearFrom] = useState('');
    const [yearTo, setYearTo] = useState('');
    const [sortBy, setSortBy] = useState<'latest' | 'mileage_low' | 'price_high'>('latest');
    const [selectedCar, setSelectedCar] = useState<KoreanCar | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [ping, setPing] = useState(48);

    // ─────────────────────────────────
    // جلب السيارات من الـ Backend
    // ─────────────────────────────────
    const fetchCars = useCallback(async (p: number) => {
        setLoading(true);
        setError('');
        try {
            const res = await api.showroom.getCars(p);
            if (res.success) {
                setCars(res.data || []);
                setTotalPages(res.totalPages || 1);
                setTotal(res.total || 0);
                setPing(Math.floor(Math.random() * 20) + 40);
            } else {
                setError(res.message || 'فشل تحميل السيارات');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'فشل الاتصال بالخادم');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCars(page);
    }, [page, refreshKey, fetchCars]);

    // Restore filters from URL so users can share the same showroom view.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qp = new URLSearchParams(window.location.search);
        setSearch(qp.get('q') || '');
        setYearFrom(qp.get('from') || '');
        setYearTo(qp.get('to') || '');
        const s = qp.get('sort');
        if (s === 'latest' || s === 'mileage_low' || s === 'price_high') {
            setSortBy(s);
        }
    }, []);

    // Keep URL in sync with showroom filters (no reload) for shareable state.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const qp = new URLSearchParams();
        if (search) qp.set('q', search);
        if (yearFrom) qp.set('from', yearFrom);
        if (yearTo) qp.set('to', yearTo);
        if (sortBy !== 'latest') qp.set('sort', sortBy);
        const qs = qp.toString();
        const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
        window.history.replaceState(null, '', nextUrl);
    }, [search, yearFrom, yearTo, sortBy]);

    // ─────────────────────────────────
    // فتح واتساب مع بيانات السيارة وتسجيل طلب لدى الأدمن
    // إذا كانت بيانات العميل ناقصة نوجهه لصفحة الطلبات الخاصة مع تعبئة أولية.
    // ─────────────────────────────────
    const getBaseUsd = (car: KoreanCar) => {
        const asAny = car as any;
        if (Number(asAny.priceUsd) > 0) return Number(asAny.priceUsd);
        if (Number(car.priceKrw) > 0) return Number(car.priceKrw) / Number(currency.usdToKrw || 1);
        if (Number(asAny.priceSar) > 0) return Number(asAny.priceSar) / Number(currency.usdToSar || 1);
        return 0;
    };

    const openWhatsApp = async (car: KoreanCar) => {
        // [[ARABIC_COMMENT]] تسجيل حدث التحويل في Google Analytics
        ReactGA.event({
            category: 'Conversion',
            action: 'Showroom_WhatsApp_Click',
            label: car.title,
            value: Number(getBaseUsd(car) * Number(currency.usdToSar || 0))
        });

        try {
            // Prefer logged-in user data.
            let buyerName = '';
            let buyerPhone = '';
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try {
                        const user = JSON.parse(userJson);
                        buyerName = user?.name || '';
                        buyerPhone = user?.phone || '';
                    } catch (e) { }
                }
            }

            // [[ARABIC_COMMENT]] حتى لو لم يسجل الدخول، نفتحه الواتساب مباشرة بناءً على رغبة المستخدم
            // ونقوم بتسجيل الطلب في الخلفية للأدمن إذا أمكن
            api.concierge.create({
                type: 'car',
                name: buyerName || 'عميل زائر',
                phone: buyerPhone || '000',
                carName: car.manufacturerAr || car.manufacturer,
                model: car.model,
                year: String(car.year || ''),
                source: 'korean_showroom',
                contactPreference: 'whatsapp',
                externalUrl: car.encarUrl,
                description: `طلب شراء من المعرض الكوري: ${car.title} | السعر: ${formatPriceFromUsd(getBaseUsd(car))} | Encar: ${car.encarUrl}`,
            }).catch(e => console.error('Silent record fail:', e));

        } catch (err) {
            console.error('Failed to log showroom concierge request:', err);
        }

        const url = WhatsAppService.generateCarLink(car, socialLinks?.whatsapp || '', isRTL, formatPriceFromUsd);
        window.open(url, '_blank');
        setSelectedCar(null);
    };

    // ─────────────────────────────────
    // فلترة السيارات المعروضة
    // ─────────────────────────────────
    const filteredCars = cars.filter(car => {
        const q = search.toLowerCase();
        const matchSearch = !q || car.title.toLowerCase().includes(q) || car.manufacturerAr.includes(q) || car.model.toLowerCase().includes(q);
        const fromYear = yearFrom ? Number(yearFrom) : null;
        const toYear = yearTo ? Number(yearTo) : null;
        const cYear = Number(car.year || 0);
        const low = fromYear && toYear ? Math.min(fromYear, toYear) : fromYear;
        const high = fromYear && toYear ? Math.max(fromYear, toYear) : toYear;
        const matchYear = (!low || cYear >= low) && (!high || cYear <= high);
        return matchSearch && matchYear;
    }).sort((a, b) => {
        if (sortBy === 'mileage_low') return Number(a.mileage || 0) - Number(b.mileage || 0);
        if (sortBy === 'price_high') return getBaseUsd(b) - getBaseUsd(a);
        return Number(b.year || 0) - Number(a.year || 0);
    });

    // قائمة السنوات الموجودة
    const years = [...new Set(cars.map(c => c.year).filter(Boolean))]
        .sort((a, b) => Number(b) - Number(a));



    const sortOptions = [
        { value: 'latest' as const, labelAr: rawText('الأحدث سنة'), labelEn: rawText('Latest year') },
        { value: 'mileage_low' as const, labelAr: rawText('الأقل عدادًا'), labelEn: rawText('Lowest mileage') },
        { value: 'price_high' as const, labelAr: rawText('الأعلى سعرًا'), labelEn: rawText('Highest price') },
    ];

    return (
        <>
            <AnimatePresence>
                {selectedCar && (
                    <CarModal
                        car={selectedCar}
                        isRTL={isRTL}
                        priceText={formatPriceFromUsd(getBaseUsd(selectedCar))}
                        onClose={() => setSelectedCar(null)}
                        onContact={() => openWhatsApp(selectedCar)}
                    />
                )}
            </AnimatePresence>

            <div className={cn('min-h-screen bg-cinematic-darker text-white selection:bg-blue-500/30', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />

                {/* ── خلفية سينمائية ── */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-full h-150 bg-linear-to-b from-blue-600/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[100px_100px] mask-[radial-gradient(ellipse_20%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-32">
                    {/* زر الرجوع */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <button
                            onClick={() => router.back()}
                            title={isRTL ? rawText('رجوع') : rawText('Back')}
                            aria-label={isRTL ? rawText('رجوع') : rawText('Back')}
                            className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group"
                        >
                            <ArrowLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        </button>
                    </motion.div>

                    {/* ── لوحة معلومات الاتصال المباشر (Creative Addition) ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-12 p-3 rounded-2xl bg-white/2 border border-white/5 backdrop-blur-3xl flex flex-wrap items-center gap-6"
                    >
                        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75", loading && "bg-yellow-400")} />
                                <span className={cn("relative inline-flex rounded-full h-2 w-2 bg-blue-500", loading && "bg-yellow-500")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {loading ? rawText('Syncing Data...') : rawText('Live System Connection')}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 flex-1 min-w-75">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">{rawText('Market')}</span>
                                <span className="text-xs font-black text-white/60">{rawText('SEOUL, KR')}</span>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">{rawText('Latency')}</span>
                                <span className="text-xs font-black text-green-400">{ping}{rawText('ms')}</span>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">{rawText('Cars Indexed')}</span>
                                <span className="text-xs font-black text-white/60">{total.toLocaleString()}</span>
                            </div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block" />
                            <div className="hidden sm:flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                                <span>{rawText('KR')}</span>
                                <div className="w-12 h-px bg-linear-to-r from-blue-500/50 via-white/20 to-green-500/50" />
                                <span>{rawText('GCC')}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group"
                            >
                                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{rawText('تحديث')}</span>
                            </button>
                            <CurrencySwitcher variant="full" className="hidden md:block" />
                        </div>
                    </motion.div>

                    {/* ── عنوان الصفحة ── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-4"
                        >
                            <div className="h-1 w-12 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.8]">
                                {isRTL ? rawText('المعرض') : rawText('SHOWROOM')}
                                <span className="block text-2xl md:text-3xl font-light not-italic tracking-[0.3em] text-white/20 mt-2">
                                    {isRTL ? rawText('سيارات كورية مباشرة') : rawText('LIVE KOREAN MARKET')}
                                </span>
                            </h1>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4 max-w-sm"
                        >
                            {/* البحث والفلتر المتطور */}
                            <div className="relative group">
                                <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <div className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 focus-within:border-blue-500/50 transition-all overflow-hidden">
                                    <div className="w-10 h-10 flex items-center justify-center text-white/20">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text" value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder={isRTL ? "ابحث بالماركة أو الموديل..." : "Search brand or model..."}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-white placeholder:text-white/20 px-2"
                                    />
                                    {years.length > 0 && (
                                        <div className="flex items-center gap-1">
                                            <select
                                                value={yearFrom}
                                                onChange={e => setYearFrom(e.target.value)}
                                                title={isRTL ? "من سنة" : "From year"}
                                                className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white/40 appearance-none outline-none cursor-pointer hover:text-white transition-colors"
                                            >
                                                <option value="">{isRTL ? rawText('من') : rawText('FROM')}</option>
                                                {years.map(y => <option key={`from-${y}`} value={String(y)}>{y}</option>)}
                                            </select>
                                            <select
                                                value={yearTo}
                                                onChange={e => setYearTo(e.target.value)}
                                                title={isRTL ? "إلى سنة" : "To year"}
                                                className="bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white/40 appearance-none outline-none cursor-pointer hover:text-white transition-colors"
                                            >
                                                <option value="">{isRTL ? rawText('إلى') : rawText('TO')}</option>
                                                {years.map(y => <option key={`to-${y}`} value={String(y)}>{y}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>



                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-white/35">
                                    {isRTL ? rawText('الترتيب:') : rawText('Sort:')}
                                </span>
                                <select
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as 'latest' | 'mileage_low' | 'price_high')}
                                    className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-white/70 outline-none"
                                    title={isRTL ? 'ترتيب النتائج' : 'Sort results'}
                                >
                                    {sortOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{isRTL ? opt.labelAr : opt.labelEn}</option>
                                    ))}
                                </select>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── شبكة السيارات ── */}
                    {loading && !cars.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="aspect-3/4 rounded-3xl bg-white/2 border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                <X className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{isRTL ? rawText('فشل جلب البيانات') : rawText('DATA SYNC FAILED')}</h2>
                            <p className="text-white/40 max-w-xs">{error}</p>
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all shadow-xl"
                            >
                                {isRTL ? rawText('إعادة الإتصال') : rawText('RECONNECT')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredCars.map((car, i) => (
                                    <motion.div
                                        key={car.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <CarCard
                                            car={car}
                                            priceText={formatPriceFromUsd(getBaseUsd(car))}
                                            onContact={openWhatsApp}
                                            onViewDetails={setSelectedCar}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {filteredCars.length === 0 && (
                                <div className="py-32 text-center opacity-40 italic">
                                    {isRTL ? rawText('لا توجد نتائج مطابقة لعملية البحث') : rawText('NO RESULTS MATCH YOUR SEARCH CRITERIA')}
                                </div>
                            )}

                            {/* الترقيم */}
                            {totalPages > 1 && (
                                <div className="mt-20 flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === 1}
                                        title={isRTL ? "الصفحة السابقة" : "Previous Page"}
                                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 hover:border-blue-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                                    >
                                        <ChevronRight className={cn("w-5 h-5 transition-transform", isRTL ? "" : "rotate-180")} />
                                    </button>

                                    <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black">
                                        <span className="text-blue-400">{page}</span>
                                        <span className="text-white/20">{rawText('/')}</span>
                                        <span className="text-white/40">{totalPages}</span>
                                    </div>

                                    <button
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === totalPages}
                                        title={isRTL ? "الصفحة التالية" : "Next Page"}
                                        className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-500 hover:border-blue-400 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className={cn("w-5 h-5", isRTL ? "" : "rotate-180")} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Footer Section */}
                <footer className="relative z-10 border-t border-white/5 py-12 px-6 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-3xl hide-in-app">
                    <div className="flex items-center gap-4 text-white/20 font-black text-[10px] tracking-[0.5em] uppercase">
                        <span>{rawText('HM CAR')}</span>
                        <div className="h-0.5 w-12 bg-white/5" />
                        <span>{rawText('KOREA AUTO')}</span>
                    </div>
                </footer>
            </div>
        </>
    );
}


