import apiClient from "@/shared/lib/api-client";
import type {
  ManualRetentionSettings,
  ManualRetentionUpdate,
} from "../types";

export const manualRetentionApi = {
  get: () =>
    apiClient
      .get<ManualRetentionSettings>("/maintenance/retention/manual")
      .then((r) => r.data),

  update: (dto: ManualRetentionUpdate) =>
    apiClient
      .put<ManualRetentionSettings>("/maintenance/retention/manual", dto)
      .then((r) => r.data),
};
