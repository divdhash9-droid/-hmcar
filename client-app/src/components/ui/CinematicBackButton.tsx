"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface CinematicBackButtonProps {
    label?: string;
    className?: string; // Allow custom positioning if needed
}

export default function CinematicBackButton({ label, className = "" }: CinematicBackButtonProps) {
    const router = useRouter();
    const { isRTL, t } = useLanguage();

    const displayLabel = label || t('back');

    return (
        <button
            onClick={() => router.back()}
            className={`p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all ${className}`}
            aria-label={isRTL ? displayLabel : 'Back'}
        >
            {isRTL ? (
                <ArrowRight className="w-5 h-5" />
            ) : (
                <ArrowLeft className="w-5 h-5" />
            )}
        </button>
    );
}
