'use client';

import { useLanguage } from '@/lib/LanguageContext';

/**
 * useLocale hook - wrapper around useLanguage for consistency
 * Provides locale information and translation function
 */
export function useLocale() {
    const { t, isRTL, lang } = useLanguage();

    return {
        t,
        isRTL,
        locale: lang,
        language: lang,
        lang
    };
}

export default useLocale;
