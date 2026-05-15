import type { ConnectionTestResult } from "../types";
import { Badge } from "@/shared/ui/badge";

interface TestConnectionBadgeProps {
  result: ConnectionTestResult | null;
  isLoading: boolean;
}

export default function TestConnectionBadge({
  result,
  isLoading,
}: TestConnectionBadgeProps) {
  if (isLoading) {
    return (
      <Badge
        variant="secondary"
        className="bg-info-bg text-info border-transparent"
      >
        Testeando...
      </Badge>
    );
  }

  if (!result) {
    return null;
  }

  if (result.success) {
    return (
      <Badge
        variant="secondary"
        className="bg-success-bg text-success border-transparent"
      >
        ✓ Conectado —{" "}
        <span className="font-mono">{result.latencyMs}ms</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="bg-error-bg text-error border-transparent"
    >
      ✗ Error: {result.error ?? "Error desconocido"}
    </Badge>
  );
}
