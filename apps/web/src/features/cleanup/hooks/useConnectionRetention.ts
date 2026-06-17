import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionRetentionApi } from "../api/connection-retention-api";
import { useConnections } from "@/features/connections/hooks/useConnections";
import { BACKUP_CATEGORIES } from "@/types/backup.types";
import type { BackupCategory } from "@/types/backup.types";
import { toast } from "sonner";
import { CATEGORY_LABELS } from "../lib/labels";
import type {
  ConnectionRetentionPolicyInput,
  RetentionPreviewItem,
  RetentionRunItem,
} from "../types";

const QUERY_KEY = ["connection-retention"] as const;

export function useRetentionPolicies(connectionSlug: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, connectionSlug, "policies"],
    queryFn: () => connectionRetentionApi.getPolicies(connectionSlug),
    enabled: connectionSlug !== "",
    staleTime: 30_000,
  });
}

export function useUpdateRetentionPolicies(connectionSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (policies: ConnectionRetentionPolicyInput[]) =>
      connectionRetentionApi.updatePolicies(connectionSlug, policies),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, connectionSlug],
      });
    },
  });
}

export function useRetentionPreview(connectionSlug: string) {
  return useQuery<RetentionPreviewItem[]>({
    queryKey: [...QUERY_KEY, connectionSlug, "preview"],
    queryFn: () => connectionRetentionApi.getPreview(connectionSlug),
    enabled: connectionSlug !== "",
    staleTime: 15_000,
  });
}

export function useRunRetention(connectionSlug: string) {
  const queryClient = useQueryClient();

  return useMutation<RetentionRunItem[], Error>({
    mutationFn: () => connectionRetentionApi.runCleanup(connectionSlug),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, connectionSlug, "preview"],
      });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
      void queryClient.invalidateQueries({ queryKey: ["r2-dumps"] });
    },
  });
}

export interface RowState {
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

export function useConnectionRetentionPanel() {
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

  const [prevPolicyKey, setPrevPolicyKey] = useState<string>("");

  if (policyKey !== prevPolicyKey) {
    setPrevPolicyKey(policyKey);
    setRows(buildInitialRows(policies));
    setValidationError(null);
  }

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

  return {
    connections,
    connectionsLoading,
    connectionSlug,
    setConnectionSlug,
    confirmOpen,
    setConfirmOpen,
    validationError,
    rows,
    updateRow,
    handleSave,
    handleRunCleanup,
    connectionSelected,
    isLoading,
    policiesError,
    policiesErrorObj,
    isDirty,
    hasSavedPolicy,
    prunable,
    totalCount,
    totalMb,
    previewLoading,
    isSaving: updatePolicies.isPending,
    isRunning: runRetention.isPending,
  };
}
