'use client';

/**
 * صفحة الفاتورة - تُفتح عند الضغط على زر "فاتورة" في الطلبات
 * تعرض فاتورة احترافية قابلة للطباعة أو الحفظ كـ PDF
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, Download, ArrowLeft, CheckCircle, Car, Calendar, Hash, User, Phone, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { useLanguage } from '@/lib/LanguageContext';
import { motion } from 'framer-motion';

export default function InvoicePage() {
    const { id } = useParams();
    const router = useRouter();
    const { isRTL } = useLanguage();
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

    const invoiceDate = order ? new Date(order.createdAt).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : '';

    const statusLabel = (s: string) => {
        const map: Record<string, string> = {
            pending: isRTL ? 'قيد الانتظار' : 'Pending',
            confirmed: isRTL ? 'مؤكد' : 'Confirmed',
            completed: isRTL ? 'مكتمل' : 'Completed',
            cancelled: isRTL ? 'ملغي' : 'Cancelled',
        };
        return map[s] || s;
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
            />
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-black flex items-center justify-center text-white text-center">
            <div>
                <p className="text-2xl font-bold mb-4">{error}</p>
                <button onClick={() => router.back()} className="px-6 py-3 bg-white/10 rounded-xl text-sm">
                    {isRTL ? 'العودة' : 'Go Back'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* ── أزرار التحكم - لا تُطبع ── */}
            <div className="no-print fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {isRTL ? 'العودة للطلبات' : 'Back to Orders'}
                </button>
                <div className="flex gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-black text-xs uppercase tracking-wider rounded-xl hover:bg-white/90 transition-all"
                    >
                        <Printer className="w-4 h-4" />
                        {isRTL ? 'طباعة / PDF' : 'Print / PDF'}
                    </motion.button>
                </div>
            </div>

            {/* ── محتوى الفاتورة ── */}
            <div className="min-h-screen bg-white pt-20 pb-16 px-8 print:pt-0 print:px-0" dir={isRTL ? 'rtl' : 'ltr'}>
                <div className="max-w-3xl mx-auto">

                    {/* رأس الفاتورة */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-black/10 print:border-black/20">
                        <div>
                            <div className="text-4xl font-black tracking-tighter mb-1">
                                CAR<span className="text-red-600">HM</span>
                            </div>
                            <div className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
                                {isRTL ? 'منصة مزادات السيارات الفاخرة' : 'Premium Car Auction Platform'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">info@hmcar.com</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black uppercase tracking-widest text-gray-800">
                                {isRTL ? 'فاتورة' : 'INVOICE'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 font-mono">
                                #{order?.orderNumber || id?.toString().slice(-8).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">{invoiceDate}</div>
                        </div>
                    </div>

                    {/* بيانات الطلب والعميل */}
                    <div className="grid grid-cols-2 gap-8 mb-10">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {isRTL ? 'بيانات المشتري' : 'BUYER DETAILS'}
                            </div>
                            <div className="text-sm font-bold text-gray-800">{order?.buyer?.name || order?.buyerName || (isRTL ? 'العميل' : 'Customer')}</div>
                            {order?.buyer?.phone && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {order.buyer.phone}
                                </div>
                            )}
                            {order?.buyer?.email && (
                                <div className="text-xs text-gray-500 mt-1">{order.buyer.email}</div>
                            )}
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {isRTL ? 'تفاصيل الطلب' : 'ORDER DETAILS'}
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{isRTL ? 'رقم الطلب:' : 'Order No:'}</span>
                                    <span className="font-mono font-bold">{order?.orderNumber || id?.toString().slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{isRTL ? 'التاريخ:' : 'Date:'}</span>
                                    <span className="font-bold">{invoiceDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">{isRTL ? 'الحالة:' : 'Status:'}</span>
                                    <span className={`font-black uppercase text-[10px] ${order?.status === 'completed' ? 'text-green-600' : order?.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'}`}>
                                        {statusLabel(order?.status)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* جدول السيارة */}
                    <table className="w-full mb-8">
                        <thead>
                            <tr className="border-b-2 border-black">
                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-gray-500 pb-3">
                                    {isRTL ? 'البند' : 'ITEM'}
                                </th>
                                <th className="text-center text-[10px] font-black uppercase tracking-widest text-gray-500 pb-3">
                                    {isRTL ? 'الكمية' : 'QTY'}
                                </th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-gray-500 pb-3">
                                    {isRTL ? 'المبلغ' : 'AMOUNT'}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-100">
                                <td className="py-6">
                                    <div className="flex items-start gap-4">
                                        {order?.car?.image && (
                                            <img
                                                src={order.car.image}
                                                alt={order?.car?.title}
                                                className="w-20 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                            />
                                        )}
                                        <div>
                                            <div className="font-black text-gray-900 text-base">{order?.car?.title || (isRTL ? 'السيارة' : 'Vehicle')}</div>
                                            {order?.car?.make && (
                                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                    <Car className="w-3 h-3" />
                                                    {order.car.make}
                                                </div>
                                            )}
                                            {order?.car?.year && (
                                                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {isRTL ? 'موديل ' : 'Year '} {order.car.year}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="py-6 text-center text-sm font-bold text-gray-600">1</td>
                                <td className="py-6 text-right">
                                    <div className="text-xl font-black text-gray-900">
                                        {Number(order?.totalAmount || 0).toLocaleString()}
                                        <span className="text-sm font-bold text-gray-400 ml-1">SAR</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* الإجمالي */}
                    <div className="flex justify-end mb-10">
                        <div className="w-72 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{isRTL ? 'المجموع الجزئي' : 'Subtotal'}</span>
                                <span className="font-bold">{Number(order?.totalAmount || 0).toLocaleString()} SAR</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{isRTL ? 'الضريبة' : 'Tax'}</span>
                                <span className="font-bold">—</span>
                            </div>
                            <div className="border-t-2 border-black pt-3 flex justify-between text-lg font-black text-black">
                                <span>{isRTL ? 'الإجمالي' : 'TOTAL'}</span>
                                <span>{Number(order?.totalAmount || 0).toLocaleString()} SAR</span>
                            </div>
                        </div>
                    </div>

                    {/* ملاحظة وتوقيع */}
                    {order?.status === 'completed' && (
                        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-8 print:border-green-300">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-sm font-bold text-green-700">
                                {isRTL ? 'تم إتمام هذه المعاملة بنجاح' : 'This transaction has been completed successfully'}
                            </span>
                        </div>
                    )}

                    {/* تذييل الفاتورة */}
                    <div className="pt-8 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-400 font-semibold">
                            {isRTL
                                ? 'شكراً لثقتكم بـ HM CAR — هذه الفاتورة تم إنشاؤها تلقائياً'
                                : 'Thank you for choosing HM CAR — This invoice was generated automatically'}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1">
                            car-auction-sand.vercel.app · info@hmcar.com
                        </p>
                    </div>
                </div>
            </div>

            {/* CSS للطباعة */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    @page { margin: 1.5cm; }
                }
            `}</style>
        </>
    );
}
