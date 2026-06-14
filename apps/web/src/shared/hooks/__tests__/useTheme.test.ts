import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../useTheme";

describe("useTheme", () => {
  it("returns light as default theme", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("exposes toggleTheme as a stable function", () => {
    const { result, rerender } = renderHook(() => useTheme());
    const firstToggle = result.current.toggleTheme;

    rerender();
    expect(result.current.toggleTheme).toBe(firstToggle);
  });

  it("toggleTheme is callable (no-op)", () => {
    const { result } = renderHook(() => useTheme());
    // Should not throw
    expect(() => act(() => { result.current.toggleTheme(); })).not.toThrow();
  });
});
