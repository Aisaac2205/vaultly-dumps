import { Alert, AlertDescription } from "@/shared/ui/alert";
import { AlertTriangle } from "lucide-react";

interface FailureAlertBannerProps {
  failedCount: number;
}

export function FailureAlertBanner({ failedCount }: FailureAlertBannerProps) {
  if (failedCount === 0) return null;

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        {failedCount} backup{failedCount > 1 ? "s" : ""} fallido
        {failedCount > 1 ? "s" : ""} en los últimos 7 días. Revisá los logs
        para más detalles.
      </AlertDescription>
    </Alert>
  );
}
