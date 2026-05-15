import { cn } from "@/shared/lib/cn";
import type { Connection } from "../types";

interface ConnectionDetailsProps {
  connection: Connection;
  isActive?: boolean;
}

export function ConnectionDetails({ connection, isActive = false }: ConnectionDetailsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs transition-all",
        isActive && "rounded-xl border border-blue-500/30 bg-blue-500/5 p-2.5 shadow-[0_0_12px_rgba(59,130,246,0.08)]",
      )}
    >
      <span className="text-muted-foreground">Host</span>
      <span className="truncate font-mono font-bold">{connection.host}</span>

      <span className="text-muted-foreground">Puerto</span>
      <span className="truncate font-mono font-bold">{connection.port}</span>

      <span className="text-muted-foreground">DB</span>
      <span className="truncate font-mono font-bold">{connection.database}</span>

      <span className="text-muted-foreground">Usuario</span>
      <span className="truncate font-mono font-bold">{connection.username ?? "—"}</span>
    </div>
  );
}
