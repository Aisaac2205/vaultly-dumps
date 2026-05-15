import { useState } from "react";
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
import { formatDate } from "@/features/dumps/lib/format";
import { ChevronRight, Database } from "lucide-react";
import type { RestoreDto } from "./types";
import type { EnrichedR2Object } from "@/features/dumps/types";

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
    void confirmRestore({ ...dto, isDryRun: false });
  }

  function handleConfirm() {
    if (!currentDto) return;
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
    <div className="mx-auto max-w-7xl space-y-5 p-6 lg:p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Restaurar</span>
        <ChevronRight className="h-3 w-3" />
        <span className="inline-flex items-center gap-1 text-foreground font-medium">
          <Database className="h-3 w-3" />
          PostgreSQL
        </span>
      </nav>

      {/* Title + Description */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Restaurar backup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restaura dumps desde Cloudflare R2 hacia una conexión destino en segundos.
        </p>
      </div>

      {displayError && (
        <Alert variant="destructive" className="rounded-xl">
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {state === "idle" && (
        <div className="grid gap-5 lg:grid-cols-5 lg:items-stretch">
          <div className="lg:col-span-2">
            <Card className="h-full rounded-3xl border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
            <Card className="flex h-full flex-col rounded-3xl border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <CardContent className="flex flex-1 flex-col p-5">
                <RestoreHistory jobs={restoreHistory} isLoading={historyLoading} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {state === "dry-run" && dryRunResult && (
        <div className="mx-auto max-w-3xl">
          <Card className="rounded-3xl border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <DryRunResult
                result={dryRunResult}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                isLoading={restoreLoading}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {state === "running" && restoreJob && (
        <div className="mx-auto max-w-lg">
          <Card className="rounded-3xl border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <CardContent className="p-5">
              <RestoreProgress
                jobId={restoreJob.id}
                status={progressStatus()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {state === "done" && (
        <div className="mx-auto max-w-lg">
          <Card className="rounded-3xl border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
