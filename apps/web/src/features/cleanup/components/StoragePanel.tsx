import { HardDrive, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { formatDate } from "@/features/dumps/lib/format";
import { useStorageOverview } from "../hooks/useMaintenance";

export function StoragePanel() {
  const { data, isLoading } = useStorageOverview();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Cargando almacenamiento…
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-muted-foreground/70" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-text-primary">Almacenamiento R2</h3>
          </div>
          <span className="font-mono text-sm tabular-nums text-text-primary">
            {data.totalDumps} dumps · {data.totalSizeMb} MB
          </span>
        </div>

        {data.byCategory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.byCategory.map((c) => (
              <span
                key={c.category}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs"
              >
                <span className="font-medium capitalize">{c.category}</span>
                <span className="tabular-nums text-muted-foreground">
                  {c.count} · {c.sizeMb} MB
                </span>
              </span>
            ))}
          </div>
        )}

        {data.byConnection.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-3 font-medium">Conexión</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Dumps</th>
                  <th className="py-1.5 pr-3 text-right font-medium">Tamaño</th>
                  <th className="py-1.5 font-medium">Más viejo</th>
                </tr>
              </thead>
              <tbody>
                {data.byConnection.map((c) => (
                  <tr key={c.connectionSlug} className="border-b border-border/50">
                    <td className="max-w-[12rem] truncate py-1.5 pr-3">
                      {c.connectionName}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{c.count}</td>
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
        )}
      </CardContent>
    </Card>
  );
}
