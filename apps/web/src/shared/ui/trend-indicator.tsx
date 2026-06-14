import { cn } from "@/shared/lib/cn";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  /**
   * The change value.
   * - For percentages: 0.15 = +15%, -0.45 = -45%
   * - For raw numbers: +120, -45
   */
  value: number;
  /**
   * Display format.
   * - `"percent"`: multiplies by 100, appends `%` sign, rounds to 2 significant figures
   * - `"number"`: raw value with sign prefix
   * @default "percent"
   */
  format?: "percent" | "number";
  /**
   * When `true`, a **decrease** is considered positive (e.g., latency decreased = good).
   * Swaps the success/error color mapping.
   * @default false
   */
  inverted?: boolean;
  /** Additional CSS classes merged via `cn()`. */
  className?: string;
  /**
   * Visual size.
   * - `"sm"`: text-xs, compact padding, 12px icon
   * - `"md"`: text-sm, comfortable padding, 16px icon
   * @default "sm"
   */
  size?: "sm" | "md";
}

/**
 * A small chip showing direction (▲▼—) + formatted value + semantic color.
 *
 * Color logic:
 *   inverted=false → up = success (green),  down = error (red)
 *   inverted=true  → up = error (red),      down = success (green)
 *   value === 0    → neutral (muted)
 */
export function TrendIndicator({
  value,
  format = "percent",
  inverted = false,
  className,
  size = "sm",
}: TrendIndicatorProps) {
  const isUp = value > 0;
  const isNeutral = value === 0;

  const goodWhen = inverted ? "down" : "up";
  const isGood = isNeutral ? null : isUp ? goodWhen === "up" : goodWhen === "down";

  const colorClass =
    isGood === null
      ? "text-muted-foreground bg-muted"
      : isGood
        ? "text-success bg-success/10"
        : "text-error bg-error/10";

  const Icon = isNeutral ? Minus : isUp ? ArrowUp : ArrowDown;

  const display =
    format === "percent"
      ? `${value > 0 ? "+" : ""}${(value * 100).toFixed(value < 0.1 && value > -0.1 ? 1 : 0)}%`
      : `${value > 0 ? "+" : ""}${value}`;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-1.5 py-0.5"
      : "text-sm px-2 py-1";

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md font-medium",
        colorClass,
        sizeClasses,
        className,
      )}
    >
      <Icon className={cn(iconSize, "shrink-0")} aria-hidden="true" />
      {display}
    </span>
  );
}
