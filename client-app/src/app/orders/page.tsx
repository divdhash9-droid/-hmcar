'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, XCircle, Eye, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import Link from "next/link";
import ClientPageHeader from "@/components/ClientPageHeader";
import { useSettings } from "@/lib/SettingsContext";
import { formatAmountWithSnapshot, getOrderGrandTotalSar } from "@/lib/orderCurrency";

export default function OrdersPage() {
    const { isRTL } = useLanguage();
    const { displayCurrency, currency } = useSettings();
    type OrderStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | string;
    interface OrderCar {
        title?: string;
        image?: string;
        images?: string[];
    }
    interface OrderPricing {
        grandTotalSar?: number;
        exchangeSnapshot?: { usdToSar?: number; usdToKrw?: number; activeCurrency?: string };
    }
    interface Order {
        id?: string;
        _id?: string;
        orderNumber?: string;
        status?: OrderStatus;
        createdAt?: string;
        car?: OrderCar;
        pricing?: OrderPricing;
        totalAmount?: number;
    }

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0
    });

    useEffect(() => {
        loadOrders();
    }, [filter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.orders.list(params);

            if (response.success) {
                setOrders(response.data.orders);

                // [[ARABIC_COMMENT]] حساب الإحصائيات من الطلبات الحقيقية
                const allOrders = response.data.orders as Order[];
                setStats({
                    total: allOrders.length,
                    pending: allOrders.filter((o) => o.status === 'pending').length,
                    confirmed: allOrders.filter((o) => o.status === 'confirmed').length,
                    completed: allOrders.filter((o) => o.status === 'completed').length,
                    cancelled: allOrders.filter((o) => o.status === 'cancelled').length,
                });
            }
        } catch (err) {
            // [[ARABIC_COMMENT]] عند الخطأ: لا نعرض بيانات وهمية - نترك القائمة فارغة
            console.error('Failed to load orders', err);
            setOrders([]);
            setStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
        } finally {
            setLoading(false);
        }
    };

    const resolveOrderId = (order: Order, index: number) => (
        order.id || order._id || order.orderNumber || `order-${index}`
    );

    const resolveOrderImage = (order: Order) => {
        const src = order.car?.image || order.car?.images?.[0] || '';
        return typeof src === 'string' ? src.trim() : '';
    };


    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pending': return 'text-cinematic-neon-yellow';
            case 'confirmed': return 'text-cinematic-neon-blue';
            case 'completed': return 'text-green-400';
            case 'cancelled': return 'text-cinematic-neon-red';
            default: return 'text-white/60';
        }
    };

    const getStatusBg = (status?: string) => {
        switch (status) {
            case 'pending': return 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30';
            case 'confirmed': return 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30';
            case 'completed': return 'bg-green-400/10 border-green-400/30';
            case 'cancelled': return 'bg-cinematic-neon-red/10 border-cinematic-neon-red/30';
            default: return 'bg-white/5 border-white/10';
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'pending': return Clock;
            case 'confirmed': return CheckCircle;
            case 'completed': return CheckCircle;
            case 'cancelled': return XCircle;
            default: return Package;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white text-xl animate-pulse">Loading...</div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Background HUD */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">



                <header className="mb-12">
                    <ClientPageHeader
                        title={isRTL ? 'طلباتي' : 'MY ORDERS'}
                        subtitle={isRTL ? 'تتبع الطلبات' : 'Order Tracking'}
                        icon={Package}
                    />
                    <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold max-w-2xl leading-relaxed mt-4 ml-2">
                        {isRTL ? 'تتبع ومراقبة جميع طلباتك وحالة التسليم' : 'TRACK AND MONITOR ALL YOUR ORDERS AND DELIVERY STATUS'}
                    </p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
                    {[
                        { label: isRTL ? 'الكل' : 'ALL', value: stats.total, key: 'all', color: 'text-white' },
                        { label: isRTL ? 'قيد الانتظار' : 'PENDING', value: stats.pending, key: 'pending', color: 'text-cinematic-neon-yellow' },
                        { label: isRTL ? 'مؤكد' : 'CONFIRMED', value: stats.confirmed, key: 'confirmed', color: 'text-cinematic-neon-blue' },
                        { label: isRTL ? 'مكتمل' : 'COMPLETED', value: stats.completed, key: 'completed', color: 'text-green-400' },
                        { label: isRTL ? 'ملغي' : 'CANCELLED', value: stats.cancelled, key: 'cancelled', color: 'text-cinematic-neon-red' },
                    ].map((stat, i) => (
                        <motion.button
                            key={stat.key}
                            onClick={() => setFilter(stat.key)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "glass-card p-6 bg-white/[0.01] border-white/5 text-center transition-all",
                                filter === stat.key && "border-cinematic-neon-blue/30 bg-cinematic-neon-blue/5"
                            )}
                        >
                            <div className={cn("text-3xl font-black tracking-tighter mb-2", stat.color)}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Orders List */}
                <AnimatePresence mode="popLayout">
                    {orders.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-32"
                        >
                            <Package className="w-24 h-24 text-white/10 mx-auto mb-8" />
                            <h3 className="text-2xl font-black uppercase tracking-tight mb-4 text-white/60">
                                {isRTL ? 'لا توجد طلبات' : 'NO ORDERS FOUND'}
                            </h3>
                            <p className="text-sm text-white/40">
                                {isRTL ? 'لم تقم بأي طلبات بعد' : 'You haven\'t placed any orders yet'}
                            </p>
                        </motion.div>
                    ) : (
                        <div className="space-y-6">
                            {orders.map((order, i) => {
                                const StatusIcon = getStatusIcon(order.status);
                                const orderId = resolveOrderId(order, i);
                                const imageSrc = resolveOrderImage(order);
                                const showFallback = !imageSrc || imageErrors[orderId];
                                return (
                                    <motion.div
                                        key={orderId}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="glass-card bg-white/[0.01] border-white/5 overflow-hidden hover:border-cinematic-neon-blue/30 transition-all"
                                    >
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-8">

                                            {/* Car Image */}
                                            <div className="lg:col-span-3">
                                                <div className="relative h-40 rounded-2xl overflow-hidden">
                                                    {showFallback ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/70 border border-white/10">
                                                            <div className="text-center">
                                                                <Package className="w-10 h-10 text-white/20 mx-auto mb-2" />
                                                                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">No Image</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img
                                                            src={imageSrc}
                                                            alt={order.car?.title || 'Order car'}
                                                            className="w-full h-full object-cover grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                                                            onError={() => setImageErrors(prev => ({ ...prev, [orderId]: true }))}
                                                        />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                </div>
                                            </div>

                                            {/* Order Details */}
                                            <div className="lg:col-span-6 space-y-4">
                                                <div>
                                                    <div className="text-[9px] font-black text-cinematic-neon-blue/80 uppercase tracking-[0.3em] mb-2">
                                                        {order.orderNumber}
                                                    </div>
                                                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">
                                                        {order.car?.title || (isRTL ? 'سيارة' : 'Vehicle')}
                                                    </h3>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div>
                                                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                                                            {isRTL ? 'المبلغ الإجمالي' : 'TOTAL AMOUNT'}
                                                        </div>
                                                        <div className="text-xl font-black text-cinematic-neon-blue italic">
                                                            {formatAmountWithSnapshot(
                                                                getOrderGrandTotalSar(order),
                                                                displayCurrency,
                                                                order,
                                                                currency
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="h-8 w-[1px] bg-white/10" />
                                                    <div>
                                                        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                                                            {isRTL ? 'تاريخ الطلب' : 'ORDER DATE'}
                                                        </div>
                                                        <div className="text-sm font-bold text-white/60">
                                                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            }) : 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Status & Actions */}
                                            <div className="lg:col-span-3 flex flex-col justify-between gap-4">
                                                <div className={cn(
                                                    "px-6 py-4 rounded-xl border flex items-center gap-3",
                                                    getStatusBg(order.status)
                                                )}>
                                                    <StatusIcon className={cn("w-5 h-5", getStatusColor(order.status))} />
                                                    <div>
                                                        <div className="text-[8px] font-black text-white/40 uppercase tracking-widest">{isRTL ? 'الحالة' : 'STATUS'}</div>
                                                        <div className={cn("text-sm font-black uppercase tracking-wide", getStatusColor(order.status))}>
                                                            {isRTL ?
                                                                (order.status === 'pending' ? 'قيد الانتظار' :
                                                                    order.status === 'confirmed' ? 'مؤكد' :
                                                                        order.status === 'completed' ? 'مكتمل' :
                                                                            order.status === 'cancelled' ? 'ملغي' : order.status)
                                                                : order.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <Link href={`/orders/${order.id}`}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="w-full py-3 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 text-cinematic-neon-blue rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-cinematic-neon-blue/20 transition-all"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            {isRTL ? 'عرض' : 'VIEW'}
                                                        </motion.button>
                                                    </Link>
                                                    <Link href={`/orders/${order.id}/invoice`}>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="w-full py-3 bg-white/5 border border-white/10 text-white/60 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-yellow-500/10 hover:border-yellow-500/30 hover:text-yellow-400 transition-all"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            {isRTL ? 'فاتورة' : 'INVOICE'}
                                                        </motion.button>
                                                    </Link>
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
