import { useMemo, useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import type { CronFrequency } from "@/types/backup.types";
import type {
  Cronjob,
  Connection,
  CreateCronjobDto,
  UpdateCronjobDto,
  RetentionPreview,
} from "../types";
import { validateCronExpression } from "../lib/cron-validator";
import {
  useRetentionPreview,
  type RetentionPreviewParams,
} from "./useRetentionPreview";

function parseOptionalInt(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export interface CronPreset {
  label: string;
  cronExpression: string;
  frequency: CronFrequency;
}

export const CRON_PRESETS: readonly CronPreset[] = [
  { label: "Cada hora", cronExpression: "0 * * * *", frequency: "hourly" },
  { label: "Diario a las 2am", cronExpression: "0 2 * * *", frequency: "daily" },
  { label: "Semanal (lunes 2am)", cronExpression: "0 2 * * 1", frequency: "weekly" },
  { label: "Personalizado", cronExpression: "", frequency: "custom" },
] as const;

export const CUSTOM_LABEL = "Personalizado";

export function detectPresetLabel(
  cronExpression: string,
  frequency: CronFrequency,
): string {
  const match = CRON_PRESETS.find(
    (p) => p.frequency === frequency && p.cronExpression === cronExpression,
  );
  if (match) return match.label;
  return CUSTOM_LABEL;
}

export interface CronjobFormData {
  name: string;
  connectionId: string;
  cronExpression: string;
  frequency: CronFrequency;
}

export interface RetentionFormData {
  enabled: boolean;
  keepLast: string;
  maxAgeDays: string;
  maxSizeMb: string;
}

export interface UseCronjobFormProps {
  cronjob?: Cronjob;
  connections: Connection[];
  onSubmit: (dto: CreateCronjobDto | UpdateCronjobDto) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export interface UseCronjobFormReturn {
  formData: CronjobFormData;
  selectedPresetLabel: string;
  validationError: string | null;
  retention: RetentionFormData;
  retentionPreview: RetentionPreview | undefined;
  isCustom: boolean;
  isEditMode: boolean;
  nameCounts: Record<string, number>;
  hasDuplicateNames: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handlePresetChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  handleCronExpressionChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleRetentionChange: <K extends keyof RetentionFormData>(
    field: K,
    value: RetentionFormData[K],
  ) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
}

/**
 * Custom React hook for managing the state, validation, presets, and retention preview
 * calculations of the CronjobForm component.
 */
export function useCronjobForm({
  cronjob,
  connections,
  onSubmit,
  isLoading,
}: UseCronjobFormProps): UseCronjobFormReturn {
  const isEditMode = cronjob !== undefined;

  const initialFrequency: CronFrequency = cronjob?.frequency ?? "custom";
  const initialCronExpression = cronjob?.cronExpression ?? "";

  const [formData, setFormData] = useState<CronjobFormData>({
    name: cronjob?.name ?? "",
    connectionId: cronjob?.connectionId ?? "",
    cronExpression: initialCronExpression,
    frequency: initialFrequency,
  });

  const [selectedPresetLabel, setSelectedPresetLabel] = useState<string>(() =>
    detectPresetLabel(initialCronExpression, initialFrequency),
  );

  const [validationError, setValidationError] = useState<string | null>(null);

  const [retention, setRetention] = useState<RetentionFormData>({
    enabled: cronjob?.retentionEnabled ?? false,
    keepLast: cronjob?.retentionKeepLast?.toString() ?? "",
    maxAgeDays: cronjob?.retentionMaxAgeDays?.toString() ?? "",
    maxSizeMb: cronjob?.retentionMaxSizeMb?.toString() ?? "",
  });

  const previewParams = useMemo<RetentionPreviewParams | null>(() => {
    if (!retention.enabled) return null;
    const slug = connections.find((c) => c.id === formData.connectionId)?.slug;
    if (!slug) return null;
    const keepLast = parseOptionalInt(retention.keepLast);
    const maxAgeDays = parseOptionalInt(retention.maxAgeDays);
    const maxTotalSizeMb = parseOptionalInt(retention.maxSizeMb);
    if (
      keepLast === undefined &&
      maxAgeDays === undefined &&
      maxTotalSizeMb === undefined
    ) {
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

  const nameCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const c of connections) {
      counts[c.name] = (counts[c.name] ?? 0) + 1;
    }
    return counts;
  }, [connections]);

  const hasDuplicateNames = useMemo<boolean>(
    () => Object.values(nameCounts).some((n) => n > 1),
    [nameCounts],
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    // Type assertion is safe here because form inputs use matching name attributes
    setFormData((prev) => ({ ...prev, [name as keyof CronjobFormData]: value }));
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

  const handleCronExpressionChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      cronExpression: value,
      frequency: "custom",
    }));
    setSelectedPresetLabel(CUSTOM_LABEL);
    setValidationError(null);
  };

  const handleRetentionChange = <K extends keyof RetentionFormData>(
    field: K,
    value: RetentionFormData[K],
  ) => {
    setRetention((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

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
      // Parent handle components will catch this error
    }
  };

  const isCustom = formData.frequency === "custom";

  return {
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
  };
}
