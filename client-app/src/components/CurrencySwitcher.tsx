'use client';

/**
 * مكون تبديل العملة (Currency Switcher)
 * يتيح للمستخدم تغيير العملة المعروضة في الموقع (ريال سعودي، دولار أمريكي، وون كوري).
 * يتفاعل مع SettingsContext لتحديث الأسعار في كافة أرجاء الموقع فوراً.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '@/lib/SettingsContext';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

interface CurrencySwitcherProps {
    className?: string;
    variant?: 'minimal' | 'full';
}

export default function CurrencySwitcher({ className, variant = 'full' }: CurrencySwitcherProps) {
    const { displayCurrency, setDisplayCurrency } = useSettings();
    const { isRTL } = useLanguage();
    const [isOpen, setIsOpen] = React.useState(false);

    // قائمة العملات المدعومة مع تسمياتها وألوانها الرمزية
    const currencies: { code: 'SAR' | 'USD' | 'KRW'; label: string; symbol: string; color: string }[] = [
        { code: 'SAR', label: isRTL ? 'ريال سعودي' : 'Saudi Riyal', symbol: 'ر.س', color: 'bg-emerald-500' },
        { code: 'USD', label: isRTL ? 'دولار أمريكي' : 'US Dollar', symbol: '$', color: 'bg-blue-500' },
        { code: 'KRW', label: isRTL ? 'وون كوري' : 'Korean Won', symbol: '₩', color: 'bg-purple-500' },
    ];

    const current = currencies.find(c => c.code === displayCurrency) || currencies[0];

    return (
        <div className={cn("relative z-30", className)} onMouseLeave={() => setIsOpen(false)}>
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all",
                    isOpen 
                        ? "bg-white/10 border-white/20 shadow-lg" 
                        : "bg-white/3 border-white/5 hover:bg-white/8 hover:border-white/15"
                )}
            >
                <div className={cn("w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-black", current.color)}>
                    {current.symbol}
                </div>
                {variant === 'full' && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                        {current.code}
                    </span>
                )}
                <ChevronDown className={cn("w-3 h-3 text-white/20 transition-transform", isOpen && "rotate-180")} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={cn(
                            "absolute top-full mt-2 min-w-40 bg-cinematic-dark border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-3xl overflow-hidden",
                            isRTL ? "right-0" : "left-0"
                        )}
                    >
                        {currencies.map((currency) => (
                            <button
                                key={currency.code}
                                onClick={() => {
                                    setDisplayCurrency(currency.code);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                                    displayCurrency === currency.code 
                                        ? "bg-white/10 text-white" 
                                        : "text-white/40 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-black transition-all",
                                    currency.color,
                                    displayCurrency === currency.code ? "scale-110 shadow-lg" : "opacity-40 group-hover:opacity-100"
                                )}>
                                    {currency.symbol}
                                </div>
                                <div className="flex flex-col items-start transition-transform group-hover:translate-x-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                        {currency.code}
                                    </span>
                                    <span className="text-[8px] font-medium text-white/30 truncate max-w-24">
                                        {currency.label}
                                    </span>
                                </div>
                                {displayCurrency === currency.code && (
                                    <motion.div layoutId="active-tick" className="ml-auto w-1 h-4 bg-accent-gold rounded-full" />
                                )}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
