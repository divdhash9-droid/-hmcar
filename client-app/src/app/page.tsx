import HomeClient, { type CarType } from "./home-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

async function getLatestCars(): Promise<CarType[]> {
  try {
    // [[ARABIC_COMMENT]] إيقاف الكاش (التخزين المؤقت) لضمان ظهور السيارات الجديدة والمعدلة فوراً
    // استخدام listingType=store لجلب سيارات المعرض فقط
    const res = await fetch(`${API_BASE_URL}/api/v2/cars?limit=10&status=active&listingType=store`, {
      headers: { Accept: "application/json" },
      cache: "no-store", // 🚨 يمنع التخزين المؤقت
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

