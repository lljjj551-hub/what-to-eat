"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Navigation,
  Heart,
  ExternalLink,
  ThumbsDown,
} from "lucide-react";
import { formatDistance, formatPrice, formatRating } from "@/lib/utils";
import type { ScoredRestaurant } from "@/lib/recommend-client";

interface RecommendationCardProps {
  restaurant: ScoredRestaurant;
  isTopPick?: boolean;
  onFavorite: () => void;
  onDislike: () => void;
}

export function RecommendationCard({
  restaurant,
  isTopPick,
  onFavorite,
  onDislike,
}: RecommendationCardProps) {
  return (
    <Card
      className={`relative overflow-hidden animate-fade-in ${
        isTopPick
          ? "ring-2 ring-primary shadow-xl shadow-primary/20 bg-gradient-to-br from-orange-50 to-amber-50"
          : ""
      }`}
    >
      {isTopPick && (
        <div className="absolute top-3 right-3">
          <Badge variant="warning">⭐ 今日主推</Badge>
        </div>
      )}

      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate pr-20">
              {isTopPick && "👑 "}
              {restaurant.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              <MapPin className="w-3 h-3 inline mr-1" />
              {restaurant.address}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-3 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">{formatRating(restaurant.rating)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">人均 </span>
            <span className="font-semibold text-primary">
              {formatPrice(restaurant.avgPrice)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">距离 </span>
            <span className="font-semibold">
              {formatDistance(restaurant.distance)}
            </span>
          </div>
        </div>

        {/* Score breakdown (only for top pick) */}
        {isTopPick && restaurant.scoreBreakdown && (
          <div className="mb-3 p-3 rounded-xl bg-white/60 text-xs space-y-1">
            <div className="flex justify-between">
              <span>⭐ 评分</span>
              <span className="font-semibold">
                {restaurant.scoreBreakdown.rating}/40
              </span>
            </div>
            <div className="flex justify-between">
              <span>📍 距离</span>
              <span className="font-semibold">
                {restaurant.scoreBreakdown.distance}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span>💰 价格匹配</span>
              <span className="font-semibold">
                {restaurant.scoreBreakdown.priceMatch}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span>🍳 菜系匹配</span>
              <span className="font-semibold">
                {restaurant.scoreBreakdown.cuisineMatch}/10
              </span>
            </div>
            <div className="flex justify-between">
              <span>🆕 新鲜度</span>
              <span className="font-semibold">
                {restaurant.scoreBreakdown.freshness}/10
              </span>
            </div>
            <div className="flex justify-between border-t border-orange-100 pt-1 mt-1">
              <span className="font-bold">综合评分</span>
              <span className="font-bold text-primary">
                {restaurant.score.toFixed(0)}/100
              </span>
            </div>
          </div>
        )}

        {/* Recommendation reason */}
        <p className="text-sm text-muted-foreground mb-3">
          💡 {restaurant.reason}
        </p>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={restaurant.isFavorite ? "secondary" : "outline"}
            onClick={onFavorite}
          >
            <Heart
              className={`w-4 h-4 mr-1 ${
                restaurant.isFavorite ? "fill-current" : ""
              }`}
            />
            {restaurant.isFavorite ? "已收藏" : "收藏"}
          </Button>

          {!isTopPick && (
            <Button size="sm" variant="ghost" onClick={onDislike}>
              <ThumbsDown className="w-4 h-4 mr-1" />
              不想吃
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const url = `https://uri.amap.com/navigation?to=${restaurant.longitude},${restaurant.latitude},${encodeURIComponent(restaurant.name)}&mode=car`;
              window.open(url, "_blank");
            }}
          >
            <Navigation className="w-4 h-4 mr-1" />
            导航
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const q = encodeURIComponent(restaurant.name);
              // Try Dianping app deeplink first, fallback to mobile web
              const appUrl = `dianping://search?keyword=${q}`;
              const webUrl = `https://m.dianping.com/searchshop?keyword=${q}`;
              const start = Date.now();
              window.location.href = appUrl;
              // If app doesn't open within 1.5s, fallback to web
              setTimeout(() => {
                if (Date.now() - start < 2000) {
                  window.location.href = webUrl;
                }
              }, 1500);
            }}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            大众点评
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
