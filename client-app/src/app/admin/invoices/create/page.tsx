'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Plus, FileText, ArrowLeft, Save, Trash2,
    Calculator, Globe, MapPin, User,
    DollarSign
} from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
export default function CreateInvoicePage() {
    const { isRTL } = useLanguage();
    const router = useRouter();
    const { currency } = useSettings();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        invoiceNumber: '',
        buyerName: '',
        buyerPhone: '',
        buyerAddress: '',
        destination: 'DAMMAM, SAUDI ARABIA',
        notes: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [
            { description: '', qty: 1, unitPriceKrw: 0, unitPriceUsd: 0, unitPriceSar: 0 }
        ],
        currencySnapshot: {
            usdToSar: currency?.usdToSar || 3.75,
            usdToKrw: currency?.usdToKrw || 1350,
        }
    });

    useEffect(() => {
        const fetchNextNumber = async () => {
            try {
                const res = await api.invoices.getNextNumber();
                if (res.success && res.data) {
                    setForm(prev => ({ ...prev, invoiceNumber: res.data }));
                }
            } catch (error) {
                console.error('Failed to fetch next invoice number:', error);
            }
        };
        fetchNextNumber();
    }, []);

    const addItem = () => {
        setForm({
            ...form,
            items: [...form.items, { description: '', qty: 1, unitPriceKrw: 0, unitPriceUsd: 0, unitPriceSar: 0 }]
        });
    };

    const removeItem = (idx: number) => {
        if (form.items.length === 1) return;
        setForm({
            ...form,
            items: form.items.filter((_, i) => i !== idx)
        });
    };

    const updateItem = (idx: number, field: string, value: any) => {
        const newItems = [...form.items];
        (newItems[idx] as any)[field] = value;

        // Auto calculate other prices if one is entered
        if (field === 'unitPriceUsd') {
            newItems[idx].unitPriceKrw = Math.round(Number(value) * form.currencySnapshot.usdToKrw);
            newItems[idx].unitPriceSar = Number((Number(value) * form.currencySnapshot.usdToSar).toFixed(2));
        } else if (field === 'unitPriceKrw') {
            newItems[idx].unitPriceUsd = Number((Number(value) / form.currencySnapshot.usdToKrw).toFixed(2));
            newItems[idx].unitPriceSar = Number((newItems[idx].unitPriceUsd * form.currencySnapshot.usdToSar).toFixed(2));
        }

        setForm({ ...form, items: newItems });
    };

    const totals = form.items.reduce((acc, item) => {
        acc.krw += (item.unitPriceKrw || 0) * (item.qty || 0);
        acc.usd += (item.unitPriceUsd || 0) * (item.qty || 0);
        acc.sar += (item.unitPriceSar || 0) * (item.qty || 0);
        return acc;
    }, { krw: 0, usd: 0, sar: 0 });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const payload = {
                ...form,
                totalKrw: totals.krw,
                totalUsd: totals.usd,
                totalSar: totals.sar
            };
            const res = await api.invoices.create(payload);
            if (res.success && res.data) {
                alert(isRTL ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully');
                router.push(`/admin/invoices/${res.data._id}`);
            } else {
                alert(isRTL ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice');
            }
        } catch (error: any) {
            alert(error.message || 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1200px] mx-auto min-h-screen pb-32">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white/60 transition-all hover:text-white"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-widest uppercase">
                            {isRTL ? 'إصدار فاتورة جديدة' : 'G-INV UNIT INITIALIZATION'}
                        </h1>
                        <p className="text-white/40 text-[10px] font-mono mt-0.5 tracking-[0.2em] uppercase italic">
                            {isRTL ? 'أدخل البيانات لتوليد فاتورة HM CAR الرسمية' : 'Enter parameters for HM CAR official documentation'}
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 px-8 py-3.5 bg-accent-gold text-black font-black text-xs uppercase tracking-[0.25em] rounded-xl hover:bg-white transition-all shadow-[0_0_25px_rgba(201,169,110,0.3)] disabled:opacity-50"
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {isRTL ? 'حفظ وإصدار الفاتورة' : 'Save & Issue Invoice'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Buyer & Shipment */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Buyer Information Section */}
                    <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                            <User size={120} />
                        </div>
                        <div className="relative z-10 flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                <User className="w-4 h-4 text-orange-400" />
                            </div>
                            <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.25em]">Buyer Identification</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Invoice Number (Auto)</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none transition-all font-mono text-orange-400"
                                    placeholder="HM-INV-YEAR-..."
                                    value={form.invoiceNumber}
                                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Buyer Name</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none transition-all font-bold text-white placeholder:text-white/10"
                                    placeholder={isRTL ? 'اسم المشتري / الشركة' : 'AL-THUQA NADERE TRADING'}
                                    value={form.buyerName}
                                    onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Phone</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none transition-all font-mono"
                                    placeholder="+966 5..."
                                    value={form.buyerPhone}
                                    onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Address</label>
                                <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none transition-all"
                                    placeholder={isRTL ? 'إضافة العنوان بالكامل' : 'Full address information...'}
                                    value={form.buyerAddress}
                                    onChange={(e) => setForm({ ...form, buyerAddress: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-3xl backdrop-blur-md">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <FileText className="w-4 h-4 text-blue-400" />
                                </div>
                                <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.25em]">Cargo Manifest / Items</h2>
                            </div>
                            <button 
                                type="button" 
                                onClick={addItem}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-all bg-orange-400/5 px-4 py-2 rounded-lg border border-orange-400/10"
                            >
                                <Plus size={12} />
                                {isRTL ? 'إضافة بند' : 'Appended Record'}
                            </button>
                        </div>

                        <div className="space-y-4">
                            {form.items.map((item, idx) => (
                                <div key={idx} className="relative group/item bg-black/20 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-4">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Description</label>
                                                <input 
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-orange-500/50 outline-none"
                                                    placeholder={isRTL ? 'اسم السيارة أو الخدمة' : 'Hyundai Palisade 2022'}
                                                    value={item.description}
                                                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="w-24 space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20 text-center block">Qty</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-orange-500/50 outline-none text-center font-mono"
                                                    value={item.qty}
                                                    onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Unit KRW</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-blue-500/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-blue-500/50 outline-none font-mono text-blue-400"
                                                    value={item.unitPriceKrw}
                                                    onChange={(e) => updateItem(idx, 'unitPriceKrw', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Unit USD ($)</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-green-500/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-green-500/50 outline-none font-mono text-green-400"
                                                    value={item.unitPriceUsd}
                                                    onChange={(e) => updateItem(idx, 'unitPriceUsd', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Unit SAR (﷼)</label>
                                                <input 
                                                    type="number"
                                                    className="w-full bg-orange-500/5 border border-white/10 rounded-lg py-2.5 px-3 text-sm focus:border-orange-500/50 outline-none font-mono text-orange-400"
                                                    value={item.unitPriceSar}
                                                    onChange={(e) => updateItem(idx, 'unitPriceSar', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {form.items.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-black/50"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Settings & Summary */}
                <div className="space-y-8">
                    {/* General Settings Section */}
                    <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-3xl backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                                <Globe className="w-4 h-4 text-white/60" />
                            </div>
                            <h2 className="text-xs font-black text-white/60 uppercase tracking-[0.25em]">System Parameters</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input 
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-orange-500/50 outline-none font-bold uppercase"
                                        value={form.destination}
                                        onChange={(e) => setForm({ ...form, destination: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Invoice Date</label>
                                <input 
                                    type="date"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none font-mono"
                                    value={form.invoiceDate}
                                    onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                                />
                            </div>

                            {/* Exchange Rates Display */}
                            <div className="pt-4 border-t border-white/5 mt-4 space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-black text-white/20 uppercase tracking-widest">
                                    <span>Exchange Reality</span>
                                    <Calculator className="w-3 h-3" />
                                </div>
                                <div className="bg-black/30 p-4 rounded-xl border border-white/[0.03] flex justify-between gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.1em]">USD to Krw</span>
                                        <span className="font-mono text-xs text-white/80">{form.currencySnapshot.usdToKrw} ₩</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.1em]">USD to Sar</span>
                                        <span className="font-mono text-xs text-white/80">{form.currencySnapshot.usdToSar} ﷼</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 rounded-3xl relative overflow-hidden group shadow-[0_20px_40px_rgba(249,115,22,0.15)]">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.1] text-black">
                            <DollarSign size={140} />
                        </div>
                        <div className="relative z-10 flex flex-col gap-6">
                            <h2 className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Total Output Generation</h2>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-black/10 pb-4">
                                    <span className="text-[9px] font-black text-black/60 uppercase tracking-widest italic">KRW VALUATION</span>
                                    <span className="text-2xl font-black text-black font-mono tracking-tighter">₩{totals.krw.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-black/10 pb-4">
                                    <span className="text-[9px] font-black text-black/60 uppercase tracking-widest italic">USD VALUATION</span>
                                    <span className="text-2xl font-black text-black font-mono tracking-tighter">${totals.usd.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[9px] font-black text-black/60 uppercase tracking-widest italic">SAR VALUATION</span>
                                    <span className="text-2xl font-black text-black font-mono tracking-tighter">﷼{totals.sar.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Notes */}
                    <div className="bg-white/[0.03] border border-white/[0.05] p-8 rounded-3xl backdrop-blur-md">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2 block">Special Internal Notes (Optional)</label>
                        <textarea 
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-orange-500/50 outline-none h-24 resize-none"
                            placeholder="..."
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}
