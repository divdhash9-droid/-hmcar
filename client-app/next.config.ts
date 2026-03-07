// [[ARABIC_HEADER]] هذا الملف (client-app/next.config.ts) جزء من مشروع HM CAR ويحتوي تعليقات عربية لضمان الوضوح.

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudinary.com",
      },
    ],
  },
  // Add proper headers for video streaming (required for Safari & Edge)
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          { key: "Accept-Ranges", value: "bytes" },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          { key: "Content-Type", value: "video/mp4" },
        ],
      },
    ];
  },
  async rewrites() {
    // [[ARABIC_COMMENT]] في الإنتاج (Vercel): vercel.json يتولى توجيه /api/* لـ vercel-server.js
    // [[ARABIC_COMMENT]] في التطوير المحلي فقط: نُوجه /api/* للـ Express على localhost:4002
    if (process.env.NODE_ENV === 'production') {
      return []; // [[ARABIC_COMMENT]] لا حاجة لـ rewrites في الإنتاج
    }
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:4002/api/:path*",
      },
    ];
  },
};

export default nextConfig;

