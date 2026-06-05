import apiClient from "@/shared/lib/api-client";
import type { CleanupParams, CleanupPreview, CleanupResult } from "../types";

export const cleanupApi = {
  preview: (params: CleanupParams) =>
    apiClient
      .get<CleanupPreview>("/backups/cleanup/preview", { params })
      .then((r) => r.data),

  run: (params: CleanupParams) =>
    apiClient
      .post<CleanupResult>("/backups/cleanup", params)
      .then((r) => r.data),
};
