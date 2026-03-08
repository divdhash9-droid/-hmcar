import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * proxy.ts - نظام حماية المسارات لـ HM CAR
 * يعمل كـ Edge Middleware قبل تحميل أي صفحة
 */

// المسارات المحمية التي تتطلب تسجيل دخول
const PROTECTED_CLIENT_ROUTES = [
    '/client',
    '/profile',
    '/orders',
    '/favorites',
    '/messages',
    '/notifications',
    '/comparisons',
];

const PROTECTED_ADMIN_ROUTES = ['/admin'];
const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // قراءة التوكن من الـ cookies
    const token = request.cookies.get('hm_token')?.value;
    const isAuthenticated = !!token;

    // ── 1. حماية مسارات الأدمن ──
    if (PROTECTED_ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            loginUrl.searchParams.set('role', 'admin');
            return NextResponse.redirect(loginUrl);
        }
    }

    // ── 2. حماية مسارات العميل ──
    if (PROTECTED_CLIENT_ROUTES.some(r => pathname.startsWith(r))) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // ── 3. إذا كان مسجلاً ويحاول فتح /login أو /register ──
    //    نحوله لصفحته بدلاً من إظهار صفحة الدخول
    const isAuthRoute = AUTH_ROUTES.some(r => pathname === r);
    if (isAuthRoute && isAuthenticated) {
        const userRole = request.cookies.get('hm_user_role')?.value;
        if (userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager') {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
        return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }

    // إضافة Headers أمنية لكل الاستجابات
    const response = NextResponse.next();
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/client/:path*',
        '/profile/:path*',
        '/orders/:path*',
        '/favorites/:path*',
        '/messages/:path*',
        '/notifications/:path*',
        '/comparisons/:path*',
        '/login',
        '/register',
    ],
};
