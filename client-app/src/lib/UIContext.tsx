'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isFavoritesOpen: boolean;
    setFavoritesOpen: (open: boolean) => void;
    isNotificationsOpen: boolean;
    setNotificationsOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isFavoritesOpen, setFavoritesOpen] = useState(false);
    const [isNotificationsOpen, setNotificationsOpen] = useState(false);

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

export function useUI() {
    const context = useContext(UIContext);
    if (!context) throw new Error('useUI must be used within UIProvider');
    return context;
}
