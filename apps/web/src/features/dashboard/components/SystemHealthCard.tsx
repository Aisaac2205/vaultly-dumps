import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { ConnectionStateBadge } from "@/shared/components/ConnectionStateBadge";
import type { R2Object, ConnectionEntity } from "../types";
import { formatSize, formatRelativeTime } from "../lib/format";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";
import { Activity, HardDrive, Server } from "lucide-react";

interface SystemHealthCardProps {
  dumps: R2Object[];
  connections: ConnectionEntity[];
}

export function SystemHealthCard({ dumps, connections }: SystemHealthCardProps) {
  const totalSize = dumps.reduce((acc, d) => acc + d.size, 0);
  const lastDump =
    dumps.length > 0
      ? dumps.reduce((latest, d) =>
          new Date(d.lastModified) > new Date(latest.lastModified) ? d : latest,
        )
      : null;

  const hasStorage = dumps.length > 0;
  const hasConnections = connections.length > 0;

  if (!hasStorage && !hasConnections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salud del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="Sin datos de salud"
            description="No hay datos de almacenamiento ni conexiones disponibles."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Salud del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Section */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5" />
            Almacenamiento R2
            <img src={cloudflareSvg} alt="Cloudflare R2" className="h-3.5 w-3.5" />
          </h3>
          {hasStorage ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dumps almacenados</span>
                <span className="font-mono font-semibold">{dumps.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Espacio ocupado</span>
                <span className="font-mono font-semibold">
                  {totalSize > 0 ? formatSize(totalSize) : "0 MB"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Último dump</span>
                <span className="font-mono text-xs">
                  {lastDump ? formatRelativeTime(lastDump.lastModified) : "N/A"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay datos de almacenamiento
            </p>
          )}
        </div>

        {/* Connections Section */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Server className="h-3.5 w-3.5" />
            Conexiones
          </h3>
          {hasConnections ? (
            <div className="space-y-2">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate">{conn.name}</span>
                  <ConnectionStateBadge isActive={conn.isActive} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay conexiones configuradas
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
