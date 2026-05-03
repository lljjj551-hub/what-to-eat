import type { CuisineType } from "@/types";

const CUISINE_TYPES: CuisineType[] = [
  { name: "火锅", keywords: "火锅|涮肉|串串香", emoji: "🍲" },
  { name: "烧烤", keywords: "烧烤|烤肉|烤鱼", emoji: "🔥" },
  { name: "川湘菜", keywords: "川菜|湘菜|麻辣|香辣", emoji: "🌶️" },
  { name: "粤菜", keywords: "粤菜|茶餐厅|烧腊|点心", emoji: "🥟" },
  { name: "日料", keywords: "日料|日式|寿司|拉面|居酒屋", emoji: "🍣" },
  { name: "韩餐", keywords: "韩式|韩国料理|韩餐|炸鸡", emoji: "🥩" },
  { name: "西餐", keywords: "西餐|牛排|披萨|意面|汉堡", emoji: "🍕" },
  { name: "面馆", keywords: "面馆|米线|米粉|拉面|拌面", emoji: "🍜" },
  { name: "快餐简餐", keywords: "快餐|简餐|盖浇饭|黄焖鸡", emoji: "🍚" },
  { name: "海鲜", keywords: "海鲜|螃蟹|龙虾|蒸鲜", emoji: "🦞" },
  { name: "小吃", keywords: "小吃|麻辣烫|冒菜|凉皮|肉夹馍", emoji: "🍢" },
  { name: "饺子馄饨", keywords: "饺子|馄饨|抄手|生煎", emoji: "🥟" },
  { name: "东南亚菜", keywords: "泰国|越南|印度|咖喱|冬阴功", emoji: "🍛" },
  { name: "甜品饮品", keywords: "甜品|奶茶|咖啡|蛋糕|冰淇淋", emoji: "🍰" },
  { name: "东北菜", keywords: "东北菜|铁锅炖|锅包肉|酸菜", emoji: "🥘" },
  { name: "西北菜", keywords: "西北菜|兰州拉面|羊肉泡馍|大盘鸡", emoji: "🐑" },
];

/**
 * Deterministic pseudo-random number generator (mulberry32).
 * Seeded by date + userId to produce consistent results within a day.
 */
export function seededRandom(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDailySeed(userId: string): number {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const str = `${today}-${userId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function pickCuisineType(seed: number, offset = 0): CuisineType {
  const shifted = seed + offset * 7919;
  const rand = seededRandom(shifted);
  const index = Math.floor(rand() * CUISINE_TYPES.length);
  return CUISINE_TYPES[index];
}

export function getCuisineCount(): number {
  return CUISINE_TYPES.length;
}

export function getAllCuisineTypes(): CuisineType[] {
  return CUISINE_TYPES;
}

export function cuisineTypeToKeywords(name: string): string {
  const found = CUISINE_TYPES.find((c) => c.name === name);
  return found?.keywords || name;
}

const FOOD_SUGGESTIONS = [
  "饺子", "盖浇饭", "麻辣烫", "汉堡", "披萨", "寿司", "拉面",
  "黄焖鸡", "煲仔饭", "螺蛳粉", "酸辣粉", "肉夹馍", "煎饼果子",
  "沙县小吃", "兰州拉面", "麻辣香锅", "烤鱼", "串串", "冒菜",
  "馄饨", "生煎包", "肠粉", "卤肉饭", "咖喱饭", "石锅拌饭",
  "炸酱面", "担担面", "热干面", "刀削面", "油泼面", "冷面",
  "小龙虾", "酸菜鱼", "水煮鱼", "毛血旺", "回锅肉", "宫保鸡丁",
  "糖醋里脊", "红烧肉", "地三鲜", "西红柿炒鸡蛋", "麻婆豆腐",
  "蛋炒饭", "扬州炒饭", "叉烧饭", "烧鹅饭", "猪脚饭", "隆江猪脚饭",
  "三明治", "沙拉", "意面", "牛排", "炸鸡", "韩式炸鸡",
  "寿喜锅", "天妇罗", "鳗鱼饭", "牛肉饭", "亲子丼", "豚骨拉面",
  "米线", "过桥米线", "小锅米线", "花甲粉", "鸭血粉丝汤",
  "羊肉串", "牛肉面", "大盘鸡", "手抓饭", "羊肉泡馍", "肉夹馍",
  "椰子鸡", "猪肚鸡", "花胶鸡", "潮汕牛肉火锅", "北京烤鸭",
  "锅包肉", "铁锅炖", "杀猪菜", "猪肉炖粉条", "小鸡炖蘑菇",
  "水果捞", "奶茶", "冰淇淋", "提拉米苏", "双皮奶",
];

export function getDailyFoodSuggestion(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  const str = `${today}-${userId}-food`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % FOOD_SUGGESTIONS.length;
  return FOOD_SUGGESTIONS[index];
}
