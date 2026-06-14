import { cn } from "@/shared/lib/cn";

interface SparklineProps {
  /** Array of numeric values (typically 8-30 data points). Must have at least 2 values. */
  data: number[];
  /** SVG width in pixels (default 80). */
  width?: number;
  /** SVG height in pixels (default 24). */
  height?: number;
  /**
   * Stroke color for the line path.
   * @default "currentColor" (inherits from parent text color)
   */
  stroke?: string;
  /** Stroke width (default 1.5). */
  strokeWidth?: number;
  /**
   * Fill color for the area under the line.
   * When omitted, no area fill is rendered.
   * When set, use a low-opacity color (e.g., "currentColor" with CSS fill-opacity).
   */
  fill?: string;
  /** Additional CSS classes merged via `cn()`. */
  className?: string;
  /**
   * Accessible label for the SVG.
   * @default "Sparkline"
   */
  "aria-label"?: string;
}

/**
 * A tiny inline-SVG line chart for showing numerical trends in a small space.
 *
 * Common sizes: 80×24, 120×32, 160×40 px.
 *
 * Handles edge cases:
 * - Fewer than 2 data points → renders nothing (null)
 * - Constant data (all same value) → renders a flat horizontal line at mid-height
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  stroke = "currentColor",
  strokeWidth = 1.5,
  fill,
  className,
  "aria-label": ariaLabel = "Sparkline",
}: SparklineProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("text-muted-foreground overflow-visible", className)}
      aria-label={ariaLabel}
      role="img"
    >
      {fill ? <path d={areaPath} fill={fill} /> : null}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
