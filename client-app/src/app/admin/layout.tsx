'use client';

import { Suspense } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { useLanguage } from '@/lib/LanguageContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isRTL } = useLanguage();

    return (
        <div className="relative min-h-screen text-white bg-[#070711]" dir={isRTL ? 'rtl' : 'ltr'}>

            {/* Cockpit background grid */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025] bg-[linear-gradient(rgba(249,115,22,1)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,1)_1px,transparent_1px)] bg-[size:60px_60px]" />

            {/* Vignette */}
            <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,7,17,0.85)_100%)]" />

            {/* Cockpit Admin Sidebar */}
            <Suspense fallback={null}>
                <AdminNavbar />
            </Suspense>

            {/* Page content offset by AdminNavbar (260px) */}
            {/* lg:ps-[260px] (padding-inline-start) handles both RTL and LTR automatically */}
            <div className="relative z-10 pt-[64px] lg:pt-0 lg:ps-[260px] transition-all duration-300 overflow-hidden">
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </div>
        </div>
    );
}

