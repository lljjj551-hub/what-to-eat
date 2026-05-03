import type { Restaurant } from "@/types";

export interface RestaurantProvider {
  name: string;
  searchNearby(params: SearchParams): Promise<Restaurant[]>;
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radius: number; // meters
  keywords: string;
  priceMin?: number;
  priceMax?: number;
}

export function getProvider(name?: string): RestaurantProvider {
  // Default to Amap. Switch based on env or param later.
  switch (name) {
    case "amap":
    default:
      // Dynamic import to avoid bundling server code to client
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { AmapProvider } = require("./amap");
      return new AmapProvider();
  }
}
