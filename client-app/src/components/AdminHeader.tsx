'use client';

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";

interface AdminHeaderProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    actions?: React.ReactNode;
}

export default function AdminHeader({
    title,
    subtitle,
    backHref = '/admin/dashboard',
    actions
}: AdminHeaderProps) {
    const { isRTL } = useLanguage();

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    {/* زر الرجوع */}
                    <Link href={backHref}>
                        <motion.button
                            whileHover={{ scale: 1.05, x: isRTL ? 5 : -5 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-cinematic-neon-red/30 hover:bg-cinematic-neon-red/10 transition-all group shadow-xl"
                        >
                            <ArrowLeft className={cn(
                                "w-7 h-7 text-white/60 group-hover:text-cinematic-neon-red transition-colors",
                                isRTL && "rotate-180"
                            )} />
                        </motion.button>
                    </Link>

                    {/* العنوان */}
                    <div>
                        {subtitle && (
                            <div className="flex items-center gap-4 mb-3">
                                <div className="h-[3px] w-12 bg-cinematic-neon-red shadow-[0_0_15px_rgba(255,0,60,1)]" />
                                <span className="text-[11px] font-black uppercase tracking-[0.6em] text-cinematic-neon-red italic">
                                    {subtitle}
                                </span>
                            </div>
                        )}
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-none">
                            {title}
                        </h1>
                    </div>
                </div>

                {/* الإجراءات */}
                {actions && (
                    <div className="flex items-center gap-4">
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
}
