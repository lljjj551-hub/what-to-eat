"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistance, formatPrice, formatRating } from "@/lib/utils";
import { Star, MapPin, Heart, ThumbsDown } from "lucide-react";
import type { ScoredRestaurant } from "@/lib/recommend-client";

interface RestaurantListProps {
  restaurants: ScoredRestaurant[];
  onFavorite: (id: string) => void;
  onDislike: (id: string) => void;
}

export function RestaurantList({
  restaurants,
  onFavorite,
  onDislike,
}: RestaurantListProps) {
  if (restaurants.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">
        📋 附近候选店铺 ({restaurants.length})
      </h3>
      <div className="space-y-3">
        {restaurants.map((r, index) => (
          <Card
            key={r.id}
            hover
            className="animate-fade-in overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold truncate">{r.name}</h4>
                    {r.isFavorite && (
                      <Heart className="w-3 h-3 text-red-500 fill-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {formatRating(r.rating)}
                    </span>
                    <span>{formatPrice(r.avgPrice)}</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {formatDistance(r.distance)}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <Badge variant={r.score >= 70 ? "success" : "default"}>
                  {r.score.toFixed(0)}分
                </Badge>

                {/* Quick actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => onFavorite(r.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title={r.isFavorite ? "取消收藏" : "收藏"}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        r.isFavorite
                          ? "text-red-500 fill-red-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => onDislike(r.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title="不想吃"
                  >
                    <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
