import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stagger, StaggerItem } from "./Stagger";

describe("Stagger", () => {
  it("renders all children", () => {
    render(
      <Stagger>
        <StaggerItem>
          <span>A</span>
        </StaggerItem>
        <StaggerItem>
          <span>B</span>
        </StaggerItem>
        <StaggerItem>
          <span>C</span>
        </StaggerItem>
      </Stagger>,
    );

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("renders when StaggerItem is used alone", () => {
    render(
      <StaggerItem>
        <span>Solo</span>
      </StaggerItem>,
    );

    expect(screen.getByText("Solo")).toBeInTheDocument();
  });
});
