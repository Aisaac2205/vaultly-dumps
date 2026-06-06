import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { useDbHygienePreview, useRunDbHygiene } from "../hooks/useMaintenance";

const inputClass =
  "h-9 w-32 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function DbHygienePanel() {
  const [days, setDays] = useState("30");
  const daysNum = Number(days);
  const valid =
    days.trim() !== "" && Number.isInteger(daysNum) && daysNum >= 1;

  const { data: preview } = useDbHygienePreview(valid ? daysNum : 0, valid);
  const run = useRunDbHygiene();

  const count = preview?.failedCount ?? 0;

  function handleRun() {
    if (!valid) return;
    if (!window.confirm(`¿Borrar ${count} registro(s) de backups fallidos?`)) {
      return;
    }
    run.mutate(daysNum, {
      onSuccess: (result) =>
        toast.success(`${result.deleted} registro(s) fallido(s) borrado(s)`),
      onError: (error) =>
        toast.error(error.message || "No se pudo limpiar la base"),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Backups fallidos viejos
          </h3>
          <p className="text-xs text-muted-foreground">
            Cada intento que falla deja un registro en la base. Borrá los más
            viejos que los días indicados para que no se acumulen.{" "}
            <span className="text-text-secondary">Tus dumps no se tocan.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="db-hygiene-days"
              className="text-xs font-medium text-muted-foreground"
            >
              Más viejos que (días)
            </label>
            <input
              id="db-hygiene-days"
              className={inputClass}
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {!valid
              ? "Indicá cuántos días"
              : count === 0
                ? "Nada para borrar"
                : `${count} registro(s) fallido(s) se borrarían`}
          </p>
          <Button
            type="button"
            variant="destructive"
            className="ml-auto"
            disabled={!valid || count === 0 || run.isPending}
            onClick={handleRun}
          >
            {run.isPending ? "Borrando..." : "Borrar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
