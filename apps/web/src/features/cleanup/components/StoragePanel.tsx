import { HardDrive, Database, Radio, Clock } from "lucide-react";
import { formatDate } from "@/features/dumps/lib/format";
import { StatCard } from "@/shared/ui/stat-card";
import { Stagger, StaggerItem } from "@/shared/ui/motion/Stagger";
import { useStorageOverview } from "../hooks/useMaintenance";

function countOldDumps(connections: { oldest: string | null }[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return connections.filter((c) => {
    if (!c.oldest) return false;
    return new Date(c.oldest) < thirtyDaysAgo;
  }).length;
}

export function StoragePanel() {
  const { data, isLoading } = useStorageOverview();

  if (!data && !isLoading) {
    return (
      <StatCard
        variant="outlined"
        label="Almacenamiento"
        value="—"
        icon={<HardDrive className="h-4 w-4" />}
        loading={false}
      />
    );
  }

  const connectionsWithDumps = data
    ? data.byConnection.filter((c) => c.count > 0).length
    : 0;

  const oldDumps = data ? countOldDumps(data.byConnection) : 0;

  return (
    <div className="space-y-4">
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem>
          <StatCard
            variant="outlined"
            label="Total dumps"
            value={data?.totalDumps ?? "—"}
            icon={<Database className="h-4 w-4" />}
            loading={isLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            variant="outlined"
            label="Total MB"
            value={data != null ? `${data.totalSizeMb} MB` : "—"}
            icon={<HardDrive className="h-4 w-4" />}
            loading={isLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            variant="outlined"
            label="Conexiones con dumps"
            value={data != null ? connectionsWithDumps : "—"}
            icon={<Radio className="h-4 w-4" />}
            loading={isLoading}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            variant="outlined"
            label="Dumps viejos (&gt;30 d)"
            value={data != null ? oldDumps : "—"}
            icon={<Clock className="h-4 w-4" />}
            loading={isLoading}
          />
        </StaggerItem>
      </Stagger>

      {data != null && data.byConnection.length > 0 && (
        <details className="group rounded-lg border border-border">
          <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-muted-foreground marker:content-none">
            <span className="select-none group-open:rotate-90 transition-transform text-[10px]">
              ▶
            </span>
            Detalle por conexión
          </summary>
          <div className="overflow-x-auto border-t border-border px-2 pb-2">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Uso de almacenamiento R2 por conexión
              </caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium" scope="col">
                    Conexión
                  </th>
                  <th className="py-1.5 pr-3 text-right font-medium" scope="col">
                    Dumps
                  </th>
                  <th className="py-1.5 pr-3 text-right font-medium" scope="col">
                    Tamaño
                  </th>
                  <th className="py-1.5 font-medium" scope="col">
                    Más viejo
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.byConnection.map((c) => (
                  <tr
                    key={c.connectionSlug}
                    className="border-b border-border/50"
                  >
                    <td className="max-w-[12rem] truncate py-1.5 pr-3">
                      {c.connectionName}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {c.count}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">
                      {c.sizeMb} MB
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {c.oldest ? formatDate(c.oldest) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
