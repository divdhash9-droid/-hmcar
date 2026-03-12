'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, ArrowLeft, Package } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { useRouter } from 'next/navigation';

const rawText = (value: string) => value;

interface FavoriteItem {
    id: string;
    type: 'car' | 'part';
    title: string;
    price: number;
    image: string;
    brand?: string;
}

const ITEM_TYPE_CAR = 'car';

export default function FavoritesPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { formatPrice, socialLinks } = useSettings();
    const WHATSAPP_NUMBER = (socialLinks?.whatsapp || '+821080880014').replace(/\D/g, '');
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    useEffect(() => {
        const data = JSON.parse(localStorage.getItem('hm_favorites') || '[]');
        setFavorites(data);
    }, []);

    const removeFromFavorites = (id: string) => {
        const updated = favorites.filter(f => f.id !== id);
        setFavorites(updated);
        localStorage.setItem('hm_favorites', JSON.stringify(updated));
    };

    const addToCart = (item: FavoriteItem) => {
        const cart = JSON.parse(localStorage.getItem('hm_cart') || '[]');
        const exists = cart.find((c: { id: string }) => c.id === item.id);
        if (!exists) {
            cart.push({ id: item.id, type: item.type, title: item.title, price: item.price, image: item.image });
            localStorage.setItem('hm_cart', JSON.stringify(cart));
            window.dispatchEvent(new CustomEvent('hm_cart_updated'));
        }
        alert(isRTL ? `${rawText('✅')} ${rawText('تمت إضافة')} ${item.title} ${rawText('للسلة')}` : `${rawText('✅')} ${item.title} ${rawText('added to cart')}`);
    };

    const buyViaWhatsApp = (item: FavoriteItem) => {
        const msg = isRTL
            ? `💝 *طلب شراء من المفضلة*\n━━━━━━━━━━━━━━━━\n📌 *${item.title}*\n${item.brand ? `🏷️ الماركة: ${item.brand}\n` : ''}━━━━━━━━━━━━━━━━\n💰 السعر: ${formatPrice(item.price)}\n━━━━━━━━━━━━━━━━\n\nأرجو التواصل للإتمام ✅`
            : `💝 *Favorites Purchase Request*\n━━━━━━━━━━━━━━━━\n📌 *${item.title}*\n${item.brand ? `🏷️ Brand: ${item.brand}\n` : ''}━━━━━━━━━━━━━━━━\n💰 Price: ${formatPrice(item.price)}\n━━━━━━━━━━━━━━━━\n\nPlease contact me ✅`;
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className={`relative min-h-screen bg-cinematic-darker text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(239,68,68,0.08),transparent_50%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.02)_1px,transparent_1px)] bg-size-[60px_60px]" />
            </div>

            <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-16">
                    <button
                        onClick={() => router.back()}
                        title={isRTL ? rawText('رجوع') : rawText('Back')}
                        aria-label={isRTL ? rawText('رجوع') : rawText('Back')}
                        className="inline-flex items-center justify-center mb-8 w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group"
                    >
                        <ArrowLeft className={`w-4 h-4 transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-0.5 w-12 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-400">{rawText('Wishlist')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                                {isRTL ? rawText('قائمة') : rawText('MY')} <span className="text-transparent bg-clip-text bg-linear-to-b from-red-400 to-red-600">{isRTL ? rawText('المفضلة') : rawText('FAVORITES')}</span>
                            </h1>
                            <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold">
                                {favorites.length} {isRTL ? rawText('عنصر محفوظ') : rawText('saved items')}
                            </p>
                        </div>
                        <Heart className="w-16 h-16 text-red-500/20 fill-red-500/10" />
                    </div>
                </header>

                {favorites.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-32 space-y-6">
                        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                            <Heart className="w-10 h-10 text-red-500/40" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white/40">
                            {isRTL ? rawText('لا توجد عناصر في المفضلة') : rawText('NO FAVORITES YET')}
                        </h2>
                        <p className="text-white/20 text-sm">{isRTL ? rawText('اضغط على ❤️ في أي منتج لإضافته هنا') : rawText('Tap ❤️ on any product to add it here')}</p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/cars" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                {isRTL ? rawText('🚗 معرض HM CAR') : rawText('🚗 HM CAR Showroom')}
                            </Link>
                            <Link href="/parts" className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                {isRTL ? rawText('🔧 تصفح القطع') : rawText('🔧 Browse Parts')}
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {favorites.map((item, i) => (
                                <motion.div key={item.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.05 }} className="group">
                                    <div className="bg-white/2 border border-white/10 rounded-3xl overflow-hidden hover:border-red-500/30 transition-all duration-500">
                                        <div className="relative h-56 overflow-hidden">
                                            <Image src={item.image || '/images/placeholder.jpg'} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                                            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-white/70">
                                                    {item.type === ITEM_TYPE_CAR ? (isRTL ? rawText('🚗 سيارة') : rawText('🚗 Car')) : (isRTL ? rawText('🔧 قطعة') : rawText('🔧 Part'))}
                                                </span>
                                            </div>
                                            <button onClick={() => removeFromFavorites(item.id)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-all" title={isRTL ? rawText('إزالة من المفضلة') : rawText('Remove')}>
                                                <Heart className="w-4 h-4 fill-white text-white" />
                                            </button>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {item.brand && <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.3em]">{item.brand}</span>}
                                            <h3 className="font-black uppercase tracking-tight line-clamp-1 group-hover:text-red-400 transition-colors">{item.title}</h3>
                                            <div className="text-xl font-black text-red-400">{formatPrice(item.price)}</div>
                                            <div className="flex gap-2 pt-3 border-t border-white/5">
                                                <button onClick={() => addToCart(item)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/70 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest" title={isRTL ? rawText('أضف للسلة') : rawText('Add to Cart')}>
                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                    {isRTL ? rawText('السلة') : rawText('Cart')}
                                                </button>
                                                <button onClick={() => buyViaWhatsApp(item)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500 text-green-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest" title={isRTL ? rawText('شراء عبر واتساب') : rawText('Buy via WhatsApp')}>
                                                    <Package className="w-3.5 h-3.5" />
                                                    {isRTL ? rawText('شراء') : rawText('Buy')}
                                                </button>
                                                <button onClick={() => removeFromFavorites(item.id)} className="w-10 flex items-center justify-center py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/30 text-red-500 transition-all" title={isRTL ? rawText('حذف') : rawText('Remove')}>
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
