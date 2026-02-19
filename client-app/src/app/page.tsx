import HomeClient, { type CarType } from "./home-client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002";
export const revalidate = 300; // revalidate every 5 minutes

async function getLatestCars(): Promise<CarType[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v2/cars?limit=4`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      cache: "force-cache",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.cars) ? data.cars : [];
  } catch (error) {
    // Silently fall back when API is unavailable
    return [];
  }
}

export default async function Page() {
  const latestCars = await getLatestCars();
  return <HomeClient latestCars={latestCars} />;
}
