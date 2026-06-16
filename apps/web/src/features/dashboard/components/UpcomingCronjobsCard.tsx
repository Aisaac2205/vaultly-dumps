import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { EmptyState } from "@/shared/ui/empty-state";
import { Clock, Calendar } from "lucide-react";
import type { CronjobEntity } from "../types";

interface UpcomingCronjobsCardProps {
  cronjobs: CronjobEntity[];
}

export function UpcomingCronjobsCard({ cronjobs }: UpcomingCronjobsCardProps) {
  const active = cronjobs.filter((c) => c.isActive);
  const upcoming = active.slice(0, 4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Próximos Cronjobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="No hay cronjobs activos"
            description="No se encontraron cronjobs programados próximamente."
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((cj) => (
              <div
                key={cj.id}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{cj.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {cj.schedule}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {active.length > 4 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            +{active.length - 4} más
          </p>
        )}
      </CardContent>
    </Card>
  );
}
