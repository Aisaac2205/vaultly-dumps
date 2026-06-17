import apiClient from "@/shared/lib/api-client";
import type {
  ConnectionRetentionPolicy,
  ConnectionRetentionPolicyInput,
  RetentionPreviewItem,
  RetentionRunItem,
} from "../types";

export const connectionRetentionApi = {
  getPolicies: (connectionSlug: string) =>
    apiClient
      .get<ConnectionRetentionPolicy[]>(
        `/maintenance/retention/${connectionSlug}`,
      )
      .then((r) => r.data),

  updatePolicies: (
    connectionSlug: string,
    policies: ConnectionRetentionPolicyInput[],
  ) =>
    apiClient
      .put<ConnectionRetentionPolicy[]>(
        `/maintenance/retention/${connectionSlug}`,
        { policies },
      )
      .then((r) => r.data),

  getPreview: (connectionSlug: string) =>
    apiClient
      .get<RetentionPreviewItem[]>(
        `/maintenance/retention/${connectionSlug}/preview`,
      )
      .then((r) => r.data),

  runCleanup: (connectionSlug: string) =>
    apiClient
      .post<RetentionRunItem[]>(
        `/maintenance/retention/${connectionSlug}/run`,
      )
      .then((r) => r.data),
};
