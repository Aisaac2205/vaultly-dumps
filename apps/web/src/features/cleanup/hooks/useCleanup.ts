import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cleanupApi } from "../api/cleanup-api";
import { useConnections } from "@/features/connections/hooks/useConnections";
import type { BackupCategory } from "@/types/backup.types";
import type { CleanupMode, CleanupParams, CleanupPreview, CleanupResult } from "../types";

export function useCleanupPreview(params: CleanupParams | null) {
  return useQuery<CleanupPreview>({
    queryKey: ["cleanup-preview", params],
    queryFn: () =>
      params
        ? cleanupApi.preview(params)
        : Promise.reject(new Error("Parámetros de limpieza incompletos")),
    enabled: params !== null,
    staleTime: 10_000,
  });
}

export function useRunCleanup() {
  const queryClient = useQueryClient();
  return useMutation<CleanupResult, Error, CleanupParams>({
    mutationFn: (params) => cleanupApi.run(params),
    onSuccess: () => {
      // Refresh anything that lists dumps so removed ones disappear.
      void queryClient.invalidateQueries({ queryKey: ["cleanup-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["r2-dumps"] });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
  });
}

export function useCleanupForm() {
  const { data: connections = [], isLoading: connectionsLoading } = useConnections();

  const [connectionSlug, setConnectionSlug] = useState<string>("");
  const [category, setCategory] = useState<BackupCategory | null>(null);
  const [mode, setMode] = useState<CleanupMode>("keepLast");
  const [amount, setAmount] = useState<string>("5");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const amountNum = Number(amount);
  const amountValid =
    amount.trim() !== "" &&
    Number.isInteger(amountNum) &&
    (mode === "keepLast" ? amountNum >= 0 : amountNum >= 1);

  const params: CleanupParams | null = useMemo(() => {
    if (!connectionSlug || !category || !amountValid) return null;
    return mode === "keepLast"
      ? { connectionSlug, category, keepLast: amountNum }
      : { connectionSlug, category, maxAgeDays: amountNum };
  }, [connectionSlug, category, amountValid, amountNum, mode]);

  const { data: preview, isFetching: previewFetching } = useCleanupPreview(params);
  const runCleanup = useRunCleanup();

  const hasItems = (preview?.count ?? 0) > 0;

  function handleConnectionChange(slug: string) {
    setConnectionSlug(slug);
    setCategory(null);
  }

  function handleModeChange(next: CleanupMode) {
    setMode(next);
    setAmount("");
  }

  function handleConfirm(onSuccess?: () => void) {
    if (!params) return;
    runCleanup.mutate(params, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        const summary = `${result.deleted} dump(s) · ${result.freedMb} MB liberados`;
        if (result.errors.length > 0) {
          toast.warning(`${summary} · ${result.errors.length} con error`);
        } else {
          toast.success(summary);
        }
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message || "No se pudo completar la limpieza");
      },
    });
  }

  const amountLabel =
    mode === "keepLast" ? "Cantidad a conservar" : "Antigüedad mínima (días)";

  return {
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
    isPending: runCleanup.isPending,
  };
}
