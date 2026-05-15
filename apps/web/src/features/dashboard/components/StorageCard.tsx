import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Cloud } from "lucide-react";
import type { R2Object } from "../types";
import { formatSize, formatRelativeTime } from "../lib/format";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";

interface StorageCardProps {
  dumps: R2Object[];
}

export function StorageCard({ dumps }: StorageCardProps) {
  const totalSize = dumps.reduce((acc, d) => acc + d.size, 0);
  const lastDump = dumps.length > 0
    ? dumps.reduce((latest, d) =>
      new Date(d.lastModified) > new Date(latest.lastModified) ? d : latest
    )
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Almacenamiento R2
          </span>
          <img src={cloudflareSvg} alt="Cloudflare R2" className="h-4 w-4" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dumps almacenados</span>
            <span className="font-mono font-semibold">{dumps.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Espacio total</span>
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
      </CardContent>
    </Card>
  );
}
