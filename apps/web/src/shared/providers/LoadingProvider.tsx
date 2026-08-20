import {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { GlobalLoadingOverlay } from "@/shared/ui/TetrominoLoader";
import {
  LoadingContext,
  type LoadingState,
  type LoadingOptions,
  type LoadingContextValue,
} from "./LoadingContext";

const DEFAULT_STATE: LoadingState = {
  active: false,
  message: undefined,
  sublabel: undefined,
  size: "md",
};

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadingState>(DEFAULT_STATE);

  const show = useCallback((options?: string | LoadingOptions) => {
    if (typeof options === "string") {
      setState({ active: true, message: options, size: "md" });
    } else {
      setState({
        active: true,
        message: options?.message,
        sublabel: options?.sublabel,
        size: options?.size ?? "md",
      });
    }
  }, []);

  const hide = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const withLoading = useCallback(
    async <T,>(
      promiseFn: () => Promise<T>,
      options?: string | LoadingOptions,
    ): Promise<T> => {
      show(options);
      try {
        return await promiseFn();
      } finally {
        hide();
      }
    },
    [show, hide],
  );

  const value = useMemo<LoadingContextValue>(
    () => ({
      state,
      show,
      hide,
      withLoading,
    }),
    [state, show, hide, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingOverlay
        open={state.active}
        label={state.message}
        sublabel={state.sublabel}
        size={state.size}
      />
    </LoadingContext.Provider>
  );
}
