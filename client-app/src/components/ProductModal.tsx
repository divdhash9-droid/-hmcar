'use client';

/**
 * [[ARABIC_COMMENT]] مربع المنتج - بتصميم مشابه لـ Shein
 * يُعرض عند الضغط على أي سيارة أو قطعة غيار
 * يحتوي: صور، سعر، وصف، أزرار (مفضلة، سلة، شراء، إغلاق)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Heart, ShoppingCart, MessageCircle,
    ChevronLeft, ChevronRight, Share2, Check,
    Fuel, Gauge, Settings2, Calendar, Tag, Car as CarIcon
} from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';

// [[ARABIC_COMMENT]] نوع المنتج - سيارة أو قطعة غيار
export type ProductType = 'car' | 'part';

export interface ProductModalData {
    id: string;
    type: ProductType;
    title: string;
    images: string[];
    price: number;
    displayCurrency?: string;
    description?: string;
    // سيارة
    make?: string;
    model?: string;
    year?: number | string;
    color?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    category?: string;
    // قطعة غيار
    brand?: string;
    condition?: string;
    compatibility?: string[];
    stock?: number;
}

interface ProductModalProps {
    product: ProductModalData | null;
    onClose: () => void;
    whatsappNumber?: string;
}

const CART_KEY = 'hm_cart';
const FAVORITES_KEY = 'hm_favorites';

// [[ARABIC_COMMENT]] دالة مساعدة لجلب السلة من localStorage
function getCart(): ProductModalData[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
    catch { return []; }
}

// [[ARABIC_COMMENT]] دالة مساعدة لجلب المفضلة من localStorage
function getFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); }
    catch { return []; }
}

// [[ARABIC_COMMENT]] حدث مخصص لتحديث عداد السلة في Navbar
function dispatchCartUpdate() {
    window.dispatchEvent(new Event('hm_cart_updated'));
}

export default function ProductModal({ product, onClose, whatsappNumber }: ProductModalProps) {
    const { isRTL } = useLanguage();
    const { formatPrice } = useSettings();
    const [activeImg, setActiveImg] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [inCart, setInCart] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [copied, setCopied] = useState(false);

    // [[ARABIC_COMMENT]] التحقق من حالة المفضلة والسلة عند فتح المنتج
    useEffect(() => {
        if (!product) return;
        setActiveImg(0);
        const favs = getFavorites();
        setIsFavorite(favs.includes(product.id));
        const cart = getCart();
        setInCart(cart.some(i => i.id === product.id));
        setAddedToCart(false);
    }, [product]);

    // [[ARABIC_COMMENT]] إغلاق بالـ Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const toggleFavorite = useCallback(() => {
        if (!product) return;
        const favs = getFavorites();
        let newFavs: string[];
        if (favs.includes(product.id)) {
            newFavs = favs.filter(id => id !== product.id);
        } else {
            newFavs = [...favs, product.id];
        }
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
        setIsFavorite(!isFavorite);
    }, [product, isFavorite]);

    const addToCart = useCallback(() => {
        if (!product) return;
        const cart = getCart();
        if (!cart.some(i => i.id === product.id)) {
            cart.push(product);
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            dispatchCartUpdate();
        }
        setInCart(true);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    }, [product]);

    const buyViaWhatsapp = useCallback(() => {
        if (!product) return;
        const phone = (whatsappNumber || '+821080880014').replace(/\D/g, '');
        const price = formatPrice ? formatPrice(product.price, product.displayCurrency as 'SAR' | 'USD' | 'KRW' | undefined) : `${product.price?.toLocaleString()} SAR`;

        let msg = '';
        if (product.type === 'car') {
            msg = isRTL
                ? `السلام عليكم 👋\n\n🚗 *طلب شراء سيارة من المعرض*\n━━━━━━━━━━━━━━━━\n📌 *${product.title}*\n🏭 الماركة: ${product.make || '—'}\n📋 الموديل: ${product.model || '—'}\n📅 السنة: ${product.year || '—'}\n🎨 اللون: ${product.color || '—'}\n⛽ الوقود: ${product.fuelType || '—'}\n⚙️ ناقل الحركة: ${product.transmission || '—'}\n🛣️ المسافة: ${product.mileage ? product.mileage.toLocaleString() + ' كم' : '—'}\n━━━━━━━━━━━━━━━━\n💰 *السعر: ${price}*\n━━━━━━━━━━━━━━━━\n\nأرجو التواصل للاستفسار والاتفاق 🤝`
                : `Hello 👋\n\n🚗 *Car Purchase Request*\n━━━━━━━━━━━━━━━━\n📌 *${product.title}*\n🏭 Make: ${product.make || '—'}\n📋 Model: ${product.model || '—'}\n📅 Year: ${product.year || '—'}\n🎨 Color: ${product.color || '—'}\n⛽ Fuel: ${product.fuelType || '—'}\n⚙️ Transmission: ${product.transmission || '—'}\n🛣️ Mileage: ${product.mileage ? product.mileage.toLocaleString() + ' km' : '—'}\n━━━━━━━━━━━━━━━━\n💰 *Price: ${price}*\n━━━━━━━━━━━━━━━━\n\nPlease contact me to discuss 🤝`;
        } else {
            msg = isRTL
                ? `السلام عليكم 👋\n\n🔧 *طلب شراء قطعة غيار*\n━━━━━━━━━━━━━━━━\n📌 *${product.title}*\n🏭 الماركة: ${product.brand || '—'}\n📦 الحالة: ${product.condition || '—'}\n🚗 متوافق مع: ${product.compatibility?.join('، ') || '—'}\n━━━━━━━━━━━━━━━━\n💰 *السعر: ${price}*\n━━━━━━━━━━━━━━━━\n\nأرجو التواصل للاستفسار والاتفاق 🤝`
                : `Hello 👋\n\n🔧 *Spare Part Purchase Request*\n━━━━━━━━━━━━━━━━\n📌 *${product.title}*\n🏭 Brand: ${product.brand || '—'}\n📦 Condition: ${product.condition || '—'}\n🚗 Compatible: ${product.compatibility?.join(', ') || '—'}\n━━━━━━━━━━━━━━━━\n💰 *Price: ${price}*\n━━━━━━━━━━━━━━━━\n\nPlease contact me to discuss 🤝`;
        }

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    }, [product, whatsappNumber, formatPrice, isRTL]);

    const shareProduct = useCallback(() => {
        if (!product) return;
        const url = product.type === 'car'
            ? `${window.location.origin}/showroom/${product.id}`
            : `${window.location.origin}/parts?item=${product.id}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => { });
    }, [product]);

    const images = product?.images?.filter(Boolean) || [];
    const displayPrice = product && formatPrice ? formatPrice(product.price, product.displayCurrency as 'SAR' | 'USD' | 'KRW' | undefined) : `${product?.price?.toLocaleString()} SAR`;

    return (
        <AnimatePresence>
            {product && (
                // [[ARABIC_COMMENT]] خلفية شفافة داكنة - تُغلق المربع عند الضغط عليها
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
                    onClick={onClose}
                >
                    {/* [[ARABIC_COMMENT]] المربع الرئيسي - يمنع إغلاق المودال عند الضغط داخله */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 80, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        onClick={e => e.stopPropagation()}
                        className="relative w-full sm:max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col"
                        dir={isRTL ? 'rtl' : 'ltr'}
                    >
                        {/* [[ARABIC_COMMENT]] شريط الإمساك الجمالي على موبايل */}
                        <div className="sm:hidden w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                        {/* [[ARABIC_COMMENT]] زر الإغلاق */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
                            aria-label="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* [[ARABIC_COMMENT]] زر المشاركة */}
                        <button
                            onClick={shareProduct}
                            className="absolute top-4 left-4 z-30 w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/80 transition-all backdrop-blur-sm"
                            aria-label="Share"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
                        </button>

                        {/* [[ARABIC_COMMENT]] قسم الصور */}
                        <div className="relative bg-black h-60 shrink-0">
                            {images.length > 0 ? (
                                <>
                                    <Image
                                        src={images[activeImg]}
                                        alt={product.title}
                                        fill
                                        sizes="(max-width: 640px) 100vw, 640px"
                                        quality={75}
                                        priority
                                        className="object-cover"
                                    />
                                    {/* [[ARABIC_COMMENT]] تدرج لوني في الأسفل لدمج الصورة مع المحتوى */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-transparent to-transparent" />

                                    {/* [[ARABIC_COMMENT]] أزرار التنقل بين الصور */}
                                    {images.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => setActiveImg(p => (p - 1 + images.length) % images.length)}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setActiveImg(p => (p + 1) % images.length)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>

                                            {/* [[ARABIC_COMMENT]] نقاط التنقل */}
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                                {images.map((_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setActiveImg(i)}
                                                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? 'bg-[#c9a96e] w-4' : 'bg-white/30'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                    <CarIcon className="w-16 h-16 text-white/10" />
                                </div>
                            )}

                            {/* [[ARABIC_COMMENT]] صور مصغرة في الأسفل */}
                            {images.length > 1 && (
                                <div className="absolute bottom-10 left-0 right-0 px-4">
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                        {images.map((img, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setActiveImg(i)}
                                                className={`relative w-10 h-10 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === activeImg ? 'border-[#c9a96e]' : 'border-transparent opacity-50'}`}
                                            >
                                                <Image src={img} alt="" fill sizes="40px" quality={50} className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* [[ARABIC_COMMENT]] محتوى المنتج - قابل للتمرير */}
                        <div className="overflow-y-auto flex-1">
                            <div className="p-5 space-y-4">

                                {/* [[ARABIC_COMMENT]] الماركة والعنوان والسعر */}
                                <div>
                                    <div className="text-[10px] font-black text-[#c9a96e]/70 uppercase tracking-[0.3em] mb-1">
                                        {product.type === 'car' ? (product.make || '') : (product.brand || '')}
                                    </div>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white leading-tight">
                                        {product.title}
                                    </h2>
                                    <div className="text-2xl font-black text-[#c9a96e] mt-2">
                                        {displayPrice}
                                    </div>
                                </div>

                                {/* [[ARABIC_COMMENT]] المواصفات للسيارة */}
                                {product.type === 'car' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { icon: Calendar, label: isRTL ? 'السنة' : 'YEAR', value: product.year },
                                            { icon: Gauge, label: isRTL ? 'كيلومتر' : 'KM', value: product.mileage ? `${Number(product.mileage).toLocaleString()}` : '—' },
                                            { icon: Fuel, label: isRTL ? 'الوقود' : 'FUEL', value: product.fuelType || '—' },
                                            { icon: Settings2, label: isRTL ? 'ناقل' : 'TRANS', value: product.transmission || '—' },
                                            { icon: Tag, label: isRTL ? 'اللون' : 'COLOR', value: product.color || '—' },
                                            { icon: CarIcon, label: isRTL ? 'الفئة' : 'CAT', value: product.category || '—' },
                                        ].filter(s => s.value && s.value !== '—').map((spec, i) => (
                                            <div key={i} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 space-y-1">
                                                <spec.icon className="w-3 h-3 text-[#c9a96e]/50" />
                                                <div className="text-[8px] font-black uppercase tracking-widest text-white/25">{spec.label}</div>
                                                <div className="text-[11px] font-bold text-white/70 truncate">{String(spec.value)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* [[ARABIC_COMMENT]] تفاصيل قطعة الغيار */}
                                {product.type === 'part' && (
                                    <div className="space-y-2">
                                        {product.condition && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{isRTL ? 'الحالة:' : 'CONDITION:'}</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${product.condition === 'NEW' ? 'bg-green-500/20 text-green-400' : product.condition === 'USED' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {product.condition === 'NEW' ? (isRTL ? 'جديد' : 'NEW') : product.condition === 'USED' ? (isRTL ? 'مستعمل' : 'USED') : (isRTL ? 'مجدد' : 'REFURBISHED')}
                                                </span>
                                            </div>
                                        )}
                                        {product.compatibility && product.compatibility.length > 0 && (
                                            <div>
                                                <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">{isRTL ? 'متوافق مع:' : 'COMPATIBLE WITH:'}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {product.compatibility.map((c, i) => (
                                                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-white/60">{c}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {product.stock !== undefined && (
                                            <div className="text-[10px] text-white/40">
                                                {isRTL ? `المتوفر: ${product.stock} قطعة` : `In Stock: ${product.stock} units`}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* [[ARABIC_COMMENT]] الوصف */}
                                {product.description && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-white/25 mb-2">{isRTL ? 'الوصف' : 'DESCRIPTION'}</div>
                                        <p className="text-white/55 text-sm leading-relaxed">{product.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] الأزرار السفلية - ثابتة في الأسفل */}
                        <div className="shrink-0 p-4 border-t border-white/5 bg-[#0c0c0c] space-y-3">
                            {/* [[ARABIC_COMMENT]] زر الشراء الرئيسي */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={buyViaWhatsapp}
                                className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-2xl text-black font-black uppercase text-[12px] tracking-[0.25em] shadow-[0_0_30px_rgba(34,197,94,0.35)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2.5"
                            >
                                <MessageCircle className="w-5 h-5" />
                                {isRTL ? 'شراء عبر واتساب' : 'BUY VIA WHATSAPP'}
                            </motion.button>

                            {/* [[ARABIC_COMMENT]] أزرار ثانوية: سلة + مفضلة */}
                            <div className="flex gap-3">
                                {/* [[ARABIC_COMMENT]] زر السلة */}
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={addToCart}
                                    className={`flex-1 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all border ${inCart || addedToCart
                                        ? 'bg-[#c9a96e]/20 border-[#c9a96e]/40 text-[#c9a96e]'
                                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                                        }`}
                                >
                                    {addedToCart ? (
                                        <><Check className="w-4 h-4 text-green-400" />{isRTL ? 'تمت الإضافة ✓' : 'Added ✓'}</>
                                    ) : inCart ? (
                                        <><ShoppingCart className="w-4 h-4" />{isRTL ? 'في السلة' : 'In Cart'}</>
                                    ) : (
                                        <><ShoppingCart className="w-4 h-4" />{isRTL ? 'السلة' : 'Add to Cart'}</>
                                    )}
                                </motion.button>

                                {/* [[ARABIC_COMMENT]] زر المفضلة */}
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={toggleFavorite}
                                    className={`w-14 h-12 rounded-2xl border flex items-center justify-center transition-all ${isFavorite
                                        ? 'bg-red-500/20 border-red-500/40 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/30'
                                        }`}
                                    aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                >
                                    <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-red-400 scale-110' : ''}`} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// [[ARABIC_COMMENT]] دوال مساعدة للاستخدام الخارجي
export { getCart, getFavorites, dispatchCartUpdate, CART_KEY, FAVORITES_KEY };
