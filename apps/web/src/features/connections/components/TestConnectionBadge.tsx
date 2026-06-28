import type { ConnectionTestResult } from "../types";
import { Badge, BadgeDot } from "@/shared/ui/badge";
import { useTranslation } from "react-i18next";

interface TestConnectionBadgeProps {
  result: ConnectionTestResult | null;
  isLoading: boolean;
}

export default function TestConnectionBadge({
  result,
  isLoading,
}: TestConnectionBadgeProps) {
  const { t } = useTranslation("connections");

  if (isLoading) {
    return (
      <Badge variant="outline" className="text-text-secondary">
        <BadgeDot tone="info" pulse />
        {t("test.testing")}
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
        {t("test.connected")} · <span className="font-mono">{result.latencyMs}ms</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-text-secondary">
      <BadgeDot tone="error" />
      {t("test.error", { message: result.error ?? t("error.generic") })}
    </Badge>
  );
}
