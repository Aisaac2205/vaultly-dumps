import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/chart";
import type { DailyBackupCount } from "../types";

interface BackupAreaChartProps {
  data: DailyBackupCount[];
}

const chartConfig: ChartConfig = {
  scheduled: { label: "Programados", color: "var(--color-chart-scheduled)" },
  manual: { label: "Manuales", color: "var(--color-chart-manual)" },
};

type TimeRange = "90d" | "30d" | "7d";

const RANGE_LABELS: Record<TimeRange, string> = {
  "90d": "3 meses",
  "30d": "30 días",
  "7d": "7 días",
};

export function BackupAreaChart({ data }: BackupAreaChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const daysMap: Record<TimeRange, number> = { "90d": 90, "30d": 30, "7d": 7 };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysMap[timeRange]);

  const filteredData = data.filter(
    (d) => new Date(d.date) >= cutoff,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Backups completados</CardTitle>
            <CardDescription>
              Programados vs manuales — últimos {RANGE_LABELS[timeRange]}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {(Object.keys(RANGE_LABELS) as TimeRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No hay datos para este período
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-scheduled)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-scheduled)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillManual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-manual)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-manual)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value: string) =>
                  new Date(value).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                  })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) =>
                      new Date(value).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="scheduled"
                type="monotone"
                fill="url(#fillScheduled)"
                stroke="var(--color-scheduled)"
                stackId="a"
              />
              <Area
                dataKey="manual"
                type="monotone"
                fill="url(#fillManual)"
                stroke="var(--color-manual)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
