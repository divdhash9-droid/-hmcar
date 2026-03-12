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

const FILTER_ALL = 'all';
const TYPE_CAR = 'car';
const TYPE_PARTS = 'parts';
const STATUS_NEW = 'new';
const STATUS_IN_PROGRESS = 'in_progress';
const STATUS_COMPLETED = 'completed';
const STATUS_CANCELLED = 'cancelled';
const SOURCE_KOREAN_SHOWROOM = 'korean_showroom';
const SOURCE_GENERAL = 'general';
const CLASS_TEXT_WHITE = 'text-white';
const CLASS_TEXT_AMBER_400 = 'text-amber-400';
const CLASS_TEXT_BLUE_400 = 'text-blue-400';
const CLASS_TEXT_GREEN_400 = 'text-green-400';
const CLASS_TEXT_RED_400 = 'text-red-400';
const rawText = (value: string) => value;

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
    source?: 'general' | 'korean_showroom';
    externalUrl?: string;
    contactPreference?: 'whatsapp' | 'chat' | 'either';
    status: 'new' | 'in_progress' | 'completed' | 'cancelled';
    adminNotes?: string;
    createdAt: string;
}

const STATUS_CONFIG = {
    new: { label: rawText('جديد'), labelEn: rawText('New'), color: CLASS_TEXT_AMBER_400, bg: 'bg-amber-500/10 border-amber-500/30', icon: Clock },
    in_progress: { label: rawText('قيد المعالجة'), labelEn: rawText('In Progress'), color: CLASS_TEXT_BLUE_400, bg: 'bg-blue-500/10 border-blue-500/30', icon: Loader },
    completed: { label: rawText('مكتمل'), labelEn: rawText('Completed'), color: CLASS_TEXT_GREEN_400, bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle },
    cancelled: { label: rawText('ملغي'), labelEn: rawText('Cancelled'), color: CLASS_TEXT_RED_400, bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
};

function getContactPreferenceLabel(pref: 'whatsapp' | 'chat' | 'either' | undefined, isRTL: boolean) {
    if (!pref) return isRTL ? rawText('غير محدد') : rawText('Not specified');
    if (pref === 'whatsapp') return isRTL ? rawText('واتساب') : rawText('WhatsApp');
    if (pref === 'chat') return isRTL ? rawText('شات') : rawText('Chat');
    return isRTL ? rawText('الاثنين') : rawText('Either');
}

export default function AdminConcierge() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const [requests, setRequests] = useState<ConciergeRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'car' | 'parts'>(FILTER_ALL);
    const [filterSource, setFilterSource] = useState<'all' | 'korean_showroom' | 'general'>(FILTER_ALL);
    const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'in_progress' | 'completed' | 'cancelled'>(FILTER_ALL);
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
            if (filterType !== FILTER_ALL) params.type = filterType;
            if (filterSource !== FILTER_ALL) params.source = filterSource;
            if (filterStatus !== FILTER_ALL) params.status = filterStatus;
            const [res, statsRes] = await Promise.all([
                api.concierge.list(params),
                api.concierge.stats(),
            ]);
            if (res?.success) {
                const data: ConciergeRequest[] = res.data.requests || [];
                setRequests(data);
                setStats({
                    total: res.data.total || data.length,
                    new: data.filter(r => r.status === STATUS_NEW).length,
                    in_progress: data.filter(r => r.status === STATUS_IN_PROGRESS).length,
                    completed: data.filter(r => r.status === STATUS_COMPLETED).length,
                    cancelled: data.filter(r => r.status === STATUS_CANCELLED).length,
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
    }, [filterType, filterSource, filterStatus, isRTL, showToast]);

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

    const openRequestWhatsApp = (req: ConciergeRequest) => {
        const clean = String(req.phone || '').replace(/[^0-9]/g, '');
        if (!clean) return;
        const text = [
            `مرحباً ${req.name}`,
            'تم استلام طلبك من HM CAR.',
            req.type === 'car' ? `السيارة المطلوبة: ${req.carName || ''} ${req.model || ''}` : `القطعة المطلوبة: ${req.partName || ''}`,
            'يسعدنا خدمتك والمتابعة معك.'
        ].join('\n');
        window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const openRequestChat = (req: ConciergeRequest) => {
        window.open(`/messages?clientName=${encodeURIComponent(req.name)}&clientPhone=${encodeURIComponent(req.phone)}`, '_blank');
    };

    return (
        <div className={cn('min-h-screen bg-black text-white', isRTL && 'font-arabic')} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-500/8 via-black to-black" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] bg-size-[80px_80px]" />
            </div>

            <div className="relative z-10 p-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                    <Link href="/admin/dashboard" className="flex items-center gap-2 text-white/40 hover:text-amber-400 transition-colors group">
                        <ArrowLeft className={cn('w-5 h-5 group-hover:-translate-x-1 transition-transform', isRTL && 'rotate-180')} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-0.5 w-8 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,1)]" />
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-amber-500">
                                {isRTL ? rawText('لوحة الأدمن') : rawText('Admin Panel')}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                            {isRTL ? rawText('الطلبات الخاصة') : rawText('SPECIAL REQUESTS')}
                        </h1>
                    </div>
                    <button
                        onClick={loadRequests}
                        className="mr-auto ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all"
                        title={isRTL ? 'تحديث' : 'Refresh'}
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                        {isRTL ? rawText('تحديث') : rawText('Refresh')}
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                    {[
                        { label: isRTL ? rawText('الكل') : rawText('All'), value: stats.total, color: CLASS_TEXT_WHITE, key: FILTER_ALL },
                        { label: isRTL ? rawText('جديد') : rawText('New'), value: stats.new, color: CLASS_TEXT_AMBER_400, key: STATUS_NEW },
                        { label: isRTL ? rawText('قيد المعالجة') : rawText('In Progress'), value: stats.in_progress, color: CLASS_TEXT_BLUE_400, key: STATUS_IN_PROGRESS },
                        { label: isRTL ? rawText('مكتمل') : rawText('Completed'), value: stats.completed, color: CLASS_TEXT_GREEN_400, key: STATUS_COMPLETED },
                        { label: isRTL ? rawText('ملغي') : rawText('Cancelled'), value: stats.cancelled, color: CLASS_TEXT_RED_400, key: STATUS_CANCELLED },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setFilterStatus(s.key as typeof filterStatus)}
                            className={cn(
                                'p-4 rounded-2xl text-center border transition-all',
                                filterStatus === s.key
                                    ? 'bg-amber-500/10 border-amber-500/40'
                                    : 'bg-white/2 border-white/5 hover:border-white/10'
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
                        <div className="bg-white/2 border border-white/8 rounded-2xl p-5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-4">
                                {isRTL ? rawText('توزيع الطلبات حسب النوع') : rawText('Requests By Type')}
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="flex-1">
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="flex items-center gap-1.5 text-blue-400">
                                            <Car className="w-3 h-3" />
                                            {isRTL ? rawText('سيارات') : rawText('Cars')}
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
                                            {isRTL ? rawText('قطع غيار') : rawText('Parts')}
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
                        <div className="bg-white/2 border border-white/8 rounded-2xl p-5">
                            <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">
                                {isRTL ? rawText('أحدث الطلبات') : rawText('Latest Requests')}
                            </div>
                            <div className="space-y-2">
                                {(detailedStats.recent || []).slice(0, 4).map(r => (
                                    <div key={r._id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={cn(
                                                'w-5 h-5 rounded-md shrink-0 flex items-center justify-center',
                                                r.type === TYPE_CAR ? 'bg-blue-500/15 text-blue-400' : 'bg-orange-500/15 text-orange-400'
                                            )}>
                                                {r.type === TYPE_CAR ? <Car className="w-3 h-3" /> : <Settings className="w-3 h-3" />}
                                            </div>
                                            <span className="text-xs text-white/60 truncate font-medium">{r.name}</span>
                                        </div>
                                        <span className={cn(
                                            'text-[9px] font-black uppercase px-2 py-0.5 rounded-md border shrink-0',
                                            STATUS_CONFIG[r.status]?.bg,
                                            STATUS_CONFIG[r.status]?.color
                                        )}>
                                            {isRTL ? STATUS_CONFIG[r.status]?.label : STATUS_CONFIG[r.status]?.labelEn}
                                        </span>
                                    </div>
                                ))}
                                {(!detailedStats.recent || detailedStats.recent.length === 0) && (
                                    <p className="text-xs text-white/20 text-center py-2">{isRTL ? rawText('لا توجد طلبات') : rawText('No requests yet')}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-white/30" />
                        <span className="text-xs text-white/40 font-bold uppercase">{isRTL ? rawText('نوع الطلب:') : rawText('Type:')}</span>
                    </div>
                    {[
                        { id: FILTER_ALL, label: isRTL ? rawText('الكل') : rawText('All') },
                        { id: TYPE_CAR, label: isRTL ? rawText('طلبات سيارات') : rawText('Car Requests'), icon: Car },
                        { id: TYPE_PARTS, label: isRTL ? rawText('طلبات قطع') : rawText('Parts Requests'), icon: Settings },
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

                    <div className="w-px h-8 bg-white/10 mx-1" />

                    {[ 
                        { id: FILTER_ALL, label: isRTL ? rawText('كل المصادر') : rawText('All Sources') },
                        { id: SOURCE_KOREAN_SHOWROOM, label: isRTL ? rawText('المعرض الكوري') : rawText('Korean Showroom') },
                        { id: SOURCE_GENERAL, label: isRTL ? rawText('عامة') : rawText('General') },
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilterSource(f.id as typeof filterSource)}
                            className={cn(
                                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border',
                                filterSource === f.id
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Requests Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="h-48 rounded-2xl bg-white/2 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-32">
                        <Briefcase className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <p className="text-xl font-black text-white/20 uppercase tracking-widest">
                            {isRTL ? rawText('لا توجد طلبات') : rawText('NO REQUESTS')}
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
                                        className="bg-white/2 border border-white/8 rounded-2xl p-5 hover:border-amber-500/20 transition-all group"
                                    >
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    'w-10 h-10 rounded-xl flex items-center justify-center border',
                                                    req.type === TYPE_CAR
                                                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                                                        : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                )}>
                                                    {req.type === TYPE_CAR ? <Car className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-white/30">
                                                        {req.type === TYPE_CAR ? (isRTL ? rawText('طلب سيارة') : rawText('CAR REQUEST')) : (isRTL ? rawText('طلب قطعة') : rawText('PARTS REQUEST'))}
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
                                            {req.type === TYPE_CAR && req.carName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Car className="w-3.5 h-3.5 text-white/25" />
                                                    {req.carName} {req.model && `· ${req.model}`}
                                                </div>
                                            )}
                                            {req.type === TYPE_PARTS && req.partName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Settings className="w-3.5 h-3.5 text-white/25" />
                                                    {req.partName}
                                                </div>
                                            )}
                                            {req.colorName && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" style={{ background: req.color }} />
                                                    {req.colorName}
                                                </div>
                                            )}
                                            {req.year && (
                                                <div className="flex items-center gap-2 text-xs text-white/50">
                                                    <Calendar className="w-3.5 h-3.5 text-white/25" />
                                                    {req.year}
                                                </div>
                                            )}
                                            {req.source === SOURCE_KOREAN_SHOWROOM && (
                                                <div className="flex items-center gap-2 text-xs text-blue-400">
                                                    <Car className="w-3.5 h-3.5" />
                                                    {isRTL ? rawText('طلب من المعرض الكوري') : rawText('Korean showroom request')}
                                                </div>
                                            )}
                                            {req.contactPreference && (
                                                <div className="text-[10px] text-white/40">
                                                    {isRTL ? rawText('التواصل المفضل:') : rawText('Preferred contact:')} {getContactPreferenceLabel(req.contactPreference, isRTL)}
                                                </div>
                                            )}
                                            {req.externalUrl && (
                                                <a
                                                    href={req.externalUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-400 hover:underline inline-block"
                                                >
                                                    {isRTL ? rawText('رابط الإعلان الأصلي') : rawText('Original listing link')}
                                                </a>
                                            )}
                                            {req.description && (
                                                <div className="flex items-start gap-2 text-xs text-white/40 line-clamp-2">
                                                    <FileText className="w-3.5 h-3.5 text-white/25 shrink-0 mt-0.5" />
                                                    {req.description}
                                                </div>
                                            )}
                                        </div>

                                        {/* Date */}
                                        <div className="text-[10px] text-white/25 mb-4">{formatDate(req.createdAt)}</div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => openRequestWhatsApp(req)}
                                                className="py-2 px-3 bg-green-500/10 border border-green-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-500/20 transition-all"
                                                title={isRTL ? 'تواصل واتساب' : 'WhatsApp'}
                                            >
                                                {isRTL ? rawText('واتساب') : rawText('WhatsApp')}
                                            </button>
                                            <button
                                                onClick={() => openRequestChat(req)}
                                                className="py-2 px-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-500/20 transition-all"
                                                title={isRTL ? 'فتح الشات' : 'Open Chat'}
                                            >
                                                {isRTL ? rawText('شات') : rawText('Chat')}
                                            </button>
                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                                                title={isRTL ? 'عرض التفاصيل' : 'View Details'}
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                {isRTL ? rawText('تفاصيل') : rawText('Details')}
                                            </button>
                                            {/* تغيير الحالة السريع */}
                                            <select
                                                value={req.status}
                                                onChange={e => handleStatusChange(req._id, e.target.value)}
                                                title={isRTL ? 'تغيير الحالة' : 'Change Status'}
                                                disabled={updatingId === req._id}
                                                className="flex-1 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-[10px] font-black cursor-pointer appearance-none text-center focus:outline-none hover:bg-amber-500/20 transition-all disabled:opacity-50"
                                            >
                                                <option value={STATUS_NEW} className="bg-black">{rawText('جديد')}</option>
                                                <option value={STATUS_IN_PROGRESS} className="bg-black">{rawText('قيد المعالجة')}</option>
                                                <option value={STATUS_COMPLETED} className="bg-black">{rawText('مكتمل')}</option>
                                                <option value={STATUS_CANCELLED} className="bg-black">{rawText('ملغي')}</option>
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
                            className="bg-cinematic-dark border border-white/10 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                            dir={isRTL ? 'rtl' : 'ltr'}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                                        {isRTL ? rawText('تفاصيل الطلب') : rawText('Request Details')}
                                    </div>
                                    <h2 className="text-xl font-black uppercase">
                                        {selectedRequest.type === TYPE_CAR ? (isRTL ? rawText('طلب سيارة') : rawText('Car Request')) : (isRTL ? rawText('طلب قطعة غيار') : rawText('Parts Request'))}
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
                                    { icon: User, label: isRTL ? rawText('الاسم') : rawText('Name'), value: selectedRequest.name },
                                    { icon: Phone, label: isRTL ? rawText('الهاتف') : rawText('Phone'), value: selectedRequest.phone },
                                    ...(selectedRequest.type === TYPE_CAR ? [
                                        selectedRequest.carName && { icon: Car, label: isRTL ? rawText('اسم السيارة') : rawText('Car Name'), value: selectedRequest.carName },
                                        selectedRequest.model && { icon: Car, label: isRTL ? rawText('الموديل') : rawText('Model'), value: selectedRequest.model },
                                        selectedRequest.colorName && { icon: Palette, label: isRTL ? rawText('اللون') : rawText('Color'), value: selectedRequest.colorName, extra: selectedRequest.color },
                                        selectedRequest.year && { icon: Calendar, label: isRTL ? rawText('السنة') : rawText('Year'), value: selectedRequest.year },
                                    ] : [
                                        selectedRequest.partName && { icon: Settings, label: isRTL ? rawText('اسم القطعة') : rawText('Part Name'), value: selectedRequest.partName },
                                        selectedRequest.carName && { icon: Car, label: isRTL ? rawText('اسم السيارة') : rawText('Car Name'), value: selectedRequest.carName },
                                        selectedRequest.year && { icon: Calendar, label: isRTL ? rawText('السنة') : rawText('Year'), value: selectedRequest.year },
                                    ]).filter(Boolean),
                                    selectedRequest.description && { icon: FileText, label: isRTL ? rawText('الوصف') : rawText('Description'), value: selectedRequest.description },
                                    selectedRequest.externalUrl && { icon: Eye, label: isRTL ? rawText('الرابط الخارجي') : rawText('External Link'), value: selectedRequest.externalUrl },
                                    selectedRequest.contactPreference && { icon: Phone, label: isRTL ? rawText('التواصل المفضل') : rawText('Preferred Contact'), value: getContactPreferenceLabel(selectedRequest.contactPreference, isRTL) },
                                ].filter(Boolean).map((item: any, i) => item && (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/2 rounded-xl border border-white/5">
                                        <item.icon className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[9px] font-black uppercase tracking-wider text-white/30 mb-0.5">{item.label}</div>
                                            <div className="text-sm text-white/80 flex items-center gap-2 break-all">
                                                {item.extra && <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ background: item.extra }} />}
                                                {item.label === (isRTL ? rawText('الرابط الخارجي') : rawText('External Link')) ? (
                                                    <a href={item.value} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                                        {item.value}
                                                    </a>
                                                ) : item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* صورة القطعة */}
                                {selectedRequest.type === TYPE_PARTS && selectedRequest.imageUrl && (
                                    <div className="p-3 bg-white/2 rounded-xl border border-white/5">
                                        <div className="text-[9px] font-black uppercase tracking-wider text-white/30 mb-2 flex items-center gap-1.5">
                                            <ImageIcon className="w-3.5 h-3.5" />
                                            {isRTL ? rawText('صورة القطعة') : rawText('Part Image')}
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
                                        {isRTL ? rawText('تحديث الحالة') : rawText('Update Status')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[typeof STATUS_NEW]][]).map(([key, cfg]) => {
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
                                    {isRTL ? rawText('حذف هذا الطلب') : rawText('Delete This Request')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
