import { useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
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
import { validateCronExpression } from "../lib/cron-validator";
import {
  useRetentionPreview,
  type RetentionPreviewParams,
} from "../hooks/useRetentionPreview";

function parseOptionalInt(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

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

  const [retention, setRetention] = useState({
    enabled: cronjob?.retentionEnabled ?? false,
    keepLast: cronjob?.retentionKeepLast?.toString() ?? "",
    maxAgeDays: cronjob?.retentionMaxAgeDays?.toString() ?? "",
    maxSizeMb: cronjob?.retentionMaxSizeMb?.toString() ?? "",
  });

  const previewParams: RetentionPreviewParams | null = useMemo(() => {
    if (!retention.enabled) return null;
    const slug = connections.find((c) => c.id === formData.connectionId)?.slug;
    if (!slug) return null;
    const keepLast = parseOptionalInt(retention.keepLast);
    const maxAgeDays = parseOptionalInt(retention.maxAgeDays);
    const maxTotalSizeMb = parseOptionalInt(retention.maxSizeMb);
    if (keepLast === undefined && maxAgeDays === undefined && maxTotalSizeMb === undefined) {
      return null;
    }
    return {
      connectionSlug: slug,
      category: formData.frequency,
      keepLast,
      maxAgeDays,
      maxTotalSizeMb,
    };
  }, [retention, connections, formData.connectionId, formData.frequency]);

  const { data: retentionPreview } = useRetentionPreview(previewParams);

  const nameCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of connections) counts[c.name] = (counts[c.name] ?? 0) + 1;
    return counts;
  }, [connections]);
  const hasDuplicateNames = Object.values(nameCounts).some((n) => n > 1);

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
    const cronCheck = validateCronExpression(formData.cronExpression);
    if (!cronCheck.valid) {
      setValidationError(cronCheck.error ?? "Expresión cron inválida");
      return;
    }

    try {
      await onSubmit({
        name: formData.name.trim(),
        connectionId: formData.connectionId,
        cronExpression: formData.cronExpression.trim(),
        frequency: formData.frequency,
        retentionEnabled: retention.enabled,
        retentionKeepLast: parseOptionalInt(retention.keepLast),
        retentionMaxAgeDays: parseOptionalInt(retention.maxAgeDays),
        retentionMaxSizeMb: parseOptionalInt(retention.maxSizeMb),
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
              {connectionsLoading ? (
                <div
                  className={`${inputClass} animate-pulse text-muted-foreground`}
                  aria-busy="true"
                >
                  Cargando conexiones…
                </div>
              ) : connections.length === 0 ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">
                    No hay conexiones de producción
                  </span>
                  <Link
                    to="/connections"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Crear conexión
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <>
                  <select
                    id="cronjob-connection"
                    className={inputClass}
                    name="connectionId"
                    value={formData.connectionId}
                    onChange={handleChange}
                    disabled={isLoading}
                  >
                    <option value="">Seleccionar conexión</option>
                    {connections.map((conn) => {
                      const isDuplicate = (nameCounts[conn.name] ?? 0) > 1;
                      const envSuffix = conn.environment
                        ? ` · ${conn.environment}`
                        : "";
                      let disambiguator = "";
                      if (isDuplicate) {
                        if (conn.host && conn.database) {
                          disambiguator = ` — ${conn.host}/${conn.database}`;
                        } else if (conn.database) {
                          disambiguator = ` — ${conn.database}`;
                        } else {
                          disambiguator = ` (#${conn.id.slice(0, 6)})`;
                        }
                      }
                      return (
                        <option key={conn.id} value={conn.id}>
                          {conn.name}
                          {envSuffix}
                          {disambiguator}
                        </option>
                      );
                    })}
                  </select>
                  {hasDuplicateNames && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400">
                      Hay conexiones con nombres repetidos — se muestra un ID
                      corto para diferenciarlas. Considerá renombrarlas en{" "}
                      <Link to="/connections" className="underline">
                        Conexiones
                      </Link>
                      .
                    </p>
                  )}
                </>
              )}
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

          {/* Retención */}
          <fieldset className="mt-4 rounded-md border border-border p-3">
            <legend className="px-1 text-xs font-semibold text-muted-foreground">
              Retención
            </legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={retention.enabled}
                onChange={(e) =>
                  setRetention((r) => ({ ...r, enabled: e.target.checked }))
                }
                disabled={isLoading}
              />
              Podar dumps viejos automáticamente tras cada corrida
            </label>

            {retention.enabled && (
              <>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="ret-keep-last"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      Conservar últimos
                    </label>
                    <input
                      id="ret-keep-last"
                      className={inputClass}
                      type="number"
                      min={0}
                      value={retention.keepLast}
                      onChange={(e) =>
                        setRetention((r) => ({ ...r, keepLast: e.target.value }))
                      }
                      placeholder="Ej. 24"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="ret-max-age"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      Máx. antigüedad (días)
                    </label>
                    <input
                      id="ret-max-age"
                      className={inputClass}
                      type="number"
                      min={1}
                      value={retention.maxAgeDays}
                      onChange={(e) =>
                        setRetention((r) => ({ ...r, maxAgeDays: e.target.value }))
                      }
                      placeholder="Ej. 30"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="ret-max-size"
                      className="text-xs font-semibold text-muted-foreground"
                    >
                      Tope de tamaño (MB)
                    </label>
                    <input
                      id="ret-max-size"
                      className={inputClass}
                      type="number"
                      min={1}
                      value={retention.maxSizeMb}
                      onChange={(e) =>
                        setRetention((r) => ({ ...r, maxSizeMb: e.target.value }))
                      }
                      placeholder="Ej. 5000"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <p
                  aria-live="polite"
                  className="mt-2 text-xs text-muted-foreground"
                >
                  {retentionPreview
                    ? `Ahora se podarían ${retentionPreview.count} dump(s) · ${retentionPreview.totalSizeMb} MB (siempre se conserva ≥1).`
                    : "Indicá al menos un criterio y elegí la conexión para ver el impacto."}
                </p>
              </>
            )}
          </fieldset>

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
