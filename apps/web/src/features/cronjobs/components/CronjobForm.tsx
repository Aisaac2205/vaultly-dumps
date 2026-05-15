import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type {
  Cronjob,
  Connection,
  CreateCronjobDto,
  UpdateCronjobDto,
} from "../types";
import type { CronFrequency } from "@/types/backup.types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

interface CronPreset {
  label: string;
  cronExpression: string;
  frequency: CronFrequency;
}

const CRON_PRESETS: readonly CronPreset[] = [
  { label: "Cada hora", cronExpression: "0 * * * *", frequency: "hourly" },
  { label: "Diario a las 2am", cronExpression: "0 2 * * *", frequency: "daily" },
  { label: "Semanal (lunes 2am)", cronExpression: "0 2 * * 1", frequency: "weekly" },
  { label: "Personalizado", cronExpression: "", frequency: "custom" },
] as const;

const CUSTOM_LABEL = "Personalizado";

interface CronjobFormProps {
  cronjob?: Cronjob;
  connections: Connection[];
  connectionsLoading: boolean;
  onSubmit: (
    dto: CreateCronjobDto | UpdateCronjobDto,
  ) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function detectPresetLabel(
  cronExpression: string,
  frequency: CronFrequency,
): string {
  const match = CRON_PRESETS.find(
    (p) => p.frequency === frequency && p.cronExpression === cronExpression,
  );
  if (match) return match.label;
  return CUSTOM_LABEL;
}

export default function CronjobForm({
  cronjob,
  connections,
  connectionsLoading,
  onSubmit,
  onCancel,
  isLoading,
}: CronjobFormProps) {
  const isEditMode = cronjob !== undefined;

  const initialFrequency: CronFrequency = cronjob?.frequency ?? "custom";
  const initialCronExpression = cronjob?.cronExpression ?? "";

  const [formData, setFormData] = useState({
    name: cronjob?.name ?? "",
    connectionId: cronjob?.connectionId ?? "",
    cronExpression: initialCronExpression,
    frequency: initialFrequency,
  });

  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>(
    () => detectPresetLabel(initialCronExpression, initialFrequency),
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(null);
  };

  const handlePresetChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const label = e.target.value;
    const preset = CRON_PRESETS.find((p) => p.label === label);
    if (!preset) return;
    setSelectedPresetLabel(label);
    setFormData((prev) => ({
      ...prev,
      frequency: preset.frequency,
      cronExpression:
        preset.frequency === "custom"
          ? prev.cronExpression
          : preset.cronExpression,
    }));
    setValidationError(null);
  };

  const handleCronExpressionChange = (
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cronExpression: value,
      frequency: "custom",
    }));
    setSelectedPresetLabel(CUSTOM_LABEL);
    setValidationError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setValidationError("El nombre es obligatorio");
      return;
    }
    if (!formData.connectionId) {
      setValidationError("La conexión es obligatoria");
      return;
    }
    if (!formData.cronExpression.trim()) {
      setValidationError("La expresión cron es obligatoria");
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        connectionId: formData.connectionId,
        cronExpression: formData.cronExpression.trim(),
        frequency: formData.frequency,
      });
    } catch {
      // Error handling is done by the parent
    }
  };

  const isCustom = formData.frequency === "custom";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditMode ? "Editar cronjob" : "Nuevo cronjob"}
        </CardTitle>
        <CardDescription>
          Configurá la ejecución programada de un respaldo
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cronjob-name"
                className="text-xs font-semibold text-muted-foreground"
              >
                Nombre
              </label>
              <input
                id="cronjob-name"
                className={inputClass}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Backup diario"
                disabled={isLoading}
              />
            </div>

            {/* Conexión */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cronjob-connection"
                className="text-xs font-semibold text-muted-foreground"
              >
                Conexión (producción)
              </label>
              <select
                id="cronjob-connection"
                className={inputClass}
                name="connectionId"
                value={formData.connectionId}
                onChange={handleChange}
                disabled={isLoading || connectionsLoading}
              >
                <option value="">
                  {connectionsLoading
                    ? "Cargando conexiones..."
                    : "Seleccionar conexión"}
                </option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Frecuencia */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cronjob-preset"
                className="text-xs font-semibold text-muted-foreground"
              >
                Frecuencia
              </label>
              <select
                id="cronjob-preset"
                className={inputClass}
                value={selectedPresetLabel}
                onChange={handlePresetChange}
                disabled={isLoading}
              >
                {CRON_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Categoría que se usa para clasificar el backup en el bucket
                (<code className="font-mono">{formData.frequency}</code>).
              </p>
            </div>

            {/* Expresión Cron */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="cronjob-expression"
                className="text-xs font-semibold text-muted-foreground"
              >
                Expresión Cron
              </label>
              <input
                id="cronjob-expression"
                className={`font-mono text-xs ${inputClass}`}
                type="text"
                name="cronExpression"
                value={formData.cronExpression}
                onChange={handleCronExpressionChange}
                placeholder="0 2 * * *"
                disabled={isLoading || !isCustom}
              />
              {!isCustom && (
                <p className="text-[11px] text-muted-foreground">
                  Editá la frecuencia a <em>Personalizado</em> para escribir
                  una expresión propia.
                </p>
              )}
            </div>
          </div>

          {/* Cron helper text */}
          <div className="mt-3 font-mono text-xs leading-relaxed text-muted-foreground">
            0 2 * * * = cada día a las 2am
            <br />
            0 2 * * 1 = cada lunes a las 2am
            <br />
            0 */6 * * * = cada 6 horas
          </div>

          {validationError && (
            <div className="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {validationError}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Guardando..."
              : isEditMode
                ? "Guardar cambios"
                : "Crear cronjob"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
