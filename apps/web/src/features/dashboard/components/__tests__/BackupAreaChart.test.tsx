import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BackupAreaChart } from "../BackupAreaChart";

describe("BackupAreaChart", () => {
  const sampleData = [
    { date: "2026-06-01", scheduled: 5, manual: 2 },
    { date: "2026-06-02", scheduled: 3, manual: 1 },
  ];

  it("renders chart with CSS variable colors via ChartContainer", () => {
    render(<BackupAreaChart data={sampleData} />);

    // The ChartContainer renders and injects CSS variables for chart colors.
    // Verify it renders without crashing and the description mentions both types.
    const description = screen.getByText(/Programados vs manuales/);
    expect(description).toBeInTheDocument();

    // The chartConfig uses var(--color-chart-scheduled) instead of hardcoded hex.
    // We verify this by checking the ChartContainer's style prop, which maps
    // chartConfig colors into CSS custom properties.
    const chartContainer = document.querySelector("[style*='--color-chart-scheduled']");
    expect(chartContainer).toBeTruthy();
  });

  it("renders empty state when no data matches time range", () => {
    const oldData = [
      { date: "2025-01-01", scheduled: 1, manual: 0 },
    ];

    render(<BackupAreaChart data={oldData} />);

    expect(screen.getByText(/No hay datos/i)).toBeInTheDocument();
  });

  it("renders time range toggle buttons", () => {
    render(<BackupAreaChart data={sampleData} />);

    expect(screen.getByText("7 días")).toBeInTheDocument();
    expect(screen.getByText("30 días")).toBeInTheDocument();
    expect(screen.getByText("3 meses")).toBeInTheDocument();
  });
});
