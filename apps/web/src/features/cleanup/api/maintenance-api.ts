import apiClient from "@/shared/lib/api-client";
import type {
  StorageOverview,
  DbHygienePreview,
  DbHygieneResult,
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
};
