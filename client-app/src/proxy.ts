import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy - نظام حماية المسارات للـ HM CAR
 * يعمل قبل تحميل الصفحة لمنع الوصول غير المصرح به
 */

// المسارات التي تتطلب تسجيل دخول
const PROTECTED_ROUTES = [
    '/client',
    '/profile',
    '/orders',
    '/favorites',
    '/messages',
    '/notifications',
    '/comparisons',
];

// صفحات تسجيل الدخول والتسجيل
const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // قراءة التوكن من الـ cookies (يدعم أسماء cookies متعددة)
    const token =
        request.cookies.get('hm_token')?.value ||
        request.cookies.get('auth_token')?.value ||
        request.cookies.get('token')?.value;

    const userRole = request.cookies.get('user_role')?.value;
    const authHeader = request.headers.get('authorization');
    const isAuthenticated = !!(token || authHeader);

    // ── 1. حماية مسارات الأدمن ──
    if (pathname.startsWith('/admin')) {
        if (!isAuthenticated) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        // منع المستخدمين العاديين من دخول لوحة الأدمن
        if (userRole && userRole !== 'admin') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    // ── 2. حماية مسارات العميل ──
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !isAuthenticated) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // ── 3. إعادة توجيه المسجلين من صفحات تسجيل الدخول ──
    const isAuthRoute = AUTH_ROUTES.some(route => pathname === route);
    if (isAuthRoute && isAuthenticated) {
        if (userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url));
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
