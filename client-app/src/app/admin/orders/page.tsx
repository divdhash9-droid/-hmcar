'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    TrendingUp, ChevronLeft, X,
    ShoppingCart, Clock, CheckCircle, Eye, Package, MessageCircle
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

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
    const [filter, setFilter] = useState('all');
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
            if (filter !== 'all') params.status = filter;
            const res = await api.orders.list(params);
            let list: Order[] = [];
            if (res?.success && res?.data?.orders) {
                list = res.data.orders.map((o: any) => ({
                    id: o.id || o._id,
                    orderNumber: o.orderNumber,
                    buyer: {
                        name: o.buyer?.name || 'Guest User',
                        email: o.buyer?.email || '—',
                        phone: o.buyer?.phone
                    },
                    items: o.items || [],
                    pricing: o.pricing || { totalPriceSar: 0, grandTotalSar: 0 },
                    status: o.status,
                    paymentStatus: o.paymentStatus || 'pending',
                    channel: o.channel || 'web',
                    createdAt: o.createdAt
                }));
            }
            setOrders(list);

            // Calculate basic stats for current view
            setStats({
                total: list.length,
                pending: list.filter(o => o.status === 'pending').length,
                confirmed: list.filter(o => o.status === 'confirmed').length,
                completed: list.filter(o => o.status === 'completed').length,
                cancelled: list.filter(o => o.status === 'cancelled').length,
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
        } catch (err) {
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
        } catch (err) {
            showToast(isRTL ? 'فشل إلغاء الطلب' : 'Failed to cancel order', 'error');
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'pending': return 'text-yellow-400';
            case 'confirmed': return 'text-blue-400';
            case 'completed': return 'text-green-400';
            case 'cancelled': return 'text-red-400';
            default: return 'text-white/40';
        }
    };

    const getStatusBg = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-yellow-400/10 border-yellow-400/20';
            case 'confirmed': return 'bg-blue-400/10 border-blue-400/20';
            case 'completed': return 'bg-green-400/10 border-green-400/20';
            case 'cancelled': return 'bg-red-400/10 border-red-400/20';
            default: return 'bg-white/5 border-white/10';
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white selection:bg-blue-500/30">
            <Navbar />

            {/* Modal Detail */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
                        onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,1)] relative"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent">
                                <div>
                                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">{isRTL ? 'سجل الطلب' : 'ORDER LOG'}</div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">#{selectedOrder.orderNumber}</h2>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-all group">
                                    <X className="w-6 h-6 text-white/30 group-hover:text-white" />
                                </button>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Buyer Info */}
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{isRTL ? 'المشتري' : 'BUYER'}</div>
                                        <div className="text-sm font-bold">{selectedOrder.buyer.name}</div>
                                        <div className="text-xs text-white/50">{selectedOrder.buyer.email}</div>
                                        {selectedOrder.buyer.phone && <div className="text-xs text-blue-400">{selectedOrder.buyer.phone}</div>}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{isRTL ? 'القناة والتاريخ' : 'CHANNEL & DATE'}</div>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase truncate">
                                            {selectedOrder.channel === 'whatsapp' ? <MessageCircle size={14} className="text-green-400" /> : <ShoppingCart size={14} className="text-blue-400" />}
                                            {selectedOrder.channel}
                                        </div>
                                        <div className="text-xs text-white/50">{new Date(selectedOrder.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="space-y-4">
                                    <div className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">{isRTL ? 'محتويات السلة' : 'INVENTORY ITEMS'}</div>
                                    <div className="space-y-2 border border-white/5 rounded-2xl overflow-hidden">
                                        {selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-white/5 border border-white/5 text-white/30">
                                                        {item.itemType === 'car' ? <CarIcon size={16} /> : <Package size={16} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-black uppercase tracking-wide">{item.titleSnapshot}</div>
                                                        <div className="text-[9px] text-white/30">{item.itemType === 'car' ? (isRTL ? 'مركبة' : 'Vehicle') : (isRTL ? 'قطعة غيار' : 'Spare Part')}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black text-blue-400">{item.unitPriceSar?.toLocaleString()} SAR</div>
                                                    <div className="text-[9px] text-white/30">Qty: {item.qty}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total Summary */}
                                <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl flex justify-between items-center shadow-inner">
                                    <div>
                                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{isRTL ? 'المجموع النهائي' : 'GRAND TOTAL'}</div>
                                        <div className="text-3xl font-black text-blue-400 italic">{(selectedOrder.pricing?.grandTotalSar || 0).toLocaleString()} <span className="text-sm not-italic opacity-50 uppercase">SAR</span></div>
                                    </div>
                                    <div className={cn("px-5 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest", getStatusBg(selectedOrder.status), getStatusColor(selectedOrder.status))}>
                                        {isRTL
                                            ? { pending: 'قيد الانتظار', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' }[selectedOrder.status] || selectedOrder.status
                                            : selectedOrder.status
                                        }
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-3 pt-4">
                                    <div className="w-full text-[9px] font-black uppercase tracking-[0.4em] text-white/20 mb-1">{isRTL ? 'تعديل حالة المعاملة' : 'PROTOCOL OVERRIDE'}</div>
                                    {([
                                        { key: 'pending', ar: 'قيد الانتظار', en: 'PENDING' },
                                        { key: 'confirmed', ar: 'مؤكد', en: 'CONFIRMED' },
                                        { key: 'completed', ar: 'مكتمل', en: 'COMPLETED' },
                                        { key: 'cancelled', ar: 'ملغي', en: 'CANCELLED' },
                                    ] as const).map(s => (
                                        <button
                                            key={s.key}
                                            disabled={selectedOrder.status === s.key || updatingId === selectedOrder.id}
                                            onClick={() => updateStatus(selectedOrder.id, s.key)}
                                            className={cn(
                                                "flex-1 py-3 px-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 active:scale-95",
                                                selectedOrder.status === s.key ? getStatusBg(s.key) + ' ' + getStatusColor(s.key) : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                                            )}
                                        >
                                            {updatingId === selectedOrder.id ? '...' : (isRTL ? s.ar : s.en)}
                                        </button>
                                    ))}
                                    <button onClick={() => deleteOrder(selectedOrder.id)} className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:bg-red-500 hover:text-white transition-all mt-4">
                                        {isRTL ? 'حذف السجل نهائياً' : 'PURGE RECORD'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-16">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all group">
                        <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'الرجوع للداشبورد' : 'BACK TO SYSTEM'}</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-[2px] w-12 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 italic">Financial Core</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] mb-4">
                                {isRTL ? 'طلبات' : 'ORDER'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10">{isRTL ? 'العملاء' : 'QUEUES'}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 h-fit">
                            {([
                                { key: 'all', ar: 'الكل', en: 'ALL' },
                                { key: 'pending', ar: 'قيد الانتظار', en: 'PENDING' },
                                { key: 'confirmed', ar: 'مؤكد', en: 'CONFIRMED' },
                                { key: 'completed', ar: 'مكتمل', en: 'COMPLETED' },
                            ] as const).map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)} className={cn("px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === f.key ? "bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "text-white/40 hover:text-white hover:bg-white/5")}>
                                    {isRTL ? f.ar : f.en}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* Table Layout */}
                <div className="glass-card bg-white/[0.01] border-white/5 overflow-hidden rounded-[2.5rem] shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{isRTL ? 'مرجع الطلب' : 'REFERENCE'}</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{isRTL ? 'العميل' : 'CLIENT'}</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 font-center">{isRTL ? 'المنتجات' : 'ITEMS'}</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{isRTL ? 'المبلغ الإجمالي' : 'AMOUNT'}</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{isRTL ? 'الحالة' : 'STATUS'}</th>
                                    <th className="p-8 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{isRTL ? 'إجراء' : 'OPS'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse"><td colSpan={6} className="p-10"><div className="h-4 bg-white/5 rounded w-full" /></td></tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={6} className="p-24 text-center text-white/20 italic tracking-widest font-black uppercase">{isRTL ? 'لا توجد بيانات متاحة' : 'ZERO RECORDS FOUND'}</td></tr>
                                ) : (
                                    orders.map((order, idx) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-white/[0.03] transition-all cursor-pointer group"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <td className="p-8">
                                                <div className="text-sm font-black text-blue-400 italic">#{order.orderNumber}</div>
                                                <div className="text-[9px] text-white/30 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                    {order.channel === 'whatsapp' ? <MessageCircle size={10} /> : <ShoppingCart size={10} />}
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="text-sm font-bold text-white/90">{order.buyer.name}</div>
                                                <div className="text-[10px] text-white/40 truncate max-w-[150px]">{order.buyer.email}</div>
                                            </td>
                                            <td className="p-8">
                                                <div className="flex flex-wrap gap-1">
                                                    {order.items.slice(0, 2).map((item, i) => (
                                                        <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[8px] font-black text-white/40 uppercase whitespace-nowrap">
                                                            {item.titleSnapshot.slice(0, 10)}...
                                                        </span>
                                                    ))}
                                                    {order.items.length > 2 && <span className="text-[8px] text-white/20">+{order.items.length - 2} more</span>}
                                                </div>
                                            </td>
                                            <td className="p-8">
                                                <div className="text-lg font-black text-white italic">{(order.pricing?.grandTotalSar || 0).toLocaleString()} <span className="text-[10px] text-white/40 opacity-50 uppercase not-italic">SAR</span></div>
                                            </td>
                                            <td className="p-8">
                                                <span className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest", getStatusBg(order.status), getStatusColor(order.status))}>
                                                    {isRTL
                                                        ? { pending: 'قيد الانتظار', confirmed: 'مؤكد', completed: 'مكتمل', cancelled: 'ملغي' }[order.status] || order.status
                                                        : order.status
                                                    }
                                                </span>
                                            </td>
                                            <td className="p-8 text-right">
                                                <button className="p-3 rounded-full bg-blue-500/5 border border-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer HUD Stat */}
                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[9px] font-black text-white/30 uppercase mb-1">{isRTL ? 'إجمالي الإيرادات المؤكدة' : 'VERIFIED REVENUE'}</div>
                            <div className="text-2xl font-black text-green-400 italic">{stats.revenue.toLocaleString()} SAR</div>
                        </div>
                        <TrendingUp className="text-green-400/20 w-10 h-10" />
                    </div>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[9px] font-black text-white/30 uppercase mb-1">{isRTL ? 'طلبات قيد المعالجة' : 'LIVE QUEUE'}</div>
                            <div className="text-2xl font-black text-blue-400 italic">{stats.pending + stats.confirmed}</div>
                        </div>
                        <Clock className="text-blue-400/20 w-10 h-10" />
                    </div>
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                            <div className="text-[9px] font-black text-white/30 uppercase mb-1">{isRTL ? 'كفاءة النظام' : 'SYSTEM HEALTH'}</div>
                            <div className="text-2xl font-black text-white italic">99.9%</div>
                        </div>
                        <CheckCircle className="text-white/10 w-10 h-10" />
                    </div>
                </div>
            </main>
        </div>
    );
}

function CarIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" />
            <path d="M9 17h6" />
            <circle cx="17" cy="17" r="2" />
        </svg>
    )
}
