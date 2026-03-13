'use client';
import Link from 'next/link';
import { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Crumb { label: string; href?: string; }

interface Props {
    title: string;
    titleEn?: string;
    subtitle?: string;
    crumbs?: Crumb[];
    actions?: ReactNode;
    children: ReactNode;
    isRTL?: boolean;
    backHref?: string;
}

export default function AdminPageShell({
    title, titleEn, subtitle, crumbs = [], actions, children, isRTL = true, backHref
}: Props) {
    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-10 pb-16 ck-scroll">

            {/* ── HUD Page Header ── */}
            <div className="ck-page-header">
                {/* Breadcrumb */}
                {crumbs.length > 0 && (
                    <nav className="ck-breadcrumb mb-3">
                        <Link href="/admin/dashboard" className="transition-colors hover:text-red-400/80">
                            HM-CTRL
                        </Link>
                        {crumbs.map((c, i) => (
                            <span key={i} className="flex items-center gap-1">
                                <ChevronRight className="w-3 h-3 ck-breadcrumb-sep opacity-50" />
                                {c.href
                                    ? <Link href={c.href} className="transition-colors hover:text-red-400/80">{c.label}</Link>
                                    : <span className="text-red-400/70">{c.label}</span>
                                }
                            </span>
                        ))}
                    </nav>
                )}

                {/* Title row */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-5">
                        {backHref && (
                            <Link href={backHref}>
                                <motion.button
                                    whileHover={{ scale: 1.1, x: isRTL ? 4 : -4 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white/40 hover:text-white shadow-xl"
                                    title={isRTL ? 'الرجوع' : 'Back'}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className={cn("w-6 h-6", !isRTL && "rotate-180")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m15 18-6-6 6-6"/>
                                    </svg>
                                </motion.button>
                            </Link>
                        )}
                        <div>
                            {titleEn && (
                                <p className="cockpit-mono text-[10px] text-red-500/50 tracking-[0.25em] uppercase mb-1">
                                    {titleEn}
                                </p>
                            )}
                            <h1 className="ck-page-title">{title}</h1>
                            {subtitle && <p className="ck-page-subtitle mt-1">{subtitle}</p>}
                        </div>
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
