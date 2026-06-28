import { Skeleton } from "@/shared/ui/skeleton";
import { useTranslation } from "react-i18next";

export function RouteFallback() {
  const { t } = useTranslation("common");
  return (
    <div
      role="status"
      aria-label={t("route.loading")}
      aria-live="polite"
      className="space-y-5 p-4 sm:p-6 lg:p-8"
    >
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
