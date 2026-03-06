'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
    TrendingUp, ChevronLeft, X, AlertCircle, RefreshCcw, Trash2, Printer,
    ShoppingCart, Clock, CheckCircle, XCircle, Eye
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';

interface Order {
    id: string;
    orderNumber: string;
    customer: { name: string; email: string };
    car: { title: string; make: string };
    totalAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
}

interface OrderDetail extends Order {
    address?: string;
    notes?: string;
}

const MOCK_ORDERS: Order[] = [
    { id: '1', orderNumber: 'ORD-A1B2C3D4', customer: { name: 'Ahmed Al-Rashid', email: 'ahmed@example.com' }, car: { title: 'MERCEDES-BENZ S-CLASS 2024', make: 'MERCEDES' }, totalAmount: 450000, status: 'confirmed', paymentStatus: 'paid', createdAt: new Date().toISOString() },
    { id: '2', orderNumber: 'ORD-E5F6G7H8', customer: { name: 'Mohammed Al-Saud', email: 'mohammed@example.com' }, car: { title: 'BMW M5 COMPETITION 2023', make: 'BMW' }, totalAmount: 380000, status: 'pending', paymentStatus: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '3', orderNumber: 'ORD-I9J0K1L2', customer: { name: 'Khalid Al-Otaibi', email: 'khalid@example.com' }, car: { title: 'PORSCHE 911 TURBO S 2024', make: 'PORSCHE' }, totalAmount: 720000, status: 'completed', paymentStatus: 'paid', createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    { id: '4', orderNumber: 'ORD-M3N4O5P6', customer: { name: 'Faisal Al-Otaibi', email: 'faisal@example.com' }, car: { title: 'RANGE ROVER AUTOBIOGRAPHY 2024', make: 'LAND ROVER' }, totalAmount: 560000, status: 'pending', paymentStatus: 'pending', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: '5', orderNumber: 'ORD-Q7R8S9T0', customer: { name: 'Saad Al-Ghamdi', email: 'saad@example.com' }, car: { title: 'FERRARI ROMA 2023', make: 'FERRARI' }, totalAmount: 980000, status: 'cancelled', paymentStatus: 'refunded', createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
];

export default function AdminOrdersPage() {
    const { isRTL } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 });

    useEffect(() => {
        loadOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter]);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filter !== 'all') params.status = filter;
            const data = await api.orders.list(params);
            let list: Order[] = [];
            if (data?.success && Array.isArray(data.orders)) {
                list = data.orders;
            } else {
                // Fallback to mock data
                list = filter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === filter);
            }
            setOrders(list);
            const all = filter === 'all' ? list : MOCK_ORDERS;
            setStats({
                total: all.length,
                pending: all.filter(o => o.status === 'pending').length,
                confirmed: all.filter(o => o.status === 'confirmed').length,
                completed: all.filter(o => o.status === 'completed').length,
                cancelled: all.filter(o => o.status === 'cancelled').length,
                revenue: all.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
            });
        } catch {
            const list = filter === 'all' ? MOCK_ORDERS : MOCK_ORDERS.filter(o => o.status === filter);
            setOrders(list);
            setStats({
                total: MOCK_ORDERS.length,
                pending: MOCK_ORDERS.filter(o => o.status === 'pending').length,
                confirmed: MOCK_ORDERS.filter(o => o.status === 'confirmed').length,
                completed: MOCK_ORDERS.filter(o => o.status === 'completed').length,
                cancelled: MOCK_ORDERS.filter(o => o.status === 'cancelled').length,
                revenue: MOCK_ORDERS.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0),
            });
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
            showToast(isRTL ? 'تم تحديث حالة الطلب' : 'Order status updated');
        } catch {
            showToast(isRTL ? 'فشل تحديث الحالة' : 'Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) return;
        try {
            await api.orders.delete(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
            showToast(isRTL ? 'تم حذف الطلب بنجاح' : 'Order deleted successfully');
        } catch {
            showToast(isRTL ? 'فشل حذف الطلب' : 'Failed to delete order', 'error');
        }
    };

    const printInvoice = () => {
        window.print();
    };

    const viewOrder = (order: Order) => {
        setSelectedOrder({ ...order, address: 'Riyadh, Saudi Arabia', notes: 'VIP Client — Handle with priority' });
    };

    const getStatusColor = (s: string) => ({ pending: 'text-cinematic-neon-yellow', confirmed: 'text-cinematic-neon-blue', completed: 'text-green-400', cancelled: 'text-cinematic-neon-red' }[s] || 'text-white/60');
    const getStatusBg = (s: string) => ({ pending: 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30', confirmed: 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30', completed: 'bg-green-400/10 border-green-400/30', cancelled: 'bg-cinematic-neon-red/10 border-cinematic-neon-red/30' }[s] || 'bg-white/5 border-white/10');

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-24 right-6 z-[200] px-6 py-3 rounded-xl border text-[11px] font-black uppercase tracking-widest flex items-center gap-3",
                            toast.type === 'success' ? "bg-green-400/20 border-green-400/40 text-green-400" : "bg-cinematic-neon-red/20 border-cinematic-neon-red/40 text-cinematic-neon-red"
                        )}
                    >
                        {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{isRTL ? 'تفاصيل الطلب' : 'ORDER DETAILS'}</div>
                                    <div className="text-xl font-black text-cinematic-neon-blue">{selectedOrder.orderNumber}</div>
                                </div>
                                <button aria-label="Close" onClick={() => setSelectedOrder(null)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 grid grid-cols-2 gap-6">
                                {[
                                    { label: isRTL ? 'العميل' : 'CUSTOMER', value: selectedOrder.customer.name },
                                    { label: isRTL ? 'البريد الإلكتروني' : 'EMAIL', value: selectedOrder.customer.email },
                                    { label: isRTL ? 'السيارة' : 'CAR', value: selectedOrder.car.title },
                                    { label: isRTL ? 'المبلغ' : 'AMOUNT', value: `${selectedOrder.totalAmount.toLocaleString()} SAR` },
                                    { label: isRTL ? 'الدفع' : 'PAYMENT', value: selectedOrder.paymentStatus.toUpperCase() },
                                    { label: isRTL ? 'التاريخ' : 'DATE', value: new Date(selectedOrder.createdAt).toLocaleDateString() },
                                    { label: isRTL ? 'العنوان' : 'ADDRESS', value: selectedOrder.address || '—' },
                                    { label: isRTL ? 'ملاحظات' : 'NOTES', value: selectedOrder.notes || '—' },
                                ].map(item => (
                                    <div key={item.label} className="space-y-1">
                                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30">{item.label}</div>
                                        <div className="text-[12px] font-bold text-white/80">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                            {/* Status + Actions */}
                            <div className="px-8 pb-8 flex flex-wrap items-center gap-3">
                                <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mr-2">{isRTL ? 'تغيير الحالة:' : 'CHANGE STATUS:'}</div>
                                {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => updateStatus(selectedOrder.id, s)}
                                        disabled={selectedOrder.status === s || updatingId === selectedOrder.id}
                                        className={cn(
                                            "px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40",
                                            selectedOrder.status === s ? getStatusBg(s) + ' ' + getStatusColor(s) : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white"
                                        )}
                                    >
                                        {updatingId === selectedOrder.id && selectedOrder.status !== s ? '...' : s}
                                    </button>
                                ))}
                                <div className="w-full h-px bg-white/5 my-2" />
                                <button onClick={printInvoice} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                                    <Printer className="w-4 h-4" /> {isRTL ? 'طباعة الفاتورة' : 'PRINT INVOICE'}
                                </button>
                                <button onClick={() => deleteOrder(selectedOrder.id)} className="flex-1 py-3 bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-cinematic-neon-red hover:bg-cinematic-neon-red hover:text-white transition-all flex items-center justify-center gap-2">
                                    <Trash2 className="w-4 h-4" /> {isRTL ? 'حذف الطلب' : 'DELETE ORDER'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <header className="mb-16">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all group w-fit">
                        <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Order Management</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                                {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'الطلبات' : 'ORDERS'}</span>
                            </h1>
                        </div>
                        <button onClick={loadOrders} className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">
                            <RefreshCcw className="w-4 h-4" /> {isRTL ? 'تحديث' : 'REFRESH'}
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
                    {[
                        { label: isRTL ? 'الكل' : 'TOTAL', value: stats.total, key: 'all', color: 'text-white' },
                        { label: isRTL ? 'انتظار' : 'PENDING', value: stats.pending, key: 'pending', color: 'text-cinematic-neon-yellow' },
                        { label: isRTL ? 'مؤكد' : 'CONFIRMED', value: stats.confirmed, key: 'confirmed', color: 'text-cinematic-neon-blue' },
                        { label: isRTL ? 'مكتمل' : 'COMPLETED', value: stats.completed, key: 'completed', color: 'text-green-400' },
                        { label: isRTL ? 'ملغي' : 'CANCELLED', value: stats.cancelled, key: 'cancelled', color: 'text-cinematic-neon-red' },
                        { label: isRTL ? 'الإيرادات' : 'REVENUE', value: `${(stats.revenue / 1000).toFixed(0)}K`, key: 'revenue', color: 'text-green-400', icon: TrendingUp },
                    ].map(stat => (
                        <motion.button
                            key={stat.key}
                            onClick={() => stat.key !== 'revenue' && setFilter(stat.key)}
                            whileHover={{ scale: stat.key !== 'revenue' ? 1.05 : 1 }}
                            whileTap={{ scale: stat.key !== 'revenue' ? 0.95 : 1 }}
                            className={cn(
                                "glass-card p-6 bg-white/[0.01] border-white/5 text-center transition-all",
                                filter === stat.key && "border-cinematic-neon-blue/30 bg-cinematic-neon-blue/5",
                                stat.key === 'revenue' && "cursor-default"
                            )}
                        >
                            {'icon' in stat && stat.icon && <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />}
                            <div className={cn("text-3xl font-black tracking-tighter mb-2", stat.color)}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="glass-card p-20 text-center bg-white/[0.01] border-white/5">
                        <ShoppingCart className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-white/30 text-[11px] uppercase font-black tracking-widest">
                            {isRTL ? 'لا توجد طلبات' : 'NO ORDERS FOUND'}
                        </p>
                    </div>
                ) : (
                    <div className="glass-card bg-white/[0.01] border-white/5 overflow-hidden rounded-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {[isRTL ? 'رقم الطلب' : 'ORDER', isRTL ? 'العميل' : 'CUSTOMER', isRTL ? 'السيارة' : 'CAR', isRTL ? 'المبلغ' : 'AMOUNT', isRTL ? 'الدفع' : 'PAYMENT', isRTL ? 'الحالة' : 'STATUS', isRTL ? 'إجراءات' : 'ACTIONS'].map(h => (
                                            <th key={h} className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, i) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.07 }}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-all"
                                        >
                                            <td className="p-6">
                                                <div className="text-sm font-black text-cinematic-neon-blue uppercase">{order.orderNumber}</div>
                                                <div className="text-[9px] text-white/30 mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-bold text-white">{order.customer.name}</div>
                                                <div className="text-[9px] text-white/30">{order.customer.email}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-[11px] font-bold text-white/80 max-w-[160px] truncate">{order.car.title}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-lg font-black text-cinematic-neon-blue">{order.totalAmount.toLocaleString()} <span className="text-[10px]">SAR</span></div>
                                            </td>
                                            <td className="p-6">
                                                <div className={cn("px-3 py-1 rounded-lg border w-fit text-[9px] font-black uppercase", order.paymentStatus === 'paid' ? 'bg-green-400/10 border-green-400/30 text-green-400' : order.paymentStatus === 'refunded' ? 'bg-purple-400/10 border-purple-400/30 text-purple-400' : 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30 text-cinematic-neon-yellow')}>
                                                    {order.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={cn("px-3 py-1 rounded-lg border w-fit", getStatusBg(order.status))}>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", getStatusColor(order.status))}>{order.status}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-2 flex-wrap">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                        onClick={() => viewOrder(order)}
                                                        className="px-3 py-2 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 rounded-lg hover:bg-cinematic-neon-blue/20 transition-all flex items-center gap-2 text-[9px] font-black uppercase text-cinematic-neon-blue"
                                                    >
                                                        <Eye className="w-3 h-3" /> {isRTL ? 'عرض' : 'VIEW'}
                                                    </motion.button>
                                                    {order.status === 'pending' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => updateStatus(order.id, 'confirmed')}
                                                            disabled={updatingId === order.id}
                                                            className="px-3 py-2 bg-green-400/10 border border-green-400/30 rounded-lg hover:bg-green-400/20 transition-all flex items-center gap-2 text-[9px] font-black uppercase text-green-400 disabled:opacity-50"
                                                        >
                                                            <CheckCircle className="w-3 h-3" /> {isRTL ? 'تأكيد' : 'CONFIRM'}
                                                        </motion.button>
                                                    )}
                                                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => updateStatus(order.id, 'cancelled')}
                                                            disabled={updatingId === order.id}
                                                            className="px-3 py-2 bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 rounded-lg hover:bg-cinematic-neon-red/20 transition-all flex items-center gap-2 text-[9px] font-black uppercase text-cinematic-neon-red disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-3 h-3" /> {isRTL ? 'إلغاء' : 'CANCEL'}
                                                        </motion.button>
                                                    )}
                                                    {order.status === 'confirmed' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                                            onClick={() => updateStatus(order.id, 'completed')}
                                                            disabled={updatingId === order.id}
                                                            className="px-3 py-2 bg-purple-400/10 border border-purple-400/30 rounded-lg hover:bg-purple-400/20 transition-all flex items-center gap-2 text-[9px] font-black uppercase text-purple-400 disabled:opacity-50"
                                                        >
                                                            <Clock className="w-3 h-3" /> {isRTL ? 'إكمال' : 'COMPLETE'}
                                                        </motion.button>
                                                    )}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
