// [[ARABIC_COMMENT]] إعدادات Next.js المُحسَّنة لـ HM CAR
// [[ARABIC_COMMENT]] تشمل: ضغط الصور، الكاش الصحيح، حماية النشر، وتحسينات الأداء

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    // [[ARABIC_COMMENT]] في الإنتاج: vercel.json يتولى توجيه /api/* لـ vercel-server.js
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    // [[ARABIC_COMMENT]] في التطوير المحلي: توجيه إلى Express على localhost:4002
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:4002/api/:path*",
      },
    ];
  },

  // ─────────────────────────────────────────────
  // [[ARABIC_COMMENT]] TypeScript - أخطاء تمنع النشر (جيد!)
  // ─────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
