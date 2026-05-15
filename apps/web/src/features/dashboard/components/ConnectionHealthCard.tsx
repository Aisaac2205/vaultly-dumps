import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import type { ConnectionEntity } from "../types";

interface ConnectionHealthCardProps {
  connections: ConnectionEntity[];
}

export function ConnectionHealthCard({
  connections,
}: ConnectionHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Estado de Conexiones
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center justify-between text-sm"
            >
              <span>{conn.name}</span>
              <span
                className={`flex items-center gap-1 ${
                  conn.isActive ? "text-success" : "text-error"
                }`}
              >
                {conn.isActive ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activa
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    Inactiva
                  </>
                )}
              </span>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay conexiones configuradas
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
