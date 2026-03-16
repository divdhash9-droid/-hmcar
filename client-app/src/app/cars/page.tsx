'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, ArrowRight,
    Gauge, Fuel,
    X, SlidersHorizontal, ArrowLeft,
    Car
} from "lucide-react";
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useAuth } from '@/lib/AuthContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const rawText = (value: string) => value;
const getCarMakeLabel = (make: CarModel['make']) => (typeof make === 'object' && make ? make.name : make);

interface CarModel {
    id?: string;
    _id?: string;
    title: string;
    make: string | { name: string };
    year: number;
    price: number;
    priceSar?: number;
    priceUsd?: number;
    mileage: number;
    fuel: string;
    images: string[];
}

interface BrandModel {
    id: string;
    name: string;
    logoUrl?: string;
}

export default function CarsBrowserPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-cinematic-darker text-white flex items-center justify-center font-black uppercase tracking-[0.5em] italic animate-pulse">{rawText('Syncing Machinery...')}</div>}>
            <CarsContent />
        </Suspense>
    );
}

function CarsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const { isLoggedIn } = useAuth();

    const [cars, setCars] = useState<CarModel[]>([]);
    const [brands, setBrands] = useState<BrandModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // Filters state
    const [q, setQ] = useState(searchParams.get('q') || '');
    const [brand, setBrand] = useState(searchParams.get('brand') || '');
    const [priceRange, setPriceRange] = useState(searchParams.get('price') || '');
    const [showFilters, setShowFilters] = useState(false);

    const fetchCars = useCallback(async (isInitial = false) => {
        setLoading(true);
        try {
            let minPrice = undefined;
            let maxPrice = undefined;
            if (priceRange === '0-100k') { maxPrice = 100000; }
            else if (priceRange === '100-500k') { minPrice = 100000; maxPrice = 500000; }
            else if (priceRange === '500k+') { minPrice = 500000; }

            const listParams: Record<string, string | number | boolean> = {
                page: isInitial ? 1 : page,
                limit: 12,
                search: q,
                make: brand,
                source: 'hm_local',
            };

            if (minPrice !== undefined) listParams.minPrice = minPrice.toString();
            if (maxPrice !== undefined) listParams.maxPrice = maxPrice.toString();

            const res = await api.cars.list(listParams);

            if (res.success) {
                setCars(res.data.cars || []);
                setTotal(res.data.pagination?.total || 0);
                setTotalPages(res.data.pagination?.pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch cars", err);
        } finally {
            setLoading(false);
        }
    }, [page, q, brand, priceRange]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                // [[ARABIC_COMMENT]] جلب الوكالات المخصصة للمعرض المحلي
                const res = await api.brands.list('cars', { targetShowroom: 'hm_local' });
                if (res.success) setBrands(res.brands || []);
            } catch (err) {
                console.error("Failed to fetch brands", err);
            }
        };
        fetchBrands();
    }, []);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQ(e.target.value);
        setPage(1);
    };

    const clearFilters = () => {
        setQ('');
        setBrand('');
        setPriceRange('');
        setPage(1);
    };

    const priceRanges = [
        { id: rawText('0-100k'), label: isRTL ? rawText('تحت ١٠٠ ألف') : rawText('< 100K') },
        { id: rawText('100-500k'), label: isRTL ? rawText('١٠٠ - ٥٠٠ ألف') : rawText('100K - 500K') },
        { id: rawText('500k+'), label: isRTL ? rawText('فوق ٥٠٠ ألف') : rawText('> 500K') },
    ];

    const resolveCarImage = (car: CarModel) => {
        const src = car.images?.[0] || '';
        return typeof src === 'string' ? src.trim() : '';
    };

    return (
        <div className={cn("min-h-screen bg-cinematic-darker text-white selection:bg-luxury-gold selection:text-black", isRTL && "font-arabic")} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Cinematic Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-full h-200 bg-linear-to-b from-luxury-gold/5 via-transparent to-transparent opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-size-[6rem_6rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <main className="relative z-10 max-w-400 mx-auto px-6 pt-32 pb-24">

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-16 relative">
                    {/* Back Button */}
                    <motion.div 
                        initial={{ opacity: 0, x: 10 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className={cn("absolute top-0 hidden md:block", isRTL ? "right-0" : "left-0")}
                    >
                        <button
                            onClick={() => router.back()}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
                            title={isRTL ? rawText('رجوع') : rawText('Back')}
                        >
                            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                        </button>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
                        <div className="flex items-center gap-3 text-luxury-gold mb-6 bg-luxury-gold/10 px-6 py-2 rounded-full border border-luxury-gold/20">
                            <Car className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isRTL ? rawText('المعرض المحلي') : rawText('LOCAL SHOWROOM')}</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black uppercase italic tracking-tight leading-[0.9] mb-8 font-display">
                            {isRTL ? rawText('اختر') : rawText('CHOOSE')} <span className="text-luxury-gold">{isRTL ? rawText('الوكالة') : rawText('AGENCY')}</span>
                        </h1>
                    </motion.div>

                     <div className={cn("md:hidden mb-8", isRTL ? "self-end" : "self-start")}>
                         <button
                            onClick={() => router.back()}
                            title={isRTL ? rawText('رجوع') : rawText('Back')}
                            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
                        >
                            <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                        </button>
                    </div>
                </div>

                {/* Filter / Stats Bar */}
                <div className="flex flex-col items-center mb-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-center gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 flex items-center gap-4 backdrop-blur-3xl">
                            <div className="text-center">
                                <span className="text-xl font-black text-white block leading-none">{total}</span>
                                <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">{isRTL ? rawText('سيارة متاحة') : rawText('ASSETS')}</span>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
                                    showFilters ? "bg-luxury-gold text-black" : "text-white/60 hover:text-white"
                                )}
                                title={isRTL ? rawText('الفلاتر') : rawText('Filters')}
                            >
                                <Filter className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Agencies (Brands) Grid */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-24"
                >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {/* All Makes Button */}
                        <button
                            onClick={() => { setBrand(''); setPage(1); }}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all gap-4 group relative",
                                brand === '' 
                                    ? "bg-luxury-gold/15 border-luxury-gold/40 shadow-[0_0_40px_rgba(197,160,89,0.1)]" 
                                    : "bg-white/3 border-white/5 hover:bg-white/10 hover:border-white/20"
                            )}
                        >
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                brand === '' ? "bg-luxury-gold text-black scale-110" : "bg-white/5 text-white/30 group-hover:text-white"
                            )}>
                                <SlidersHorizontal className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                brand === '' ? "text-luxury-gold" : "text-white/40 group-hover:text-white"
                            )}>
                                {isRTL ? rawText('الكل') : rawText('ALL')}
                            </span>
                        </button>

                        {loading && brands.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="w-[100px] h-[120px] rounded-[2rem] bg-white/3 border border-white/5 animate-pulse" />
                            ))
                        ) : (
                            brands.map((b: any) => (
                                <button
                                    key={b._id || b.id || b.name}
                                    onClick={() => { setBrand(b.name); setPage(1); }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all duration-500 gap-4 group relative overflow-hidden",
                                        brand === b.name
                                            ? "bg-luxury-gold/15 border-luxury-gold/40 shadow-[0_0_50px_rgba(197,160,89,0.15)]"
                                            : "bg-white/3 border-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-105"
                                    )}
                                >
                                    {brand === b.name && (
                                        <motion.div layoutId="active-brand" className="absolute inset-0 bg-luxury-gold/5" />
                                    )}
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all relative z-10",
                                        brand === b.name ? "bg-luxury-gold text-black scale-110 shadow-lg" : "bg-white/5 text-white/40 group-hover:scale-110 group-hover:text-white"
                                    )}>
                                        {b.logoUrl ? (
                                            <div className="relative w-8 h-8">
                                                <Image 
                                                    src={b.logoUrl} alt={b.name} fill 
                                                    className={cn("object-contain transition-all", brand === b.name ? "" : "brightness-0 invert opacity-40 group-hover:opacity-80")} 
                                                />
                                            </div>
                                        ) : (
                                            <Car className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-widest relative z-10",
                                        brand === b.name ? "text-luxury-gold" : "text-white/40 group-hover:text-white text-center"
                                    )}>
                                        {b.name}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </motion.div>

                {/* Search & Mobile Filter Bar */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-12"
                        >
                            <div className="bg-white/3 border border-white/10 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                                {/* Search */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('بحث نصي') : rawText('TEXT SEARCH')}</label>
                                    <div className="relative">
                                        <Search className="absolute top-1/2 -translate-y-1/2 left-4 w-4 h-4 text-white/20" />
                                        <input
                                            type="text" value={q} onChange={handleSearchChange}
                                            placeholder={isRTL ? rawText('اسم السيارة...') : rawText('Car name...')}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-luxury-gold/50 transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Agency */}
                                <div className="space-y-4">
                                    <label htmlFor="agency-select" className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('الوكالة (الماركة)') : rawText('AGENCY (MAKE)')}</label>
                                    <select
                                        id="agency-select"
                                        title={isRTL ? rawText('اختر الوكالة') : rawText('Select Agency')}
                                        value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-4 text-sm font-bold outline-none focus:border-luxury-gold/50 appearance-none"
                                    >
                                        <option value="">{isRTL ? rawText('كل الماركات') : rawText('ALL MAKES')}</option>
                                        {brands.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>

                                {/* Price Range */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">{isRTL ? rawText('النطاق السعري') : rawText('PRICE SPECTRUM')}</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {priceRanges.map(r => (
                                            <button
                                                key={r.id} onClick={() => { setPriceRange(priceRange === r.id ? '' : r.id); setPage(1); }}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                    priceRange === r.id ? "bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/30" : "bg-white/5 text-white/40 border border-white/5 hover:border-white/20"
                                                )}
                                            >
                                                {r.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-end">
                                    <button
                                        onClick={clearFilters}
                                        className="w-full flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                        {isRTL ? rawText('تصفير الفلاتر') : rawText('CLEAR SETTINGS')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Grid */}
                {loading && page === 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="aspect-4/5 rounded-[2.5rem] bg-white/2 border border-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : cars.length === 0 ? (
                    <div className="py-48 text-center bg-white/1 border border-dashed border-white/10 rounded-[3rem]">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                            <Car className="w-10 h-10 text-white/10" />
                        </div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4">{isRTL ? rawText('لا توجد نتائج') : rawText('OFF-LINE')}</h2>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">{isRTL ? rawText('جرب تعديل خيارات البحث') : rawText('RECONFIGURE SEARCH PARAMETERS')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12">
                            {cars.map((car, i) => {
                                const cardKey = String(car.id || car._id || `car-${i}`);
                                const imageSrc = resolveCarImage(car);
                                const showFallback = !imageSrc || imageErrors[cardKey];
                                return (
                                <motion.div
                                    key={cardKey}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i % 4) * 0.1 }}
                                    className="group relative"
                                >
                                    <div 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (!isLoggedIn) {
                                                router.push('/login');
                                            } else {
                                                router.push(`/cars/${car.id || car._id}`);
                                            }
                                        }}
                                        className="block obsidian-card obsidian-card-hover overflow-hidden rounded-[2.5rem] cursor-pointer"
                                    >
                                        {/* Image wrapper */}
                                        <div className="relative h-72 w-full bg-zinc-900">
                                            {showFallback ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                                    <div className="text-center">
                                                        <Car className="w-10 h-10 text-white/15 mx-auto mb-2" />
                                                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">No Image</div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={imageSrc}
                                                    alt={car.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                                    className="object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                                    onError={() => setImageErrors(prev => ({ ...prev, [cardKey]: true }))}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-linear-to-t from-cinematic-dark via-transparent to-transparent opacity-90" />

                                            {/* Top badges */}
                                            <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                <span className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black text-luxury-gold tracking-widest uppercase">
                                                    {car.year}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Body */}
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-2">
                                                <span className="text-[8px] font-black text-luxury-gold/50 tracking-[0.4em] uppercase">{getCarMakeLabel(car.make)}</span>
                                                <h3 className="text-2xl font-black tracking-tighter uppercase italic line-clamp-1 group-hover:text-luxury-gold transition-colors">{car.title}</h3>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase italic">
                                                    <Gauge className="w-3.5 h-3.5 text-luxury-gold/30" />
                                                    {car.mileage?.toLocaleString()} {rawText('km')}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-white/30 font-bold uppercase italic">
                                                    <Fuel className="w-3.5 h-3.5 text-luxury-gold/30" />
                                                    {car.fuel || rawText('GDI')}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-auto">
                                                <div>
                                                    <span className="text-[8px] font-black text-white/20 tracking-widest uppercase block mb-1">{rawText('MARKET VALUE')}</span>
                                                    <div className="text-2xl font-black italic gold-glow leading-none">
                                                          {formatPrice(Number(car.price || car.priceSar || 0))}
                                                    </div>
                                                </div>
                                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:text-black group-hover:border-luxury-gold transition-all duration-500">
                                                    <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:-rotate-45", isRTL && "rotate-180")} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-24 flex items-center justify-center gap-12">
                                <button
                                    onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === 1}
                                    className="px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-3"
                                >
                                    <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                    {isRTL ? rawText('السابق') : rawText('PREVIOUS')}
                                </button>
                                <div className="flex items-center gap-4 text-xs font-black italic">
                                    <span className="text-luxury-gold">{page}</span>
                                    <span className="w-1 h-1 rounded-full bg-white/20" />
                                    <span className="text-white/40">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                    disabled={page === totalPages}
                                    className="px-8 py-4 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 disabled:opacity-20 transition-all flex items-center gap-3"
                                >
                                    {isRTL ? rawText('التالي') : rawText('NEXT')}
                                    <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                </button>
                            </div>
                        )}
                    </>
                )}

            </main>
        </div>
    );
}
