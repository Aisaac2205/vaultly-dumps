import apiClient from "@/shared/lib/api-client";
import type {
  StorageOverview,
  DbHygienePreview,
  DbHygieneResult,
  ReconcilePreview,
  ReconcileResult,
} from "../types";

export const maintenanceApi = {
  storageOverview: () =>
    apiClient
      .get<StorageOverview>("/maintenance/storage/overview")
      .then((r) => r.data),

  dbHygienePreview: (olderThanDays: number) =>
    apiClient
      .get<DbHygienePreview>("/maintenance/db/preview", {
        params: { olderThanDays },
      })
      .then((r) => r.data),

  dbHygieneRun: (olderThanDays: number) =>
    apiClient
      .post<DbHygieneResult>("/maintenance/db/cleanup", { olderThanDays })
      .then((r) => r.data),

  reconcilePreview: () =>
    apiClient
      .get<ReconcilePreview>("/maintenance/reconcile/preview")
      .then((r) => r.data),

  reconcileRun: () =>
    apiClient
      .post<ReconcileResult>("/maintenance/reconcile")
      .then((r) => r.data),
};
