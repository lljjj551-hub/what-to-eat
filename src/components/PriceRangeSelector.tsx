"use client";

import { cn } from "@/lib/utils";

const PRESET_RANGES = [
  { min: 0, max: 30, label: "¥30以内" },
  { min: 30, max: 50, label: "¥30-50" },
  { min: 50, max: 80, label: "¥50-80" },
  { min: 80, max: 120, label: "¥80-120" },
  { min: 120, max: 9999, label: "¥120以上" },
];

interface PriceRangeSelectorProps {
  selected: { min: number; max: number };
  onChange: (range: { min: number; max: number }) => void;
}

export function PriceRangeSelector({ selected, onChange }: PriceRangeSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-muted-foreground">
        💰 人均预算
      </label>
      <div className="flex flex-wrap gap-2">
        {PRESET_RANGES.map((range) => {
          const isSelected =
            range.min === selected.min && range.max === selected.max;
          return (
            <button
              key={range.label}
              onClick={() => onChange(range)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "bg-card border-2 border-orange-200 text-foreground hover:border-primary/30 hover:bg-primary/10"
              )}
            >
              {range.label}
            </button>
          );
        })}
      </div>

      {/* Custom price range */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-muted-foreground">自定义：</span>
        <input
          type="number"
          placeholder="最低"
          value={selected.min || ""}
          onChange={(e) =>
            onChange({ min: Number(e.target.value) || 0, max: selected.max })
          }
          className="w-20 h-9 rounded-lg border border-orange-200 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-muted-foreground">—</span>
        <input
          type="number"
          placeholder="最高"
          value={selected.max >= 9999 ? "" : selected.max || ""}
          onChange={(e) =>
            onChange({
              min: selected.min,
              max: Number(e.target.value) || 9999,
            })
          }
          className="w-20 h-9 rounded-lg border border-orange-200 px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <span className="text-xs text-muted-foreground">元/人</span>
      </div>
    </div>
  );
}
