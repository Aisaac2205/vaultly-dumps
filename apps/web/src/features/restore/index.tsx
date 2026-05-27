import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  useRestore,
  useConnections,
  useSourceConnections,
  useRestoreHistory,
} from "./hooks";
import { dumpsApi } from "@/features/dumps/api/dumps-api";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Card, CardContent } from "@/shared/ui/card";
import { RestoreForm } from "./components/RestoreForm";
import { DryRunResult } from "./components/DryRunResult";
import { RestoreProgress } from "./components/RestoreProgress";
import { RestoreHistory } from "./components/RestoreHistory";
import { ConfirmRestoreDialog } from "./components/ConfirmRestoreDialog";
import { formatDate } from "@/features/dumps/lib/format";
import { PageHeader } from "@/shared/ui/page-header";
import type { RestoreDto } from "./types";
import type { EnrichedR2Object } from "@/features/dumps/types";

const DB_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
};

interface NavState {
  sourceBackupId?: string;
  dbType?: "postgres" | "mysql" | null;
}

export default function Restore() {
  const location = useLocation();
  const navState = (location.state as NavState | null) ?? {};
  const sourceBackupIdFromNav = navState.sourceBackupId;
  const dbTypeFromNav = navState.dbType;

  const {
    state,
    dryRunResult,
    restoreJob,
    finalStatus,
    isLoading: restoreLoading,
    error: restoreError,
    executeDryRun,
    confirmRestore,
    reset,
  } = useRestore();

  const {
    data: connections = [],
    isLoading: connectionsLoading,
    error: connectionsError,
  } = useConnections();

  const {
    data: sourceConnections = [],
    isLoading: sourceConnectionsLoading,
  } = useSourceConnections();

  const {
    data: restoreHistory = [],
    isLoading: historyLoading,
  } = useRestoreHistory();

  const [currentDto, setCurrentDto] = useState<RestoreDto | null>(null);
  const [selectedR2Dump, setSelectedR2Dump] =
    useState<EnrichedR2Object | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const dryRunResultRef = useRef<HTMLDivElement | null>(null);

  const pendingTarget = currentDto
    ? connections.find((c) => c.id === currentDto.targetConnectionId)
    : undefined;

  useEffect(() => {
    if (state === "dry-run" && dryRunResult && dryRunResultRef.current) {
      dryRunResultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [state, dryRunResult]);

  const { data: backupDetail } = useQuery({
    queryKey: ["backups", sourceBackupIdFromNav],
    queryFn: () =>
      sourceBackupIdFromNav
        ? dumpsApi.getBackupById(sourceBackupIdFromNav)
        : null,
    enabled: !!sourceBackupIdFromNav,
    staleTime: 60_000,
  });

  const backupInfo = backupDetail
    ? {
        connectionName: backupDetail.connectionName,
        environment: backupDetail.environment,
        date: backupDetail.createdAt
          ? formatDate(backupDetail.createdAt)
          : undefined,
        fileSizeMb: backupDetail.fileSizeMb,
      }
    : undefined;

  function handleDryRun(dto: RestoreDto) {
    setCurrentDto(dto);
    void executeDryRun(dto);
  }

  function handleDirectRestore(dto: RestoreDto) {
    setCurrentDto(dto);
    setConfirmDialogOpen(true);
  }

  function handleConfirm() {
    if (!currentDto) return;
    setConfirmDialogOpen(true);
  }

  function handleConfirmedRestore() {
    if (!currentDto) return;
    setConfirmDialogOpen(false);
    void confirmRestore({ ...currentDto, isDryRun: false });
  }

  function handleCancel() {
    setCurrentDto(null);
    reset();
  }

  function handleBackToHome() {
    reset();
  }

  function handleRetry() {
    reset();
  }

  const displayError = restoreError ?? (connectionsError?.message ?? null);

  function progressStatus(): "running" | "completed" | "failed" {
    if (state === "done") {
      return finalStatus === "completed" ? "completed" : "failed";
    }
    return "running";
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Restaurar"
        subtitle={state === "dry-run" ? "Revisa los cambios y confirma para restaurar el dump en el destino." : undefined}
      />

      {displayError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {state === "idle" && (
        <div className="grid gap-5 lg:grid-cols-5 lg:items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-full rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <CardContent className="flex h-full flex-col p-5">
                <RestoreForm
                  sourceBackupId={sourceBackupIdFromNav}
                  dbType={dbTypeFromNav}
                  backupInfo={backupInfo}
                  selectedR2Dump={selectedR2Dump}
                  onR2DumpChange={setSelectedR2Dump}
                  onDryRun={handleDryRun}
                  onRestore={handleDirectRestore}
                  isLoading={restoreLoading}
                  connections={connections}
                  connectionsLoading={connectionsLoading}
                  sourceConnections={sourceConnections}
                  sourceConnectionsLoading={sourceConnectionsLoading}
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <RestoreHistory jobs={restoreHistory} connections={connections} isLoading={historyLoading} />
          </div>
        </div>
      )}

      {state === "dry-run" && dryRunResult && (
        <div ref={dryRunResultRef} className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center scroll-mt-6">
          <div className="w-full max-w-6xl">
            <Card className="rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <CardContent className="p-5 sm:p-6">
                <DryRunResult
                  result={dryRunResult}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  isLoading={restoreLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {state === "running" && restoreJob && (
        <div className="mx-auto max-w-lg">
          <Card className="rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <RestoreProgress
                jobId={restoreJob.id}
                status={progressStatus()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmRestoreDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        targetName={pendingTarget?.name ?? "—"}
        targetEnvironment={pendingTarget?.environment}
        targetDbType={
          pendingTarget?.dbType
            ? (DB_LABELS[pendingTarget.dbType] ?? pendingTarget.dbType)
            : undefined
        }
        isLoading={restoreLoading}
        onConfirm={handleConfirmedRestore}
      />

      {state === "done" && (
        <div className="mx-auto max-w-lg">
          <Card className="rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <div className="space-y-4">
                {finalStatus === "completed" ? (
                  <Alert className="rounded-xl border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400">
                    <AlertDescription>
                      El restore se completó exitosamente
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert
                    variant="destructive"
                    className="rounded-xl"
                  >
                    <AlertDescription>El restore falló</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3">
                  {finalStatus === "failed" && (
                    <Button onClick={handleRetry} variant="ghost" className="text-red-500 hover:bg-red-500/10 hover:text-red-600">
                      Reintentar
                    </Button>
                  )}
                  <Button onClick={handleBackToHome} variant="default">
                    Volver al inicio
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
