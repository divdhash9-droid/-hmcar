'use client';

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle, X, ExternalLink, ChevronLeft, ShieldCheck, Info, Tag, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

export default function LiveAuctionDetails() {
    const { isRTL } = useLanguage();
    const { id } = useParams();
    const router = useRouter();
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState<any>(null);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const res = await api.liveAuctions.getById(id as string);
                if (res.success) setSession(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadSession();
    }, [id]);

    const handleBuyRequest = (car: any) => {
        const phone = session.whatsappNumber || "966550616161"; // Default if not set
        const text = encodeURIComponent(
            isRTL
                ? `السلام عليكم، أريد الاستفسار عن شراء سيارة من المزاد المباشر:\nالسيارة: ${car.title}\nالمزاد: ${session.title}\nرقم اللوت: ${car.lotNumber || 'N/A'}`
                : `Hello, I'm interested in buying this car from the Live Auction:\nCar: ${car.title}\nAuction: ${session.title}\nLot #: ${car.lotNumber || 'N/A'}`
        );
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white/20 uppercase tracking-[0.5em] animate-pulse">Initializing HUD Feed...</div>;
    if (!session) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Session not found</div>;

    return (
        <div className={`min-h-screen bg-[#050505] text-white ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Top HUD Bar */}
            <div className="fixed top-20 left-0 right-0 z-40 bg-black/60 backdrop-blur-3xl border-b border-white/5 p-4 mx-6 rounded-b-2xl shadow-2xl">
                <div className="max-w-[1500px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                            <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
                        </button>
                        <div>
                            <span className="text-[10px] font-black text-cinematic-neon-red uppercase tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-cinematic-neon-red animate-pulse" />
                                {session.status === 'live' ? (isRTL ? 'بث مباشر الآن' : 'LIVE TRANSMISSION') : (isRTL ? 'جلسة منتهية' : 'SESSION ENDED')}
                            </span>
                            <h1 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter">{session.title}</h1>
                        </div>
                    </div>

                    {session.externalUrl && (
                        <a href={session.externalUrl} target="_blank" className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
                            <ExternalLink className="w-4 h-4 text-white/40" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'عرض الموقع الرسمي' : 'OFFICIAL AUCTION SITE'}</span>
                        </a>
                    )}
                </div>
            </div>

            <main className="pt-52 pb-20 px-6 max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Left Side: Feed or External Link */}
                <div className="lg:col-span-8 space-y-8">
                    {session.externalUrl ? (
                        <div className="relative aspect-video w-full bg-zinc-900 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <iframe
                                src={session.externalUrl}
                                className="w-full h-full border-0"
                                title="Auction Feed"
                                allowFullScreen
                            />
                            {/* Protection overlay if needed, but here we want interaction */}
                        </div>
                    ) : (
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 text-center space-y-4">
                            <AlertTriangle className="w-16 h-16 text-white/5 mx-auto" />
                            <h3 className="text-2xl font-black uppercase italic text-white/20 tracking-tighter">No Live Video Feed</h3>
                            <p className="text-white/40 text-[11px] uppercase tracking-widest">Please refer to the manual car list below</p>
                        </div>
                    )}

                    {/* Manual Car List */}
                    <div className="space-y-6 pt-10">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-[2px] w-12 bg-cinematic-neon-blue" />
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter">{isRTL ? 'السيارات المتوفرة للمزايدة' : 'AVAILABLE FOR PURCHASE'}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {session.cars?.map((car: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className="glass-card bg-white/[0.01] border-white/5 p-6 space-y-6 cursor-pointer group"
                                    onClick={() => setSelectedCar(car)}
                                >
                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5">
                                        <img src={car.images?.[0] || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d'} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" alt={car.title} />
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase tracking-widest">{car.condition}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black uppercase italic truncate">{car.title}</h3>
                                        <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                            <div>
                                                <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">{isRTL ? 'تقدير السعر' : 'ESTIMATE'}</span>
                                                <div className="text-lg font-black text-cinematic-neon-blue tracking-tighter">{car.priceEstimate || 'Contact Us'}</div>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleBuyRequest(car); }}
                                                className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-cinematic-neon-blue/20 hover:text-cinematic-neon-blue transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                                            >
                                                {isRTL ? 'شراء عبر واتساب' : 'BUY VIA WHATSAPP'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Info & HUD */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="glass-card p-8 bg-white/[0.02] border-white/5 space-y-8">
                        <div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-4 block">Process Info</span>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/20 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-cinematic-neon-blue" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{isRTL ? 'وساطة آمنة' : 'SECURE BROKERAGE'}</h4>
                                        <p className="text-[10px] text-white/40 leading-relaxed">{isRTL ? 'نحن نقوم بالمزايدة نيابة عنك في المزاد الخارجي لضمان أفضل سعر.' : 'We bid on your behalf at the external auction to ensure the best price.'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-cinematic-neon-red/10 border border-cinematic-neon-red/20 flex items-center justify-center">
                                        <MessageCircle className="w-5 h-5 text-cinematic-neon-red" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{isRTL ? 'اتفاق الواتساب' : 'WHATSAPP AGREEMENT'}</h4>
                                        <p className="text-[10px] text-white/40 leading-relaxed">{isRTL ? 'بعد الضغط على شراء، سنتفق على الحد الأقصى للمزايدة والشروط.' : 'After clicking buy, we will agree on the maximum bid limit and terms.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-6 block">Support</span>
                            <a href={`https://wa.me/${session.whatsappNumber || '966550616161'}`} className="w-full py-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3 text-green-500 hover:bg-green-500/20 transition-all">
                                <MessageCircle className="w-5 h-5" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'تحدث مع المستشار' : 'TALK TO EXPERT'}</span>
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            {/* Car Details Modal */}
            <AnimatePresence>
                {selectedCar && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-3xl overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden relative"
                        >
                            <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 text-white/40 hover:text-white z-20 transition-all hover:rotate-90"><X className="w-8 h-8" /></button>

                            <div className="grid grid-cols-1 lg:grid-cols-2">
                                <div className="p-8 space-y-6">
                                    <div className="aspect-video rounded-2xl overflow-hidden border border-white/10">
                                        <img src={selectedCar.images?.[0]} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="grid grid-cols-4 gap-4">
                                        {selectedCar.images?.slice(1, 5).map((img: string, i: number) => (
                                            <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                                                <img src={img} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-12 space-y-10 flex flex-col justify-center">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Tag className="w-4 h-4 text-cinematic-neon-blue" />
                                            <span className="text-[11px] font-black text-cinematic-neon-blue uppercase tracking-widest">{selectedCar.condition}</span>
                                        </div>
                                        <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter leading-none">{selectedCar.title}</h2>
                                        <p className="text-white/40 text-[13px] leading-relaxed max-w-md">{selectedCar.description || (isRTL ? 'لا توجد تفاصيل إضافية متوفرة حالياً لهذه السيارة.' : 'No additional details currently available for this vehicle.')}</p>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div>
                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">MSRP Estimate</span>
                                            <div className="text-3xl font-black text-white">{selectedCar.priceEstimate || 'TBD'}</div>
                                        </div>
                                        {selectedCar.lotNumber && (
                                            <div>
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Lot Number</span>
                                                <div className="text-3xl font-black text-white/40">{selectedCar.lotNumber}</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-10">
                                        <button
                                            onClick={() => handleBuyRequest(selectedCar)}
                                            className="flex-1 py-5 bg-cinematic-neon-blue text-black font-black uppercase text-xs tracking-[0.4em] rounded-2xl shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-105 transition-all"
                                        >
                                            {isRTL ? 'شراء السيارة الآن' : 'SECURE THIS CAR'}
                                        </button>
                                        <button onClick={() => setSelectedCar(null)} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                                            {isRTL ? 'العودة' : 'CANCEL'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
