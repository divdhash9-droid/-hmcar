'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
    TrendingUp, X, ArrowLeft,
    ShoppingCart, Clock, CheckCircle, Eye, Package, MessageCircle, Car as CarIcon, User
} from 'lucide-react';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useSettings } from '@/lib/SettingsContext';
import { formatAmountWithSnapshot, getOrderGrandTotalSar, getOrderItemUnitSar, resolveOrderSnapshot } from '@/lib/orderCurrency';
import AdminPageShell from '@/components/AdminPageShell';

const FILTER_ALL = 'all';
const STATUS_PENDING = 'pending';
const STATUS_CONFIRMED = 'confirmed';
const STATUS_COMPLETED = 'completed';
const STATUS_CANCELLED = 'cancelled';
const CHANNEL_WHATSAPP = 'whatsapp';
const ITEM_TYPE_CAR = 'car';
const CLASS_TEXT_WHITE = 'text-white';
const CLASS_TEXT_AMBER_400 = 'text-amber-400';
const CLASS_TEXT_BLUE_400 = 'text-blue-400';
const CLASS_TEXT_GREEN_400 = 'text-green-400';
const CLASS_TEXT_RED_400 = 'text-red-400';
const rawText = (value: string) => value;

interface OrderItem {
    itemType: 'car' | 'sparePart';
    refId: string;
    titleSnapshot: string;
    qty: number;
    unitPriceSar: number;
}

interface Order {
    id: string;
    orderNumber: string;
    buyer: { name: string; email: string; phone?: string };
    items: OrderItem[];
    pricing: {
        totalPriceSar: number;
        taxSar: number;
        grandTotalSar: number;
        exchangeSnapshot?: {
            usdToSar?: number;
            usdToKrw?: number;
            activeCurrency?: 'SAR' | 'USD' | 'KRW';
        };
    };
    status: string;
    paymentStatus: string;
    channel: 'web' | 'whatsapp';
    createdAt: string;
}

export default function AdminOrdersPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const { displayCurrency, currency } = useSettings();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(FILTER_ALL);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 });

    const loadOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filter !== FILTER_ALL) params.status = filter;
            const res = await api.orders.list(params);
            let list: Order[] = [];
            if (res?.success && res?.data?.orders) {
                list = res.data.orders.map((o: any) => ({
                    id: o.id || o._id,
                    orderNumber: o.orderNumber,
                    buyer: o.buyer || {},
                    items: o.items || [],
                    pricing: o.pricing || {},
                    status: o.status,
                    paymentStatus: o.paymentStatus,
                    channel: o.channel,
                    createdAt: o.createdAt
                }));
                setOrders(list);
                
                // Calculate stats from full list if needed, or if API provides them
                const s = { total: list.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 };
                list.forEach(o => {
                    if (o.status === STATUS_PENDING) s.pending++;
                    if (o.status === STATUS_CONFIRMED) s.confirmed++;
                    if (o.status === STATUS_COMPLETED) s.completed++;
                    if (o.status === STATUS_CANCELLED) s.cancelled++;
                    if (o.status !== STATUS_CANCELLED) s.revenue += o.pricing.grandTotalSar || 0;
                });
                setStats(s);
            }
        } catch (err) {
            console.error('Failed to load orders', err);
            showToast(isRTL ? 'فشل تحميل الطلبات' : 'Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [filter, isRTL, showToast]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const updateStatus = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            await api.orders.updateStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(isRTL ? 'تم تحديث حالة الطلب بنجاح' : 'Order status updated successfully', 'success');
        } catch {
            showToast(isRTL ? 'فشل تحديث الحالة' : 'Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف/إلغاء هذا الطلب؟' : 'Are you sure you want to cancel/delete this order?')) return;
        try {
            await api.orders.delete(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
            showToast(isRTL ? 'تم إلغاء الطلب نهائياً' : 'Order was successfully cancelled', 'success');
        } catch {
            showToast(isRTL ? 'فشل إلغاء الطلب' : 'Failed to cancel order', 'error');
        }
    };

    const getStatusBadge = (s: string) => {
        switch (s) {
            case STATUS_PENDING: return 'ck-badge ck-badge-pending';
            case STATUS_CONFIRMED: return 'ck-badge ck-badge-info';
            case STATUS_COMPLETED: return 'ck-badge ck-badge-active';
            case STATUS_CANCELLED: return 'ck-badge ck-badge-danger';
            default: return 'ck-badge ck-badge-inactive';
        }
    };

    const statusLabel = (s: string) => {
        if (isRTL) return { [STATUS_PENDING]: 'انتظار', [STATUS_CONFIRMED]: 'مؤكد', [STATUS_COMPLETED]: 'مكتمل', [STATUS_CANCELLED]: 'ملغي' }[s] || s;
        return s.toUpperCase();
    };

    return (
        <div className="relative min-h-screen text-white" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* ── Order Detail Modal ── */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto"
                        style={{ background: 'rgba(7,7,17,0.9)', backdropFilter: 'blur(16px)' }}
                        onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="ck-modal w-full max-w-2xl my-auto">

                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.3em] mb-1">
                                        {isRTL ? rawText('سجل الطلب') : rawText('ORDER LOG')}
                                    </p>
                                    <h2 className="cockpit-num text-2xl font-black text-orange-400">
                                        {rawText('#')}{selectedOrder.orderNumber}
                                    </h2>
                                </div>
                                <button onClick={() => setSelectedOrder(null)}
                                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                                    <X className="w-5 h-5 text-white/40" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="ck-card p-4 space-y-1">
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em]">
                                            {isRTL ? rawText('المشتري') : rawText('BUYER')}
                                        </p>
                                        <p className="text-sm font-bold">{selectedOrder.buyer.name}</p>
                                        <p className="cockpit-mono text-[10px] text-white/40">{selectedOrder.buyer.email}</p>
                                        {selectedOrder.buyer.phone && (
                                            <p className="cockpit-mono text-[10px] text-orange-400">{selectedOrder.buyer.phone}</p>
                                        )}
                                    </div>
                                    <div className="ck-card p-4 space-y-1">
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em]">
                                            {isRTL ? rawText('القناة والتاريخ') : rawText('CHANNEL')}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                            {selectedOrder.channel === CHANNEL_WHATSAPP
                                                ? <MessageCircle size={14} className="text-green-400" />
                                                : <ShoppingCart size={14} className="text-orange-400" />}
                                            {selectedOrder.channel}
                                        </div>
                                        <p className="cockpit-mono text-[10px] text-white/40">
                                            {new Date(selectedOrder.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="ck-section-title mb-3">{isRTL ? rawText('محتويات الطلب') : rawText('ORDER ITEMS')}</p>
                                    <div className="space-y-2 ck-card overflow-hidden">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-orange-500/5 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/15 text-orange-400">
                                                        {item.itemType === ITEM_TYPE_CAR ? <CarIcon className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{item.titleSnapshot}</p>
                                                        <p className="cockpit-mono text-[9px] text-white/30">
                                                            {item.itemType === ITEM_TYPE_CAR ? (isRTL ? rawText('مركبة') : rawText('Vehicle')) : (isRTL ? rawText('قطعة غيار') : rawText('Spare Part'))}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="cockpit-num text-sm font-black text-orange-400">
                                                        {formatAmountWithSnapshot(
                                                            getOrderItemUnitSar(item, selectedOrder, currency),
                                                            displayCurrency,
                                                            selectedOrder,
                                                            currency
                                                        )}
                                                    </p>
                                                    <p className="cockpit-mono text-[9px] text-white/30">{rawText('x')} {item.qty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ck-card p-5 flex justify-between items-center">
                                    <div>
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em] mb-1">
                                            {isRTL ? rawText('المجموع النهائي') : rawText('GRAND TOTAL')}
                                        </p>
                                        <p className="cockpit-num text-3xl font-black text-white">
                                            {formatAmountWithSnapshot(
                                                getOrderGrandTotalSar(selectedOrder),
                                                displayCurrency,
                                                selectedOrder,
                                                currency
                                            )}
                                        </p>
                                    </div>
                                    <span className={cn(getStatusBadge(selectedOrder.status), 'ck-badge-live')}>
                                        {statusLabel(selectedOrder.status)}
                                    </span>
                                </div>

                                <div>
                                    <p className="cockpit-mono text-[9px] text-white/20 uppercase tracking-[0.3em] mb-3">
                                        {isRTL ? rawText('تعديل الحالة') : rawText('PROTOCOL OVERRIDE')}
                                    </p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {([
                                            { key: STATUS_PENDING, ar: rawText('انتظار'), en: rawText('PENDING') },
                                            { key: STATUS_CONFIRMED, ar: rawText('مؤكد'), en: rawText('CONFIRM') },
                                            { key: STATUS_COMPLETED, ar: rawText('مكتمل'), en: rawText('COMPLETE') },
                                            { key: STATUS_CANCELLED, ar: rawText('إلغاء'), en: rawText('CANCEL') },
                                        ] as const).map(s => (
                                            <button key={s.key}
                                                disabled={selectedOrder.status === s.key || updatingId === selectedOrder.id}
                                                onClick={() => updateStatus(selectedOrder.id, s.key)}
                                                className={cn(
                                                    'py-2.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-30 active:scale-95',
                                                    selectedOrder.status === s.key
                                                        ? getStatusBadge(s.key)
                                                        : 'ck-btn-ghost'
                                                )}>
                                                {updatingId === selectedOrder.id ? rawText('...') : (isRTL ? s.ar : s.en)}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => deleteOrder(selectedOrder.id)}
                                        className="ck-btn-danger w-full py-3 mt-3 rounded-xl text-center">
                                        {isRTL ? rawText('🗑️ حذف الطلب نهائياً') : rawText('🗑️ PURGE RECORD')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AdminPageShell
                title={isRTL ? 'إدارة الطلبات' : 'ORDER MANAGEMENT'}
                titleEn="FULFILLMENT OPS"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={loadOrders} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                        <Clock className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                    <div className="ck-tab-group flex-wrap">
                        {([
                            { key: FILTER_ALL, ar: rawText('الكل'), en: rawText('ALL') },
                            { key: STATUS_PENDING, ar: rawText('انتظار'), en: rawText('QUEUE') },
                            { key: STATUS_CONFIRMED, ar: rawText('مؤكد'), en: rawText('ACTIVE') },
                            { key: STATUS_COMPLETED, ar: rawText('مكتمل'), en: rawText('DONE') },
                        ] as const).map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                className={cn('ck-tab', filter === f.key && 'ck-tab-active')}>
                                {isRTL ? f.ar : f.en}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats HUD */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                    {[
                        { label: isRTL ? rawText('الكل') : rawText('TOTAL'), val: stats.total, color: CLASS_TEXT_WHITE },
                        { label: isRTL ? rawText('انتظار') : rawText('QUEUE'), val: stats.pending, color: CLASS_TEXT_AMBER_400 },
                        { label: isRTL ? rawText('مؤكد') : rawText('ACTIVE'), val: stats.confirmed, color: CLASS_TEXT_BLUE_400 },
                        { label: isRTL ? rawText('مكتمل') : rawText('DONE'), val: stats.completed, color: CLASS_TEXT_GREEN_400 },
                        { label: isRTL ? rawText('ملغي') : rawText('ABORT'), val: stats.cancelled, color: CLASS_TEXT_RED_400 },
                    ].map((s, idx) => (
                        <div key={idx} className="ck-card p-4 flex flex-col items-center">
                            <span className={cn('text-xl font-black cockpit-num mb-1', s.color)}>{s.val}</span>
                            <span className="cockpit-mono text-[8px] text-white/20 uppercase tracking-widest">{s.label}</span>
                        </div>
                    ))}
                    <div className="ck-card p-4 col-span-2 hidden lg:flex items-center justify-between">
                        <div>
                            <span className="cockpit-mono text-[8px] text-white/20 uppercase tracking-widest block mb-1">
                                {isRTL ? rawText('إجمالي المبيعات') : rawText('TOTAL REVENUE')}
                            </span>
                            <span className="text-lg font-black text-orange-400 cockpit-num">
                                {stats.revenue.toLocaleString()} <span className="text-[10px] text-white/30">{isRTL ? 'ر.س' : 'SAR'}</span>
                            </span>
                        </div>
                        <TrendingUp size={24} className="text-orange-500/20" />
                    </div>
                </div>

                {/* Orders Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-48 rounded-3xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="ck-empty h-64">
                        <div className="ck-empty-icon"><Package size={32} /></div>
                        <p className="cockpit-mono text-[11px]">{isRTL ? 'لا توجد طلبات تطابق هذا التصنيف' : 'NO ORDERS FOUND'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {orders.map((order, idx) => (
                            <motion.div key={order.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                className="ck-card group hover:border-orange-500/30 transition-all">
                                <div className="p-5 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="cockpit-mono text-[9px] text-white/25 uppercase tracking-widest mb-0.5">
                                                {formatDate(order.createdAt)}
                                            </p>
                                            <h3 className="cockpit-num text-lg font-black group-hover:text-orange-400 transition-colors">
                                                {rawText('#')}{order.orderNumber}
                                            </h3>
                                        </div>
                                        <span className={cn(getStatusBadge(order.status), 'ck-badge-live')}>
                                            {statusLabel(order.status)}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-3 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                                <User size={14} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate text-white/80">{order.buyer.name}</p>
                                                <p className="cockpit-mono text-[9px] text-white/25 truncate">{order.buyer.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40">
                                                {order.items[0]?.itemType === ITEM_TYPE_CAR ? <CarIcon size={14} /> : <Package size={14} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate text-white/80">
                                                    {order.items.length > 1 
                                                        ? `${order.items[0].titleSnapshot} +${order.items.length - 1}` 
                                                        : (order.items[0]?.titleSnapshot || 'No Items')}
                                                </p>
                                                <p className="cockpit-mono text-[9px] text-orange-400/50">
                                                    {isRTL ? rawText('إجمالي:') : rawText('TOTAL:')} {formatAmountInDisplayCurrency(order)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 border-t border-white/5 pt-4">
                                        <button onClick={() => setSelectedOrder(order)}
                                            className="flex-1 ck-btn-ghost flex items-center justify-center gap-2 py-2">
                                            <Eye size={14} />
                                            {isRTL ? 'عرض' : 'VIEW'}
                                        </button>
                                        <button onClick={() => window.open(`https://wa.me/${order.buyer.phone?.replace('+', '')}`, '_blank')}
                                            className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                            <MessageCircle size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AdminPageShell>
        </div>
    );
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

function formatAmountInDisplayCurrency(order: any) {
    return (order.pricing.grandTotalSar || 0).toLocaleString();
}
