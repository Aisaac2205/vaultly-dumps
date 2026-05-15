import { useQuery } from "@tanstack/react-query";
import { dumpsApi } from "../api/dumps-api";

export function useProdConnections() {
  return useQuery({
    queryKey: ["dumps", "connections", "prod"],
    queryFn: () =>
      dumpsApi.getConnections().then((cs) =>
        Array.isArray(cs) ? cs.filter((c) => c.environment === "prod") : [],
      ),
    refetchInterval: 60_000,
  });
}
