import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders with unchecked state by default", () => {
    render(<Switch id="test-switch" aria-label="Toggle feature" />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).not.toBeChecked();
    expect(switchEl).toHaveAttribute("aria-checked", "false");
  });

  it("renders with checked state when checked is true", () => {
    render(<Switch id="test-switch" checked={true} aria-label="Toggle feature" />);
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeChecked();
    expect(switchEl).toHaveAttribute("aria-checked", "true");
  });

  it("calls onCheckedChange when clicked", () => {
    const handleCheckedChange = vi.fn();
    render(
      <Switch
        id="test-switch"
        checked={false}
        onCheckedChange={handleCheckedChange}
        aria-label="Toggle feature"
      />,
    );
    const switchEl = screen.getByRole("switch");
    fireEvent.click(switchEl);
    expect(handleCheckedChange).toHaveBeenCalledWith(true);
  });

  it("disables switch when disabled prop is true", () => {
    const handleCheckedChange = vi.fn();
    render(
      <Switch
        id="test-switch"
        disabled={true}
        onCheckedChange={handleCheckedChange}
        aria-label="Toggle feature"
      />,
    );
    const switchEl = screen.getByRole("switch");
    expect(switchEl).toBeDisabled();
    fireEvent.click(switchEl);
    expect(handleCheckedChange).not.toHaveBeenCalled();
  });
});
