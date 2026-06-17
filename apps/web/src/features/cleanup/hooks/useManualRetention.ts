import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { manualRetentionApi } from "../api/retention-api";
import type {
  ManualRetentionSettings,
  ManualRetentionUpdate,
} from "../types";

const QUERY_KEY = ["manual-retention"];

export function useManualRetention() {
  return useQuery<ManualRetentionSettings>({
    queryKey: QUERY_KEY,
    queryFn: manualRetentionApi.get,
    staleTime: 60_000,
  });
}

export function useUpdateManualRetention() {
  const queryClient = useQueryClient();
  return useMutation<ManualRetentionSettings, Error, ManualRetentionUpdate>({
    mutationFn: manualRetentionApi.update,
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data);
    },
  });
}

function toField(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function parseField(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

export function useManualRetentionSettings() {
  const { data, isLoading, isError, error } = useManualRetention();
  const update = useUpdateManualRetention();

  const [enabled, setEnabled] = useState(false);
  const [keepLast, setKeepLast] = useState("");
  const [maxAgeDays, setMaxAgeDays] = useState("");
  const [maxSizeMb, setMaxSizeMb] = useState("");

  const [prevData, setPrevData] = useState<ManualRetentionSettings | null>(null);

  if (data && data !== prevData) {
    setPrevData(data);
    setEnabled(data.enabled);
    setKeepLast(toField(data.keepLast));
    setMaxAgeDays(toField(data.maxAgeDays));
    setMaxSizeMb(toField(data.maxTotalSizeMb));
  }

  function handleSave() {
    const dto: ManualRetentionUpdate = {
      enabled,
      keepLast: parseField(keepLast),
      maxAgeDays: parseField(maxAgeDays),
      maxTotalSizeMb: parseField(maxSizeMb),
    };
    update.mutate(dto, {
      onSuccess: () => toast.success("Retención de manuales guardada"),
      onError: (err) =>
        toast.error(err.message || "No se pudo guardar la retención"),
    });
  }

  return {
    data,
    isLoading,
    isError,
    error,
    enabled,
    setEnabled,
    keepLast,
    setKeepLast,
    maxAgeDays,
    setMaxAgeDays,
    maxSizeMb,
    setMaxSizeMb,
    handleSave,
    isSaving: update.isPending,
  };
}
