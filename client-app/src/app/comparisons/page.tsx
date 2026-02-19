'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Scale, X, Plus, Car, Gauge, Fuel, Settings,
    Calendar, Trash2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import ClientPageHeader from '@/components/ClientPageHeader';

interface CarData {
    _id: string;
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    color?: string;
    description?: string;
    images: string[];
}

export default function ComparisonsPageWrapper() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <ComparisonsPage />
        </Suspense>
    );
}

function ComparisonsPage() {
    const searchParams = useSearchParams();
    const { isRTL, locale } = useLocale();
    const [cars, setCars] = useState<CarData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComparisons();
    }, []);

    const fetchComparisons = async () => {
        try {
            setLoading(true);

            // Check if there are car IDs in URL params
            const carIds = searchParams.get('ids')?.split(',');

            if (carIds && carIds.length > 0) {
                const response = await api.comparisons.compare(carIds);
                if (response.success) {
                    setCars(response.data);
                }
            } else {
                // Get saved comparisons
                const response = await api.comparisons.get();
                if (response.success) {
                    setCars(response.data);
                }
            }
        } catch (err) {
            console.error('Failed to fetch comparisons:', err);
        } finally {
            setLoading(false);
        }
    };

    const removeCar = async (carId: string) => {
        try {
            await api.comparisons.remove(carId);
            setCars(cars.filter(car => car._id !== carId));
        } catch (err) {
            console.error('Failed to remove car:', err);
        }
    };

    const clearAll = async () => {
        try {
            await api.comparisons.clear();
            setCars([]);
        } catch (err) {
            console.error('Failed to clear comparisons:', err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(locale === 'AR' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const specs = [
        { key: 'price', label: isRTL ? 'السعر' : 'Price', icon: null, format: (v: any) => formatPrice(v) },
        { key: 'year', label: isRTL ? 'السنة' : 'Year', icon: Calendar },
        { key: 'mileage', label: isRTL ? 'المسافة' : 'Mileage', icon: Gauge, format: (v: any) => v ? `${v.toLocaleString()} ${isRTL ? 'كم' : 'km'}` : '-' },
        { key: 'fuelType', label: isRTL ? 'الوقود' : 'Fuel', icon: Fuel },
        { key: 'transmission', label: isRTL ? 'ناقل الحركة' : 'Transmission', icon: Settings },
        { key: 'color', label: isRTL ? 'اللون' : 'Color', icon: null },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <section className="pt-32 pb-10 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <ClientPageHeader title={isRTL ? 'مقارنة السيارات' : 'Compare Cars'} icon={Scale} />

                        {cars.length > 0 && (
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                <span>{isRTL ? 'مسح الكل' : 'Clear All'}</span>
                            </button>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="w-20 h-20 bg-[#c5a059]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Scale className="w-10 h-10 text-[#c5a059]" />
                        </div>
                        <h1 className="text-5xl font-black mb-4">
                            {isRTL ? 'مقارنة السيارات' : 'Compare Cars'}
                        </h1>
                        <p className="text-xl text-white/60">
                            {cars.length > 0
                                ? (isRTL ? `مقارنة ${cars.length} سيارات` : `Comparing ${cars.length} cars`)
                                : (isRTL ? 'أضف سيارات للمقارنة' : 'Add cars to compare')}
                        </p>
                    </motion.div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 pb-20">
                {cars.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <Car className="w-24 h-24 text-white/20 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-4">
                            {isRTL ? 'لا توجد سيارات للمقارنة' : 'No cars to compare'}
                        </h2>
                        <p className="text-white/60 mb-8">
                            {isRTL
                                ? 'ابحث عن سيارات وأضفها للمقارنة'
                                : 'Search for cars and add them to compare'}
                        </p>
                        <Link
                            href="/showroom"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            {isRTL ? 'تصفح السيارات' : 'Browse Cars'}
                        </Link>
                    </motion.div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            {/* Car Images & Titles */}
                            <thead>
                                <tr>
                                    <th className="p-4 text-left w-48"></th>
                                    {cars.map((car, index) => (
                                        <th key={car._id} className="p-4 min-w-[280px]">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="relative bg-white/5 rounded-2xl border border-white/10 overflow-hidden group"
                                            >
                                                {/* Remove Button */}
                                                <button
                                                    onClick={() => removeCar(car._id)}
                                                    className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500/80 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>

                                                {/* Image */}
                                                <div className="aspect-video">
                                                    {car.images && car.images.length > 0 ? (
                                                        <img src={car.images[0]} alt={car.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                            <Car className="w-16 h-16 text-white/20" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <div className="p-4">
                                                    <div className="text-[#c5a059] text-xs font-bold uppercase mb-1">
                                                        {car.make} • {car.year}
                                                    </div>
                                                    <Link
                                                        href={`/cars/${car._id}`}
                                                        className="font-bold hover:text-[#c5a059] transition-colors"
                                                    >
                                                        {car.title || `${car.make} ${car.model}`}
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        </th>
                                    ))}
                                    {/* Add More Button */}
                                    {cars.length < 4 && (
                                        <th className="p-4 min-w-[200px]">
                                            <Link
                                                href="/showroom"
                                                className="flex flex-col items-center justify-center h-full min-h-[250px] bg-white/5 rounded-2xl border border-dashed border-white/20 hover:border-[#c5a059] transition-all group"
                                            >
                                                <Plus className="w-12 h-12 text-white/40 group-hover:text-[#c5a059] transition-colors mb-3" />
                                                <span className="text-white/40 group-hover:text-[#c5a059] transition-colors">
                                                    {isRTL ? 'أضف سيارة' : 'Add Car'}
                                                </span>
                                            </Link>
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            {/* Specs Rows */}
                            <tbody>
                                {specs.map((spec, specIndex) => (
                                    <tr key={spec.key} className={specIndex % 2 === 0 ? 'bg-white/5' : ''}>
                                        <td className="p-4 font-bold text-white/60">
                                            <div className="flex items-center gap-3">
                                                {spec.icon && <spec.icon className="w-5 h-5 text-[#c5a059]" />}
                                                {spec.label}
                                            </div>
                                        </td>
                                        {cars.map((car) => (
                                            <td key={car._id} className="p-4 text-center">
                                                <span className={spec.key === 'price' ? 'text-[#c5a059] font-bold text-xl' : ''}>
                                                    {spec.format
                                                        ? spec.format((car as any)[spec.key])
                                                        : (car as any)[spec.key] || '-'}
                                                </span>
                                            </td>
                                        ))}
                                        {cars.length < 4 && <td></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}
