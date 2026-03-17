'use client';

import { motion, AnimatePresence } from "framer-motion";
import { 
    Plus, Clock, TrendingUp, Trash2, Edit2, Play, Square, ExternalLink, 
    Link as LinkIcon, Radio, Gavel, RefreshCw, X, 
    Activity, Info, Car
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";
import AdminPageShell from '@/components/AdminPageShell';

// ── Types ──
const MODE_LIVE = 'live';
const MODE_AUCTIONS = 'auctions';

function MarketHubContent() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    
    const [activeMode, setActiveMode] = useState(searchParams?.get('tab') === MODE_AUCTIONS ? MODE_AUCTIONS : MODE_LIVE);
    const [loading, setLoading] = useState(false);

    // ── Live Sessions State ──
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
    const [editingLiveId, setEditingLiveId] = useState<string | null>(null);
    const [liveForm, setLiveForm] = useState({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', cars: [] as any[] });

    // ── Classic Auctions State ──
    const [auctions, setAuctions] = useState<any[]>([]);
    const [cars, setCars] = useState<any[]>([]);
    const [activeArena, setActiveArena] = useState('LIVE');
    const [isAuctionModalOpen, setIsAuctionModalOpen] = useState(false);
    const [auctionForm, setAuctionForm] = useState({ carId: '', startPrice: '', startsAt: '', endsAt: '' });
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

    // ── Loaders ──
    const loadLiveSessions = async () => {
        setLoading(true);
        try {
            const res = await api.liveAuctions.list();
            if (res.success) setSessions(res.data);
        } catch { } finally { setLoading(false); }
    };

    const loadClassicAuctions = async () => {
        setLoading(true);
        try {
            let status = 'running';
            if (activeArena === 'SCHEDULED') status = 'scheduled';
            if (activeArena === 'SETTLED') status = 'ended';
            if (activeArena === 'AUDIT') status = 'all';

            const [aucRes, carRes] = await Promise.all([
                api.auctions.list({ status, limit: 50 }),
                api.cars.list({ status: 'active' })
            ]);
            if (aucRes.success) setAuctions(aucRes.data || []);
            if (carRes.success) setCars(carRes.data.cars || []);
        } catch { } finally { setLoading(false); }
    };

    useEffect(() => {
        if (activeMode === MODE_LIVE) loadLiveSessions();
        else loadClassicAuctions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeMode, activeArena]);

    // ── Actions: Live ──
    const handleStatusUpdate = async (id: string, action: 'start' | 'end') => {
        try {
            if (action === 'start') await api.liveAuctions.start(id);
            else await api.liveAuctions.end(id);
            loadLiveSessions();
            showToast(isRTL ? 'تم تحديث الحالة' : 'Status updated', 'success');
        } catch { }
    };

    const handleDeleteLive = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
        try {
            await api.liveAuctions.delete(id);
            loadLiveSessions();
            showToast(isRTL ? 'تم الحذف' : 'Deleted', 'success');
        } catch { }
    };

    // ── Actions: Auctions ──
    const handleLaunchAuction = async () => {
        const { carId, startPrice, startsAt, endsAt } = auctionForm;
        if (!carId || !startPrice || !startsAt || !endsAt) return showToast(isRTL ? 'أكمل البيانات' : 'Fill all fields', 'error');
        setLoading(true);
        try {
            const res = await api.auctions.create(auctionForm);
            if (res.success) {
                setIsAuctionModalOpen(false);
                setAuctionForm({ carId: '', startPrice: '', startsAt: '', endsAt: '' });
                loadClassicAuctions();
                showToast(isRTL ? '🚀 تم الإطلاق' : '🚀 Launched', 'success');
            }
        } catch { } finally { setLoading(false); }
    };

    const handleDeleteAuction = async (id: string) => {
        if (!confirm(isRTL ? 'متأكد؟' : 'Sure?')) return;
        try {
            await api.auctions.delete(id);
            loadClassicAuctions();
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
        } catch { }
    };

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <AdminPageShell
                title={isRTL ? 'مركز التجارة والمزادات' : 'MARKET HUB'}
                titleEn="TRADE & AUCTION CENTER"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button onClick={() => activeMode === MODE_LIVE ? loadLiveSessions() : loadClassicAuctions()} title={isRTL ? "تحديث" : "Refresh"} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-red-500">
                        <RefreshCw className={cn('w-5 h-5', loading && 'animate-spin')} />
                    </button>
                }
            >
                {/* Hub Tabs */}
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-10 w-full max-w-lg">
                    <button onClick={() => setActiveMode(MODE_LIVE)}
                        className={cn('flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeMode === MODE_LIVE ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <Radio size={16} />
                        {isRTL ? 'ساحة العرض الحي' : 'LIVE ARENA'}
                    </button>
                    <button onClick={() => setActiveMode(MODE_AUCTIONS)}
                        className={cn('flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3', 
                        activeMode === MODE_AUCTIONS ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'text-white/40 hover:text-white/60')}>
                        <Gavel size={16} />
                        {isRTL ? 'مزادات النظام' : 'SYSTEM AUCTIONS'}
                    </button>
                </div>

                {activeMode === MODE_LIVE ? (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                            <div>
                                <h3 className="text-xl font-black uppercase italic">{isRTL ? 'جلسات العرض الحي المباشر' : 'LIVE SHOWROOM SESSIONS'}</h3>
                                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{isRTL ? 'إدارة البث المباشر والمزادات الخارجية واليدوية' : 'Manage external feeds & manual streams'}</p>
                            </div>
                            <button onClick={() => { setLiveForm({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', cars: [] }); setEditingLiveId(null); setIsLiveModalOpen(true); }} className="px-6 py-3 bg-[#00f0ff] text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                                <Plus size={14} className="inline mr-2" /> {isRTL ? 'إنشاء جلسة' : 'INITIATE'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {sessions.map(s => (
                                <motion.div key={s._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ck-card p-6 flex flex-col md:flex-row items-center gap-6 group">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className={cn('px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider', s.status === 'live' ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-white/5 text-white/30 border border-white/10')}>
                                                {s.status === 'live' ? (isRTL ? 'مباشر الآن' : 'LIVE') : (isRTL ? 'متوقف' : 'ENDED')}
                                            </span>
                                            <h4 className="text-lg font-black uppercase italic tracking-tighter">{s.title}</h4>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] text-white/40 font-bold uppercase tracking-widest"><LinkIcon size={12} /> {s.externalUrl || (isRTL ? 'لا يوجد بث خارجي' : 'No External Feed')}</div>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full md:w-auto shrink-0">
                                        <button onClick={() => handleStatusUpdate(s._id, s.status === 'live' ? 'end' : 'start')} title={s.status === 'live' ? (isRTL ? 'إيقاف' : 'Stop') : (isRTL ? 'بدء' : 'Start')} className={cn('p-3 rounded-xl border flex flex-col items-center gap-1 transition-all', s.status === 'live' ? 'border-red-500/40 text-red-500 hover:bg-red-500/10' : 'border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/10')}>
                                            {s.status === 'live' ? <Square size={16} /> : <Play size={16} />}
                                            <span className="text-[7px] font-black">{s.status === 'live' ? (isRTL ? 'إيقاف' : 'STOP') : (isRTL ? 'تشغيل' : 'LIVE')}</span>
                                        </button>
                                        <button onClick={() => { setLiveForm(s); setEditingLiveId(s._id); setIsLiveModalOpen(true); }} title={isRTL ? 'تعديل' : 'Edit'} className="p-3 rounded-xl border border-white/5 text-white/40 hover:text-white hover:bg-white/5 flex flex-col items-center gap-1">
                                            <Edit2 size={16} />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'تعديل' : 'Edit'}</span>
                                        </button>
                                        <button onClick={() => handleDeleteLive(s._id)} title={isRTL ? 'حذف' : 'Delete'} className="p-3 rounded-xl border border-white/5 text-white/20 hover:text-red-500 hover:bg-red-500/10 flex flex-col items-center gap-1">
                                            <Trash2 size={16} />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'حذف' : 'Del'}</span>
                                        </button>
                                        <Link href={`/auctions/live/${s._id}`} target="_blank" title={isRTL ? 'عرض' : 'View'} className="p-3 rounded-xl border border-white/5 text-white/40 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 flex flex-col items-center gap-1">
                                            <ExternalLink size={16} />
                                            <span className="text-[7px] font-black uppercase">{isRTL ? 'عرض' : 'View'}</span>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                            {[
                                { id: 'LIVE', label: isRTL ? 'مباشرة الآن' : 'LIVE' },
                                { id: 'SCHEDULED', label: isRTL ? 'المجدولة' : 'SCHEDULED' },
                                { id: 'SETTLED', label: isRTL ? 'المنتهية' : 'SETTLED' },
                                { id: 'AUDIT', label: isRTL ? 'السجل الكامل' : 'AUDIT' }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveArena(tab.id)} className={cn('px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all', activeArena === tab.id ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white')}>{tab.label}</button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {auctions.map(auc => (
                                <motion.div key={auc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ck-card p-6 flex flex-col md:flex-row items-center gap-8 group">
                                    <div className="w-full md:w-36 h-24 rounded-xl overflow-hidden border border-white/5 shrink-0 relative">
                                        {(() => {
                                            const imageKey = String(auc.id || auc._id || auc.car?._id || 'auction');
                                            const imageSrc = typeof auc.car?.images?.[0] === 'string' ? auc.car.images[0].trim() : '';
                                            const showFallback = !imageSrc || imageErrors[imageKey];
                                            return showFallback ? (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 via-black/40 to-black/80">
                                                    <Car className="w-8 h-8 text-white/20" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={imageSrc}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                                    alt=""
                                                    onError={() => setImageErrors(prev => ({ ...prev, [imageKey]: true }))}
                                                />
                                            );
                                        })()}
                                        {auc.status === 'running' && <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(255,0,0,0.8)]" />}
                                    </div>
                                    <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-red-500/50 uppercase tracking-[0.2em] italic mb-0.5">{auc.car?.make || (isRTL ? 'مركبة' : 'Vehicle')}</p>
                                            <h4 className="text-md font-black italic uppercase truncate">{auc.car?.title || (isRTL ? 'سيارة غير معروفة' : 'Unknown Car')}</h4>
                                        </div>
                                        <div>
                                            <p className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest mb-1"><TrendingUp size={12} /> {isRTL ? 'أعلى مزايدة' : 'Live Bid'}</p>
                                            <p className="text-xl font-black italic text-red-500">{Number(auc.currentBid).toLocaleString()} <span className="text-[9px]">{auc.currency}</span></p>
                                        </div>
                                        <div className="hidden lg:block">
                                            <p className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest mb-1"><Clock size={12} /> {isRTL ? 'الموعد النهائي' : 'Deadline'}</p>
                                            <p className="text-sm font-black italic">{new Date(auc.endsAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => handleDeleteAuction(auc.id)} title={isRTL ? 'حذف' : 'Delete'} className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:text-red-500 transition-all"><Trash2 size={16} /></button>
                                        <Link href={`/auctions/${auc.id}`} target="_blank" title={isRTL ? 'فتح الرابط' : 'View'} className="h-10 px-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2 text-[9px] font-black uppercase text-white/40 hover:text-white transition-all">
                                            <ExternalLink size={14} /> {isRTL ? 'رابط' : 'Link'}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        
                        <button onClick={() => setIsAuctionModalOpen(true)} title={isRTL ? "بدء مهمة جديدة" : "Init mission"} className="w-full py-8 border-2 border-dashed border-red-500/10 rounded-3xl hover:border-red-500/30 hover:bg-red-500/5 transition-all flex flex-col items-center gap-2 group">
                            <Plus size={32} className="text-red-500 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500/60">
                                {isRTL ? 'بدء مهمة إطلاق مزاد جديد' : 'Initialize New Arena Mission'}
                            </span>
                        </button>
                    </div>
                )}
            </AdminPageShell>

            {/* Auction Create Modal */}
            <AnimatePresence>
                {isAuctionModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsAuctionModalOpen(false)}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={e => e.stopPropagation()} className="ck-modal max-w-2xl w-full p-10 relative">
                            <button onClick={() => setIsAuctionModalOpen(false)} title={isRTL ? 'إغلاق' : 'Close'} className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10"><X size={20} /></button>
                            <div className="mb-10">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{isRTL ? 'بدء المزاد (الساحة)' : 'Initiate Arena'}</h2>
                                <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest mt-1">{isRTL ? 'تكوين معايير المزاد المباشر' : 'Configure Auction Parameters'}</p>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Select Vehicle Asset</label>
                                    <select value={auctionForm.carId} title="Vehicle Select" onChange={e => setAuctionForm({ ...auctionForm, carId: e.target.value })} className="w-full ck-input h-14 bg-white/5">
                                        <option value="">Select a car...</option>
                                        {cars.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Start Bid (SAR)</label>
                                        <input type="number" value={auctionForm.startPrice} title="Start Price" onChange={e => setAuctionForm({ ...auctionForm, startPrice: e.target.value })} className="ck-input h-14 bg-white/5" placeholder="50000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Status</label>
                                        <div className="h-14 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center px-4 gap-2">
                                            <Activity size={16} className="text-red-500" />
                                            <span className="text-[10px] font-black uppercase text-red-500">Scheduled Ready</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Activation Time</label>
                                        <input type="datetime-local" value={auctionForm.startsAt} title="Activation Time" onChange={e => setAuctionForm({ ...auctionForm, startsAt: e.target.value })} className="ck-input h-14 bg-white/5 [color-scheme:dark]" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">Deactivation Time</label>
                                        <input type="datetime-local" value={auctionForm.endsAt} title="Deactivation Time" onChange={e => setAuctionForm({ ...auctionForm, endsAt: e.target.value })} className="ck-input h-14 bg-white/5 [color-scheme:dark]" />
                                    </div>
                                </div>
                                <button onClick={handleLaunchAuction} title={isRTL ? 'إطلاق' : 'Launch'} className="w-full h-16 bg-red-500 text-white font-black uppercase text-xs tracking-[0.5em] rounded-2xl shadow-[0_0_40px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all">
                                    {isRTL ? 'إطلاق حدث المزاد' : 'Launch Market Event'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Session Modal Simplified for HUB */}
            <AnimatePresence>
                {isLiveModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={() => setIsLiveModalOpen(false)}>
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} onClick={e => e.stopPropagation()} className="ck-modal max-w-4xl w-full p-0 relative overflow-hidden flex flex-col h-[85vh]">
                            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                                <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                                    {editingLiveId ? (isRTL ? 'تعديل الجلسة' : 'Edit Session') : (isRTL ? 'جلسة بث جديدة' : 'New Live Session')}
                                </h2>
                                <button onClick={() => setIsLiveModalOpen(false)} title={isRTL ? 'إغلاق' : 'Close'} className="absolute top-8 right-8 text-white/40 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 ck-scroll">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">{isRTL ? 'عنوان الجلسة' : 'Session Title'}</label>
                                        <input value={liveForm.title} title={isRTL ? 'العنوان' : 'Title'} onChange={e => setLiveForm({ ...liveForm, title: e.target.value })} className="ck-input bg-white/5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">{isRTL ? 'رابط البث الخارجي' : 'External URL / Stream'}</label>
                                        <input value={liveForm.externalUrl} title={isRTL ? 'الرابط' : 'URL'} onChange={e => setLiveForm({ ...liveForm, externalUrl: e.target.value })} className="ck-input bg-white/5" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                     <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">{isRTL ? 'رقم الواتساب' : 'WA Number'}</label>
                                        <input value={liveForm.whatsappNumber} title={isRTL ? 'واتساب' : 'WA'} onChange={e => setLiveForm({ ...liveForm, whatsappNumber: e.target.value })} className="ck-input bg-white/5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">{isRTL ? 'اسم مستخدم البائع' : 'Vendor User'}</label>
                                        <input value={liveForm.auctionUsername} title={isRTL ? 'مستخدم' : 'User'} onChange={e => setLiveForm({ ...liveForm, auctionUsername: e.target.value })} className="ck-input bg-white/5" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest">{isRTL ? 'كلمة مرور البائع' : 'Vendor Password'}</label>
                                        <input type="password" value={liveForm.auctionPassword} title={isRTL ? 'مرور' : 'Pass'} onChange={e => setLiveForm({ ...liveForm, auctionPassword: e.target.value })} className="ck-input bg-white/5" />
                                    </div>
                                </div>
                                
                                <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-3xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Info size={16} className="text-red-500" />
                                         <p className="text-[10px] font-black uppercase text-red-500/70 tracking-widest">{isRTL ? 'تنبيه تشغيلي' : 'OPERATIONAL NOTE'}</p>
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed italic">
                                        {isRTL 
                                            ? 'تسمح جلسات البث الحي بعرض مخزون السيارات يدوياً مع البث الخارجي. يتوقع استهلاك عالٍ للموارد أثناء البث.' 
                                            : 'Live sessions allow manual car inventory display alongside external feeds. High resource usage expected during broadcast.'}
                                    </p>
                                </div>
                            </div>
                            <div className="p-8 bg-black/80 border-t border-white/5">
                                <button onClick={async () => {
                                    setLoading(true);
                                    try {
                                        if (editingLiveId) await api.liveAuctions.update(editingLiveId, liveForm);
                                        else await api.liveAuctions.create(liveForm);
                                        setIsLiveModalOpen(false);
                                        loadLiveSessions();
                                        showToast(isRTL ? 'تم الحفظ' : 'Saved', 'success');
                                    } catch { } finally { setLoading(false); }
                                }} title={isRTL ? 'تنفيذ التكوين' : 'Execute'} className="w-full h-16 bg-[#00f0ff] text-black font-black uppercase tracking-[0.5em] text-xs rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.2)]">
                                     {isRTL ? 'تنفيذ إعدادات الجلسة' : 'Execute Session Config'}
                                 </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function MarketHub() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <MarketHubContent />
        </Suspense>
    );
}
