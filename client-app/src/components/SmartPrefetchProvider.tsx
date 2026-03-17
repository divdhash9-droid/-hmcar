'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAPI } from '@/lib/api';

/**
 * SmartPrefetchProvider - مزود نظام التحميل المسبق الذكي
 * يقوم بتوقع الصفحات التي سيفتحها العميل ويحمل بياناتها في الخلفية.
 */
export default function SmartPrefetchProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // [[ARABIC_COMMENT]] لا تفعل شيئاً إذا كان الإنترنت ضعيفاً أو المستخدم في وضع توفير البيانات
        if (typeof window === 'undefined') return;
        const conn = (navigator as any).connection;
        if (conn && (conn.saveData || conn.effectiveType.includes('2g'))) return;

        const handleMouseEnter = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('a');
            if (!target || !target.href) return;

            const url = new URL(target.href);
            if (url.origin !== window.location.origin) return;

            const path = url.pathname;

            // 1. [[ARABIC_COMMENT]] إخبار Next.js بتحميل الكود البرمجي للصفحة مسبقاً
            router.prefetch(path);

            // 2. [[ARABIC_COMMENT]] إذا كان الرابط لصفحة سيارة، حمل بيانات الـ API في الكاش
            if (path.startsWith('/cars/')) {
                const carId = path.split('/')[2];
                if (carId) {
                    fetchAPI(`/api/v2/cars/${carId}`, { useCache: true }).catch(() => {});
                }
            }
            
            // 3. [[ARABIC_COMMENT]] إذا كان لقسم قطع الغيار
            if (path.startsWith('/parts/')) {
                const partId = path.split('/')[2];
                if (partId) {
                    fetchAPI(`/api/v2/parts/${partId}`, { useCache: true }).catch(() => {});
                }
            }
        };

        // [[ARABIC_COMMENT]] إضافة مستمع لجميع الروابط المفتوحة
        document.addEventListener('mouseenter', handleMouseEnter, true);
        return () => document.removeEventListener('mouseenter', handleMouseEnter, true);
    }, [router]);

    return <>{children}</>;
}
