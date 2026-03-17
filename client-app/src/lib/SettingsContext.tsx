'use client';

/**
 * سياق الإعدادات (SettingsContext)
 * المسؤول عن جلب وإدارة إعدادات الموقع العامة من الخادم، بما في ذلك أسعار العملات،
 * معلومات التواصل، ومحتوى الصفحة الرئيسية.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CurrencySettings {
    usdToSar: number; // سعر تحويل الدولار إلى ريال
    usdToKrw: number; // سعر تحويل الدولار إلى وون كوري
    activeCurrency: string; // العملة الافتراضية للموقع
    partsMultiplier?: number; // معامل ربح قطع الغيار
    auctionMultiplier?: number; // معامل ربح المزادات
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
    showSearchSection?: boolean;
    showLiveMarket?: boolean;
    showTrustHub?: boolean;
    showAdvertising?: boolean;
    showBuyingJourney?: boolean;
    showPlatformFeatures?: boolean;
    showBrandCatalog?: boolean;
    showTrustedBy?: boolean;
    showTestimonials?: boolean;
    showAppConversion?: boolean;
    showFAQ?: boolean;
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
    formatPrice: (priceInSar: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW', type?: 'part' | 'auction' | 'car') => string;
    formatPriceFromUsd: (priceInUsd: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW', type?: 'part' | 'auction' | 'car') => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<CurrencySettings>({ 
        usdToSar: 3.75, 
        usdToKrw: 1350, 
        activeCurrency: 'SAR',
        partsMultiplier: 1.0,
        auctionMultiplier: 1.0
    });
    const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: 'HM CAR', siteDescription: '', logoUrl: '', faviconUrl: '' });
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [homeContent, setHomeContent] = useState<HomeContent>({});
    const [features, setFeatures] = useState<Feature[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState<'SAR' | 'USD' | 'KRW'>('SAR');

    /**
     * تحديث الإعدادات من الخادم
     */
    const refreshSettings = useCallback(async () => {
        try {
            const res = await api.settings.getPublic();
            if (res.success && res.data) {
                if (res.data.currencySettings) setCurrency(res.data.currencySettings);
                if (res.data.siteInfo) setSiteInfo(res.data.siteInfo);
                if (res.data.socialLinks) setSocialLinks(res.data.socialLinks);
                if (res.data.homeContent) setHomeContent(res.data.homeContent);
                if (res.data.features) setFeatures(res.data.features);

                // تحديد العملة المفضلة للمستخدم من التخزين المحلي أو الإعدادات الافتراضية
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
     * دالة داخلية لتنسيق الرقم حسب العملة واللغة (Intl.NumberFormat)
     */
    const formatByCurrency = (amount: number, activeCurr: 'SAR' | 'USD' | 'KRW') => {
        let locale = 'ar-SA';
        if (activeCurr === 'USD') locale = 'en-US';
        if (activeCurr === 'KRW') locale = 'ko-KR';

        // استخدام واجهة برمجة تطبيقات التنسيق الدولية (Intl) لتنسيق الرقم حسب الدولة
        const formatter = new Intl.NumberFormat(locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: activeCurr === 'USD' ? 2 : 0, // الدولار يحتاج لمنزلتين عشريتين
        });

        const formattedNumber = formatter.format(amount);

        const symbols: Record<string, string> = {
            'SAR': 'ر.س',
            'USD': '$',
            'KRW': '₩'
        };

        return `${symbols[activeCurr]} ${formattedNumber}`;
    };

    /**
     * تنسيق السعر بناءً على العملة المختارة
     * السعر الأساسي في المتغير هو "ريال سعودي"
     */
    const formatPrice = (priceInSar: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW', type?: 'part' | 'auction' | 'car') => {
        const activeCurr = forcedCurrency || displayCurrency;
        let safeSar = Number(priceInSar || 0);

        // تطبيق معاملات الربح بناءً على نوع المنتج (قطع غيار أو مزاد)
        if (type === 'part' && currency.partsMultiplier) {
            safeSar *= currency.partsMultiplier;
        } else if (type === 'auction' && currency.auctionMultiplier) {
            safeSar *= currency.auctionMultiplier;
        }

        const priceInUsd = safeSar / Number(currency.usdToSar || 1);

        let finalPrice = safeSar;
        if (activeCurr === 'USD') {
            finalPrice = priceInUsd;
        } else if (activeCurr === 'KRW') {
            finalPrice = priceInUsd * Number(currency.usdToKrw || 0);
        }

        return formatByCurrency(finalPrice, activeCurr);
    };

    /**
     * تنسيق السعر عندما يكون السعر الأساسي بالدولار
     */
    const formatPriceFromUsd = (priceInUsd: number, forcedCurrency?: 'SAR' | 'USD' | 'KRW', type?: 'part' | 'auction' | 'car') => {
        const activeCurr = forcedCurrency || displayCurrency;
        let safeUsd = Number(priceInUsd || 0);

        // Apply multipliers if applicable
        if (type === 'part' && currency.partsMultiplier) {
            safeUsd *= currency.partsMultiplier;
        } else if (type === 'auction' && currency.auctionMultiplier) {
            safeUsd *= currency.auctionMultiplier;
        }

        let finalPrice = safeUsd;
        if (activeCurr === 'SAR') {
            finalPrice = safeUsd * Number(currency.usdToSar || 0);
        } else if (activeCurr === 'KRW') {
            finalPrice = safeUsd * Number(currency.usdToKrw || 0);
        }

        return formatByCurrency(finalPrice, activeCurr);
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
            formatPrice,
            formatPriceFromUsd
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
