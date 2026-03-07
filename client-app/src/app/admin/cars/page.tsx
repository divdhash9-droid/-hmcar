'use client';

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Eye,
    Search,
    X,
    Upload,
    Save,
    ChevronLeft,
    CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/LanguageContext";
import { api } from "@/lib/api";
import { useToast } from "@/lib/ToastContext";

export default function AdminCarsPage() {
    const { t, isRTL } = useLanguage();
    const { showToast } = useToast();
    const [cars, setCars] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);
    const [brands, setBrands] = useState<any[]>([]);
    const [usdToSar, setUsdToSar] = useState(3.75);   // [[ARABIC_COMMENT]] سعر صرف الدولار مقابل الريال
    const [usdToKrw, setUsdToKrw] = useState(1350);  // [[ARABIC_COMMENT]] سعر صرف الدولار مقابل الوون الكوري
    const [formData, setFormData] = useState({
        title: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        price: 0,          // [[ARABIC_COMMENT]] السعر الأساسي بالريال السعودي SAR
        usdPrice: 0,       // [[ARABIC_COMMENT]] السعر بالدولار الأمريكي USD
        krwPrice: 0,       // [[ARABIC_COMMENT]] السعر بالوون الكوري KRW
        category: 'sedan',
        images: [''],
        description: '',
        mileage: 0,
        fuelType: 'Petrol',
        transmission: 'Automatic',
        color: '',
        isActive: true,
        displayCurrency: 'SAR',
        listingType: 'store' // [[ARABIC_COMMENT]] كل السيارات المضافة من هنا تكون في المعرض افتراضياً
    });

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [carsRes, settingsRes, brandsRes] = await Promise.all([
                api.cars.list({ status: filter, search: searchTerm }),
                api.settings.getPublic(),
                api.brands.list('cars')
            ]);

            if (carsRes.success) {
                setCars(carsRes.data.cars);
            }
            if (settingsRes.success && settingsRes.data.currencySettings) {
                setUsdToSar(settingsRes.data.currencySettings.usdToSar || 3.75);
                setUsdToKrw(settingsRes.data.currencySettings.usdToKrw || 1350); // [[ARABIC_COMMENT]] جلب سعر صرف الوون الكوري
            }
            if (brandsRes.success) {
                setBrands(brandsRes.brands || []);
            }
        } catch (err) {
            console.error("Failed to load data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (editingCar) {
                await api.cars.update(editingCar.id, formData);
            } else {
                await api.cars.create(formData);
            }
            setShowModal(false);
            setEditingCar(null);
            setEditingCar(null);
            resetForm();
            await loadData();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved successfully!', 'success');
        } catch (err) {
            console.error('Failed to save car', err);
            showToast(isRTL ? '❌ فشل في حفظ البيانات' : '❌ Failed to save data', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm(isRTL ? 'هل أنت متأكد من حذف هذه السيارة؟' : 'Are you sure you want to delete this car?')) {
            try {
                await api.cars.delete(id);
                loadData();
                showToast(isRTL ? '🗑️ تم الحذف بنجاح' : '🗑️ Deleted successfully', 'success');
            } catch (err) {
                console.error('Failed to delete car', err);
                showToast(isRTL ? '❌ فشل في الحذف' : '❌ Failed to delete', 'error');
            }
        }
    };

    // [[ARABIC_COMMENT]] تعليم السيارة كـ "تم البيع" - تختفي من المعرض فوراً
    const handleMarkSold = async (id: string, title: string) => {
        const confirmed = confirm(isRTL
            ? `هل تأكد أنه تم بيع: ${title}؟\nسيتم إخفاؤها من المعرض فوراً.`
            : `Confirm sale of: ${title}?\nIt will be hidden from showroom immediately.`
        );
        if (!confirmed) return;

        const soldPriceStr = prompt(isRTL ? 'أدخل سعر البيع الفعلي (اختياري):' : 'Enter actual sold price (optional):');
        const soldPrice = soldPriceStr ? parseFloat(soldPriceStr) : undefined;

        try {
            await fetch(`/api/v2/cars/${id}/sold`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('hm_token')}` },
                body: JSON.stringify({ soldPrice }),
            });
            loadData();
            showToast(isRTL ? '✅ تم تسجيل البيع بنجاح!' : '✅ Sale recorded successfully!', 'success');
        } catch (err) {
            console.error('Failed to mark as sold', err);
            showToast(isRTL ? '❌ فشل في تسجيل البيع' : '❌ Failed to record sale', 'error');
        }
    };

    const handleEdit = (car: any) => {
        setEditingCar(car);
        const sarPrice = car.price || 0;
        const usd = parseFloat((sarPrice / usdToSar).toFixed(2));
        const krw = Math.round(usd * usdToKrw);
        // [[ARABIC_COMMENT]] make قد يكون object أو string - نستخرج الاسم منه
        const makeValue = typeof car.make === 'object' ? (car.make?.name || '') : (car.make || '');
        setFormData({
            title: car.title,
            make: makeValue,
            model: car.model,
            year: car.year,
            price: sarPrice,
            usdPrice: usd,
            krwPrice: krw, // [[ARABIC_COMMENT]] حساب السعر بالوون عند التعديل
            category: car.category,
            images: car.images || [''],
            description: car.description || '',
            mileage: car.mileage || 0,
            fuelType: car.fuelType || 'Petrol',
            transmission: car.transmission || 'Automatic',
            color: car.color || '',
            isActive: car.isActive !== false,
            displayCurrency: car.displayCurrency || 'SAR',
            listingType: car.listingType || 'store'
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            price: 0,
            usdPrice: 0,
            krwPrice: 0, // [[ARABIC_COMMENT]] إعادة تعيين السعر بالوون
            category: 'sedan',
            images: [''],
            description: '',
            mileage: 0,
            fuelType: 'Petrol',
            transmission: 'Automatic',
            color: '',
            isActive: true,
            displayCurrency: 'SAR',
            listingType: 'store'
        });
        setEditingCar(null); // [[ARABIC_COMMENT]] تصفير حالة التعديل لضمان عدم الكتابة على سيارة قديمة عند إضافة جديدة
    };

    // [[ARABIC_COMMENT]] دالة تحويل السعر تلقائياً بين SAR و USD و KRW
    const handlePriceChange = (field: 'sar' | 'usd' | 'krw', rawValue: string) => {
        const value = parseFloat(rawValue) || 0;
        let sarPrice = 0;
        let usdPrice = 0;
        let krwPrice = 0;

        if (field === 'sar') {
            sarPrice = value;
            usdPrice = parseFloat((sarPrice / usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else if (field === 'usd') {
            usdPrice = value;
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else if (field === 'krw') {
            krwPrice = value;
            usdPrice = parseFloat((krwPrice / usdToKrw).toFixed(2));
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
        }

        setFormData(prev => ({ ...prev, price: sarPrice, usdPrice, krwPrice }));
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
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all group w-fit">
                        <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-1 ${isRTL ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{isRTL ? 'العودة للرئيسية' : 'BACK TO DASHBOARD'}</span>
                    </Link>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-[2px] w-12 bg-cinematic-neon-blue shadow-[0_0_10px_rgba(0,240,255,1)]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cinematic-neon-blue italic">Admin Control</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] mb-6">
                                {isRTL ? 'إدارة' : 'MANAGE'} <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">{isRTL ? 'السيارات' : 'CARS'}</span>
                            </h1>
                            <p className="text-[13px] text-white/40 uppercase tracking-[0.4em] font-bold">
                                {isRTL ? 'إضافة وتعديل وحذف السيارات من المخزون' : 'ADD, EDIT, AND REMOVE VEHICLES FROM INVENTORY'}
                            </p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="btn-glow px-10 py-5 bg-cinematic-neon-blue !text-black rounded-xl text-[13px] font-black uppercase tracking-[0.3em] shadow-[0_0_40px_rgba(0,240,255,0.4)] flex items-center gap-4"
                        >
                            <Plus className="w-6 h-6" />
                            {isRTL ? 'إضافة سيارة' : 'ADD CAR'}
                        </motion.button>
                    </div>
                </header>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-8 mb-16">
                    <div className="flex-1 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                        <input
                            type="text"
                            placeholder={isRTL ? 'بحث...' : 'SEARCH...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-base font-bold text-white placeholder:text-white/20 focus:outline-none focus:border-cinematic-neon-blue/40 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        {['active', 'sold', 'inactive', 'all'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={cn(
                                    "px-8 py-4 rounded-xl text-[12px] font-black uppercase tracking-[0.3em] transition-colors select-none",
                                    filter === status
                                        ? "relative bg-cinematic-neon-blue text-white shadow-[0_0_35px_rgba(0,240,255,0.45)] ring-2 ring-cinematic-neon-blue"
                                        : "bg-white/[0.14] text-white hover:bg-white/[0.18] ring-1 ring-white/10"
                                )}
                                aria-pressed={filter === status}
                            >
                                <span className="inline-flex items-center gap-3 justify-center">
                                    {filter === status && <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_white]" />}
                                    <span>{isRTL ? (status === 'active' ? 'نشط' : status === 'sold' ? 'مباع' : status === 'inactive' ? 'غير نشط' : 'الكل') : status}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cars Grid */}
                {loading ? (
                    <div className="text-center py-32">
                        <div className="text-white text-2xl font-black uppercase tracking-widest animate-pulse">Initializing Data Stream...</div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {cars.map((car, i) => (
                            <motion.div
                                key={car.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card bg-white/[0.01] border-white/5 overflow-hidden group hover:border-cinematic-neon-blue/30 transition-all"
                            >
                                <div className="relative h-64 overflow-hidden">
                                    <Image
                                        src={car.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop'}
                                        alt={car.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        quality={70}
                                        priority={i < 3}
                                        className="w-full h-full object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    {!car.isActive && (
                                        <div className="absolute top-6 right-6 px-4 py-2 bg-cinematic-neon-red/80 backdrop-blur-md rounded-xl">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">INACTIVE</span>
                                        </div>
                                    )}
                                    {car.isSold && (
                                        <div className="absolute top-6 right-6 px-4 py-2 bg-green-400/80 backdrop-blur-md rounded-xl">
                                            <span className="text-[10px] font-black text-black uppercase tracking-widest">SOLD</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <div className="text-[11px] font-black text-cinematic-neon-blue/80 uppercase tracking-[0.4em] mb-3 italic">{typeof car.make === 'object' ? car.make?.name : car.make}</div>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter line-clamp-1">{car.title}</h3>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="text-2xl font-black text-cinematic-neon-blue italic">
                                            {car.displayCurrency === 'USD' ? (
                                                <>
                                                    {((car.price || 0) / usdToSar).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[11px] opacity-60">USD</span>
                                                </>
                                            ) : (
                                                <>
                                                    {Number(car.price || 0).toLocaleString()} <span className="text-[11px] opacity-60">SAR</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2 pt-3">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleEdit(car)}
                                            className="btn-glow py-2 bg-cinematic-neon-blue/10 border border-cinematic-neon-blue/30 text-cinematic-neon-blue rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                            title={isRTL ? 'تعديل' : 'Edit'}
                                        >
                                            <Edit className="w-3 h-3" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="btn-glow py-2 bg-white/5 border border-white/10 text-white/80 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                            title={isRTL ? 'عرض' : 'View'}
                                        >
                                            <Eye className="w-3 h-3" />
                                        </motion.button>
                                        {/* [[ARABIC_COMMENT]] زر "تم البيع" - يجعل السيارة مخفية من المعرض */}
                                        {!car.isSold && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleMarkSold(car.id, car.title)}
                                                className="btn-glow py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                                title={isRTL ? 'تم البيع' : 'Mark Sold'}
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleDelete(car.id)}
                                            className="btn-glow py-2 bg-cinematic-neon-red/10 border border-cinematic-neon-red/30 text-cinematic-neon-red rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1"
                                            title={isRTL ? 'حذف' : 'Delete'}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </main>

            {/* Modal */}
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
                                    {editingCar ? (isRTL ? 'تعديل سيارة' : 'EDIT CAR') : (isRTL ? 'إضافة سيارة' : 'ADD CAR')}
                                </h2>
                                <button onClick={() => setShowModal(false)} aria-label={isRTL ? 'إغلاق' : 'Close'} className="p-2 hover:bg-white/5 rounded-lg transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'صور السيارة' : 'CAR IMAGES'}
                                        </label>
                                        <div className="flex flex-wrap items-center gap-4">
                                            {formData.images.filter((img: string) => img).map((img: string, index: number) => (
                                                <div key={index} className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center group">
                                                    <Image src={img} alt={`Car preview ${index + 1}`} fill unoptimized className="w-full h-full object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newImages = [...formData.images].filter(i => i);
                                                            newImages.splice(index, 1);
                                                            setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] });
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-white" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div className="relative w-24 h-24 bg-white/5 border border-dashed border-white/20 rounded-xl overflow-hidden flex flex-col items-center justify-center group hover:border-cinematic-neon-blue/50 transition-colors cursor-pointer">
                                                <Upload className="w-6 h-6 text-white/20 group-hover:text-cinematic-neon-blue/80 mb-1" />
                                                <span className="text-[8px] text-white/40 uppercase tracking-widest">{isRTL ? 'إضافة صورة' : 'ADD IMAGE'}</span>
                                                <input
                                                    type="file"
                                                    title={isRTL ? 'رفع صورة' : 'Upload Image'}
                                                    accept="image/*"
                                                    multiple
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const files = Array.from(e.target.files || []);
                                                        if (files.length === 0) return;

                                                        for (const file of files) {
                                                            const data = new FormData();
                                                            data.append('image', file);

                                                            try {
                                                                const res = await api.upload.image(data);
                                                                if (res.success) {
                                                                    setFormData(prev => {
                                                                        const existing = prev.images.filter(img => img);
                                                                        return { ...prev, images: [...existing, res.url] };
                                                                    });
                                                                } else {
                                                                    alert(res.message || (isRTL ? 'فشل الرفع' : 'Upload failed'));
                                                                }
                                                            } catch (err: unknown) {
                                                                console.error('Upload failed', err);
                                                                const error = err as { response?: { data?: { message?: string } }; message?: string };
                                                                const msg = error.response?.data?.message || error.message || (isRTL ? 'خطأ في الاتصال بالسيرفر' : 'Server connection error');
                                                                alert(`${isRTL ? 'فشل الرفع: ' : 'Upload failed: '} ${msg}`);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Basic Info */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الاسم' : 'NAME'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الماركة' : 'BRAND'}
                                        </label>
                                        <select
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="">{isRTL ? 'اختر الماركة' : 'Select Brand'}</option>
                                            {brands.map((b: any) => (
                                                <option key={b._id} value={b.name}>{b.name}</option>
                                            ))}
                                            {!brands.some(b => b.name === formData.make) && formData.make && (
                                                <option value={formData.make}>{formData.make}</option>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الموديل' : 'MODEL'}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'السنة' : 'YEAR'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>

                                    {/* [[ARABIC_COMMENT]] حقول الأسعار - تحويل تلقائي بين SAR و USD و KRW */}
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-3">
                                            {isRTL ? 'الأسعار (تحويل تلقائي بين العملات)' : 'PRICES (AUTO-CONVERT)'}
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {/* السعر بالريال السعودي SAR */}
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-green-400">ر.س</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    title={isRTL ? 'السعر بالريال السعودي' : 'Price in SAR'}
                                                    value={formData.price || ''}
                                                    onChange={(e) => handlePriceChange('sar', e.target.value)}
                                                    className="w-full bg-white/[0.03] border border-green-400/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-green-400 focus:outline-none focus:border-green-400/60"
                                                />
                                                <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">SAR</div>
                                            </div>
                                            {/* السعر بالدولار USD */}
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-cinematic-neon-blue">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    title={isRTL ? 'السعر بالدولار' : 'Price in USD'}
                                                    value={formData.usdPrice || ''}
                                                    onChange={(e) => handlePriceChange('usd', e.target.value)}
                                                    className="w-full bg-white/[0.03] border border-cinematic-neon-blue/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-cinematic-neon-blue focus:outline-none focus:border-cinematic-neon-blue/60"
                                                />
                                                <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">USD</div>
                                            </div>
                                            {/* السعر بالوون الكوري KRW */}
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black text-yellow-400">₩</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    title={isRTL ? 'السعر بالوون الكوري' : 'Price in KRW'}
                                                    value={formData.krwPrice || ''}
                                                    onChange={(e) => handlePriceChange('krw', e.target.value)}
                                                    className="w-full bg-white/[0.03] border border-yellow-400/30 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-yellow-400 focus:outline-none focus:border-yellow-400/60"
                                                />
                                                <div className="text-[9px] text-white/30 mt-1 text-center uppercase tracking-widest">KRW</div>
                                            </div>
                                        </div>
                                        {/* [[ARABIC_COMMENT]] عرض معدلات الصرف المستخدمة */}
                                        <div className="mt-2 flex gap-4 text-[9px] text-white/20 uppercase tracking-widest">
                                            <span>1 USD = {usdToSar} SAR</span>
                                            <span>1 USD = {usdToKrw.toLocaleString()} KRW</span>
                                        </div>
                                    </div>

                                    {/* عملة العرض */}
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'عملة العرض للعميل' : 'DISPLAY CURRENCY'}
                                        </label>
                                        <select
                                            title={isRTL ? "عملة العرض" : "Display Currency"}
                                            value={formData.displayCurrency}
                                            onChange={(e) => setFormData({ ...formData, displayCurrency: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="SAR">🇸🇦 SAR - ريال سعودي</option>
                                            <option value="USD">🇺🇸 USD - دولار أمريكي</option>
                                            <option value="KRW">🇰🇷 KRW - وون كوري</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'المسافة المقطوعة' : 'MILEAGE (KM)'}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.mileage}
                                            onChange={(e) => setFormData({ ...formData, mileage: parseFloat(e.target.value) })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'اللون' : 'COLOR'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
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
                                            <option value="sedan">Sedan</option>
                                            <option value="suv">SUV</option>
                                            <option value="sports">Sports</option>
                                            <option value="luxury">Luxury</option>
                                            <option value="coupe">Coupe</option>
                                            <option value="convertible">Convertible</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'نوع الوقود' : 'FUEL TYPE'}
                                        </label>
                                        <select
                                            value={formData.fuelType}
                                            onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="Petrol">Petrol</option>
                                            <option value="Diesel">Diesel</option>
                                            <option value="Hybrid">Hybrid</option>
                                            <option value="Electric">Electric</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'ناقل الحركة' : 'TRANSMISSION'}
                                        </label>
                                        <select
                                            value={formData.transmission}
                                            onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40"
                                        >
                                            <option value="Automatic">Automatic</option>
                                            <option value="Manual">Manual</option>
                                        </select>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-cinematic-neon-blue"
                                            />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors">
                                                {isRTL ? 'نشطة (تظهر في الموقع)' : 'ACTIVE (VISIBLE IN SHOWROOM)'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">
                                            {isRTL ? 'الوصف' : 'DESCRIPTION'}
                                        </label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows={4}
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-cinematic-neon-blue/40 resize-none"
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
                                        disabled={submitting}
                                        className={cn(
                                            "flex-1 py-4 bg-cinematic-neon-blue !text-black rounded-xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(0,240,255,0.3)] flex items-center justify-center gap-3 transition-all",
                                            submitting && "opacity-50 cursor-not-allowed scale-95"
                                        )}
                                    >
                                        {submitting ? (
                                            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <Save className="w-5 h-5" />
                                        )}
                                        {submitting ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ' : 'SAVE')}
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
