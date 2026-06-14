import { useLocation, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const ROUTE_LABELS: Record<string, string> = {
  dumps: "Dumps",
  cleanup: "Limpieza",
  restore: "Restaurar",
  cronjobs: "Cronjobs",
  connections: "Conexiones",
  users: "Usuarios",
  audit: "Auditoría",
};

function segmentLabel(segment: string): string {
  return ROUTE_LABELS[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1);
}

interface BreadcrumbsProps {
  className?: string;
}

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const isRoot = segments.length === 0;

  return (
    <nav aria-label="Breadcrumbs" className={cn("flex items-center gap-1 text-sm", className)}>
      {isRoot ? (
        <span className="font-medium text-foreground">Dashboard</span>
      ) : (
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          Dashboard
        </Link>
      )}

      {segments.map((segment, i) => {
        const path = "/" + segments.slice(0, i + 1).join("/");
        const isLast = i === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {isLast ? (
              <span className="font-medium text-foreground">{segmentLabel(segment)}</span>
            ) : (
              <Link
                to={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
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
