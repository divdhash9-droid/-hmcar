'use client';

import { useEffect, useState } from 'react';
import { useStandalone } from '@/lib/useStandalone';
import { usePathname } from 'next/navigation';
import BottomTabBar from './BottomTabBar';
import GlobalDrawers from './GlobalDrawers';
import SmartIslandNotification from './SmartIslandNotification';
import AppBackground from './AppBackground';

/**
 * AppShell - غلاف التطبيق
 * يكشف إذا كان التطبيق يعمل كـ PWA مثبت
 * ويظهر Bottom Tab Bar بدلاً من الـ Navbar العادية
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
    const isStandalone = useStandalone();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        // تنظيف حالة التثبيت المخزنة إذا لم يكن التطبيق مثبتاً فعلياً
        // هذا يحل مشكلة "التطبيق مثبت بالفعل" عند حذف التطبيق وإعادة الزيارة
        if (mounted) {
            const INSTALLED_KEY = 'pwa_installed';
            const actuallyInstalled =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true;

            if (!actuallyInstalled) {
                // ليس في وضع standalone = التطبيق محذوف أو غير مثبت
                // نحذف الـ flag القديم حتى يظهر زر التثبيت مرة أخرى
                const wasMarkedInstalled = localStorage.getItem(INSTALLED_KEY);
                if (wasMarkedInstalled) {
                    localStorage.removeItem(INSTALLED_KEY);
                    localStorage.removeItem('pwa_dismissed_until');
                }
            }
        }
    }, [mounted]);

    if (!mounted) {
        return <>{children}</>;
    }

    if (isStandalone && !pathname?.startsWith('/admin')) {
        // ── وضع التطبيق المثبت ──
        return (
            <div
                className="relative min-h-screen"
                data-app-mode="standalone"
                style={{ paddingBottom: '80px' }} // مساحة للـ Bottom Tab Bar
            >
                {/* خلفية التطبيق الاحترافية */}
                <AppBackground />

                <main className="relative z-10">
                    {children}
                </main>
                
                <BottomTabBar />
                <GlobalDrawers />
                <SmartIslandNotification />
            </div>
        );
    }

    // ── وضع الموقع العادي ──
    return (
        <>
            {children}
            <GlobalDrawers />
            <SmartIslandNotification />
        </>
    );
}
