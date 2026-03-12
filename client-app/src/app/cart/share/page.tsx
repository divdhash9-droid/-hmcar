'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertCircle, Share2 as Share2Icon, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api';
import { ProductModalData } from '@/components/ProductModal';

function SharedCartContent() {
    const searchParams = useSearchParams();
    const { isRTL } = useLanguage();
    const { formatPriceFromUsd, socialLinks, currency } = useSettings();
    const [items, setItems] = useState<ProductModalData[]>([]);
    const [loading, setLoading] = useState(true);

    const itemsParam = searchParams.get('items');

    useEffect(() => {
        if (!itemsParam) {
            setLoading(false);
            return;
        }

        const loadItems = async () => {
            try {
                const ids = itemsParam.split(',');
                const promises = ids.map(id => api.cars.getById(id).catch(() => api.parts.list({ id }).then(res => res.parts.find((p: any) => p.id === id))));

                const results = await Promise.all(promises);
                const validItems = results.filter(Boolean).map(res => {
                    const data = res.data || res;
                    return {
                        id: data.id || data._id,
                        title: data.title || data.name,
                        price: data.basePriceUsd || data.priceUsd || data.price || data.priceSar,
                        images: data.images || [],
                        type: data.category ? 'car' : 'part',
                        make: data.make,
                        brand: data.brand,
                        year: data.year,
                        displayCurrency: data.basePriceUsd || data.priceUsd ? 'USD' : (data.priceKrw ? 'KRW' : 'SAR')
                    } as ProductModalData;
                });

                setItems(validItems);
            } catch (err) {
                console.error('Failed to load shared items', err);
            } finally {
                setLoading(false);
            }
        };

        loadItems();
    }, [itemsParam, isRTL]);

    const toBaseUsd = (item: ProductModalData) => {
        const amount = Number(item.price || 0);
        if (!Number.isFinite(amount) || amount <= 0) return 0;

        const sourceCurrency = (item.displayCurrency || 'SAR') as 'SAR' | 'USD' | 'KRW';
        if (sourceCurrency === 'USD') return amount;
        if (sourceCurrency === 'KRW') return amount / Number(currency.usdToKrw || 1);
        return amount / Number(currency.usdToSar || 1);
    };

    const totalUsd = items.reduce((sum, item) => sum + toBaseUsd(item), 0);

    const contactAdmin = () => {
        const phone = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');
        const msg = isRTL
            ? `مرحباً، أنا أراجع سلة تسوق مشتركة تحتوي على ${items.length} منتجات.\nرابط السلة: ${window.location.href}`
            : `Hello, I am reviewing a shared cart with ${items.length} items.\nCart link: ${window.location.href}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <div className="w-12 h-12 border-4 border-[#c9a96e]/20 border-t-[#c9a96e] rounded-full animate-spin" />
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                    {isRTL ? 'جاري جلب السلة...' : 'FETCHING SHARED CART...'}
                </p>
            </div>
        );
    }

    if (!itemsParam || items.length === 0) {
        return (
            <div className="text-center py-32 space-y-6">
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white/40">{isRTL ? 'الرابط غير صالح' : 'Invalid Link'}</h2>
                <Link href="/showroom">
                    <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        {isRTL ? 'العودة للمتجر' : 'GO TO STORE'}
                    </button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Share2Icon className="w-7 h-7 text-[#c9a96e]" />
                        {isRTL ? 'سلة مشتركة' : 'Shared Cart'}
                    </h1>
                    <p className="text-white/30 text-xs mt-1">
                        {isRTL ? `تحتوي على ${items.length} منتجات من HM CAR` : `Contains ${items.length} premium items from HM CAR`}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-white/[0.02] border border-white/8 rounded-2xl p-4">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 border border-white/5">
                            {item.images?.[0] ? (
                                <Image src={item.images[0]} alt={item.title} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-white/10" /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-black uppercase tracking-widest text-[#c9a96e]/60 mb-1">
                                {item.type === 'car' ? (isRTL ? 'سيارة' : 'CAR') : (isRTL ? 'قطعة غيار' : 'PART')}
                                {item.make && ` • ${item.make}`}
                                {item.brand && ` • ${item.brand}`}
                            </div>
                            <h3 className="font-bold text-sm text-white/90 truncate">{item.title}</h3>
                            <div className="text-[#c9a96e] font-black text-base mt-1">
                                {formatPriceFromUsd ? formatPriceFromUsd(toBaseUsd(item)) : `${item.price?.toLocaleString()} SAR`}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#c9a96e]/5 border border-[#c9a96e]/20 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[11px] font-black uppercase tracking-widest text-white/40">
                        {isRTL ? 'إجمالي السعر' : 'TOTAL PRICE'}
                    </span>
                    <span className="text-2xl font-black text-[#c9a96e]">
                        {formatPriceFromUsd ? formatPriceFromUsd(totalUsd) : `${totalUsd.toLocaleString()} SAR`}
                    </span>
                </div>
                <button
                    onClick={contactAdmin}
                    className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-2xl text-black font-black uppercase text-[12px] tracking-[0.2em] shadow-[0_0_30px_rgba(34,197,94,0.2)] transition-all flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-5 h-5" />
                    {isRTL ? 'تواصل معنا بخصوص السلة' : 'INQUIRE ABOUT THIS CART'}
                </button>
            </div>
        </div>
    );
}

export default function SharedCartPage() {
    return (
        <div className="relative min-h-screen bg-[#050505] text-white">
            <Navbar />
            <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6 max-w-2xl mx-auto">
                <Suspense fallback={<div className="text-center py-32 text-white/20 uppercase tracking-widest text-[11px] font-black animate-pulse">Initializing shared link...</div>}>
                    <SharedCartContent />
                </Suspense>
            </main>
        </div>
    );
}
