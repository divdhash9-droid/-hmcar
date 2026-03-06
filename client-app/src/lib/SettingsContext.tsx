'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CurrencySettings {
    usdToSar: number;
    usdToKrw: number;
    activeCurrency: string;
}

interface Feature {
    _id?: string;
    icon: string;
    title: string;
    titleEn?: string;
    desc: string;
    descEn?: string;
}

interface SiteInfo {
    siteName: string;
    siteDescription: string;
    logoUrl: string;
    faviconUrl: string;
}

interface HomeContent {
    heroTitle?: string;
    heroSubtitle?: string;
    heroVideoUrl?: string;
}

interface SocialLinks {
    whatsapp?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    snapchat?: string;
    telegram?: string;
    linkedin?: string;
}

interface SettingsContextType {
    currency: CurrencySettings;
    siteInfo: SiteInfo;
    socialLinks: SocialLinks;
    homeContent: HomeContent;
    features: Feature[];
    loading: boolean;
    refreshSettings: () => Promise<void>;
    displayCurrency: 'SAR' | 'USD' | 'KRW';
    setDisplayCurrency: (c: 'SAR' | 'USD' | 'KRW') => void;
    formatPrice: (priceInSar: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW') => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<CurrencySettings>({ usdToSar: 3.75, usdToKrw: 1350, activeCurrency: 'SAR' });
    const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: 'HM CAR', siteDescription: '', logoUrl: '', faviconUrl: '' });
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [homeContent, setHomeContent] = useState<HomeContent>({});
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState<'SAR' | 'USD' | 'KRW'>('SAR');

    const refreshSettings = useCallback(async () => {
        try {
            const res = await api.settings.getPublic();
            if (res.success && res.data) {
                if (res.data.currencySettings) setCurrency(res.data.currencySettings);
                if (res.data.siteInfo) setSiteInfo(res.data.siteInfo);
                if (res.data.socialLinks) setSocialLinks(res.data.socialLinks);
                if (res.data.homeContent) setHomeContent(res.data.homeContent);
                if (res.data.features) setFeatures(res.data.features);

                // Set initial display currency from settings if not manually changed
                const stored = localStorage.getItem('displayCurrency');
                if (stored === 'USD' || stored === 'SAR' || stored === 'KRW') {
                    setDisplayCurrency(stored as 'SAR' | 'USD' | 'KRW');
                } else {
                    setDisplayCurrency(res.data.currencySettings?.activeCurrency === 'USD' ? 'USD' : (res.data.currencySettings?.activeCurrency === 'KRW' ? 'KRW' : 'SAR'));
                }
            }
        } catch (err) {
            console.error('Failed to fetch settings', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSettings();
    }, [refreshSettings]);

    const handleSetDisplayCurrency = (c: 'SAR' | 'USD' | 'KRW') => {
        setDisplayCurrency(c);
        localStorage.setItem('displayCurrency', c);
    };

    /**
     * تنسيق السعر بناءً على العملة المختارة
     * السعر الأساسي في المتغير هو "ريال سعودي"
     */
    const formatPrice = (priceInSar: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW') => {
        const activeCurr = forcedCurrency || displayCurrency;
        let finalPrice = priceInSar;

        // التحويل من الريال إلى الدولار أولاً ثم العملة المطلوبة إذا لزم الأمر
        const priceInUsd = priceInSar / currency.usdToSar;

        if (activeCurr === 'USD') {
            finalPrice = priceInUsd;
        } else if (activeCurr === 'KRW') {
            finalPrice = priceInUsd * currency.usdToKrw;
        }

        // استخدام التنسيق المناسب حسب العملة
        let locale = 'ar-SA';
        if (activeCurr === 'USD') locale = 'en-US';
        if (activeCurr === 'KRW') locale = 'ko-KR';

        const formatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: activeCurr === 'USD' ? 2 : 0,
        });

        const formattedNumber = formatter.format(finalPrice);

        // رموز العملات
        const symbols: Record<string, string> = {
            'SAR': 'ر.س',
            'USD': '$',
            'KRW': '₩'
        };

        return `${symbols[activeCurr]} ${formattedNumber}`;
    };

    return (
        <SettingsContext.Provider value={{
            currency,
            siteInfo,
            socialLinks,
            homeContent,
            features,
            loading,
            refreshSettings,
            displayCurrency,
            setDisplayCurrency: handleSetDisplayCurrency,
            formatPrice
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
