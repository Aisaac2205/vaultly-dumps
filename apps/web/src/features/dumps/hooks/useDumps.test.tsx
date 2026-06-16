import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useDumps } from "./useDumps";
import type { BackupJob } from "../types";
import apiClient from "../../../shared/lib/api-client";

vi.mock("../../../shared/lib/api-client");

const mockApiClient = vi.mocked(apiClient);

const mockDump: BackupJob = {
  id: "1",
  connectionId: "conn-1",
  environment: "production",
  status: "completed",
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:05:00Z",
  size: 1024,
  path: "/backups/dump1.sql",
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useDumps", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should extract data from PaginatedResponseDto wrapper", async () => {
    // Simula la respuesta real del backend: { data: [...], total: N, page: 1, pageSize: 10 }
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        data: [mockDump],
        total: 1,
        page: 1,
        pageSize: 10,
      },
    });

    const { result } = renderHook(() => useDumps(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.dumps).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.dumps[0].id).toBe("1");
  });

  it("should handle empty paginated response", async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      },
    });

    const { result } = renderHook(() => useDumps(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.dumps).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
