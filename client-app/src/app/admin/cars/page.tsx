'use client';

/**
 * صفحة إدارة السيارات - لوحة تحكم HM CAR
 * ──────────────────────────────────────────
 * هذه الصفحة مسؤولة عن:
 * - عرض قائمة السيارات مع إمكانية البحث والتصفية
 * - إضافة / تعديل / حذف السيارات
 * - تسجيل عمليات البيع
 *
 * المكونات المستخدمة (في مجلد _components/):
 * - CarCard: بطاقة عرض السيارة الواحدة
 * - CarModal: نموذج الإضافة والتعديل
 */

import { useState, useEffect } from 'react';
import { Plus, Search, Globe, ArrowLeftCircle, Car as CarIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

// ── المكونات المقسمة ──
import CarCard from './_components/CarCard';
import CarModal from './_components/CarModal';
import { motion } from 'framer-motion';

// ── نوع بيانات السيارة ──
type Car = {
    id: string;
    title: string;
    make: string | { name: string };
    model: string;
    year: number;
    price: number;
    category: string;
    images: string[];
    isActive: boolean;
    isSold: boolean;
    displayCurrency?: string;
    description?: string;
    mileage?: number;
    fuelType?: string;
    transmission?: string;
    color?: string;
    listingType?: string;
    source?: 'hm_local' | 'korean_import';
    agency?: string | { _id: string; name: string };
    usdPrice?: number;
    krwPrice?: number;
    priceUsd?: number;
    priceKrw?: number;
};

// ── نوع بيانات نموذج الإضافة/التعديل ──
type FormData = {
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
};

// ── النموذج الافتراضي الفارغ ──
const EMPTY_FORM: FormData = {
    title: '', make: '', model: '',
    year: new Date().getFullYear(),
    price: 0, usdPrice: 0, krwPrice: 0,
    category: 'sedan', images: [''], description: '',
    mileage: 0, fuelType: 'Petrol', transmission: 'Automatic',
    color: '', isActive: true, displayCurrency: 'SAR', listingType: 'store', source: 'hm_local',
    agency: ''
};

export default function AdminCarsPage() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const requestedSource = searchParams?.get('source');
    const inventorySource: 'hm_local' | 'korean_import' = requestedSource === 'korean_import' ? 'korean_import' : 'hm_local';

    // ── حالات الصفحة ──
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');      // فلتر الحالة
    const [searchTerm, setSearchTerm] = useState('');    // نص البحث
    const [showModal, setShowModal] = useState(false);   // إظهار النموذج
    const [editingCar, setEditingCar] = useState<Car | null>(null); // السيارة المحددة للتعديل
    const [submitting, setSubmitting] = useState(false); // حالة الإرسال
    const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);

    // ── أسعار الصرف (تُجلب من الإعدادات) ──
    const [usdToSar, setUsdToSar] = useState(3.75);
    const [usdToKrw, setUsdToKrw] = useState(1350);

    // ── بيانات النموذج ──
    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    // ── تحميل البيانات عند تغيير الفلتر أو البحث ──
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter, searchTerm, inventorySource]);

    // ── جلب السيارات والإعدادات والوكالات من الـ API ──
    const loadData = async () => {
        setLoading(true);
        try {
            const [carsRes, settingsRes, brandsRes] = await Promise.all([
                api.cars.list({ status: filter, search: searchTerm, source: inventorySource }),
                api.settings.getPublic(),
                api.brands.list('cars', { targetShowroom: inventorySource })
            ]);

            if (carsRes.success) setCars(carsRes.data.cars);

            // تحديث أسعار الصرف من الإعدادات
            if (settingsRes.success && settingsRes.data.currencySettings) {
                setUsdToSar(settingsRes.data.currencySettings.usdToSar || 3.75);
                setUsdToKrw(settingsRes.data.currencySettings.usdToKrw || 1350);
            }

            if (brandsRes.success) setBrands(brandsRes.brands || []);
        } catch (err) {
            console.error('فشل تحميل البيانات:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── دالة تحويل السعر تلقائياً بين العملات الثلاث ──
    const handlePriceChange = (field: 'sar' | 'usd' | 'krw', rawValue: string) => {
        const value = parseFloat(rawValue) || 0;
        let sarPrice = 0, usdPrice = 0, krwPrice = 0;

        if (field === 'sar') {
            sarPrice = value;
            usdPrice = parseFloat((sarPrice / usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else if (field === 'usd') {
            usdPrice = value;
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
            krwPrice = Math.round(usdPrice * usdToKrw);
        } else {
            krwPrice = value;
            usdPrice = parseFloat((krwPrice / usdToKrw).toFixed(2));
            sarPrice = parseFloat((usdPrice * usdToSar).toFixed(2));
        }

        setFormData(prev => ({ ...prev, price: sarPrice, usdPrice, krwPrice }));
    };

    // ── بدء تعديل سيارة - تعبئة النموذج ببياناتها ──
    const handleEdit = (car: Car) => {
        setEditingCar(car);
        const sarPrice = car.price || 0;
        // Use existing priceUsd/priceKrw if available, otherwise calculate
        const usd = car.usdPrice ?? (car.priceUsd || parseFloat((sarPrice / usdToSar).toFixed(2)));
        const krw = car.krwPrice ?? (car.priceKrw || Math.round((usd * usdToKrw)));
        // make قد يكون object أو string
        const makeValue = typeof car.make === 'object' ? (car.make?.name || '') : (car.make || '');
        setFormData({
            title: car.title, make: makeValue, model: car.model, year: car.year,
            price: sarPrice, usdPrice: usd, krwPrice: krw,
            category: car.category, images: car.images || [''],
            description: car.description || '', mileage: car.mileage || 0,
            fuelType: car.fuelType || 'Petrol', transmission: car.transmission || 'Automatic',
            color: car.color || '', isActive: car.isActive !== false,
            displayCurrency: car.displayCurrency || 'SAR',
            listingType: car.listingType || 'store',
            source: car.source || (car.listingType === 'showroom' ? 'korean_import' : 'hm_local'),
            agency: typeof car.agency === 'object' ? (car.agency?._id || '') : (car.agency || '')
        });
        setShowModal(true);
    };

    // ── إعادة تعيين النموذج لإضافة سيارة جديدة ──
    const resetForm = () => {
        setFormData({
            ...EMPTY_FORM,
            source: inventorySource,
            listingType: inventorySource === 'korean_import' ? 'showroom' : 'store'
        });
        setEditingCar(null);
    };

    // ── حفظ بيانات السيارة (إضافة أو تعديل) ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            // Map USD and KRW fields to match the model schema exactly
            const submitData = {
                ...formData,
                source: formData.source || inventorySource,
                listingType: (formData.source || inventorySource) === 'korean_import' ? 'showroom' : 'store',
                priceUsd: formData.usdPrice,
                priceKrw: formData.krwPrice
            };

            if (editingCar) {
                await api.cars.update(editingCar.id, submitData);
            } else {
                await api.cars.create(submitData);
            }
            setShowModal(false);
            resetForm();
            await loadData();
            showToast(isRTL ? '✅ تم حفظ البيانات بنجاح!' : '✅ Data saved!', 'success');
        } catch (err) {
            console.error('فشل حفظ البيانات:', err);
            showToast(isRTL ? '❌ فشل في الحفظ' : '❌ Save failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── حذف سيارة ──
    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه السيارة؟' : 'Delete this car?')) return;
        try {
            await api.cars.delete(id);
            loadData();
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
        } catch (err) {
            console.error('فشل الحذف:', err);
            showToast(isRTL ? '❌ فشل الحذف' : '❌ Delete failed', 'error');
        }
    };

    // ── تعليم السيارة كـ "تم البيع" ──
    const handleMarkSold = async (id: string, title: string) => {
        const confirmed = confirm(isRTL
            ? `هل تأكد أنه تم بيع: ${title}؟\nسيتم إخفاؤها من المعرض فوراً.`
            : `Confirm sale of: ${title}?`
        );
        if (!confirmed) return;

        const soldPriceStr = prompt(isRTL ? 'أدخل سعر البيع الفعلي (اختياري):' : 'Enter sold price (optional):');
        const soldPrice = soldPriceStr ? parseFloat(soldPriceStr) : undefined;

        try {
            await fetch(`/api/v2/cars/${id}/sold`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('hm_token')}`
                },
                body: JSON.stringify({ soldPrice }),
            });
            loadData();
            showToast(isRTL ? '✅ تم تسجيل البيع!' : '✅ Sale recorded!', 'success');
        } catch (err) {
            console.error('فشل تسجيل البيع:', err);
            showToast(isRTL ? '❌ فشل تسجيل البيع' : '❌ Sale record failed', 'error');
        }
    };

    // ── واجهة المستخدم الرئيسية ──
    return (
        <div className="relative min-h-screen text-white font-sans overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
            <main className="relative z-10 pt-6 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* ─── رأس الصفحة (HUD Header) ─── */}
                <div className="ck-page-header">
                    <nav className="ck-breadcrumb">
                        <Link href="/admin/dashboard" className="hover:text-orange-400/80 transition-colors">HM-CTRL</Link>
                        <span className="ck-breadcrumb-sep">›</span>
                        {requestedSource ? (
                            <>
                                <Link href="/admin/cars" className="hover:text-orange-400/80 transition-colors">{isRTL ? 'المعرض' : 'SHOWROOM'}</Link>
                                <span className="ck-breadcrumb-sep">›</span>
                                <span className="text-orange-400/70">{inventorySource === 'korean_import' ? (isRTL ? 'الكوري' : 'KOREAN') : (isRTL ? 'المحلي' : 'LOCAL')}</span>
                            </>
                        ) : (
                            <span className="text-orange-400/70">{isRTL ? 'المعرض' : 'SHOWROOM'}</span>
                        )}
                    </nav>
                    <div className="flex items-end justify-between gap-4 flex-wrap">
                        <div>
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">
                                {inventorySource === 'korean_import' ? 'KOREAN IMPORT INVENTORY' : 'HM LOCAL INVENTORY'}
                            </p>
                            <h1 className="ck-page-title">
                                {isRTL
                                    ? (inventorySource === 'korean_import' ? 'إدارة المعرض الكوري' : 'إدارة مخزون HM')
                                    : (inventorySource === 'korean_import' ? 'KOREAN CAR CTRL' : 'HM CAR CTRL')}
                            </h1>
                        </div>
                        {/* زر إضافة سيارة جديدة */}
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="ck-btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            {isRTL ? 'إضافة سيارة' : 'ADD VEHICLE'}
                        </button>
                    </div>
                </div>

                {/* ─── شريط البحث والتصفية ─── */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* حقل البحث */}
                    <div className="flex-1 relative">
                        <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500/30', isRTL ? 'right-4' : 'left-4')} />
                        <input
                            type="text"
                            placeholder={isRTL ? 'بحث في المخزون...' : 'SEARCH INVENTORY...'}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={cn('ck-input', isRTL ? 'pr-11' : 'pl-11')}
                        />
                    </div>
                    {/* أزرار التصفية حسب الحالة */}
                    <div className="ck-tab-group">
                        {(['active', 'sold', 'inactive', 'all'] as const).map(status => (
                            <button key={status} onClick={() => setFilter(status)}
                                className={cn('ck-tab', filter === status && 'ck-tab-active')}>
                                {isRTL
                                    ? { active: 'نشط', sold: 'مباع', inactive: 'معطل', all: 'الكل' }[status]
                                    : status.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ─── شبكة السيارات ─── */}
                {!requestedSource ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-12">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Link href="/admin/cars?source=hm_local" className="group relative block">
                                <div className="absolute inset-0 bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-all rounded-full" />
                                <div className="ck-card p-10 flex flex-col items-center text-center gap-6 h-[400px] justify-center hover:border-orange-500/40 transition-all bg-black/40 backdrop-blur-xl group-hover:translate-y-[-8px]">
                                    <div className="w-24 h-24 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
                                        <CarIcon className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-orange-400 transition-colors mb-2">
                                            {isRTL ? 'معرض HM CAR' : 'HM CAR SHOWROOM'}
                                        </h2>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                                            {isRTL ? 'إدارة المخزون المحلي والمتوفر حالياً' : 'MANAGE LOCAL & READY INVENTORY'}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-orange-500/40 group-hover:text-orange-400 transition-colors transition-all">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'دخول النظام' : 'INITIATE ACCESS'}</span>
                                        <ArrowLeftCircle className={cn("w-5 h-5", isRTL ? "" : "rotate-180")} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <Link href="/admin/cars?source=korean_import" className="group relative block">
                                <div className="absolute inset-0 bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-all rounded-full" />
                                <div className="ck-card p-10 flex flex-col items-center text-center gap-6 h-[400px] justify-center hover:border-blue-500/40 transition-all bg-black/40 backdrop-blur-xl group-hover:translate-y-[-8px]">
                                    <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <Globe className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-blue-400 transition-colors mb-2">
                                            {isRTL ? 'المعرض الكوري' : 'KOREAN SHOWROOM'}
                                        </h2>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                                            {isRTL ? 'إدارة السيارات المستوردة من كوريا' : 'MANAGE KOREAN IMPORTED CARS'}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-blue-500/40 group-hover:text-blue-400 transition-colors transition-all">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'دخول النظام' : 'INITIATE ACCESS'}</span>
                                        <ArrowLeftCircle className={cn("w-5 h-5", isRTL ? "" : "rotate-180")} />
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    </div>
                ) : loading ? (
                    // هيكل تحميل (skeleton)
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-72 rounded-3xl bg-white/[0.02] animate-pulse border border-orange-500/10" />
                        ))}
                    </div>
                ) : cars.length === 0 ? (
                    // رسالة "لا توجد سيارات"
                    <div className="ck-empty">
                        <div className="ck-empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                                <circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" />
                            </svg>
                        </div>
                        <p className="cockpit-mono">{isRTL ? 'لا توجد سيارات في هذا القسم' : 'INVENTORY EMPTY'}</p>
                    </div>
                ) : (
                    // عرض بطاقات السيارات باستخدام CarCard
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.map((car, i) => (
                            <CarCard
                                key={car.id}
                                car={car}
                                index={i}
                                usdToSar={usdToSar}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onMarkSold={handleMarkSold}
                            />
                        ))}
                    </div>
                )}

            </main>

            {/* ─── نموذج الإضافة/التعديل المنبثق ─── */}
            <CarModal
                isOpen={showModal}
                isEditing={!!editingCar}
                formData={formData}
                submitting={submitting}
                usdToSar={usdToSar}
                usdToKrw={usdToKrw}
                brands={brands}
                onClose={() => { setShowModal(false); resetForm(); }}
                onSubmit={handleSubmit}
                onFormChange={setFormData}
                onPriceChange={handlePriceChange}
            />
        </div>
    );
}
