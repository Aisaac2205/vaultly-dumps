import * as React from "react";
import { Legend, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/shared/lib/cn";

// ---------------------------------------------------------------------------
// ChartConfig
// ---------------------------------------------------------------------------

export type ChartConfig = Record<string, { label: string; color: string }>;

// ---------------------------------------------------------------------------
// ChartContext
// ---------------------------------------------------------------------------

interface ChartContextValue {
  config: ChartConfig;
}

const ChartContext = React.createContext<ChartContextValue | null>(null);

function useChartContext() {
  const ctx = React.useContext(ChartContext);
  if (!ctx)
    throw new Error("useChartContext must be used inside ChartContainer");
  return ctx;
}

// ---------------------------------------------------------------------------
// ChartContainer
// ---------------------------------------------------------------------------

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ComponentProps<typeof ResponsiveContainer>["children"];
}

function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const cssVars = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(config).map(([key, { color }]) => [
          `--color-${key}`,
          color,
        ]),
      ) as React.CSSProperties,
    [config],
  );

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        style={cssVars}
        className={cn("w-full text-xs", className)}
        {...props}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ChartTooltip
// ---------------------------------------------------------------------------

const ChartTooltip = Tooltip;

// ---------------------------------------------------------------------------
// ChartTooltipContent
// ---------------------------------------------------------------------------

interface TooltipPayloadItem {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  labelFormatter?: (
    label: string,
    payload: TooltipPayloadItem[],
  ) => React.ReactNode;
  formatter?: (value: number, name: string) => React.ReactNode;
  indicator?: "dot" | "line" | "dashed";
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      className,
      hideLabel = false,
      hideIndicator = false,
      labelFormatter,
      formatter,
      indicator = "dot",
    },
    ref,
  ) => {
    const { config } = useChartContext();

    if (!active || !payload?.length) return null;

    const resolvedLabel = labelFormatter
      ? labelFormatter(label as string, payload)
      : (label as string);

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!hideLabel && resolvedLabel ? (
          <p className="font-medium text-foreground">{resolvedLabel}</p>
        ) : null}
        <div className="grid gap-1">
          {payload.map((item: TooltipPayloadItem) => {
            const key = (item.dataKey ?? item.name ?? "") as string;
            const seriesConfig = config[key];
            const color = item.color ?? seriesConfig?.color;
            const displayName = seriesConfig?.label ?? item.name ?? key;
            const value = formatter
              ? formatter(item.value as number, key)
              : (item.value as React.ReactNode);

            return (
              <div key={key} className="flex items-center gap-1.5">
                {!hideIndicator && (
                  <Indicator color={color} variant={indicator} />
                )}
                <span className="flex flex-1 justify-between gap-2 leading-none">
                  <span className="text-muted-foreground">{displayName}</span>
                  {value != null && (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {value}
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltipContent";

// ---------------------------------------------------------------------------
// ChartLegend
// ---------------------------------------------------------------------------

const ChartLegend = Legend;

// ---------------------------------------------------------------------------
// ChartLegendContent
// ---------------------------------------------------------------------------

interface LegendPayloadItem {
  dataKey?: string;
  value?: string;
  color?: string;
}

interface ChartLegendContentProps extends React.HTMLAttributes<HTMLDivElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  hideIcon?: boolean;
}

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ className, payload, hideIcon = false }, ref) => {
  const { config } = useChartContext();

  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 pt-3",
        className,
      )}
    >
      {payload.map((item: LegendPayloadItem) => {
        const key = item.dataKey as string | undefined;
        const seriesConfig = key ? config[key] : undefined;
        const color = item.color ?? seriesConfig?.color;
        const label = seriesConfig?.label ?? item.value;

        return (
          <div
            key={key ?? item.value}
            className="flex items-center gap-1.5 leading-none"
          >
            {!hideIcon && (
              <span
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            )}
            <span className="text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegendContent";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface IndicatorProps {
  color?: string;
  variant: "dot" | "line" | "dashed";
}

function Indicator({ color, variant }: IndicatorProps) {
  if (variant === "dot") {
    return (
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    );
  }

  if (variant === "dashed") {
    return (
      <span
        className="h-px w-4 shrink-0 border-t-2 border-dashed"
        style={{ borderColor: color }}
      />
    );
  }

  return (
    <span
      className="h-px w-4 shrink-0 border-t-2"
      style={{ borderColor: color }}
    />
  );
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
};
