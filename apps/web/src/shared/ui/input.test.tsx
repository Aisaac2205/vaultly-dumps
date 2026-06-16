import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  it("renders with the given type", () => {
    render(<Input type="email" placeholder="hola@ejemplo.com" />);
    const input = screen.getByPlaceholderText("hola@ejemplo.com");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "email");
  });

  it("forwards refs to the underlying input element", () => {
    let refValue: HTMLInputElement | null = null;
    render(
      <Input
        ref={(el) => {
          refValue = el;
        }}
      />,
    );
    expect(refValue).toBeInstanceOf(HTMLInputElement);
  });

  it("applies destructive border when invalid prop is true", () => {
    render(<Input invalid placeholder="x" />);
    const input = screen.getByPlaceholderText("x");
    expect(input.className).toContain("border-destructive");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when not invalid", () => {
    render(<Input placeholder="x" />);
    const input = screen.getByPlaceholderText("x");
    expect(input).not.toHaveAttribute("aria-invalid");
  });
});
