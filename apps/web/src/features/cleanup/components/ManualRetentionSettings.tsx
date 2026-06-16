import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  useManualRetention,
  useUpdateManualRetention,
} from "../hooks/useManualRetention";
import type { ManualRetentionUpdate } from "../types";

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function toField(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseField(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min: number;
  placeholder: string;
  disabled: boolean;
  hint: string;
}

function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  placeholder,
  disabled,
  hint,
}: NumberFieldProps) {
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={hintId}
      />
      <p id={hintId} className="text-[11px] text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

export function ManualRetentionSettings() {
  const { data, isLoading, isError, error } = useManualRetention();
  const update = useUpdateManualRetention();

  const [enabled, setEnabled] = useState(false);
  const [keepLast, setKeepLast] = useState("");
  const [maxAgeDays, setMaxAgeDays] = useState("");
  const [maxSizeMb, setMaxSizeMb] = useState("");

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setKeepLast(toField(data.keepLast));
    setMaxAgeDays(toField(data.maxAgeDays));
    setMaxSizeMb(toField(data.maxTotalSizeMb));
  }, [data]);

  function handleSave() {
    const dto: ManualRetentionUpdate = {
      enabled,
      keepLast: parseField(keepLast),
      maxAgeDays: parseField(maxAgeDays),
      maxTotalSizeMb: parseField(maxSizeMb),
    };
    update.mutate(dto, {
      onSuccess: () => toast.success("Retención de manuales guardada"),
      onError: (error) =>
        toast.error(error.message || "No se pudo guardar la retención"),
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            Dumps manuales
          </h3>
          <p className="max-w-2xl text-xs text-muted-foreground">
            No tienen cronjob, así que se limpian con esta política una vez al
            día. Siempre se conserva al menos 1.
          </p>
        </div>

        {isError && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Error al cargar retención:{" "}
            {error instanceof Error ? error.message : "Error desconocido"}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="mr-enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={isLoading}
          />
          <label htmlFor="mr-enabled" className="text-sm">
            Activar limpieza automática de dumps manuales
          </label>
        </div>

        {enabled && (
          <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <legend className="sr-only">Criterios de retención manual</legend>
            <NumberField
              id="mr-keep-last"
              label="Conservar últimos"
              value={keepLast}
              onChange={setKeepLast}
              min={0}
              placeholder="Ej. 10"
              disabled={isLoading}
              hint="Cantidad de dumps a conservar. 0 = sin límite."
            />
            <NumberField
              id="mr-max-age"
              label="Máx. antigüedad (días)"
              value={maxAgeDays}
              onChange={setMaxAgeDays}
              min={1}
              placeholder="Ej. 30"
              disabled={isLoading}
              hint="Se eliminan los dumps con más días que este valor."
            />
            <NumberField
              id="mr-max-size"
              label="Tope de tamaño (MB)"
              value={maxSizeMb}
              onChange={setMaxSizeMb}
              min={1}
              placeholder="Ej. 2000"
              disabled={isLoading}
              hint="Se eliminan dumps hasta que el total baje de este tope."
            />
          </fieldset>
        )}

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading || update.isPending}
          >
            {update.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
