'use client';
import { useState, useEffect } from 'react';

/**
 * هوك لكشف إذا كان التطبيق يعمل في وضع Standalone (مثبت كتطبيق)
 * يعمل على Android و iOS
 */
export function useStandalone(): boolean {
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const check = () => {
            const standalone =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;
            setIsStandalone(standalone);
        };

        check();

        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        mediaQuery.addEventListener('change', check);
        return () => mediaQuery.removeEventListener('change', check);
    }, []);

    return isStandalone;
}
