'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface Crumb { label: string; href?: string; }

interface Props {
    title: string;
    titleEn?: string;
    subtitle?: string;
    crumbs?: Crumb[];
    actions?: ReactNode;
    children: ReactNode;
    isRTL?: boolean;
}

export default function AdminPageShell({
    title, titleEn, subtitle, crumbs = [], actions, children, isRTL = true
}: Props) {
    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-10 pb-16 ck-scroll">

            {/* ── HUD Page Header ── */}
            <div className="ck-page-header">
                {/* Breadcrumb */}
                {crumbs.length > 0 && (
                    <nav className="ck-breadcrumb mb-3">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-orange-400/80">
                            HM-CTRL
                        </Link>
                        {crumbs.map((c, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 ck-breadcrumb-sep opacity-50" />
                                {c.href
                                    ? <Link href={c.href} className="transition-colors hover:text-orange-400/80">{c.label}</Link>
                                    : <span className="text-orange-400/70">{c.label}</span>
                                }
                            </span>
                        ))}
                    </nav>
                )}

                {/* Title row */}
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        {titleEn && (
                            <p className="cockpit-mono text-[10px] text-orange-500/50 tracking-[0.25em] uppercase mb-1">
                                {titleEn}
                            </p>
                        )}
                        <h1 className="ck-page-title">{title}</h1>
                        {subtitle && <p className="ck-page-subtitle mt-1">{subtitle}</p>}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap">
                            {actions}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Page Content ── */}
            {children}
        </div>
    );
}
