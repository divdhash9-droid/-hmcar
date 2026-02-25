// [[ARABIC_HEADER]] هذا الملف (client-app/src/hooks/useLocale.ts) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

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
