const AMAP_KEY = "813a338d0647e0cf937dc665e904bad5";

export interface PoiDetail {
  name: string;
  rating: number;
  avgPrice: number;
  photos: string[];
  address: string;
  phone: string;
  reviews: { content: string; score: number; time: string }[];
}

export async function fetchPoiDetail(poiId: string): Promise<PoiDetail> {
  const url = `https://restapi.amap.com/v3/place/detail?key=${AMAP_KEY}&id=${poiId}&extensions=all`;
  const res = await fetch(url);
  const data = await res.json();
  const poi = data?.pois?.[0];
  if (!poi) throw new Error("POI not found");

  return {
    name: poi.name,
    rating: parseFloat(poi.biz_ext?.rating || poi.deep_info?.rating || "0") || 0,
    avgPrice: parseFloat(poi.biz_ext?.cost || poi.deep_info?.avg_price || "0") || 0,
    photos: (poi.photos || []).slice(0, 6).map((p: { url: string }) => p.url),
    address: poi.address || "",
    phone: Array.isArray(poi.tel) ? poi.tel[0] || "" : (poi.tel || ""),
    reviews: [],
  };
}
