import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useDumps, useProdConnections } from "./hooks";
import { dumpsApi } from "./api/dumps-api";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { DumpsStats } from "./components/DumpsStats";
import { DumpsTable } from "./components/DumpsTable";
import DumpsFilters from "./components/DumpsFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { CleanupForm } from "@/features/cleanup/components/CleanupForm";
import { ManualRetentionSettings } from "@/features/cleanup/components/ManualRetentionSettings";
import { StoragePanel } from "@/features/cleanup/components/StoragePanel";
import { DbHygienePanel } from "@/features/cleanup/components/DbHygienePanel";
import type { DumpsFilters as DumpsFiltersType } from "./types";

export default function Dumps() {
  const {
    dumps,
    total,
    filters,
    isLoading: dumpsLoading,
    error: dumpsError,
    applyFilters,
    resetFilters,
    refetch,
  } = useDumps();
  const { data: connections = [], isLoading: connectionsLoading } =
    useProdConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [backupError, setBackupError] = useState<string | null>(null);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

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
    (filters: DumpsFiltersType) => {
      applyFilters(filters);
    },
    [applyFilters],
  );

  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
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

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Listado</TabsTrigger>
          <TabsTrigger value="cleanup">Limpieza</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <DumpsFilters
            filters={filters}
            connections={connections}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
          />
          <DumpsStats dumps={dumps} />
          <DumpsTable dumps={dumps} isLoading={false} total={total} />
        </TabsContent>

        <TabsContent value="cleanup" className="space-y-4">
          <StoragePanel />
          <CleanupForm />
          <ManualRetentionSettings />
          <DbHygienePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
