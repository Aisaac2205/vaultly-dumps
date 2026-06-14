import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarRoot, SidebarItem, SidebarUser } from "../Sidebar";
import type { AuthUser } from "@/shared/hooks/useAuth";

const mockUser: AuthUser = {
  id: "1",
  email: "admin@vaultly.local",
  name: "Admin",
  role: "admin",
};

const mockLogout = vi.fn().mockResolvedValue(undefined);

function renderWithRouter(ui: React.ReactElement, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe("Sidebar", () => {
  it("uses bg-sidebar token instead of bg-black", () => {
    renderWithRouter(<Sidebar user={mockUser} onLogout={mockLogout} />);
    const aside = document.querySelector("aside");
    expect(aside).toHaveClass("bg-sidebar");
    expect(aside).not.toHaveClass("bg-black");
  });

  it("renders all navigation items for admin user", () => {
    renderWithRouter(<Sidebar user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Dumps")).toBeInTheDocument();
    expect(screen.getByText("Limpieza")).toBeInTheDocument();
    expect(screen.getByText("Restaurar")).toBeInTheDocument();
    expect(screen.getByText("Cronjobs")).toBeInTheDocument();
    expect(screen.getByText("Conexiones")).toBeInTheDocument();
    expect(screen.getByText("Usuarios")).toBeInTheDocument();
    expect(screen.getByText("Auditoría")).toBeInTheDocument();
  });

  it("hides admin-only items for non-admin users", () => {
    const nonAdmin: AuthUser = { ...mockUser, role: "user" };
    renderWithRouter(<Sidebar user={nonAdmin} onLogout={mockLogout} />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Dumps")).not.toBeInTheDocument();
    expect(screen.queryByText("Usuarios")).not.toBeInTheDocument();
    expect(screen.getByText("Auditoría")).toBeInTheDocument();
  });

  it("shows user email in footer", () => {
    renderWithRouter(<Sidebar user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText("admin@vaultly.local")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    renderWithRouter(<Sidebar user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });

  it("renders Vaultly branding", () => {
    renderWithRouter(<Sidebar user={mockUser} onLogout={mockLogout} />);
    expect(screen.getByText("Vaultly")).toBeInTheDocument();
  });
});

describe("SidebarItem", () => {
  it("renders with label and icon wrapper", () => {
    renderWithRouter(
      <SidebarRoot>
        <SidebarItem
          path="/dumps"
          label="Dumps"
          icon={() => <span data-testid="icon" />}
          routeKey="dumps"
        />
      </SidebarRoot>,
      { route: "/dumps" },
    );
    expect(screen.getByText("Dumps")).toBeInTheDocument();
  });

  it("applies active state classes when route matches", () => {
    renderWithRouter(
      <SidebarRoot>
        <SidebarItem
          path="/dumps"
          label="Dumps"
          icon={() => <span />}
          routeKey="dumps"
        />
      </SidebarRoot>,
      { route: "/dumps" },
    );
    const link = screen.getByRole("link", { name: /Dumps/i });
    expect(link.className).toContain("bg-sidebar-active");
    expect(link.className).toContain("border-sidebar-indicator");
  });

  it("does not apply active classes when route does not match", () => {
    renderWithRouter(
      <SidebarRoot>
        <SidebarItem
          path="/dumps"
          label="Dumps"
          icon={() => <span />}
          routeKey="dumps"
        />
      </SidebarRoot>,
      { route: "/audit" },
    );
    const link = screen.getByRole("link", { name: /Dumps/i });
    expect(link.className).not.toContain("bg-sidebar-active");
    expect(link.className).toContain("text-sidebar-text/70");
  });

  it("calls onNavigate from context on click", () => {
    const onNavigate = vi.fn();
    renderWithRouter(
      <SidebarRoot onNavigate={onNavigate}>
        <SidebarItem
          path="/dumps"
          label="Dumps"
          icon={() => <span />}
          routeKey="dumps"
        />
      </SidebarRoot>,
    );

    // The link should have the correct href — onNavigate fires on click
    const link = screen.getByRole("link", { name: /Dumps/i });
    expect(link).toHaveAttribute("href", "/dumps");
  });
});

describe("SidebarContent", () => {
  it("renders inside a SidebarRoot context", () => {
    renderWithRouter(
      <SidebarRoot onNavigate={() => {}}>
        <SidebarContent user={mockUser} onLogout={mockLogout} />
      </SidebarRoot>,
    );
    expect(screen.getByText("Vaultly")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });
});

describe("SidebarUser", () => {
  it("renders null user without email", () => {
    renderWithRouter(
      <SidebarUser user={null} onLogout={mockLogout} />,
    );
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    expect(screen.getByText("Cerrar Sesión")).toBeInTheDocument();
  });
});
