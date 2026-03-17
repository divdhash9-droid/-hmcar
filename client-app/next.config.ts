// [[ARABIC_COMMENT]] إعدادات Next.js المُحسَّنة لـ HM CAR
// [[ARABIC_COMMENT]] تشمل: ضغط الصور، الكاش الصحيح، حماية النشر، وتحسينات الأداء

import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// [[ARABIC_COMMENT]] وضع البناء: 'mobile' لنسخة Capacitor، أو فارغ للموقع العادي
const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig: NextConfig = {
  // [[ARABIC_COMMENT]] Static Export للموبايل فقط - Capacitor يحتاج ملفات ثابتة
  ...(isMobileBuild ? {
    output: 'export',
    trailingSlash: true,        // [[ARABIC_COMMENT]] مطلوب لـ Capacitor
    images: { unoptimized: true }, // [[ARABIC_COMMENT]] بدون تحسين صور في الوضع الثابت
  } : {}),
  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] إعدادات الصور
  // ─────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,           // [[ARABIC_COMMENT]] تخزين الصور 60 ثانية على الأقل
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // [[ARABIC_COMMENT]] أحجام متجاوبة
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "**.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "ci.encar.com" },
      { protocol: "https", hostname: "car.encar.com" },
      { protocol: "https", hostname: "autospare.com.eg" },
      { protocol: "https", hostname: "www.autospare.com.eg" },
    ],
  },

  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] ضغط المخرجات
  // ─────────────────────────────────────────────
  compress: true,

  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] هيدرز HTTP - للكاش الصحيح وأمان المتصفح
  // ─────────────────────────────────────────────
  async headers() {
    return [
      // [[ARABIC_COMMENT]] ملفات الفيديو - كاش طويل لأنها لا تتغير
      {
        source: "/videos/:path*",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Content-Type", value: "video/mp4" },
        ],
      },
      // [[ARABIC_COMMENT]] ملفات Next.js الثابتة - كاش طويل (تحتوي على hash فريد)
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // [[ARABIC_COMMENT]] Service Worker - لا كاش أبداً (يجب أن يُحدَّث فوراً)
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      // [[ARABIC_COMMENT]] manifest.json - كاش قصير للتحديث السريع
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" }, // يوم واحد
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
      // [[ARABIC_COMMENT]] الصفحات الديناميكية - لا كاش (لتحديثات فورية)
      {
        source: "/((?!_next/static|_next/image|favicon|videos|images).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          // [[ARABIC_COMMENT]] أمان إضافي
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      // [[ARABIC_COMMENT]] الصور المُضغَّطة من Next.js Image
      {
        source: "/_next/image/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, must-revalidate" },
        ],
      },
    ];
  },

  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] إعادة توجيه الطلبات
  // ─────────────────────────────────────────────
  async rewrites() {
    // [[ARABIC_COMMENT]] إذا وُجد NEXT_PUBLIC_API_URL يُطبَّق proxy في كل البيئات
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      return [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    // [[ARABIC_COMMENT]] في التطوير المحلي بدون NEXT_PUBLIC_API_URL: توجيه إلى Express على localhost:4002
    if (process.env.NODE_ENV !== 'production') {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:4002/api/:path*",
        },
      ];
    }
    // [[ARABIC_COMMENT]] في الإنتاج من الجذر: vercel.json يتولى التوجيه
    return [];
  },

  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] TypeScript - أخطاء تمنع النشر (جيد!)
  // ─────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

// [[ARABIC_COMMENT]] تصدير الإعدادات مغلفة بـ Sentry
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during bundling
  silent: true,
  org: "hm-car",
  project: "client-app",

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
