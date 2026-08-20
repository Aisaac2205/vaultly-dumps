import { createContext } from "react";
import type { TetrominoSize } from "@/shared/ui/TetrominoLoader";

export interface LoadingOptions {
  message?: string;
  sublabel?: string;
  size?: TetrominoSize;
}

export interface LoadingState extends LoadingOptions {
  active: boolean;
}

export interface LoadingContextValue {
  state: LoadingState;
  show: (options?: string | LoadingOptions) => void;
  hide: () => void;
  withLoading: <T>(
    promiseFn: () => Promise<T>,
    options?: string | LoadingOptions,
  ) => Promise<T>;
}

export const LoadingContext = createContext<LoadingContextValue | null>(null);
