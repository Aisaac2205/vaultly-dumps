import { useState } from "react";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";
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

interface StatProps {
  label: string;
  value: number;
  muted?: boolean;
}

function Stat({ label, value, muted = false }: StatProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-md border border-border px-4 py-3 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </div>
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

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Registros huérfanos" value={stale} />
          <Stat label="Metadatos sueltos" value={manifests} />
          <Stat label="Dumps incompletos" value={junkDumps} />
          <Stat
            label="Restaurables (se conservan)"
            value={restorable}
            muted
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p
            aria-live="polite"
            role="status"
            className="text-xs text-muted-foreground"
          >
            {toClean === 0
              ? "Todo sincronizado."
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
