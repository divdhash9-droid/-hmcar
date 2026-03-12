'use client';

/**
 * مكوّن نموذج السيارة - CarModal
 * يعرض نافذة منبثقة لإضافة سيارة جديدة أو تعديل سيارة موجودة
 * يشمل: رفع الصور، بيانات السيارة، تحويل الأسعار بين العملات
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Upload, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ── نوع بيانات النموذج ──
interface FormData {
    title: string;
    make: string;
    model: string;
    year: number;
    price: number;
    usdPrice: number;
    krwPrice: number;
    category: string;
    images: string[];
    description: string;
    mileage: number;
    fuelType: string;
    transmission: string;
    color: string;
    isActive: boolean;
    displayCurrency: string;
    listingType: string;
    source: 'hm_local' | 'korean_import';
    agency: string;
}

// ── خصائص المكوّن ──
interface CarModalProps {
    isOpen: boolean;
    isEditing: boolean;
    formData: FormData;
    submitting: boolean;
    usdToSar: number;
    usdToKrw: number;
    brands: { _id: string; name: string }[];
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onFormChange: (data: FormData) => void;
    onPriceChange: (field: 'sar' | 'usd' | 'krw', value: string) => void;
}

export default function CarModal({
    isOpen, isEditing, formData, submitting,
    usdToSar, usdToKrw, brands,
    onClose, onSubmit, onFormChange, onPriceChange
}: CarModalProps) {
    const { isRTL } = useLanguage();

    // دالة تحديث حقل واحد في النموذج
    const update = (field: keyof FormData, value: unknown) =>
        onFormChange({ ...formData, [field]: value });

    // دالة رفع الصورة إلى الخادم
    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        for (const file of Array.from(files)) {
            const data = new FormData();
            data.append('image', file);
            try {
                const res = await api.upload.image(data);
                if (res.success) {
                    // إضافة الرابط الجديد إلى قائمة الصور
                    onFormChange({
                        ...formData,
                        images: [...formData.images.filter(img => img), res.url]
                    });
                }
            } catch (err) {
                console.error('فشل رفع الصورة:', err);
            }
        }
    };

    // دالة حذف صورة من القائمة
    const removeImage = (index: number) => {
        const newImages = formData.images.filter(i => i);
        newImages.splice(index, 1);
        update('images', newImages.length > 0 ? newImages : ['']);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    // إغلاق عند النقر على الخلفية
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        onClick={e => e.stopPropagation()} // منع إغلاق النموذج عند النقر داخله
                        className="glass-card bg-black/90 border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto ck-scroll"
                    >
                        {/* رأس النافذة */}
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black uppercase italic tracking-tight">
                                {isEditing ? (isRTL ? 'تعديل سيارة' : 'EDIT CAR') : (isRTL ? 'إضافة سيارة' : 'ADD CAR')}
                            </h2>
                            <button onClick={onClose} aria-label="إغلاق" className="p-2 hover:bg-white/5 rounded-lg transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* ── النموذج ── */}
                        <form onSubmit={onSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">

                                {/* ── رفع الصور ── */}
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                        {isRTL ? 'صور السيارة' : 'CAR IMAGES'}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-4">
                                        {/* عرض الصور الموجودة */}
                                        {formData.images.filter(img => img).map((img, index) => (
                                            <div key={index} className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                                                <Image src={img} alt={`معاينة ${index + 1}`} fill unoptimized className="object-cover" />
                                                {/* زر حذف الصورة */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        {/* زر إضافة صورة جديدة */}
                                        <div className="relative w-24 h-24 bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-cinematic-neon-blue/50 transition-colors">
                                            <Upload className="w-6 h-6 text-white/20 mb-1" />
                                            <span className="text-[8px] text-white/40 uppercase tracking-widest">{isRTL ? 'إضافة' : 'ADD'}</span>
                                            <input
                                                type="file"
                                                title="رفع صورة"
                                                accept="image/*"
                                                multiple
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={e => handleImageUpload(e.target.files)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ── حقل الاسم ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الاسم' : 'NAME'}</label>
                                    <input type="text" required value={formData.title}
                                        onChange={e => update('title', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40" />
                                </div>

                                {/* ── حقل الماركة ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الماركة' : 'BRAND'}</label>
                                    <select value={formData.make} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            update('make', val);
                                            // If selecting a brand that exists in agencies, maybe auto-link? 
                                            // But usually we do it via Agency select.
                                        }}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40">
                                        <option value="">{isRTL ? 'اختر الماركة' : 'Select Brand'}</option>
                                        {brands.map(b => <option key={b._id} value={b.name}>{b.name}</option>)}
                                        {/* إضافة الماركة الحالية إذا لم تكن في القائمة */}
                                        {!brands.some(b => b.name === formData.make) && formData.make && (
                                            <option value={formData.make}>{formData.make}</option>
                                        )}
                                    </select>
                                </div>

                                {/* ── حقل الوكالة (اختياري للمحلي) ── */}
                                {formData.source === 'hm_local' && (
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الوكالة المعتمدة (اختياري)' : 'OFFICIAL AGENCY (OPTIONAL)'}</label>
                                        <select 
                                            value={formData.agency} 
                                            onChange={e => {
                                                const agencyId = e.target.value;
                                                const selectedAgency = brands.find(b => b._id === agencyId);
                                                onFormChange({
                                                    ...formData,
                                                    agency: agencyId,
                                                    make: selectedAgency ? selectedAgency.name : formData.make
                                                });
                                            }}
                                            className="w-full bg-white/[0.03] border border-[#c9a96e]/30 rounded-xl py-3 px-4 text-sm font-bold text-[#c9a96e] focus:outline-none focus:border-[#c9a96e]/60">
                                            <option value="">{isRTL ? 'بدون وكالة (يدوي)' : 'None (Manual)'}</option>
                                            {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* ── حقل الموديل ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الموديل' : 'MODEL'}</label>
                                    <input type="text" required value={formData.model}
                                        onChange={e => update('model', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40" />
                                </div>

                                {/* ── حقل السنة ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'السنة' : 'YEAR'}</label>
                                    <input type="number" required value={formData.year}
                                        onChange={e => update('year', parseInt(e.target.value))}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40" />
                                </div>

                                {/* ── حقول الأسعار - تحويل تلقائي بين SAR و USD و KRW ── */}
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                        {isRTL ? 'الأسعار (تحويل تلقائي بين العملات)' : 'PRICES (AUTO-CONVERT)'}
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {/* السعر بالريال السعودي SAR */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-green-400">ر.س</span>
                                            <input type="number" placeholder="0" value={formData.price || ''}
                                                title="السعر بالريال"
                                                onChange={e => onPriceChange('sar', e.target.value)}
                                                className="w-full bg-white/[0.03] border border-green-400/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-green-400 focus:outline-none focus:border-green-400/60" />
                                            <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">SAR</div>
                                        </div>
                                        {/* السعر بالدولار USD */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-cinematic-neon-blue">$</span>
                                            <input type="number" placeholder="0.00" value={formData.usdPrice || ''}
                                                title="السعر بالدولار"
                                                onChange={e => onPriceChange('usd', e.target.value)}
                                                className="w-full bg-white/[0.03] border border-cinematic-neon-blue/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-cinematic-neon-blue focus:outline-none focus:border-cinematic-neon-blue/60" />
                                            <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">USD</div>
                                        </div>
                                        {/* السعر بالوون الكوري KRW */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-yellow-400">₩</span>
                                            <input type="number" placeholder="0" value={formData.krwPrice || ''}
                                                title="السعر بالوون الكوري"
                                                onChange={e => onPriceChange('krw', e.target.value)}
                                                className="w-full bg-white/[0.03] border border-yellow-400/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-yellow-400 focus:outline-none focus:border-yellow-400/60" />
                                            <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">KRW</div>
                                        </div>
                                    </div>
                                    {/* عرض معدلات الصرف المستخدمة */}
                                    <div className="mt-2 flex gap-4 text-[9px] text-white/20 uppercase tracking-widest">
                                        <span>1 USD = {usdToSar} SAR</span>
                                        <span>1 USD = {usdToKrw.toLocaleString()} KRW</span>
                                    </div>
                                </div>

                                {/* ── عملة العرض للعميل ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                        {isRTL ? 'عملة العرض للعميل' : 'DISPLAY CURRENCY'}
                                    </label>
                                    <select title="عملة العرض" value={formData.displayCurrency}
                                        onChange={e => update('displayCurrency', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none">
                                        <option value="SAR">🇸🇦 SAR - ريال سعودي</option>
                                        <option value="USD">🇺🇸 USD - دولار أمريكي</option>
                                        <option value="KRW">🇰🇷 KRW - وون كوري</option>
                                    </select>
                                </div>

                                {/* ── المسافة المقطوعة ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'المسافة (كم)' : 'MILEAGE (KM)'}</label>
                                    <input type="number" required value={formData.mileage}
                                        onChange={e => update('mileage', parseFloat(e.target.value))}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40" />
                                </div>

                                {/* ── اللون ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'اللون' : 'COLOR'}</label>
                                    <input type="text" value={formData.color}
                                        onChange={e => update('color', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40" />
                                </div>

                                {/* ── الفئة ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الفئة' : 'CATEGORY'}</label>
                                    <select value={formData.category} onChange={e => update('category', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none">
                                        {['sedan', 'suv', 'sports', 'luxury', 'coupe', 'convertible'].map(c =>
                                            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                        )}
                                    </select>
                                </div>

                                {/* ── نوع الوقود ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'نوع الوقود' : 'FUEL TYPE'}</label>
                                    <select value={formData.fuelType} onChange={e => update('fuelType', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none">
                                        {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>

                                {/* ── ناقل الحركة ── */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'ناقل الحركة' : 'TRANSMISSION'}</label>
                                    <select value={formData.transmission} onChange={e => update('transmission', e.target.value)}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none">
                                        <option value="Automatic">Automatic</option>
                                        <option value="Manual">Manual</option>
                                    </select>
                                </div>

                                {/* ── حالة النشر (نشطة / مخفية) ── */}
                                <div className="col-span-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="checkbox" checked={formData.isActive}
                                            onChange={e => update('isActive', e.target.checked)}
                                            className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-cinematic-neon-blue" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
                                            {isRTL ? 'نشطة (تظهر في الموقع)' : 'ACTIVE (VISIBLE IN SHOWROOM)'}
                                        </span>
                                    </label>
                                </div>

                                {/* ── حقل الوصف ── */}
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">{isRTL ? 'الوصف' : 'DESCRIPTION'}</label>
                                    <textarea value={formData.description}
                                        onChange={e => update('description', e.target.value)}
                                        rows={4}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40 resize-none" />
                                </div>
                            </div>

                            {/* ── أزرار الحفظ والإلغاء ── */}
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={onClose}
                                    className="flex-1 py-4 bg-white/5 border border-white/10 text-white/60 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all">
                                    {isRTL ? 'إلغاء' : 'CANCEL'}
                                </button>
                                <button type="submit" disabled={submitting}
                                    className={cn(
                                        'flex-1 py-4 bg-cinematic-neon-blue !text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3 transition-all',
                                        submitting && 'opacity-50 cursor-not-allowed scale-95'
                                    )}>
                                    {submitting
                                        ? <><div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> {isRTL ? 'جاري الحفظ...' : 'SAVING...'}</>
                                        : <><Save className="w-5 h-5" /> {isRTL ? 'حفظ' : 'SAVE'}</>
                                    }
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
