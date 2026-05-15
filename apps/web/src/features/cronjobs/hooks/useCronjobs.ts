import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../shared/lib/api-client";
import type {
  Cronjob,
  Connection,
  CreateCronjobDto,
  UpdateCronjobDto,
} from "../types";

// ─── Queries ───────────────────────────────────────────────

export function useCronjobs() {
  return useQuery({
    queryKey: ["cronjobs"],
    queryFn: async () => {
      const response = await apiClient.get<Cronjob[]>("/cronjobs");
      return Array.isArray(response.data) ? response.data : [];
    },
    refetchInterval: 30_000,
  });
}

export function useCronjobConnections() {
  return useQuery({
    queryKey: ["cronjobs", "connections"],
    queryFn: async () => {
      const response = await apiClient.get<Connection[]>(
        "/connections?environment=prod",
      );
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Mutations ─────────────────────────────────────────────

export function useCreateCronjob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCronjobDto) => {
      const response = await apiClient.post<Cronjob>("/cronjobs", dto);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cronjobs"] });
    },
  });
}

export function useUpdateCronjob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateCronjobDto;
    }) => {
      const response = await apiClient.patch<Cronjob>(
        `/cronjobs/${id}`,
        dto,
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cronjobs"] });
    },
  });
}

export function useToggleCronjob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/cronjobs/${id}/toggle`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cronjobs"] });
    },
  });
}

export function useDeleteCronjob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/cronjobs/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cronjobs"] });
    },
  });
}
