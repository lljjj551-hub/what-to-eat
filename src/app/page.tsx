"use client";

import { useState, useCallback, useMemo } from "react";
import { PriceRangeSelector } from "@/components/PriceRangeSelector";
import { LocationInput } from "@/components/LocationInput";
import { RecommendationCard } from "@/components/RecommendationCard";
import { RestaurantList } from "@/components/RestaurantList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles, Loader2, RefreshCw, UtensilsCrossed, AlertCircle,
} from "lucide-react";
import { recommendClient, type ScoredRestaurant, type RecommendResult } from "@/lib/recommend-client";

const FOODS = [
  "饺子","盖浇饭","麻辣烫","汉堡","披萨","寿司","拉面",
  "黄焖鸡","煲仔饭","螺蛳粉","酸辣粉","肉夹馍","煎饼果子",
  "麻辣香锅","烤鱼","串串","冒菜","馄饨","生煎包","肠粉",
  "咖喱饭","石锅拌饭","炸酱面","担担面","热干面","刀削面",
  "小龙虾","酸菜鱼","水煮鱼","宫保鸡丁","糖醋里脊","红烧肉",
  "蛋炒饭","叉烧饭","烧鹅饭","猪脚饭","牛排","炸鸡","韩式炸鸡",
  "寿喜锅","鳗鱼饭","牛肉饭","豚骨拉面","米线","过桥米线",
  "羊肉串","大盘鸡","椰子鸡","猪肚鸡","北京烤鸭","锅包肉",
  "奶茶","冰淇淋","提拉米苏","沙县小吃","兰州拉面","卤肉饭",
];

function getDailyFood(): string {
  const today = new Date().toISOString().split("T")[0];
  let hash = 0;
  const str = today + "-food";
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return FOODS[Math.abs(hash) % FOODS.length];
}

function getUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("wte-uid");
  if (!id) {
    id = "u" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem("wte-uid", id);
  }
  return id;
}

export default function Home() {
  const [priceRange, setPriceRange] = useState({ min: 0, max: 30 });
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResult | null>(null);
  const [error, setError] = useState("");
  const [topPickId, setTopPickId] = useState<string | null>(null);
  const [cuisineOffset, setCuisineOffset] = useState(0);
  const dailyFood = useMemo(() => getDailyFood(), []);

  const handleLocation = useCallback((lat: number, lng: number, address?: string) => {
    setLocation({ lat, lng, address });
  }, []);

  const doRecommend = useCallback(async (offset: number) => {
    setLoading(true);
    setError("");
    setResult(null);
    const loc = location || { lat: 39.90923, lng: 116.397428 };
    try {
      const data = await recommendClient({
        userId: getUserId(),
        priceMin: priceRange.min,
        priceMax: priceRange.max,
        latitude: loc.lat,
        longitude: loc.lng,
        foodKeyword: offset === 0 ? dailyFood : undefined,
        rerollCuisine: offset || undefined,
      });
      setResult(data);
      setTopPickId(data.topPick.id);
      if (offset > 0) setCuisineOffset(offset);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "未知错误";
      setError(msg === "NO_RESULTS" ? "附近没有符合条件的餐厅，请调整价格或扩大范围" : "搜索失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }, [location, priceRange, dailyFood]);

  const handleRecommend = useCallback(() => doRecommend(cuisineOffset), [doRecommend, cuisineOffset]);
  const handleRerollCuisine = useCallback(() => doRecommend(cuisineOffset + 1), [doRecommend, cuisineOffset]);

  const handleReshuffle = useCallback(() => {
    if (!result) return;
    const top5 = result.restaurants.slice(0, 5);
    const remaining = top5.filter(r => r.id !== topPickId);
    if (remaining.length > 0) setTopPickId(remaining[Math.floor(Math.random() * remaining.length)].id);
  }, [result, topPickId]);

  const currentTopPick = result
    ? result.restaurants.find(r => r.id === topPickId) || result.restaurants[0]
    : undefined;
  const otherRestaurants = result
    ? result.restaurants.filter(r => r.id !== topPickId)
    : [];

  return (
    <main className="max-w-lg mx-auto px-4 py-6 pb-20">
      <div className="text-center mb-8 animate-fade-in">
        <div className="inline-flex items-center gap-2 mb-2">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            今天吃什么
          </h1>
        </div>
        <p className="text-muted-foreground text-sm mb-3">选择困难症救星 · 每日随机美食推荐</p>
        <div className="inline-block px-5 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <p className="text-xs text-muted-foreground">今日宜吃</p>
          <p className="text-2xl font-bold text-primary">{dailyFood}</p>
        </div>
      </div>

      <Card className="mb-6 animate-slide-up">
        <CardContent className="py-5 space-y-5">
          <PriceRangeSelector selected={priceRange} onChange={setPriceRange} />
          <LocationInput onLocation={handleLocation} disabled={loading} />
        </CardContent>
      </Card>

      <div className="mb-6 animate-fade-in">
        <Button size="lg" className="w-full text-lg gap-2" onClick={handleRecommend} disabled={loading}>
          {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />正在为你寻找美食...</>) : (<><Sparkles className="w-5 h-5" />帮我选！</>)}
        </Button>
        {!location && (
          <p className="text-center text-xs text-muted-foreground mt-2">💡 未获取到位置，将使用默认位置搜索</p>
        )}
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50 animate-fade-in">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {result?.relaxed && result.relaxedMessage && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 animate-fade-in">
          💡 {result.relaxedMessage}
        </div>
      )}

      {result && currentTopPick && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center space-y-2">
            <span className="inline-block px-4 py-2 rounded-full bg-card border text-sm font-semibold shadow-sm">
              今日推荐菜系：{result.cuisineType}
            </span>
            <div>
              <Button size="sm" variant="ghost" onClick={handleRerollCuisine} disabled={loading}>
                <RefreshCw className="w-3 h-3 mr-1" />换菜系
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">🏆 今日主推</h3>
            <RecommendationCard restaurant={currentTopPick} isTopPick onFavorite={() => {}} onDislike={() => {}} />
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleReshuffle}>
              <RefreshCw className="w-4 h-4 mr-2" />换一家
            </Button>
          </div>

          <RestaurantList restaurants={otherRestaurants} onFavorite={() => {}} onDislike={() => {}} />
        </div>
      )}

      <footer className="text-center text-xs text-muted-foreground mt-12 pb-8">
        <p>数据来源：高德地图 POI</p>
        <p className="mt-1">仅供娱乐参考，请以实际到店为准</p>
      </footer>
    </main>
  );
}
