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
import { Plus, Search, Globe, ArrowLeft, Car as CarIcon, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';

// ── المكونات المقسمة ──
import CarCard from './_components/CarCard';
import CarModal from './_components/CarModal';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageShell from '@/components/AdminPageShell';

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
    const [currencySettings, setCurrencySettings] = useState({ usdToSar: 3.75, usdToKrw: 1300, partsMultiplier: 1.15, auctionMultiplier: 1.1 });
    const [savingCurrency, setSavingCurrency] = useState(false);
    const [filter, setFilter] = useState('active');      // فلتر الحالة
    const [searchTerm, setSearchTerm] = useState('');    // نص البحث
    const [showModal, setShowModal] = useState(false);   // إظهار النموذج
    const [editingCar, setEditingCar] = useState<Car | null>(null); // السيارة المحددة للتعديل
    const [submitting, setSubmitting] = useState(false); // حالة الإرسال
    const [brands, setBrands] = useState<{ _id: string; name: string }[]>([]);

    // ── Showroom Import States ──
    const [encarUrl, setEncarUrl] = useState('');
    const [showImportSettings, setShowImportSettings] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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
            const [carsRes, settingsRes, brandsRes, showroomRes] = await Promise.all([
                api.cars.list({ status: filter, search: searchTerm, source: inventorySource }),
                api.settings.getPublic(),
                api.brands.list('cars', { targetShowroom: inventorySource }),
                api.showroom.getSettings()
            ]);

            if (carsRes.success) setCars(carsRes.data.cars);

            // تحديث أسعار الصرف من الإعدادات
            if (settingsRes.success && settingsRes.data.currencySettings) {
                setUsdToSar(settingsRes.data.currencySettings.usdToSar || 3.75);
                setUsdToKrw(settingsRes.data.currencySettings.usdToKrw || 1350);
            }

            if (brandsRes.success) setBrands(brandsRes.brands || []);
            if (showroomRes.success) setEncarUrl(showroomRes.data?.encarUrl || '');
        } catch (err) {
            console.error('فشل تحميل البيانات:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImportSave = async () => {
        setImportStatus(null);
        if (!encarUrl.trim() || !encarUrl.includes('encar.com')) {
            setImportStatus({ type: 'error', msg: isRTL ? 'يجب أن يكون الرابط من موقع car.encar.com' : 'Must be a car.encar.com URL' });
            return;
        }
        try {
            setImportLoading(true);
            const res = await api.showroom.updateSettings({ encarUrl: encarUrl.trim() });
            if (!res.success) {
                setImportStatus({ type: 'error', msg: res.message || (isRTL ? 'فشل الحفظ' : 'Save failed') });
                return;
            }

            setImportStatus({ type: 'success', msg: isRTL ? '✅ تم حفظ الرابط. جاري الاستيراد...' : '✅ Saved. Importing...' });
            const scrapeRes = await api.showroom.scrape();
            if (scrapeRes.success) {
                setImportStatus({ type: 'success', msg: scrapeRes.message || (isRTL ? '✅ تم الاستيراد بنجاح' : '✅ Import successful') });
                loadData();
            } else {
                setImportStatus({ type: 'error', msg: scrapeRes.message || (isRTL ? 'تم حفظ الرابط لكن فشل الاستيراد' : 'Saved but import failed') });
            }
        } catch { setImportStatus({ type: 'error', msg: isRTL ? 'فشل الاتصال بالخادم' : 'Server error' }); }
        finally { setImportLoading(false); }
    };

    const handleScrapeNow = async () => {
        setImportStatus(null);
        try {
            setImportLoading(true);
            setImportStatus({ type: 'success', msg: isRTL ? '⏳ جاري جلب السيارات... قد يستغرق هذا دقيقة.' : '⏳ Fetching cars... might take a minute.' });
            const res = await api.showroom.scrape();
            if (res.success) {
                setImportStatus({ type: 'success', msg: res.message });
                loadData();
            } else {
                setImportStatus({ type: 'error', msg: res.message || (isRTL ? 'فشل جلب السيارات' : 'Fetch failed') });
            }
        } catch { setImportStatus({ type: 'error', msg: isRTL ? 'فشل الاتصال بالخادم' : 'Server error' }); }
        finally { setImportLoading(false); }
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

    const handleSaveCurrency = async () => {
        setSavingCurrency(true);
        try {
            await api.settings.updateCurrencySettings({ currencySettings: currencySettings as any });
            showToast(isRTL ? '✅ تم حفظ إعدادات العملة' : '✅ Currency settings saved', 'success');
        } catch (err) {
            showToast(isRTL ? '❌ فشل الحفظ' : '❌ Save failed', 'error');
        } finally {
            setSavingCurrency(false);
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

            <AdminPageShell
                title={!requestedSource
                    ? (isRTL ? 'المعرض' : 'SHOWROOM')
                    : (inventorySource === 'korean_import' ? (isRTL ? 'المعرض الكوري' : 'KOREAN SHOWROOM') : (isRTL ? 'معرض HM CAR' : 'HM CAR GALLERY'))
                }
                titleEn={!requestedSource ? 'GALLERY CONTROL' : (inventorySource === 'korean_import' ? 'KOREAN OPS' : 'LOCAL OPS')}
                backHref={requestedSource ? '/admin/cars' : '/admin/dashboard'}
                isRTL={isRTL}
                actions={requestedSource && (
                    <div className="flex items-center gap-3">
                        {inventorySource === 'hm_local' ? (
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="ck-btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'إضافة سيارة جديدة' : 'ADD NEW VEHICLE'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowImportSettings(!showImportSettings)}
                                className={cn(
                                    "ck-btn-primary flex items-center gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10",
                                    showImportSettings && "bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                )}
                            >
                                <Globe className="w-4 h-4" />
                                {isRTL ? 'إعدادات الاستيراد' : 'IMPORT SETTINGS'}
                            </button>
                        )}
                    </div>
                )}
            >

                {/* ─── Showroom Import Control Panel ─── */}
                <AnimatePresence>
                    {showImportSettings && inventorySource === 'korean_import' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <div className="ck-card p-8 border-blue-500/20 bg-blue-500/5">
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                    {/* Encar Config */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">{isRTL ? 'تكوين استيراد Encar' : 'ENCAR IMPORT PROTOCOL'}</h3>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">AUTOMATED SCRAPER CONFIG</p>
                                            </div>
                                        </div>
                                        <textarea
                                            value={encarUrl}
                                            onChange={(e) => setEncarUrl(e.target.value)}
                                            placeholder="https://car.encar.com/list/car?page=1&search=..."
                                            className="ck-input w-full h-32 resize-none font-mono text-[11px] bg-black/40 border-white/5 focus:border-blue-500/40 p-4"
                                            dir="ltr"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleImportSave}
                                                disabled={importLoading}
                                                className="ck-btn-primary bg-blue-500 border-none text-black hover:bg-blue-400 flex-1 text-[11px] h-12"
                                            >
                                                {importLoading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ وتحديث الرابط' : 'CONNECT & SAVE')}
                                            </button>
                                            <button
                                                onClick={handleScrapeNow}
                                                disabled={importLoading}
                                                className="ck-btn-primary bg-white/5 border-white/10 hover:border-blue-500/40 text-white flex-1 text-[11px] h-12"
                                            >
                                                {importLoading ? (isRTL ? 'جاري الجلب...' : 'FETCHING...') : (isRTL ? 'جلب البيانات الآن' : 'FORCE SCRAPE')}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Currency & Multipliers (Moved from Settings) */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black uppercase tracking-widest">{isRTL ? 'معاملات التسعير والتحويل' : 'PRICING & CALCULATIONS'}</h3>
                                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">FINANCIAL MATRIX CTRL</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'الدولار مقابل الريال' : 'USD TO SAR'}</label>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/40" />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={currencySettings.usdToSar}
                                                        onChange={e => setCurrencySettings({ ...currencySettings, usdToSar: parseFloat(e.target.value) })}
                                                        className="ck-input pl-9 text-xs h-11 bg-black/40"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'الدولار مقابل الكوري' : 'USD TO KRW'}</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500/40" />
                                                    <input
                                                        type="number"
                                                        value={currencySettings.usdToKrw}
                                                        onChange={e => setCurrencySettings({ ...currencySettings, usdToKrw: parseFloat(e.target.value) })}
                                                        className="ck-input pl-9 text-xs h-11 bg-black/40"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">{isRTL ? 'مضاعف سعر القطع' : 'PARTS MULTIPLIER'}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={currencySettings.partsMultiplier}
                                                    onChange={e => setCurrencySettings({ ...currencySettings, partsMultiplier: parseFloat(e.target.value) })}
                                                    className="ck-input text-xs h-11 bg-orange-500/5 border-orange-500/20"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1">{isRTL ? 'مضاعف المزادات' : 'AUCTION MULTIPLIER'}</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={currencySettings.auctionMultiplier}
                                                    onChange={e => setCurrencySettings({ ...currencySettings, auctionMultiplier: parseFloat(e.target.value) })}
                                                    className="ck-input text-xs h-11 bg-orange-500/5 border-orange-500/20"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSaveCurrency}
                                            disabled={savingCurrency}
                                            className="w-full h-12 bg-orange-500 rounded-xl text-black font-black text-[11px] uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_4px_15px_rgba(249,115,22,0.3)] disabled:opacity-50"
                                        >
                                            {savingCurrency ? (isRTL ? 'جاري المزامنة...' : 'SYNCING...') : (isRTL ? 'تحديث المصفوفة المالية' : 'UPDATE FINANCIAL MATRIX')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

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
                                        <ArrowLeft className={cn("w-5 h-5", isRTL ? "" : "rotate-180")} />
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
                                <div className="absolute inset-0 bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-all rounded-full" />
                                <div className="ck-card p-10 flex flex-col items-center text-center gap-6 h-[400px] justify-center hover:border-red-500/40 transition-all bg-black/40 backdrop-blur-xl group-hover:translate-y-[-8px]">
                                    <div className="w-24 h-24 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                        <Globe className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white group-hover:text-red-400 transition-colors mb-2">
                                            {isRTL ? 'المعرض الكوري' : 'KOREAN SHOWROOM'}
                                        </h2>
                                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                                            {isRTL ? 'إدارة السيارات المستوردة من كوريا' : 'MANAGE KOREAN IMPORTED CARS'}
                                        </p>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-red-500/40 group-hover:text-red-400 transition-colors transition-all">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{isRTL ? 'دخول النظام' : 'INITIATE ACCESS'}</span>
                                        <ArrowLeft className={cn("w-5 h-5", isRTL ? "" : "rotate-180")} />
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

            </AdminPageShell>

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
