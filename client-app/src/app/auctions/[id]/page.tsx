'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Gavel, Clock, Users, TrendingUp,
    ChevronLeft, ChevronRight, AlertCircle, CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';
import ClientPageHeader from '@/components/ClientPageHeader';
import { useSettings } from '@/lib/SettingsContext';

interface AuctionDetails {
    _id: string;
    title?: string;
    car: {
        _id: string;
        title: string;
        make: string;
        model: string;
        year: number;
        images: string[];
        mileage?: number;
        fuelType?: string;
        transmission?: string;
    };
    startingPrice: number;
    currentPrice: number;
    minBidIncrement?: number;
    startTime: string;
    endTime: string;
    status: string;
    totalBids?: number;
}

interface Bid {
    id: string;
    amount: number;
    bidder: { id: string; name: string };
    createdAt: string;
}

export default function AuctionDetailsPage() {
    const params = useParams();
    const { isRTL, locale } = useLocale();
    const { formatPrice: formatGlobalPrice } = useSettings();
    const [auction, setAuction] = useState<AuctionDetails | null>(null);
    const [bids, setBids] = useState<Bid[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bidAmount, setBidAmount] = useState('');
    const [bidding, setBidding] = useState(false);
    const [bidMessage, setBidMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

    const handleQuickBid = (increment: number) => {
        const currentBase = Number(auction?.currentPrice || auction?.startingPrice || 0);
        const minIncrement = Number(auction?.minBidIncrement || 100);
        const newAmount = Math.max(currentBase + minIncrement, currentBase + increment);
        setBidAmount(String(newAmount));
    };

    const fetchAuctionDetails = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.auctions.getById(params.id as string);
            if (response.success) {
                setAuction(response.data);
                setBidAmount(String((response.data.currentPrice || response.data.startingPrice) + (response.data.minBidIncrement || 100)));
            } else {
                setError(isRTL ? 'المزاد غير موجود' : 'Auction not found');
            }
        } catch (err: any) {
            setError(err.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
        } finally {
            setLoading(false);
        }
    }, [params.id, isRTL]);

    const fetchBids = useCallback(async () => {
        try {
            const response = await api.bids.auctionBids(params.id as string, 10);
            if (response.success) {
                setBids(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch bids:', err);
        }
    }, [params.id]);

    useEffect(() => {
        if (params.id) {
            fetchAuctionDetails();
            fetchBids();
        }
    }, [params.id, fetchAuctionDetails, fetchBids]);

    const calculateTimeLeft = useCallback(() => {
        if (!auction) return '';
        const end = new Date(auction.endTime).getTime();
        const now = Date.now();
        const diff = end - now;

        if (diff <= 0) return isRTL ? 'انتهى المزاد' : 'Auction Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}${isRTL ? 'ي' : 'd'} ${hours}${isRTL ? 'س' : 'h'} ${minutes}${isRTL ? 'د' : 'm'}`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, [auction, isRTL]);

    useEffect(() => {
        if (auction) {
            const timer = setInterval(() => {
                setTimeLeft(calculateTimeLeft());
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [auction, calculateTimeLeft]);

    const placeBid = async () => {
        const amount = parseInt(bidAmount);
        if (!amount || amount <= (auction?.currentPrice || 0)) {
            setBidMessage({
                type: 'error',
                text: isRTL ? 'المبلغ يجب أن يكون أعلى من السعر الحالي' : 'Amount must be higher than current price'
            });
            return;
        }

        try {
            setBidding(true);
            setBidMessage(null);
            const response = await api.bids.place(params.id as string, amount);
            if (response.success) {
                setBidMessage({ type: 'success', text: isRTL ? 'تم تقديم المزايدة بنجاح!' : 'Bid placed successfully!' });
                fetchAuctionDetails();
                fetchBids();
            }
        } catch (err: any) {
            setBidMessage({ type: 'error', text: err.message || (isRTL ? 'فشل في تقديم المزايدة' : 'Failed to place bid') });
        } finally {
            setBidding(false);
        }
    };

    const formatPrice = (price: number) => formatGlobalPrice(Number(price || 0), undefined, 'auction');

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString(locale === 'AR' ? 'ar-SA' : 'en-US');
    };

    const isActive = auction?.status === 'active' || auction?.status === 'running';

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-[#c5a059] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !auction) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <AlertCircle className="w-20 h-20 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold mb-4">{error || (isRTL ? 'المزاد غير موجود' : 'Auction not found')}</h1>
                <Link href="/auctions" className="text-[#c5a059] hover:underline">
                    {isRTL ? 'العودة للمزادات' : 'Back to Auctions'}
                </Link>
            </div>
        );
    }

    const car = auction.car;

    return (
        <div className={`min-h-screen bg-black text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="max-w-7xl mx-auto px-4 pt-24 pb-4">
                <ClientPageHeader title={isRTL ? 'تفاصيل المزاد' : 'Auction Details'} icon={Gavel} />
            </div>

            <main className="max-w-7xl mx-auto px-4 pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    {/* Main Content - 2 columns */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Image Gallery */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 border border-white/10"
                        >
                            {car.images && car.images.length > 0 ? (
                                (() => {
                                    const imageSrc = car.images[currentImageIndex] || '';
                                    const showFallback = !imageSrc || imageErrors[currentImageIndex];
                                    return showFallback ? (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                            <Gavel className="w-24 h-24 text-white/20" />
                                        </div>
                                    ) : (
                                        <Image
                                            src={imageSrc}
                                            alt={car.title}
                                            fill
                                            className="object-cover"
                                            onError={() => setImageErrors(prev => ({ ...prev, [currentImageIndex]: true }))}
                                            unoptimized
                                        />
                                    );
                                })()
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Gavel className="w-32 h-32 text-white/20" />
                                </div>
                            )}

                            {car.images && car.images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev - 1 + car.images.length) % car.images.length)}
                                        title={isRTL ? 'الصورة السابقة' : 'Previous Image'}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-[#c5a059] transition-colors"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentImageIndex((prev) => (prev + 1) % car.images.length)}
                                        title={isRTL ? 'الصورة التالية' : 'Next Image'}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-[#c5a059] transition-colors"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </>
                            )}

                            {/* Status Badge */}
                            <div className={`absolute top-4 left-4 px-4 py-2 rounded-full font-bold ${isActive ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                {isActive ? (isRTL ? 'مزاد نشط' : 'LIVE') : (isRTL ? 'انتهى' : 'ENDED')}
                            </div>
                        </motion.div>

                        {/* Car Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#c5a059] text-sm font-bold uppercase tracking-wider">
                                <span>{car.make}</span>
                                <span>•</span>
                                <span>{car.year}</span>
                            </div>
                            <h1 className="text-4xl font-black">{auction.title || `${car.make} ${car.model}`}</h1>

                            <div className="flex flex-wrap gap-4 text-white/60">
                                {car.mileage && <span>{car.mileage.toLocaleString()} {isRTL ? 'كم' : 'km'}</span>}
                                {car.fuelType && <span>• {car.fuelType}</span>}
                                {car.transmission && <span>• {car.transmission}</span>}
                            </div>
                        </div>

                        {/* Bid History */}
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-[#c5a059]" />
                                {isRTL ? 'سجل المزايدات' : 'Bid History'}
                            </h3>

                            {bids.length > 0 ? (
                                <div className="space-y-3">
                                    {bids.map((bid, index) => (
                                        <div
                                            key={bid.id}
                                            className={`flex items-center justify-between py-3 border-b border-white/10 last:border-0 ${index === 0 ? 'text-[#c5a059]' : 'text-white/70'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                                                    {bid.bidder.name}
                                                </div>
                                                <span>{index === 0 ? (isRTL ? 'أعلى مزايدة' : 'Highest Bid') : ''}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold">{formatPrice(bid.amount)}</div>
                                                <div className="text-xs text-white/40">{formatTime(bid.createdAt)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-white/50 text-center py-8">
                                    {isRTL ? 'لا توجد مزايدات بعد' : 'No bids yet'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Sidebar - Bidding Panel */}
                    <div className="space-y-6">
                        {/* Timer */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-[#c5a059]/20 to-[#c5a059]/5 rounded-3xl border border-[#c5a059]/30 p-6 text-center"
                        >
                            <Clock className="w-8 h-8 text-[#c5a059] mx-auto mb-3" />
                            <div className="text-white/60 text-sm mb-2">{isRTL ? 'الوقت المتبقي' : 'Time Remaining'}</div>
                            <div className="text-3xl font-black font-mono">{timeLeft}</div>
                        </motion.div>

                        {/* Current Price */}
                        <div className="bg-white/5 rounded-3xl border border-white/10 p-6">
                            <div className="text-white/60 text-sm mb-2">{isRTL ? 'السعر الحالي' : 'Current Price'}</div>
                            <div className="text-4xl font-black text-[#c5a059]">
                                {formatPrice(auction.currentPrice || auction.startingPrice)}
                            </div>
                            <div className="text-white/40 text-sm mt-2">
                                {isRTL ? 'سعر البداية:' : 'Starting:'} {formatPrice(auction.startingPrice)}
                            </div>
                        </div>

                        {/* Bidding Form */}
                        {isActive && (
                            <div className="bg-white/5 rounded-3xl border border-white/10 p-6 space-y-4">
                                <h3 className="font-bold text-lg">{isRTL ? 'قدم مزايدتك' : 'Place Your Bid'}</h3>

                                <div>
                                    <label className="text-white/60 text-sm block mb-2">
                                        {isRTL ? 'قيمة المزايدة' : 'Bid Amount'}
                                    </label>
                                    <input
                                        type="number"
                                        value={bidAmount}
                                        onChange={(e) => setBidAmount(e.target.value)}
                                        min={(auction.currentPrice || auction.startingPrice) + (auction.minBidIncrement || 100)}
                                        step={auction.minBidIncrement || 100}
                                        title={isRTL ? 'مبلغ المزايدة' : 'Bid Amount'}
                                        className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[#c5a059]"
                                    />
                                    <div className="text-white/40 text-xs mt-1">
                                        {isRTL ? 'الحد الأدنى للزيادة:' : 'Min Increment:'} {formatPrice(auction.minBidIncrement || 100)}
                                    </div>
                                </div>

                                {/* Quick Bid Buttons */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[500, 1000, 5000].map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => handleQuickBid(amount)}
                                            className="py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:bg-white/10 hover:border-[#c5a059]/40 transition-all"
                                        >
                                            +{amount}
                                        </button>
                                    ))}
                                </div>

                                {bidMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-xl ${bidMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {bidMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                        <span>{bidMessage.text}</span>
                                    </div>
                                )}

                                <button
                                    onClick={placeBid}
                                    disabled={bidding}
                                    className="w-full py-4 bg-[#c5a059] text-black font-bold rounded-xl hover:bg-[#d4af68] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Gavel className="w-5 h-5" />
                                    {bidding ? (isRTL ? 'جاري التقديم...' : 'Placing...') : (isRTL ? 'قدم المزايدة' : 'Place Bid')}
                                </button>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                                <Users className="w-6 h-6 text-[#c5a059] mx-auto mb-2" />
                                <div className="text-2xl font-bold">{bids.length}</div>
                                <div className="text-white/50 text-sm">{isRTL ? 'مزايدة' : 'Bids'}</div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/10">
                                <TrendingUp className="w-6 h-6 text-[#c5a059] mx-auto mb-2" />
                                <div className="text-2xl font-bold">
                                    {auction.currentPrice && auction.startingPrice
                                        ? Math.round(((auction.currentPrice - auction.startingPrice) / auction.startingPrice) * 100)
                                        : 0}%
                                </div>
                                <div className="text-white/50 text-sm">{isRTL ? 'زيادة' : 'Increase'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
