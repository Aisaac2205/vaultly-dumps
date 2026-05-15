import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Database, HardDrive, Calendar, Server } from "lucide-react";
import type { BackupJob } from "../types";
import { formatSizeMb } from "../lib/format";

interface DumpsStatsProps {
  dumps: BackupJob[];
}

export function DumpsStats({ dumps }: DumpsStatsProps) {
  const completed = dumps.filter((d) => d.status === "completed");
  const totalSize = completed.reduce(
    (acc, d) => acc + (d.fileSizeMb ?? 0),
    0,
  );
  const lastBackup =
    completed.length > 0
      ? completed.reduce((latest, d) =>
          new Date(d.completedAt!) > new Date(latest.completedAt!) ? d : latest,
        )
      : null;

  // Most backed up connection
  const connCounts: Record<string, number> = {};
  completed.forEach((d) => {
    connCounts[d.connectionName] = (connCounts[d.connectionName] ?? 0) + 1;
  });
  const topConn = Object.entries(connCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dumps.length}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Espacio Total</CardTitle>
          <HardDrive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatSizeMb(totalSize)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {lastBackup?.completedAt
              ? new Date(lastBackup.completedAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                })
              : "N/A"}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Más Respaldada</CardTitle>
          <Server className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">
            {topConn?.[0] ?? "N/A"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
