// [[ARABIC_HEADER]] هذا الملف (client-app/src/proxy.ts) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (formerly Middleware) - حماية مسارات /admin/* من الجانب الخادم
 * يعمل قبل تحميل الصفحة، يمنع الوصول غير المصرح به
 */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // حماية مسارات Admin
    if (pathname.startsWith('/admin')) {
        // نتحقق من وجود token في الـ cookies
        const tokenCookie = request.cookies.get('hm_token');

        // إذا لا يوجد cookie، نتحقق من Authorization header
        const authHeader = request.headers.get('authorization');

        if (!tokenCookie && !authHeader) {
            // لا يوجد token - إعادة توجيه لصفحة تسجيل الدخول
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
    ],
};
