'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Edit2, ChevronLeft, X, Link as LinkIcon, Play, Square, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminLiveAuctions() {
    const { t, isRTL } = useLanguage();
    const [sessions, setSessions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        externalUrl: '',
        whatsappNumber: '',
        auctionUsername: '', // [[ARABIC_COMMENT]] اسم المستخدم للمزاد الخارجي
        auctionPassword: '', // [[ARABIC_COMMENT]] كلمة السر للمزاد الخارجي
        cars: [] as any[]
    });

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setIsLoading(true);
        try {
            const res = await api.liveAuctions.list();
            if (res.success) setSessions(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.title) return alert(isRTL ? "يرجى إدخال العنوان" : "Title is required");
        setIsLoading(true);
        try {
            if (editingId) {
                await api.liveAuctions.update(editingId, formData);
            } else {
                await api.liveAuctions.create(formData);
            }
            setIsModalOpen(false);
            resetForm();
            loadSessions();
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? "هل أنت متأكد؟" : "Are you sure?")) return;
        try {
            await api.liveAuctions.delete(id);
            loadSessions();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatus = async (id: string, action: 'start' | 'end') => {
        try {
            if (action === 'start') await api.liveAuctions.start(id);
            else await api.liveAuctions.end(id);
            loadSessions();
        } catch (e) {
            console.error(e);
        }
    };

    const resetForm = () => {
        setFormData({ title: '', externalUrl: '', whatsappNumber: '', auctionUsername: '', auctionPassword: '', cars: [] });
        setEditingId(null);
    };

    const addCar = () => {
        setFormData({
            ...formData,
            cars: [...formData.cars, { title: '', images: [], condition: '', description: '', priceEstimate: '' }]
        });
    };

    const removeCar = (index: number) => {
        const newCars = [...formData.cars];
        newCars.splice(index, 1);
        setFormData({ ...formData, cars: newCars });
    };

    const updateCar = (index: number, field: string, value: any) => {
        const newCars = [...formData.cars];
        newCars[index] = { ...newCars[index], [field]: value };
        setFormData({ ...formData, cars: newCars });
    };

    const handleImageUpload = async (index: number, files: FileList | null) => {
        if (!files) return;
        const uploadPromises = Array.from(files).map(file => {
            const fd = new FormData();
            fd.append('image', file);
            return api.upload.image(fd);
        });

        try {
            const results = await Promise.all(uploadPromises);
            const urls = results.map(r => r.url);
            updateCar(index, 'images', [...formData.cars[index].images, ...urls]);
        } catch (e) {
            console.error(e);
            alert("Image upload failed");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 lg:p-20">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <Link href="/admin/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white mb-4 transition-colors">
                        <ChevronLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? "العودة" : "BACK"}</span>
                    </Link>
                    <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter">
                        {isRTL ? "المزادات المباشرة" : "LIVE SHOWROOM"}
                    </h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="px-8 py-4 bg-cinematic-neon-blue text-black font-black uppercase text-[10px] tracking-widest rounded-2xl flex items-center gap-3 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
                >
                    <Plus className="w-4 h-4" />
                    {isRTL ? "إنشاء جلسة" : "CREATE SESSION"}
                </motion.button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {sessions.map(session => (
                    <div key={session._id} className="glass-card p-8 border-white/5 bg-white/[0.01] flex flex-col md:flex-row justify-between items-center gap-8 group">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                    session.status === 'live' ? "bg-cinematic-neon-red/20 text-cinematic-neon-red border border-cinematic-neon-red/40" :
                                        session.status === 'ended' ? "bg-white/5 text-white/40 border border-white/10" : "bg-cinematic-neon-blue/20 text-cinematic-neon-blue border border-cinematic-neon-blue/40"
                                )}>
                                    {session.status}
                                </span>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{session.title}</h3>
                            </div>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> {session.externalUrl || "Manual Entries Only"}
                            </p>
                            <div className="flex gap-4 pt-2">
                                <div className="text-[10px] uppercase tracking-widest bg-white/5 px-3 py-1 rounded border border-white/5">
                                    <span className="text-white/40">{isRTL ? "السيارات:" : "CARS:"}</span> {session.cars?.length || 0}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full md:w-auto">
                            {session.status !== 'live' ? (
                                <button onClick={() => handleStatus(session._id, 'start')} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-cinematic-neon-blue hover:bg-cinematic-neon-blue/10 transition-all flex flex-col items-center gap-1">
                                    <Play className="w-5 h-5" />
                                    <span className="text-[7px] font-black uppercase">START</span>
                                </button>
                            ) : (
                                <button onClick={() => handleStatus(session._id, 'end')} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-cinematic-neon-red hover:bg-cinematic-neon-red/10 transition-all flex flex-col items-center gap-1">
                                    <Square className="w-5 h-5" />
                                    <span className="text-[7px] font-black uppercase">STOP</span>
                                </button>
                            )}

                            <button onClick={() => { setFormData(session); setEditingId(session._id); setIsModalOpen(true); }} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-white/60 hover:text-white transition-all flex flex-col items-center gap-1">
                                <Edit2 className="w-5 h-5" />
                                <span className="text-[7px] font-black uppercase">EDIT</span>
                            </button>

                            <button onClick={() => handleDelete(session._id)} className="p-4 bg-white/5 rounded-2xl border border-white/5 text-white/20 hover:text-cinematic-neon-red transition-all flex flex-col items-center gap-1">
                                <Trash2 className="w-5 h-5" />
                                <span className="text-[7px] font-black uppercase">DEL</span>
                            </button>

                            <Link href={`/auctions/live/${session._id}`} target="_blank" className="p-4 bg-white/5 rounded-2xl border border-white/5 text-white/40 hover:text-white transition-all flex flex-col items-center gap-1">
                                <ExternalLink className="w-5 h-5" />
                                <span className="text-[7px] font-black uppercase">VIEW</span>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col relative"
                        >
                            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-white/40 hover:text-white z-10"><X className="w-6 h-6" /></button>

                            <div className="p-8 border-b border-white/5">
                                <h2 className="text-3xl font-black uppercase italic tracking-tighter">{editingId ? "تعديل الجلسة" : "جلسة جديدة"}</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isRTL ? 'عنوان الجلسة' : 'Session Title'}</label>
                                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-cinematic-neon-blue" placeholder={isRTL ? 'مثال: جلسة الاثنين IAAI' : 'e.g. IAAI Live Monday'} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isRTL ? 'الرابط الخارجي (iframe/URL)' : 'External Link (Iframe/URL)'}</label>
                                        <input value={formData.externalUrl} onChange={e => setFormData({ ...formData, externalUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-cinematic-neon-blue" placeholder="https://www.copart.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isRTL ? 'واتساب هذا المزاد' : 'WhatsApp for this Auction'}</label>
                                        <input value={formData.whatsappNumber} onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-cinematic-neon-blue" placeholder="9665xxxxxxxx" />
                                    </div>
                                    {/* [[ARABIC_COMMENT]] بيانات دخول المزاد الخارجي */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isRTL ? 'اسم المستخدم (للمزاد الخارجي)' : 'Username (External Site)'}</label>
                                        <input value={formData.auctionUsername} onChange={e => setFormData({ ...formData, auctionUsername: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-cinematic-neon-blue" placeholder={isRTL ? 'اسم المستخدم' : 'username'} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{isRTL ? 'كلمة السر (للمزاد الخارجي)' : 'Password (External Site)'}</label>
                                        <input type="password" value={formData.auctionPassword} onChange={e => setFormData({ ...formData, auctionPassword: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-cinematic-neon-blue" placeholder="••••••••" />
                                    </div>
                                </div>

                                <div className="pt-8 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-lg font-black uppercase italic">{isRTL ? "السيارات المضافة يدوياً" : "MANUAL CAR LISTING"}</h4>
                                        <button onClick={addCar} className="flex items-center gap-2 text-cinematic-neon-blue text-[10px] font-black uppercase tracking-widest bg-cinematic-neon-blue/10 px-4 py-2 rounded-lg border border-cinematic-neon-blue/20">
                                            <Plus className="w-4 h-4" /> Add Car
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        {formData.cars.map((car, idx) => (
                                            <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 relative space-y-4">
                                                <button onClick={() => removeCar(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <input value={car.title} onChange={e => updateCar(idx, 'title', e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-lg text-sm" placeholder="Car Name (e.g. Ford Mustang 2021)" />
                                                    <input value={car.condition} onChange={e => updateCar(idx, 'condition', e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-lg text-sm" placeholder="Condition/Damage (e.g. Frontal Damage)" />
                                                    <input value={car.priceEstimate} onChange={e => updateCar(idx, 'priceEstimate', e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-lg text-sm" placeholder="Max Bid / Estimate" />
                                                    <div className="flex items-center gap-4">
                                                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                                            <ImageIcon className="w-4 h-4" /> Upload Images
                                                            <input type="file" multiple className="hidden" onChange={e => handleImageUpload(idx, e.target.files)} />
                                                        </label>
                                                        <span className="text-[10px] text-white/40">{car.images?.length || 0} images</span>
                                                    </div>
                                                </div>
                                                <textarea value={car.description} onChange={e => updateCar(idx, 'description', e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-sm h-20" placeholder="Full details, engine status, problem, etc..."></textarea>

                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {car.images?.map((img: string, i: number) => (
                                                        <img key={i} src={img} className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-black/50">
                                <button onClick={handleSave} disabled={isLoading} className="w-full py-5 bg-cinematic-neon-red text-white font-black uppercase tracking-[0.5em] text-xs rounded-2xl shadow-[0_0_30px_rgba(255,0,60,0.3)] disabled:opacity-50">
                                    {editingId ? "SAVE CHANGES" : "CREATE SESSION"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
