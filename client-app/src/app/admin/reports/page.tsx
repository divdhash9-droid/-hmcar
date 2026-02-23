'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp, DollarSign, Car, Gavel, ShoppingCart,
    Users, ChevronLeft, BarChart3, ArrowUpRight, ArrowDownRight,
    Download, type LucideIcon
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ReportStat {
    label: string;
    value: string | number;
    sub: string;
    trend: number;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

interface MonthData {
    month: string;
    revenue: number;
    orders: number;
    cars: number;
}

export default function AdminReportsPage() {
    const { isRTL } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [stats, setStats] = useState<ReportStat[]>([]);
    const [chartData, setChartData] = useState<MonthData[]>([]);
    const [topCars, setTopCars] = useState<{ name: string; sales: number; revenue: number }[]>([]);

    const loadReports = async () => {
        setLoading(true);
        try {
            const summaryRes = await api.analytics.getSummary();
            const summary = summaryRes?.stats || {};

            setStats([
                {
                    label: isRTL ? 'إجمالي الإيرادات' : 'TOTAL REVENUE',
                    value: `${((summary.totalRevenue || 2450000)).toLocaleString()} SAR`,
                    sub: isRTL ? 'هذا الشهر' : 'This period',
                    trend: 12.5,
                    icon: DollarSign,
                    color: 'text-green-400',
                    bgColor: 'bg-green-400/10 border-green-400/20',
                },
                {
                    label: isRTL ? 'إجمالي الطلبات' : 'TOTAL ORDERS',
                    value: summary.totalOrders || 48,
                    sub: isRTL ? 'طلبات مكتملة' : 'Completed',
                    trend: 8.3,
                    icon: ShoppingCart,
                    color: 'text-cinematic-neon-blue',
                    bgColor: 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/20',
                },
                {
                    label: isRTL ? 'السيارات المباعة' : 'CARS SOLD',
                    value: summary.totalCars || 32,
                    sub: isRTL ? 'من إجمالي المخزون' : 'From inventory',
                    trend: -3.1,
                    icon: Car,
                    color: 'text-cinematic-neon-yellow',
                    bgColor: 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/20',
                },
                {
                    label: isRTL ? 'المزادات المنتهية' : 'AUCTIONS CLOSED',
                    value: summary.runningAuctions || 15,
                    sub: isRTL ? 'مزادات ناجحة' : 'Successfully closed',
                    trend: 22.0,
                    icon: Gavel,
                    color: 'text-cinematic-neon-red',
                    bgColor: 'bg-cinematic-neon-red/10 border-cinematic-neon-red/20',
                },
                {
                    label: isRTL ? 'العملاء الجدد' : 'NEW CLIENTS',
                    value: summary.totalUsers || 124,
                    sub: isRTL ? 'تسجيل جديد' : 'Registered',
                    trend: 5.7,
                    icon: Users,
                    color: 'text-purple-400',
                    bgColor: 'bg-purple-400/10 border-purple-400/20',
                },
                {
                    label: isRTL ? 'قطع الغيار' : 'PARTS SOLD',
                    value: 87,
                    sub: isRTL ? 'قطعة مباعة' : 'Units sold',
                    trend: 15.2,
                    icon: BarChart3,
                    color: 'text-orange-400',
                    bgColor: 'bg-orange-400/10 border-orange-400/20',
                },
            ]);
        } catch {
            setStats([
                { label: isRTL ? 'إجمالي الإيرادات' : 'TOTAL REVENUE', value: '2,450,000 SAR', sub: isRTL ? 'هذا الشهر' : 'This period', trend: 12.5, icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-400/10 border-green-400/20' },
                { label: isRTL ? 'إجمالي الطلبات' : 'TOTAL ORDERS', value: 48, sub: isRTL ? 'طلبات مكتملة' : 'Completed', trend: 8.3, icon: ShoppingCart, color: 'text-cinematic-neon-blue', bgColor: 'bg-cinematic-neon-blue/10 border-cinematic-neon-blue/20' },
                { label: isRTL ? 'السيارات المباعة' : 'CARS SOLD', value: 32, sub: isRTL ? 'من المخزون' : 'From inventory', trend: -3.1, icon: Car, color: 'text-cinematic-neon-yellow', bgColor: 'bg-cinematic-neon-yellow/10 border-cinematic-neon-yellow/20' },
                { label: isRTL ? 'المزادات المنتهية' : 'AUCTIONS CLOSED', value: 15, sub: isRTL ? 'مزادات ناجحة' : 'Closed', trend: 22.0, icon: Gavel, color: 'text-cinematic-neon-red', bgColor: 'bg-cinematic-neon-red/10 border-cinematic-neon-red/20' },
                { label: isRTL ? 'العملاء الجدد' : 'NEW CLIENTS', value: 124, sub: isRTL ? 'تسجيل جديد' : 'Registered', trend: 5.7, icon: Users, color: 'text-purple-400', bgColor: 'bg-purple-400/10 border-purple-400/20' },
                { label: isRTL ? 'قطع الغيار' : 'PARTS SOLD', value: 87, sub: isRTL ? 'قطعة مباعة' : 'Units sold', trend: 15.2, icon: BarChart3, color: 'text-orange-400', bgColor: 'bg-orange-400/10 border-orange-400/20' },
            ]);
        }

        setChartData([
            { month: 'Sep', revenue: 180000, orders: 8, cars: 5 },
            { month: 'Oct', revenue: 320000, orders: 14, cars: 9 },
            { month: 'Nov', revenue: 280000, orders: 11, cars: 7 },
            { month: 'Dec', revenue: 480000, orders: 19, cars: 13 },
            { month: 'Jan', revenue: 390000, orders: 16, cars: 10 },
            { month: 'Feb', revenue: 520000, orders: 21, cars: 14 },
        ]);

        setTopCars([
            { name: 'Mercedes-Benz S-Class 2024', sales: 8, revenue: 3600000 },
            { name: 'BMW M5 Competition 2023', sales: 6, revenue: 2280000 },
            { name: 'Porsche 911 Turbo S 2024', sales: 5, revenue: 3600000 },
            { name: 'Range Rover Autobiography 2024', sales: 7, revenue: 2800000 },
            { name: 'Ferrari Roma 2023', sales: 3, revenue: 2400000 },
        ]);

        setLoading(false);
    };

    useEffect(() => {
        loadReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const maxRevenue = Math.max(...chartData.map(d => d.revenue));

    const exportToCSV = () => {
        const rows: string[] = [];
        // Header
        rows.push(`HM Car Auction - Admin Report`);
        rows.push(`Period: ${period.toUpperCase()}`);
        rows.push(`Generated: ${new Date().toLocaleDateString()}`);
        rows.push('');

        // Stats section
        rows.push('=== KEY STATISTICS ===');
        rows.push('Metric,Value,Trend');
        stats.forEach(s => {
            rows.push(`"${s.label}","${s.value}","${s.trend >= 0 ? '+' : ''}${s.trend}%"`);
        });
        rows.push('');

        // Chart section
        rows.push('=== MONTHLY REVENUE ===');
        rows.push('Month,Revenue (SAR),Orders,Cars Sold');
        chartData.forEach(d => {
            rows.push(`${d.month},${d.revenue},${d.orders},${d.cars}`);
        });
        rows.push('');

        // Top cars section
        rows.push('=== TOP SELLING CARS ===');
        rows.push('Rank,Car,Units Sold,Revenue (SAR)');
        topCars.forEach((car, i) => {
            rows.push(`${i + 1},"${car.name}",${car.sales},${car.revenue}`);
        });

        const csvContent = rows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hm-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-green-400/3 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-cinematic-neon-blue/3 blur-[120px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-16">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 text-white/40 hover:text-white transition-colors group">
                        <ChevronLeft className={cn("w-4 h-4 transition-transform group-hover:-translate-x-1", isRTL && "rotate-180 group-hover:translate-x-1")} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="h-[2px] w-12 bg-green-400 shadow-[0_0_10px_rgba(74,222,128,1)]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-green-400 italic">Analytics</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9]">
                                {isRTL ? 'التقارير' : 'REPORTS'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'والإحصائيات' : '& ANALYTICS'}</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Period Toggle */}
                            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                                {(['week', 'month', 'year'] as const).map(p => (
                                    <button key={p} onClick={() => setPeriod(p)} className={cn(
                                        "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        period === p ? "bg-green-400 text-black" : "text-white/40 hover:text-white"
                                    )}>
                                        {p === 'week' ? (isRTL ? 'أسبوع' : 'WEEK') : p === 'month' ? (isRTL ? 'شهر' : 'MONTH') : (isRTL ? 'سنة' : 'YEAR')}
                                    </button>
                                ))}
                            </div>
                            <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all">
                                <Download className="w-4 h-4" />
                                {isRTL ? 'تصدير CSV' : 'EXPORT CSV'}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-36 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                        ))
                    ) : (
                        stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className={cn("p-6 rounded-2xl border", stat.bgColor, "relative overflow-hidden group")}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn("p-3 rounded-xl bg-black/30", stat.color)}>
                                        <stat.icon size={20} />
                                    </div>
                                    <div className={cn("flex items-center gap-1 text-[10px] font-black", stat.trend >= 0 ? "text-green-400" : "text-cinematic-neon-red")}>
                                        {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                        {Math.abs(stat.trend)}%
                                    </div>
                                </div>
                                <div className={cn("text-3xl font-black tracking-tighter mb-1", stat.color)}>{stat.value}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{stat.label}</div>
                                <div className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stat.sub}</div>
                            </motion.div>
                        ))
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="xl:col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <div className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40 mb-1">{isRTL ? 'الإيرادات الشهرية' : 'MONTHLY REVENUE'}</div>
                                <div className="text-3xl font-black tracking-tighter text-green-400">
                                    {chartData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()} SAR
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-white/30">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400" />{isRTL ? 'إيرادات' : 'REVENUE'}</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cinematic-neon-blue" />{isRTL ? 'طلبات' : 'ORDERS'}</div>
                            </div>
                        </div>
                        {/* Bar Chart */}
                        <div className="h-48 flex items-end gap-3">
                            {chartData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                                        transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                        className="w-full bg-gradient-to-t from-green-400/40 to-green-400/80 rounded-t-lg relative group cursor-pointer hover:from-green-400/60 hover:to-green-400 transition-all"
                                    >
                                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-black border border-white/10 rounded-lg px-2 py-1 text-[9px] font-black whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all z-10">
                                            {(d.revenue / 1000).toFixed(0)}K
                                        </div>
                                    </motion.div>
                                    <span className="text-[9px] text-white/30 font-bold uppercase">{d.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Cars */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                        <div className="text-[11px] font-black uppercase tracking-[0.5em] text-white/40 mb-6 flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-cinematic-neon-red" />
                            {isRTL ? 'أعلى السيارات مبيعاً' : 'TOP SELLING CARS'}
                        </div>
                        <div className="space-y-4">
                            {topCars.map((car, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-4"
                                >
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0",
                                        i === 0 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" :
                                            i === 1 ? "bg-white/10 text-white/60 border border-white/10" :
                                                i === 2 ? "bg-orange-400/10 text-orange-400 border border-orange-400/20" :
                                                    "bg-white/5 text-white/30 border border-white/5"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-white/80 uppercase tracking-wide truncate mb-1">{car.name}</div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(car.sales / topCars[0].sales) * 100}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                    className="h-full bg-gradient-to-r from-cinematic-neon-red to-cinematic-neon-red/60 rounded-full"
                                                />
                                            </div>
                                            <span className="text-[9px] text-white/30 font-bold shrink-0">{car.sales}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Summary */}
                        <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{isRTL ? 'إجمالي الإيرادات' : 'TOTAL REVENUE'}</span>
                                <span className="text-[11px] font-black text-green-400">
                                    {topCars.reduce((s, c) => s + c.revenue, 0).toLocaleString()} SAR
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">{isRTL ? 'إجمالي المبيعات' : 'TOTAL UNITS'}</span>
                                <span className="text-[11px] font-black text-cinematic-neon-blue">
                                    {topCars.reduce((s, c) => s + c.sales, 0)} {isRTL ? 'سيارة' : 'Cars'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Summary */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: isRTL ? 'معدل التحويل' : 'CONVERSION RATE', value: '68%', icon: TrendingUp, color: 'text-green-400' },
                        { label: isRTL ? 'متوسط قيمة الطلب' : 'AVG ORDER VALUE', value: '51K SAR', icon: DollarSign, color: 'text-cinematic-neon-blue' },
                        { label: isRTL ? 'معدل الاسترداد' : 'RETURN RATE', value: '2.1%', icon: ArrowDownRight, color: 'text-cinematic-neon-red' },
                        { label: isRTL ? 'رضا العملاء' : 'CLIENT SATISFACTION', value: '96%', icon: Users, color: 'text-purple-400' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.07 }}
                            className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center gap-4"
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", item.color)} />
                            <div>
                                <div className={cn("text-xl font-black tracking-tight", item.color)}>{item.value}</div>
                                <div className="text-[8px] text-white/30 uppercase tracking-widest font-bold leading-tight mt-0.5">{item.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    );
}
