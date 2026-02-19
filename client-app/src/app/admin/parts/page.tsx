'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Package,
    Plus,
    Edit,
    Trash2,
    Eye,
    Search,
    Filter,
    X,
    Upload,
    Save,
    ChevronLeft
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";

export default function AdminPartsPage() {
    const { t, isRTL } = useLanguage();
    const [parts, setParts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingPart, setEditingPart] = useState<any>(null);
    const [formData, setFormData] = useState({
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
        try {
            if (editingPart) {
                await api.parts.update(editingPart.id, formData);
            } else {
                await api.parts.create(formData);
            }
            setShowModal(false);
            setEditingPart(null);
            resetForm();
            loadParts();
        } catch (err) {
            console.error('Failed to save part', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه القطعة؟' : 'Are you sure you want to delete this part?')) {
            try {
                await api.parts.delete(id);
                loadParts();
            } catch (err) {
                console.error('Failed to delete part', err);
            }
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
    };

    return (
        <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cinematic-neon-blue/5 via-black to-black opacity-40" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] opacity-20" />
            </div>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">

                <header className="mb-16">
                    

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Admin Control</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-[0.9] mb-4">
                                {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'قطع الغيار' : 'PARTS'}</span>
                            </h1>
                            <p className="text-[11px] text-white/40 uppercase tracking-[0.3em] font-bold">
                                {isRTL ? 'إدارة قطع الغيار والمخزون' : 'MANAGE SPARE PARTS AND INVENTORY'}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-glow px-8 py-4 bg-cinematic-neon-blue text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center gap-3"
                        >
                            <Plus className="w-5 h-5" />
                            {isRTL ? 'إضافة قطعة' : 'ADD PART'}
                        </motion.button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-6 mb-12">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                        <input
                            type="text"
                            placeholder={isRTL ? 'بحث...' : 'SEARCH...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        {['all', 'Engine', 'Brakes', 'Filters'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={cn(
                                    "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-colors select-none",
                                    filter === cat
                                        ? "relative bg-cinematic-neon-blue text-white shadow-[0_0_35px_rgba(0,240,255,0.45)] ring-2 ring-cinematic-neon-blue after:content-[''] after:absolute after:-inset-1 after:rounded-xl after:bg-cinematic-neon-blue/25 after:blur-md after:-z-10"
                                        : "bg-white/[0.14] text-white hover:bg-white/[0.18] ring-1 ring-white/10"
                                )}
                                aria-pressed={filter === cat}
                            >
                                <span className="inline-flex items-center gap-2 justify-center">
                                    {filter === cat && <span className="w-2 h-2 rounded-full bg-white" />}
                                    <span>{isRTL
                                        ? (cat === 'all' ? 'الكل' : cat === 'Engine' ? 'المحرك' : cat === 'Brakes' ? 'الفرامل' : 'المرشحات')
                                        : cat}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-32">
                        <div className="text-white text-xl animate-pulse">Loading...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {parts.map((part, i) => (
                            <motion.div
                                key={part.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card bg-white/[0.01] border-white/5 overflow-hidden group hover:border-cinematic-neon-blue/30 transition-all"
                            >
                                <div className="relative h-48 overflow-hidden">
                                    <img
                                        src={part.img || part.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1000&auto=format&fit=crop'}
                                        alt={part.name}
                                        className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    <div className="absolute top-4 right-4 px-3 py-1 bg-cinematic-neon-blue/20 backdrop-blur-md rounded-lg border border-cinematic-neon-blue/30">
                                        <span className="text-[8px] font-black text-cinematic-neon-blue uppercase tracking-widest">{part.condition}</span>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div>
                                        <div className="text-[9px] font-black text-cinematic-neon-blue/80 uppercase tracking-[0.3em] mb-2">{part.brand} {part.model}</div>
                                        <h3 className="text-lg font-black uppercase italic tracking-tighter line-clamp-1">{part.name}</h3>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <div className="text-xl font-black text-cinematic-neon-blue italic">
                                            {Number(part.price || 0).toLocaleString()} <span className="text-xs">SAR</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleEdit(part)}
                                            className="py-2 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 text-cinematic-neon-blue rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" />
                                            {isRTL ? 'تعديل' : 'EDIT'}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDelete(part.id)}
                                            className="py-2 bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 text-cinematic-neon-red rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            {isRTL ? 'حذف' : 'DELETE'}
                                        </motion.button>
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
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="glass-card bg-black/90 border-white/10 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-black uppercase italic tracking-tight">
                                    {editingPart ? (isRTL ? 'تعديل قطعة' : 'EDIT PART') : (isRTL ? 'إضافة قطعة' : 'ADD PART')}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'صور القطعة' : 'PART IMAGES'}
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center group">
                                                {formData.images[0] ? (
                                                    <img src={formData.images[0]} alt="Part" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Upload className="w-8 h-8 text-white/20" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;

                                                        const data = new FormData();
                                                        data.append('image', file);

                                                        try {
                                                            const res = await (api as any).upload.image(data);
                                                            if (res.success) {
                                                                setFormData({ ...formData, images: [res.url] });
                                                            }
                                                        } catch (err) {
                                                            console.error('Upload failed', err);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-white/40">
                                                {isRTL ? 'اضغط لرفع صورة' : 'Click to upload image'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'اسم القطعة' : 'PART NAME'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الماركة' : 'BRAND'}
                                        </label>
                                        <select
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            {(() => {
                                                let list: any[] = [];
                                                try { list = JSON.parse(localStorage.getItem('hm_brands_cache') || '[]'); } catch {}
                                                const partBrands = list.filter((b: any) => b.category === 'parts' || b.category === 'both');
                                                return partBrands.length ? partBrands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>) : [<option key="manual" value={formData.brand || ''}>{formData.brand || (isRTL ? 'اكتب الماركة' : 'Type brand')}</option>];
                                            })()}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الموديل المتوافق' : 'COMPATIBLE MODEL'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'السعر' : 'PRICE (SAR)'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الفئة' : 'CATEGORY'}
                                        </label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="Engine">Engine</option>
                                            <option value="Brakes">Brakes</option>
                                            <option value="Suspension">Suspension</option>
                                            <option value="Filters">Filters</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Body">Body</option>
                                            <option value="Accessories">Accessories</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الحالة' : 'CONDITION'}
                                        </label>
                                        <select
                                            value={formData.condition}
                                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="New">New</option>
                                            <option value="Used">Used</option>
                                            <option value="Refurbished">Refurbished</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الكمية' : 'QUANTITY'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.stockQty}
                                            onChange={(e) => setFormData({ ...formData, stockQty: parseInt(e.target.value) })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 text-white/60 rounded-xl text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white/10 transition-all"
                                    >
                                        {isRTL ? 'إلغاء' : 'CANCEL'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-cinematic-neon-blue text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3"
                                    >
                                        <Save className="w-5 h-5" />
                                        {isRTL ? 'حفظ' : 'SAVE'}
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
