import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrendIndicator } from "./trend-indicator";

describe("TrendIndicator", () => {
  it("renders up direction with ArrowUp, success color, and +15% display", () => {
    render(<TrendIndicator value={0.15} />);

    // Text content includes arrow (rendered as SVG icon) and "+15%"
    expect(screen.getByText("+15%")).toBeInTheDocument();

    // The container span should have success classes
    const span = screen.getByText("+15%").closest("span")!;
    expect(span.className).toContain("text-success");
  });

  it("renders down direction with ArrowDown, error color, and -45% display", () => {
    render(<TrendIndicator value={-0.45} />);

    expect(screen.getByText("-45%")).toBeInTheDocument();

    const span = screen.getByText("-45%").closest("span")!;
    expect(span.className).toContain("text-error");
  });

  it("renders neutral (value=0) with Minus icon and muted color", () => {
    render(<TrendIndicator value={0} />);

    // value=0 falls into the |v| < 0.1 branch → toFixed(1) → "0.0%"
    expect(screen.getByText("0.0%")).toBeInTheDocument();

    const span = screen.getByText("0.0%").closest("span")!;
    expect(span.className).toContain("text-muted-foreground");
    expect(span.className).toContain("bg-muted");
  });

  it('renders raw value with sign when format="number"', () => {
    render(<TrendIndicator value={120} format="number" />);

    expect(screen.getByText("+120")).toBeInTheDocument();

    render(<TrendIndicator value={-45} format="number" />);

    expect(screen.getByText("-45")).toBeInTheDocument();
  });

  it("swaps color when inverted=true (up = error, down = success)", () => {
    // inverted: up is "bad" → error color
    const { container: upC } = render(
      <TrendIndicator value={0.15} inverted={true} />,
    );
    const upSpan = upC.querySelector("span")!;
    expect(upSpan.className).toContain("text-error");

    // inverted: down is "good" → success color
    const { container: downC } = render(
      <TrendIndicator value={-0.15} inverted={true} />,
    );
    const downSpan = downC.querySelector("span")!;
    expect(downSpan.className).toContain("text-success");
  });

  it('applies "sm" size classes by default and "md" when requested', () => {
    // Default = sm
    const { unmount } = render(<TrendIndicator value={0.15} />);
    const smSpan = screen.getByText("+15%").closest("span")!;
    expect(smSpan.className).toContain("text-xs");
    expect(smSpan.className).toContain("px-1.5");
    expect(smSpan.className).toContain("py-0.5");
    unmount();

    // size="md"
    render(<TrendIndicator value={0.15} size="md" />);
    const mdSpan = screen.getByText("+15%").closest("span")!;
    expect(mdSpan.className).toContain("text-sm");
    expect(mdSpan.className).toContain("px-2");
    expect(mdSpan.className).toContain("py-1");
  });

  it("merges custom className with default classes", () => {
    render(<TrendIndicator value={0.05} className="my-custom ml-2" />);

    const span = screen.getByText("+5.0%").closest("span")!;
    expect(span.className).toContain("my-custom");
    expect(span.className).toContain("ml-2");
    // Still has base classes
    expect(span.className).toContain("inline-flex");
    expect(span.className).toContain("rounded-md");
  });

  it("does not add '+' prefix for negative values in percent format", () => {
    render(<TrendIndicator value={-0.15} />);

    const span = screen.getByText("-15%").closest("span")!;
    // Should NOT contain "+" anywhere in the span text
    expect(span.textContent).not.toContain("+");
  });
});
