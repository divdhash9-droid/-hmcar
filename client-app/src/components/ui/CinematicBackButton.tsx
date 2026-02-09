"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface CinematicBackButtonProps {
    label?: string;
    className?: string; // Allow custom positioning if needed
}

export default function CinematicBackButton({ label, className = "" }: CinematicBackButtonProps) {
    const router = useRouter();
    const { isRTL } = useLanguage();

    const displayLabel = label || (isRTL ? "لوحة التحكم" : "Dashboard");

    return (
        <button
            onClick={() => router.push("/client/dashboard")}
            className={`
        group flex items-center gap-3 px-6 py-3
        rounded-2xl
        bg-black/40 border border-white/10 backdrop-blur-xl
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        hover:bg-cinematic-neon-blue/10 hover:border-cinematic-neon-blue/40 
        hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]
        active:scale-95
        text-white/70 hover:text-white
        z-50
        ${className}
      `}
            aria-label="Dashboard"
        >
            {isRTL ? (
                <>
                    <span className="text-xs font-black uppercase tracking-widest">{displayLabel}</span>
                    <LayoutDashboard className="w-4 h-4 text-cinematic-neon-blue transition-transform group-hover:rotate-12" />
                </>
            ) : (
                <>
                    <LayoutDashboard className="w-4 h-4 text-cinematic-neon-blue transition-transform group-hover:rotate-12" />
                    <span className="text-xs font-black uppercase tracking-widest">{displayLabel}</span>
                </>
            )}
        </button>
    );
}
