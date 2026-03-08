import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import PWAInstaller from "@/components/PWAInstaller";
import { cookies } from "next/headers";

// [[ARABIC_COMMENT]] الـ Viewport للتحكم في مقياس الشاشة على الموبايل
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,         // [[ARABIC_COMMENT]] اسمح بالتكبير - مهم للأجهزة الصغيرة
  userScalable: true,      // [[ARABIC_COMMENT]] اسمح للمستخدم بالتكبير - أفضل لأجهزة iOS
  themeColor: "#000000",   // [[ARABIC_COMMENT]] لون شريط المتصفح
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "HM CAR | Premium Korean Auto Export",
  description: "منصة اتش ام كار - المحطة الأولى لتصدير السيارات الفاخرة وقطع الغيار الأصلية من كوريا الجنوبية.",
  keywords: "car export, korean cars, luxury vehicles, spare parts, auto auction, سيارات كورية, قطع غيار, مزاد سيارات",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/icon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icons/icon-96x96.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HM CAR",
    startupImage: "/icons/icon-512x512.png",
  },
  openGraph: {
    title: "HM CAR | Premium Korean Auto Export",
    description: "تصدير السيارات الفاخرة وقطع الغيار من كوريا إلى العالم",
    type: "website",
    siteName: "HM CAR",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HM CAR",
    description: "منصة اتش ام كار للسيارات الفاخرة",
    images: ["/icons/icon-512x512.png"],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#000000",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  }
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("appLang")?.value?.toUpperCase();
  const lang = cookieLang === "EN" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <head>
        {/* [[ARABIC_COMMENT]] إيقونات Apple للـ PWA على iOS */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="HM CAR" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="antialiased selection:bg-white/20 selection:text-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <Providers>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
          {/* [[ARABIC_COMMENT]] مكوّن تثبيت PWA - يظهر بانر التثبيت على الجوال */}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}
