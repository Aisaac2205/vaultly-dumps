import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, AlertTriangle } from "lucide-react";
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

interface RowProps {
  label: string;
  value: number;
  muted?: boolean;
}

function Row({ label, value, muted = false }: RowProps) {
  return (
    <li
      className={`flex items-center justify-between gap-3 ${
        muted ? "text-muted-foreground" : ""
      }`}
    >
      <span>{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
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
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-text-primary">
              Sincronizar Almacenamiento y Base de Datos
            </h3>
          </div>
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
          <div className="flex items-center gap-2">
            <ShieldAlert
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <h3 className="text-sm font-semibold text-text-primary">
              Sincronizar Almacenamiento y Base de Datos
            </h3>
          </div>
          <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
            A veces el Almacenamiento R2 y la Base de Datos se desincronizan.
            Esto detecta y limpia los restos.{" "}
            <span className="text-muted-foreground">
              Lo que se puede restaurar nunca se toca.
            </span>
          </p>
        </div>

        <ul className="space-y-1 text-sm">
          <Row label="Registros que apuntan a dumps ya borrados" value={stale} />
          <Row label="Archivos de metadatos sueltos" value={manifests} />
          <Row label="Dumps incompletos de subidas falladas" value={junkDumps} />
          <Row
            label="Dumps sin registrar pero restaurables (se conservan)"
            value={restorable}
            muted
          />
        </ul>

        <div className="flex items-center justify-between gap-3">
          <p aria-live="polite" className="text-xs text-muted-foreground">
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
              <AlertTriangle className="size-5 text-error" aria-hidden="true" />
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
              {run.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Limpiar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
