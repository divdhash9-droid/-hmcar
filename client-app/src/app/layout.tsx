import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { cookies } from "next/headers";

// Fonts are temporarily disabled to ensure offline build success
// import { Inter, Tajawal } from "next/font/google";
// const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
// const tajawal = Tajawal({ subsets: ["arabic", "latin"], display: "swap", variable: "--font-tajawal", weight: ["300", "400", "500", "700", "800", "900"] });

export const metadata: Metadata = {
  title: "HM CAR | Premium Korean Auto Export",
  description: "The premier destination for luxury Korean car exports and rare components worldwide. Seoul to the world.",
  keywords: "car export, korean cars, luxury vehicles, spare parts, auto auction",
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
