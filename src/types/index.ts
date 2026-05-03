export interface Restaurant {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  avgPrice: number;
  cuisineType: string;
  distance: number;
  photos?: string[];
  phone?: string;
  openHours?: string;
}

export interface RecommendationResult {
  cuisineType: string;
  restaurants: ScoredRestaurant[];
  topPick: ScoredRestaurant;
  relaxed: boolean;
  relaxedMessage?: string;
}

export interface ScoredRestaurant extends Restaurant {
  score: number;
  scoreBreakdown: {
    rating: number;
    distance: number;
    priceMatch: number;
    cuisineMatch: number;
    freshness: number;
  };
  isFavorite: boolean;
  reason: string;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}

export interface RecommendRequest {
  userId: string;
  priceMin: number;
  priceMax: number;
  latitude: number;
  longitude: number;
  rerollCuisine?: number;
  foodKeyword?: string;
}

export interface CuisineType {
  name: string;
  keywords: string;
  emoji: string;
}
