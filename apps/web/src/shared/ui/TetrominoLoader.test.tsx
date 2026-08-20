import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TetrominoLoader, GlobalLoadingOverlay } from "./TetrominoLoader";

describe("TetrominoLoader", () => {
  it("renders with status role and aria-live polite for accessibility", () => {
    render(<TetrominoLoader label="Cargando..." sublabel="Por favor espere" />);

    const statusEl = screen.getByRole("status");
    expect(statusEl).toBeInTheDocument();
    expect(statusEl).toHaveAttribute("aria-live", "polite");
    expect(statusEl).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Cargando...")).toBeInTheDocument();
    expect(screen.getByText("Por favor espere")).toBeInTheDocument();
  });

  it("renders 4 tetromino boxes", () => {
    const { container } = render(<TetrominoLoader size="md" />);
    const boxes = container.querySelectorAll(".tetromino");
    expect(boxes).toHaveLength(4);
  });
});

describe("GlobalLoadingOverlay", () => {
  it("does not render when open is false", () => {
    render(<GlobalLoadingOverlay open={false} label="Cargando..." />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders dead-centered overlay when open is true", () => {
    render(<GlobalLoadingOverlay open={true} label="Cargando respaldo..." />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Cargando respaldo...")).toBeInTheDocument();
  });
});
