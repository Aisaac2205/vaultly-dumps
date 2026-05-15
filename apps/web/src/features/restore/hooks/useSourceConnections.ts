import { useQuery } from "@tanstack/react-query";
import { restoreApi } from "../api/restore-api";
import type { Connection } from "../types";

export function useSourceConnections() {
  return useQuery({
    queryKey: ["restore", "source-connections"],
    queryFn: restoreApi.getConnections,
    refetchInterval: 60_000,
    select: (data: Connection[]) =>
      Array.isArray(data) ? data.filter((c) => c.environment === "prod") : [],
  });
}
