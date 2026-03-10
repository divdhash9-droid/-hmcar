'use client';

/**
 * صفحة المعرض - The Showroom
 * ──────────────────────────
 * تعرض سيارات كورية من موقع Encar.com مترجمة للعربية.
 * عند اختيار أي سيارة يُفتح واتساب الأدمن مع بيانات السيارة جاهزة.
 * رابط المصدر يُتحكم فيه من لوحة الأدمن.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Car, MessageCircle, Search,
    ChevronLeft, ChevronRight, RefreshCw,
    MapPin, Gauge, Fuel, Settings2, Sparkles,
    ExternalLink, X, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api';
import Image from 'next/image';

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
    fuel: string;
    fuelAr: string;
    transmission: string;
    transmissionAr: string;
    region: string;
    regionAr: string;
    imageUrl: string | null;
    encarUrl: string;
    isInspected: boolean;
}

// ─── تنسيق الأرقام ───
function formatKrw(amount: number): string {
    if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)} مليار ₩`;
    if (amount >= 10000) return `${(amount / 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 만`;
    return `${amount.toLocaleString()} ₩`;
}
function formatMileage(km: number): string {
    if (km >= 10000) return `${(km / 10000).toFixed(1)} 만km`;
    return `${km.toLocaleString()} km`;
}

// ─── كارد السيارة ───
function CarCard({ car, onContact, onViewDetails }: {
    car: KoreanCar;
    onContact: (car: KoreanCar) => void;
    onViewDetails: (car: KoreanCar) => void;
}) {
    const [imgErr, setImgErr] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -4 }}
            className="group bg-[#0a0a0a] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 flex flex-col"
        >
            {/* ─ الجزء القابل للنقر للتفاصيل ─ */}
            <div className="cursor-pointer flex-1 flex flex-col" onClick={() => onViewDetails(car)}>
                {/* ─ صورة السيارة ─ */}
                <div className="relative h-48 bg-zinc-900 overflow-hidden">
                    {car.imageUrl && !imgErr ? (
                        <Image
                            src={car.imageUrl} alt={car.title}
                            fill sizes="(max-width:768px) 100vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImgErr(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-16 h-16 text-white/10" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    {car.isInspected && (
                        <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            فحص إنكار
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

                    <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mt-auto">
                        <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">السعر</div>
                        <div className="text-xl font-black text-white">{formatKrw(car.priceKrw)}</div>
                        <div className="text-[9px] text-white/25 mt-0.5">
                            ≈ {(car.priceKrw * 0.00027).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ر.س تقريباً
                        </div>
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
                    تواصل عبر واتساب
                </button>
                <a
                    href={car.encarUrl} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all shrink-0"
                    title="رابط الإعلان الأصلي"
                >
                    <ExternalLink className="w-3.5 h-3.5 text-white/40" />
                </a>
            </div>
        </motion.div>
    );
}

// ─── مودال تفاصيل السيارة ───
function CarModal({ car, onClose, onContact, isRTL }: {
    car: KoreanCar;
    onClose: () => void;
    onContact: () => void;
    isRTL: boolean;
}) {
    const [imgErr, setImgErr] = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md" dir={isRTL ? 'rtl' : 'ltr'}>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden"
            >
                {/* الصورة */}
                <div className="relative h-56 bg-zinc-900">
                    {car.imageUrl && !imgErr ? (
                        <Image src={car.imageUrl} alt={car.title} fill className="object-cover" onError={() => setImgErr(true)} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-20 h-20 text-white/10" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                    <button onClick={onClose} title={isRTL ? "إغلاق" : "Close"}
                        className="absolute top-4 left-4 w-8 h-8 bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all">
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* المحتوى */}
                <div className="p-6 space-y-4">
                    <div>
                        <div className="text-[9px] text-blue-400 font-black uppercase tracking-widest mb-1">{car.manufacturerAr}</div>
                        <h2 className="text-2xl font-black text-white">{car.title}</h2>
                        <div className="text-xs text-white/30 mt-1">{car.titleKr}</div>
                    </div>

                    {/* مسار الشحن (Creative Addition) */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 overflow-hidden relative group">
                        <div className="flex justify-between items-center relative z-10">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Seoul</span>
                                <span className="text-[8px] text-white/30 font-bold">Origin Port</span>
                            </div>
                            <div className="flex-1 px-4 relative">
                                <div className="h-px bg-white/10 w-full" />
                                <motion.div
                                    animate={{ left: ['0%', '100%'] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                    className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]"
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] px-2">
                                    <Car className="w-3 h-3 text-white/20" />
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-green-400 uppercase tracking-widest leading-none">Destination</span>
                                <span className="text-[8px] text-white/30 font-bold">Port of Entry</span>
                            </div>
                        </div>
                    </div>

                    {/* التفاصيل */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'السنة', value: car.year.toString() },
                            { label: 'المسافة', value: formatMileage(car.mileage) },
                            { label: 'الوقود', value: car.fuelAr },
                            { label: 'ناقل الحركة', value: car.transmissionAr },
                            { label: 'المنطقة', value: car.regionAr },
                            { label: 'الفحص', value: car.isInspected ? '✅ مفحوصة' : 'غير مفحوص' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-white/[0.03] border border-white/5 p-3 rounded-xl">
                                <div className="text-[9px] text-white/30 uppercase tracking-wider">{label}</div>
                                <div className="text-sm font-bold text-white mt-0.5">{value}</div>
                            </div>
                        ))}
                    </div>

                    {/* السعر */}
                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <div className="text-[9px] text-blue-400 uppercase tracking-widest">السعر</div>
                        <div className="text-3xl font-black text-white mt-1">{formatKrw(car.priceKrw)}</div>
                        <div className="text-xs text-white/40 mt-1">≈ {(car.priceKrw * 0.00027).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ريال سعودي تقريباً</div>
                    </div>

                    {/* الأزرار */}
                    <div className="flex gap-3">
                        <button onClick={onContact}
                            className="flex-1 py-3.5 bg-green-500 hover:bg-green-400 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <MessageCircle className="w-4 h-4" />
                            تواصل عبر واتساب
                        </button>
                        <a href={car.encarUrl} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-3.5 border border-white/10 rounded-xl text-white/50 hover:bg-white/5 transition-all flex items-center gap-2 text-sm font-bold">
                            <ExternalLink className="w-4 h-4" />
                            الإعلان
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default function ShowroomPage() {
    const { isRTL } = useLanguage();
    const { socialLinks } = useSettings();

    // ─ حالة البيانات ─
    const [cars, setCars] = useState<KoreanCar[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // ─ حالة الواجهة ─
    const [search, setSearch] = useState('');
    const [filterFuel, setFilterFuel] = useState('');
    const [selectedCar, setSelectedCar] = useState<KoreanCar | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [ping, setPing] = useState(48);

    // رقم واتساب الأدمن
    const whatsappNum = (socialLinks?.whatsapp || '').replace(/\D/g, '');

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

    // ─────────────────────────────────
    // فتح واتساب مع بيانات السيارة وتسجيل الطلب
    // ─────────────────────────────────
    const openWhatsApp = async (car: KoreanCar) => {
        const sarPrice = (car.priceKrw * 0.00027).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        try {
            // Get user from localStorage if exists
            let buyerId = null;
            if (typeof window !== 'undefined') {
                const userJson = localStorage.getItem('hm_user');
                if (userJson) {
                    try { buyerId = JSON.parse(userJson)._id; } catch (e) { }
                }
            }

            // Record order in database
            await api.orders.create({
                buyerId: buyerId,
                items: [{
                    itemType: 'car',
                    refId: car.id,
                    titleSnapshot: car.title,
                    qty: 1,
                    unitPriceSar: parseInt(sarPrice.replace(/,/g, ''))
                }],
                pricing: {
                    grandTotalSar: parseInt(sarPrice.replace(/,/g, ''))
                },
                channel: 'whatsapp',
                notes: `Client requested showroom car: ${car.encarUrl}`
            });
        } catch (err) {
            console.error('Failed to log showroom order:', err);
        }

        const msg = [
            `🏁 *HM CAR | طلب سيارة من المعرض*`,
            `──────────────────`,
            `🚙 *السيارة:* ${car.title}`,
            `📅 *السنة:* ${car.year}`,
            `🛣️ *المسافة:* ${formatMileage(car.mileage)}`,
            `⛽ *الوقود:* ${car.fuelAr}`,
            `⚙️ *الجير:* ${car.transmissionAr}`,
            `📍 *الموقع:* ${car.regionAr}`,
            `💰 *السعر:* ${formatKrw(car.priceKrw)}`,
            `🇸🇦 *تقديراً:* ${sarPrice} ريال سعودي`,
            `🔗 *رابط إنكار:* ${car.encarUrl}`,
            `──────────────────`,
            `رغبت في الاستفسار عن الشراء وتفاصيل الشحن للتصنيع الكوري لهذه السيارة.`
        ].join('\n');

        const url = `https://wa.me/${whatsappNum}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        setSelectedCar(null);
    };

    // ─────────────────────────────────
    // فلترة السيارات المعروضة
    // ─────────────────────────────────
    const filteredCars = cars.filter(car => {
        const q = search.toLowerCase();
        const matchSearch = !q || car.title.toLowerCase().includes(q) || car.manufacturerAr.includes(q) || car.model.toLowerCase().includes(q);
        const matchFuel = !filterFuel || car.fuelAr === filterFuel;
        return matchSearch && matchFuel;
    });

    // قائمة أنواع الوقود الموجودة
    const fuelTypes = [...new Set(cars.map(c => c.fuelAr).filter(Boolean))];

    return (
        <>
            <AnimatePresence>
                {selectedCar && (
                    <CarModal
                        car={selectedCar}
                        isRTL={isRTL}
                        onClose={() => setSelectedCar(null)}
                        onContact={() => openWhatsApp(selectedCar)}
                    />
                )}
            </AnimatePresence>

            <div className={cn('min-h-screen bg-[#050505] text-white selection:bg-blue-500/30', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />

                {/* ── خلفية سينمائية ── */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-b from-blue-600/10 via-transparent to-transparent opacity-50" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_20%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-32">
                    {/* زر الرجوع */}
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-blue-400 transition-colors group">
                            <ArrowLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? "العودة للرئيسية" : "BACK TO HOME"}</span>
                        </Link>
                    </motion.div>

                    {/* ── لوحة معلومات الاتصال المباشر (Creative Addition) ── */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-12 p-3 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl flex flex-wrap items-center gap-6"
                    >
                        <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                            <div className="relative flex h-2 w-2">
                                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75", loading && "bg-yellow-400")} />
                                <span className={cn("relative inline-flex rounded-full h-2 w-2 bg-blue-500", loading && "bg-yellow-500")} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                                {loading ? 'Syncing Data...' : 'Live System Connection'}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 flex-1 min-w-[300px]">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">Market</span>
                                <span className="text-xs font-black text-white/60">SEOUL, KR</span>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">Latency</span>
                                <span className="text-xs font-black text-green-400">{ping}ms</span>
                            </div>
                            <div className="h-8 w-px bg-white/5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-white/20 uppercase">Cars Indexed</span>
                                <span className="text-xs font-black text-white/60">{total.toLocaleString()}</span>
                            </div>
                            <div className="h-8 w-px bg-white/5 hidden sm:block" />
                            <div className="hidden sm:flex items-center gap-4 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                                <span>KR</span>
                                <div className="w-12 h-px bg-gradient-to-r from-blue-500/50 via-white/20 to-green-500/50" />
                                <span>GCC</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 group"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5 text-white/40 group-hover:text-blue-400 transition-colors", loading && "animate-spin")} />
                                <span className="text-[10px] font-black uppercase">{isRTL ? "تحديث" : "SYNC"}</span>
                            </button>
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
                                {isRTL ? 'المعرض' : 'SHOWROOM'}
                                <span className="block text-2xl md:text-3xl font-light not-italic tracking-[0.3em] text-white/20 mt-2">
                                    {isRTL ? 'سيارات كورية مباشرة' : 'LIVE KOREAN MARKET'}
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
                                    {fuelTypes.length > 0 && (
                                        <select
                                            value={filterFuel}
                                            onChange={e => setFilterFuel(e.target.value)}
                                            title={isRTL ? "فلترة حسب نوع الوقود" : "Filter by fuel type"}
                                            className="bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-white/40 appearance-none outline-none cursor-pointer hover:text-white transition-colors"
                                        >
                                            <option value="">{isRTL ? "كل الوقود" : "ALL FUEL"}</option>
                                            {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* ── شبكة السيارات ── */}
                    {loading && !cars.length ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="aspect-[3/4] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                <X className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{isRTL ? 'فشل جلب البيانات' : 'DATA SYNC FAILED'}</h2>
                            <p className="text-white/40 max-w-xs">{error}</p>
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all shadow-xl"
                            >
                                {isRTL ? 'إعادة الإتصال' : 'RECONNECT'}
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
                                            onContact={openWhatsApp}
                                            onViewDetails={setSelectedCar}
                                        />
                                    </motion.div>
                                ))}
                            </div>

                            {filteredCars.length === 0 && (
                                <div className="py-32 text-center opacity-40 italic">
                                    {isRTL ? "لا توجد نتائج مطابقة لعملية البحث" : "NO RESULTS MATCH YOUR SEARCH CRITERIA"}
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
                                        <span className="text-white/20">/</span>
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
                <footer className="relative z-10 border-t border-white/5 py-12 px-6 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-3xl">
                    <div className="flex items-center gap-4 text-white/20 font-black text-[10px] tracking-[0.5em] uppercase">
                        <span>HM CAR</span>
                        <div className="h-[2px] w-12 bg-white/5" />
                        <span>KOREA AUTO</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
