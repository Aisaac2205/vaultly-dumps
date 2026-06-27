import { Check, Loader2 } from "lucide-react";
import type { EnrichedR2Object } from "@/features/dumps/types";
import { cn } from "@/shared/lib/cn";
import { formatSize } from "@/shared/lib/format";
import { formatDateTimeShort as formatDate } from "@/lib/format";
import postgresSvg from "@/shared/assets/PostgresSQL.svg";
import mysqlSvg from "@/shared/assets/MySQL.svg";

const DB_LOGOS: Record<string, string> = {
  postgres: postgresSvg as string,
  mysql: mysqlSvg as string,
};

const DB_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
};

interface DumpsListProps {
  dumps: EnrichedR2Object[];
  value: EnrichedR2Object | null;
  onChange: (dump: EnrichedR2Object) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export function DumpsList({
  dumps,
  value,
  onChange,
  loading = false,
  disabled = false,
  label = "Volcados disponibles",
}: DumpsListProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando volcados...
      </div>
    );
  }

  if (dumps.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl bg-muted/30 px-3 py-3 text-sm text-muted-foreground"
      >
        No hay volcados para esta combinación.
      </div>
    );
  }

  return (
    <ul
      aria-label={label}
      className="flex max-h-72 flex-col gap-1 overflow-auto rounded-xl bg-muted/20 p-1"
    >
      {dumps.map((dump) => {
        const isSelected = value?.key === dump.key;
        const logo = dump.dbType ? DB_LOGOS[dump.dbType] : undefined;
        const dbLabel = dump.dbType
          ? DB_LABELS[dump.dbType] ?? dump.dbType
          : "DB";
        return (
          <li key={dump.key}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-label={`Volcado ${dbLabel} ${dump.timestamp} (${formatSize(dump.size)})`}
              disabled={disabled}
              onClick={() => onChange(dump)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Check
                className={cn(
                  "size-4 shrink-0",
                  isSelected ? "opacity-100" : "opacity-0",
                )}
              />
              {logo && (
                <img
                  src={logo}
                  alt={dbLabel}
                  className="size-4 shrink-0"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-mono text-xs">
                  {dump.timestamp}
                </span>
                <span
                  className={cn(
                    "truncate text-[11px]",
                    isSelected
                      ? "text-accent-foreground/75"
                      : "text-foreground/55",
                  )}
                >
                  {formatDate(dump.lastModified)}
                </span>
              </div>
              <span
                className={cn(
                  "ml-auto w-20 shrink-0 text-right font-mono text-xs",
                  isSelected
                    ? "text-accent-foreground/75"
                    : "text-foreground/55",
                )}
              >
                {formatSize(dump.size)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
