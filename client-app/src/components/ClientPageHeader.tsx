'use client';

/**
 * ترويسة صفحات العملاء (Client Page Header)
 * مكون موحد يظهر في أعلى صفحات لوحة تحكم العميل، يحتوي على:
 * 1. زر العودة للخلف (Back Button).
 * 2. أيقونة الصفحة.
 * 3. العنوان الرئيسي والعنوان الفرعي.
 */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

interface ClientPageHeaderProps {
    title: string | React.ReactNode;
    subtitle?: string;
    icon?: LucideIcon;
}

export default function ClientPageHeader({ title, subtitle, icon: Icon }: ClientPageHeaderProps) {
    const router = useRouter();
    const { isRTL } = useLanguage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-5 py-8"
        >
            {/* زر العودة للخلف - يستخدم router.back() للرجوع للصفحة السابقة */}
            <button
                onClick={() => router.back()}
                className="group w-12 h-12 rounded-xl border border-white/8 bg-white/[0.02] backdrop-blur-md flex items-center justify-center hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/40"
                aria-label="Back"
            >
                {isRTL
                    ? <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                    : <ChevronLeft className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
                }
            </button>

            {/* Title Box */}
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="w-11 h-11 rounded-xl bg-accent-gold/10 border border-accent-gold/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-accent-gold" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-[-0.03em] uppercase leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.3em] mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
