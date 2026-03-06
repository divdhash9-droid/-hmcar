'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface CurrencySettings {
    usdToSar: number;
    activeCurrency: string;
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
    loading: boolean;
    refreshSettings: () => Promise<void>;
    displayCurrency: 'SAR' | 'USD';
    setDisplayCurrency: (c: 'SAR' | 'USD') => void;
    formatPrice: (price: number, forcedCurrency?: 'SAR' | 'USD') => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrency] = useState<CurrencySettings>({ usdToSar: 3.75, activeCurrency: 'SAR' });
    const [siteInfo, setSiteInfo] = useState<SiteInfo>({ siteName: 'HM CAR', siteDescription: '', logoUrl: '', faviconUrl: '' });
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [homeContent, setHomeContent] = useState<HomeContent>({});
    const [loading, setLoading] = useState(true);
    const [displayCurrency, setDisplayCurrency] = useState<'SAR' | 'USD'>('SAR');

    const refreshSettings = useCallback(async () => {
        try {
            const res = await api.settings.getPublic();
            if (res.success && res.data) {
                if (res.data.currencySettings) setCurrency(res.data.currencySettings);
                if (res.data.siteInfo) setSiteInfo(res.data.siteInfo);
                if (res.data.socialLinks) setSocialLinks(res.data.socialLinks);
                if (res.data.homeContent) setHomeContent(res.data.homeContent);

                // Set initial display currency from settings if not manually changed
                const stored = localStorage.getItem('displayCurrency');
                if (stored === 'USD' || stored === 'SAR') {
                    setDisplayCurrency(stored as 'SAR' | 'USD');
                } else {
                    setDisplayCurrency(res.data.currencySettings?.activeCurrency === 'USD' ? 'USD' : 'SAR');
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

    const handleSetDisplayCurrency = (c: 'SAR' | 'USD') => {
        setDisplayCurrency(c);
        localStorage.setItem('displayCurrency', c);
    };

    const formatPrice = (priceInSar: number, forcedCurrency?: 'SAR' | 'USD') => {
        const activeCurr = forcedCurrency || displayCurrency;
        let finalPrice = priceInSar;

        if (activeCurr === 'USD') {
            finalPrice = priceInSar / currency.usdToSar;
        }

        // Use custom formatting to match design (e.g. "SAR 100,000")
        const formatter = new Intl.NumberFormat(activeCurr === 'SAR' ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: activeCurr === 'USD' ? 2 : 0,
        });

        const formattedNumber = formatter.format(finalPrice);
        return `${formattedNumber} ${activeCurr}`;
    };

    return (
        <SettingsContext.Provider value={{
            currency,
            siteInfo,
            socialLinks,
            homeContent,
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
