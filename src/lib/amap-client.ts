// Client-side Amap API wrapper
const AMAP_KEY = "813a338d0647e0cf937dc665e904bad5";

interface AmapPoi {
  id: string;
  name: string;
  type: string;
  address: string;
  location: string;
  distance: string;
  tel?: string | string[];
  biz_ext?: { rating?: string; cost?: string };
  photos?: { url: string }[];
  deep_info?: { rating?: string; avg_price?: string };
}

export interface ClientRestaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  avgPrice: number;
  cuisineType: string;
  distance: number;
}

export async function searchNearby(params: {
  latitude: number;
  longitude: number;
  radius: number;
  keywords: string;
}): Promise<ClientRestaurant[]> {
  const url = new URL("https://restapi.amap.com/v3/place/around");
  url.searchParams.set("key", AMAP_KEY);
  url.searchParams.set("location", `${params.longitude},${params.latitude}`);
  url.searchParams.set("radius", String(params.radius));
  url.searchParams.set("keywords", params.keywords);
  url.searchParams.set("types", "050000");
  url.searchParams.set("offset", "50");
  url.searchParams.set("page", "1");
  url.searchParams.set("extensions", "all");

  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.status !== "1") throw new Error(data.info);

  return (data.pois || []).map((poi: AmapPoi) => {
    const [lng, lat] = poi.location.split(",").map(Number);
    return {
      id: poi.id,
      name: poi.name,
      address: poi.address || "",
      latitude: lat,
      longitude: lng,
      rating: parseFloat(poi.deep_info?.rating || poi.biz_ext?.rating || "3.5") || 3.5,
      avgPrice: parseFloat(poi.deep_info?.avg_price || poi.biz_ext?.cost || "0") || 0,
      cuisineType: poi.type || "",
      distance: Number(poi.distance) || 0,
    };
  });
}
