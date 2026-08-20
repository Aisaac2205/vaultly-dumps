import { render, screen, act, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LoadingProvider } from "../LoadingProvider";
import { useGlobalLoading } from "@/shared/hooks/useGlobalLoading";

function TestConsumer() {
  const { show, hide, withLoading } = useGlobalLoading();
  return (
    <div>
      <button onClick={() => show({ message: "Operación global...", size: "md" })}>
        Show Loader
      </button>
      <button onClick={hide}>Hide Loader</button>
      <button
        onClick={() =>
          void withLoading(async () => {
            await new Promise((r) => setTimeout(r, 10));
          }, "Procesando...")
        }
      >
        Run With Loading
      </button>
    </div>
  );
}

describe("LoadingProvider", () => {
  it("provides global loading controls to consumers", async () => {
    render(
      <LoadingProvider>
        <TestConsumer />
      </LoadingProvider>,
    );

    expect(screen.queryByText("Operación global...")).not.toBeInTheDocument();

    act(() => {
      screen.getByText("Show Loader").click();
    });

    expect(screen.getByText("Operación global...")).toBeInTheDocument();

    act(() => {
      screen.getByText("Hide Loader").click();
    });

    await waitFor(() => {
      expect(screen.queryByText("Operación global...")).not.toBeInTheDocument();
    });
  });
});
