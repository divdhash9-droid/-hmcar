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
 * تم تصميمها لتحاكي النماذج الورقية الرسمية للشركة
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
        <div className="min-h-screen bg-white flex items-center justify-center text-center">
            <div>
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={() => router.back()} className="px-5 py-2 bg-black text-white rounded-lg text-sm">
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

    const orderDate = order?.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : '';

    return (
        <div className="bg-gray-100 min-h-screen print:bg-white">
            {/* ── التحكم بالصفحة ── */}
            <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-semibold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة' : 'Back'}
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-6 py-2 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition-all shadow-lg shadow-black/10"
                >
                    <Printer className="w-4 h-4" />
                    {isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
                </button>
            </div>

            {/* ── جسم الفاتورة الرسمي ── */}
            <div className="flex justify-center py-24 print:py-0">
                <div 
                    className="relative bg-white w-[210mm] min-h-[297mm] p-[1.5cm] shadow-xl print:shadow-none print:w-full print:p-[1cm]" 
                    id="invoice-content"
                    dir="ltr"
                >
                    {/* العلامة المائية الخلفية */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none z-0">
                        <div className="flex items-center gap-6 rotate-[-15deg]">
                           <span className="text-[200px] font-black tracking-tighter">HM</span>
                           <span className="text-[200px] font-light tracking-tighter">CAR</span>
                        </div>
                    </div>

                    <div className="relative z-10 font-serif text-gray-900 leading-tight">
                        
                        {/* العنوان المركزي */}
                        <div className="text-center mb-12">
                            <h1 className="text-4xl font-bold tracking-[0.3em] inline-block border-b-2 border-black pb-2 px-8 uppercase">Invoice</h1>
                        </div>

                        {/* الترويسة العليا */}
                        <div className="flex justify-between items-start mb-16">
                            <div className="w-[55%]">
                                <div className="mb-6">
                                    <svg width="140" height="50" viewBox="0 0 120 40" className="fill-black">
                                        <path d="M5 28C5 28 20 25 40 25C60 25 75 15 90 15C105 15 110 18 110 25V32H5V28Z" stroke="black" strokeWidth="1.2" fill="none" opacity="0.7"/>
                                        <text x="2" y="38" style={{ font: 'bold 24px sans-serif' }}>HM</text>
                                        <text x="52" y="38" style={{ font: 'normal 24px sans-serif' }}>CAR</text>
                                    </svg>
                                </div>
                                <div className="text-[11px] font-sans font-semibold space-y-0.5 mt-2">
                                    <p className="text-sm font-bold">HM Car Export Company</p>
                                    <p>#202,</p>
                                    <p>203-dong, 519-2, Cheonghak-dong, Yeonsu-gu, Incheon</p>
                                </div>
                            </div>
                            <div className="w-[40%] font-sans pt-1">
                                <div className="flex flex-col gap-1 text-[11px]">
                                    <div className="flex justify-between border-b border-gray-100 pb-1">
                                        <span className="font-bold">ORDER NO</span>
                                        <span className="text-right font-mono">: {order?.orderNumber || id?.toString().slice(-8).toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">DATE</span>
                                        <span className="text-right">: {orderDate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* المقدمة والعميل */}
                        <div className="mb-10 text-[13px] font-sans">
                            <p className="font-bold text-base mb-3 leading-none italic uppercase">
                                Company {order?.buyerName || order?.buyer?.name || 'AL-THUQA NADERE'} For Trading
                            </p>
                            <p className="leading-relaxed font-medium">
                                We are pleased to offer you the following terms and conditions, and are subject to your final confirmation.
                            </p>
                        </div>

                        {/* جدول المنتجات */}
                        <div className="mb-12 overflow-hidden">
                            <table className="w-full border-collapse border border-gray-800 text-center text-[11px] font-sans">
                                <thead>
                                    <tr className="bg-gray-50 font-bold border-b border-gray-800 uppercase">
                                        <th className="border border-gray-800 py-3 w-[15%]">ITEM</th>
                                        <th className="border border-gray-800 py-3 w-[45%]">PRODUCT</th>
                                        <th className="border border-gray-800 py-3 w-[10%]">QTY</th>
                                        <th className="border border-gray-800 py-3 w-[15%] text-[10px]">TOTAL (KRW)</th>
                                        <th className="border border-gray-800 py-3 w-[15%] text-[10px]">TOTAL ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="h-24">
                                        <td className="border border-gray-800 font-bold text-sm">CAR</td>
                                        <td className="border border-gray-800 px-4 py-3 leading-snug">
                                            <p className="font-black text-[15px] uppercase tracking-wide">
                                                {order?.car?.title || 'Vehicle'}
                                            </p>
                                            <p className="mt-2 font-bold text-gray-600 text-[13px]">{order?.car?.year || ''}</p>
                                        </td>
                                        <td className="border border-gray-800 font-bold text-sm">1</td>
                                        <td className="border border-gray-800 font-bold text-blue-900 bg-gray-50/30">KRW {formatNum(totalKrw)}</td>
                                        <td className="border border-gray-800 font-bold text-blue-900 bg-gray-50/30">${formatNum(totalUsd, true)}</td>
                                    </tr>
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <tr key={i} className="h-8">
                                            <td className="border border-gray-800"></td>
                                            <td className="border border-gray-800"></td>
                                            <td className="border border-gray-800"></td>
                                            <td className="border border-gray-800"></td>
                                            <td className="border border-gray-800"></td>
                                        </tr>
                                    ))}
                                    <tr className="h-12 bg-gray-100/50 font-black text-gray-900">
                                        <td className="border border-gray-800 uppercase tracking-widest">TOTAL</td>
                                        <td className="border border-gray-800"></td>
                                        <td className="border border-gray-800 text-sm">1</td>
                                        <td className="border border-gray-800">KRW {formatNum(totalKrw)}</td>
                                        <td className="border border-gray-800">${formatNum(totalUsd, true)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* الشروط والبيانات المصرفية */}
                        <div className="grid grid-cols-5 gap-10 font-sans">
                            <div className="col-span-3">
                                <ol className="list-decimal ml-5 space-y-1.5 text-[10px] uppercase font-bold text-gray-800 leading-tight">
                                    <li>TOTAL: {formatNum(totalUsd, true)} US DOLLARS</li>
                                    <li>QUANTITY: 1 UNIT OF USED CAR</li>
                                    <li>SHIPMENT: WITHIN 4 WEEKS AFTER PAYMENT</li>
                                    <li>ORIGIN: REPUBLIC OF KOREA</li>
                                    <li>PACKING: EXPORT STANDARD PACKING</li>
                                    <li>PAYMENT TERM: BY T/T 100% IN ADVANCE</li>
                                    <li>DESTINATION: {order?.destination || 'DAMMAM, SAUDI ARABIA'}</li>
                                    <li>REMARKS: INDUSTRIAL BANK OF KOREA</li>
                                </ol>

                                <div className="mt-12 text-[10.5px] font-sans font-bold space-y-1 leading-tight">
                                    <p>SWIFT CODE: CZNBKRSEXXX</p>
                                    <p>BENEFICIARY: HM Car Export Company</p>
                                    <p>ACCOUNT NO: 900968 -11- 028966</p>
                                    
                                    <div className="mt-10">
                                        <p className="text-[12px] font-black uppercase text-gray-700 italic border-l-4 border-gray-800 pl-3">
                                            Accepted and confirmed by HM Car Export Company
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* التوقيع والختم */}
                            <div className="col-span-2 flex flex-col items-center justify-end pb-12">
                                <div className="relative transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                                    {/* مستطيل الختم الأزرق */}
                                    <div className="border-[3px] border-blue-800 rounded-sm p-3 text-blue-900 font-sans text-[10px] leading-none flex items-center gap-3 bg-white/50 backdrop-blur-[1px] shadow-sm">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <span className="text-xl font-black italic tracking-widest border-b-2 border-blue-800 pb-0.5">111-18-07521</span>
                                            <span className="text-sm font-black tracking-widest uppercase">에치엠카 &nbsp; 조하나</span>
                                            <div className="flex flex-col items-center text-[8px] font-bold">
                                                <span>인천시 연수구 한동로 313</span>
                                                <span>8동 2512호 4-5</span>
                                            </div>
                                            <div className="w-full flex justify-between gap-4 border-t border-blue-800 pt-1 mt-1 text-[7px] font-bold opacity-80 uppercase leading-[1.2]">
                                               <span className="text-center">Automobile & Parts Export</span>
                                               <span className="text-center">Foods / Clothing / Beauty</span>
                                            </div>
                                        </div>
                                        {/* الختم الدائري الأحمر */}
                                        <div className="w-12 h-12 rounded-full border-[3px] border-red-600/80 p-0.5 flex items-center justify-center">
                                            <div className="w-full h-full rounded-full border border-red-600/50 flex items-center justify-center text-red-700 font-black text-[7px] text-center leading-[1.1] scale-105">
                                                에치엠카<br/>조하나
                                            </div>
                                        </div>
                                    </div>
                                    {/* تأثير التوقيع اليدوي فوق الختم (اختياري) */}
                                    <div className="absolute top-[-30px] right-2 w-32 h-20 opacity-30 select-none pointer-events-none">
                                        <svg viewBox="0 0 100 60" className="fill-none stroke-blue-900 stroke-[1.5]">
                                            <path d="M10 40 Q30 10 50 40 T90 30" />
                                            <path d="M20 45 Q40 20 60 45" />
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
                    font-family: 'OfficialSerif', serif;
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
