import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type {
  Cronjob,
  Connection,
  CreateCronjobDto,
  UpdateCronjobDto,
} from "../types";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  useCronjobForm,
  CRON_PRESETS,
} from "../hooks/useCronjobForm";

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

export default function CronjobForm({
  cronjob,
  connections,
  connectionsLoading,
  onSubmit,
  onCancel,
  isLoading,
}: CronjobFormProps) {
  const {
    formData,
    selectedPresetLabel,
    validationError,
    retention,
    retentionPreview,
    isCustom,
    isEditMode,
    nameCounts,
    hasDuplicateNames,
    handleChange,
    handlePresetChange,
    handleCronExpressionChange,
    handleRetentionChange,
    handleSubmit,
  } = useCronjobForm({
    cronjob,
    connections,
    onSubmit,
    onCancel,
    isLoading,
  });

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
                  handleRetentionChange("enabled", e.target.checked)
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
                        handleRetentionChange("keepLast", e.target.value)
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
                        handleRetentionChange("maxAgeDays", e.target.value)
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
                        handleRetentionChange("maxSizeMb", e.target.value)
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
