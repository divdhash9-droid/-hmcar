import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { cookies } from "next/headers";

// [[ARABIC_COMMENT]] الـ Viewport للتحكم في مقياس الشاشة على الموبايل
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,         // منع التكبير التلقائي على iOS
  userScalable: false,     // منع التكبير اليدوي للحفاظ على التصميم
  themeColor: "#000000",   // لون شريط المتصفح
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: "HM CAR | Premium Korean Auto Export",
  description: "The premier destination for luxury Korean car exports and rare components worldwide. Seoul to the world.",
  keywords: "car export, korean cars, luxury vehicles, spare parts, auto auction",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HM CAR",
  },
  openGraph: {
    title: "HM CAR | Premium Korean Auto Export",
    description: "Exporting cars & parts from Korea to the world",
    type: "website",
  },
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
      <head />
      <body className="antialiased selection:bg-white/20 selection:text-white" style={{ fontFamily: "system-ui, sans-serif" }}>
        <Providers>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
