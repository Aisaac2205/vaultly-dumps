import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme, __internalReset } from "../useTheme";

/* ── helpers ── */

function makeQuery(matches: boolean): MediaQueryList {
  const listeners = new Set<(ev: MediaQueryListEvent) => void>();
  return {
    matches,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_type: string, fn: (ev: MediaQueryListEvent) => void) => {
      listeners.add(fn);
    }),
    removeEventListener: vi.fn((_type: string, fn: (ev: MediaQueryListEvent) => void) => {
      listeners.delete(fn);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    // expose internal for tests
    _listeners: listeners,
  } as unknown as MediaQueryList;
}

function setMatchMedia(matches: boolean) {
  const mq = makeQuery(matches);
  vi.stubGlobal("matchMedia", vi.fn(() => mq));
  return mq;
}

function clearStorage() {
  localStorage.removeItem("vaultly:theme");
}

beforeEach(() => {
  clearStorage();
  __internalReset();
  // Default: system prefers light
  setMatchMedia(false);
});

/* ── tests ── */

describe("useTheme", () => {
  it("returns 'system' as default theme when no localStorage", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light"); // prefers-color-scheme: light
  });

  it("resolves to dark when system prefers dark and theme is 'system'", () => {
    setMatchMedia(true);
    __internalReset(); // reset after changing matchMedia so ensureQuery picks up the new mock
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("setTheme('dark') updates state and adds data-theme on <html>", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("setTheme('light') updates state and removes data-theme from <html>", () => {
    // Start from dark
    localStorage.setItem("vaultly:theme", "dark");
    __internalReset();
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("toggleTheme cycles light → dark → system → light", () => {
    // Start from light
    localStorage.setItem("vaultly:theme", "light");
    __internalReset();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("system");
    // resolved depends on system pref — light in this test
    expect(result.current.resolvedTheme).toBe("light");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });

  it("persists theme preference in localStorage", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(localStorage.getItem("vaultly:theme")).toBe("dark");
  });

  it("survives remount by reading from localStorage", () => {
    localStorage.setItem("vaultly:theme", "dark");
    __internalReset();
    const { result: first } = renderHook(() => useTheme());
    expect(first.current.theme).toBe("dark");

    // Unmount and remount (simulated by new renderHook — but module state
    // persists, so we reset to test fresh init from localStorage)
    __internalReset();
    const { result: second } = renderHook(() => useTheme());
    expect(second.current.theme).toBe("dark");
    expect(second.current.resolvedTheme).toBe("dark");
  });

  it("reacts to system preference change when theme is 'system'", () => {
    const mq = setMatchMedia(false); // light by default
    __internalReset();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
    expect(result.current.resolvedTheme).toBe("light");

    // Simulate OS switching to dark mode
    act(() => {
      (mq as unknown as { _listeners: Set<(ev: MediaQueryListEvent) => void> })._listeners.forEach(
        (fn) => fn({ matches: true } as MediaQueryListEvent),
      );
    });
    expect(result.current.resolvedTheme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("does NOT react to system preference change when theme is explicit", () => {
    const mq = setMatchMedia(false);
    localStorage.setItem("vaultly:theme", "dark");
    __internalReset();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");

    // Simulate OS switching to light mode — should NOT change
    act(() => {
      (mq as unknown as { _listeners: Set<(ev: MediaQueryListEvent) => void> })._listeners.forEach(
        (fn) => fn({ matches: false } as MediaQueryListEvent),
      );
    });
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("applies data-theme to document.documentElement, not body", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("dark"));
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.body.hasAttribute("data-theme")).toBe(false);
  });

  it("setTheme and toggleTheme are stable across rerenders", () => {
    const { result, rerender } = renderHook(() => useTheme());
    const firstSet = result.current.setTheme;
    const firstToggle = result.current.toggleTheme;

    rerender();
    expect(result.current.setTheme).toBe(firstSet);
    expect(result.current.toggleTheme).toBe(firstToggle);
  });

  it("ignores invalid localStorage values", () => {
    localStorage.setItem("vaultly:theme", "INVALID");
    __internalReset();
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("system");
  });
});
