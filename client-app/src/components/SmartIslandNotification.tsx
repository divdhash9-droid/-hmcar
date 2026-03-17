'use client';

/**
 * مكون إشعارات الـ Smart Island
 * يظهر إشعارات عائمة في أعلى الصفحة بتصميم مشابه لـ Dynamic Island في iOS.
 * يتم تفعيله عبر أحداث مخصصة (Custom Events) في المتصفح.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, X, ChevronRight, Gavel, Car, Info, CheckCircle2, AlertTriangle, Terminal, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

/**
 * واجهة تعريف التنبيه (Smart Alert Interface)
 */
export interface SmartAlert {
    id: string; // معرف فريد للتنبيه
    title: string; // عنوان التنبيه
    message: string; // نص الرسالة
    type: 'auction' | 'car' | 'promo' | 'info' | 'success' | 'warning' | 'system' | 'message'; // نوع التنبيه لتحديد الأيقونة واللون
    actionLabel?: string; // نص الزر (اختياري)
    onAction?: () => void; // الوظيفة التي تنفذ عند الضغط على الزر (اختياري)
}

export default function SmartIslandNotification() {
    const { isRTL } = useLanguage();
    const [alert, setAlert] = useState<SmartAlert | null>(null);

    useEffect(() => {
        /**
         * معالج الأحداث المخصصة (Custom Event Handler)
         * يستقبل البيانات من أي مكان في التطبيق يقوم بإرسال الحدث 'hm_smart_alert'.
         */
        const handleAlert = (e: any) => {
            const data = e.detail as SmartAlert;
            setAlert(data);
            // يتم إخفاء التنبيه تلقائياً بعد 6 ثوانٍ لضمان تجربة مستخدم غير مزعجة
            setTimeout(() => setAlert(null), 6000);
        };

        // تسجيل المستمع للحدث المخصص 'hm_smart_alert'
        window.addEventListener('hm_smart_alert' as any, handleAlert);
        return () => window.removeEventListener('hm_smart_alert' as any, handleAlert);
    }, []);

    if (!alert) return null;

    // تعيين الأيقونات لكل نوع من أنواع التنبيهات
    const Icons = {
        auction: Gavel,
        car: Car,
        promo: Sparkles,
        info: Info,
        success: CheckCircle2,
        warning: AlertTriangle,
        system: Terminal,
        message: MessageSquare
    };

    const Icon = Icons[alert.type] || Bell;

    return (
        <div className="fixed top-6 left-0 right-0 z-[200] flex justify-center pointer-events-none px-6">
            <AnimatePresence>
                {alert && (
                    <motion.div
                        initial={{ y: -100, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.9 }}
                        className="pointer-events-auto"
                    >
                        {/* تصميم الـ Island (كبسولة الإشعار) */}
                        <div className="relative group">
                            {/* تأثير التوهج الخلفي - Decorative Glow */}
                            <div className="absolute -inset-0.5 bg-linear-to-r from-cinematic-neon-blue via-purple-500 to-accent-gold rounded-full opacity-30 blur-md group-hover:opacity-100 transition duration-1000"></div>
                            
                            <div className="relative flex items-center gap-4 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-full px-2 py-2 pr-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[320px] max-w-[500px]">
                                {/* دائرة الأيقونة - Icon Circle */}
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0",
                                    alert.type === 'auction' ? "bg-accent-red" : 
                                    alert.type === 'promo' ? "bg-accent-gold" : 
                                    alert.type === 'success' ? "bg-green-500" :
                                    alert.type === 'warning' ? "bg-red-500" :
                                    alert.type === 'system' ? "bg-zinc-700" :
                                    alert.type === 'message' ? "bg-blue-500" :
                                    "bg-cinematic-neon-blue"
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                {/* محتوى النص - Content */}
                                <div className="flex-1 min-w-0 py-1">
                                    <h4 className="text-[14px] font-black tracking-tight text-white line-clamp-1 italic uppercase">
                                        {alert.title}
                                    </h4>
                                    <p className="text-[10px] text-white/50 font-bold tracking-wide line-clamp-1 truncate">
                                        {alert.message}
                                    </p>
                                </div>

                                {/* أزرار التحكم (إجراء أو إغلاق) - Action button or Close */}
                                <div className="flex items-center gap-2">
                                    {alert.actionLabel ? (
                                        <button 
                                            onClick={() => { alert.onAction?.(); setAlert(null); }}
                                            className="px-4 py-1.5 bg-white/10 hover:bg-white text-[10px] font-black text-white hover:text-black rounded-full transition-all uppercase tracking-widest flex items-center gap-1.5"
                                        >
                                            {alert.actionLabel}
                                            <ChevronRight className={cn("w-3 h-3", isRTL && "rotate-180")} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => setAlert(null)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors"
                                            title={isRTL ? 'إغلاق' : 'Close'}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
