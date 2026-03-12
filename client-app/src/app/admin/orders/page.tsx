'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    TrendingUp, X,
    ShoppingCart, Clock, CheckCircle, Eye, Package, MessageCircle
} from 'lucide-react';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

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
const CLASS_TEXT_ORANGE_400 = 'text-orange-400';
const CLASS_TEXT_GREEN_400_20 = 'text-green-400/20';
const CLASS_TEXT_BLUE_400_20 = 'text-blue-400/20';
const CLASS_TEXT_ORANGE_400_10 = 'text-orange-400/10';
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
    };
    status: string;
    paymentStatus: string;
    channel: 'web' | 'whatsapp';
    createdAt: string;
}

export default function AdminOrdersPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(FILTER_ALL);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 });

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const loadOrders = async () => {
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
                    buyer: {
                        name: o.buyer?.name || 'Guest User',
                        email: o.buyer?.email || rawText('—'),
                        phone: o.buyer?.phone
                    },
                    items: o.items || [],
                    pricing: o.pricing || { totalPriceSar: 0, grandTotalSar: 0 },
                    status: o.status,
                    paymentStatus: o.paymentStatus || STATUS_PENDING,
                    channel: o.channel || 'web',
                    createdAt: o.createdAt
                }));
            }
            setOrders(list);

            // Calculate basic stats for current view
            setStats({
                total: list.length,
                pending: list.filter(o => o.status === STATUS_PENDING).length,
                confirmed: list.filter(o => o.status === STATUS_CONFIRMED).length,
                completed: list.filter(o => o.status === STATUS_COMPLETED).length,
                cancelled: list.filter(o => o.status === STATUS_CANCELLED).length,
                revenue: list.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.pricing?.grandTotalSar || 0), 0),
            });
        } catch (err) {
            console.error('Failed to load orders', err);
            showToast(isRTL ? 'فشل تحميل الطلبات' : 'Failed to load orders', 'error');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

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
                        className="fixed inset-0 z-200 flex items-center justify-center p-4 overflow-y-auto"
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
                                {/* Buyer + Channel */}
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

                                {/* Items */}
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
                                                    <p className="cockpit-num text-sm font-black text-orange-400">{item.unitPriceSar?.toLocaleString()}</p>
                                                    <p className="cockpit-mono text-[9px] text-white/30">{rawText('SAR x')} {item.qty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="ck-card p-5 flex justify-between items-center">
                                    <div>
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em] mb-1">
                                            {isRTL ? rawText('المجموع النهائي') : rawText('GRAND TOTAL')}
                                        </p>
                                        <p className="cockpit-num text-3xl font-black text-white">
                                            {(selectedOrder.pricing?.grandTotalSar || 0).toLocaleString()}
                                            <span className="text-sm text-white/30 ms-2">{rawText('SAR')}</span>
                                        </p>
                                    </div>
                                    <span className={cn(getStatusBadge(selectedOrder.status), 'ck-badge-live')}>
                                        {statusLabel(selectedOrder.status)}
                                    </span>
                                </div>

                                {/* Actions */}
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

            {/* ── Main Content ── */}
            <main className="relative z-10 pt-6 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* HUD Header */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">{rawText('HM-CTRL')}</Link>
                        <span className="ck-breadcrumb-sep">{rawText('>')}</span>
                        <span className="text-orange-400/70">{isRTL ? rawText('الطلبات') : rawText('ORDERS')}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">
                                {rawText('AIR TRAFFIC CONTROL - ORDER QUEUE')}
                            </p>
                            <h1 className="ck-page-title">{isRTL ? rawText('طلبات العملاء') : rawText('ORDER CTRL')}</h1>
                        </div>
                        {/* Filter tabs */}
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
                </div>

                {/* Stats HUD */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
                    {[
                        { label: isRTL ? rawText('الكل') : rawText('TOTAL'), val: stats.total, color: CLASS_TEXT_WHITE },
                        { label: isRTL ? rawText('انتظار') : rawText('QUEUE'), val: stats.pending, color: CLASS_TEXT_AMBER_400 },
                        { label: isRTL ? rawText('مؤكد') : rawText('ACTIVE'), val: stats.confirmed, color: CLASS_TEXT_BLUE_400 },
                        { label: isRTL ? rawText('مكتمل') : rawText('DONE'), val: stats.completed, color: CLASS_TEXT_GREEN_400 },
                        { label: isRTL ? rawText('ملغي') : rawText('ABORT'), val: stats.cancelled, color: CLASS_TEXT_RED_400 },
                        { label: isRTL ? rawText('إيرادات') : rawText('REVENUE'), val: `${(stats.revenue / 1000).toFixed(0)}K`, color: CLASS_TEXT_ORANGE_400 },
                    ].map((s, i) => (
                        <div key={i} className={cn('ck-stat text-center ck-fade-up', `ck-delay-${Math.min(i + 1, 4)}`)}>
                            <div className={cn('ck-stat-num text-2xl', s.color)}>{s.val}</div>
                            <div className="cockpit-mono text-[8px] text-white/30 uppercase tracking-widest mt-1">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Orders Table */}
                <div className="ck-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="ck-table">
                            <thead>
                                <tr>
                                    <th>{isRTL ? rawText('مرجع') : rawText('REF')}</th>
                                    <th>{isRTL ? rawText('العميل') : rawText('CLIENT')}</th>
                                    <th>{isRTL ? rawText('المنتجات') : rawText('ITEMS')}</th>
                                    <th>{isRTL ? rawText('المبلغ') : rawText('AMOUNT')}</th>
                                    <th>{isRTL ? rawText('الحالة') : rawText('STATUS')}</th>
                                    <th>{isRTL ? rawText('إجراء') : rawText('OPS')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}><td colSpan={6}><div className="h-10 bg-white/5 rounded animate-pulse" /></td></tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={6}>
                                        <div className="ck-empty">
                                            <div className="ck-empty-icon"><ShoppingCart className="w-6 h-6" /></div>
                                            <p className="cockpit-mono text-sm">{isRTL ? rawText('لا توجد طلبات') : rawText('QUEUE EMPTY')}</p>
                                        </div>
                                    </td></tr>
                                ) : orders.map((order, idx) => (
                                    <motion.tr key={order.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="cursor-pointer group"
                                        onClick={() => setSelectedOrder(order)}>
                                        <td>
                                            <p className="cockpit-num text-sm font-black text-orange-400">{rawText('#')}{order.orderNumber}</p>
                                            <p className="cockpit-mono text-[9px] text-white/30 mt-0.5 flex items-center gap-1">
                                                {order.channel === CHANNEL_WHATSAPP
                                                    ? <MessageCircle size={9} className="text-green-400" />
                                                    : <ShoppingCart size={9} className="text-orange-400" />}
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td>
                                            <p className="text-sm font-bold">{order.buyer.name}</p>
                                            <p className="cockpit-mono text-[9px] text-white/30 truncate max-w-35">{order.buyer.email}</p>
                                        </td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {order.items.slice(0, 2).map((item, i) => (
                                                    <span key={i} className="ck-badge ck-badge-inactive text-[8px]">
                                                        {item.titleSnapshot.slice(0, 12)}
                                                    </span>
                                                ))}
                                                {order.items.length > 2 && (
                                                    <span className="cockpit-mono text-[8px] text-white/20">{rawText('+')}{order.items.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <p className="cockpit-num text-base font-black text-white">
                                                {(order.pricing?.grandTotalSar || 0).toLocaleString()}
                                            </p>
                                            <p className="cockpit-mono text-[9px] text-white/30">{rawText('SAR')}</p>
                                        </td>
                                        <td>
                                            <span className={cn(getStatusBadge(order.status), 'ck-badge-live')}>
                                                {statusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-all flex items-center justify-center">
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bottom KPIs */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: isRTL ? rawText('إجمالي الإيرادات') : rawText('VERIFIED REVENUE'), val: `${stats.revenue.toLocaleString()} SAR`, icon: TrendingUp, color: CLASS_TEXT_GREEN_400, iconColor: CLASS_TEXT_GREEN_400_20 },
                        { label: isRTL ? rawText('قيد المعالجة') : rawText('LIVE QUEUE'), val: String(stats.pending + stats.confirmed), icon: Clock, color: CLASS_TEXT_BLUE_400, iconColor: CLASS_TEXT_BLUE_400_20 },
                        { label: isRTL ? rawText('كفاءة النظام') : rawText('SYSTEM HEALTH'), val: rawText('99.9%'), icon: CheckCircle, color: CLASS_TEXT_ORANGE_400, iconColor: CLASS_TEXT_ORANGE_400_10 },
                    ].map((kpi, i) => (
                        <div key={i} className="ck-card p-5 flex items-center justify-between ck-hover-lift">
                            <div>
                                <p className="cockpit-mono text-[9px] text-white/30 uppercase tracking-widest mb-1">{kpi.label}</p>
                                <p className={cn('cockpit-num text-2xl font-black', kpi.color)}>{kpi.val}</p>
                            </div>
                            <kpi.icon className={cn('w-10 h-10', kpi.iconColor)} />
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function CarIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
        </svg>
    );
}
