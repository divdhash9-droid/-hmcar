'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell, Plus, Trash2, Edit3, ChevronLeft, ChevronRight,
    Zap, Target, Check, X, AlertCircle, ToggleLeft, ToggleRight,
    Filter, Sparkles, Clock, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// ===================== Types =====================
interface SmartAlertCriteria {
    make?: string;
    model?: string;
    yearMin?: number | null;
    yearMax?: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    fuelType?: string;
    transmission?: string;
    category?: string;
    condition?: string;
    listingType?: string;
}

interface SmartAlert {
    _id: string;
    name: string;
    isActive: boolean;
    criteria: SmartAlertCriteria;
    channels: { inApp: boolean; email: boolean };
    frequency: 'immediate' | 'daily';
    triggerCount: number;
    lastTriggeredAt?: string;
    createdAt: string;
}

interface FormData extends SmartAlertCriteria {
    name: string;
    inApp: boolean;
    email: boolean;
    frequency: 'immediate' | 'daily';
}

const EMPTY_FORM: FormData = {
    name: '',
    make: '',
    model: '',
    yearMin: null,
    yearMax: null,
    priceMin: null,
    priceMax: null,
    fuelType: '',
    transmission: '',
    category: '',
    condition: '',
    listingType: '',
    inApp: true,
    email: false,
    frequency: 'immediate'
};

// ===================== Form Field Components =====================
type FieldSetter = (key: keyof FormData, value: string | boolean | number | null) => void;

const InputField = ({ label, field, type = 'text', placeholder = '', form, set }: {
    label: string; field: keyof FormData; type?: string; placeholder?: string;
    form: FormData; set: FieldSetter;
}) => (
    <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-2">{label}</label>
        <input
            type={type}
            value={(form[field] as string) || ''}
            onChange={e => set(field, type === 'number' ? (e.target.value ? +e.target.value : null) : e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-400/40 transition-all placeholder:text-white/20"
        />
    </div>
);

const SelectField = ({ label, field, options, form, set, isRTL }: {
    label: string; field: keyof FormData;
    options: { value: string; label: string }[];
    form: FormData; set: FieldSetter;
    isRTL: boolean;
}) => (
    <div>
        <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-2">{label}</label>
        <select
            value={(form[field] as string) || ''}
            onChange={e => set(field, e.target.value)}
            aria-label={label}
            title={label}
            className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-cyan-400/40 transition-all"
        >
            <option value="">— {isRTL ? 'الكل' : 'Any'} —</option>
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

const ToggleField = ({ field, label, color = 'bg-cyan-400', form, set }: { 
    field: 'inApp' | 'email'; label: string; color?: string;
    form: FormData; set: FieldSetter;
}) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <span className="text-[11px] font-bold text-white/60">{label}</span>
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={() => set(field, !form[field])}
            className={cn(
                "w-11 h-6 rounded-full transition-all relative",
                form[field] ? `${color} shadow-[0_0_12px_rgba(0,240,255,0.3)]` : "bg-white/10"
            )}
        >
            <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                form[field] ? "left-6" : "left-1"
            )} />
        </button>
    </div>
);

// ===================== Badge Component =====================
const CriteriaBadge = ({ label, value }: { label: string; value?: string | number | null }) => {
    if (!value && value !== 0) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-white/60">
            <span className="text-white/30">{label}:</span>
            <span className="text-white/80">{value}</span>
        </span>
    );
};

// ===================== Modal Component =====================
const AlertModal = ({
    open, onClose, onSave, initial, isRTL, loading
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: FormData) => Promise<void>;
    initial?: SmartAlert | null;
    isRTL: boolean;
    loading: boolean;
}) => {
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            if (initial) {
                // eslint-disable-next-line
                setForm({
                    name: initial.name,
                    make: initial.criteria.make || '',
                    model: initial.criteria.model || '',
                    yearMin: initial.criteria.yearMin || null,
                    yearMax: initial.criteria.yearMax || null,
                    priceMin: initial.criteria.priceMin || null,
                    priceMax: initial.criteria.priceMax || null,
                    fuelType: initial.criteria.fuelType || '',
                    transmission: initial.criteria.transmission || '',
                    category: initial.criteria.category || '',
                    condition: initial.criteria.condition || '',
                    listingType: initial.criteria.listingType || '',
                    inApp: initial.channels?.inApp !== false,
                    email: initial.channels?.email === true,
                    frequency: initial.frequency || 'immediate'
                });
            } else {
                setForm(EMPTY_FORM);
            }
            setError('');
        }
    }, [open, initial]);

    const set: FieldSetter = (key, value) => setForm(p => ({ ...p, [key]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await onSave(form);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'حدث خطأ');
            } else {
                setError('حدث خطأ');
            }
        }
    };

    if (!open) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="relative w-full max-w-2xl bg-[#09090f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative p-8 border-b border-white/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-violet-500/5" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
                                    <Target className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-white text-lg">
                                        {initial
                                            ? (isRTL ? 'تعديل التنبيه' : 'Edit Alert')
                                            : (isRTL ? 'تنبيه ذكي جديد' : 'New Smart Alert')}
                                    </h3>
                                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">
                                        {isRTL ? 'حدد معايير السيارة التي تبحث عنها' : 'Set your car search criteria'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} aria-label="إغلاق" title="إغلاق" className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[65vh] overflow-y-auto">
                        {/* Alert Name */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400/70 mb-2">
                                {isRTL ? 'اسم التنبيه *' : 'Alert Name *'}
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => set('name', e.target.value)}
                                placeholder={isRTL ? 'مثال: أبحث عن تويوتا كورولا' : 'e.g. Looking for Toyota Corolla'}
                                required
                                className="w-full bg-cyan-400/5 border border-cyan-400/20 rounded-xl px-4 py-3.5 text-sm text-white font-medium focus:outline-none focus:border-cyan-400/50 transition-all placeholder:text-white/20"
                            />
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                <Filter className="w-3 h-3" />
                                {isRTL ? 'معايير البحث' : 'Search Criteria'}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        {/* Make & Model */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={isRTL ? 'الماركة' : 'Make'} field="make" placeholder="Toyota, BMW..." form={form} set={set} />
                            <InputField label={isRTL ? 'الموديل' : 'Model'} field="model" placeholder="Corolla, X5..." form={form} set={set} />
                        </div>

                        {/* Year Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={isRTL ? 'سنة من' : 'Year From'} field="yearMin" type="number" placeholder="2018" form={form} set={set} />
                            <InputField label={isRTL ? 'سنة إلى' : 'Year To'} field="yearMax" type="number" placeholder="2024" form={form} set={set} />
                        </div>

                        {/* Price Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label={isRTL ? 'السعر من (ر.س)' : 'Price From (SAR)'} field="priceMin" type="number" placeholder="50000" form={form} set={set} />
                            <InputField label={isRTL ? 'السعر إلى (ر.س)' : 'Price To (SAR)'} field="priceMax" type="number" placeholder="200000" form={form} set={set} />
                        </div>

                        {/* Dropdowns */}
                        <div className="grid grid-cols-2 gap-4">
                            <SelectField label={isRTL ? 'نوع الوقود' : 'Fuel Type'} field="fuelType" options={[
                                { value: 'Petrol', label: isRTL ? 'بنزين' : 'Petrol' },
                                { value: 'Diesel', label: isRTL ? 'ديزل' : 'Diesel' },
                                { value: 'Electric', label: isRTL ? 'كهربائي' : 'Electric' },
                                { value: 'Hybrid', label: isRTL ? 'هجين' : 'Hybrid' },
                            ]} form={form} set={set} isRTL={isRTL} />
                            <SelectField label={isRTL ? 'ناقل الحركة' : 'Transmission'} field="transmission" options={[
                                { value: 'Automatic', label: isRTL ? 'أوتوماتيك' : 'Automatic' },
                                { value: 'Manual', label: isRTL ? 'يدوي' : 'Manual' },
                            ]} form={form} set={set} isRTL={isRTL} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <SelectField label={isRTL ? 'الفئة' : 'Category'} field="category" options={[
                                { value: 'sedan', label: isRTL ? 'سيدان' : 'Sedan' },
                                { value: 'suv', label: 'SUV' },
                                { value: 'truck', label: isRTL ? 'شاحنة' : 'Truck' },
                                { value: 'coupe', label: 'Coupe' },
                                { value: 'van', label: 'Van' },
                            ]} form={form} set={set} isRTL={isRTL} />
                            <SelectField label={isRTL ? 'الحالة' : 'Condition'} field="condition" options={[
                                { value: 'excellent', label: isRTL ? 'ممتازة' : 'Excellent' },
                                { value: 'good', label: isRTL ? 'جيدة' : 'Good' },
                                { value: 'fair', label: isRTL ? 'مقبولة' : 'Fair' },
                            ]} form={form} set={set} isRTL={isRTL} />
                        </div>

                        <SelectField label={isRTL ? 'نوع الإعلان' : 'Listing Type'} field="listingType" options={[
                            { value: 'store', label: isRTL ? 'معرض' : 'Store' },
                            { value: 'auction', label: isRTL ? 'مزاد' : 'Auction' },
                        ]} form={form} set={set} isRTL={isRTL} />

                        {/* Divider */}
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2">
                                <Bell className="w-3 h-3" />
                                {isRTL ? 'قنوات التنبيه' : 'Alert Channels'}
                            </span>
                            <div className="flex-1 h-px bg-white/5" />
                        </div>

                        <div className="space-y-3">
                            <ToggleField field="inApp" label={isRTL ? '🔔 إشعار داخل التطبيق' : '🔔 In-App Notification'} color="bg-cyan-400" form={form} set={set} />
                            <ToggleField field="email" label={isRTL ? '📧 إشعار عبر البريد الإلكتروني' : '📧 Email Notification'} color="bg-violet-400" form={form} set={set} />
                        </div>

                        {/* Frequency */}
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-3">
                                {isRTL ? 'تكرار الإشعار' : 'Notification Frequency'}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'immediate', label: isRTL ? '⚡ فوري' : '⚡ Immediate', sub: isRTL ? 'تنبيه فور إضافة سيارة' : 'Alert when car is added' },
                                    { value: 'daily', label: isRTL ? '📅 يومي' : '📅 Daily', sub: isRTL ? 'ملخص يومي' : 'Daily summary' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('frequency', opt.value)}
                                        className={cn(
                                            "p-4 rounded-xl border text-left transition-all",
                                            form.frequency === opt.value
                                                ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-400"
                                                : "border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10"
                                        )}
                                    >
                                        <div className="text-[12px] font-black">{opt.label}</div>
                                        <div className="text-[10px] opacity-60 mt-0.5">{opt.sub}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 text-[11px] font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}
                    </form>

                    {/* Footer */}
                    <div className="p-8 pt-0 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 rounded-xl border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                        >
                            {isRTL ? 'إلغاء' : 'Cancel'}
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-4 rounded-xl bg-cyan-400 text-black text-[11px] font-black uppercase tracking-widest shadow-[0_0_30px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                    className="w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    {initial ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'إنشاء التنبيه' : 'Create Alert')}
                                </>
                            )}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ===================== Alert Card =====================
const AlertCard = ({
    alert, onToggle, onEdit, onDelete, isRTL
}: {
    alert: SmartAlert;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    isRTL: boolean;
}) => {
    const { criteria } = alert;

    const formatDate = (d?: string) => {
        if (!d) return null;
        return new Date(d).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
                "relative group rounded-2xl border p-6 transition-all duration-300",
                alert.isActive
                    ? "border-cyan-400/20 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-white/[0.03]"
                    : "border-white/5 bg-white/[0.01] opacity-60"
            )}
        >
            {/* Active glow */}
            {alert.isActive && (
                <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-cyan-400/5 to-violet-400/5" />
            )}

            <div className="relative">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                            "p-2.5 rounded-xl shrink-0 transition-colors",
                            alert.isActive ? "bg-cyan-400/10 text-cyan-400" : "bg-white/5 text-white/20"
                        )}>
                            <Target className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-black text-white text-[13px] truncate">{alert.name}</h3>
                            <div className="flex items-center gap-3 mt-0.5">
                                <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                    alert.isActive
                                        ? "bg-cyan-400/10 text-cyan-400"
                                        : "bg-white/5 text-white/20"
                                )}>
                                    {alert.isActive ? (isRTL ? 'نشط' : 'ACTIVE') : (isRTL ? 'متوقف' : 'PAUSED')}
                                </span>
                                <span className="text-[9px] text-white/20 uppercase font-bold tracking-widest">
                                    {alert.frequency === 'immediate' ? (isRTL ? 'فوري' : 'INSTANT') : (isRTL ? 'يومي' : 'DAILY')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={onToggle}
                            className={cn(
                                "p-2 rounded-xl transition-all",
                                alert.isActive
                                    ? "text-cyan-400 hover:bg-cyan-400/10"
                                    : "text-white/20 hover:bg-white/5 hover:text-white/40"
                            )}
                            title={alert.isActive ? 'إيقاف' : 'تفعيل'}
                        >
                            {alert.isActive
                                ? <ToggleRight className="w-5 h-5" />
                                : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all"
                            title="تعديل"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title="حذف"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Criteria Badges */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    <CriteriaBadge label={isRTL ? 'ماركة' : 'Make'} value={criteria.make} />
                    <CriteriaBadge label={isRTL ? 'موديل' : 'Model'} value={criteria.model} />
                    <CriteriaBadge label={isRTL ? 'السنة' : 'Year'} value={
                        criteria.yearMin && criteria.yearMax
                            ? `${criteria.yearMin} - ${criteria.yearMax}`
                            : criteria.yearMin || criteria.yearMax
                    } />
                    <CriteriaBadge label={isRTL ? 'السعر' : 'Price'} value={
                        criteria.priceMin && criteria.priceMax
                            ? `${criteria.priceMin?.toLocaleString()} - ${criteria.priceMax?.toLocaleString()}`
                            : criteria.priceMin
                                ? `${criteria.priceMin?.toLocaleString()}+`
                                : criteria.priceMax
                                    ? `≤ ${criteria.priceMax?.toLocaleString()}`
                                    : null
                    } />
                    <CriteriaBadge label={isRTL ? 'وقود' : 'Fuel'} value={criteria.fuelType} />
                    <CriteriaBadge label={isRTL ? 'ناقل' : 'Trans'} value={criteria.transmission} />
                    <CriteriaBadge label={isRTL ? 'فئة' : 'Cat'} value={criteria.category} />
                    <CriteriaBadge label={isRTL ? 'حالة' : 'Cond'} value={criteria.condition} />
                    <CriteriaBadge label={isRTL ? 'نوع' : 'Type'} value={criteria.listingType} />
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-white/30">
                        <Zap className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                            {alert.triggerCount} {isRTL ? 'إشعار' : 'alerts'}
                        </span>
                    </div>
                    {alert.lastTriggeredAt && (
                        <div className="flex items-center gap-1.5 text-white/30">
                            <Clock className="w-3 h-3" />
                            <span className="text-[10px] font-bold">
                                {isRTL ? 'آخر إشعار:' : 'Last:'} {formatDate(alert.lastTriggeredAt)}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 text-white/20 mr-auto">
                        {alert.channels?.inApp && <span title="In-App">🔔</span>}
                        {alert.channels?.email && <span title="Email">📧</span>}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// ===================== Main Page =====================
export default function SmartAlertsPage() {
    const router = useRouter();
    const { isRTL } = useLanguage();
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, totalTriggers: 0 });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editAlert, setEditAlert] = useState<SmartAlert | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [alertsRes, statsRes] = await Promise.all([
                api.smartAlerts.list(),
                api.smartAlerts.stats()
            ]);
            setAlerts(alertsRes.data || []);
            setStats(statsRes.data || { total: 0, active: 0, totalTriggers: 0 });
        } catch {
            showToast(isRTL ? 'تعذّر تحميل التنبيهات' : 'Failed to load alerts', 'error');
        } finally {
            setLoading(false);
        }
    }, [isRTL]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (form: FormData) => {
        setSaving(true);
        try {
            if (editAlert) {
                await api.smartAlerts.update(editAlert._id, {
                    name: form.name,
                    frequency: form.frequency,
                    channels: { inApp: form.inApp, email: form.email },
                    criteria: {
                        make: form.make, model: form.model,
                        yearMin: form.yearMin, yearMax: form.yearMax,
                        priceMin: form.priceMin, priceMax: form.priceMax,
                        fuelType: form.fuelType, transmission: form.transmission,
                        category: form.category, condition: form.condition,
                        listingType: form.listingType
                    }
                });
                showToast(isRTL ? '✓ تم تحديث التنبيه' : '✓ Alert updated');
            } else {
                await api.smartAlerts.create(form);
                showToast(isRTL ? '✓ تم إنشاء التنبيه الذكي!' : '✓ Smart alert created!');
            }
            setModalOpen(false);
            setEditAlert(null);
            await loadData();
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            const res = await api.smartAlerts.toggle(id);
            setAlerts(prev => prev.map(a => a._id === id ? { ...a, isActive: res.data.isActive } : a));
            showToast(res.message || (isRTL ? 'تم التحديث' : 'Updated'));
        } catch {
            showToast(isRTL ? 'حدث خطأ' : 'Error occurred', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.smartAlerts.delete(id);
            setAlerts(prev => prev.filter(a => a._id !== id));
            showToast(isRTL ? '✓ تم حذف التنبيه' : '✓ Alert deleted');
            setDeleteConfirm(null);
            await loadData();
        } catch {
            showToast(isRTL ? 'حدث خطأ في الحذف' : 'Delete error', 'error');
        }
    };

    return (
        <div className="relative min-h-screen text-white font-sans" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.04),_transparent_60%)]" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-violet-500/5 blur-3xl" />
                <div className="absolute bottom-1/3 left-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
            </div>

            <main className="relative z-10 pt-6 pb-8 px-5 lg:px-8 max-w-4xl">

                {/* Back */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-10">
                    <button
                        onClick={() => router.back()}
                        title={isRTL ? 'رجوع' : 'Back'}
                        aria-label={isRTL ? 'رجوع' : 'Back'}
                        className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group"
                    >
                        {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
                    </button>
                </motion.div>

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="p-4 rounded-2xl bg-cyan-400/10 border border-cyan-400/20">
                                    <Sparkles className="w-8 h-8 text-cyan-400" />
                                </div>
                                <motion.div
                                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400"
                                />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
                                    {isRTL ? 'تنبيهاتي الذكية' : 'Smart Alerts'}
                                </h1>
                                <p className="text-white/30 text-[11px] uppercase tracking-[0.3em] mt-1 font-bold">
                                    {isRTL ? 'احصل على إشعار فور توفر سيارة مناسبة لك' : 'Get notified the moment your dream car arrives'}
                                </p>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0,240,255,0.4)' }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setEditAlert(null); setModalOpen(true); }}
                            disabled={stats.total >= 10}
                            className="flex items-center gap-3 px-7 py-4 bg-cyan-400 text-black font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-5 h-5" />
                            {isRTL ? 'تنبيه جديد' : 'New Alert'}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-4 mb-10"
                >
                    {[
                        { label: isRTL ? 'إجمالي التنبيهات' : 'Total Alerts', value: stats.total, max: 10, icon: Target, color: 'text-white' },
                        { label: isRTL ? 'التنبيهات النشطة' : 'Active Alerts', value: stats.active, icon: Zap, color: 'text-cyan-400' },
                        { label: isRTL ? 'إجمالي الإشعارات' : 'Total Fired', value: stats.totalTriggers, icon: TrendingUp, color: 'text-violet-400' },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                            className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <s.icon className={cn("w-4 h-4", s.color)} />
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <div className={cn("text-3xl font-black", s.color)}>
                                {s.value}
                                {s.max && <span className="text-white/20 text-lg">/{s.max}</span>}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Limit warning */}
                {stats.total >= 10 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="mb-6 p-4 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-[11px] font-bold text-amber-400">
                            {isRTL ? 'وصلت إلى الحد الأقصى (10 تنبيهات). احذف تنبيهاً لإضافة جديد.' : 'Maximum limit reached (10 alerts). Delete one to add more.'}
                        </span>
                    </motion.div>
                )}

                {/* Alerts List */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full"
                        />
                    </div>
                ) : alerts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="text-center py-24"
                    >
                        <div className="w-24 h-24 rounded-3xl bg-cyan-400/5 border border-cyan-400/10 flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-10 h-10 text-cyan-400/30" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-3">
                            {isRTL ? 'لا توجد تنبيهات بعد' : 'No Smart Alerts Yet'}
                        </h3>
                        <p className="text-white/30 text-[12px] font-bold mb-8 max-w-sm mx-auto">
                            {isRTL
                                ? 'أنشئ تنبيهاً ذكياً وسنخبرك عند توفر السيارة التي تبحث عنها'
                                : 'Create a smart alert and we\'ll notify you the moment your dream car is listed'}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setModalOpen(true)}
                            className="px-8 py-4 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:bg-cyan-400/20 transition-all flex items-center gap-3 mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            {isRTL ? 'إنشاء أول تنبيه' : 'Create First Alert'}
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {alerts.map(alert => (
                                <AlertCard
                                    key={alert._id}
                                    alert={alert}
                                    isRTL={isRTL}
                                    onToggle={() => handleToggle(alert._id)}
                                    onEdit={() => { setEditAlert(alert); setModalOpen(true); }}
                                    onDelete={() => setDeleteConfirm(alert._id)}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Modal */}
            <AlertModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditAlert(null); }}
                onSave={handleSave}
                initial={editAlert}
                isRTL={isRTL}
                loading={saving}
            />

            {/* Delete Confirm Dialog */}
            <AnimatePresence>
                {deleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={() => setDeleteConfirm(null)}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative bg-[#09090f] border border-red-400/20 rounded-2xl p-8 max-w-sm w-full text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-5">
                                <Trash2 className="w-6 h-6 text-red-400" />
                            </div>
                            <h3 className="font-black text-white text-lg mb-2">
                                {isRTL ? 'حذف التنبيه؟' : 'Delete Alert?'}
                            </h3>
                            <p className="text-white/30 text-[12px] mb-7">
                                {isRTL ? 'لن يمكنك التراجع عن هذا الإجراء' : 'This action cannot be undone'}
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3.5 rounded-xl border border-white/10 text-white/40 text-[11px] font-black uppercase hover:bg-white/5 transition-all"
                                >
                                    {isRTL ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    className="flex-1 py-3.5 rounded-xl bg-red-400/10 border border-red-400/30 text-red-400 text-[11px] font-black uppercase hover:bg-red-400/20 transition-all"
                                >
                                    {isRTL ? 'حذف' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className={cn(
                            "fixed bottom-8 left-1/2 z-[100] px-6 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2",
                            toast.type === 'success'
                                ? "bg-cyan-400 text-black shadow-[0_0_30px_rgba(0,240,255,0.4)]"
                                : "bg-red-400 text-white shadow-[0_0_30px_rgba(248,113,113,0.4)]"
                        )}
                    >
                        {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
