import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Topbar } from "../Topbar";

function renderWithRouter(ui: React.ReactElement, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

describe("Topbar", () => {
  it("renders breadcrumbs", () => {
    renderWithRouter(<Topbar />, { route: "/dumps" });
    expect(screen.getByText("Dumps")).toBeInTheDocument();
  });

  it("renders theme toggle button", () => {
    renderWithRouter(<Topbar />, { route: "/" });
    const themeBtn = screen.getByLabelText("Toggle theme");
    expect(themeBtn).toBeInTheDocument();
  });

  it("renders account placeholder", () => {
    renderWithRouter(<Topbar />, { route: "/" });
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("is hidden on mobile by default (hidden md:flex)", () => {
    renderWithRouter(<Topbar />, { route: "/" });
    const header = document.querySelector("header");
    expect(header).toHaveClass("hidden");
    expect(header).toHaveClass("md:flex");
  });
});
