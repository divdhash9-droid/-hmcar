'use client';

/**
 * صفحة إدارة الطلبات الخاصة - لوحة الأدمن
 * تعرض جميع طلبات السيارات وقطع الغيار مع إمكانية تحديث الحالة والحذف
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Car, Settings, Phone, User, Calendar,
    Palette, FileText, ImageIcon, Clock, CheckCircle, XCircle,
    Loader, Trash2, ArrowLeft, Filter, RefreshCw, Eye, X
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/ToastContext';

interface ConciergeRequest {
    _id: string;
    type: 'car' | 'parts';
    name: string;
    phone: string;
    carName?: string;
    model?: string;
    color?: string;
    colorName?: string;
    year?: string;
    partName?: string;
    imageUrl?: string;
    description?: string;
    status: 'new' | 'in_progress' | 'completed' | 'cancelled';
    adminNotes?: string;
    createdAt: string;
}

const STATUS_CONFIG = {
    new: { label: 'جديد', labelEn: 'New', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', icon: Clock },
    in_progress: { label: 'قيد المعالجة', labelEn: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: Loader },
    completed: { label: 'مكتمل', labelEn: 'Completed', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle },
    cancelled: { label: 'ملغي', labelEn: 'Cancelled', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
};

export default function AdminConcierge() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [requests, setRequests] = useState<ConciergeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'car' | 'parts'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'in_progress' | 'completed' | 'cancelled'>('all');
    const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [stats, setStats] = useState({ total: 0, new: 0, in_progress: 0, completed: 0, cancelled: 0 });
    const [detailedStats, setDetailedStats] = useState<{
        byType?: { car: number; parts: number };
        recent?: ConciergeRequest[];
    } | null>(null);

    const loadRequests = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (filterType !== 'all') params.type = filterType;
            if (filterStatus !== 'all') params.status = filterStatus;
            const [res, statsRes] = await Promise.all([
                api.concierge.list(params),
                api.concierge.stats(),
            ]);
            if (res?.success) {
                const data: ConciergeRequest[] = res.data.requests || [];
                setRequests(data);
                setStats({
                    total: res.data.total || data.length,
                    new: data.filter(r => r.status === 'new').length,
                    in_progress: data.filter(r => r.status === 'in_progress').length,
                    completed: data.filter(r => r.status === 'completed').length,
                    cancelled: data.filter(r => r.status === 'cancelled').length,
                });
            }
            if (statsRes?.success) {
                setDetailedStats(statsRes.data);
            }
        } catch (err) {
            console.error('Failed to load requests:', err);
            showToast(isRTL ? 'فشل في تحميل الطلبات' : 'Failed to load requests', 'error');
        } finally {
            setLoading(false);
        }
    }, [filterType, filterStatus, isRTL, showToast]);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    const handleStatusChange = async (id: string, status: string) => {
        setUpdatingId(id);
        try {
            await api.concierge.updateStatus(id, status);
            showToast(isRTL ? '✅ تم تحديث الحالة' : '✅ Status updated', 'success');
            await loadRequests();
            if (selectedRequest?._id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: status as ConciergeRequest['status'] } : prev);
            }
        } catch {
            showToast(isRTL ? 'فشل تحديث الحالة' : 'Failed to update status', 'error');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Delete this request?')) return;
        try {
            await api.concierge.delete(id);
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
            if (selectedRequest?._id === id) setSelectedRequest(null);
            await loadRequests();
        } catch {
            showToast(isRTL ? 'فشل الحذف' : 'Delete failed', 'error');
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className={cn('min-h-screen bg-black text-white', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/8 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 text-white/40 hover:text-amber-400 transition-colors group">
                        <ArrowLeft className={cn('w-5 h-5 group-hover:-translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-[2px] w-8 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-500">
                                {isRTL ? 'لوحة الأدمن' : 'Admin Panel'}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                            {isRTL ? 'الطلبات الخاصة' : 'SPECIAL REQUESTS'}
                        </h1>
                    </div>
                    <button
                        onClick={loadRequests}
                        className="mr-auto ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                        title={isRTL ? 'تحديث' : 'Refresh'}
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        {isRTL ? 'تحديث' : 'Refresh'}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {[
                        { label: isRTL ? 'الكل' : 'All', value: stats.total, color: 'text-white', key: 'all' },
                        { label: isRTL ? 'جديد' : 'New', value: stats.new, color: 'text-amber-400', key: 'new' },
                        { label: isRTL ? 'قيد المعالجة' : 'In Progress', value: stats.in_progress, color: 'text-blue-400', key: 'in_progress' },
                        { label: isRTL ? 'مكتمل' : 'Completed', value: stats.completed, color: 'text-green-400', key: 'completed' },
                        { label: isRTL ? 'ملغي' : 'Cancelled', value: stats.cancelled, color: 'text-red-400', key: 'cancelled' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilterStatus(s.key as typeof filterStatus)}
                            className={cn(
                                'p-4 rounded-2xl text-center border transition-all',
                                filterStatus === s.key
                                    ? 'bg-amber-500/10 border-amber-500/40'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            )}
                        >
                            <div className={cn('text-3xl font-black tracking-tighter', s.color)}>{s.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-wider text-white/40 mt-1">{s.label}</div>
                        </button>
                    ))}
                </div>

                {/* Detailed Stats Banner */}
                {detailedStats && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
                    >
                        {/* توزيع النوع */}
                        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">
                                {isRTL ? 'توزيع الطلبات حسب النوع' : 'Requests By Type'}
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="flex items-center gap-1.5 text-blue-400">
                                            <Car className="w-3 h-3" />
                                            {isRTL ? 'سيارات' : 'Cars'}
                                        </span>
                                        <span className="font-black text-blue-400">{detailedStats.byType?.car || 0}</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-700"
                                            style={{ width: `${stats.total ? Math.round(((detailedStats.byType?.car || 0) / stats.total) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="flex items-center gap-1.5 text-orange-400">
                                            <Settings className="w-3 h-3" />
                                            {isRTL ? 'قطع غيار' : 'Parts'}
                                        </span>
                                        <span className="font-black text-orange-400">{detailedStats.byType?.parts || 0}</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-700"
                                            style={{ width: `${stats.total ? Math.round(((detailedStats.byType?.parts || 0) / stats.total) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* أحدث الطلبات */}
                        <div className="bg-white/[0.02] border border-white/8 rounded-2xl p-5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">
                                {isRTL ? 'أحدث الطلبات' : 'Latest Requests'}
                            </div>
                            <div className="space-y-2">
                                {(detailedStats.recent || []).slice(0, 4).map(r => (
                                    <div key={r._id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center',
                                                r.type === 'car' ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'
                                            )}>
                                                {r.type === 'car' ? <Car className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs text-white/60 truncate font-medium">{r.name}</span>
                                        </div>
                                        <span className={cn(
                                            'text-[9px] font-black uppercase px-2 py-0.5 rounded-md border flex-shrink-0',
                                            STATUS_CONFIG[r.status]?.bg,
                                            STATUS_CONFIG[r.status]?.color
                                        )}>
                                            {isRTL ? STATUS_CONFIG[r.status]?.label : STATUS_CONFIG[r.status]?.labelEn}
                                        </span>
                                    </div>
                                ))}
                                {(!detailedStats.recent || detailedStats.recent.length === 0) && (
                                    <p className="text-xs text-white/20 text-center py-2">{isRTL ? 'لا توجد طلبات' : 'No requests yet'}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-white/30" />
                        <span className="text-xs text-white/40 font-bold uppercase">{isRTL ? 'نوع الطلب:' : 'Type:'}</span>
                    </div>
                    {[
                        { id: 'all', label: isRTL ? 'الكل' : 'All' },
                        { id: 'car', label: isRTL ? 'طلبات سيارات' : 'Car Requests', icon: Car },
                        { id: 'parts', label: isRTL ? 'طلبات قطع' : 'Parts Requests', icon: Settings },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterType(f.id as typeof filterType)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
                                filterType === f.id
                                    ? 'bg-amber-500 text-black border-amber-500'
                                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                            )}
                        >
                            {f.icon && <f.icon className="w-3.5 h-3.5" />}
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Requests Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="h-48 rounded-2xl bg-white/[0.02] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-32">
                        <Briefcase className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-xl font-black text-white/20 uppercase tracking-widest">
                            {isRTL ? 'لا توجد طلبات' : 'NO REQUESTS'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {requests.map((req, i) => {
                                const statusCfg = STATUS_CONFIG[req.status];
                                const StatusIcon = statusCfg.icon;
                                return (
                                    <motion.div
                                        key={req._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white/[0.02] border border-white/8 rounded-2xl p-5 hover:border-amber-500/20 transition-all group"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center border',
                                                    req.type === 'car'
                                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                )}>
                                                    {req.type === 'car' ? <Car className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                        {req.type === 'car' ? (isRTL ? 'طلب سيارة' : 'CAR REQUEST') : (isRTL ? 'طلب قطعة' : 'PARTS REQUEST')}
                                                    </div>
                                                    <div className="text-sm font-black">{req.name}</div>
                                                </div>
                                            </div>
                                            <span className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1', statusCfg.bg, statusCfg.color)}>
                                                <StatusIcon className="w-3 h-3" />
                                                {isRTL ? statusCfg.label : statusCfg.labelEn}
                                            </span>
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-xs text-white/50">
                                                <Phone className="w-3.5 h-3.5 text-white/25" />
                                                {req.phone}
                                            </div>
                                            {req.type === 'car' && req.carName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Car className="w-3.5 h-3.5 text-white/25" />
                                                    {req.carName} {req.model && `· ${req.model}`}
                                                </div>
                                            )}
                                            {req.type === 'parts' && req.partName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Settings className="w-3.5 h-3.5 text-white/25" />
                                                    {req.partName}
                                                </div>
                                            )}
                                            {req.colorName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0" style={{ background: req.color }} />
                                                    {req.colorName}
                                                </div>
                                            )}
                                            {req.year && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Calendar className="w-3.5 h-3.5 text-white/25" />
                                                    {req.year}
                                                </div>
                                            )}
                                            {req.description && (
                                                <div className="flex items-start gap-2 text-xs text-white/40 line-clamp-2">
                                                    <FileText className="w-3.5 h-3.5 text-white/25 flex-shrink-0 mt-0.5" />
                                                    {req.description}
                                                </div>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div className="text-[10px] text-white/25 mb-4">{formatDate(req.createdAt)}</div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                {isRTL ? 'تفاصيل' : 'Details'}
                                            </button>
                                            {/* تغيير الحالة السريع */}
                                            <select
                                                value={req.status}
                                                onChange={e => handleStatusChange(req._id, e.target.value)}
                                                title={isRTL ? 'تغيير الحالة' : 'Change Status'}
                                                disabled={updatingId === req._id}
                                                className="flex-1 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-[10px] font-black cursor-pointer appearance-none text-center focus:outline-none hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                            >
                                                <option value="new" className="bg-black">جديد</option>
                                                <option value="in_progress" className="bg-black">قيد المعالجة</option>
                                                <option value="completed" className="bg-black">مكتمل</option>
                                                <option value="cancelled" className="bg-black">ملغي</option>
                                            </select>
                                            <button
                                                onClick={() => handleDelete(req._id)}
                                                className="w-10 h-9 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500/20 transition-all"
                                                title={isRTL ? 'حذف' : 'Delete'}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedRequest && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedRequest(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                                        {isRTL ? 'تفاصيل الطلب' : 'Request Details'}
                                    </div>
                                    <h2 className="text-xl font-black uppercase">
                                        {selectedRequest.type === 'car' ? (isRTL ? 'طلب سيارة' : 'Car Request') : (isRTL ? 'طلب قطعة غيار' : 'Parts Request')}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    title={isRTL ? 'إغلاق' : 'Close'}
                                    className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: User, label: isRTL ? 'الاسم' : 'Name', value: selectedRequest.name },
                                    { icon: Phone, label: isRTL ? 'الهاتف' : 'Phone', value: selectedRequest.phone },
                                    ...(selectedRequest.type === 'car' ? [
                                        selectedRequest.carName && { icon: Car, label: isRTL ? 'اسم السيارة' : 'Car Name', value: selectedRequest.carName },
                                        selectedRequest.model && { icon: Car, label: isRTL ? 'الموديل' : 'Model', value: selectedRequest.model },
                                        selectedRequest.colorName && { icon: Palette, label: isRTL ? 'اللون' : 'Color', value: selectedRequest.colorName, extra: selectedRequest.color },
                                        selectedRequest.year && { icon: Calendar, label: isRTL ? 'السنة' : 'Year', value: selectedRequest.year },
                                    ] : [
                                        selectedRequest.partName && { icon: Settings, label: isRTL ? 'اسم القطعة' : 'Part Name', value: selectedRequest.partName },
                                        selectedRequest.carName && { icon: Car, label: isRTL ? 'اسم السيارة' : 'Car Name', value: selectedRequest.carName },
                                        selectedRequest.year && { icon: Calendar, label: isRTL ? 'السنة' : 'Year', value: selectedRequest.year },
                                    ]).filter(Boolean),
                                    selectedRequest.description && { icon: FileText, label: isRTL ? 'الوصف' : 'Description', value: selectedRequest.description },
                                ].filter(Boolean).map((item: any, i) => item && (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                        <item.icon className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-white/30 mb-0.5">{item.label}</div>
                                            <div className="text-sm text-white/80 flex items-center gap-2">
                                                {item.extra && <span className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" style={{ background: item.extra }} />}
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* صورة القطعة */}
                                {selectedRequest.type === 'parts' && selectedRequest.imageUrl && (
                                    <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            {isRTL ? 'صورة القطعة' : 'Part Image'}
                                        </div>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={selectedRequest.imageUrl} alt="part" className="w-full rounded-lg max-h-48 object-contain" />
                                    </div>
                                )}

                                {/* تاريخ الطلب */}
                                <div className="text-[10px] text-white/25 text-center pt-2">
                                    {formatDate(selectedRequest.createdAt)}
                                </div>

                                {/* تغيير الحالة */}
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30 mb-2">
                                        {isRTL ? 'تحديث الحالة' : 'Update Status'}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG['new']][]).map(([key, cfg]) => {
                                            const Icon = cfg.icon;
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => handleStatusChange(selectedRequest._id, key)}
                                                    disabled={updatingId === selectedRequest._id || selectedRequest.status === key}
                                                    className={cn(
                                                        'py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center justify-center gap-1.5 transition-all',
                                                        selectedRequest.status === key
                                                            ? cn(cfg.bg, cfg.color, 'opacity-100')
                                                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 disabled:opacity-50'
                                                    )}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {isRTL ? cfg.label : cfg.labelEn}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* حذف */}
                                <button
                                    onClick={() => { handleDelete(selectedRequest._id); setSelectedRequest(null); }}
                                    className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {isRTL ? 'حذف هذا الطلب' : 'Delete This Request'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
