'use client';

/**
 * [[ARABIC_COMMENT]] صفحة عرض سلة مشتركة - يمكن للأدمن فتحها لرؤية ما يريده العميل
 * URL: /cart/share?items=id1,id2,id3
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Package, MessageCircle, Car as CarIcon, Wrench } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { api } from '@/lib/api';

const DEFAULT_WHATSAPP = '+821080880014';

interface SharedItem {
    id: string;
    title: string;
    price: number;
    images?: string[];
    type: 'car' | 'part';
    make?: string;
    model?: string;
    year?: number | string;
    brand?: string;
    condition?: string;
    displayCurrency?: string;
}

export default function SharedCartPage() {
    const { isRTL } = useLanguage();
    const { formatPrice, socialLinks } = useSettings();
    const searchParams = useSearchParams();
    const [items, setItems] = useState<SharedItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const ids = searchParams?.get('items')?.split(',').filter(Boolean) || [];
        if (ids.length === 0) { setLoading(false); return; }

        // [[ARABIC_COMMENT]] جلب بيانات كل عنصر من API
        const fetchItems = async () => {
            const results: SharedItem[] = [];
            for (const id of ids) {
                try {
                    // [[ARABIC_COMMENT]] نحاول كسيارة أولاً ثم كقطعة
                    const res = await api.cars.getById(id).catch(() => null);
                    if (res?.success && res.data) {
                        const c = res.data;
                        results.push({
                            id,
                            type: 'car',
                            title: c.title || c.name || id,
                            price: c.price || c.priceSar || 0,
                            images: c.images || [],
                            make: typeof c.make === 'object' ? c.make?.name : c.make,
                            model: c.model,
                            year: c.year,
                            displayCurrency: c.displayCurrency,
                        });
                    }
                } catch { /* تجاهل الخطأ */ }
            }
            setItems(results);
            setLoading(false);
        };
        fetchItems();
    }, [searchParams]);

    const total = items.reduce((s, i) => s + (i.price || 0), 0);

    const contactWhatsapp = () => {
        const phone = (socialLinks?.whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, '');
        const list = items.map((it, i) => `${i + 1}. ${it.type === 'car' ? '🚗' : '🔧'} ${it.title}`).join('\n');
        const msg = isRTL
            ? `مرحباً 👋\n*عميل يريد الاستفسار عن السلة التالية:*\n\n${list}\n\nالإجمالي التقريبي: ${total.toLocaleString()} SAR`
            : `Hello 👋\n*Customer inquiry about cart:*\n\n${list}\n\nEstimated Total: ${total.toLocaleString()} SAR`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="relative min-h-screen bg-[#050505] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />
            <main className="relative z-10 pt-28 pb-24 px-4 max-w-2xl mx-auto">
                <div className="mb-8 text-center">
                    <ShoppingCart className="w-12 h-12 text-[#c9a96e] mx-auto mb-4" />
                    <h1 className="text-3xl font-black uppercase">{isRTL ? 'سلة المشتريات' : 'Shared Cart'}</h1>
                    <p className="text-white/30 text-sm mt-2">{isRTL ? 'عرض مشترك للمنتجات المطلوبة' : 'Shared list of requested items'}</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-2 border-[#c9a96e]/30 border-t-[#c9a96e] rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-white/30">
                        <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>{isRTL ? 'لا توجد منتجات في هذا الرابط' : 'No items found in this cart link'}</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, i) => (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                className="flex gap-4 bg-white/[0.02] border border-white/8 rounded-2xl p-4">
                                <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
                                    {item.images?.[0] ? (
                                        <Image src={item.images[0]} alt={item.title} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            {item.type === 'car' ? <CarIcon className="w-8 h-8 text-white/10" /> : <Wrench className="w-8 h-8 text-white/10" />}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="text-[9px] text-[#c9a96e]/60 font-black uppercase tracking-widest">
                                        {item.type === 'car' ? (isRTL ? 'سيارة' : 'CAR') : (isRTL ? 'قطعة غيار' : 'PART')} {item.make ? `• ${item.make}` : ''}
                                    </div>
                                    <h3 className="font-black uppercase text-sm mt-1">{item.title}</h3>
                                    <div className="text-[#c9a96e] font-black mt-1">
                                        {formatPrice ? formatPrice(item.price, item.displayCurrency as 'SAR' | 'USD' | 'KRW' | undefined) : `${item.price?.toLocaleString()} SAR`}
                                    </div>
                                    {item.year && <div className="text-[10px] text-white/30">{item.year}</div>}
                                </div>
                            </motion.div>
                        ))}

                        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 space-y-4 mt-6">
                            <div className="flex justify-between">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">{isRTL ? 'الإجمالي' : 'TOTAL'}</span>
                                <span className="text-xl font-black text-[#c9a96e]">{total.toLocaleString()} SAR</span>
                            </div>
                            <button onClick={contactWhatsapp}
                                className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-2xl text-black font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-2 transition-all">
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? 'التواصل مع الأدمن' : 'CONTACT ADMIN'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
