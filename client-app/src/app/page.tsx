import HomeClient, { type CarType } from "./home-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

async function getLatestCars(): Promise<CarType[]> {
  try {
    // [[ARABIC_COMMENT]] بدلاً من no-store الذي قد يفشل في بعض بيئات الخوادم، نستخدم revalidate لتحديث البيانات كل 15 ثانية
    // استخدام listingType=store لجلب سيارات المعرض فقط
    const res = await fetch(`${API_BASE_URL}/api/v2/cars?limit=10&status=active&listingType=store`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 15 }, // 🚨 يجدث البيانات كل 15 ثانية بدلاً من منع الكاش نهائياً
    });

    if (!res.ok) return [];

    const json = await res.json();
    // API Returns { success: true, data: { cars: [...] } }
    const carsList = json?.data?.cars || json?.cars || [];
    return Array.isArray(carsList) ? carsList : [];
  } catch (error) {
    // Silently fall back when API is unavailable
    return [];
  }
}

export default async function Page() {
  const latestCars = await getLatestCars();
  return <HomeClient latestCars={latestCars} />;
}

