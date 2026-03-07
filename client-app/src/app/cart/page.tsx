'use client';

/**
 * [[ARABIC_COMMENT]] صفحة السلة - تعرض كل المنتجات المضافة
 * مع إمكانية مشاركة رابط السلة مع الأدمن
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Trash2, MessageCircle, Share2, Check, X, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { getCart, dispatchCartUpdate, CART_KEY, type ProductModalData } from '@/components/ProductModal';

const DEFAULT_WHATSAPP = '+821080880014';

export default function CartPage() {
    const { isRTL } = useLanguage();
    const { formatPrice, socialLinks } = useSettings();
    const [cart, setCart] = useState<ProductModalData[]>([]);
    const [copied, setCopied] = useState(false);
    const [sentToWhatsapp, setSentToWhatsapp] = useState(false);

    // [[ARABIC_COMMENT]] جلب السلة من localStorage
    useEffect(() => {
        setCart(getCart());
        const update = () => setCart(getCart());
        window.addEventListener('hm_cart_updated', update);
        return () => window.removeEventListener('hm_cart_updated', update);
    }, []);

    // [[ARABIC_COMMENT]] حذف منتج من السلة
    const removeItem = useCallback((id: string) => {
        const newCart = getCart().filter(item => item.id !== id);
        localStorage.setItem(CART_KEY, JSON.stringify(newCart));
        setCart(newCart);
        dispatchCartUpdate();
    }, []);

    // [[ARABIC_COMMENT]] تفريغ السلة بالكامل
    const clearCart = useCallback(() => {
        localStorage.setItem(CART_KEY, '[]');
        setCart([]);
        dispatchCartUpdate();
    }, []);

    // [[ARABIC_COMMENT]] إجمالي السعر - عرض مجموع الأسعار
    const total = cart.reduce((sum, item) => sum + (item.price || 0), 0);

    // [[ARABIC_COMMENT]] مشاركة رابط السلة - يُنشئ رابطاً يحتوي IDs المنتجات
    const shareCart = useCallback(() => {
        const ids = cart.map(i => i.id).join(',');
        const url = `${window.location.origin}/cart/share?items=${ids}`;
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        }).catch(() => { });
    }, [cart]);

    // [[ARABIC_COMMENT]] إرسال السلة كاملة للأدمن عبر واتساب
    const sendCartToWhatsapp = useCallback(() => {
        if (cart.length === 0) return;
        const phone = (socialLinks?.whatsapp || DEFAULT_WHATSAPP).replace(/\D/g, '');

        const itemsList = cart.map((item, i) => {
            const price = formatPrice ? formatPrice(item.price, item.displayCurrency as 'SAR' | 'USD' | 'KRW' | undefined) : `${item.price?.toLocaleString()} SAR`;
            return `${i + 1}. ${item.type === 'car' ? '🚗' : '🔧'} *${item.title}* - ${price}`;
        }).join('\n');

        const totalStr = `${total.toLocaleString()} SAR`;
        const shareLink = `${window.location.origin}/cart/share?items=${cart.map(i => i.id).join(',')}`;

        const msg = isRTL
            ? `السلام عليكم 👋\n\n🛒 *طلب سلة تسوق*\n━━━━━━━━━━━━━━━━\n${itemsList}\n━━━━━━━━━━━━━━━━\n💰 *الإجمالي التقريبي: ${totalStr}*\n\n🔗 رابط السلة: ${shareLink}\n\nأرجو التواصل للاستفسار 🤝`
            : `Hello 👋\n\n🛒 *Shopping Cart Request*\n━━━━━━━━━━━━━━━━\n${itemsList}\n━━━━━━━━━━━━━━━━\n💰 *Estimated Total: ${totalStr}*\n\n🔗 Cart Link: ${shareLink}\n\nPlease contact me to discuss 🤝`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        setSentToWhatsapp(true);
        setTimeout(() => setSentToWhatsapp(false), 3000);
    }, [cart, socialLinks, formatPrice, total, isRTL]);

    return (
        <div className="relative min-h-screen bg-[#050505] text-white" dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* [[ARABIC_COMMENT]] خلفية زخرفية */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.04)_0%,transparent_60%)]" />
            </div>

            <main className="relative z-10 pt-28 pb-32 px-4 sm:px-6 max-w-3xl mx-auto">

                {/* [[ARABIC_COMMENT]] عنوان الصفحة */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <Link href="/showroom" className="flex items-center gap-2 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-widest mb-4 transition-all group">
                            {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
                            {isRTL ? 'المعرض' : 'BACK TO SHOWROOM'}
                        </Link>
                        <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                            <ShoppingCart className="w-7 h-7 text-[#c9a96e]" />
                            {isRTL ? 'سلة التسوق' : 'My Cart'}
                        </h1>
                        {cart.length > 0 && (
                            <p className="text-white/30 text-sm mt-1">
                                {isRTL ? `${cart.length} منتج في السلة` : `${cart.length} item${cart.length !== 1 ? 's' : ''} in cart`}
                            </p>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="text-[10px] font-black uppercase tracking-widest text-white/25 hover:text-red-400 transition-all flex items-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isRTL ? 'تفريغ السلة' : 'Clear All'}
                        </button>
                    )}
                </div>

                {/* [[ARABIC_COMMENT]] حالة السلة الفارغة */}
                {cart.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-24 space-y-6"
                    >
                        <div className="w-24 h-24 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto">
                            <ShoppingCart className="w-10 h-10 text-white/10" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white/20 mb-2">{isRTL ? 'السلة فارغة' : 'Your cart is empty'}</h2>
                            <p className="text-white/20 text-sm">{isRTL ? 'أضف سيارات أو قطع غيار لتظهر هنا' : 'Add cars or parts to see them here'}</p>
                        </div>
                        <div className="flex gap-3 justify-center flex-wrap">
                            <Link href="/showroom">
                                <button className="px-6 py-3 bg-[#c9a96e]/10 border border-[#c9a96e]/30 rounded-2xl text-[#c9a96e] text-[11px] font-black uppercase tracking-widest hover:bg-[#c9a96e]/20 transition-all">
                                    {isRTL ? 'تصفح السيارات' : 'Browse Cars'}
                                </button>
                            </Link>
                            <Link href="/parts">
                                <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/60 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                    {isRTL ? 'تصفح القطع' : 'Browse Parts'}
                                </button>
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {/* [[ARABIC_COMMENT]] قائمة المنتجات */}
                        <AnimatePresence mode="popLayout">
                            {cart.map((item, i) => {
                                const displayPrice = formatPrice ? formatPrice(item.price, item.displayCurrency as 'SAR' | 'USD' | 'KRW' | undefined) : `${item.price?.toLocaleString()} SAR`;
                                const img = item.images?.[0] || '';
                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: isRTL ? 100 : -100, scale: 0.95 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="flex gap-4 bg-white/[0.02] border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all group"
                                    >
                                        {/* [[ARABIC_COMMENT]] صورة المنتج */}
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-white/5">
                                            {img ? (
                                                <Image src={img} alt={item.title} fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-white/10" />
                                                </div>
                                            )}
                                        </div>

                                        {/* [[ARABIC_COMMENT]] بيانات المنتج */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-[#c9a96e]/60 mb-1">
                                                {item.type === 'car' ? (isRTL ? 'سيارة' : 'CAR') : (isRTL ? 'قطعة غيار' : 'PART')}
                                                {item.type === 'car' && item.make ? ` • ${item.make}` : ''}
                                                {item.type === 'part' && item.brand ? ` • ${item.brand}` : ''}
                                            </div>
                                            <h3 className="font-black uppercase text-sm leading-tight line-clamp-2 mb-2">{item.title}</h3>
                                            <div className="text-[#c9a96e] font-black text-base">{displayPrice}</div>
                                            {item.type === 'car' && item.year && (
                                                <div className="text-[10px] text-white/30 mt-1">{item.year} {item.color ? `• ${item.color}` : ''}</div>
                                            )}
                                            {item.type === 'part' && item.condition && (
                                                <div className="text-[10px] text-white/30 mt-1">{item.condition}</div>
                                            )}
                                        </div>

                                        {/* [[ARABIC_COMMENT]] زر الحذف */}
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-400/30 hover:bg-red-400/5 transition-all"
                                            aria-label="Remove"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* [[ARABIC_COMMENT]] ملخص السلة */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 bg-white/[0.02] border border-white/8 rounded-2xl p-6 space-y-4"
                        >
                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/40">
                                    {isRTL ? 'الإجمالي التقريبي' : 'ESTIMATED TOTAL'}
                                </span>
                                <span className="text-xl font-black text-[#c9a96e]">
                                    {formatPrice ? formatPrice(total) : `${total.toLocaleString()} SAR`}
                                </span>
                            </div>
                            <p className="text-[10px] text-white/25 text-center">
                                {isRTL
                                    ? '* السعر تقريبي ويتم الاتفاق النهائي مع الأدمن عبر واتساب'
                                    : '* Price is approximate. Final negotiation via WhatsApp with admin.'}
                            </p>

                            {/* [[ARABIC_COMMENT]] زر الشراء الرئيسي */}
                            <button
                                onClick={sendCartToWhatsapp}
                                className="w-full py-4 bg-green-500 hover:bg-green-400 rounded-2xl text-black font-black uppercase text-[12px] tracking-[0.25em] shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_50px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2.5"
                            >
                                {sentToWhatsapp ? (
                                    <><Check className="w-5 h-5" />{isRTL ? 'تم الإرسال ✓' : 'Sent ✓'}</>
                                ) : (
                                    <><MessageCircle className="w-5 h-5" />{isRTL ? 'إرسال السلة للأدمن عبر واتساب' : 'SEND CART VIA WHATSAPP'}</>
                                )}
                            </button>

                            {/* [[ARABIC_COMMENT]] زر مشاركة رابط السلة */}
                            <button
                                onClick={shareCart}
                                className="w-full py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white/60 font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                {copied ? (
                                    <><Check className="w-4 h-4 text-green-400" />{isRTL ? 'تم نسخ الرابط ✓' : 'Link Copied ✓'}</>
                                ) : (
                                    <><Share2 className="w-4 h-4" />{isRTL ? 'مشاركة رابط السلة' : 'SHARE CART LINK'}</>
                                )}
                            </button>
                        </motion.div>
                    </div>
                )}
            </main>
        </div>
    );
}
