import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useReconcilePreview, useRunReconcile } from "../hooks/useMaintenance";

interface HealthRowProps {
  label: string;
  count: number;
  severity: "ok" | "warning" | "critical";
}

function HealthRow({ label, count, severity }: HealthRowProps) {
  const icon =
    severity === "ok" ? (
      <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
    ) : severity === "warning" ? (
      <AlertCircle className="size-4 text-amber-500" aria-hidden="true" />
    ) : (
      <AlertTriangle
        className="size-4 text-destructive"
        aria-hidden="true"
      />
    );

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-sm text-text-primary">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {count > 0 && (
          <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
            <div
              className={`h-full rounded-full ${
                severity === "critical"
                  ? "bg-destructive"
                  : severity === "warning"
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(count * 10, 100)}%` }}
            />
          </div>
        )}
        <span
          className={`min-w-[2ch] text-right text-sm font-medium tabular-nums ${
            severity === "ok"
              ? "text-emerald-600"
              : severity === "warning"
                ? "text-amber-600"
                : "text-destructive"
          }`}
        >
          {count}
        </span>
      </div>
    </li>
  );
}

export function ReconcilePanel() {
  const { data, isLoading, isError, error } = useReconcilePreview();
  const run = useRunReconcile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Analizando R2 y base…
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-text-primary">
            Sincronizar Almacenamiento y Base de Datos
          </h3>
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            Error al analizar:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const stale = data.staleDbRows.length;
  const manifests = data.orphanManifests.length;
  const junkDumps = data.orphanDumps.filter((d) => !d.hasManifest).length;
  const restorable = data.orphanDumps.filter((d) => d.hasManifest).length;
  const toClean = stale + manifests + junkDumps;

  function handleConfirm() {
    run.mutate(undefined, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        const summary = `${result.dbRowsDeleted} registros · ${result.manifestsDeleted} metadatos · ${result.dumpsDeleted} dumps incompletos`;
        if (result.errors.length > 0) {
          toast.warning(`${summary} · ${result.errors.length} con error`);
        } else {
          toast.success(summary);
        }
      },
      onError: (error) =>
        toast.error(error.message || "No se pudo reconciliar"),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Sincronizar Almacenamiento y Base de Datos
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            Detecta restos cuando R2 y la base se desincronizan. Lo que se puede
            restaurar nunca se toca.
          </p>
        </div>

        {toClean === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-4 py-3">
            <CheckCircle2
              className="size-5 text-emerald-600"
              aria-hidden="true"
            />
            <span className="text-sm font-medium text-text-primary">
              Todo sincronizado — no hay restos que limpiar.
            </span>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            <HealthRow
              label="Registros que apuntan a dumps ya borrados"
              count={stale}
              severity={stale > 0 ? "critical" : "ok"}
            />
            <HealthRow
              label="Archivos de metadatos sueltos"
              count={manifests}
              severity={manifests > 0 ? "warning" : "ok"}
            />
            <HealthRow
              label="Dumps incompletos de subidas fallidas"
              count={junkDumps}
              severity={junkDumps > 0 ? "warning" : "ok"}
            />
            <HealthRow
              label="Dumps sin registrar pero restaurables (se conservan)"
              count={restorable}
              severity="ok"
            />
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <p
            aria-live="polite"
            role="status"
            className="text-xs text-muted-foreground"
          >
            {toClean === 0
              ? "Nada por limpiar."
              : `${toClean} resto(s) se limpiarían.`}
          </p>
          <Button
            type="button"
            variant="destructive"
            disabled={toClean === 0 || run.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {run.isPending ? "Limpiando..." : "Limpiar restos"}
          </Button>
        </div>
      </CardContent>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
              Limpiar restos
            </DialogTitle>
            <DialogDescription>
              Vas a limpiar <strong>{toClean}</strong> resto(s) de la base y R2:
              registros huérfanos, metadatos sueltos y dumps incompletos.{" "}
              <strong>Los dumps restaurables no se tocan.</strong> Esta acción es{" "}
              <strong>irreversible</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={run.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={run.isPending}
            >
              {run.isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Limpiar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
