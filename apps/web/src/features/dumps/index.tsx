import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useDumps, useProdConnections } from "./hooks";
import { dumpsApi } from "./api/dumps-api";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/shared/ui/pagination";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { DumpsStats } from "./components/DumpsStats";
import { DumpsTable } from "./components/DumpsTable";
import DumpsFilters from "./components/DumpsFilters";
import type { DumpsFilters as DumpsFiltersType } from "./types";

const DEFAULT_PAGE_SIZE = 25;

export default function Dumps() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [filters, setFilters] = useState<DumpsFiltersType>({});

  const {
    data: dumps,
    total,
    isLoading: dumpsLoading,
    error: dumpsError,
    refetch,
  } = useDumps({ page, pageSize, filters });

  const { data: connections = [], isLoading: connectionsLoading } =
    useProdConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleCreateBackup = async () => {
    if (!selectedConnectionId) return;

    const confirmed = window.confirm(
      "¿Estás seguro de que querés crear un nuevo backup?",
    );

    if (!confirmed) return;

    setIsCreatingBackup(true);
    setBackupError(null);

    try {
      await dumpsApi.triggerBackup(selectedConnectionId);
      toast.success("Backup creado correctamente");
      await refetch();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al crear el backup";
      setBackupError(message);
      toast.error("Error al crear el backup", { description: message });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleApplyFilters = useCallback(
    (newFilters: DumpsFiltersType) => {
      setPage(1); // Reset to first page when filters change
      setFilters(newFilters);
    },
    [],
  );

  const handleResetFilters = useCallback(() => {
    setPage(1);
    setFilters({});
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const isLoading = dumpsLoading || connectionsLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <FadeIn className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Dumps"
        actions={
          <div className="flex items-center gap-3">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={selectedConnectionId}
              onChange={(e) => setSelectedConnectionId(e.target.value)}
              disabled={isCreatingBackup}
            >
              <option value="">
                {connections.length === 0
                  ? "Sin conexiones PROD"
                  : "Seleccioná una conexión"}
              </option>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.dbType})
                </option>
              ))}
            </select>
            <Button
              onClick={() => void handleCreateBackup()}
              disabled={isCreatingBackup || !selectedConnectionId}
            >
              {isCreatingBackup ? "Creando..." : "Nuevo backup"}
            </Button>
          </div>
        }
      />

      {(dumpsError || backupError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {backupError ?? dumpsError?.message ?? "Error desconocido"}
          </AlertDescription>
        </Alert>
      )}

      <DumpsFilters
        filters={filters}
        connections={connections}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <DumpsStats dumps={dumps} />
      <DumpsTable
        dumps={dumps}
        isLoading={dumpsLoading}
        total={total}
        page={page}
        pageSize={pageSize}
        pagination={
          totalPages > 1 ? (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1,
                  )
                  .map((p, idx, arr) => {
                    const items: React.ReactNode[] = [];
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      items.push(
                        <PaginationItem key={`ellipsis-${p}`}>
                          <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
                            ...
                          </span>
                        </PaginationItem>,
                      );
                    }
                    items.push(
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === page}
                          onClick={() => handlePageChange(p)}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>,
                    );
                    return items;
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, page + 1))
                    }
                    disabled={page >= totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : undefined
        }
      />
    </FadeIn>
  );
}
