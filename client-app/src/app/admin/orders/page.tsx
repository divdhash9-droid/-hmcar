'use client';

/**
 * Fulfillment Control Center - Unified Orders & Special Requests
 * مركـز التنفيـذ والمتابعـة - الطلبـات والطلبـات الخاصـة الموحـدة
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback, Suspense } from 'react';
import {
    X, ShoppingCart, Clock, CheckCircle, Package, 
    MessageCircle, Car as CarIcon, User, Briefcase, Settings, Phone, Calendar,
    XCircle, Loader, RefreshCw, Globe
} from 'lucide-react';

import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useSettings } from '@/lib/SettingsContext';
import { formatAmountWithSnapshot, getOrderGrandTotalSar } from '@/lib/orderCurrency';
import AdminPageShell from '@/components/AdminPageShell';

// Constants
const TAB_ORDERS = 'orders';
const TAB_SPECIAL = 'special';

const FILTER_ALL = 'all';

// Direct Orders Specific Constants
const ORDER_STATUS_PENDING = 'pending';
const ORDER_STATUS_CONFIRMED = 'confirmed';
const ORDER_STATUS_PROCESSING = 'processing';
const ORDER_STATUS_SHIPPED_SEA = 'shipped_sea';
const ORDER_STATUS_CUSTOMS_CLEARANCE = 'customs_clearance';
const ORDER_STATUS_ARRIVED = 'arrived';
const ORDER_STATUS_COMPLETED = 'completed';
const ORDER_STATUS_CANCELLED = 'cancelled';
const CHANNEL_WHATSAPP = 'whatsapp';

// Special Requests Specific Constants
const SPECIAL_TYPE_CAR = 'car';
const SPECIAL_STATUS_NEW = 'new';
const SPECIAL_STATUS_IN_PROGRESS = 'in_progress';
const SPECIAL_STATUS_COMPLETED = 'completed';
const SPECIAL_STATUS_CANCELLED = 'cancelled';

const CLASS_TEXT_AMBER_400 = 'text-amber-400';
const CLASS_TEXT_BLUE_400 = 'text-blue-400';
const CLASS_TEXT_GREEN_400 = 'text-green-400';
const CLASS_TEXT_RED_400 = 'text-red-400';

// Interfaces
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

const SPECIAL_STATUS_CONFIG: Record<string, { label: string; labelEn: string; color: string; bg: string; icon: any }> = {
    new: { label: 'جديد', labelEn: 'New', color: CLASS_TEXT_AMBER_400, bg: 'bg-amber-500/10 border-amber-500/30', icon: Clock },
    in_progress: { label: 'موافقة', labelEn: 'Approved', color: CLASS_TEXT_BLUE_400, bg: 'bg-blue-500/10 border-blue-500/30', icon: Loader },
    completed: { label: 'مكتمل', labelEn: 'Completed', color: CLASS_TEXT_GREEN_400, bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle },
    cancelled: { label: 'رفض', labelEn: 'Rejected', color: CLASS_TEXT_RED_400, bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
};

function AdminFulfillmentContent() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const { displayCurrency, currency } = useSettings();
    const searchParams = useSearchParams();
    
    // Tab switching logic via query params
    const tabParam = searchParams?.get('tab');
    const [activeTab, setActiveTab] = useState<string>(tabParam === TAB_SPECIAL ? TAB_SPECIAL : TAB_ORDERS);
    
    useEffect(() => {
        if (tabParam && [TAB_ORDERS, TAB_SPECIAL].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);
    
    // Orders State
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersFilter, setOrdersFilter] = useState(FILTER_ALL);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderUpdatingId, setOrderUpdatingId] = useState<string | null>(null);
    const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 });

    // Special Requests State
    const [requests, setRequests] = useState<ConciergeRequest[]>([]);
    const [specialLoading, setSpecialLoading] = useState(true);
    const [specialFilter, setSpecialFilter] = useState(FILTER_ALL);
    const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);
    const [specialUpdatingId, setSpecialUpdatingId] = useState<string | null>(null);
    const [specialStats, setSpecialStats] = useState({ total: 0, new: 0, in_progress: 0, completed: 0, cancelled: 0 });
    const [auctionDateInput, setAuctionDateInput] = useState<string>(''); // [[ARABIC_COMMENT]] حقل إدخال موعد المزاد

    // ── Load Orders ──────────────────────────────────────────────
    const loadOrders = useCallback(async () => {
        setOrdersLoading(true);
        try {
            const params: Record<string, string> = {};
            if (ordersFilter !== FILTER_ALL) params.status = ordersFilter;
            const res = await api.orders.list(params);
            if (res?.success && res?.data?.orders) {
                const list = res.data.orders.map((o: any) => ({
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
                
                const s = { total: list.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 };
                list.forEach((o: Order) => {
                    if (o.status === ORDER_STATUS_PENDING) s.pending++;
                    if (o.status === ORDER_STATUS_CONFIRMED) s.confirmed++;
                    if (o.status === ORDER_STATUS_COMPLETED) s.completed++;
                    if (o.status === ORDER_STATUS_CANCELLED) s.cancelled++;
                    if (o.status !== ORDER_STATUS_CANCELLED) s.revenue += o.pricing.grandTotalSar || 0;
                });
                setOrderStats(s);
            }
        } catch (err) {
            console.error('Failed to load orders', err);
        } finally {
            setOrdersLoading(false);
        }
    }, [ordersFilter]);

    // ── Load Special Requests ────────────────────────────────────
    const loadRequests = useCallback(async () => {
        setSpecialLoading(true);
        try {
            const params: Record<string, string> = {};
            if (specialFilter !== FILTER_ALL) params.status = specialFilter;
            const res = await api.concierge.list(params);
            if (res?.success && res?.data?.requests) {
                const list: ConciergeRequest[] = res.data.requests;
                setRequests(list);
                setSpecialStats({
                    total: res.data.total || list.length,
                    new: list.filter(r => r.status === SPECIAL_STATUS_NEW).length,
                    in_progress: list.filter(r => r.status === SPECIAL_STATUS_IN_PROGRESS).length,
                    completed: list.filter(r => r.status === SPECIAL_STATUS_COMPLETED).length,
                    cancelled: list.filter(r => r.status === SPECIAL_STATUS_CANCELLED).length,
                });
            }
        } catch (err) {
            console.error('Failed to load concierge requests', err);
        } finally {
            setSpecialLoading(false);
        }
    }, [specialFilter]);

    useEffect(() => {
        if (activeTab === TAB_ORDERS) loadOrders();
        else loadRequests();
    }, [activeTab, loadOrders, loadRequests]);

    // ── Actions: Orders ──
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setOrderUpdatingId(orderId);
        try {
            await api.orders.updateStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
            showToast(isRTL ? 'تم تحديث حالة الطلب' : 'Order status updated', 'success');
        } catch {
            showToast(isRTL ? 'فشل التحديث' : 'Update failed', 'error');
        } finally {
            setOrderUpdatingId(null);
        }
    };

    const deleteOrder = async (orderId: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
        try {
            await api.orders.delete(orderId);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (selectedOrder?.id === orderId) setSelectedOrder(null);
            showToast(isRTL ? 'تم الحذف' : 'Deleted', 'success');
        } catch {
            showToast(isRTL ? 'فشل الحذف' : 'Delete failed', 'error');
        }
    };

    // ── Actions: Special Requests ──
    const handleSpecialStatusChange = async (id: string, status: string) => {
        setSpecialUpdatingId(id);
        try {
            await api.concierge.updateStatus(id, status, { auctionDate: auctionDateInput || undefined });
            showToast(isRTL ? '✅ تم تحديث الحالة' : '✅ Status updated', 'success');
            await loadRequests();
            if (selectedRequest?._id === id) {
                setSelectedRequest(prev => prev ? { ...prev, status: status as ConciergeRequest['status'] } : prev);
            }
            setAuctionDateInput(''); // Reset after use
        } catch {
            showToast(isRTL ? 'فشل التحديث' : 'Update failed', 'error');
        } finally {
            setSpecialUpdatingId(null);
        }
    };

    const deleteSpecialRequest = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) return;
        try {
            await api.concierge.delete(id);
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
            if (selectedRequest?._id === id) setSelectedRequest(null);
            await loadRequests();
        } catch {
            showToast(isRTL ? 'فشل الحذف' : 'Delete failed', 'error');
        }
    };

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
        const path = `/admin/messages?clientName=${encodeURIComponent(req.name)}&clientPhone=${encodeURIComponent(String(req.phone || ''))}`;
        window.location.href = path;
    };

    // Helpers
    const getOrderStatusBadge = (s: string) => {
        switch (s) {
            case ORDER_STATUS_PENDING: return 'ck-badge ck-badge-pending';
            case ORDER_STATUS_CONFIRMED: return 'ck-badge text-blue-400 bg-blue-500/10 border-blue-500/20';
            case ORDER_STATUS_PROCESSING: return 'ck-badge text-purple-400 bg-purple-500/10 border-purple-500/20';
            case ORDER_STATUS_SHIPPED_SEA: return 'ck-badge text-blue-500 bg-blue-500/10 border-blue-500/20';
            case ORDER_STATUS_CUSTOMS_CLEARANCE: return 'ck-badge text-orange-500 bg-orange-500/10 border-orange-500/20';
            case ORDER_STATUS_ARRIVED: return 'ck-badge text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
            case ORDER_STATUS_COMPLETED: return 'ck-badge ck-badge-active';
            case ORDER_STATUS_CANCELLED: return 'ck-badge ck-badge-danger';
            default: return 'ck-badge ck-badge-inactive';
        }
    };

    const getStatusLabel = (s: string, type: 'order' | 'special') => {
        if (type === 'order') {
            if (isRTL) return { 
                [ORDER_STATUS_PENDING]: 'انتظار',
                [ORDER_STATUS_CONFIRMED]: 'مؤكد',
                [ORDER_STATUS_PROCESSING]: 'تجهيز الشحن',
                [ORDER_STATUS_SHIPPED_SEA]: 'في البحر',
                [ORDER_STATUS_CUSTOMS_CLEARANCE]: 'تخليص جمركي',
                [ORDER_STATUS_ARRIVED]: 'جاهزة للاستلام',
                [ORDER_STATUS_COMPLETED]: 'مكتمل',
                [ORDER_STATUS_CANCELLED]: 'ملغي'
             }[s] || s;
            return s.toUpperCase().replace('_', ' ');
        } else {
            const cfg = SPECIAL_STATUS_CONFIG[s as keyof typeof SPECIAL_STATUS_CONFIG];
            return isRTL ? cfg?.label : cfg?.labelEn;
        }
    };

    const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });

    return (
        <div className="relative w-full">
            
            {/* Detail Modals for both types */}
            <AnimatePresence>
                {selectedOrder && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[205] flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-xl"
                        onClick={(e) => e.target === e.currentTarget && setSelectedOrder(null)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            className="ck-modal w-full max-w-2xl my-auto">
                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.3em] mb-1">{isRTL ? 'سجل الطلب' : 'ORDER LOG'}</p>
                                    <h2 className="cockpit-num text-2xl font-black text-orange-400">#{selectedOrder.orderNumber}</h2>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} title={isRTL ? "إغلاق" : "Close"} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                                    <X className="w-5 h-5 text-white/40" />
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="ck-card p-4">
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em]">{isRTL ? 'المشتري' : 'BUYER'}</p>
                                        <p className="text-sm font-bold">{selectedOrder.buyer.name}</p>
                                        <p className="cockpit-mono text-[10px] text-white/40">{selectedOrder.buyer.email}</p>
                                        <p className="cockpit-mono text-[10px] text-orange-400">{selectedOrder.buyer.phone}</p>
                                    </div>
                                    <div className="ck-card p-4">
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em]">{isRTL ? 'القناة' : 'CHANNEL'}</p>
                                        <div className="flex items-center gap-2 text-xs font-bold uppercase">
                                            {selectedOrder.channel === CHANNEL_WHATSAPP ? <MessageCircle size={14} className="text-green-400" /> : <ShoppingCart size={14} className="text-orange-400" />}
                                            {selectedOrder.channel}
                                        </div>
                                        <p className="cockpit-mono text-[10px] text-white/40">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="ck-card p-5 flex justify-between items-center border-orange-500/20 bg-orange-500/5">
                                    <div>
                                        <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em] mb-1">{isRTL ? 'المجموع النهائي' : 'GRAND TOTAL'}</p>
                                        <p className="cockpit-num text-3xl font-black text-white">{formatAmountWithSnapshot(getOrderGrandTotalSar(selectedOrder), displayCurrency, selectedOrder, currency)}</p>
                                    </div>
                                    <span className={cn(getOrderStatusBadge(selectedOrder.status), 'ck-badge-live')}>{getStatusLabel(selectedOrder.status, 'order')}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                     {([ORDER_STATUS_PENDING, ORDER_STATUS_CONFIRMED, ORDER_STATUS_PROCESSING, ORDER_STATUS_SHIPPED_SEA, ORDER_STATUS_CUSTOMS_CLEARANCE, ORDER_STATUS_ARRIVED, ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED] as const).map((s) => (
                                         <button key={s} onClick={() => updateOrderStatus(selectedOrder.id, s)} disabled={selectedOrder.status === s || orderUpdatingId === selectedOrder.id}
                                            title={isRTL ? "تعديل الحالة" : "Update Status"}
                                            className={cn('flex-1 min-w-[30%] py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all', selectedOrder.status === s ? getOrderStatusBadge(s) : 'ck-btn-ghost')}>
                                            {orderUpdatingId === selectedOrder.id ? '...' : getStatusLabel(s, 'order')}
                                         </button>
                                     ))}
                                </div>
                                <button onClick={() => deleteOrder(selectedOrder.id)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-red-500/20">🗑️ PURGE RECORD</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedRequest && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[205] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
                        onClick={() => setSelectedRequest(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-cinematic-dark border border-white/10 rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">{isRTL ? 'تفاصيل الطلب' : 'REQUEST DETAILS'}</div>
                                    <h2 className="text-xl font-black uppercase">{selectedRequest.type === SPECIAL_TYPE_CAR ? (isRTL ? 'طلب سيارة' : 'Car Request') : (isRTL ? 'طلب قطعة' : 'Parts Request')}</h2>
                                </div>
                                <button onClick={() => setSelectedRequest(null)} title={isRTL ? "إغلاق" : "Close"} className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-4">
                                <div className="ck-card p-4 space-y-2">
                                    <div className="flex items-center gap-3"><User size={14} className="text-white/30" /><span className="text-sm font-bold">{selectedRequest.name}</span></div>
                                    <div className="flex items-center gap-3"><Phone size={14} className="text-white/30" /><span className="text-sm text-orange-400">{selectedRequest.phone}</span></div>
                                </div>
                                <div className="ck-card p-4 space-y-1">
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{isRTL ? 'الطلب' : 'REQUEST'}</p>
                                    <p className="text-lg font-black text-white">{selectedRequest.type === SPECIAL_TYPE_CAR ? (selectedRequest.carName || 'CAR') : (selectedRequest.partName || 'PART')}</p>
                                    {selectedRequest.model && <p className="text-xs text-white/60">{selectedRequest.model}</p>}
                                    {selectedRequest.year && <p className="text-xs text-white/60">{selectedRequest.year}</p>}
                                </div>
                                {selectedRequest.description && (
                                    <div className="ck-card p-4">
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{isRTL ? 'الوصف' : 'DESCRIPTION'}</p>
                                        <p className="text-sm text-white/70 leading-relaxed">{selectedRequest.description}</p>
                                    </div>
                                )}

                                {/* [[ARABIC_COMMENT]] حقل إدخال موعد المزاد للأدمن */}
                                <div className="ck-card p-4 space-y-2 border-cinematic-neon-blue/20 bg-cinematic-neon-blue/5">
                                    <label className="text-[10px] font-black uppercase text-cinematic-neon-blue/70 tracking-widest flex items-center gap-2">
                                        <Calendar size={12} />
                                        {isRTL ? 'تحديد موعد المزاد (اختياري)' : 'SET AUCTION DATE (OPTIONAL)'}
                                    </label>
                                    <input 
                                        id="auction-date-input"
                                        placeholder={isRTL ? 'اختر التاريخ والوقت' : 'Select date and time'}
                                        type="datetime-local"
                                        value={auctionDateInput}
                                        onChange={(e) => setAuctionDateInput(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-cinematic-neon-blue outline-none transition-all"
                                    />
                                    <p className="text-[9px] text-white/30 italic">
                                        {isRTL ? '* سيصل الموعد للعميل في الإشعار عند الضغط على "موافقة"' : '* Client will receive this in the notification when clicking "Approved"'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(SPECIAL_STATUS_CONFIG) as [string, any][]).map(([key, cfg]) => (
                                        <button key={key} onClick={() => handleSpecialStatusChange(selectedRequest._id, key)} disabled={specialUpdatingId === selectedRequest._id || selectedRequest.status === key}
                                            title={isRTL ? "تحديث الحالة" : "Update Status"}
                                            className={cn('py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all', selectedRequest.status === key ? cn(cfg.bg, cfg.color) : 'bg-white/5 border-white/10 text-white/30')}>
                                            {isRTL ? cfg.label : cfg.labelEn}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => deleteSpecialRequest(selectedRequest._id)} className="w-full py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all">🗑️ DELETE REQUEST</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AdminPageShell
                title={isRTL ? 'المتابعة والطلبـات' : 'FULFILLMENT HUB'}
                titleEn="OPERATIONS CENTER"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={() => activeTab === TAB_ORDERS ? loadOrders() : loadRequests()} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-orange-400" title={isRTL ? "تحديث" : "Refresh"}>
                        <RefreshCw className={cn('w-5 h-5', (ordersLoading || specialLoading) && 'animate-spin')} />
                    </button>
                }
            >
                {/* ── Hub Tabs ── */}
                <div className="flex lg:inline-flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-8 w-full lg:w-auto">
                    <button onClick={() => setActiveTab(TAB_ORDERS)}
                        className={cn('flex-1 lg:px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeTab === TAB_ORDERS ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <ShoppingCart size={16} />
                        {isRTL ? 'الطلبات المباشرة' : 'DIRECT ORDERS'}
                        <span className="ck-badge-mini bg-black/20">{orderStats.total}</span>
                    </button>
                    <button onClick={() => setActiveTab(TAB_SPECIAL)}
                        className={cn('flex-1 lg:px-10 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeTab === TAB_SPECIAL ? 'bg-cinematic-neon-red text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <Briefcase size={16} />
                        {isRTL ? 'الطلبات الخاصة' : 'SPECIAL REQUESTS'}
                        <span className="ck-badge-mini bg-black/20">{specialStats.total}</span>
                    </button>
                </div>

                {/* ── Content View ── */}
                {activeTab === TAB_ORDERS ? (
                    <div className="space-y-8">
                        {/* Orders Stats HUD */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                             {[
                                { label: isRTL ? 'الكل' : 'TOTAL', val: orderStats.total, color: 'text-white' },
                                { label: isRTL ? 'انتظار' : 'QUEUE', val: orderStats.pending, color: 'text-amber-400' },
                                { label: isRTL ? 'مؤكد' : 'ACTIVE', val: orderStats.confirmed, color: 'text-blue-400' },
                                { label: isRTL ? 'مكتمل' : 'DONE', val: orderStats.completed, color: 'text-green-400' },
                                { label: isRTL ? 'إيرادات' : 'REVENUE', val: orderStats.revenue.toLocaleString(), color: 'text-orange-400' }
                            ].map((s, idx) => (
                                <div key={idx} className="ck-card p-4 flex flex-col items-center">
                                    <span className={cn('text-xl font-black cockpit-num mb-1', s.color)}>{s.val}</span>
                                    <span className="cockpit-mono text-[8px] text-white/20 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            {([FILTER_ALL, ORDER_STATUS_PENDING, ORDER_STATUS_CONFIRMED, ORDER_STATUS_COMPLETED] as const).map((f) => (
                                <button key={f} onClick={() => setOrdersFilter(f)} className={cn('ck-tab', ordersFilter === f && 'ck-tab-active')}>
                                    {f === FILTER_ALL ? (isRTL ? 'الكل' : 'ALL') : getStatusLabel(f, 'order')}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        {ordersLoading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1,2,3,4].map((n) => <div key={n} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
                             </div>
                        ) : orders.length === 0 ? (
                            <div className="ck-empty h-64 border-white/5">
                                <Package size={32} className="text-white/10 mb-4" />
                                <p className="cockpit-mono text-[9px] text-white/20 uppercase tracking-[0.2em]">{isRTL ? 'لا توجد طلبات' : 'NO ORDERS FOUND'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {orders.map((order: Order, idx: number) => (
                                    <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                        className="ck-card group hover:border-orange-500/30">
                                        <div className="p-5">
                                            <div className="flex items-center justify-between mb-4">
                                                 <div>
                                                     <p className="cockpit-mono text-[8.5px] text-white/25 uppercase tracking-widest mb-0.5">{formatDate(order.createdAt)}</p>
                                                     <h3 className="cockpit-num text-lg font-black group-hover:text-orange-400 transition-colors">#{order.orderNumber}</h3>
                                                 </div>
                                                 <span className={cn(getOrderStatusBadge(order.status), 'ck-badge-live')}>{getStatusLabel(order.status, 'order')}</span>
                                            </div>
                                            <div className="space-y-3 mb-6">
                                                <div className="flex items-center gap-3"><User size={14} className="text-white/20" /><span className="text-xs font-bold text-white/80">{order.buyer.name}</span></div>
                                                <div className="flex items-center gap-3"><CarIcon size={14} className="text-white/20" /><span className="text-[11px] text-white/60 truncate">{order.items[0]?.titleSnapshot || 'Request'}</span></div>
                                            </div>
                                            <div className="flex gap-2 pt-4 border-t border-white/5">
                                                <button onClick={() => setSelectedOrder(order)} className="flex-1 ck-btn-ghost py-2 text-[10px] font-black uppercase tracking-widest">VIEW OPS</button>
                                                <button onClick={() => window.open(`https://wa.me/${order.buyer.phone?.replace(/\D/g, '')}`, '_blank')} title={isRTL ? "تواصل واتساب" : "WhatsApp"} className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                                    <MessageCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Special Requests Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { label: isRTL ? 'الكل' : 'TOTAL', val: specialStats.total, color: 'text-white' },
                                { label: isRTL ? 'جديد' : 'NEW', val: specialStats.new, color: 'text-amber-400' },
                                { label: isRTL ? 'تنفيذ' : 'PROC', val: specialStats.in_progress, color: 'text-blue-400' },
                                { label: isRTL ? 'مكتمل' : 'DONE', val: specialStats.completed, color: 'text-green-400' },
                                { label: isRTL ? 'ملغي' : 'FAIL', val: specialStats.cancelled, color: 'text-red-400' }
                            ].map((s, idx) => (
                                <div key={idx} className="ck-card p-4 flex flex-col items-center">
                                    <span className={cn('text-xl font-black cockpit-num mb-1', s.color)}>{s.val}</span>
                                    <span className="cockpit-mono text-[8px] text-white/20 uppercase tracking-widest">{s.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Special Requests Filters */}
                        <div className="flex gap-2">
                             {([FILTER_ALL, SPECIAL_STATUS_NEW, SPECIAL_STATUS_IN_PROGRESS, SPECIAL_STATUS_COMPLETED] as const).map((f) => (
                                <button key={f} onClick={() => setSpecialFilter(f)} className={cn('ck-tab', specialFilter === f && 'ck-tab-active')}>
                                    {f === FILTER_ALL ? (isRTL ? 'الكل' : 'ALL') : getStatusLabel(f, 'special')}
                                </button>
                             ))}
                        </div>

                        {/* List */}
                        {specialLoading ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1,2,3,4,5,6].map((n) => <div key={n} className="h-56 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
                             </div>
                        ) : requests.length === 0 ? (
                            <div className="ck-empty h-64 border-white/5">
                                <Briefcase size={32} className="text-white/10 mb-4" />
                                <p className="cockpit-mono text-[9px] text-white/20 uppercase tracking-[0.2em]">{isRTL ? 'لا توجد طلبات خاصة' : 'NO SPECIAL PROTOCOLS'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {requests.map((req: ConciergeRequest, idx: number) => {
                                    const cfg = SPECIAL_STATUS_CONFIG[req.status];
                                    const StatusIcon = cfg?.icon || Clock;
                                    return (
                                        <motion.div key={req._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }}
                                            className="ck-card group hover:border-cinematic-neon-red/30">
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', req.type === SPECIAL_TYPE_CAR ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400')}>
                                                            {req.type === SPECIAL_TYPE_CAR ? <CarIcon size={18} /> : <Settings size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-black uppercase text-white/30 tracking-widest">{req.type === SPECIAL_TYPE_CAR ? (isRTL ? 'سيارة' : 'CAR') : (isRTL ? 'قطعة' : 'PART')}</div>
                                                            <div className="text-sm font-black truncate max-w-[120px]">{req.name}</div>
                                                        </div>
                                                    </div>
                                                    <span className={cn('px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1', cfg?.bg, cfg?.color)}>
                                                        <StatusIcon size={12} />
                                                        {isRTL ? cfg?.label : cfg?.labelEn}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 mb-6">
                                                    <p className="text-sm font-black text-white/80">{req.carName || req.partName || 'SPECIAL REQ'}</p>
                                                    <div className="flex items-center gap-2 text-[10px] text-white/40"><Phone size={12} />{req.phone}</div>
                                                    <div className="flex items-center gap-2 text-[10px] text-white/40"><Calendar size={12} />{formatDate(req.createdAt)}</div>
                                                </div>
                                                <div className="flex gap-2 pt-4 border-t border-white/5">
                                                    <button onClick={() => setSelectedRequest(req)} className="flex-1 ck-btn-ghost py-2 text-[10px] font-black uppercase tracking-widest">DETAILS</button>
                                                    <button onClick={() => openRequestWhatsApp(req)} title={isRTL ? "تواصل واتساب" : "WhatsApp"} className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all">
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button onClick={() => openRequestChat(req)} title={isRTL ? "فتح الشات" : "Chat"} className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all">
                                                        <Globe size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </AdminPageShell>
        </div>
    );
}

export default function AdminFulfillmentHub() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <AdminFulfillmentContent />
        </Suspense>
    );
}
