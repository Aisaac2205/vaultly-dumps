import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditDetailPage from "../AuditDetailPage";
import type { AuditLog } from "../types";

const base: AuditLog = {
  id: "log-1",
  action: "DELETE /connections/abc",
  userId: "user-1",
  username: "admin@example.com",
  resourceType: "ConnectionsController",
  resourceId: "abc",
  environment: "prod",
  createdAt: "2026-08-29T10:00:00Z",
  outcome: "success",
  severity: "low",
};

const current: { log: AuditLog } = { log: base };

vi.mock("../../../shared/lib/api-client", () => ({
  default: {
    get: vi.fn(async () => ({ data: current.log })),
  },
}));

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/audit/log-1"]}>
        <Routes>
          <Route path="/audit/:id" element={<AuditDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuditDetailPage metadata", () => {
  it("hides the metadata section when every captured field is empty", async () => {
    // A DELETE carries no body, and mutations rarely carry a query string,
    // so the interceptor stores {body:{}, query:{}}. Rendering those as
    // fields shows the reader two empty boxes and calls them data.
    current.log = { ...base, metadata: { body: {}, query: {} } };
    renderDetail();

    await screen.findByText("DELETE /connections/abc");
    expect(screen.queryByText(/metadatos|metadata/i)).not.toBeInTheDocument();
  });

  it("shows only the fields that actually carry something", async () => {
    current.log = {
      ...base,
      action: "POST /connections",
      metadata: { body: { name: "erp-prod" }, query: {} },
    };
    renderDetail();

    expect(await screen.findByText(/erp-prod/)).toBeInTheDocument();
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(screen.queryByText("query")).not.toBeInTheDocument();
  });
});
