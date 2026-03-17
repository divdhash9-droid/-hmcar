'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Plus, FileText, Search, Filter, Printer, 
    Download, Trash2, Eye,
    ArrowUpRight, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function InvoicesListPage() {
    const { isRTL } = useLanguage();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

    const loadInvoices = async (page = 1) => {
        try {
            setLoading(true);
            const res = await api.invoices.list({ page, limit: 10 });
            if (res.success) {
                setInvoices(res.data.invoices);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            console.error('Failed to load invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Are you sure you want to delete this invoice?')) return;
        try {
            const res = await api.invoices.delete(id);
            if (res.success) {
                setInvoices(invoices.filter(inv => inv._id !== id));
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'sent': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-3 h-3" />;
            case 'sent': return <ArrowUpRight className="w-3 h-3" />;
            case 'cancelled': return <AlertCircle className="w-3 h-3" />;
            default: return <Clock className="w-3 h-3" />;
        }
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-widest uppercase">
                        {isRTL ? 'نظام الفواتير الذكي' : 'Smart Invoices'}
                    </h1>
                    <p className="text-white/40 text-xs font-mono mt-1 tracking-wider uppercase">
                        {isRTL ? 'إدارة وإنشاء فواتير HM CAR الرسمية' : 'Manage & Create Official HM CAR Invoices'}
                    </p>
                </div>

                <Link
                    href="/admin/invoices/create"
                    className="flex items-center gap-2 group px-6 py-3 bg-orange-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
                </Link>
            </div>

            {/* Stats Overview (Minimalist) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: isRTL ? 'إجمالي الفواتير' : 'TOTAL INVOICES', value: pagination.total, icon: FileText, color: 'text-orange-400' },
                    { label: isRTL ? 'فواتير غير مدفوعة' : 'UNPAID', value: invoices.filter(i => i.status !== 'paid').length, icon: Clock, color: 'text-blue-400' },
                    { label: isRTL ? 'تحصيل هذا الشهر' : 'PAID THIS MONTH', value: invoices.filter(i => i.status === 'paid').length, icon: CheckCircle, color: 'text-green-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.05] p-6 rounded-2xl backdrop-blur-md">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <p className="text-2xl font-mono font-black text-white">{stat.value}</p>
                            </div>
                            <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-400 transition-colors" />
                    <input 
                        type="text"
                        placeholder={isRTL ? 'البحث برقم الفاتورة أو اسم المشتري...' : 'Search by Invoice # or Buyer...'}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 transition-all">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 text-xs font-bold transition-all">
                        <Download className="w-4 h-4" />
                        {isRTL ? 'تصدير' : 'Export'}
                    </button>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl overflow-hidden backdrop-blur-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" dir={isRTL ? 'rtl' : 'ltr'}>
                        <thead>
                            <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {isRTL ? 'رقم الفاتورة' : 'Invoice No.'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {isRTL ? 'المشتري' : 'Buyer'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {isRTL ? 'التاريخ' : 'Date'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {isRTL ? 'المبلغ' : 'Amount'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {isRTL ? 'الحالة' : 'Status'}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">
                                    {isRTL ? 'إجراءات' : 'Actions'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {invoices.filter(i => 
                                    i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    i.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((invoice) => (
                                    <motion.tr 
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={invoice._id} 
                                        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                                    <FileText className="w-4 h-4 text-orange-400" />
                                                </div>
                                                <span className="font-mono text-xs font-black text-white tracking-widest uppercase">
                                                    {invoice.invoiceNumber}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-white/80">{invoice.buyerName}</span>
                                                <span className="text-[10px] text-white/30 font-mono tracking-tighter">{invoice.buyerPhone || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-white/40 font-mono">
                                                {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-mono">
                                                <span className="text-sm font-black text-orange-400">${Number(invoice.totalUsd).toLocaleString()}</span>
                                                <span className="text-[10px] text-white/30">KRW {Number(invoice.totalKrw).toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest",
                                                getStatusColor(invoice.status)
                                            )}>
                                                {getStatusIcon(invoice.status)}
                                                {invoice.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <Link 
                                                    href={`/admin/invoices/${invoice._id}`}
                                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-orange-500/50 hover:text-orange-400 transition-all"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <button 
                                                    onClick={() => window.open(`/admin/invoices/${invoice._id}?print=true`)}
                                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 hover:text-blue-400 transition-all"
                                                    title="Print"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(invoice._id)}
                                                    className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {!loading && invoices.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center mb-6">
                            <FileText className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{isRTL ? 'لا توجد فواتير بعد' : 'No Invoices Yet'}</h3>
                        <p className="text-white/40 text-sm max-w-xs">{isRTL ? 'ابدأ بإنشاء أول فاتورة رسمية من خلال الزر أعلاه' : 'Start by creating your first official invoice using the button above'}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full mb-4"
                        />
                        <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase italic animate-pulse">
                            Loading Cockpit Data...
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Placeholder */}
            {pagination.pages > 1 && (
                <div className="flex justify-center gap-2">
                    {/* Simplified pagination */}
                    {Array.from({ length: pagination.pages }).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => loadInvoices(idx + 1)}
                            className={cn(
                                "w-10 h-10 rounded-xl border transition-all text-xs font-black font-mono",
                                pagination.current === idx + 1
                                    ? "bg-orange-500 border-orange-400 text-black shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                                    : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                            )}
                        >
                            {(idx + 1).toString().padStart(2, '0')}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

