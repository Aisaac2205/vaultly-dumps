import { Link } from "react-router-dom";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import type { BackupJob } from "../types";
import { formatRelativeTime } from "../lib/format";

interface FailureAlertBannerProps {
  failedCount: number;
  recentBackups: BackupJob[];
}

export function FailureAlertBanner({
  failedCount,
  recentBackups,
}: FailureAlertBannerProps) {
  if (failedCount === 0) return null;

  // Latest failed backup for context. recentBackups is sorted newest-first.
  const lastFailed = recentBackups.find((b) => b.status === "failed") ?? null;

  return (
    <FadeIn>
      <Alert variant="destructive" role="alert">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <AlertTitle>
              {failedCount} backup{failedCount > 1 ? "s" : ""} fallido
              {failedCount > 1 ? "s" : ""} en los últimos 7 días
            </AlertTitle>
            <AlertDescription>
              {lastFailed ? (
                <>
                  Último: {formatRelativeTime(lastFailed.createdAt)} en{" "}
                  <span className="font-medium text-text-primary">
                    {lastFailed.connectionName}
                  </span>
                </>
              ) : (
                <>Revisá los logs para más detalles.</>
              )}
            </AlertDescription>
          </div>
          <Link
            to="/dumps?status=failed"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "shrink-0",
            )}
          >
            Ver fallos
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </Alert>
    </FadeIn>
  );
}
