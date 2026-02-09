'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils'; // Assuming cn utility exists

interface ClientPageHeaderProps {
    title: string | React.ReactNode;
    subtitle?: string;
    icon?: LucideIcon;
}

export default function ClientPageHeader({ title, subtitle, icon: Icon }: ClientPageHeaderProps) {
    const router = useRouter();
    const { isRTL } = useLanguage();

    const BackIcon = isRTL ? ArrowRight : ArrowLeft;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 relative z-20 pointer-events-auto"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    {/* Back Button 3D */}
                    <div className="relative group perspective-500">
                        <button
                            onClick={() => router.back()}
                            className="relative w-16 h-16 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-luxury-gold/50 group-hover:shadow-[0_0_30px_rgba(197,160,89,0.15)] transform-style-3d group-hover:rotate-y-12"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BackIcon className="w-6 h-6 text-white/50 group-hover:text-luxury-gold transition-colors transform group-hover:scale-110" />
                        </button>
                    </div>

                    {/* Title Section */}
                    <div className="relative">
                        <div className="absolute -left-4 -top-4 w-20 h-20 bg-luxury-gold/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-center gap-6">
                            {Icon && (
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/5 to-black border border-white/10 flex items-center justify-center shadow-lg relative overflow-hidden">
                                    <div className="absolute inset-0 bg-luxury-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <Icon className="w-6 h-6 text-luxury-gold" />
                                </div>
                            )}

                            <div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 drop-shadow-lg">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-4 h-[1px] bg-luxury-gold/50" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-luxury-gold/60 gold-glow">
                                            {subtitle}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Right Side (Optional) */}
                <div className="hidden md:flex items-center gap-2 opacity-20">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-white/50" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                </div>
            </div>

            {/* Bottom Separator */}
            <div className="absolute -bottom-8 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
    );
}
