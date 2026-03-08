'use client';

/**
 * [[ARABIC_COMMENT]] صفحة حاسبة التمويل (Loan Calculator)
 * [[ARABIC_COMMENT]] تساعد العميل على حساب الأقساط الشهرية قبل الشراء
 * [[ARABIC_COMMENT]] تدعم العملات: SAR (ريال سعودي) و USD (دولار)
 * [[ARABIC_COMMENT]] المعادلة المستخدمة: معادلة القرض الثابتة (Fixed Rate Loan Formula)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calculator, DollarSign, Calendar, Percent,
    TrendingUp, ChevronDown, ChevronUp, Info,
    MessageCircle, ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/lib/LanguageContext';
import Link from 'next/link';

// [[ARABIC_COMMENT]] نوع نتيجة الحساسبة
interface LoanResult {
    monthlyPayment: number;  // القسط الشهري
    totalPayment: number;    // إجمالي المبلغ المدفوع
    totalInterest: number;   // إجمالي الفائدة
    downPayment: number;     // الدفعة الأولى
    loanAmount: number;      // مبلغ القرض الفعلي
    amortization: { month: number; principal: number; interest: number; balance: number }[];
}

export default function LoanCalculatorPage() {
    const { isRTL } = useLanguage();

    // [[ARABIC_COMMENT]] حالات النموذج
    const [carPrice, setCarPrice] = useState(150000);
    const [downPaymentPct, setDownPaymentPct] = useState(20);
    const [interestRate, setInterestRate] = useState(4.5);
    const [loanTerm, setLoanTerm] = useState(60); // بالأشهر
    const [currency, setCurrency] = useState<'SAR' | 'USD'>('SAR');
    const [showAmortization, setShowAmortization] = useState(false);
    const [result, setResult] = useState<LoanResult | null>(null);
    const [calculated, setCalculated] = useState(false);

    // [[ARABIC_COMMENT]] حساب القسط الشهري باستخدام المعادلة الأساسية للقرض
    const calculate = useCallback(() => {
        const downPayment = (carPrice * downPaymentPct) / 100;
        const loanAmount = carPrice - downPayment;
        const monthlyRate = interestRate / 100 / 12;
        const n = loanTerm;

        let monthlyPayment: number;
        if (interestRate === 0) {
            // [[ARABIC_COMMENT]] إذا كانت الفائدة صفر، القسط = مبلغ القرض / عدد الأشهر
            monthlyPayment = loanAmount / n;
        } else {
            // [[ARABIC_COMMENT]] معادلة القرض الثابتة: M = P * [r(1+r)^n] / [(1+r)^n - 1]
            monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
        }

        const totalPayment = monthlyPayment * n + downPayment;
        const totalInterest = totalPayment - carPrice;

        // [[ARABIC_COMMENT]] حساب جدول الاستهلاك الكامل (Amortization Schedule)
        const amortization = [];
        let balance = loanAmount;
        for (let month = 1; month <= n; month++) {
            const interestForMonth = balance * monthlyRate;
            const principalForMonth = monthlyPayment - interestForMonth;
            balance -= principalForMonth;
            amortization.push({
                month,
                principal: Math.max(0, principalForMonth),
                interest: Math.max(0, interestForMonth),
                balance: Math.max(0, balance)
            });
        }

        setResult({ monthlyPayment, totalPayment, totalInterest, downPayment, loanAmount, amortization });
        setCalculated(true);
    }, [carPrice, downPaymentPct, interestRate, loanTerm]);

    // [[ARABIC_COMMENT]] تنسيق العملة بناءً على الاختيار
    const fmt = (val: number) => {
        return `${val.toLocaleString('ar-SA', { maximumFractionDigits: 0 })} ${currency === 'SAR' ? 'ريال' : 'دولار'}`;
    };

    // [[ARABIC_COMMENT]] ترجمة مدد القروض
    const termOptions = [
        { value: 12, label: isRTL ? 'سنة واحدة' : '1 Year' },
        { value: 24, label: isRTL ? 'سنتان' : '2 Years' },
        { value: 36, label: isRTL ? '3 سنوات' : '3 Years' },
        { value: 48, label: isRTL ? '4 سنوات' : '4 Years' },
        { value: 60, label: isRTL ? '5 سنوات' : '5 Years' },
        { value: 72, label: isRTL ? '6 سنوات' : '6 Years' },
        { value: 84, label: isRTL ? '7 سنوات' : '7 Years' },
    ];

    return (
        <div
            className={`relative min-h-screen bg-black text-white overflow-x-hidden ${isRTL ? 'font-arabic' : ''}`}
            dir={isRTL ? 'rtl' : 'ltr'}
        >
            <Navbar />

            {/* [[ARABIC_COMMENT]] خلفية متحركة */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,169,110,0.08),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,240,255,0.04),transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-4 max-w-5xl mx-auto">

                {/* [[ARABIC_COMMENT]] العنوان الرئيسي */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-3 bg-[#c9a96e]/10 border border-[#c9a96e]/20 rounded-full px-5 py-2 mb-6">
                        <Calculator className="w-4 h-4 text-[#c9a96e]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#c9a96e]">
                            {isRTL ? 'أداة التخطيط المالي' : 'Financial Planning Tool'}
                        </span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">
                        {isRTL ? 'حاسبة' : 'LOAN'}
                        {' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#c9a96e] to-[#a07848]">
                            {isRTL ? 'التمويل' : 'CALCULATOR'}
                        </span>
                    </h1>
                    <p className="text-white/40 text-sm max-w-md mx-auto leading-relaxed">
                        {isRTL
                            ? 'احسب قسطك الشهري وخطط لميزانيتك قبل اتخاذ قرار الشراء'
                            : 'Calculate your monthly payment and plan your budget before making a purchase decision'}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* [[ARABIC_COMMENT]] نموذج الإدخال */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-black uppercase tracking-tight">
                                {isRTL ? 'بيانات التمويل' : 'Loan Details'}
                            </h2>
                            {/* [[ARABIC_COMMENT]] مبدّل العملة */}
                            <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                                {(['SAR', 'USD'] as const).map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${currency === c
                                            ? 'bg-[#c9a96e] text-black'
                                            : 'text-white/40 hover:text-white'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] سعر السيارة */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                                <span><DollarSign className="inline w-3 h-3 ml-1" />{isRTL ? 'سعر السيارة' : 'Car Price'}</span>
                                <span className="text-[#c9a96e]">{carPrice.toLocaleString()} {currency}</span>
                            </label>
                            <input
                                type="range"
                                min="10000" max="2000000" step="5000"
                                value={carPrice}
                                onChange={(e) => setCarPrice(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c9a96e]"
                            />
                            <div className="flex justify-between text-[9px] text-white/20">
                                <span>10,000</span>
                                <span>2,000,000</span>
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] نسبة الدفعة الأولى */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                                <span><Percent className="inline w-3 h-3 ml-1" />{isRTL ? 'الدفعة الأولى' : 'Down Payment'}</span>
                                <span className="text-[#c9a96e]">{downPaymentPct}% = {Math.round(carPrice * downPaymentPct / 100).toLocaleString()} {currency}</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="80" step="5"
                                value={downPaymentPct}
                                onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c9a96e]"
                            />
                            <div className="flex justify-between text-[9px] text-white/20">
                                <span>0%</span>
                                <span>80%</span>
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] معدل الفائدة السنوي */}
                        <div className="space-y-2">
                            <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
                                <span><TrendingUp className="inline w-3 h-3 ml-1" />{isRTL ? 'نسبة الفائدة السنوية' : 'Annual Interest Rate'}</span>
                                <span className="text-[#c9a96e]">{interestRate}%</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="20" step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#c9a96e]"
                            />
                            <div className="flex justify-between text-[9px] text-white/20">
                                <span>0% (بدون فائدة)</span>
                                <span>20%</span>
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] مدة القرض */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {isRTL ? 'مدة القرض' : 'Loan Term'}
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                                {termOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setLoanTerm(opt.value)}
                                        className={`py-2 rounded-xl text-[10px] font-black transition-all border ${loanTerm === opt.value
                                            ? 'bg-[#c9a96e] text-black border-[#c9a96e]'
                                            : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* [[ARABIC_COMMENT]] زر الحساب */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={calculate}
                            className="w-full py-4 bg-[#c9a96e] text-black font-black uppercase text-[13px] tracking-[0.3em] rounded-2xl shadow-[0_0_30px_rgba(201,169,110,0.3)] hover:shadow-[0_0_50px_rgba(201,169,110,0.5)] transition-all flex items-center justify-center gap-3"
                        >
                            <Calculator className="w-5 h-5" />
                            {isRTL ? 'احسب القسط الآن' : 'CALCULATE NOW'}
                        </motion.button>
                    </motion.div>

                    {/* [[ARABIC_COMMENT]] نتائج الحساب */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-6"
                    >
                        <AnimatePresence mode="wait">
                            {calculated && result ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    {/* [[ARABIC_COMMENT]] القسط الشهري - البطاقة الرئيسية */}
                                    <div className="bg-gradient-to-br from-[#c9a96e]/20 to-[#a07848]/10 border border-[#c9a96e]/30 rounded-3xl p-8 text-center">
                                        <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[#c9a96e]/60 mb-3">
                                            {isRTL ? 'القسط الشهري' : 'Monthly Payment'}
                                        </div>
                                        <div className="text-5xl font-black text-[#c9a96e] tracking-tighter">
                                            {Math.round(result.monthlyPayment).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-[#c9a96e]/60 mt-1 font-bold">{currency}</div>
                                    </div>

                                    {/* [[ARABIC_COMMENT]] تفاصيل التمويل */}
                                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 space-y-4">
                                        {[
                                            { label: isRTL ? 'سعر السيارة' : 'Car Price', val: fmt(carPrice), color: 'text-white' },
                                            { label: isRTL ? 'الدفعة الأولى' : 'Down Payment', val: fmt(result.downPayment), color: 'text-green-400' },
                                            { label: isRTL ? 'مبلغ القرض' : 'Loan Amount', val: fmt(result.loanAmount), color: 'text-blue-400' },
                                            { label: isRTL ? 'إجمالي الفوائد' : 'Total Interest', val: fmt(result.totalInterest), color: 'text-red-400' },
                                            { label: isRTL ? 'إجمالي المدفوعات' : 'Total Payments', val: fmt(result.totalPayment), color: 'text-[#c9a96e]' },
                                            { label: isRTL ? 'مدة القرض' : 'Loan Term', val: `${loanTerm} ${isRTL ? 'شهر' : 'months'}`, color: 'text-white' },
                                        ].map((row, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                                <span className="text-[11px] text-white/40 font-bold">{row.label}</span>
                                                <span className={`text-[13px] font-black ${row.color}`}>{row.val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* [[ARABIC_COMMENT]] نسبة الفائدة المرئية */}
                                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                                        <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-wider mb-3">
                                            <span>{isRTL ? 'القرض الأصلي' : 'Principal'}</span>
                                            <span>{isRTL ? 'الفائدة' : 'Interest'}</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#c9a96e] to-blue-400 rounded-full"
                                                style={{ width: `${(result.loanAmount / result.totalPayment) * 100}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-[10px] mt-2 text-white/30">
                                            <span>{Math.round((result.loanAmount / result.totalPayment) * 100)}%</span>
                                            <span>{Math.round((result.totalInterest / result.totalPayment) * 100)}%</span>
                                        </div>
                                    </div>

                                    {/* [[ARABIC_COMMENT]] جدول الاستهلاك */}
                                    <button
                                        onClick={() => setShowAmortization(!showAmortization)}
                                        className="w-full flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                                    >
                                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">
                                            {isRTL ? 'جدول الاستهلاك الكامل' : 'Full Amortization Schedule'}
                                        </span>
                                        {showAmortization ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                    </button>

                                    <AnimatePresence>
                                        {showAmortization && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden max-h-80 overflow-y-auto">
                                                    <table className="w-full text-[10px]">
                                                        <thead className="sticky top-0 bg-black/80 backdrop-blur-sm">
                                                            <tr className="border-b border-white/10">
                                                                <th className="p-3 text-right font-black text-white/40 uppercase tracking-widest">{isRTL ? 'الشهر' : 'Month'}</th>
                                                                <th className="p-3 text-right font-black text-white/40 uppercase tracking-widest">{isRTL ? 'أصل' : 'Principal'}</th>
                                                                <th className="p-3 text-right font-black text-white/40 uppercase tracking-widest">{isRTL ? 'فائدة' : 'Interest'}</th>
                                                                <th className="p-3 text-right font-black text-white/40 uppercase tracking-widest">{isRTL ? 'الرصيد' : 'Balance'}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {result.amortization.map((row) => (
                                                                <tr key={row.month} className="border-b border-white/5 hover:bg-white/[0.02]">
                                                                    <td className="p-3 font-bold text-white/60">{row.month}</td>
                                                                    <td className="p-3 font-bold text-blue-400">{Math.round(row.principal).toLocaleString()}</td>
                                                                    <td className="p-3 font-bold text-red-400">{Math.round(row.interest).toLocaleString()}</td>
                                                                    <td className="p-3 font-bold text-white/70">{Math.round(row.balance).toLocaleString()}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* [[ARABIC_COMMENT]] زر التواصل */}
                                    <Link href="/contact">
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-4 bg-green-500/10 border border-green-500/30 text-green-400 font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:bg-green-500/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            {isRTL ? 'تواصل مع فريقنا للتمويل' : 'Contact Our Finance Team'}
                                            <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    className="h-full min-h-[400px] bg-white/[0.02] border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-5 p-10 text-center"
                                >
                                    <div className="w-20 h-20 rounded-3xl bg-[#c9a96e]/10 border border-[#c9a96e]/20 flex items-center justify-center">
                                        <Calculator className="w-10 h-10 text-[#c9a96e]/40" />
                                    </div>
                                    <div>
                                        <div className="text-[13px] font-black uppercase tracking-[0.3em] text-white/30 mb-2">
                                            {isRTL ? 'أدخل البيانات واضغط احسب' : 'Enter details and calculate'}
                                        </div>
                                        <div className="text-[10px] text-white/15 leading-relaxed">
                                            {isRTL
                                                ? 'ستظهر النتائج هنا فور الحساب'
                                                : 'Results will appear here after calculation'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-[#c9a96e]/5 border border-[#c9a96e]/10 rounded-xl p-3">
                                        <Info className="w-3 h-3 text-[#c9a96e]/40 shrink-0" />
                                        <p className="text-[9px] text-white/25 leading-relaxed">
                                            {isRTL
                                                ? 'الحسابات تقريبية وللتخطيط فقط. يرجى التواصل معنا للحصول على عرض تمويل رسمي.'
                                                : 'Calculations are approximate for planning only. Contact us for an official financing offer.'}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
