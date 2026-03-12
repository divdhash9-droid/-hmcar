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
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import Image from 'next/image';

const rawText = (value: string) => value;
const getCarMakeLabel = (make: CarModel['make']) => (typeof make === 'object' && make ? make.name : make);

interface CarModel {
    id?: string;
    _id?: string;
    title: string;
    make: string | { name: string };
    year: number;
    price: number;
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
    const searchParams = useSearchParams();
    const { isRTL } = useLanguage();

    const [cars, setCars] = useState<CarModel[]>([]);
    const [brands, setBrands] = useState<BrandModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);

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
            const res = await api.brands.list('cars');
            if (res.success) setBrands(res.brands);
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
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <div className="flex items-center gap-3 text-luxury-gold/60 mb-4">
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">{isRTL ? rawText('مستودع السيارات') : rawText('VEHICLE TERMINAL')}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                            {isRTL ? rawText('تصفح') : rawText('BROWSE')} <span className="text-luxury-gold">{isRTL ? rawText('المخزون') : rawText('INVENTORY')}</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 md:p-3"
                    >
                        <div className="px-4 py-2 border-r border-white/10">
                            <span className="text-2xl font-black text-white">{total}</span>
                            <span className="text-[10px] text-white/30 uppercase block font-bold">{isRTL ? rawText('سيارة متاحة') : rawText('ASSETS')}</span>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-xl transition-all font-black uppercase tracking-widest text-[10px]",
                                showFilters ? "bg-luxury-gold text-black" : "hover:bg-white/5 text-white/60"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            {isRTL ? rawText('الفلاتر') : rawText('FILTERS')}
                        </button>
                    </motion.div>
                </div>

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
                            {cars.map((car, i) => (
                                <motion.div
                                    key={car.id || car._id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: (i % 4) * 0.1 }}
                                    className="group relative"
                                >
                                    <Link href={`/cars/${car.id || car._id}`} className="block obsidian-card obsidian-card-hover overflow-hidden rounded-[2.5rem]">
                                        {/* Image wrapper */}
                                        <div className="relative h-72 w-full bg-zinc-900">
                                            <Image
                                                src={car.images?.[0] || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=1000'}
                                                alt={car.title} fill className="object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 opacity-60 group-hover:opacity-100"
                                            />
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
                                                        {Number(car.price).toLocaleString()} <span className="text-[10px] not-italic text-white/40 ml-1">{rawText('SAR')}</span>
                                                    </div>
                                                </div>
                                                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-luxury-gold group-hover:text-black group-hover:border-luxury-gold transition-all duration-500">
                                                    <ArrowRight className={cn("w-5 h-5 transition-transform group-hover:-rotate-45", isRTL && "rotate-180")} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
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

