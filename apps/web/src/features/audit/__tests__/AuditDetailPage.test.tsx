import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuditDetailPage from "../AuditDetailPage";
import type { AuditLog } from "../types";

const signInFailure: AuditLog = {
  id: "log-9",
  action: "auth.sign-in.email",
  userId: "anonymous",
  username: "someone@example.com",
  resourceType: "Auth",
  resourceId: "sign-in/email",
  environment: null,
  createdAt: "2026-08-29T10:00:00Z",
  ipAddress: "203.0.113.7",
  userAgent: "Mozilla/5.0",
  outcome: "failure",
  severity: "medium",
  metadata: { reason: "invalid_credentials" },
};

vi.mock("../../../shared/lib/api-client", () => ({
  default: {
    get: vi.fn(async () => ({ data: signInFailure })),
  },
}));

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/audit/log-9"]}>
        <Routes>
          <Route path="/audit/:id" element={<AuditDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AuditDetailPage", () => {
  it("surfaces the client address that the table had no room for", async () => {
    renderDetail();

    expect(await screen.findByText("203.0.113.7")).toBeInTheDocument();
  });

  it("shows the outcome of the event so a failure is not mistaken for a sign-in", async () => {
    renderDetail();

    expect(await screen.findByTestId("audit-outcome")).toHaveTextContent(
      /failure|fallo/i,
    );
  });

  it("offers a way back to the audit list", async () => {
    renderDetail();

    const back = await screen.findByRole("link", { name: /audit|auditor/i });
    expect(back).toHaveAttribute("href", "/audit");
  });

  it("renders metadata as readable content rather than a raw blob in a cell", async () => {
    renderDetail();

    expect(await screen.findByText("invalid_credentials")).toBeInTheDocument();
  });
});
