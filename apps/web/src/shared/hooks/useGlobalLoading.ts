import { useContext } from "react";
import {
  LoadingContext,
  type LoadingContextValue,
} from "@/shared/providers/LoadingContext";

export function useGlobalLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a LoadingProvider");
  }
  return context;
}

export type {
  LoadingOptions,
  LoadingState,
  LoadingContextValue,
} from "@/shared/providers/LoadingContext";
