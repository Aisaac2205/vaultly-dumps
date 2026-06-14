import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FadeIn } from "./FadeIn";

describe("FadeIn", () => {
  it("renders children", () => {
    render(
      <FadeIn>
        <span>Hello</span>
      </FadeIn>,
    );

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies className to wrapper", () => {
    render(
      <FadeIn className="test-class">
        <span>Content</span>
      </FadeIn>,
    );

    const wrapper = screen.getByText("Content").parentElement;
    expect(wrapper).toHaveClass("test-class");
  });
});
