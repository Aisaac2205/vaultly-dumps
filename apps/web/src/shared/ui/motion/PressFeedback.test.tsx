import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PressFeedback } from "./PressFeedback";

describe("PressFeedback", () => {
  it("renders children in wrapper div", () => {
    render(
      <PressFeedback>
        <button>Click</button>
      </PressFeedback>,
    );

    expect(screen.getByRole("button", { name: "Click" })).toBeInTheDocument();
  });

  it("renders children directly when asChild is true", () => {
    render(
      <PressFeedback asChild>
        <button>Direct</button>
      </PressFeedback>,
    );

    expect(screen.getByRole("button", { name: "Direct" })).toBeInTheDocument();
  });
});
