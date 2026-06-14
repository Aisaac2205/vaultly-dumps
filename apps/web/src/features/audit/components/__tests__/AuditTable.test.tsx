import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuditTable from "../AuditTable";
import type { AuditLog } from "../../types";

// Mock useConnections for ConnectionLabel usage inside ResourceCell
vi.mock("@/features/connections/hooks/useConnections", () => ({
  useConnections: () => ({
    data: [
      { id: "conn-1", name: "Dev DB", environment: "dev" },
      { id: "backup-1", name: "Daily Backup", environment: "prod" },
    ],
    isLoading: false,
  }),
}));

const mockLogs: AuditLog[] = [
  {
    id: "log-1",
    action: "backup.created",
    userId: "user-1",
    username: "admin",
    resourceType: "backup",
    resourceId: "backup-1",
    environment: "prod",
    createdAt: "2026-06-13T10:00:00Z",
    metadata: { name: "Daily Backup" },
  },
  {
    id: "log-2",
    action: "connection.updated",
    userId: "user-2",
    username: "dev1",
    resourceType: "connection",
    resourceId: "conn-1",
    environment: "dev",
    createdAt: "2026-06-13T11:00:00Z",
    metadata: { connectionName: "Dev DB" },
  },
  {
    id: "log-3",
    action: "restore.completed",
    userId: "user-1",
    username: "admin",
    resourceType: "restore",
    resourceId: "restore-1",
    environment: "sqa",
    createdAt: "2026-06-13T12:00:00Z",
  },
];

describe("AuditTable", () => {
  function renderTable(logs = mockLogs, isLoading = false) {
    return render(
      <MemoryRouter>
        <AuditTable logs={logs} isLoading={isLoading} total={logs.length} />
      </MemoryRouter>,
    );
  }

  it("renders Entorno column header", () => {
    renderTable();
    expect(screen.getByText("Entorno")).toBeInTheDocument();
  });

  it("renders environment as plain text (lowercase, CSS uppercase)", () => {
    renderTable();

    // The environment text is stored lowercase, displayed uppercase via CSS
    expect(screen.getByText("prod")).toBeInTheDocument();
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.getByText("sqa")).toBeInTheDocument();

    // EnvironmentBadge was previously used — verify no badge-specific classes
    const badges = document.querySelectorAll(".border-destructive\\/40");
    expect(badges.length).toBe(0);
  });

  it("uses muted-foreground and font-mono styling for environment text", () => {
    renderTable();

    const prodElement = screen.getByText("prod");
    expect(prodElement.classList.contains("text-muted-foreground")).toBe(true);
    expect(prodElement.classList.contains("font-mono")).toBe(true);
  });

  it("shows connection resources with ConnectionLabel", () => {
    renderTable();

    // ConnectionLabel renders the name (without inline badge)
    expect(screen.getByText("Dev DB")).toBeInTheDocument();
  });

  it("renders metadata cell with expandable details", () => {
    renderTable();

    // "Ver metadata" button for logs with metadata
    const metadataButtons = screen.getAllByText("Ver metadata");
    expect(metadataButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("renders empty state when no logs", () => {
    render(
      <MemoryRouter>
        <AuditTable logs={[]} isLoading={false} total={0} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No hay registros/i)).toBeInTheDocument();
  });
});
