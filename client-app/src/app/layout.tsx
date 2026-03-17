import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

// إعداد خط "Tajawal" لتحسين مظهر اللغة العربية واللاتينية في التطبيق
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "900"], // [[ARABIC_COMMENT]] تقليل عدد الأوزان لضغط حجم الخط وتسريع التحميل
  variable: "--font-tajawal",
  display: "swap",
});
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import { cookies } from "next/headers";
import AppShell from "@/components/AppShell";
import SmartPrefetchProvider from "@/components/SmartPrefetchProvider";

// إعدادات نافذة العرض (Viewport) للجوال والحاسوب
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true, // السماح للمستخدم بتكبير الصفحة لسهولة القراءة
  themeColor: "#000000",
  colorScheme: "dark",
};

// البيانات الوصفية (SEO Metadata) لتحسين ظهور الموقع في محركات البحث ومشاركات التواصل الاجتماعي
export const metadata: Metadata = {
  metadataBase: new URL('https://car-auction-sand.vercel.app'),
  title: {
    template: '%s | HM CAR',
    default: 'HM CAR | Premium Korean Auto Export & Parts',
  },
  description: "اتش ام كار - منصتك الأولى لتصدير السيارات الكورية الفاخرة وقطع الغيار الأصلية. جودة كورية، شحن دولي، ومزادات حصرية.",
  keywords: "car export, korean cars, luxury vehicles, spare parts, auto auction, سيارات كورية, قطع غيار, مزاد سيارات, تصدير من كوريا, HM CAR",
  authors: [{ name: 'HM CAR Team', url: 'https://hmcar.com' }],
  creator: 'HM CAR',
  publisher: 'HM CAR Export',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'ar-SA': '/ar',
      'en-US': '/en',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HM CAR",
  },
  openGraph: {
    title: "HM CAR | Premium Korean Auto Export",
    description: "تصدير السيارات الفاخرة وقطع الغيار من كوريا إلى العالم - أفضل الأسعار وجودة مضمونة",
    url: 'https://car-auction-sand.vercel.app',
    siteName: "HM CAR",
    locale: 'ar_SA',
    type: "website",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: 'HM CAR Export' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "HM CAR | Premium Korean Auto Export",
    description: "تصدير السيارات الفاخرة وقطع الغيار من كوريا إلى العالم",
    images: ["/icons/icon-512x512.png"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // قراءة اللغة المفضلة من الكوكيز (Cookies) لتحديد اتجاه الصفحة (RTL/LTR) في السيرفر قبل التحميل
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("appLang")?.value?.toUpperCase();
  const lang = cookieLang === "EN" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`antialiased selection:bg-white/20 selection:text-white ${tajawal.variable}`}>
        {/* [[ARABIC_COMMENT]] فاحص أداء الواجهة - يظهر فقط في بيئة التطوير للمساعدة في تحسين السرعة */}
        {process.env.NODE_ENV === 'development' && (
          <script dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                const observer = new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                    console.log(\`%c[Performance] \${entry.name}: \${entry.startTime.toFixed(2)}ms\`, 'color: #c9a96e; font-weight: bold;');
                  });
                });
                observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
              }
            `
          }} />
        )}
        <Providers>
          <SmartPrefetchProvider>
            <AppShell>
              <Suspense fallback={null}>
                <GoogleAnalytics />
              </Suspense>
              {children}
            </AppShell>
          </SmartPrefetchProvider>
        </Providers>
      </body>
    </html>
  );
}
