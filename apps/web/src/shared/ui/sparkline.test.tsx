import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "./sparkline";

describe("Sparkline", () => {
  it("renders an SVG with 2+ data points", () => {
    render(<Sparkline data={[10, 20, 15, 30, 25]} />);

    const svg = screen.getByRole("img", { name: "Sparkline" });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe("svg");

    // Contains at least one <path> for the line
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it("returns null with fewer than 2 data points", () => {
    const { container } = render(
      <div data-testid="wrapper">
        <Sparkline data={[5]} />
      </div>,
    );

    // 0 data points
    const { container: c0 } = render(
      <div data-testid="w0">
        <Sparkline data={[]} />
      </div>,
    );

    expect(container.querySelector("svg")).toBeNull();
    expect(c0.querySelector("svg")).toBeNull();
  });

  it("renders a path that spans from min to max with linear data", () => {
    render(<Sparkline data={[0, 50, 100]} width={80} height={24} />);

    const svg = screen.getByRole("img", { name: "Sparkline" });
    const paths = svg.querySelectorAll("path");

    // The line path: first point y ≈ 24 (value 0 → bottom), last point y ≈ 0 (value 100 → top)
    const linePath = paths[paths.length - 1]; // last <path> is the line
    const d = linePath.getAttribute("d") ?? "";

    // First point: M0,24.00 (value 0, range 0-100, normalized → y=24-((0-0)/100)*24 = 24)
    expect(d).toContain("M0.00,24.00");

    // Last point: L80.00,0.00 (value 100, normalized → y=24-((100-0)/100)*24 = 0)
    expect(d).toContain("L80.00,0.00");
  });

  it("handles constant data (all same value) without NaN", () => {
    render(<Sparkline data={[42, 42, 42, 42]} />);

    const svg = screen.getByRole("img", { name: "Sparkline" });
    const paths = svg.querySelectorAll("path");
    const d = paths[paths.length - 1].getAttribute("d") ?? "";

    // When all values are the same, range = 0 which is clamped to 1.
    // Normalized value: (v - min)/1 = 0, so y = height (24) — all points at the bottom.
    // No NaN should appear in the path.
    expect(d).not.toContain("NaN");

    // All Y values should be at the bottom: 24.00
    // The path should be: M0.00,24.00 L26.67,24.00 L53.33,24.00 L80.00,24.00
    expect(d).toContain("24.00");
  });

  it("applies custom width and height", () => {
    render(
      <Sparkline data={[1, 2, 3, 4, 5]} width={120} height={32} />,
    );

    const svg = screen.getByRole("img", { name: "Sparkline" });
    expect(svg.getAttribute("width")).toBe("120");
    expect(svg.getAttribute("height")).toBe("32");
    expect(svg.getAttribute("viewBox")).toBe("0 0 120 32");
  });

  it("sets aria-label on the SVG", () => {
    render(
      <Sparkline data={[1, 2, 3]} aria-label="Weekly revenue trend" />,
    );

    expect(
      screen.getByRole("img", { name: "Weekly revenue trend" }),
    ).toBeInTheDocument();
  });
});
