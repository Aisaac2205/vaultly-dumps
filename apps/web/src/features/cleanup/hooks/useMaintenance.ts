import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { maintenanceApi } from "../api/maintenance-api";
import type {
  StorageOverview,
  DbHygienePreview,
  DbHygieneResult,
  ReconcilePreview,
  ReconcileResult,
} from "../types";

export function useStorageOverview() {
  return useQuery<StorageOverview>({
    queryKey: ["storage-overview"],
    queryFn: maintenanceApi.storageOverview,
    staleTime: 30_000,
  });
}

export function useDbHygienePreview(olderThanDays: number, enabled: boolean) {
  return useQuery<DbHygienePreview>({
    queryKey: ["db-hygiene-preview", olderThanDays],
    queryFn: () => maintenanceApi.dbHygienePreview(olderThanDays),
    enabled,
    staleTime: 10_000,
  });
}

export function useRunDbHygiene() {
  const queryClient = useQueryClient();
  return useMutation<DbHygieneResult, Error, number>({
    mutationFn: (olderThanDays) => maintenanceApi.dbHygieneRun(olderThanDays),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["db-hygiene-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
  });
}

export function useReconcilePreview() {
  return useQuery<ReconcilePreview>({
    queryKey: ["reconcile-preview"],
    queryFn: maintenanceApi.reconcilePreview,
    staleTime: 15_000,
  });
}

export function useRunReconcile() {
  const queryClient = useQueryClient();
  return useMutation<ReconcileResult, Error, void>({
    mutationFn: () => maintenanceApi.reconcileRun(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reconcile-preview"] });
      void queryClient.invalidateQueries({ queryKey: ["storage-overview"] });
      void queryClient.invalidateQueries({ queryKey: ["dumps"] });
    },
  });
}

export function useDbHygienePanel() {
  const { t } = useTranslation("cleanup");
  const [days, setDays] = useState("30");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const daysNum = Number(days);
  const valid =
    days.trim() !== "" && Number.isInteger(daysNum) && daysNum >= 1;

  const {
    data: preview,
    isError: previewError,
    error: previewErrorDetail,
  } = useDbHygienePreview(valid ? daysNum : 0, valid);
  const run = useRunDbHygiene();

  const count = preview?.failedCount ?? 0;

  function handleConfirm() {
    if (!valid) return;
    run.mutate(daysNum, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        toast.success(t("toast.hygieneSuccess", { count: result.deleted }));
      },
      onError: (error) => {
        toast.error(error.message || t("toast.hygieneError"));
      },
    });
  }

  const statusText = !valid
    ? t("hygiene.statusInvalid")
    : count === 0
      ? t("hygiene.statusNone")
      : t("hygiene.statusFound", { count });

  return {
    days,
    setDays,
    confirmOpen,
    setConfirmOpen,
    valid,
    daysNum,
    preview,
    previewError,
    previewErrorDetail,
    count,
    handleConfirm,
    statusText,
    isPending: run.isPending,
  };
}

export function useReconcilePanel() {
  const { t } = useTranslation("cleanup");
  const { data, isLoading, isError, error } = useReconcilePreview();
  const run = useRunReconcile();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const stale = data?.staleDbRows.length ?? 0;
  const manifests = data?.orphanManifests.length ?? 0;
  const junkDumps = data?.orphanDumps.filter((d) => !d.hasManifest).length ?? 0;
  const restorable = data?.orphanDumps.filter((d) => d.hasManifest).length ?? 0;
  const toClean = stale + manifests + junkDumps;

  function handleConfirm() {
    run.mutate(undefined, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        if (result.errors.length > 0) {
          toast.warning(t("toast.reconcileSuccessWithErrors", {
            db: result.dbRowsDeleted,
            manifests: result.manifestsDeleted,
            dumps: result.dumpsDeleted,
            count: result.errors.length,
          }));
        } else {
          toast.success(t("toast.reconcileSuccess", {
            db: result.dbRowsDeleted,
            manifests: result.manifestsDeleted,
            dumps: result.dumpsDeleted,
          }));
        }
      },
      onError: (error) =>
        toast.error(error.message || t("toast.reconcileError")),
    });
  }

  return {
    data,
    isLoading,
    isError,
    error,
    confirmOpen,
    setConfirmOpen,
    stale,
    manifests,
    junkDumps,
    restorable,
    toClean,
    handleConfirm,
    isPending: run.isPending,
  };
}
