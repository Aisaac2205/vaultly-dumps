import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { JobSummary } from "../types";

interface BackupStatusChartProps {
  summary: JobSummary | null;
}

const COLORS = {
  completed: "#22c55e",
  failed: "#ef4444",
  running: "#3b82f6",
  pending: "#eab308",
};


export function BackupStatusChart({ summary }: BackupStatusChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = summary
    ? [
        { name: "Completados", value: summary.completed, type: "completed" },
        { name: "Fallidos", value: summary.failed, type: "failed" },
        { name: "En progreso", value: summary.running, type: "running" },
        { name: "Pendientes", value: summary.pending, type: "pending" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Distribución de Backups</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          mounted ? (
            <ResponsiveContainer width="100%" height={300} minWidth={0}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.type}
                    fill={COLORS[entry.type as keyof typeof COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center" />
          )
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            No hay datos de backups disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}
