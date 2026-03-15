'use client';

/**
 * مكوّن بطاقة السيارة - CarCard
 * يعرض معلومات سيارة واحدة في شبكة إدارة السيارات
 * يشمل: الصورة، الاسم، السعر، وأزرار الإجراءات (تعديل، بيع، حذف)
 */

import { motion } from 'framer-motion';
import { Edit, Eye, Trash2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/lib/LanguageContext';

// ── نوع بيانات السيارة ──
interface Car {
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
}

// ── خصائص المكوّن ──
interface CarCardProps {
    car: Car;
    index: number;
    usdToSar: number;
    onEdit: (car: Car) => void;
    onDelete: (id: string) => void;
    onMarkSold: (id: string, title: string) => void;
    onToggleActive?: (id: string, current: boolean) => void;
}

export default function CarCard({ car, index, usdToSar, onEdit, onDelete, onMarkSold, onToggleActive }: CarCardProps) {
    const { isRTL } = useLanguage();

    // استخراج اسم الماركة سواء كانت object أو string
    const makeName = typeof car.make === 'object' ? car.make?.name : car.make;

    // عرض السعر حسب عملة العرض المختارة
    const displayPrice = car.displayCurrency === 'USD'
        ? `${((car.price || 0) / usdToSar).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`
        : `${Number(car.price || 0).toLocaleString()} SAR`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07 }}
            className="ck-card overflow-hidden group ck-hover-lift"
        >
            {/* ── صورة السيارة ── */}
            <div className="relative h-52 overflow-hidden">
                <Image
                    src={car.images?.[0] || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1000&auto=format&fit=crop'}
                    alt={car.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    quality={70}
                    priority={index < 3}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* تدرج سفلي لتحسين قراءة النص */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-transparent to-transparent" />

                {/* شارة الحالة (نشط / مباع / معطل) */}
                <div className="absolute top-3 end-3">
                    {car.isSold ? (
                        <span className="ck-badge ck-badge-active">✓ {isRTL ? 'مباع' : 'SOLD'}</span>
                    ) : !car.isActive ? (
                        <span className="ck-badge ck-badge-danger">{isRTL ? 'معطل' : 'OFF'}</span>
                    ) : (
                        <span className="ck-badge ck-badge-live ck-badge-active">{isRTL ? 'نشط' : 'LIVE'}</span>
                    )}
                </div>
            </div>

            {/* ── تفاصيل السيارة وأزرار الإجراءات ── */}
            <div className="p-5 space-y-4">
                <div>
                    {/* اسم الماركة */}
                    <p className="cockpit-mono text-[9px] text-orange-400/60 uppercase tracking-[0.2em] mb-1">
                        {makeName}
                    </p>
                    {/* اسم السيارة */}
                    <h3 className="text-base font-bold text-white truncate">{car.title}</h3>
                </div>

                {/* السعر وأزرار الإجراءات */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    {/* السعر */}
                    <div>
                        <p className="cockpit-mono text-[8px] text-white/25 uppercase mb-0.5">PRICE</p>
                        <p className="cockpit-num text-xl font-black text-orange-400">{displayPrice}</p>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex gap-1.5">
                        {/* زر التعديل */}
                        <button
                            onClick={() => onEdit(car)}
                            title={isRTL ? 'تعديل' : 'Edit'}
                            className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* زر العرض/الإخفاء (Toggle Active) */}
                        <button
                            onClick={() => onToggleActive && onToggleActive(car.id, car.isActive)}
                            title={car.isActive ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'إظهار' : 'Show')}
                            className={car.isActive
                                ? "w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center"
                                : "w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white/30 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center"
                            }
                        >
                            {car.isActive ? <Eye className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 opacity-50" />}
                        </button>

                        {/* زر تسجيل البيع - يظهر فقط إذا لم تُباع بعد */}
                        {!car.isSold && (
                            <button
                                onClick={() => onMarkSold(car.id, car.title)}
                                title={isRTL ? 'تم البيع' : 'Mark Sold'}
                                className="w-8 h-8 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* زر الحذف */}
                        <button
                            onClick={() => onDelete(car.id)}
                            title={isRTL ? 'حذف' : 'Delete'}
                            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
