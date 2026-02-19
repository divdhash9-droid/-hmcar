
import { motion } from "framer-motion";
import { Car, Wrench, Gavel, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface LandingShowcaseProps {
    isRTL: boolean;
    latestCars?: Array<{
        id?: string;
        title?: string;
        make?: { name?: string } | string;
        model?: string;
        images?: string[];
    }>;
}

export default function LandingShowcase({ isRTL, latestCars = [] }: LandingShowcaseProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [category, setCategory] = useState<"cars" | "parts" | "auctions">("cars");
    const [lead, setLead] = useState({ name: "", model: "", company: "", phone: "" });
    const [submitted, setSubmitted] = useState(false);

    const runSearch = () => {
        if (category === "cars") {
            const q = query.toLowerCase().trim();
            const filtered = latestCars.filter((c) => {
                const t = (c.title || "").toLowerCase();
                const m = typeof c.make === "string" ? (c.make || "").toLowerCase() : (c.make?.name || "").toLowerCase();
                const mdl = (c.model || "").toLowerCase();
                return q && (t.includes(q) || m.includes(q) || mdl.includes(q));
            });
            setResults(filtered);
        } else {
            setResults([]);
        }
    };

    const submitLead = async () => {
        setSubmitted(false);
        try {
            await fetch("/api/v2/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...lead, category, query }),
            });
            setSubmitted(true);
        } catch {
            try {
                const existing = JSON.parse(localStorage.getItem("hmcar_leads") || "[]");
                existing.push({ ...lead, category, query, ts: Date.now() });
                localStorage.setItem("hmcar_leads", JSON.stringify(existing));
                setSubmitted(true);
            } catch {
                setSubmitted(true);
            }
        }
    };

    const cards = [
        {
            title: isRTL ? "سيارات للبيع" : "Cars for Sale",
            description: isRTL ? "اكتشف مجموعتنا الحصرية" : "Discover our exclusive collection",
            icon: Car,
            key: "cars",
            color: "from-blue-500/20 to-blue-600/5",
            border: "group-hover:border-blue-500/50",
            glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
            iconColor: "text-blue-400"
        },
        {
            title: isRTL ? "قطع الغيار" : "Spare Parts",
            description: isRTL ? "قطع غيار أصلية ومضمونة" : "Genuine and guaranteed parts",
            icon: Wrench,
            key: "parts",
            color: "from-purple-500/20 to-purple-600/5",
            border: "group-hover:border-purple-500/50",
            glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
            iconColor: "text-purple-400"
        },
        {
            title: isRTL ? "دخول المزادات" : "Enter Auctions",
            description: isRTL ? "زايد الآن على سيارات أحلامك" : "Bid now on your dream cars",
            icon: Gavel,
            key: "auctions",
            color: "from-[#c9a96e]/20 to-[#c9a96e]/5",
            border: "group-hover:border-[#c9a96e]/50",
            glow: "group-hover:shadow-[0_0_30px_rgba(201,169,110,0.3)]",
            iconColor: "text-[#c9a96e]"
        }
    ];

    return (
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 overflow-hidden">
            {/* Hero Text with Soft Reveal */}
            <motion.div
                className="text-center z-20 mb-16 pt-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <motion.h1
                    className="text-6xl md:text-8xl font-bold font-display tracking-tight mb-6"
                    initial={{ filter: "blur(10px)", opacity: 0 }}
                    animate={{ filter: "blur(0px)", opacity: 1 }}
                    transition={{ duration: 1.2, delay: 0.2 }}
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <span className="relative inline-block px-10 py-4 rounded-[2.5rem] border border-white/25 bg-white/10 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                        <span
                            className="relative block bg-gradient-to-b from-white via-white/70 to-white/30 bg-clip-text text-transparent tracking-widest"
                            style={{ WebkitTextStroke: "1px rgba(255,255,255,0.35)" }}
                        >
                            HM CAR
                        </span>
                        <span className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/30 via-transparent to-white/10 opacity-35" />
                        <span className="absolute -top-6 -left-8 w-28 h-28 rounded-full bg-white/25 blur-3xl opacity-30" />
                        <span className="absolute -bottom-6 -right-8 w-24 h-24 rounded-full bg-[#c9a96e]/20 blur-3xl opacity-30" />
                    </span>
                </motion.h1>
                <motion.p
                    className="text-lg md:text-2xl text-gray-200 font-light"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                >
                    {isRTL
                        ? "HM CAR لتصدير السيارات وقطع الغيار من كوريا الى جميع انحاء العالم"
                        : "HM CAR — Exporting cars and spare parts from Korea worldwide"}
                </motion.p>
                <div className="mt-6">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a96e] text-black font-bold hover:bg-[#c9a96e]/90 transition-colors"
                    >
                        {isRTL ? "تسجيل الدخول" : "Login"}
                        <ArrowRight className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                    </Link>
                </div>
            </motion.div>

            {/* Glass Cards Shop Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl z-20 px-4">
                {cards.map((card, index) => (
                    <button key={index} className="w-full perspective-1000" onClick={() => { setCategory(card.key as any); setShowSearch(true); }}>
                        <motion.div
                            className={`glass-card group relative h-72 rounded-3xl overflow-hidden cursor-pointer p-6 flex flex-col items-center justify-center text-center`}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
                            whileHover={{ 
                                scale: 1.05,
                                rotateX: 5,
                                rotateY: 5,
                                transition: { duration: 0.4 }
                            }}
                        >
                            {/* Inner Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-20 group-hover:opacity-40 transition-opacity duration-500`} />
                            
                            {/* Icon */}
                            <div className={`relative p-5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md transition-all duration-500 group-hover:scale-110 group-hover:bg-white/10 ${card.iconColor} shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
                                <card.icon className="w-12 h-12" />
                            </div>
                            
                            {/* Content */}
                            <h3 className="relative text-3xl font-bold text-white mb-3 font-display">{card.title}</h3>
                            <p className="relative text-sm text-gray-300 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                                {card.description}
                            </p>
                            
                            {/* Arrow */}
                            <div className="absolute bottom-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                                <ArrowRight className={`w-6 h-6 text-white ${isRTL ? "rotate-180" : ""}`} />
                            </div>

                            {/* Decorative Sparkle */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-white/10" />
                        </motion.div>
                    </button>
                ))}
            </div>

            {showSearch && (
                <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowSearch(false); setResults([]); setQuery(""); setSubmitted(false); }} />
                    <div className="relative w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">{isRTL ? "بحث" : "Search"}</h3>
                            <button className="px-3 py-1 rounded-lg bg-white/10 text-white" onClick={() => { setShowSearch(false); setResults([]); setQuery(""); setSubmitted(false); }}>{isRTL ? "إغلاق" : "Close"}</button>
                        </div>
                        <div className="flex gap-3 mb-4">
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isRTL ? "اكتب الاسم أو الموديل..." : "Type name or model..."} className="flex-1 px-4 py-2 rounded-xl bg-black/40 border border-white/20 text-white outline-none" />
                            <button className="px-4 py-2 rounded-xl bg-[#c9a96e] text-black font-bold" onClick={runSearch}>{isRTL ? "بحث" : "Search"}</button>
                        </div>
                        {category === "cars" && results.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {results.map((c, i) => (
                                    <div key={i} className="rounded-xl border border-white/20 bg-white/5 overflow-hidden flex">
                                        <div className="relative w-32 h-24">
                                            <img src={c.images && c.images.length ? c.images[0] : "/images/placeholder.jpg"} alt={c.title || "Car"} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="p-3 flex-1">
                                            <p className="text-white font-bold text-sm">{typeof c.make === "string" ? c.make : c.make?.name || c.title}</p>
                                            <p className="text-white/60 text-xs">{c.model || ""}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {results.length === 0 && (
                            <div className="mt-2">
                                <p className="text-white/80 mb-3 text-sm">{isRTL ? "غير متوفر حالياً، قدم طلبك:" : "Not available. Submit a request:"}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white outline-none" placeholder={isRTL ? "الاسم" : "Name"} value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                                    <input className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white outline-none" placeholder={isRTL ? "الموديل" : "Model"} value={lead.model} onChange={(e) => setLead({ ...lead, model: e.target.value })} />
                                    <input className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white outline-none" placeholder={isRTL ? "الشركة" : "Company"} value={lead.company} onChange={(e) => setLead({ ...lead, company: e.target.value })} />
                                    <input className="px-3 py-2 rounded-lg bg-black/40 border border-white/20 text-white outline-none" placeholder={isRTL ? "رقم الهاتف" : "Phone"} value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
                                </div>
                                <div className="mt-3 flex justify-end">
                                    <button className="px-4 py-2 rounded-xl bg-[#c9a96e] text-black font-bold" onClick={submitLead}>{isRTL ? "قدم الطلب" : "Submit Request"}</button>
                                </div>
                                {submitted && (
                                    <div className="mt-2 text-[#c9a96e] text-sm">{isRTL ? "تم استلام طلبك، سيتم التواصل عبر واتساب من الإدارة." : "Your request was received. Admin will contact you via WhatsApp."}</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
