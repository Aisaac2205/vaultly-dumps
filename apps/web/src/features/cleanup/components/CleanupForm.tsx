import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
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
import { FrequencyTabs } from "@/features/restore/components/FrequencyTabs";
import { formatSize } from "@/shared/lib/format";
import { formatDateTimeShort as formatDate } from "@/lib/format";
import { useCleanupForm } from "../hooks/useCleanup";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CleanupForm() {
  const {
    connections,
    connectionsLoading,
    connectionSlug,
    category,
    setCategory,
    mode,
    amount,
    setAmount,
    confirmOpen,
    setConfirmOpen,
    amountValid,
    params,
    preview,
    previewFetching,
    hasItems,
    handleConnectionChange,
    handleModeChange,
    handleConfirm,
    amountLabel,
    isPending,
  } = useCleanupForm();

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Connection */}
            <div className="space-y-1.5">
              <label
                htmlFor="cleanup-connection"
                className="block text-xs font-medium text-muted-foreground"
              >
                Base de datos
              </label>
              <select
                id="cleanup-connection"
                value={connectionSlug}
                onChange={(e) => handleConnectionChange(e.target.value)}
                disabled={connectionsLoading}
                className={inputClass}
              >
                <option value="">Seleccioná una conexión</option>
                {connections.map((connection) => (
                  <option key={connection.id} value={connection.slug}>
                    {connection.name} · {connection.environment}
                  </option>
                ))}
              </select>
            </div>

            {/* Criterion mode */}
            <fieldset className="space-y-1.5">
              <legend className="block text-xs font-medium text-muted-foreground">
                Criterio
              </legend>
              <div className="flex gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    id="cleanup-mode-keepLast"
                    type="radio"
                    name="cleanup-mode"
                    value="keepLast"
                    checked={mode === "keepLast"}
                    onChange={() => handleModeChange("keepLast")}
                  />
                  <label htmlFor="cleanup-mode-keepLast" className="text-sm">
                    Conservar últimos
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="cleanup-mode-maxAgeDays"
                    type="radio"
                    name="cleanup-mode"
                    value="maxAgeDays"
                    checked={mode === "maxAgeDays"}
                    onChange={() => handleModeChange("maxAgeDays")}
                  />
                  <label htmlFor="cleanup-mode-maxAgeDays" className="text-sm">
                    Más viejos que
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Frequency */}
          {connectionSlug && (
            <div className="space-y-1.5" role="group" aria-labelledby="cleanup-frequency-label">
              <label
                id="cleanup-frequency-label"
                className="block text-xs font-medium text-muted-foreground"
              >
                Tipo de dump
              </label>
              <FrequencyTabs value={category} onChange={setCategory} />
            </div>
          )}

          {/* Amount */}
          <div className="space-y-1.5 sm:max-w-xs">
            <label
              htmlFor="cleanup-amount"
              className="block text-xs font-medium text-muted-foreground"
            >
              {amountLabel}
            </label>
            <input
              id="cleanup-amount"
              type="number"
              inputMode="numeric"
              min={mode === "keepLast" ? 0 : 1}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-invalid={!amountValid}
              aria-describedby="cleanup-amount-hint"
              className={inputClass}
            />
            <p id="cleanup-amount-hint" className="text-[11px] text-muted-foreground">
              {mode === "keepLast"
                ? "Se eliminan todos los dumps salvo los más recientes."
                : "Se eliminan los dumps con más días que el valor indicado."}
            </p>
          </div>

          {/* Preview */}
          <CleanupPreviewPanel
            ready={params !== null}
            loading={previewFetching}
            count={preview?.count ?? 0}
            totalSizeMb={preview?.totalSizeMb ?? 0}
            items={preview?.items ?? []}
          />

          <div className="flex justify-end">
            <Button
              type="button"
              variant="destructive"
              disabled={!hasItems || isPending}
              aria-describedby={!hasItems ? "cleanup-submit-hint" : undefined}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 aria-hidden="true" />
              Eliminar {hasItems ? `${preview?.count}` : ""} dump(s)
            </Button>
            {!hasItems && (
              <span id="cleanup-submit-hint" className="sr-only">
                {!connectionSlug
                  ? "Seleccioná una conexión y tipo de dump primero"
                  : !category
                    ? "Seleccioná un tipo de dump"
                    : !amountValid
                      ? "Ingresá una cantidad válida"
                      : "No hay dumps para eliminar con estos criterios"}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmCleanupDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        count={preview?.count ?? 0}
        totalSizeMb={preview?.totalSizeMb ?? 0}
        pending={isPending}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

interface PreviewPanelProps {
  ready: boolean;
  loading: boolean;
  count: number;
  totalSizeMb: number;
  items: { key: string; timestamp: string; size: number; lastModified: string }[];
}

function CleanupPreviewPanel({
  ready,
  loading,
  count,
  totalSizeMb,
  items,
}: PreviewPanelProps) {
  if (!ready) {
    return (
      <div className="rounded-md bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
        Elegí conexión, tipo y criterio para ver qué se eliminaría.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border">
      <div
        aria-live="polite"
        className="flex items-center justify-between gap-2 border-b border-border px-3 py-2 text-sm"
      >
        <span className="font-medium text-text-primary">
          {loading
            ? "Calculando…"
            : count === 0
              ? "Nada para eliminar"
              : `Se eliminarán ${count} dump(s)`}
        </span>
        {!loading && count > 0 && (
          <span className="font-mono text-xs text-muted-foreground">
            {totalSizeMb} MB
          </span>
        )}
      </div>
      {count > 0 && (
        <ul className="max-h-56 divide-y divide-border overflow-auto">
          {items.map((item) => (
            <li
              key={item.key}
              className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
            >
              <span className="truncate font-mono">{item.timestamp}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatDate(item.lastModified)} · {formatSize(item.size)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  totalSizeMb: number;
  pending: boolean;
  onConfirm: () => void;
}

function ConfirmCleanupDialog({
  open,
  onOpenChange,
  count,
  totalSizeMb,
  pending,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-error" aria-hidden="true" />
            Eliminar dumps
          </DialogTitle>
          <DialogDescription>
            Vas a eliminar <strong>{count}</strong> dump(s) ({totalSizeMb} MB) de R2 y
            de la base de datos. Esta acción es <strong>irreversible</strong>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            Eliminar definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
