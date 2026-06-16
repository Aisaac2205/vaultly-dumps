import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAudit } from "./useAudit";
import type { AuditLog } from "../types";
import apiClient from "../../../shared/lib/api-client";

vi.mock("../../../shared/lib/api-client");

const mockApiClient = vi.mocked(apiClient);

const mockLog: AuditLog = {
  id: "1",
  userId: "user-1",
  username: "admin",
  environment: "prod",
  resourceType: "backup",
  resourceId: "b1",
  action: "backup.created",
  createdAt: "2024-01-15T10:00:00Z",
  metadata: { backupId: "b1" },
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

describe("useAudit", () => {
  beforeEach(() => {
    mockApiClient.get.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should extract data from PaginatedResponseDto wrapper", async () => {
    mockApiClient.get.mockResolvedValueOnce({
      data: {
        data: [mockLog],
        total: 1,
        page: 1,
        pageSize: 10,
      },
    });

    const { result } = renderHook(() => useAudit(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.logs).toHaveLength(1);
    expect(result.current.total).toBe(1);
    expect(result.current.logs[0].id).toBe("1");
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

    const { result } = renderHook(() => useAudit(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.logs).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });
});
