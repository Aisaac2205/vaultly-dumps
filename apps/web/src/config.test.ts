import { afterEach, describe, expect, it, vi } from "vitest";

async function loadConfig(apiUrl?: string) {
  vi.resetModules();
  if (apiUrl === undefined) {
    vi.unstubAllEnvs();
  } else {
    vi.stubEnv("VITE_API_URL", apiUrl);
  }
  return import("./config");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("APP_CONFIG", () => {
  it("keeps apiUrl as the bare origin so Better Auth can append its own base path", async () => {
    const { APP_CONFIG } = await loadConfig("https://api.example.com");

    expect(APP_CONFIG.apiUrl).toBe("https://api.example.com");
  });

  it("appends the global /api prefix for domain endpoints", async () => {
    const { APP_CONFIG } = await loadConfig("https://api.example.com");

    expect(APP_CONFIG.apiBaseUrl).toBe("https://api.example.com/api");
  });

  it("produces a same-origin relative base when no api url is configured", async () => {
    const { APP_CONFIG } = await loadConfig("");

    expect(APP_CONFIG.apiUrl).toBe("");
    expect(APP_CONFIG.apiBaseUrl).toBe("/api");
  });

  it("does not double the slash when the configured url has a trailing one", async () => {
    const { APP_CONFIG } = await loadConfig("https://api.example.com/");

    expect(APP_CONFIG.apiBaseUrl).toBe("https://api.example.com/api");
  });
});
