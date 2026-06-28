import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filters } from "@/shared/ui/filters";
import type { AuditFilters } from "../types";

interface AuditFiltersProps {
  filters: AuditFilters;
  onApply: (filters: AuditFilters) => void;
  onReset: () => void;
}

const ENV_OPTIONS = [
  { value: "prod", label: "prod" },
  { value: "dev", label: "dev" },
  { value: "qa", label: "qa" },
];

const RESOURCE_OPTIONS = [
  { value: "backup", label: "backup" },
  { value: "restore", label: "restore" },
  { value: "connection", label: "connection" },
  { value: "cronjob", label: "cronjob" },
];

function filtersToRecord(f: AuditFilters): Record<string, string> {
  const r: Record<string, string> = {};
  if (f.userId) r.userId = f.userId;
  if (f.username) r.username = f.username;
  if (f.environment) r.environment = f.environment;
  if (f.resourceType) r.resourceType = f.resourceType;
  if (f.from) r.from = f.from;
  if (f.to) r.to = f.to;
  return r;
}

function recordToFilters(r: Record<string, string>): AuditFilters {
  return {
    userId: r.userId || undefined,
    username: r.username || undefined,
    environment: r.environment || undefined,
    resourceType: r.resourceType || undefined,
    from: r.from || undefined,
    to: r.to || undefined,
  };
}

export default function AuditFilters({
  filters,
  onApply,
  onReset,
}: AuditFiltersProps) {
  const { t } = useTranslation("audit");

  const handleFiltersChange = useCallback(
    (next: Record<string, string>) => {
      const converted = recordToFilters(next);
      if (Object.keys(next).length === 0) {
        onReset();
      } else {
        onApply(converted);
      }
    },
    [onApply, onReset],
  );

  return (
    <Filters.Root
      filters={filtersToRecord(filters)}
      onFiltersChange={handleFiltersChange}
    >
      <div className="flex flex-wrap items-center gap-3">
        <Filters.Trigger />
        <Filters.ActiveChips className="flex-1" />
      </div>
      <Filters.Popover>
        <Filters.Search
          filterKey="username"
          label={t("filter.user")}
          placeholder={t("filter.userPlaceholder")}
        />
        <Filters.Select
          filterKey="environment"
          label={t("filter.environment")}
          options={ENV_OPTIONS}
          placeholder={t("filter.all")}
        />
        <Filters.Select
          filterKey="resourceType"
          label={t("filter.resource")}
          options={RESOURCE_OPTIONS}
          placeholder={t("filter.all")}
        />
        <Filters.DateRange filterKey="from" label={t("filter.from")} />
        <Filters.DateRange filterKey="to" label={t("filter.to")} />
      </Filters.Popover>
    </Filters.Root>
  );
}
