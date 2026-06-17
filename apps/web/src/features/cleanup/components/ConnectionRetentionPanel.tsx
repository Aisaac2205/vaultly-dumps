import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { useConnections } from "@/features/connections/hooks/useConnections";
import { BACKUP_CATEGORIES, type BackupCategory } from "@/types/backup.types";
import {
  useRetentionPolicies,
  useRetentionPreview,
  useUpdateRetentionPolicies,
  useRunRetention,
} from "../hooks/useConnectionRetention";
import { CATEGORY_LABELS } from "../lib/labels";
import type { ConnectionRetentionPolicyInput } from "../types";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

interface RowState {
  category: BackupCategory;
  keepForever: boolean;
  days: string;
}

function buildInitialRows(
  policies: { category: BackupCategory; retentionDays: number | null }[],
): RowState[] {
  const byCategory = new Map(
    policies.map((p) => [p.category, p.retentionDays]),
  );

  return BACKUP_CATEGORIES.map((category) => {
    const days = byCategory.get(category);
    return {
      category,
      keepForever: days == null,
      days: days?.toString() ?? "30",
    };
  });
}

export function ConnectionRetentionPanel() {
  const { data: connections = [], isLoading: connectionsLoading } =
    useConnections();

  const [connectionSlug, setConnectionSlug] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    data: policies = [],
    isLoading: policiesLoading,
    isError: policiesError,
    error: policiesErrorObj,
  } = useRetentionPolicies(connectionSlug);

  const { data: preview = [], isLoading: previewLoading } =
    useRetentionPreview(connectionSlug);

  const updatePolicies = useUpdateRetentionPolicies(connectionSlug);
  const runRetention = useRunRetention(connectionSlug);

  const [rows, setRows] = useState<RowState[]>(() =>
    buildInitialRows(policies),
  );

  // Sync rows when policies load or connection changes.
  const policyKey = useMemo(
    () => `${connectionSlug}-${policies.map((p) => p.category + p.retentionDays).join(",")}`,
    [connectionSlug, policies],
  );

  useMemo(() => {
    setRows(buildInitialRows(policies));
    setValidationError(null);
  }, [policyKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateRow = (category: BackupCategory, patch: Partial<RowState>) => {
    setRows((prev) =>
      prev.map((r) => (r.category === category ? { ...r, ...patch } : r)),
    );
    setValidationError(null);
  };

  const handleSave = async () => {
    for (const row of rows) {
      if (row.keepForever) continue;
      const parsed = Number(row.days);
      if (!Number.isInteger(parsed) || parsed < 1) {
        setValidationError(
          `El valor de "${CATEGORY_LABELS[row.category]}" debe ser un entero mayor o igual a 1.`,
        );
        return;
      }
    }

    const payload: ConnectionRetentionPolicyInput[] = rows.map((row) => ({
      category: row.category,
      retentionDays: row.keepForever ? null : Number(row.days),
    }));

    try {
      await updatePolicies.mutateAsync(payload);
      toast.success("Política guardada", {
        description:
          "La retención se aplicará en el próximo barrido diario.",
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al guardar la política";
      toast.error("No se pudo guardar la política", { description: message });
    }
  };

  const handleRunCleanup = async () => {
    try {
      const summary = await runRetention.mutateAsync();
      const deleted = summary.reduce((s, i) => s + i.deleted, 0);
      const freed = summary.reduce((s, i) => s + i.freedMb, 0);
      const errors = summary.reduce((s, i) => s + i.errors, 0);
      toast.success("Limpieza ejecutada", {
        description: `Se eliminaron ${deleted} dumps (${freed.toFixed(2)} MB).${
          errors > 0 ? ` ${errors} con error.` : ""
        }`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al ejecutar la limpieza";
      toast.error("No se pudo ejecutar la limpieza", { description: message });
    } finally {
      setConfirmOpen(false);
    }
  };

  const connectionSelected = connectionSlug !== "";
  const isLoading = connectionsLoading || policiesLoading;
  const prunable = preview.filter((i) => i.count > 0);
  const totalCount = prunable.reduce((s, i) => s + i.count, 0);
  const totalMb = prunable.reduce((s, i) => s + i.totalSizeMb, 0);

  const isDirty = useMemo(() => {
    const saved = new Map(
      policies.map((p) => [p.category, p.retentionDays]),
    );
    for (const row of rows) {
      const savedDays = saved.get(row.category);
      if (row.keepForever && savedDays != null) return true;
      if (!row.keepForever && savedDays == null) return true;
      if (!row.keepForever && savedDays != null) {
        if (savedDays !== Number(row.days)) return true;
      }
    }
    return false;
  }, [rows, policies]);

  const hasSavedPolicy = policies.some((p) => p.retentionDays != null);

  return (
    <div className="space-y-4">
      {/* Connection selector */}
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1.5">
            <label
              htmlFor="retention-connection"
              className="block text-xs font-medium text-muted-foreground"
            >
              Base de datos (PROD)
            </label>
            <select
              id="retention-connection"
              value={connectionSlug}
              onChange={(e) => setConnectionSlug(e.target.value)}
              disabled={connectionsLoading}
              className={inputClass}
            >
              <option value="">Seleccioná una conexión PROD</option>
              {connections
                .filter((c) => c.environment === "prod")
                .map((connection) => (
                  <option key={connection.id} value={connection.slug}>
                    {connection.name}
                  </option>
                ))}
            </select>
            {!connectionsLoading &&
              connections.filter((c) => c.environment === "prod").length ===
                0 && (
                <p className="text-xs text-muted-foreground">
                  No tenés conexiones PROD configuradas.
                </p>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Policy form */}
      {connectionSelected && (
        <Card>
          <CardHeader>
            <CardTitle>Política de retención</CardTitle>
            <CardDescription>
              Eliminá automáticamente los dumps por antigüedad según su tipo.
              Esta política aplica solo a la conexión seleccionada.
            </CardDescription>
            {!isLoading && !isDirty && hasSavedPolicy && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                Política guardada — se aplica en el próximo barrido.
              </div>
            )}
          </CardHeader>

          {policiesError && (
            <CardContent>
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {policiesErrorObj instanceof Error
                  ? policiesErrorObj.message
                  : "Error al cargar la política"}
              </div>
            </CardContent>
          )}

          <CardContent className="flex flex-col gap-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-md bg-muted"
                  />
                ))}
              </div>
            ) : (
              rows.map((row) => {
                const valueId = `retention-days-${row.category}`;
                const keepId = `retention-keep-${row.category}`;
                return (
                  <fieldset
                    key={row.category}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-border px-4 py-3"
                  >
                    <legend className="sr-only">
                      {CATEGORY_LABELS[row.category]}
                    </legend>
                    <span className="w-32 text-sm font-medium">
                      {CATEGORY_LABELS[row.category]}
                    </span>

                    <label
                      htmlFor={keepId}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <input
                        id={keepId}
                        type="checkbox"
                        checked={row.keepForever}
                        onChange={(e) =>
                          updateRow(row.category, {
                            keepForever: e.target.checked,
                          })
                        }
                        disabled={updatePolicies.isPending}
                      />
                      Conservar para siempre
                    </label>

                    {!row.keepForever && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={valueId} className="sr-only">
                          Días de retención para{" "}
                          {CATEGORY_LABELS[row.category]}
                        </label>
                        <input
                          id={valueId}
                          className={`${inputClass} w-20`}
                          type="number"
                          min={1}
                          step={1}
                          value={row.days}
                          onChange={(e) =>
                            updateRow(row.category, {
                              days: e.target.value,
                            })
                          }
                          disabled={updatePolicies.isPending}
                        />
                        <span className="text-sm text-muted-foreground">
                          días
                        </span>
                      </div>
                    )}
                  </fieldset>
                );
              })
            )}

            {validationError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {validationError}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="destructive"
              disabled={prunable.length === 0 || runRetention.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              {runRetention.isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Ejecutar limpieza ahora
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading || updatePolicies.isPending || !isDirty}
            >
              {updatePolicies.isPending ? "Guardando..." : "Guardar política"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Impact preview */}
      {connectionSelected && (
        <Card>
          <CardHeader>
            <CardTitle>Impacto de la limpieza</CardTitle>
            <CardDescription>
              Lo que la política actual eliminaría si se ejecutara ahora. No
              borra nada — es solo una previsualización.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <p className="text-sm text-muted-foreground">
                Calculando impacto...
              </p>
            ) : prunable.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay dumps que superen la antigüedad configurada. Nada por
                eliminar.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {prunable.map((item) => (
                    <div
                      key={item.category}
                      className="rounded-md border border-border px-4 py-3"
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {CATEGORY_LABELS[item.category]}
                      </p>
                      <p className="text-lg font-semibold">
                        {item.count}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          {item.count === 1 ? "dump" : "dumps"}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.totalSizeMb.toFixed(2)} MB
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: <strong>{totalCount}</strong> dumps ({totalMb.toFixed(2)}{" "}
                  MB)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle
                className="size-5 text-destructive"
                aria-hidden="true"
              />
              Ejecutar limpieza ahora
            </DialogTitle>
            <DialogDescription>
              Se eliminarán de forma permanente los dumps que superen la
              antigüedad configurada, tanto en R2 como su archivo. El registro
              en el historial se conserva. ¿Continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={runRetention.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRunCleanup()}
              disabled={runRetention.isPending}
            >
              {runRetention.isPending && (
                <Loader2 className="animate-spin" aria-hidden="true" />
              )}
              Eliminar dumps viejos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
