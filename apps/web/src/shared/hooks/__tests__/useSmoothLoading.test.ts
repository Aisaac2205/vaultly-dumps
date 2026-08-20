import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSmoothLoading } from "../useSmoothLoading";

describe("useSmoothLoading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false initially when isLoading is false", () => {
    const { result } = renderHook(() => useSmoothLoading(false));
    expect(result.current).toBe(false);
  });

  it("returns true immediately when isLoading is true", () => {
    const { result } = renderHook(() => useSmoothLoading(true));
    expect(result.current).toBe(true);
  });

  it("keeps loading true for at least minDuration when query finishes quickly", () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useSmoothLoading(loading, { minDuration: 300 }),
      { initialProps: { loading: true } },
    );

    expect(result.current).toBe(true);

    // Fast resolution at 50ms
    act(() => {
      vi.advanceTimersByTime(50);
    });
    rerender({ loading: false });

    // Should STILL be true at 100ms
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(true);

    // After 300ms total, flips to false smoothly
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current).toBe(false);
  });

  it("flips to false immediately if query took longer than minDuration", () => {
    const { result, rerender } = renderHook(
      ({ loading }) => useSmoothLoading(loading, { minDuration: 300 }),
      { initialProps: { loading: true } },
    );

    // Slow operation taking 1000ms
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(true);

    rerender({ loading: false });
    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(result.current).toBe(false);
  });
});
