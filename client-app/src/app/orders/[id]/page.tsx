'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Package, Clock, CheckCircle, Truck, Ship, Anchor, MapPin,
    CreditCard,
    Phone, Mail, AlertCircle, ChevronLeft, ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { useSettings } from "@/lib/SettingsContext";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formatAmountWithSnapshot, getOrderGrandTotalSar } from "@/lib/orderCurrency";

const STATUS_STEPS = [
    { key: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending', icon: Clock },
    { key: 'confirmed', labelAr: 'شراء (كوريا)', labelEn: 'Purchased (KR)', icon: CheckCircle },
    { key: 'processing', labelAr: 'تجهيز الشحن', labelEn: 'Processing', icon: Package },
    { key: 'shipped_sea', labelAr: 'في البحر', labelEn: 'At Sea', icon: Ship },
    { key: 'customs_clearance', labelAr: 'تخليص جمركي', labelEn: 'Customs', icon: Anchor },
    { key: 'arrived', labelAr: 'جاهزة للاستلام', labelEn: 'Arrived', icon: MapPin },
    { key: 'completed', labelAr: 'مكتمل', labelEn: 'Completed', icon: CheckCircle },
];

export default function OrderDetailPage() {
    const { isRTL } = useLanguage();
    const { socialLinks, displayCurrency, currency } = useSettings(); // [[ARABIC_COMMENT]] جلب رقم واتساب الحقيقي
    const params = useParams();
    const orderId = params?.id as string;

    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) loadOrder();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const res = await api.orders.getById(orderId);
            if (res.success) {
                setOrder(res.data);
            } else {
                throw new Error(res.error || 'Not found');
            }
        } catch {
            // [[ARABIC_COMMENT]] الطلب غير موجود - لا نعرض بيانات وهمية
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentStepIndex = (status: string) => {
        const idx = STATUS_STEPS.findIndex(s => s.key === status);
        return idx === -1 ? 0 : idx;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-cinematic-neon-yellow';
            case 'confirmed': return 'text-cinematic-neon-blue';
            case 'processing': return 'text-purple-400';
            case 'shipped_sea': return 'text-blue-500';
            case 'customs_clearance': return 'text-orange-500';
            case 'arrived': return 'text-emerald-300';
            case 'completed': return 'text-green-400';
            case 'cancelled': return 'text-cinematic-neon-red';
            default: return 'text-white/60';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-14 h-14 border-4 border-cinematic-neon-blue border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
                <AlertCircle className="w-20 h-20 text-cinematic-neon-red" />
                <h2 className="text-2xl font-black text-white uppercase">{isRTL ? 'الطلب غير موجود' : 'Order Not Found'}</h2>
                <Link href="/orders" className="text-cinematic-neon-blue underline text-sm font-bold">
                    {isRTL ? 'العودة للطلبات' : 'Back to Orders'}
                </Link>
            </div>
        );
    }

    const currentStep = getCurrentStepIndex(order.status);

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(0,240,255,0.05),_transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.015)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-6xl mx-auto">

                {/* Back Button */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
                    <Link href="/orders" className="inline-flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                        <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                            {isRTL ? 'الطلبات' : 'MY ORDERS'}
                        </span>
                    </Link>
                </motion.div>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12"
                >
                    <div>
                        <div className="text-[10px] font-black text-cinematic-neon-blue/70 uppercase tracking-[0.4em] mb-2">
                            {order.orderNumber}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                            {isRTL ? 'تفاصيل الطلب' : 'ORDER DETAILS'}
                        </h1>
                        <p className="text-white/40 text-sm mt-2 font-bold">
                            {new Date(order.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className={cn(
                        "px-6 py-3 rounded-2xl border font-black text-sm uppercase tracking-widest",
                        order.status === 'completed' ? "bg-green-400/10 border-green-400/30 text-green-400" :
                            order.status === 'cancelled' ? "bg-cinematic-neon-red/10 border-cinematic-neon-red/30 text-cinematic-neon-red" :
                                "bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30 text-cinematic-neon-blue"
                    )}>
                        {isRTL
                            ? STATUS_STEPS.find(s => s.key === order.status)?.labelAr || order.status
                            : STATUS_STEPS.find(s => s.key === order.status)?.labelEn || order.status
                        }
                    </div>
                </motion.div>

                {/* Progress Tracker */}
                {order.status !== 'cancelled' && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="glass-card p-8 md:p-12 bg-white/[0.01] border-white/5 mb-8 overflow-hidden"
                    >
                        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/60 mb-10 flex items-center gap-3">
                            <Truck className="w-5 h-5 text-cinematic-neon-blue" />
                            {isRTL ? 'تتبع الطلب' : 'ORDER TRACKING'}
                        </h2>
                        <div className="relative flex items-center justify-between">
                            {/* Progress Line */}
                            <div className="absolute top-7 left-7 right-7 h-[2px] bg-white/5 z-0" />
                            <motion.div
                                className="absolute top-7 left-7 h-[2px] bg-cinematic-neon-blue z-0 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * (100 - (100 / STATUS_STEPS.length))}%` }}
                                transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                            />
                            {STATUS_STEPS.map((step, i) => {
                                const StepIcon = step.icon;
                                const done = i <= currentStep;
                                return (
                                    <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            transition={{ delay: i * 0.15 + 0.3 }}
                                            className={cn(
                                                "w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all",
                                                done
                                                    ? "bg-cinematic-neon-blue border-cinematic-neon-blue shadow-[0_0_20px_rgba(0,240,255,0.5)]"
                                                    : "bg-white/[0.03] border-white/10"
                                            )}
                                        >
                                            <StepIcon className={cn("w-6 h-6", done ? "text-black" : "text-white/20")} />
                                        </motion.div>
                                        <div className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.2em] text-center hidden md:block",
                                            done ? "text-cinematic-neon-blue" : "text-white/20"
                                        )}>
                                            {isRTL ? step.labelAr : step.labelEn}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Car Info */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="lg:col-span-2 glass-card bg-white/[0.01] border-white/5 overflow-hidden"
                    >
                        <div className="relative h-56 overflow-hidden">
                            <Image
                                src={order.car.image}
                                alt={order.car.title}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="text-[9px] font-black text-cinematic-neon-blue/80 uppercase tracking-[0.4em] mb-1">
                                    {isRTL ? 'السيارة المطلوبة' : 'ORDERED VEHICLE'}
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{order.car.title}</h3>
                            </div>
                        </div>
                        <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { label: isRTL ? 'الموديل' : 'Model', value: `${order.car.year}` },
                                { label: isRTL ? 'اللون' : 'Color', value: order.car.color },
                                { label: isRTL ? 'رقم الهيكل' : 'VIN', value: order.car.vin },
                            ].map((item, i) => (
                                <div key={i}>
                                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{item.label}</div>
                                    <div className="text-sm font-black text-white truncate">{item.value || '—'}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Payment */}
                        <div className="glass-card p-8 bg-white/[0.01] border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <CreditCard className="w-5 h-5 text-green-400" />
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
                                    {isRTL ? 'ملخص الدفع' : 'PAYMENT'}
                                </h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                        {isRTL ? 'السعر' : 'Price'}
                                    </span>
                                    <span className="font-black text-white">
                                        {formatAmountWithSnapshot(
                                            Number(order.car?.price || getOrderGrandTotalSar(order)),
                                            displayCurrency,
                                            order,
                                            currency
                                        )}
                                    </span>
                                </div>
                                <div className="h-[1px] bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                                        {isRTL ? 'الإجمالي' : 'Total'}
                                    </span>
                                    <span className="font-black text-xl text-cinematic-neon-blue italic">
                                        {formatAmountWithSnapshot(
                                            getOrderGrandTotalSar(order),
                                            displayCurrency,
                                            order,
                                            currency
                                        )}
                                    </span>
                                </div>
                                <div className={cn(
                                    "mt-2 px-4 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest",
                                    order.paymentStatus === 'paid'
                                        ? "bg-green-400/10 text-green-400 border border-green-400/20"
                                        : "bg-cinematic-neon-yellow/10 text-cinematic-neon-yellow border border-cinematic-neon-yellow/20"
                                )}>
                                    {order.paymentStatus === 'paid'
                                        ? (isRTL ? '✓ تم الدفع' : '✓ PAID')
                                        : (isRTL ? 'في انتظار الدفع' : 'PAYMENT PENDING')
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Contact */}
                        {order.buyer && (
                            <div className="glass-card p-8 bg-white/[0.01] border-white/5">
                                <div className="flex items-center gap-3 mb-6">
                                    <Phone className="w-5 h-5 text-cinematic-neon-blue" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
                                        {isRTL ? 'بيانات التواصل' : 'CONTACT'}
                                    </h3>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-white/30 shrink-0" />
                                        <span className="text-white/70 font-bold truncate">{order.buyer.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-white/30 shrink-0" />
                                        <span className="text-white/70 font-bold">{order.buyer.phone}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* [[ARABIC_COMMENT]] زر التواصل عبر واتساب - يستخدم الرقم المحفوظ في الإعدادات */}
                        <a
                            href={`https://wa.me/${(socialLinks?.whatsapp || '966500000000').replace(/\D/g, '')}?text=${encodeURIComponent(
                                `طلب رقم: ${order.orderNumber}\nالسيارة: ${order.car?.title || ''}\nالمبلغ: ${formatAmountWithSnapshot(getOrderGrandTotalSar(order), displayCurrency, order, currency)}\n\nأرجو إرسال الفاتورة.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full py-4 bg-green-500/10 border border-green-500/30 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-green-400 hover:bg-green-500/20 flex items-center justify-center gap-3 transition-all"
                            >
                                💬 {isRTL ? 'طلب الفاتورة عبر واتساب' : 'REQUEST INVOICE VIA WHATSAPP'}
                            </motion.button>
                        </a>
                    </motion.div>

                </div>

                {/* Timeline */}
                {order.timeline && order.timeline.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="glass-card p-8 md:p-12 bg-white/[0.01] border-white/5 mt-8"
                    >
                        <h2 className="text-[11px] font-black uppercase tracking-[0.5em] text-white/60 mb-8 flex items-center gap-3">
                            <Clock className="w-5 h-5 text-cinematic-neon-yellow" />
                            {isRTL ? 'سجل الطلب' : 'ORDER TIMELINE'}
                        </h2>
                        <div className="space-y-6">
                            {[...order.timeline].reverse().map((event: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-5"
                                >
                                    <div className={cn(
                                        "w-3 h-3 rounded-full mt-1.5 shrink-0",
                                        i === 0 ? "bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.8)]" : "bg-white/20"
                                    )} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <span className={cn(
                                                "text-[11px] font-black uppercase tracking-widest",
                                                i === 0 ? getStatusColor(event.status) : "text-white/40"
                                            )}>
                                                {isRTL
                                                    ? STATUS_STEPS.find(s => s.key === event.status)?.labelAr || event.status
                                                    : STATUS_STEPS.find(s => s.key === event.status)?.labelEn || event.status
                                                }
                                            </span>
                                            <span className="text-[10px] text-white/30 font-bold">
                                                {new Date(event.date).toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        {event.note && (
                                            <p className="text-[11px] text-white/50 mt-1">{event.note}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
