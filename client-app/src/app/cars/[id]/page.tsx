'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Heart, Share2, Phone, MessageCircle,
    Gauge, Fuel, Settings, Car,
    ChevronLeft, ChevronRight, Check, X, Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import ClientPageHeader from '@/components/ClientPageHeader';

interface CarDetails {
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
    location?: string;
    features?: string[];
    isActive?: boolean;
    isSold?: boolean;
    listingType?: string;
    createdAt?: string;
}

export default function CarDetailsPage() {
    const params = useParams();
    const { isRTL, locale } = useLocale();
    const [car, setCar] = useState<CarDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [contactPhone, setContactPhone] = useState('+966500000000');

    useEffect(() => {
        if (params.id) {
            fetchCarDetails();
            checkFavorite();
        }
        // جلب رقم الاتصال من الإعدادات العامة (لا يحتاج تسجيل دخول)
        api.settings.getPublic().then((res: any) => {
            if (res?.success && res?.data?.socialLinks?.whatsapp) {
                setContactPhone(res.data.socialLinks.whatsapp);
            }
        }).catch(() => { });
    }, [params.id]);

    const fetchCarDetails = async () => {
        try {
            setLoading(true);
            const response = await api.cars.getById(params.id as string);
            if (response.success) {
                setCar(response.data);
            } else {
                setError(isRTL ? 'السيارة غير موجودة' : 'Car not found');
            }
        } catch (err: any) {
            setError(err.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const checkFavorite = async () => {
        try {
            const response = await api.favorites.check(params.id as string);
            setIsFavorite(response.isFavorite);
        } catch (err) {
            // Not logged in or error
        }
    };

    const toggleFavorite = async () => {
        try {
            if (isFavorite) {
                await api.favorites.remove(params.id as string);
            } else {
                await api.favorites.add(params.id as string);
            }
            setIsFavorite(!isFavorite);
        } catch (err) {
            alert(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
        }
    };

    const addToComparison = async () => {
        try {
            await api.comparisons.add(params.id as string);
            alert(isRTL ? 'تمت الإضافة للمقارنة' : 'Added to comparison');
        } catch (err: any) {
            alert(err.message);
        }
    };

    const nextImage = () => {
        if (car?.images && car.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % car.images.length);
        }
    };

    const prevImage = () => {
        if (car?.images && car.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(locale === 'AR' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR',
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

    if (error || !car) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <X className="w-20 h-20 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-4">{error || (isRTL ? 'السيارة غير موجودة' : 'Car not found')}</h1>
                <Link href="/showroom" className="text-[#c5a059] hover:underline">
                    {isRTL ? 'العودة للمعرض' : 'Back to Showroom'}
                </Link>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto px-4 pt-24 pb-4">
                <ClientPageHeader title={isRTL ? 'تفاصيل السيارة' : 'Car Details'} icon={Car} />
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                    {/* Image Gallery */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        {/* Main Image */}
                        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white/5 border border-white/10">
                            {car.images && car.images.length > 0 ? (
                                <img
                                    src={car.images[currentImageIndex]}
                                    alt={car.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Car className="w-32 h-32 text-white/20" />
                                </div>
                            )}

                            {/* Navigation Arrows */}
                            {car.images && car.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-[#c5a059] transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-[#c5a059] transition-colors"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter */}
                            {car.images && car.images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-xl rounded-full text-sm">
                                    {currentImageIndex + 1} / {car.images.length}
                                </div>
                            )}

                            {/* Sold Badge */}
                            {car.isSold && (
                                <div className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white font-bold rounded-full">
                                    {isRTL ? 'مُباع' : 'SOLD'}
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {car.images && car.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                                {car.images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${index === currentImageIndex ? 'border-[#c5a059]' : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Car Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        {/* Title & Price */}
                        <div>
                            <div className="flex items-center gap-3 text-[#c5a059] text-sm font-bold uppercase tracking-wider mb-2">
                                <span>{car.make}</span>
                                <span>•</span>
                                <span>{car.year}</span>
                            </div>
                            <h1 className="text-4xl font-black mb-4">{car.title || `${car.make} ${car.model}`}</h1>
                            <div className="text-4xl font-black text-[#c5a059]">
                                {formatPrice(car.price)}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-4">
                            <button
                                onClick={toggleFavorite}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl border transition-all ${isFavorite
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : 'border-white/20 hover:border-[#c5a059] hover:text-[#c5a059]'
                                    }`}
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                                <span>{isRTL ? 'المفضلة' : 'Favorite'}</span>
                            </button>
                            <button
                                onClick={addToComparison}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-[#c5a059] hover:text-[#c5a059] transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span>{isRTL ? 'قارن' : 'Compare'}</span>
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-[#c5a059] hover:text-[#c5a059] transition-all">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {car.mileage && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Gauge className="w-6 h-6 text-[#c5a059] mb-2" />
                                    <div className="text-white/50 text-sm">{isRTL ? 'المسافة' : 'Mileage'}</div>
                                    <div className="font-bold">{car.mileage.toLocaleString()} {isRTL ? 'كم' : 'km'}</div>
                                </div>
                            )}
                            {car.fuelType && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Fuel className="w-6 h-6 text-[#c5a059] mb-2" />
                                    <div className="text-white/50 text-sm">{isRTL ? 'الوقود' : 'Fuel'}</div>
                                    <div className="font-bold">{car.fuelType}</div>
                                </div>
                            )}
                            {car.transmission && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <Settings className="w-6 h-6 text-[#c5a059] mb-2" />
                                    <div className="text-white/50 text-sm">{isRTL ? 'ناقل الحركة' : 'Transmission'}</div>
                                    <div className="font-bold">{car.transmission}</div>
                                </div>
                            )}
                            {car.color && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="w-6 h-6 rounded-full mb-2" style={{ backgroundColor: car.color }} />
                                    <div className="text-white/50 text-sm">{isRTL ? 'اللون' : 'Color'}</div>
                                    <div className="font-bold">{car.color}</div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {car.description && (
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">{isRTL ? 'الوصف' : 'Description'}</h3>
                                <p className="text-white/70 leading-relaxed">{car.description}</p>
                            </div>
                        )}

                        {/* Features */}
                        {car.features && car.features.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">{isRTL ? 'المميزات' : 'Features'}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {car.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2 text-white/70">
                                            <Check className="w-4 h-4 text-[#c5a059]" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact Buttons */}
                        {!car.isSold && (
                            <div className="flex gap-4 pt-4">
                                <a
                                    href={`tel:${contactPhone}`}
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-all"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>{isRTL ? 'اتصل الآن' : 'Call Now'}</span>
                                </a>
                                <a
                                    href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(isRTL ? `أريد الاستفسار عن: ${car.title}` : `I'm interested in: ${car.title}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                    <span>{isRTL ? 'واتساب' : 'WhatsApp'}</span>
                                </a>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
