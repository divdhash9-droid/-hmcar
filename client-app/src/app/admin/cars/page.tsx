'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { 
    Plus, Globe, DollarSign, TrendingUp, RefreshCw,
    Car as CarIcon 
} from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/LanguageContext';
import { api } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import AdminPageShell from '@/components/AdminPageShell';
import CarCard from './_components/CarCard';
import CarModal from './_components/CarModal';

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

function CarsContent() {
    const { isRTL } = useLanguage();
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const requestedSource = searchParams?.get('source');
    const inventorySource: 'hm_local' | 'korean_import' = requestedSource === 'korean_import' ? 'korean_import' : 'hm_local';

    const [cars, setCars] = useState<Car[]>([]);
    const [totalCarsCount, setTotalCarsCount] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showImportSettings, setShowImportSettings] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
    const [encarUrl, setEncarUrl] = useState('');
    const [brands, setBrands] = useState<Array<{_id: string, name: string}>>([]);
    
    const [currencySettings, setCurrencySettings] = useState({ usdToSar: 3.75, usdToKrw: 1350 });
    const [savingCurrency, setSavingCurrency] = useState(false);

    const usdToSar = currencySettings.usdToSar || 3.75;
    const usdToKrw = currencySettings.usdToKrw || 1350;

    const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await api.cars.list({ source: inventorySource, page, limit: 30 });
            if (res.success) {
                setCars(res.data?.cars || []);
                setTotalCarsCount(res.data?.pagination?.total || 0);
                setTotalPages(res.data?.pagination?.pages || 1);
            }

            const settingsRes = await api.showroom.getSettings();
            if (settingsRes.success) {
                setEncarUrl(settingsRes.data?.encarUrl || '');
            }

            const globalSettings = await api.settings.getPublic();
            if (globalSettings.success && globalSettings.data?.currencySettings) {
                setCurrencySettings(globalSettings.data.currencySettings);
            }

            const brandsRes = await api.brands.list('cars', { targetShowroom: inventorySource });
            if (brandsRes.success) setBrands((brandsRes as any).brands || []);
        } catch (err) {
            console.error('Failed to load cars:', err);
        } finally {
            setLoading(false);
        }
    }, [inventorySource, page]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleImportSave = async () => {
        setImportStatus(null);
        try {
            setImportLoading(true);
            const res = await api.showroom.updateSettings({ encarUrl });
            if (!res.success) {
                setImportStatus({ type: 'error', msg: res.message || (isRTL ? 'فشل حفظ الإعدادات' : 'Save failed') });
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
        } catch (err: any) { 
            setImportStatus({ type: 'error', msg: err?.message || (isRTL ? 'فشل الاتصال بالخادم' : 'Server error') }); 
        }
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
        } catch (err: any) { 
            setImportStatus({ type: 'error', msg: err?.message || (isRTL ? 'فشل الاتصال بالخادم' : 'Server error') }); 
        }
        finally { setImportLoading(false); }
    };

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

    const handleEdit = (car: Car) => {
        setEditingCar(car);
        const sarPrice = car.price || 0;
        const usd = car.usdPrice ?? (car.priceUsd || parseFloat((sarPrice / usdToSar).toFixed(2)));
        const krw = car.krwPrice ?? (car.priceKrw || Math.round((usd * usdToKrw)));
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

    const resetForm = () => {
        setFormData({
            ...EMPTY_FORM,
            source: inventorySource,
            listingType: inventorySource === 'korean_import' ? 'showroom' : 'store'
        });
        setEditingCar(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
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

    const handleDelete = async (id: string) => {
        if (!confirm(isRTL ? 'هل أنت متأكد من حذف هذه السيارة؟' : 'Delete this car?')) return;
        try {
            await api.cars.delete(id);
            loadData();
            showToast(isRTL ? '🗑️ تم الحذف' : '🗑️ Deleted', 'success');
        } catch {
            showToast(isRTL ? '❌ فشل الحذف' : '❌ Delete failed', 'error');
        }
    };

    const handleSaveCurrency = async () => {
        setSavingCurrency(true);
        try {
            await api.settings.updateCurrencySettings({ currencySettings: currencySettings as any });
            showToast(isRTL ? '✅ تم حفظ إعدادات العملة' : '✅ Currency settings saved', 'success');
        } catch {
            showToast(isRTL ? '❌ فشل حفظ الإعدادات' : '❌ Save failed', 'error');
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleMarkSold = async (id: string, title: string) => {
        const confirmed = confirm(isRTL
            ? `هل تأكد أنه تم بيع: ${title}؟\nسيتم إخفاؤها من المعرض فوراً.`
            : `Confirm sale of: ${title}?`
        );
        if (!confirmed) return;

        const soldPriceStr = prompt(isRTL ? 'أدخل سعر البيع الفعلي (اختياري):' : 'Enter sold price (optional):');
        const soldPrice = soldPriceStr ? parseFloat(soldPriceStr) : undefined;

        try {
            await api.cars.markSold(id, soldPrice);
            loadData();
            showToast(isRTL ? '✅ تم تسجيل البيع!' : '✅ Sale recorded!', 'success');
        } catch (err) {
            console.error('فشل تسجيل البيع:', err);
            showToast(isRTL ? '❌ فشل تسجيل البيع' : '❌ Sale record failed', 'error');
        }
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await api.cars.update(id, { isActive: !currentStatus });
            loadData();
            showToast(!currentStatus ? (isRTL ? '👁️ تم إظهار السيارة' : '👁️ Car shown') : (isRTL ? '🙈 تم إخفاء السيارة' : '🙈 Car hidden'), 'success');
        } catch {
            showToast(isRTL ? '❌ فشل التحديث' : '❌ Update failed', 'error');
        }
    };

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
                                title={isRTL ? 'إضافة سيارة جديدة' : 'Add New Vehicle'}
                                className="h-12 px-6 rounded-2xl bg-orange-500 text-black font-black text-xs uppercase tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                {isRTL ? 'إضافة سيارة' : 'ADD VEHICLE'}
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowImportSettings(!showImportSettings)}
                                title={isRTL ? 'إعدادات الاستيراد' : 'Import Settings'}
                                className={cn(
                                    "h-12 px-6 rounded-2xl border border-blue-400/30 text-blue-400 font-black text-xs uppercase tracking-widest hover:bg-blue-400/10 transition-all flex items-center gap-2",
                                    showImportSettings && "bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                                )}
                            >
                                <Globe className="w-4 h-4" />
                                {isRTL ? 'استيراد' : 'IMPORT'}
                            </button>
                        )}
                    </div>
                )}
            >
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
                                            title={isRTL ? 'رابط Encar للاستيراد' : 'Encar Import URL'}
                                            className="ck-input w-full h-32 resize-none font-mono text-[11px] bg-black/40 border-white/5 focus:border-blue-500/40 p-4"
                                            dir="ltr"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleImportSave}
                                                disabled={importLoading}
                                                title={isRTL ? 'حفظ وتحديث الرابط' : 'Connect & Save'}
                                                className="ck-btn-primary bg-blue-500 border-none text-black hover:bg-blue-400 flex-1 text-[11px] h-12"
                                            >
                                                {importLoading ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'حفظ وتحديث الرابط' : 'CONNECT & SAVE')}
                                            </button>
                                            <button
                                                onClick={handleScrapeNow}
                                                disabled={importLoading}
                                                title={isRTL ? 'جلب البيانات الآن' : 'Force Scrape'}
                                                className="ck-btn-primary bg-white/5 border-white/10 hover:border-blue-500/40 text-white flex-1 text-[11px] h-12"
                                            >
                                                {importLoading ? (isRTL ? 'جاري الجلب...' : 'FETCHING...') : (isRTL ? 'جلب البيانات الآن' : 'FORCE SCRAPE')}
                                            </button>
                                        </div>
                                        {importStatus && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={cn(
                                                    "p-3 rounded-xl text-[10px] font-bold text-center border animate-pulse",
                                                    importStatus.type === 'success' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                                                )}
                                            >
                                                {importStatus.msg}
                                            </motion.div>
                                        )}
                                    </div>

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
                                                        title={isRTL ? 'تحويل الدولار للريال' : 'USD to SAR Conversion'}
                                                        onChange={e => setCurrencySettings({ ...currencySettings, usdToSar: parseFloat(e.target.value) })}
                                                        className="ck-input pl-9 text-xs h-11 bg-black/40"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{isRTL ? 'الدولار مقابل الون' : 'USD TO KRW'}</label>
                                                <div className="relative">
                                                    <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500/40" />
                                                    <input
                                                        type="number"
                                                        value={currencySettings.usdToKrw}
                                                        title={isRTL ? 'تحويل الدولار للون' : 'USD to KRW Conversion'}
                                                        onChange={e => setCurrencySettings({ ...currencySettings, usdToKrw: parseInt(e.target.value) })}
                                                        className="ck-input pl-9 text-xs h-11 bg-black/40"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleSaveCurrency}
                                            disabled={savingCurrency}
                                            title={isRTL ? 'حفظ إعدادات العملة' : 'Save Currency Settings'}
                                            className="w-full h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-black transition-all"
                                        >
                                            {savingCurrency ? (isRTL ? 'جاري الحفظ...' : 'SAVING...') : (isRTL ? 'تحديث مصفوفة الأسعار' : 'UPDATE FINANCIAL MATRIX')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {requestedSource && (
                    <div className="flex justify-between items-center mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold uppercase tracking-widest">{isRTL ? 'إجمالي السيارات في هذا القسم:' : 'Total Cars:'} <span className={inventorySource === 'korean_import' ? 'text-blue-400' : 'text-orange-500'}>{totalCarsCount}</span></h2>
                        </div>
                    </div>
                )}

                {!requestedSource ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <NextLink href="/admin/cars?source=hm_local" className="group block h-full">
                                <div className="ck-card p-10 h-full border-red-500/10 group-hover:border-red-500/40 transition-all flex flex-col items-center text-center justify-center space-y-6">
                                    <div className="w-24 h-24 rounded-[30%] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                        <CarIcon className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter mb-2">{isRTL ? 'معرض HM CAR' : 'HM CAR SHOWROOM'}</h3>
                                        <p className="text-white/40 text-xs leading-relaxed max-w-xs">{isRTL ? 'إدارة السيارات المتاحة في معرض HM CAR، إضافة وتعديل وتحكم كامل.' : 'Manage available vehicles in HM CAR showroom with full CRUD control.'}</p>
                                    </div>
                                    <div className="cockpit-mono text-[10px] text-red-500 tracking-[0.3em] font-black">{isRTL ? 'فتح المعرض' : 'ENTER GALLERY'}</div>
                                </div>
                            </NextLink>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <NextLink href="/admin/cars?source=korean_import" className="group block h-full">
                                <div className="ck-card p-10 h-full border-blue-500/10 group-hover:border-blue-500/40 transition-all flex flex-col items-center text-center justify-center space-y-6">
                                    <div className="w-24 h-24 rounded-[30%] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <Globe className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter mb-2">{isRTL ? 'المعرض الكوري' : 'KOREAN SHOWROOM'}</h3>
                                        <p className="text-white/40 text-xs leading-relaxed max-w-xs">{isRTL ? 'استيراد وإدارة السيارات المباشرة من كوريا عبر نظام Encar Scraper.' : 'Direct Korean import management powered by real-time Encar scraper.'}</p>
                                    </div>
                                    <div className="cockpit-mono text-[10px] text-blue-400 tracking-[0.3em] font-black">{isRTL ? 'فتح المعرض المستورد' : 'ENTER IMPORT HUB'}</div>
                                </div>
                            </NextLink>
                        </motion.div>
                    </div>
                ) : loading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-6">
                        <RefreshCw className="w-10 h-10 text-red-500 animate-spin" />
                        <span className="cockpit-mono text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Initializing Data Stream...</span>
                    </div>
                ) : cars.length === 0 ? (
                    <div className="ck-empty py-32">
                        <div className="ck-empty-icon"><CarIcon className="w-8 h-8" /></div>
                        <p className="cockpit-mono text-sm">{isRTL ? 'لا توجد سيارات في هذا القسم' : 'NO VEHICLES FOUND IN THIS SECTOR'}</p>
                        <button onClick={resetForm} className="mt-8 ck-btn-primary h-12 px-8">{isRTL ? 'إضافة أول سيارة' : 'ADD FIRST VEHICLE'}</button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                            {cars.map((car, i) => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    index={i}
                                    usdToSar={usdToSar}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onMarkSold={handleMarkSold}
                                    onToggleActive={handleToggleActive}
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-8 mb-12 bg-black/40 rounded-xl border border-white/5">
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(page - 1)} 
                                    className="ck-btn-primary bg-white/5 hover:bg-white/10 text-white px-6 h-10 disabled:opacity-20 disabled:cursor-not-allowed border-none shadow-none text-xs"
                                >
                                    {isRTL ? 'السابق' : 'Prev'}
                                </button>
                                <span className="text-white/50 text-xs font-mono font-bold px-4 tracking-widest">{page} / {totalPages}</span>
                                <button 
                                    disabled={page >= totalPages} 
                                    onClick={() => setPage(page + 1)} 
                                    className="ck-btn-primary bg-orange-500 hover:bg-orange-400 text-black px-6 h-10 disabled:opacity-20 disabled:cursor-not-allowed border-none shadow-none text-xs"
                                >
                                    {isRTL ? 'التالي' : 'Next'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </AdminPageShell>

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

export default function AdminCarsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CarsContent />
        </Suspense>
    );
}
