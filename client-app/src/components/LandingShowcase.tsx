/**
 * واجهة العرض الرئيسية (Landing Showcase)
 * أول ما يراه المستخدم في الموقع (البوابة الرئيسية).
 * تعرض الأقسام الثلاثة الكبرى: السيارات، قطع الغيار، وخدمات المزادات.
 * تتميز بتأثيرات بصرية سينمائية (أشعة نيون، حركات انسابية، وتصاميم زجاجية).
 */
import { motion } from "framer-motion";
import { Car, Wrench, Gavel, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSettings } from "@/lib/SettingsContext";

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
    const router = useRouter();
    const { homeContent } = useSettings();

    // إعداد البطاقات الثلاث الرئيسية (السيارات، قطع الغيار، المزادات)
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
        <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 overflow-hidden bg-black/40">
            {/* ── CINEMATIC PATHWAYS (NEON BEAMS) ── */}
            <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent rotate-[30deg]"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 75, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[1px] bg-gradient-to-r from-transparent via-cinematic-neon-blue/20 to-transparent rotate-[-45deg]"
                />
            </div>

            {/* ── GATEWAY TITLE ── */}
            <motion.div
                className="text-center z-20 mb-20 pt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
            >
                <div className="relative inline-block mb-4">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-accent-gold/20 blur-3xl rounded-full"
                    />
                    <h1 className="text-6xl md:text-9xl font-black font-display tracking-tighter text-white relative">
                        {homeContent.heroTitle || (
                            <>
                                HM <span className="text-transparent bg-clip-text bg-gradient-to-b from-accent-gold to-[#8b7355]">CAR</span>
                            </>
                        )}
                    </h1>
                </div>
                <p className="text-lg md:text-2xl text-white/40 font-light tracking-[0.3em] uppercase max-w-2xl mx-auto px-6">
                    {homeContent.heroSubtitle || (isRTL ? "تصدير السيارات وقطع الغيار من كوريا إلى جميع دول العالم" : "Exporting Cars & Spare Parts from Korea to the World")}
                </p>

                {/* ── LOGIN BUTTON ── */}
                <motion.div
                    className="mt-10 flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                >
                    <Link href="/login">
                        <motion.span
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.97 }}
                            className="relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-black uppercase tracking-[0.25em] text-sm text-black bg-gradient-to-r from-accent-gold to-[#e8c97a] shadow-[0_0_40px_rgba(201,169,110,0.4)] cursor-pointer select-none"
                        >
                            <motion.div
                                animate={{ opacity: [0.4, 0.9, 0.4] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                                className="absolute inset-0 rounded-2xl bg-white/20 blur-sm"
                            />
                            <span className="relative z-10">
                                {isRTL ? "تسجيل الدخول" : "LOGIN"}
                            </span>
                            <ArrowRight className={`relative z-10 w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                        </motion.span>
                    </Link>
                </motion.div>
            </motion.div>

            {/* ── CINEMATIC GATEWAY GRID ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl z-20 px-6 pb-24">
                {
                    cards.map((card, index) => (
                        <motion.button
                            key={index}
                            onClick={() => {
                                // التوجيه للصفحة المحددة عند النقر
                                if (card.key === 'cars') router.push('/cars');
                                else if (card.key === 'parts') router.push('/parts');
                                else if (card.key === 'auctions') router.push('/auctions');
                            }}
                            className="group relative"
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.2, duration: 1 }}
                        >
                            {/* ── PORTAL RING ── */}
                            <div className="absolute inset-0 -z-10 bg-black rounded-[40px] border border-white/5 transition-all duration-700 group-hover:border-white/20 shadow-2xl" />

                            {/* ── ENERGY CORE ── */}
                            <div className={cn(
                                "relative overflow-hidden rounded-[40px] p-10 h-[450px] flex flex-col items-center justify-center text-center transition-all duration-700",
                                "bg-white/[0.02] backdrop-blur-2xl",
                                "group-hover:translate-y-[-10px]"
                            )}>
                                {/* Energy Aura */}
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 bg-gradient-to-b",
                                    card.color
                                )} />

                                {/* 3D Floating Icon Hub */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative mb-8"
                                >
                                    <div className={cn(
                                        "w-32 h-32 rounded-full flex items-center justify-center bg-black/40 border border-white/10 relative z-10 transition-all duration-700 group-hover:border-accent-gold/50 shadow-2xl group-hover:rotate-[360deg]",
                                        card.iconColor
                                    )}>
                                        <card.icon className="w-14 h-14" />
                                    </div>
                                    <div className={cn("absolute inset-0 blur-3xl opacity-20 group-hover:opacity-50 transition-opacity duration-700", card.iconColor.replace('text-', 'bg-'))} />
                                </motion.div>

                                {/* Text Reveal */}
                                <div className="space-y-4">
                                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter group-hover:text-accent-gold transition-colors">
                                        {card.title}
                                    </h3>
                                    <div className="h-[1px] w-12 bg-white/10 mx-auto group-hover:w-24 group-hover:bg-accent-gold transition-all duration-500" />
                                    <p className="text-white/40 text-sm font-medium uppercase tracking-[0.2em] group-hover:text-white/80 transition-colors">
                                        {card.description}
                                    </p>
                                </div>

                                {/* Interaction Label */}
                                <div className="mt-12 flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700">
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">
                                        {isRTL ? "اضغط للدخول" : "INITIATE ACCESS"}
                                    </span>
                                    <ArrowRight className={cn("w-4 h-4 text-accent-gold", isRTL && "rotate-180")} />
                                </div>
                            </div>

                            {/* Ambient Particle for Card */}
                            <div className={cn("absolute -bottom-4 -left-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-1000 rounded-full", card.iconColor.replace('text-', 'bg-'))} />
                        </motion.button>
                    ))
                }
            </div>
        </div>
    );
}
