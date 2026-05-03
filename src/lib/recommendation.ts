import type {
  Restaurant,
  ScoredRestaurant,
  RecommendationResult,
  RecommendRequest,
} from "@/types";
import { prisma } from "./prisma";
import { AmapProvider } from "./providers/amap";
import {
  generateDailySeed,
  seededRandom,
  pickCuisineType,
  cuisineTypeToKeywords,
} from "./cuisine";

/**
 * Score a restaurant based on multiple weighted factors.
 */
function computeScore(
  restaurant: Restaurant,
  params: {
    priceMin: number;
    priceMax: number;
    cuisineType: string;
    isNew: boolean; // freshness — new to cache = bonus
  }
): ScoredRestaurant {
  const { priceMin, priceMax, cuisineType, isNew } = params;

  // Rating score (0–10), normalize to 0–1
  const ratingScore = Math.min(restaurant.rating / 5, 1);

  // Distance score — closer is better. Within 500m = perfect, 5000m = 0
  const distanceScore = Math.max(0, 1 - restaurant.distance / 5000);

  // Price match score — how well it fits the budget
  let priceMatchScore = 1;
  if (restaurant.avgPrice > 0) {
    const midPrice = (priceMin + priceMax) / 2;
    const priceDiff = Math.abs(restaurant.avgPrice - midPrice);
    if (restaurant.avgPrice < priceMin) {
      priceMatchScore = Math.max(0.3, 1 - (priceMin - restaurant.avgPrice) / priceMin);
    } else if (restaurant.avgPrice > priceMax) {
      priceMatchScore = Math.max(0, 1 - (restaurant.avgPrice - priceMax) / priceMax);
    } else {
      priceMatchScore = 1 - priceDiff / midPrice;
    }
  }

  // Cuisine match score
  const cuisineScore = restaurant.cuisineType.includes(cuisineType) ? 1 : 0.3;

  // Freshness score
  const freshnessScore = isNew ? 1 : 0.5;

  const scoreBreakdown = {
    rating: ratingScore * 0.4,
    distance: distanceScore * 0.2,
    priceMatch: priceMatchScore * 0.2,
    cuisineMatch: cuisineScore * 0.1,
    freshness: freshnessScore * 0.1,
  };

  const score = Object.values(scoreBreakdown).reduce((a, b) => a + b, 0);

  return {
    ...restaurant,
    score: Math.round(score * 100) / 100,
    scoreBreakdown: {
      rating: Math.round(ratingScore * 40),
      distance: Math.round(distanceScore * 20),
      priceMatch: Math.round(priceMatchScore * 20),
      cuisineMatch: Math.round(cuisineScore * 10),
      freshness: Math.round(freshnessScore * 10),
    },
    isFavorite: false,
    reason: generateReason(restaurant, scoreBreakdown),
  };
}

function generateReason(
  r: Restaurant,
  sb: { rating: number; distance: number; priceMatch: number; cuisineMatch: number; freshness: number }
): string {
  const reasons: string[] = [];
  if (sb.rating >= 30) reasons.push("评分很高");
  else if (sb.rating >= 20) reasons.push("口碑不错");
  if (sb.distance >= 15) reasons.push("距离很近");
  if (sb.priceMatch >= 15) reasons.push("价格合适");
  if (sb.cuisineMatch >= 8) reasons.push("菜系匹配度高");
  if (sb.freshness >= 8) reasons.push("新发现的好店");
  if (reasons.length === 0) reasons.push("综合推荐");
  return reasons.slice(0, 3).join("，");
}

/**
 * Weighted random pick from top 5 restaurants.
 */
function weightedRandomPick(
  top5: ScoredRestaurant[],
  rand: () => number
): ScoredRestaurant {
  const scores = top5.map((r) => r.score);
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const weights = scores.map((s) => s / totalScore);

  let r = rand();
  for (let i = 0; i < top5.length; i++) {
    r -= weights[i];
    if (r <= 0) return top5[i];
  }
  return top5[top5.length - 1];
}

export async function recommend(
  req: RecommendRequest
): Promise<RecommendationResult> {
  const { userId, priceMin, priceMax, latitude, longitude, rerollCuisine, foodKeyword } = req;

  // 1. Generate seed and determine search keywords
  const provider = new AmapProvider();
  const seed = generateDailySeed(userId);
  const offset = rerollCuisine || 0;

  let cuisine: { name: string; keywords: string; emoji: string };
  let keywords: string;

  if (foodKeyword && !rerollCuisine) {
    cuisine = { name: foodKeyword, keywords: foodKeyword, emoji: "🍽️" };
    keywords = foodKeyword;
  } else {
    cuisine = pickCuisineType(seed, offset);
    keywords = cuisineTypeToKeywords(cuisine.name);
  }

  const rand = seededRandom(seed + 1);

  let restaurants = await provider.searchNearby({
    latitude,
    longitude,
    radius: 5000,
    keywords,
    priceMin,
    priceMax,
  });

  // If foodKeyword search returns few results, fallback to broader cuisine search
  // Keep the original food name for display, but use fallback keywords for search
  const originalCuisine = cuisine;
  if (foodKeyword && !rerollCuisine && restaurants.length < 3) {
    const fallback = pickCuisineType(seed, 0);
    const fallbackKeywords = cuisineTypeToKeywords(fallback.name);
    const fallbackResults = await provider.searchNearby({
      latitude,
      longitude,
      radius: 5000,
      keywords: fallbackKeywords,
      priceMin,
      priceMax,
    });
    if (fallbackResults.length > restaurants.length) {
      keywords = fallbackKeywords;
      restaurants = fallbackResults;
      // Show as "螺蛳粉 → 日料" so user sees both
      cuisine = { name: `${originalCuisine.name} → ${fallback.name}`, keywords: fallbackKeywords, emoji: fallback.emoji };
    }
  }

  // 3. Filter and handle missing data
  restaurants = restaurants.map((r) => ({
    ...r,
    rating: r.rating || 3.5,
    avgPrice: r.avgPrice || (priceMin + priceMax) / 2,
  }));

  // 4. Check price match, auto-relax if needed
  let relaxed = false;
  let relaxedMessage: string | undefined;

  const priceMatch = restaurants.filter(
    (r) => r.avgPrice >= priceMin && r.avgPrice <= priceMax
  );

  if (priceMatch.length === 0) {
    // Relax price range by 20%
    const range = priceMax - priceMin;
    const relaxedMin = Math.max(0, priceMin - range * 0.2);
    const relaxedMax = priceMax + range * 0.2;
    restaurants = restaurants.filter(
      (r) => r.avgPrice >= relaxedMin && r.avgPrice <= relaxedMax
    );
    relaxed = true;
    relaxedMessage = `附近没有完全符合 ¥${priceMin}-${priceMax} 的店铺，已自动放宽至 ¥${Math.round(relaxedMin)}-${Math.round(relaxedMax)}`;
  } else {
    restaurants = priceMatch;
  }

  if (restaurants.length === 0) {
    throw new Error("NO_RESULTS");
  }

  // 5. Check cache for freshness (DB optional)
  let cachedIdSet = new Set<string>();
  try {
    const cachedIds = await prisma.restaurantCache.findMany({
      where: { poiId: { in: restaurants.map((r) => r.id) } },
      select: { poiId: true },
    });
    cachedIdSet = new Set(cachedIds.map((c) => c.poiId));
  } catch { /* DB unavailable, skip cache */ }

  // 6. Compute scores
  const scored = restaurants.map((r) =>
    computeScore(r, {
      priceMin: relaxed ? Math.max(0, priceMin - (priceMax - priceMin) * 0.2) : priceMin,
      priceMax: relaxed ? priceMax + (priceMax - priceMin) * 0.2 : priceMax,
      cuisineType: cuisine.name,
      isNew: !cachedIdSet.has(r.id),
    })
  );

  // 7. Sort by score descending, take top 20
  scored.sort((a, b) => b.score - a.score);
  const top20 = scored.slice(0, 20);

  // 8. Get disliked restaurants (DB optional)
  let dislikedSet = new Set<string>();
  try {
    const disliked = await prisma.dislikedRestaurant.findMany({
      where: { userId, restaurantId: { in: top20.map((r) => r.id) } },
      select: { restaurantId: true },
    });
    dislikedSet = new Set(disliked.map((d) => d.restaurantId));
  } catch { /* DB unavailable */ }

  const filtered = top20.filter((r) => !dislikedSet.has(r.id)).slice(0, 20);
  if (filtered.length === 0) throw new Error("NO_RESULTS");

  // 9. Check favorites (DB optional)
  let favSet = new Set<string>();
  try {
    const favorites = await prisma.favoriteRestaurant.findMany({
      where: { userId, restaurantId: { in: filtered.map((r) => r.id) } },
      select: { restaurantId: true },
    });
    favSet = new Set(favorites.map((f) => f.restaurantId));
  } catch { /* DB unavailable */ }
  filtered.forEach((r) => { r.isFavorite = favSet.has(r.id); });

  // 10. Weighted random pick from top 5
  const top5 = filtered.slice(0, 5);
  const topPick = weightedRandomPick(top5, rand);

  // 11-13. Persist (DB optional — all wrapped in try-catch)
  try {
    for (const r of top20) {
      await prisma.restaurantCache.upsert({
        where: { poiId: r.id },
        update: { name: r.name, address: r.address, latitude: r.latitude, longitude: r.longitude, rating: r.rating, avgPrice: r.avgPrice, cuisineType: r.cuisineType, photos: JSON.stringify(r.photos || []), phone: r.phone },
        create: { poiId: r.id, name: r.name, address: r.address, latitude: r.latitude, longitude: r.longitude, rating: r.rating, avgPrice: r.avgPrice, cuisineType: r.cuisineType, photos: JSON.stringify(r.photos || []), phone: r.phone },
      });
    }
    await prisma.recommendationHistory.create({
      data: { userId, cuisineType: cuisine.name, priceMin, priceMax, latitude, longitude, restaurantId: topPick.id, restaurantName: topPick.name, rating: topPick.rating, avgPrice: topPick.avgPrice, distance: topPick.distance, score: topPick.score, relaxed },
    });
    await prisma.userPreference.upsert({
      where: { userId },
      update: { priceMin, priceMax, latitude, longitude },
      create: { userId, priceMin, priceMax, latitude, longitude },
    });
  } catch { /* DB unavailable on serverless, core flow continues */ }

  return {
    cuisineType: cuisine.emoji ? `${cuisine.emoji} ${cuisine.name}` : cuisine.name,
    restaurants: filtered,
    topPick,
    relaxed,
    relaxedMessage,
  };
}

export async function getHistory(userId: string, limit = 20) {
  return prisma.recommendationHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function addDislike(userId: string, restaurantId: string) {
  return prisma.dislikedRestaurant.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    update: {},
    create: { userId, restaurantId },
  });
}

export async function addFavorite(userId: string, restaurantId: string) {
  return prisma.favoriteRestaurant.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    update: {},
    create: { userId, restaurantId },
  });
}

export async function removeFavorite(userId: string, restaurantId: string) {
  return prisma.favoriteRestaurant.deleteMany({
    where: { userId, restaurantId },
  });
}
