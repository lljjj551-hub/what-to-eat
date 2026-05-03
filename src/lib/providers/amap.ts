import type { RestaurantProvider, SearchParams } from "./types";
import type { Restaurant } from "@/types";

interface AmapPoiResponse {
  status: string;
  info: string;
  count: string;
  pois: AmapPoi[];
}

interface AmapPoi {
  id: string;
  name: string;
  type: string;
  typecode: string;
  address: string;
  location: string; // "lng,lat"
  distance: string;
  tel?: string;
  biz_ext?: {
    rating?: string;
    cost?: string;
  };
  photos?: { url: string }[];
  business_area?: string;
  deep_info?: {
    rating?: string;
    avg_price?: string;
  };
}

const CUISINE_KEYWORD_MAP: Record<string, string> = {
  hotpot: "火锅",
  bbq: "烧烤|烤肉",
  chinese: "中餐|家常菜|川菜|湘菜|粤菜|东北菜",
  noodle: "面馆|米线|米粉|拉面",
  fastfood: "快餐|简餐",
  japanese: "日料|日式|寿司|拉面",
  korean: "韩式|韩国料理|韩餐",
  western: "西餐|牛排|披萨|意面",
  seafood: "海鲜",
  snack: "小吃|麻辣烫|冒菜|串串",
  dessert: "甜品|奶茶|咖啡|蛋糕",
  dumpling: "饺子|馄饨|抄手",
};

export class AmapProvider implements RestaurantProvider {
  name = "amap";

  private apiKey: string;

  constructor() {
    this.apiKey = process.env.AMAP_API_KEY || "";
    if (!this.apiKey) {
      console.warn("AMAP_API_KEY not set. AmapProvider will fail.");
    }
  }

  async searchNearby(params: SearchParams): Promise<Restaurant[]> {
    const { latitude, longitude, radius, keywords } = params;

    const url = new URL("https://restapi.amap.com/v3/place/around");
    url.searchParams.set("key", this.apiKey);
    url.searchParams.set("location", `${longitude},${latitude}`);
    url.searchParams.set("radius", String(radius));
    url.searchParams.set("keywords", keywords);
    url.searchParams.set("types", "050000"); // 餐饮服务
    url.searchParams.set("offset", "50");
    url.searchParams.set("page", "1");
    url.searchParams.set("extensions", "all");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Amap API error: ${res.status} ${res.statusText}`);
    }

    const data: AmapPoiResponse = await res.json();
    if (data.status !== "1") {
      throw new Error(`Amap API error: ${data.info}`);
    }

    return (data.pois || []).map((poi) => this.mapToRestaurant(poi));
  }

  private mapToRestaurant(poi: AmapPoi): Restaurant {
    const [lng, lat] = poi.location.split(",").map(Number);
    const rating = this.parseRating(poi);
    const avgPrice = this.parseAvgPrice(poi);

    return {
      id: poi.id,
      name: poi.name,
      address: poi.address || "",
      latitude: lat,
      longitude: lng,
      rating,
      avgPrice,
      cuisineType: poi.type || "",
      distance: Number(poi.distance) || 0,
      photos: poi.photos?.map((p) => p.url) || [],
      phone: Array.isArray(poi.tel) ? (poi.tel[0] || null) : (typeof poi.tel === "string" ? poi.tel : null),
      openHours: poi.business_area,
    };
  }

  private parseRating(poi: AmapPoi): number {
    const ratingStr =
      poi.deep_info?.rating ||
      poi.biz_ext?.rating ||
      "0";
    const rating = parseFloat(ratingStr);
    return isNaN(rating) ? 0 : rating;
  }

  private parseAvgPrice(poi: AmapPoi): number {
    const costStr =
      poi.deep_info?.avg_price ||
      poi.biz_ext?.cost ||
      "0";
    const cost = parseFloat(costStr);
    return isNaN(cost) ? 0 : cost;
  }
}

export { CUISINE_KEYWORD_MAP };
