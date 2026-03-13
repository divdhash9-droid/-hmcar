'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, TrendingUp, Users, Eye, Trash2, Edit2, ArrowLeft, X, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { api } from "@/lib/api";
import AdminPageShell from '@/components/AdminPageShell';

export default function AdminAuctionsControl() {
    const { t, isRTL } = useLanguage();
    const [activeArena, setActiveArena] = useState('LIVE');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [auctions, setAuctions] = useState<any[]>([]);
    const [cars, setCars] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        carId: '',
        startPrice: '',
        startsAt: '',
        endsAt: '',
    });

    useEffect(() => {
        loadData();
    }, [activeArena]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load auctions
            // backend expects status query. valid: 'scheduled', 'running', 'ended', or 'all'
            // Map tabs to status
            let status = 'running';
            if (activeArena === 'SCHEDULED') status = 'scheduled';
            if (activeArena === 'SETTLED') status = 'ended';
            if (activeArena === 'AUDIT') status = 'all';

            const aucRes = await api.auctions.list({ status, limit: 100 });
            if (aucRes.success) {
                setAuctions(aucRes.data || []);
            }

            // Load available cars for dropdown (only need this once really, but fine here)
            const carRes = await api.cars.list({ status: 'active' });
            if (carRes.success) {
                setCars(carRes.data.cars || []);
            }
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLaunch = async () => {
        if (!formData.carId || !formData.startPrice || !formData.startsAt || !formData.endsAt) {
            alert(isRTL ? 'الرجاء تعبئة جميع الحقول' : 'Please fill all fields');
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.auctions.create(formData);
            if (res.success) {
                setIsCreateModalOpen(false);
                setFormData({
                    carId: '',
                    startPrice: '',
                    startsAt: '',
                    endsAt: '',
                });
                loadData();
            } else {
                alert('Failed to create auction: ' + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error creating auction');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذا المزاد؟' : 'Are you sure you want to delete this auction?')) return;
        try {
            await api.auctions.delete(id);
            loadData();
        } catch (e) {
            console.error(e);
            alert('Failed to delete');
        }
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <AdminPageShell
                title={isRTL ? 'إدارة المزادات' : 'AUCTION COMMAND'}
                titleEn="ARENA OPERATIONS"
                backHref="/admin/dashboard"
                isRTL={isRTL}
                actions={
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-12 px-6 flex items-center justify-center gap-2 rounded-2xl bg-red-500 text-white font-black italic uppercase text-xs shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{isRTL ? 'إطلاق مزاد' : 'NEW ARENA'}</span>
                    </button>
                }
            >
                {/* Filter Tabs */}
                <div className="flex bg-white/5 p-2 rounded-2xl border border-white/5 w-fit mb-10 overflow-x-auto max-w-full">
                    {['LIVE', 'SCHEDULED', 'SETTLED', 'AUDIT'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveArena(tab)}
                            className={cn(
                                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                activeArena === tab ? "bg-white !text-black shadow-xl" : "text-white/40 hover:text-white"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* --- AUCTION LIST --- */}
                {isLoading && auctions.length === 0 ? (
                    <div className="text-center py-20 animate-pulse text-white/40">LOADING DATA...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {auctions.map((auc: any) => (
                            <motion.div
                                key={auc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.02)" }}
                                className="glass-card p-8 bg-white/[0.01] border-white/5 flex flex-col md:flex-row items-center gap-10 group relative overflow-hidden"
                            >
                                <div className="relative w-full md:w-64 h-40 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                                    <img
                                        src={auc.car?.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop'}
                                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                                        alt={auc.car?.title || 'Car'}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    {auc.status === 'running' && (
                                        <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                            <span className="text-[7px] font-black text-white uppercase tracking-widest">LIVE</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] italic">{auc.car?.make || 'UNKNOWN'}</div>
                                        <h3 className="text-xl font-black uppercase italic tracking-tighter line-clamp-1">{auc.car?.title || 'Unknown Car'}</h3>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest"><TrendingUp className="w-3 h-3" /> Current Bid</div>
                                        <div className="text-lg font-black italic tracking-tight text-red-500">
                                            {Number(auc.currentBid).toLocaleString()} <span className="text-[9px]">{auc.currency}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest"><Clock className="w-3 h-3" /> Ends At</div>
                                        <div className="text-lg font-black italic tracking-tight text-white">
                                            {new Date(auc.endsAt).toLocaleDateString()}
                                        </div>
                                        <div className="text-[10px] text-white/40">{new Date(auc.endsAt).toLocaleTimeString()}</div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase tracking-widest"><Trophy className="w-3 h-3" /> Highest Bidder</div>
                                        <div className="text-lg font-black italic tracking-tight text-white line-clamp-1">
                                            {auc.highestBidder || 'No Bids'}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-3 w-full md:w-auto mt-6 md:mt-0">
                                    <button className="flex-1 p-4 bg-white/5 rounded-2xl hover:bg-cinematic-neon-blue/20 hover:text-cinematic-neon-blue transition-all border border-white/5 flex items-center justify-center gap-3 text-[9px] font-black uppercase">
                                        <Eye className="w-4 h-4" /> {isRTL ? 'مراقبة' : 'MONITOR'}
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleDelete(auc.id)}
                                            className="px-4 py-3 bg-white/5 rounded-xl hover:bg-red-500/20 transition-all text-white/40 hover:text-red-500 border border-white/5 flex-grow lg:flex-none flex items-center justify-center gap-2 text-[9px] font-black uppercase"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            {isRTL ? 'حذف' : 'DELETE'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* CREATE AUCTION MODAL */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-black border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(255,0,60,0.1)]"
                            >
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <div className="p-8 md:p-12 space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">{isRTL ? "إطلاق مزاد جديد" : "INITIATE NEW AUCTION"}</h2>
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Select Vehicle & Configure Parameters</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Vehicle</label>
                                            <select
                                                value={formData.carId}
                                                onChange={(e) => setFormData({ ...formData, carId: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-red-500 transition-all"
                                            >
                                                <option value="" className="bg-black text-white/40">Select a car from inventory...</option>
                                                {cars.map(car => (
                                                    <option key={car._id || car.id} value={car._id || car.id} className="bg-black">
                                                        {car.make} {car.model} {car.year} - {car.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Starting Bid (SAR)</label>
                                                <input
                                                    type="number"
                                                    value={formData.startPrice}
                                                    onChange={(e) => setFormData({ ...formData, startPrice: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-red-500 transition-all"
                                                    placeholder="e.g. 500000"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                {/* Spacer or additional field */}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Start Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.startsAt}
                                                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-red-500 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">End Time</label>
                                                <input
                                                    type="datetime-local"
                                                    value={formData.endsAt}
                                                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-red-500 transition-all [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleLaunch}
                                        disabled={isLoading}
                                        className={cn(
                                            "w-full py-5 text-white font-black uppercase text-xs tracking-[0.5em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3",
                                            isLoading ? "bg-zinc-800 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                                        )}
                                    >
                                        {isLoading ? isRTL ? "جاري الإطلاق..." : "INITIALIZING..." : isRTL ? "إطلاق المزاد" : "CONFIRM LAUNCH"}
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </AdminPageShell>
        </div>
    );
}
