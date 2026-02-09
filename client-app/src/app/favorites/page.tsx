'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Heart, Trash2, ArrowRight, Gem, Car, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";
import { api } from "@/lib/api";

interface FavoriteItem {
    id: string;
    car: {
        _id: string;
        title: string;
        make: string;
        model: string;
        year: number;
        price: number;
        images: string[];
        listingType?: string;
    };
    createdAt: string;
}

export default function FavoritesPage() {
    const { t, isRTL } = useLanguage();
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.favorites.list();
            if (response.success) {
                setFavorites(response.data);
            }
        } catch (err: any) {
            setError(err.message || (isRTL ? 'فشل في تحميل المفضلات' : 'Failed to load favorites'));
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (carId: string) => {
        try {
            await api.favorites.remove(carId);
            setFavorites(favorites.filter(fav => fav.car._id !== carId));
        } catch (err) {
            console.error('Failed to remove favorite:', err);
        }
    };

    const handleClearAll = async () => {
        if (!confirm(isRTL ? 'هل تريد مسح جميع المفضلات؟' : 'Clear all favorites?')) return;
        try {
            await api.favorites.clear();
            setFavorites([]);
        } catch (err) {
            console.error('Failed to clear favorites:', err);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-[#c5a059]/5 via-black to-black" />
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#c5a059]/5 blur-[150px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-8">
                    <ClientPageHeader
                        title={isRTL ? 'المفضلة' : 'FAVORITES'}
                        subtitle={isRTL ? 'السيارات المحفوظة' : 'SAVED CARS'}
                        icon={Heart}
                    />

                    {favorites.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isRTL ? 'مسح الكل' : 'Clear All'}
                        </button>
                    )}
                </div>

                {/* Error State */}
                {error && (
                    <div className="flex items-center gap-3 p-4 bg-red-500/20 text-red-400 rounded-xl mb-8">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                        <button onClick={loadFavorites} className="ml-auto underline">
                            {isRTL ? 'إعادة المحاولة' : 'Retry'}
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {favorites.length === 0 && !error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-24 bg-white/5 rounded-3xl border border-white/10"
                    >
                        <Heart className="w-24 h-24 text-white/10 mx-auto mb-8" />
                        <h3 className="text-3xl font-black mb-4 text-white/40">
                            {isRTL ? 'لا توجد سيارات محفوظة' : 'No Favorites Yet'}
                        </h3>
                        <p className="text-white/30 mb-12">
                            {isRTL ? 'ابدأ بإضافة السيارات المفضلة لديك' : 'Start adding your favorite cars'}
                        </p>
                        <Link href="/showroom">
                            <button className="px-12 py-6 bg-[#c5a059] text-black font-bold rounded-2xl hover:bg-[#d4af68] transition-all">
                                {isRTL ? 'تصفح السيارات' : 'Browse Cars'}
                            </button>
                        </Link>
                    </motion.div>
                )}

                {/* Favorites Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {favorites.map((fav, i) => (
                            <motion.div
                                key={fav.id}
                                layout
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="group bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-[#c5a059]/30 transition-all"
                            >
                                {/* Image */}
                                <div className="relative h-48 overflow-hidden">
                                    {fav.car.images && fav.car.images.length > 0 ? (
                                        <img
                                            src={fav.car.images[0]}
                                            alt={fav.car.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <Car className="w-16 h-16 text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => handleRemove(fav.car._id)}
                                        className="absolute top-4 right-4 w-10 h-10 bg-red-500/80 backdrop-blur-xl rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <div className="text-[#c5a059] text-xs font-bold uppercase tracking-wider mb-1">
                                            {fav.car.make} • {fav.car.year}
                                        </div>
                                        <h3 className="text-lg font-black line-clamp-2 group-hover:text-[#c5a059] transition-colors">
                                            {fav.car.title || `${fav.car.make} ${fav.car.model}`}
                                        </h3>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div className="text-xl font-black text-[#c5a059]">
                                            {formatPrice(fav.car.price)} <span className="text-xs text-white/30">SAR</span>
                                        </div>
                                    </div>

                                    <Link href={`/cars/${fav.car._id}`} className="block">
                                        <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-[#c5a059] hover:text-black hover:border-[#c5a059] transition-all flex items-center justify-center gap-2">
                                            <span>{isRTL ? 'عرض التفاصيل' : 'View Details'}</span>
                                            <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                                        </button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
