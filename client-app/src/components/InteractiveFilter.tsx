"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Car, Calendar, Settings, ChevronDown, CheckCircle } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { cn } from "@/lib/utils";

export default function InteractiveFilter() {
    const { isRTL } = useLanguage();
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ brand: "", model: "", year: "" });
    const [isComplete, setIsComplete] = useState(false);

    // Mock Data
    const brands = ["Toyota", "Hyundai", "Kia", "Mercedes", "BMW", "Lexus", "Honda", "Nissan"];
    const models = ["Camry", "Land Cruiser", "Accent", "Sonata", "Elantra", "S-Class", "X5", "LX570"];
    const years = Array.from({ length: 15 }, (_, i) => (2024 - i).toString());

    const handleSelect = (key: string, value: string) => {
        setSelection({ ...selection, [key]: value });
        if (step < 3) setStep(step + 1);
        else setIsComplete(true);
    };

    const reset = () => {
        setStep(1);
        setSelection({ brand: "", model: "", year: "" });
        setIsComplete(false);
    };

    return (
        <section className="relative py-16 md:py-32 overflow-hidden bg-black/40 backdrop-blur-2xl">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#c9a96e]/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 text-white">
                        {isRTL ? "توافق ذكي" : "Smart Compatibility"}
                    </h2>
                    <p className="text-white/40 text-lg">
                        {isRTL ? "اختر سيارتك لنعرض لك القطع المتوافقة فقط" : "Select your car to see only compatible parts"}
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Progress Bar */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-1 bg-white/5 rounded-full -z-10">
                        <motion.div
                            className="h-full bg-[#c9a96e] rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${((step - 1) / 2) * 100}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Step 1: Brand */}
                        <FilterCard
                            isActive={step === 1}
                            isCompleted={step > 1}
                            title={isRTL ? "الماركة" : "Brand"}
                            value={selection.brand}
                            icon={Car}
                            options={brands}
                            onSelect={(val: string) => handleSelect("brand", val)}
                            onEdit={() => setStep(1)}
                            isRTL={isRTL}
                        />

                        {/* Step 2: Model */}
                        <FilterCard
                            isActive={step === 2}
                            isCompleted={step > 2}
                            disabled={step < 2}
                            title={isRTL ? "الموديل" : "Model"}
                            value={selection.model}
                            icon={Settings}
                            options={models}
                            onSelect={(val: string) => handleSelect("model", val)}
                            onEdit={() => setStep(2)}
                            isRTL={isRTL}
                        />

                        {/* Step 3: Year */}
                        <FilterCard
                            isActive={step === 3}
                            isCompleted={isComplete}
                            disabled={step < 3}
                            title={isRTL ? "السنة" : "Year"}
                            value={selection.year}
                            icon={Calendar}
                            options={years}
                            onSelect={(val: string) => handleSelect("year", val)}
                            onEdit={() => setStep(3)}
                            isRTL={isRTL}
                        />
                    </div>
                </div>

                {/* Result Area */}
                <AnimatePresence>
                    {isComplete && (
                        <motion.div
                            initial={{ opacity: 0, y: 30, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-12 text-center"
                        >
                            <div className="p-8 rounded-3xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 backdrop-blur-xl">
                                <CheckCircle className="w-16 h-16 text-[#c9a96e] mx-auto mb-6" />
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    {isRTL ? "تم تخصيص المتجر لك!" : "Store Personalized for You!"}
                                </h3>
                                <p className="text-white/60 mb-8">
                                    {isRTL
                                        ? `نعرض الآن قطع غيار متوافقة مع ${selection.brand} ${selection.model} ${selection.year}`
                                        : `Showing parts compatible with ${selection.brand} ${selection.model} ${selection.year}`
                                    }
                                </p>
                                <div className="flex gap-4 justify-center">
                                    <button className="px-8 py-3 bg-[#c9a96e] text-black font-bold rounded-xl hover:bg-[#d4b57d] transition-colors">
                                        {isRTL ? "تصفح القطع" : "Browse Parts"}
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-8 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        {isRTL ? "تغيير السيارة" : "Change Car"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

function FilterCard({ isActive, isCompleted, disabled, title, value, icon: Icon, options, onSelect, onEdit, isRTL }: any) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            className={cn(
                "relative p-6 rounded-3xl border transition-all duration-300",
                isActive ? "bg-[#c9a96e] border-[#c9a96e] shadow-[0_0_30px_rgba(201,169,110,0.2)] scale-105 z-10" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]",
                disabled && "opacity-30 pointer-events-none grayscale",
                isCompleted && "bg-[#1a1a1a] border-[#c9a96e]/50"
            )}
            onClick={() => {
                if (!disabled && !isActive) onEdit();
                if (isActive) setIsOpen(!isOpen);
            }}
        >
            <div className="flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        isActive ? "bg-black/20 text-white" : "bg-white/10 text-white/50",
                        isCompleted && "bg-[#c9a96e]/20 text-[#c9a96e]"
                    )}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className={cn("text-xs uppercase tracking-wider font-bold", isActive ? "text-black/60" : "text-white/40")}>{title}</span>
                        <div className={cn("text-lg font-bold", isActive ? "text-black" : "text-white")}>
                            {value || (isRTL ? "اختر..." : "Select...")}
                        </div>
                    </div>
                </div>
                <ChevronDown className={cn("w-5 h-5 transition-transform", isOpen && "rotate-180", isActive ? "text-black" : "text-white/30")} />
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && isActive && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-full left-0 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-20 max-h-60 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {options.map((opt: string) => (
                            <div
                                key={opt}
                                onClick={() => {
                                    onSelect(opt);
                                    setIsOpen(false);
                                }}
                                className="px-6 py-3 hover:bg-[#c9a96e] hover:text-black text-white/70 cursor-pointer transition-colors border-b border-white/5 last:border-none"
                            >
                                {opt}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
