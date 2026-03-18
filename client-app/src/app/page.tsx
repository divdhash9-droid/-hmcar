import HomeClient, { type CarType } from "./home-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";

async function getLatestCars(): Promise<CarType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v2/cars?limit=12&status=active`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 15 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const carsList = json?.data?.cars || json?.cars || [];
    return Array.isArray(carsList) ? carsList : [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const latestCars = await getLatestCars();
  return <HomeClient latestCars={latestCars} />;
}

