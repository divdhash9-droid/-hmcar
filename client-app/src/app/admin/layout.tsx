import type { Metadata } from 'next';
import AdminNavbar from '@/components/AdminNavbar';

export const metadata: Metadata = {
    title: 'HM CAR — Admin Cockpit',
    description: 'HM CAR Admin Control Panel',
    robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="relative min-h-screen text-white"
            style={{
                background: 'linear-gradient(135deg, #070711 0%, #0A0A14 50%, #070711 100%)',
            }}
        >
            {/* Cockpit background grid */}
            <div
                className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(249,115,22,0.8) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(249,115,22,0.8) 1px, transparent 1px)
                    `,
                    backgroundSize: '60px 60px',
                }}
            />
            {/* Cockpit vignette */}
            <div
                className="fixed inset-0 pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(7,7,17,0.8) 100%)'
                }}
            />

            {/* The Cockpit Sidebar */}
            <AdminNavbar />

            {/* Page content — offset by sidebar width */}
            <div className="relative z-10 lg:pl-[72px] lg:rtl:pl-0 lg:rtl:pr-[72px] pt-[52px] lg:pt-0">
                {children}
            </div>
        </div>
    );
}
