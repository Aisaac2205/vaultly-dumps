import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PaginatedDumps } from "../types";
import { useDumps } from "./useDumps";

const mockGetHistory = vi.fn();

vi.mock("../api/dumps-api", () => ({
  dumpsApi: {
    getHistory: (...args: unknown[]) => mockGetHistory(...args),
    triggerBackup: vi.fn(),
    getDownloadUrl: vi.fn(),
    getConnections: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  // eslint-disable-next-line react-refresh/only-export-components
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useDumps", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls getHistory with page and pageSize", async () => {
    const mockData: PaginatedDumps = {
      data: [{ id: "j-1", connectionId: "c-1", connectionName: "DB Prod", environment: "prod", dbType: "postgres", status: "completed", fileKey: "dump.sql", fileSizeMb: 42, startedAt: "2026-01-01T00:00:00Z", completedAt: "2026-01-01T00:05:00Z", errorMessage: null, triggeredBy: "manual", createdAt: "2026-01-01T00:00:00Z" }],
      total: 50,
      page: 1,
      pageSize: 25,
    };
    mockGetHistory.mockResolvedValueOnce(mockData);

    const { result } = renderHook(
      () => useDumps({ page: 1, pageSize: 25, filters: {} }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetHistory).toHaveBeenCalledWith({ page: 1, pageSize: 25 });
    expect(result.current.data).toEqual(mockData.data);
    expect(result.current.total).toBe(50);
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(25);
  });

  it("passes filters to getHistory when active", async () => {
    const mockData: PaginatedDumps = { data: [], total: 0, page: 1, pageSize: 10 };
    mockGetHistory.mockResolvedValueOnce(mockData);

    renderHook(
      () =>
        useDumps({
          page: 2,
          pageSize: 10,
          filters: { status: "completed", environment: "prod" },
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalled();
    });

    expect(mockGetHistory).toHaveBeenCalledWith({
      page: 2,
      pageSize: 10,
      filters: { status: "completed", environment: "prod" },
    });
  });

  it("omits filters param when all filters are empty", async () => {
    const mockData: PaginatedDumps = { data: [], total: 0, page: 3, pageSize: 50 };
    mockGetHistory.mockResolvedValueOnce(mockData);

    renderHook(
      () => useDumps({ page: 3, pageSize: 50, filters: {} }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalled();
    });

    expect(mockGetHistory).toHaveBeenCalledWith({ page: 3, pageSize: 50 });
  });

  it("returns empty data when response has no records", async () => {
    const emptyData: PaginatedDumps = { data: [], total: 0, page: 1, pageSize: 25 };
    mockGetHistory.mockResolvedValueOnce(emptyData);

    const { result } = renderHook(
      () => useDumps({ page: 1, pageSize: 25, filters: {} }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it("includes filters in queryKey for cache isolation", async () => {
    const mockData: PaginatedDumps = { data: [], total: 0, page: 1, pageSize: 25 };
    mockGetHistory.mockResolvedValue(mockData);

    const { rerender } = renderHook(
      ({ page, pageSize, filters }: { page: number; pageSize: number; filters: Record<string, string> }) =>
        useDumps({ page, pageSize, filters }),
      {
        wrapper: createWrapper(),
        initialProps: { page: 1, pageSize: 25, filters: {} },
      },
    );

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledTimes(1);
    });

    // Change filters — should trigger a new query
    rerender({ page: 1, pageSize: 25, filters: { status: "failed" } });

    await waitFor(() => {
      expect(mockGetHistory).toHaveBeenCalledTimes(2);
    });
  });
});
