"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, Crosshair } from "lucide-react";

interface LocationInputProps {
  onLocation: (lat: number, lng: number, address?: string) => void;
  disabled?: boolean;
}

export function LocationInput({ onLocation, disabled }: LocationInputProps) {
  const [address, setAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);

  async function handleGeocode() {
    if (!address.trim()) return;
    setGeoLoading(true);
    try {
      const url = `https://restapi.amap.com/v3/geocode/geo?key=813a338d0647e0cf937dc665e904bad5&address=${encodeURIComponent(address.trim())}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.status === "1" && data.geocodes?.length) {
        setHasLocation(true);
        const [lng, lat] = data.geocodes[0].location.split(",").map(Number);
        onLocation(lat, lng, data.geocodes[0].formatted_address);
      }
    } catch {
      // silent
    } finally {
      setGeoLoading(false);
    }
  }

  function handleGps() {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHasLocation(true);
        setGpsLoading(false);
        onLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        setGpsLoading(false);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-muted-foreground">
        📍 我的位置
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="输入地址或直接点帮我选"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGeocode()}
          className="flex-1 h-10 rounded-xl border px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={handleGeocode}
          disabled={geoLoading || !address.trim() || disabled}
          size="sm"
          variant="outline"
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          定位
        </Button>
        <Button
          onClick={handleGps}
          disabled={gpsLoading || disabled}
          size="sm"
          variant="ghost"
          title="GPS 自动定位"
        >
          {gpsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Crosshair className="w-4 h-4" />
          )}
        </Button>
      </div>
      {hasLocation && (
        <p className="flex items-center gap-1 text-xs text-green-600">
          <MapPin className="w-3 h-3" />
          已获取位置
        </p>
      )}
    </div>
  );
}
