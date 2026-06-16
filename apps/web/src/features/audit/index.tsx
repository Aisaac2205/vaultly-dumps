import { useCallback } from "react";
import { PageHeader } from "@/shared/ui/page-header";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { useAudit } from "./hooks/useAudit";
import type { AuditFilters as AuditFiltersType } from "./types";
import AuditFilters from "./components/AuditFilters";
import AuditTable from "./components/AuditTable";

export default function Audit() {
  const {
    logs,
    total,
    page,
    pageSize,
    isLoading,
    error,
    filters,
    setPage,
    applyFilters,
    resetFilters,
  } = useAudit();

  const handleApply = useCallback(
    (filters: AuditFiltersType) => {
      applyFilters(filters);
    },
    [applyFilters],
  );

  const handleReset = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  return (
    <FadeIn className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Auditoría"
        subtitle="Registro de actividades del sistema"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message}
          </AlertDescription>
        </Alert>
      )}

      <AuditFilters
        filters={filters}
        onApply={handleApply}
        onReset={handleReset}
      />

      <FadeIn delay={0.1}>
        <AuditTable
          logs={logs}
          isLoading={isLoading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </FadeIn>
    </FadeIn>
  );
}
