import { useCallback } from "react";
import { PageHeader } from "@/shared/ui/page-header";
import { Card, CardContent } from "@/shared/ui/card";
import { useAudit } from "./hooks/useAudit";
import type { AuditFilters as AuditFiltersType } from "./types";
import AuditFilters from "./components/AuditFilters";
import AuditTable from "./components/AuditTable";

export default function Audit() {
  const { logs, total, isLoading, error, applyFilters, resetFilters } =
    useAudit();

  const handleApply = useCallback(
    (filters: AuditFiltersType) => {
      applyFilters(filters);
    },
    [applyFilters],
  );

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  if (error) {
    return (
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader title="Audit" subtitle="Registro de actividades del sistema" />
        <Card className="border-error bg-error/5">
          <CardContent className="pt-6">
            <p className="text-sm text-error">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <PageHeader title="Audit" subtitle="Registro de actividades del sistema" />

      <AuditFilters
        filters={{}}
        onApply={handleApply}
        onReset={handleReset}
      />

      <AuditTable logs={logs} isLoading={isLoading} total={total} />
    </div>
  );
}
