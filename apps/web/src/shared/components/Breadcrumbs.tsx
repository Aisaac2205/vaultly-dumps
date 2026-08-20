import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation("common");
  const segments = pathname.split("/").filter(Boolean);

  const segmentLabel = (segment: string): string => {
    const key = `nav.${segment}` as const;
    const translated = t(key, { defaultValue: "" });
    return translated || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const isRoot = segments.length === 0;

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex items-center gap-1.5 text-sm", className)}>
      {isRoot ? (
        <span className="font-medium text-sidebar-text">{t("nav.dashboard")}</span>
      ) : (
        <Link to="/" className="text-sidebar-text/60 hover:text-sidebar-text transition-colors">
          {t("nav.dashboard")}
        </Link>
      )}

      {segments.map((segment, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-sidebar-text/40" aria-hidden="true" />
            {isLast ? (
              <span className="font-medium text-sidebar-text">{segmentLabel(segment)}</span>
            ) : (
              <Link
                to={path}
                className="text-sidebar-text/60 hover:text-sidebar-text transition-colors"
              >
                {segmentLabel(segment)}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
