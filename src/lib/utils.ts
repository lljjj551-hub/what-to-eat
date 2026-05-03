import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatPrice(price: number): string {
  if (price === 0) return "暂无";
  return `¥${price}/人`;
}

export function formatRating(rating: number): string {
  if (rating === 0) return "暂无评分";
  return rating.toFixed(1);
}
