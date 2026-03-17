'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';

function InvoiceContent() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isRTL } = useLanguage();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInvoice = async () => {
            try {
                setLoading(true);
                const res = await api.invoices.getById(id as string);
                if (res?.success && res.data) {
                    setInvoice(res.data);
                    // If print query param is present, handle print after load
                    if (searchParams.get('print') === 'true') {
                        setTimeout(() => window.print(), 1000);
                    }
                } else {
                    setError(isRTL ? 'لم يتم العثور على الفاتورة' : 'Invoice not found');
                }
            } catch (err) {
                console.error('Failed to load invoice:', err);
                setError(isRTL ? 'حدث خطأ في تحميل الفاتورة' : 'Failed to load invoice');
            } finally {
                setLoading(false);
            }
        };
        if (id) loadInvoice();
    }, [id, isRTL, searchParams]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <div className="min-h-screen bg-[#070711] flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full"
            />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-white flex items-center justify-center text-center font-sans text-black">
            <div className="p-8 border border-gray-100 rounded-2xl shadow-sm">
                <p className="text-xl font-bold mb-4">{error}</p>
                <button onClick={() => router.back()} className="px-5 py-2 bg-black text-white rounded-lg text-sm font-bold">
                    {isRTL ? 'العودة' : 'Go Back'}
                </button>
            </div>
        </div>
    );

    const formatNum = (val: number, isUsd = false) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: isUsd ? 2 : 0,
            maximumFractionDigits: isUsd ? 2 : 0,
        }).format(val || 0);
    };

    const invoiceDateStr = invoice?.invoiceDate ? 
        new Date(invoice.invoiceDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 
        new Date().toLocaleDateString('en-GB').replace(/\//g, '-');

    return (
        <div className="bg-gray-200 min-h-screen print:bg-white font-sans overflow-x-hidden text-black">
            {/* ── التحكم بالصفحة ── */}
            <div className="no-print fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors text-sm font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة للقائمة' : 'Back to List'}
                </button>
                <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        HM-INV OFFICIAL SYSTEM
                    </span>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-black/20"
                    >
                        <Printer className="w-4 h-4" />
                        {isRTL ? 'طباعة الفاتورة' : 'Print Invoice'}
                    </button>
                </div>
            </div>

            {/* ── جسم الفاتورة الرسمي ── */}
            <div className="flex justify-center py-20 print:py-0">
                <div 
                    className="relative bg-white w-[210mm] min-h-[297mm] p-[1.5cm] shadow-2xl print:shadow-none print:w-full print:p-[1.2cm]" 
                    id="invoice-content"
                    dir="ltr"
                >
                    {/* العلامة المائية الخلفية */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none z-0">
                        <div className="flex items-center gap-6 rotate-[-15deg]">
                           <span className="text-[200px] font-black tracking-tighter">HM</span>
                           <span className="text-[200px] font-light tracking-tighter">CAR</span>
                        </div>
                    </div>

                    <div className="relative z-10 font-serif text-gray-900">
                        
                        {/* العنوان المركزي */}
                        <div className="text-center mb-12">
                            <h1 className="text-[38px] font-bold tracking-[0.3em] uppercase leading-none">Invoice</h1>
                        </div>

                        {/* الترويسة العليا */}
                        <div className="flex justify-between items-start mb-12 px-2">
                            <div className="w-[60%]">
                                <div className="mb-4">
                                    <svg width="120" height="40" viewBox="0 0 120 40" className="fill-black">
                                        <path d="M5 28C5 28 20 25 40 25C60 25 75 15 90 15C105 15 110 18 110 25V32H5V28Z" stroke="black" strokeWidth="1" fill="none" />
                                        <text x="5" y="38" style={{ font: 'bold 22px sans-serif' }}>HM</text>
                                        <text x="55" y="38" style={{ font: 'normal 22px sans-serif' }}>CAR</text>
                                    </svg>
                                </div>
                                <div className="text-[10px] font-sans font-bold space-y-0.5 mt-2 leading-tight">
                                    <p className="text-[13px] font-black">HM Car Export Company</p>
                                    <p>#202,</p>
                                    <p>203-dong, 519-2, Cheonghak-dong, Yeonsu-gu, Incheon</p>
                                </div>
                            </div>
                            <div className="w-[40%] font-sans flex flex-col items-end pt-4">
                                <div className="space-y-1 text-[11px] font-bold">
                                    <div className="flex justify-between gap-4">
                                        <span className="uppercase">ORDER NO</span>
                                        <span className="font-mono">: {invoice?.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="uppercase">DATE</span>
                                        <span className="font-mono">: {invoiceDateStr}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* العميل الموجه له */}
                        <div className="mb-10 text-[14px] font-sans px-2">
                            <p className="font-black text-base mb-2 uppercase">
                                Company {invoice?.buyerName}
                            </p>
                            <p className="leading-relaxed font-bold text-gray-700 italic text-[12px]">
                                We are pleased to offer you the following terms and conditions, <br />
                                and are subject to your final confirmation.
                            </p>
                        </div>

                        {/* جدول المنتجات */}
                        <div className="mb-10 px-1">
                            <table className="w-full border-collapse border-[1.2px] border-black text-center text-[11px] font-sans">
                                <thead>
                                    <tr className="bg-gray-50 font-black border-b-[1.2px] border-black uppercase">
                                        <th className="border-r-[1.2px] border-black py-3 w-[12%]">ITEM</th>
                                        <th className="border-r-[1.2px] border-black py-3 w-[45%]">PRODUCT</th>
                                        <th className="border-r-[1.2px] border-black py-3 w-[10%]">QUANTITY</th>
                                        <th className="border-r-[1.2px] border-black py-3 w-[16.5%]">TOTAL AMOUNT (KRW)</th>
                                        <th className="py-3 w-[16.5%]">TOTAL AMOUNT ($)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice?.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="h-16">
                                            <td className="border-r-[1.2px] border-b-[1.2px] border-black font-black uppercase">CAR</td>
                                            <td className="border-r-[1.2px] border-b-[1.2px] border-black px-4 py-3 text-center">
                                                <p className="font-black text-[13px] uppercase leading-tight">
                                                    {item.description}
                                                </p>
                                            </td>
                                            <td className="border-r-[1.2px] border-b-[1.2px] border-black font-black">{item.qty || 1}</td>
                                            <td className="border-r-[1.2px] border-b-[1.2px] border-black font-black">
                                                KRW {formatNum(item.unitPriceKrw * item.qty)}
                                            </td>
                                            <td className="border-b-[1.2px] border-black font-black uppercase">
                                                ${formatNum(item.unitPriceUsd * item.qty, true)}
                                            </td>
                                        </tr>
                                    ))}
                                    {/* مساحات فارغة كما في الصورة */}
                                    {Array.from({ length: Math.max(0, 5 - (invoice?.items?.length || 0)) }).map((_, i) => (
                                        <tr key={`empty-${i}`} className="h-8">
                                            <td className="border-r-[1.2px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.2px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.2px] border-b border-gray-300"></td>
                                            <td className="border-r-[1.2px] border-b border-gray-300"></td>
                                            <td className="border-b border-gray-300"></td>
                                        </tr>
                                    ))}
                                    <tr className="h-12 font-black text-gray-900 border-t-[1.2px] border-black">
                                        <td className="border-r-[1.2px] border-black uppercase text-[12px]">TOTAL</td>
                                        <td className="border-r-[1.2px] border-black"></td>
                                        <td className="border-r-[1.2px] border-black text-sm">
                                            {invoice?.items?.reduce((prev: number, curr: any) => prev + (curr.qty || 1), 0)}
                                        </td>
                                        <td className="border-r-[1.2px] border-black capitalize italic">KRW {formatNum(invoice?.totalKrw)}</td>
                                        <td className="capitalize italic">${formatNum(invoice?.totalUsd, true)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* الشروط (المطابقة للصورة تماماً) */}
                        <div className="grid grid-cols-1 font-sans px-2 mb-10">
                            <div className="space-y-1.5 text-[10.5px] font-black text-gray-900 uppercase tracking-tight">
                                <p>1. TOTAL: {formatNum(invoice?.totalUsd, true)} US DOLLARS</p>
                                <p>2. QUANTITY: {invoice?.items?.reduce((p: number, c: any) => p + (c.qty || 1), 0)} UNIT OF USED CAR</p>
                                <p>3. SHIPMENT: WITHIN 4 WEEKS AFTER PAYMENT</p>
                                <p>4. ORIGIN: REPUBLIC OF KOREA</p>
                                <p>5. PACKING: EXPORT STANDARD PACKING</p>
                                <p>6. PAYMENT TERM: BY T/T 100% IN ADVANCE</p>
                                <p>7. DESTINATION: {invoice?.destination || 'DAMMAM, SAUDI ARABIA'}</p>
                                <p>8. REMARKS: INDUSTRIAL BANK OF KOREA</p>
                            </div>
                        </div>

                        {/* البيانات البنكية */}
                        <div className="px-2 mb-14">
                            <div className="text-[11px] font-sans font-black space-y-0.5 ml-14">
                                <p>SWIFT CODE: CZNBKRSEXXX</p>
                                <p>BENEFICIARY: HM Car Export Company</p>
                                <p>ACCOUNT NO: 900968 -11- 028966</p>
                            </div>
                        </div>

                        {/* التوقيع والختم الكوري المثالي */}
                        <div className="flex justify-between items-end px-2">
                             <div className="text-[11px] font-sans font-black uppercase italic text-gray-900">
                                Accepted and confirmed by HM Car Export Company
                             </div>
                             
                             {/* الختم الكوري (الشكل الرسمي من الصورة) */}
                             <div className="relative mr-4 mb-2 flex items-center gap-3">
                                <div className="border-[2px] border-blue-800 p-2 text-blue-800 leading-none">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[18px] font-black border-b border-blue-800 mb-1">111-18-07521</span>
                                        <span className="text-[12px] font-black mb-0.5">에치엠카 &nbsp; 조하나</span>
                                        <div className="text-[7px] font-bold text-center">
                                            인천시 연수구 한동로 313<br/>
                                            B동 2512호 4-5
                                        </div>
                                        <div className="text-[6px] font-black flex gap-2 border-t border-blue-800 mt-1 pt-0.5">
                                            <span>도매 및 소매업</span>
                                            <span>자동차 및 부품수출<br/>식품/عارف/화장품</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-[-25px] top-[-5px] w-12 h-12 rounded-full border-[2.2px] border-red-600 flex items-center justify-center p-[1px]">
                                    <div className="w-full h-full rounded-full border border-red-600/50 flex flex-col items-center justify-center text-red-600 font-black text-[7px] leading-[1.1]">
                                        <span>에치엠</span><br/><span>카</span>
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
                        padding: 1.2cm !important;
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

export default function CustomInvoiceViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070711] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <InvoiceContent />
        </Suspense>
    );
}
