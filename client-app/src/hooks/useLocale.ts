'use client';

import { useLanguage } from '@/lib/LanguageContext';

/**
 * useLocale hook - wrapper around useLanguage for consistency
 * Provides locale information and translation function
 */
export function useLocale() {
    const { t, isRTL, language } = useLanguage();

    return {
        t,
        isRTL,
        locale: language,
        language
    };
}

export default useLocale;
