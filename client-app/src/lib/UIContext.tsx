'use client';

/**
 * سياق واجهة المستخدم (UIContext)
 * المسؤول عن إدارة حالة العناصر التفاعلية في الواجهة مثل فتح وإغلاق القوائم الجانبية (Drawers).
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isFavoritesOpen: boolean; // هل قائمة المفضلة مفتوحة؟
    setFavoritesOpen: (open: boolean) => void;
    isNotificationsOpen: boolean; // هل قائمة الإشعارات مفتوحة؟
    setNotificationsOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isFavoritesOpen, setFavoritesOpen] = useState(false); // حالة درج المفضلة
    const [isNotificationsOpen, setNotificationsOpen] = useState(false); // حالة درج الإشعارات

    return (
        <UIContext.Provider value={{ 
            isFavoritesOpen, 
            setFavoritesOpen, 
            isNotificationsOpen, 
            setNotificationsOpen 
        }}>
            {children}
        </UIContext.Provider>
    );
}

/**
 * خطاف مخصص لاستخدام حالات واجهة المستخدم في أي مكان
 */
export function useUI() {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
}
