'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { useSettings } from '@/lib/SettingsContext';
import { motion } from 'framer-motion';
import { resolveOrderSnapshot, getOrderGrandTotalSar } from '@/lib/orderCurrency';

/**
 * صفحة الفاتورة الرسمية (HM CAR)
 * تم تصميمها لتحاكي النماذج الورقية الرسمية للشركة المرسلة في الصورة
 */
export default function InvoicePage() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
    const { currency: fallbackRates } = useSettings();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);
                const res = await api.orders.getById(id as string);
                if (res?.success && res.data) {
                    setOrder(res.data);
                } else {
                    setError(isRTL ? 'لم يتم العثور على الطلب' : 'Order not found');
                }
            } catch (err) {
                console.error('Failed to load order:', err);
                setError(isRTL ? 'حدث خطأ في تحميل الطلب' : 'Failed to load order');
            } finally {
                setLoading(false);
            }
        };
        if (id) loadOrder();
    }, [id, isRTL]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-4 border-gray-900 border-t-transparent rounded-full"
            />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-center font-sans">
            <div className="p-8 border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-xl font-bold mb-4 text-gray-800">{error}</p>
                <button onClick={() => router.back()} className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold">
                    {isRTL ? 'العودة' : 'Go Back'}
                </button>
            </div>
        </div>
    );

    // التحويلات المالية بناءً على الطلب
    const snapshot = resolveOrderSnapshot(order, fallbackRates);
    const totalSar = getOrderGrandTotalSar(order);
    const totalUsd = totalSar / (snapshot.usdToSar || 3.75);
    const totalKrw = totalUsd * (snapshot.usdToKrw || 1350);

    const formatNum = (val: number, isUsd = false) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: isUsd ? 2 : 0,
            maximumFractionDigits: isUsd ? 2 : 0,
        }).format(val);
    };

    // تنسيق التاريخ DD-MM-YYYY كما في الصورة
    const orderDate = order?.createdAt ? 
        new Date(order.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-') : 
        new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    return (
        <div className="bg-gray-200 min-h-screen print:bg-white font-sans overflow-x-hidden">
            {/* ── التحكم بالصفحة ── */}
            <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة للطلبات' : 'Back to Orders'}
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Invoice Preview
                    </span>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-black/20"
                    >
                        <Printer className="w-4 h-4" />
                        {isRTL ? 'طباعة / PDF' : 'Print / PDF'}
                    </button>
                </div>
            </div>

            {/* ── جسم الفاتورة الرسمي ── */}
            <div className="flex justify-center py-24 print:py-0">
                <div 
                    className="relative bg-white w-[210mm] min-h-[297mm] p-[1.5cm] shadow-2xl print:shadow-none print:w-full print:p-[1cm]" 
                    id="invoice-content"
                    dir="ltr"
                >
                    {/* العلامة المائية الخلفية */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                        <div className="flex items-center gap-6 rotate-[-15deg]">
                           <span className="text-[220px] font-black tracking-tighter">HM</span>
                           <span className="text-[220px] font-light tracking-tighter">CAR</span>
                        </div>
                    </div>

                    <div className="relative z-10 font-serif text-gray-900">
                        
                        {/* العنوان المركزي الضخم */}
                        <div className="text-center mb-10">
                            <h1 className="text-[44px] font-bold tracking-[0.4em] inline-block border-b-4 border-black pb-2 px-12 uppercase leading-none">Invoice</h1>
                        </div>

                        {/* الترويسة العليا */}
                        <div className="flex justify-between items-start mb-16 px-2">
                            <div className="w-[55%]">
                                <div className="mb-6">
                                    <svg width="150" height="50" viewBox="0 0 120 40" className="fill-black">
                                        <path d="M5 28C5 28 20 25 40 25C60 25 75 15 90 15C105 15 110 18 110 25V32H5V28Z" stroke="black" strokeWidth="1.2" fill="none" opacity="0.8"/>
                                        <text x="2" y="38" style={{ font: 'bold 24px sans-serif' }}>HM</text>
                                        <text x="52" y="38" style={{ font: 'normal 24px sans-serif' }}>CAR</text>
                                    </svg>
                                </div>
                                <div className="text-[11px] font-sans font-bold space-y-0.5 mt-4 leading-tight">
                                    <p className="text-sm font-black mb-1">HM Car Export Company</p>
                                    <p>#202,</p>
                                    <p>203-dong, 519-2, Cheonghak-dong, Yeonsu-gu, Incheon</p>
                                </div>
                            </div>
                            <div className="w-[45%] font-sans pr-2">
                                <div className="flex flex-col gap-2 text-[11px] font-black items-end pt-2">
                                    <div className="flex justify-between w-full max-w-[220px]">
                                        <span className="text-gray-900">ORDER NO</span>
                                        <span className="text-right font-mono">: {order?.orderNumber || id?.toString().slice(-10).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between w-full max-w-[220px]">
                                        <span className="text-gray-900">DATE</span>
                                        <span className="text-right font-mono">: {orderDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* المقدمة والعميل */}
                        <div className="mb-10 text-[14px] font-sans px-2">
                            <p className="font-black text-base mb-3 leading-none uppercase italic border-l-4 border-black pl-3 py-1">
                                Company {order?.buyerName || order?.buyer?.name || 'AL-THUQA NADERE'} For Trading
                            </p>
                            <p className="leading-relaxed font-bold text-gray-700 italic">
                                We are pleased to offer you the following terms and conditions, and are subject to your final confirmation.
                            </p>
                        </div>

                        {/* جدول المنتجات */}
                        <div className="mb-12 px-1">
                            <table className="w-full border-collapse border-[1.5px] border-gray-900 text-center text-[10.5px] font-sans">
                                <thead>
                                    <tr className="bg-gray-100 font-black border-b-[1.5px] border-gray-900 uppercase">
                                        <th className="border-r-[1.5px] border-gray-900 py-3.5 w-[14%]">ITEM</th>
                                        <th className="border-r-[1.5px] border-gray-900 py-3.5 w-[42%]">PRODUCT</th>
                                        <th className="border-r-[1.5px] border-gray-900 py-3.5 w-[10%]">QUANTITY</th>
                                        <th className="border-r-[1.5px] border-gray-900 py-3.5 w-[17%]">TOTAL AMOUNT (KRW)</th>
                                        <th className="py-3.5 w-[17%]">TOTAL AMOUNT ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="h-28">
                                        <td className="border-r-[1.5px] border-b-[1.5px] border-gray-900 font-black text-sm">CAR</td>
                                        <td className="border-r-[1.5px] border-b-[1.5px] border-gray-900 px-6 py-4 text-left">
                                            <p className="font-black text-[16px] uppercase tracking-wide leading-tight">
                                                {order?.car?.title || 'Hyundai Palisade'}
                                            </p>
                                            <p className="mt-2 font-black text-gray-600 text-[14px]">{order?.car?.year || '2022'}</p>
                                        </td>
                                        <td className="border-r-[1.5px] border-b-[1.5px] border-gray-900 font-black text-sm">1</td>
                                        <td className="border-r-[1.5px] border-b-[1.5px] border-gray-900 font-black text-blue-900 bg-gray-50/50">
                                            KRW {formatNum(totalKrw)}
                                        </td>
                                        <td className="border-b-[1.5px] border-gray-900 font-black text-blue-900 bg-gray-50/50">
                                            ${formatNum(totalUsd, true)}
                                        </td>
                                    </tr>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <tr key={i} className="h-9">
                                            <td className="border-r-[1.5px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.5px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.5px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.5px] border-b border-gray-300"></td>
                                            <td className="border-b border-gray-300"></td>
                                        </tr>
                                    ))}
                                    <tr className="h-14 bg-gray-50 font-black text-gray-900">
                                        <td className="border-r-[1.5px] border-gray-900 uppercase tracking-[0.2em] text-[11px]">TOTAL</td>
                                        <td className="border-r-[1.5px] border-gray-900"></td>
                                        <td className="border-r-[1.5px] border-gray-900 text-sm">1</td>
                                        <td className="border-r-[1.5px] border-gray-900">KRW {formatNum(totalKrw)}</td>
                                        <td>${formatNum(totalUsd, true)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* الشروط والبيانات المصرفية */}
                        <div className="grid grid-cols-5 gap-12 font-sans mt-8 px-2">
                            <div className="col-span-3">
                                <ol className="list-decimal ml-6 space-y-2 text-[10.5px] uppercase font-black text-gray-800 tracking-tight leading-none">
                                    <li>TOTAL: {formatNum(totalUsd, true)} US DOLLARS</li>
                                    <li>QUANTITY: 1 UNIT OF USED CAR</li>
                                    <li>SHIPMENT: WITHIN 4 WEEKS AFTER PAYMENT</li>
                                    <li>ORIGIN: REPUBLIC OF KOREA</li>
                                    <li>PACKING: EXPORT STANDARD PACKING</li>
                                    <li>PAYMENT TERM: BY T/T 100% IN ADVANCE</li>
                                    <li>DESTINATION: {order?.destination || 'DAMMAM, SAUDI ARABIA'}</li>
                                    <li>REMARKS: INDUSTRIAL BANK OF KOREA</li>
                                </ol>

                                <div className="mt-14 text-[11px] font-sans font-black space-y-1.5 leading-none bg-gray-50/50 p-4 rounded border-l-4 border-gray-900">
                                    <p>SWIFT CODE: CZNBKRSEXXX</p>
                                    <p>BENEFICIARY: HM Car Export Company</p>
                                    <p>ACCOUNT NO: 900968 -11- 028966</p>
                                    
                                    <div className="mt-10">
                                        <p className="text-[13px] font-black uppercase text-gray-900 italic tracking-wide">
                                            Accepted and confirmed by HM Car Export Company
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* التوقيع والختم - تصميم يحاكي الصورة */}
                            <div className="col-span-2 flex flex-col items-center justify-end pb-12 pr-4 relative">
                                <div className="relative transform rotate-[-3deg] scale-110">
                                    {/* مستطيل الختم الأزرق */}
                                    <div className="border-[2.5px] border-blue-800 p-3 bg-white/40 shadow-sm flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[20px] font-black italic tracking-widest text-blue-900 border-b-[2px] border-blue-800 mb-1 leading-none">111-18-07521</span>
                                            <span className="text-[13px] font-black tracking-widest text-blue-900 mb-0.5">에치엠카 &nbsp; 조하나</span>
                                            <div className="flex flex-col items-center text-[8px] font-black text-blue-800 leading-tight">
                                                <span>인천시 연수구 한동로 313</span>
                                                <span>8동 2512호 4-5</span>
                                            </div>
                                            <div className="w-full flex justify-between gap-3 border-t-[1.5px] border-blue-800 mt-1.5 pt-1 text-[7px] font-black text-blue-900 uppercase leading-none opacity-90">
                                               <span>Auto & Parts Export</span>
                                               <span>Grocery / Clothing</span>
                                            </div>
                                        </div>
                                        
                                        {/* الختم الدائري الأحمر */}
                                        <div className="w-12 h-12 rounded-full border-[2.5px] border-red-600 p-[1.5px] flex items-center justify-center">
                                            <div className="w-full h-full rounded-full border border-red-600/60 flex items-center justify-center text-red-600 font-black text-[7px] text-center leading-[1.1]">
                                                에치엠카<br/>조하나
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* تأثير التوقيع اليدوي الواضح */}
                                    <div className="absolute top-[-35px] right-[-10px] w-40 h-24 opacity-25 select-none pointer-events-none rotate-[10deg]">
                                        <svg viewBox="0 0 120 70" className="fill-none stroke-blue-950 stroke-[2]">
                                            <path d="M10 50 C20 20, 40 10, 60 50 T110 40" />
                                            <path d="M15 55 C35 25, 55 15, 75 55" />
                                            <path d="M25 60 C45 30, 65 20, 85 60" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style jsx global>{`
                @font-face {
                    font-family: 'OfficialSerif';
                    src: local('Times New Roman'), local('serif');
                }
                #invoice-content {
                    font-family: 'OfficialSerif', 'Times New Roman', serif;
                }
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; }
                    .flex.justify-center { margin: 0 !important; padding: 0 !important; }
                    #invoice-content {
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 1cm !important;
                        width: 100% !important;
                        min-height: auto !important;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
}
