import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Suspense } from "react";
import { cookies } from "next/headers";
import AppShell from "@/components/AppShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#000000",
  colorScheme: "dark",
};

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
  const cookieStore = await cookies();
  const cookieLang = cookieStore.get("appLang")?.value?.toUpperCase();
  const lang = cookieLang === "EN" ? "en" : "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`antialiased selection:bg-white/20 selection:text-white ${tajawal.variable}`}>
        <Providers>
          <AppShell>
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
