'use client';

/**
 * سياق رسائل التنبيه (ToastContext)
 * المسؤول عن إظهار رسائل منبثقة سريعة للمستخدم (نجاح، خطأ، معلومات) في زاوية الشاشة.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void; // دالة لإظهار تنبيه جديد
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        // حذف التنبيه من القائمة بناءً على معرفه
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        // إخفاء التنبيه تلقائياً بعد 4 ثوانٍ
        setTimeout(() => removeToast(id), 4000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 100, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 100, scale: 0.9 }}
                            className="pointer-events-auto"
                        >
                            <div className={`
                                flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border min-w-[300px]
                                ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                        'bg-blue-500/10 border-blue-500/20 text-blue-400'}
                            `}>
                                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                                {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                                {(toast.type === 'info' || toast.type === 'warning') && <Info className="w-5 h-5 flex-shrink-0" />}

                                <span className="text-[13px] font-bold uppercase tracking-wide flex-grow">
                                    {toast.message}
                                </span>

                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 hover:bg-white/5 rounded-full transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

/**
 * خطاف مخصص لاستخدام نظام التنبيهات في أي مكان بالتطبيق
 */
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
