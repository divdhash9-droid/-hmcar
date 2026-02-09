'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    Filter,
    TrendingUp,
    ChevronLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

export default function AdminOrdersPage() {
    const { t, isRTL } = useLanguage();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0
    });

    useEffect(() => {
        loadOrders();
    }, [filter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            // مؤقتاً: بيانات تجريبية
            const mockOrders = [
                {
                    id: '1',
                    orderNumber: 'ORD-A1B2C3D4',
                    customer: { name: 'Ahmed Al-Rashid', email: 'ahmed@example.com' },
                    car: { title: 'MERCEDES-BENZ S-CLASS 2024', make: 'MERCEDES' },
                    totalAmount: 450000,
                    status: 'confirmed',
                    paymentStatus: 'paid',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    orderNumber: 'ORD-E5F6G7H8',
                    customer: { name: 'Mohammed Al-Saud', email: 'mohammed@example.com' },
                    car: { title: 'BMW M5 COMPETITION 2023', make: 'BMW' },
                    totalAmount: 380000,
                    status: 'pending',
                    paymentStatus: 'pending',
                    createdAt: new Date(Date.now() - 86400000).toISOString()
                },
                {
                    id: '3',
                    orderNumber: 'ORD-I9J0K1L2',
                    customer: { name: 'Khalid Al-Otaibi', email: 'khalid@example.com' },
                    car: { title: 'PORSCHE 911 TURBO S 2024', make: 'PORSCHE' },
                    totalAmount: 720000,
                    status: 'completed',
                    paymentStatus: 'paid',
                    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
                },
            ];

            const filtered = filter === 'all'
                ? mockOrders
                : mockOrders.filter(o => o.status === filter);

            setOrders(filtered);
            setStats({
                total: mockOrders.length,
                pending: mockOrders.filter(o => o.status === 'pending').length,
                confirmed: mockOrders.filter(o => o.status === 'confirmed').length,
                completed: mockOrders.filter(o => o.status === 'completed').length,
                cancelled: mockOrders.filter(o => o.status === 'cancelled').length,
                revenue: mockOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0)
            });
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'text-cinematic-neon-yellow';
            case 'confirmed': return 'text-cinematic-neon-blue';
            case 'completed': return 'text-green-400';
            case 'cancelled': return 'text-cinematic-neon-red';
            default: return 'text-white/60';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30';
            case 'confirmed': return 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/30';
            case 'completed': return 'bg-green-400/10 border-green-400/30';
            case 'cancelled': return 'bg-cinematic-neon-red/10 border-cinematic-neon-red/30';
            default: return 'bg-white/5 border-white/10';
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">

                <header className="mb-16">
                    {/* Back Button */}
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-white/40 hover:text-white transition-colors group">
                        <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Order Management</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                        {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'الطلبات' : 'ORDERS'}</span>
                    </h1>
                    <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold">
                        {isRTL ? 'مراقبة ومعالجة جميع الطلبات والمدفوعات' : 'MONITOR AND PROCESS ALL ORDERS AND PAYMENTS'}
                    </p>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-12">
                    {[
                        { label: isRTL ? 'الكل' : 'TOTAL', value: stats.total, key: 'all', color: 'text-white' },
                        { label: isRTL ? 'قيد الانتظار' : 'PENDING', value: stats.pending, key: 'pending', color: 'text-cinematic-neon-yellow' },
                        { label: isRTL ? 'مؤكد' : 'CONFIRMED', value: stats.confirmed, key: 'confirmed', color: 'text-cinematic-neon-blue' },
                        { label: isRTL ? 'مكتمل' : 'COMPLETED', value: stats.completed, key: 'completed', color: 'text-green-400' },
                        { label: isRTL ? 'ملغي' : 'CANCELLED', value: stats.cancelled, key: 'cancelled', color: 'text-cinematic-neon-red' },
                        {
                            label: isRTL ? 'الإيرادات' : 'REVENUE',
                            value: `${(stats.revenue / 1000).toFixed(0)}K`,
                            key: 'revenue',
                            color: 'text-green-400',
                            icon: TrendingUp
                        },
                    ].map((stat, i) => (
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
                            {stat.icon && <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />}
                            <div className={cn("text-3xl font-black tracking-tighter mb-2", stat.color)}>{stat.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">{stat.label}</div>
                        </motion.button>
                    ))}
                </div>

                {/* Orders Table */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="text-white text-xl animate-pulse">Loading...</div>
                    </div>
                ) : (
                    <div className="glass-card bg-white/[0.01] border-white/5 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">ORDER</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">CUSTOMER</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">CAR</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">AMOUNT</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">PAYMENT</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">STATUS</th>
                                        <th className="text-left p-6 text-[10px] font-black uppercase tracking-[0.3em] text-white/60">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order, i) => (
                                        <motion.tr
                                            key={order.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="border-b border-white/5 hover:bg-white/[0.02] transition-all"
                                        >
                                            <td className="p-6">
                                                <div>
                                                    <div className="text-sm font-black text-cinematic-neon-blue uppercase tracking-wide">{order.orderNumber}</div>
                                                    <div className="text-[9px] text-white/40 mt-1">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div>
                                                    <div className="text-sm font-bold">{order.customer.name}</div>
                                                    <div className="text-[10px] text-white/40">{order.customer.email}</div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-sm font-bold">{order.car.title}</div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-lg font-black text-cinematic-neon-blue">
                                                    {order.totalAmount.toLocaleString()} <span className="text-[10px]">SAR</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={cn(
                                                    "px-3 py-1 rounded-lg border w-fit text-[9px] font-black uppercase",
                                                    order.paymentStatus === 'paid'
                                                        ? "bg-green-400/10 border-green-400/30 text-green-400"
                                                        : "bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/30 text-cinematic-neon-yellow"
                                                )}>
                                                    {order.paymentStatus}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className={cn("px-4 py-2 rounded-lg border w-fit", getStatusBg(order.status))}>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest", getStatusColor(order.status))}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-2">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        className="p-2 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 rounded-lg hover:bg-cinematic-neon-blue/20 transition-all"
                                                    >
                                                        <Eye className="w-4 h-4 text-cinematic-neon-blue" />
                                                    </motion.button>
                                                    {order.status === 'pending' && (
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            className="p-2 bg-green-400/10 border border-green-400/30 rounded-lg hover:bg-green-400/20 transition-all"
                                                        >
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
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
