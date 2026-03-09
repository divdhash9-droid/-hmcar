'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Package,
    Plus,
    Edit,
    Trash2,
    Search,
    X,
    Upload,
    Save,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";

export default function AdminPartsPage() {
    const { t, isRTL } = useLanguage();
    const { showToast } = useToast();
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        brand: 'TOYOTA', // Representing the Agency
        model: '', // Representing the Car Model (e.g. Camry)
        year: new Date().getFullYear(),
        price: 0,
        category: 'Engine',
        images: [''],
        description: '',
        condition: 'New',
        stockQty: 1
    });

    useEffect(() => {
        loadParts();
    }, [filter, searchTerm]);

    const loadParts = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filter !== 'all') params.category = filter;
            if (searchTerm) params.q = searchTerm;

            const response = await api.parts.list(params);
            if (response.success) {
                setParts(response.parts);
            }
        } catch (err) {
            console.error('Failed to load parts', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (editingPart) {
                await api.parts.update(editingPart.id, formData);
            } else {
                await api.parts.create(formData);
            }
            setShowModal(false);
            setEditingPart(null);
            setEditingPart(null);
            resetForm();
            await loadParts();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved successfully!', 'success');
        } catch (err) {
            console.error('Failed to save part', err);
            showToast(isRTL ? '❌ فشل في حفظ البيانات' : '❌ Failed to save data', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure you want to delete this part?')) {
            try {
                await api.parts.delete(id);
                loadParts();
                showToast(isRTL ? '🗑️ تم الحذف بنجاح' : '🗑️ Deleted successfully', 'success');
            } catch (err) {
                console.error('Failed to delete part', err);
                showToast(isRTL ? '❌ فشل في الحذف' : '❌ Failed to delete', 'error');
            }
        }
    };

    // [[ARABIC_COMMENT]] تسجيل بيع قطعة - ينقص المخزون ويخفيها إذا نفد
    const handleMarkSold = async (id: string, name: string, currentStock: number) => {
        const confirmed = confirm(isRTL
            ? `تأكيد بيع: ${name}؟\nالمخزون الحالي: ${currentStock} قطعة`
            : `Confirm sale: ${name}?\nCurrent stock: ${currentStock}`
        );
        if (!confirmed) return;

        const soldQtyStr = prompt(
            isRTL ? `كم قطعة تم بيعها؟ (1-${currentStock})` : `How many units sold? (1-${currentStock})`,
            '1'
        );
        const soldQty = soldQtyStr ? parseInt(soldQtyStr) : 1;

        try {
            const res = await fetch(`/api/v2/parts/${id}/sold`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hm_token')}` },
                body: JSON.stringify({ soldQty }),
            });
            await res.json();
            loadParts();
            showToast(isRTL ? '✅ تم تسجيل البيع بنجاح!' : '✅ Sale recorded successfully!', 'success');
        } catch (err) {
            console.error('Failed to mark part as sold', err);
            showToast(isRTL ? '❌ فشل في تسجيل البيع' : '❌ Failed to record sale', 'error');
        }
    };

    const handleEdit = (part: any) => {
        setEditingPart(part);
        setFormData({
            name: part.name,
            brand: part.brand,
            model: part.model || '',
            year: part.year || new Date().getFullYear(),
            price: part.price,
            category: part.category || 'Engine',
            images: part.images || (part.img ? [part.img] : ['']),
            description: part.description || '',
            condition: part.condition || 'New',
            stockQty: part.stockQty || 1
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            brand: '',
            model: '',
            year: new Date().getFullYear(),
            price: 0,
            category: 'Engine',
            images: [''],
            description: '',
            condition: 'New',
            stockQty: 1
        });
        setEditingPart(null); // [[ARABIC_COMMENT]] تصفير حالة التعديل لضمان عدم الكتابة على قطعة قديمة عند إضافة جديدة
    };

    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

            <main className="relative z-10 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">


                {/* HUD Header */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        <span className="text-orange-400/70">{isRTL ? 'قطع الغيار' : 'SPARE PARTS'}</span>
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">PARTS INVENTORY CONTROL</p>
                            <h1 className="ck-page-title">{isRTL ? 'قطع الغيار' : 'PARTS CTRL'}</h1>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="ck-btn-primary flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            {isRTL ? 'إضافة قطعة' : 'ADD PART'}
                        </motion.button>
                    </div>
                </div>

                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/30', isRTL ? 'right-4' : 'left-4')} />
                        <input type="text" placeholder={isRTL ? 'بحث في المخزون...' : 'SEARCH PARTS...'}
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className={cn('ck-input', isRTL ? 'pr-11' : 'pl-11')} />
                    </div>
                    <div className="ck-tab-group">
                        {(['all', 'Engine', 'Brakes', 'Filters', 'Suspension', 'Electrical'] as const).map(cat => (
                            <button key={cat} onClick={() => setFilter(cat)}
                                className={cn('ck-tab', filter === cat && 'ck-tab-active')}>
                                {isRTL
                                    ? { all: 'الكل', Engine: 'محرك', Brakes: 'فرامل', Filters: 'مرشحات', Suspension: 'تعليق', Electrical: 'كهرباء' }[cat]
                                    : cat.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Parts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-64 rounded-3xl bg-white/[0.02] animate-pulse border border-orange-500/10" />)}
                    </div>
                ) : parts.length === 0 ? (
                    <div className="ck-empty">
                        <div className="ck-empty-icon"><Package className="w-8 h-8" /></div>
                        <p className="cockpit-mono">{isRTL ? 'لا توجد قطع في المخزون' : 'PARTS INVENTORY EMPTY'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {parts.map((part, i) => (
                            <motion.div key={part.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="ck-card overflow-hidden group ck-hover-lift">

                                <div className="relative h-44 overflow-hidden">
                                    <Image
                                        src={part.img || part.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop'}
                                        alt={part.name} fill
                                        sizes="(max-width: 768px) 100vw, 25vw"
                                        quality={70} priority={i < 4}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-transparent to-transparent" />
                                    <div className="absolute top-2 end-2">
                                        <span className={cn('ck-badge', part.condition === 'New' ? 'ck-badge-active' : part.condition === 'Used' ? 'ck-badge-pending' : 'ck-badge-info')}>
                                            {isRTL ? { New: 'جديد', Used: 'مستعمل', Refurbished: 'مجدد' }[part.condition as string] || part.condition : part.condition}
                                        </span>
                                    </div>
                                    {/* Stock indicator */}
                                    {typeof part.stockQty === 'number' && (
                                        <div className="absolute bottom-2 start-2">
                                            <span className="cockpit-mono text-[9px] bg-black/60 px-2 py-0.5 rounded-full text-orange-400/80">
                                                {isRTL ? `مخزون: ${part.stockQty}` : `QTY: ${part.stockQty}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.2em] mb-0.5">{part.brand} · {part.model}</p>
                                        <h3 className="text-sm font-bold text-white truncate">{part.name}</h3>
                                        <p className="cockpit-mono text-[9px] text-white/30 uppercase mt-0.5">{part.category}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                        <div>
                                            <p className="cockpit-mono text-[8px] text-white/25 uppercase">SAR</p>
                                            <p className="cockpit-num text-lg font-black text-orange-400">{Number(part.price || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(part)} title={isRTL ? 'تعديل' : 'Edit'}
                                                className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center">
                                                <Edit className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleMarkSold(part.id, part.name, part.stockQty || 1)} title={isRTL ? 'بيع' : 'Sell'}
                                                className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(part.id)} title={isRTL ? 'حذف' : 'Delete'}
                                                className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </main>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="ck-modal-backdrop" onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
                            onClick={(e) => e.stopPropagation()}
                            className="ck-modal ck-scroll p-7 max-w-2xl w-full"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-500/10">
                                <div>
                                    <p className="cockpit-mono text-[9px] text-orange-500/50 uppercase tracking-[0.2em] mb-1">PARTS CONTROL</p>
                                    <h2 className="ck-page-title text-2xl">
                                        {editingPart ? (isRTL ? '✏️ تعديل قطعة' : 'EDIT PART') : (isRTL ? '+ إضافة قطعة' : 'NEW PART')}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-white/40 transition-all flex items-center justify-center">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Image Upload */}
                                    <div className="col-span-2">
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'صورة القطعة' : 'PART IMAGE'}</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-20 h-20 ck-card overflow-hidden flex items-center justify-center">
                                                {formData.images[0]
                                                    ? <Image src={formData.images[0]} alt="Part" fill sizes="80px" quality={50} className="object-cover" />
                                                    : <Upload className="w-6 h-6 text-orange-500/30" />}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0]; if (!file) return;
                                                        const data = new FormData(); data.append('image', file);
                                                        try { const res = await (api as any).upload.image(data); if (res.success) setFormData({ ...formData, images: [res.url] }); } catch { }
                                                    }} />
                                            </div>
                                            <p className="cockpit-mono text-[9px] text-white/30">{isRTL ? 'اضغط لرفع صورة' : 'Click to upload'}</p>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'اسم القطعة' : 'PART NAME'}</label>
                                        <input type="text" required value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="ck-input" />
                                    </div>

                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الوكالة' : 'BRAND'}</label>
                                        <select value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="ck-select">
                                            {['TOYOTA', 'KIA', 'HYUNDAI', 'FORD', 'NISSAN', 'MERCEDES', 'BMW', 'LEXUS'].map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'موديل السيارة' : 'CAR MODEL'}</label>
                                        <input type="text" required placeholder={isRTL ? 'كامري' : 'Camry'} value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value.toUpperCase() })} className="ck-input" />
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'السعر (ر.س)' : 'PRICE (SAR)'}</label>
                                        <input type="number" required value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} className="ck-input" />
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الفئة' : 'CATEGORY'}</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="ck-select">
                                            {['Engine', 'Brakes', 'Suspension', 'Filters', 'Electrical', 'Body', 'Accessories'].map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الحالة' : 'CONDITION'}</label>
                                        <select value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })} className="ck-select">
                                            <option value="New">{isRTL ? 'جديد' : 'New'}</option>
                                            <option value="Used">{isRTL ? 'مستعمل' : 'Used'}</option>
                                            <option value="Refurbished">{isRTL ? 'مجدد' : 'Refurbished'}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.15em] mb-2">{isRTL ? 'الكمية' : 'QTY IN STOCK'}</label>
                                        <input type="number" required min="1" value={formData.stockQty}
                                            onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) })} className="ck-input" />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="ck-btn-ghost flex-1">{isRTL ? 'إلغاء' : 'CANCEL'}</button>
                                    <button type="submit" disabled={submitting}
                                        className={cn('ck-btn-primary flex-1 flex items-center justify-center gap-2', submitting && 'opacity-50 cursor-not-allowed')}>
                                        {submitting ? <div className="ck-radar w-4 h-4" /> : <Save className="w-4 h-4" />}
                                        {submitting ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ القطعة' : 'SAVE PART')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
