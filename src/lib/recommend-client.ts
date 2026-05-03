import { searchNearby, type ClientRestaurant } from "./amap-client";

export interface ScoredRestaurant extends ClientRestaurant {
  score: number;
  scoreBreakdown: { rating: number; distance: number; priceMatch: number; cuisineMatch: number; freshness: number };
  isFavorite: boolean;
  reason: string;
}

export interface RecommendResult {
  cuisineType: string;
  restaurants: ScoredRestaurant[];
  topPick: ScoredRestaurant;
  relaxed: boolean;
  relaxedMessage?: string;
}

const CUISINE_TYPES = [
  { name: "火锅", keywords: "火锅|涮肉", emoji: "🍲" },
  { name: "烧烤", keywords: "烧烤|烤肉", emoji: "🔥" },
  { name: "川湘菜", keywords: "川菜|湘菜|麻辣", emoji: "🌶️" },
  { name: "粤菜", keywords: "粤菜|茶餐厅|烧腊", emoji: "🥘" },
  { name: "日料", keywords: "日料|寿司|拉面", emoji: "🍣" },
  { name: "韩餐", keywords: "韩式|韩餐|炸鸡", emoji: "🥩" },
  { name: "西餐", keywords: "西餐|牛排|披萨|汉堡", emoji: "🍕" },
  { name: "面馆", keywords: "面馆|米线|拉面", emoji: "🍜" },
  { name: "快餐", keywords: "快餐|简餐|盖浇饭", emoji: "🍚" },
  { name: "海鲜", keywords: "海鲜", emoji: "🦞" },
  { name: "小吃", keywords: "小吃|麻辣烫|冒菜", emoji: "🍢" },
  { name: "饺子馄饨", keywords: "饺子|馄饨|抄手", emoji: "🥟" },
  { name: "东南亚", keywords: "泰国|越南|咖喱", emoji: "🍛" },
  { name: "东北菜", keywords: "东北菜|铁锅炖", emoji: "🥘" },
  { name: "西北菜", keywords: "西北|兰州拉面|大盘鸡", emoji: "🐑" },
];

function seededRandom(seed: number): () => number {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function computeScore(r: ClientRestaurant, priceMin: number, priceMax: number, cuisineName: string): ScoredRestaurant {
  const ratingScore = Math.min(r.rating / 5, 1);
  const distanceScore = Math.max(0, 1 - r.distance / 5000);
  let priceMatchScore = 1;
  if (r.avgPrice > 0) {
    const mid = (priceMin + priceMax) / 2;
    if (r.avgPrice < priceMin) priceMatchScore = Math.max(0.3, 1 - (priceMin - r.avgPrice) / priceMin);
    else if (r.avgPrice > priceMax) priceMatchScore = Math.max(0, 1 - (r.avgPrice - priceMax) / priceMax);
    else priceMatchScore = 1 - Math.abs(r.avgPrice - mid) / mid;
  }
  const cuisineScore = r.cuisineType.includes(cuisineName) ? 1 : 0.3;
  const sb = {
    rating: ratingScore * 40, distance: distanceScore * 20, priceMatch: priceMatchScore * 20,
    cuisineMatch: cuisineScore * 10, freshness: 5,
  };
  const score = Object.values(sb).reduce((a, b) => a + b, 0);
  const reasons: string[] = [];
  if (sb.rating >= 30) reasons.push("评分很高");
  else if (sb.rating >= 20) reasons.push("口碑不错");
  if (sb.distance >= 15) reasons.push("距离很近");
  if (sb.priceMatch >= 15) reasons.push("价格合适");
  if (sb.cuisineMatch >= 8) reasons.push("菜系匹配度高");
  if (reasons.length === 0) reasons.push("综合推荐");
  return { ...r, score: Math.round(score * 100) / 100, scoreBreakdown: { rating: Math.round(sb.rating), distance: Math.round(sb.distance), priceMatch: Math.round(sb.priceMatch), cuisineMatch: Math.round(sb.cuisineMatch), freshness: 5 }, isFavorite: false, reason: reasons.slice(0, 3).join("，") };
}

export async function recommendClient(params: {
  userId: string; priceMin: number; priceMax: number;
  latitude: number; longitude: number; foodKeyword?: string; rerollCuisine?: number;
}): Promise<RecommendResult> {
  const { userId, priceMin, priceMax, latitude, longitude, foodKeyword, rerollCuisine } = params;

  // Generate seed
  const today = new Date().toISOString().split("T")[0];
  let hash = 0;
  for (const c of `${today}-${userId}`) { hash = (hash << 5) - hash + c.charCodeAt(0); hash |= 0; }
  const seed = Math.abs(hash);
  const offset = rerollCuisine || 0;
  const rand = seededRandom(seed + offset + 1);

  // Pick cuisine
  let cuisineName: string, keywords: string, emoji: string;
  if (foodKeyword && !rerollCuisine) {
    cuisineName = foodKeyword; keywords = foodKeyword; emoji = "🍽️";
  } else {
    const idx = Math.floor(seededRandom(seed + offset * 7919)() * CUISINE_TYPES.length);
    cuisineName = CUISINE_TYPES[idx].name; keywords = CUISINE_TYPES[idx].keywords; emoji = CUISINE_TYPES[idx].emoji;
  }

  // Search
  let restaurants = await searchNearby({ latitude, longitude, radius: 5000, keywords });

  // Fallback if few results
  if (foodKeyword && !rerollCuisine && restaurants.length < 3) {
    const fb = CUISINE_TYPES[Math.floor(seededRandom(seed)() * CUISINE_TYPES.length)];
    const fbResults = await searchNearby({ latitude, longitude, radius: 5000, keywords: fb.keywords });
    if (fbResults.length > restaurants.length) {
      cuisineName = `${foodKeyword} → ${fb.name}`; keywords = fb.keywords; emoji = fb.emoji;
      restaurants = fbResults;
    }
  }

  // Filter by price
  restaurants = restaurants.map(r => ({ ...r, rating: r.rating || 3.5, avgPrice: r.avgPrice || (priceMin + priceMax) / 2 }));
  let relaxed = false, relaxedMessage: string | undefined;
  let matched = restaurants.filter(r => r.avgPrice >= priceMin && r.avgPrice <= priceMax);
  if (matched.length === 0) {
    const range = priceMax - priceMin;
    matched = restaurants.filter(r => r.avgPrice >= Math.max(0, priceMin - range * 0.2) && r.avgPrice <= priceMax + range * 0.2);
    relaxed = true;
    relaxedMessage = `附近没有完全符合 ¥${priceMin}-${priceMax} 的店铺，已自动放宽区间`;
  }
  if (matched.length === 0) throw new Error("NO_RESULTS");

  // Score and sort
  const scored = matched.map(r => computeScore(r, priceMin, priceMax, cuisineName));
  scored.sort((a, b) => b.score - a.score);
  const top20 = scored.slice(0, 20);
  const top5 = top20.slice(0, 5);

  // Weighted random pick
  const totalScore = top5.reduce((a, b) => a + b.score, 0);
  let r = rand(), topPick = top5[top5.length - 1];
  for (const item of top5) { r -= item.score / totalScore; if (r <= 0) { topPick = item; break; } }

  return {
    cuisineType: `${emoji} ${cuisineName}`,
    restaurants: top20,
    topPick,
    relaxed,
    relaxedMessage,
  };
}
