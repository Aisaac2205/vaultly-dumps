import type { ConnectionTestResult } from "../types";
import { Badge, BadgeDot } from "@/shared/ui/badge";

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
      <Badge variant="outline" className="text-text-secondary">
        <BadgeDot tone="info" pulse />
        Testeando...
      </Badge>
    );
  }

  if (!result) {
    return null;
  }

  if (result.success) {
    return (
      <Badge variant="outline" className="text-text-secondary">
        <BadgeDot tone="success" />
        Conectado · <span className="font-mono">{result.latencyMs}ms</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeDot tone="error" />
      Error: {result.error ?? "Error desconocido"}
    </Badge>
  );
}
