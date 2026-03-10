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
    Car, MessageCircle, Search, Filter,
    ChevronLeft, ChevronRight, RefreshCw,
    MapPin, Gauge, Fuel, Settings2, Sparkles,
    ExternalLink, X
} from 'lucide-react';
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
function CarCard({ car, onContact }: {
    car: KoreanCar;
    onContact: (car: KoreanCar) => void;
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
                {/* التدرج السفلي */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* شارة مفحوص */}
                {car.isInspected && (
                    <div className="absolute top-3 right-3 bg-green-500/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        فحص إنكار
                    </div>
                )}

                {/* السنة */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                    {car.year}
                </div>
            </div>

            {/* ─ بيانات السيارة ─ */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* الاسم */}
                <div>
                    <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mb-1">
                        {car.manufacturerAr}
                    </div>
                    <h3 className="text-base font-black text-white leading-tight line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {car.title}
                    </h3>
                </div>

                {/* تفاصيل */}
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

                {/* السعر */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 mt-auto">
                    <div className="text-[9px] text-white/30 uppercase tracking-widest mb-1">السعر</div>
                    <div className="text-xl font-black text-white">{formatKrw(car.priceKrw)}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">
                        ≈ {(car.priceKrw * 0.00027).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} ر.س تقريباً
                    </div>
                </div>

                {/* أزرار */}
                <div className="flex gap-2">
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

// ═══════════════════════════════════════════════════
// الصفحة الرئيسية: المعرض
// ═══════════════════════════════════════════════════
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
    // فتح واتساب مع بيانات السيارة
    // ─────────────────────────────────
    const openWhatsApp = (car: KoreanCar) => {
        const msg = [
            `🚗 *استفسار عن سيارة من المعرض الكوري*`,
            ``,
            `• *الاسم:* ${car.title}`,
            `• *السنة:* ${car.year}`,
            `• *المسافة:* ${formatMileage(car.mileage)}`,
            `• *الوقود:* ${car.fuelAr}`,
            `• *ناقل الحركة:* ${car.transmissionAr}`,
            `• *المنطقة:* ${car.regionAr}`,
            `• *السعر:* ${formatKrw(car.priceKrw)}`,
            `• *رابط الإعلان:* ${car.encarUrl}`,
            ``,
            `أرجو التواصل معي بخصوص هذه السيارة 🙏`,
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
            {/* مودال تفاصيل السيارة */}
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

            <div className={cn('min-h-screen bg-[#050505] text-white', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
                <Navbar />

                {/* ── خلفية متحركة ── */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full" />
                </div>

                <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-24">

                    {/* ── ترويسة الصفحة ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-10"
                    >
                        <div className="text-[9px] font-black uppercase tracking-[0.5em] text-blue-400/60 mb-3 flex items-center gap-2">
                            <span className="w-8 h-px bg-blue-400/40" />
                            Korean Car Market
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                            المعرض
                        </h1>
                        <p className="text-white/30 text-sm mt-2">
                            أحدث السيارات الكورية المستعملة · اختر ما يناسبك وتواصل معنا مباشرة
                        </p>
                        {total > 0 && (
                            <div className="mt-3 text-xs text-white/20">
                                {total.toLocaleString()} سيارة متاحة في السوق الكوري
                            </div>
                        )}
                    </motion.div>

                    {/* ── أدوات البحث والفلتر ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap gap-3 mb-8"
                    >
                        {/* البحث */}
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input
                                type="text" value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="ابحث عن سيارة..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-4 text-white text-sm placeholder:text-white/25 focus:border-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        {/* فلتر الوقود */}
                        {fuelTypes.length > 0 && (
                            <div className="relative">
                                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                                <select
                                    value={filterFuel} onChange={e => setFilterFuel(e.target.value)}
                                    title="فلتر نوع الوقود"
                                    className="bg-white/5 border border-white/10 rounded-xl py-2.5 pr-9 pl-4 text-sm text-white appearance-none cursor-pointer focus:border-blue-500/50 outline-none"
                                >
                                    <option value="">كل أنواع الوقود</option>
                                    {fuelTypes.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                        )}

                        {/* زر تحديث */}
                        <button
                            onClick={() => setRefreshKey(k => k + 1)}
                            disabled={loading}
                            title="تحديث"
                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-40"
                        >
                            <RefreshCw className={cn('w-4 h-4 text-white/50', loading && 'animate-spin')} />
                        </button>
                    </motion.div>

                    {/* ── حالة الخطأ ── */}
                    {error && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-16 text-center space-y-4"
                        >
                            <div className="text-5xl">⚠️</div>
                            <p className="text-white/40 text-sm">{error}</p>
                            <button
                                onClick={() => setRefreshKey(k => k + 1)}
                                className="px-6 py-2.5 bg-blue-500 rounded-xl text-white text-sm font-bold hover:bg-blue-400 transition-all"
                            >
                                إعادة المحاولة
                            </button>
                        </motion.div>
                    )}

                    {/* ── حالة التحميل ── */}
                    {loading && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden animate-pulse">
                                    <div className="h-48 bg-white/5" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-3 bg-white/5 rounded w-1/3" />
                                        <div className="h-5 bg-white/5 rounded w-3/4" />
                                        <div className="grid grid-cols-2 gap-2">
                                            {[1, 2, 3, 4].map(j => <div key={j} className="h-3 bg-white/5 rounded" />)}
                                        </div>
                                        <div className="h-16 bg-white/5 rounded-xl" />
                                        <div className="h-10 bg-white/5 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── شبكة السيارات ── */}
                    {!loading && !error && (
                        <>
                            {filteredCars.length === 0 ? (
                                <div className="py-24 text-center">
                                    <Car className="w-16 h-16 text-white/10 mx-auto mb-4" />
                                    <p className="text-white/30 text-sm">لا توجد سيارات مطابقة للبحث</p>
                                </div>
                            ) : (
                                <AnimatePresence mode="wait">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                        {filteredCars.map((car, i) => (
                                            <motion.div
                                                key={car.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04 }}
                                            >
                                                <CarCard
                                                    car={car}
                                                    onContact={openWhatsApp}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </AnimatePresence>
                            )}

                            {/* ── التصفح بين الصفحات ── */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-center gap-4 mt-12">
                                    <button
                                        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === 1}
                                        title={isRTL ? "السابق" : "Previous"}
                                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm text-white/40 font-bold">
                                        {page} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                        disabled={page === totalPages}
                                        title={isRTL ? "التالي" : "Next"}
                                        className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}
