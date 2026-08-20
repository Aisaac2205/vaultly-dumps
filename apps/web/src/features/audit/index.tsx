import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/shared/ui/page-header";
import { Alert, AlertDescription } from "@/shared/ui/alert";

import { GlobalLoadingOverlay } from "@/shared/ui/TetrominoLoader";
import { useAudit } from "./hooks/useAudit";
import type { AuditFilters as AuditFiltersType } from "./types";
import AuditFilters from "./components/AuditFilters";
import AuditTable from "./components/AuditTable";

export default function Audit() {
  const { t } = useTranslation('audit')
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
    <>
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
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

      <div>
        <AuditTable
          logs={logs}
          isLoading={isLoading}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>

    <GlobalLoadingOverlay open={isLoading} label={t('loading', { defaultValue: 'Cargando auditoría...' })} />
  </>
  );
}
