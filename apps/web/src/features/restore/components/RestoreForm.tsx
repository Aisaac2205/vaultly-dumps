import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import type { RestoreDto, Connection } from "../types";
import type { EnrichedR2Object } from "@/features/dumps/types";
import { ConnectionSelector } from "./ConnectionSelector";
import { ConnectionDetails } from "./ConnectionDetails";
import { R2DumpPicker } from "./R2DumpPicker";
import { RestoreFormSection } from "./RestoreFormSection";
import { RestoreOptions } from "./RestoreOptions";
import { RestoreActions } from "./RestoreActions";
import { Badge } from "@/shared/ui/badge";
import cloudflareSvg from "@/shared/assets/Cloudflare.svg";
import postgresSvg from "@/shared/assets/PostgresSQL.svg";
import mysqlSvg from "@/shared/assets/MySQL.svg";
import { FileText, ArrowRight } from "lucide-react";

interface BackupInfo {
  connectionName?: string;
  environment?: string;
  date?: string;
  fileSizeMb?: number | null;
}

interface RestoreFormProps {
  sourceBackupId?: string;
  dbType?: "postgres" | "mysql" | null;
  backupInfo?: BackupInfo;
  selectedR2Dump?: EnrichedR2Object | null;
  onR2DumpChange?: (dump: EnrichedR2Object | null) => void;
  onDryRun: (dto: RestoreDto) => void;
  onRestore: (dto: RestoreDto) => void;
  isLoading: boolean;
  connections: Connection[];
  connectionsLoading: boolean;
  sourceConnections: Connection[];
  sourceConnectionsLoading?: boolean;
}

const DB_LABELS: Record<string, string> = {
  postgres: "PostgreSQL",
  mysql: "MySQL",
};

const DB_LOGOS: Record<string, string> = {
  postgres: postgresSvg as string,
  mysql: mysqlSvg as string,
};

export function RestoreForm({
  sourceBackupId,
  dbType,
  backupInfo,
  selectedR2Dump,
  onR2DumpChange,
  onDryRun,
  onRestore,
  isLoading,
  connections,
  connectionsLoading,
  sourceConnections,
  sourceConnectionsLoading = false,
}: RestoreFormProps) {
  const [targetConnectionId, setTargetConnectionId] = useState("");
  const [isDryRun, setIsDryRun] = useState(true);

  const effectiveDbType = selectedR2Dump?.dbType ?? dbType ?? null;
  const hasSource = !!sourceBackupId || !!selectedR2Dump;
  const showR2Selector = !sourceBackupId;

  const compatibleConnections = useMemo(() => {
    if (!effectiveDbType) return connections;
    return connections.filter((c) => c.dbType === effectiveDbType);
  }, [connections, effectiveDbType]);

  const canSimulate = targetConnectionId !== "" && hasSource;
  const hasConnections = compatibleConnections.length > 0;
  const selectedConnection = useMemo(
    () => compatibleConnections.find((c) => c.id === targetConnectionId),
    [compatibleConnections, targetConnectionId],
  );

  function handleSimulate() {
    if (!hasSource) {
      toast.warning("Seleccioná un dump antes de simular el restore");
      return;
    }
    if (!canSimulate) return;
    const dto: RestoreDto = {
      sourceBackupId: selectedR2Dump ? undefined : (sourceBackupId ?? ""),
      r2Key: selectedR2Dump?.key,
      targetConnectionId,
      isDryRun: true,
    };
    onDryRun(dto);
  }

  function handleExecute() {
    if (!hasSource) {
      toast.warning("Seleccioná un dump antes de restaurar");
      return;
    }
    if (!targetConnectionId) return;
    const dto: RestoreDto = {
      sourceBackupId: selectedR2Dump ? undefined : (sourceBackupId ?? ""),
      r2Key: selectedR2Dump?.key,
      targetConnectionId,
      isDryRun: false,
    };
    onRestore(dto);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable sections */}
      <div className="flex-1 space-y-4 overflow-auto">
        {/* Section 1: R2 Dump or Backup Info */}
        {showR2Selector ? (
          <RestoreFormSection
            number={1}
            title="Dump de R2"
            icon={<img src={cloudflareSvg} alt="Cloudflare R2" className="h-4 w-4" />}
          >
            <R2DumpPicker
              value={selectedR2Dump ?? null}
              onChange={onR2DumpChange ?? (() => {})}
              connections={sourceConnections}
              connectionsLoading={sourceConnectionsLoading}
              disabled={isLoading}
            />
          </RestoreFormSection>
        ) : (
          <RestoreFormSection
            number={1}
            title="Dump seleccionado"
            icon={
              effectiveDbType && DB_LOGOS[effectiveDbType] ? (
                <img
                  src={DB_LOGOS[effectiveDbType]}
                  alt={DB_LABELS[effectiveDbType] ?? effectiveDbType}
                  className="h-4 w-4"
                />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )
            }
          >
            <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
              {effectiveDbType && DB_LOGOS[effectiveDbType] ? (
                <img
                  src={DB_LOGOS[effectiveDbType]}
                  alt={DB_LABELS[effectiveDbType] ?? effectiveDbType}
                  className="h-6 w-6 shrink-0"
                />
              ) : (
                <FileText className="h-6 w-6 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  title={backupInfo?.connectionName}
                >
                  {backupInfo?.connectionName ?? "Backup"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {backupInfo?.environment && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      {backupInfo.environment}
                    </span>
                  )}
                  {backupInfo?.date && <span>{backupInfo.date}</span>}
                  {backupInfo?.fileSizeMb != null && (
                    <span>· {backupInfo.fileSizeMb.toFixed(1)} MB</span>
                  )}
                </div>
              </div>
              {effectiveDbType && (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full text-[10px] uppercase"
                >
                  {DB_LABELS[effectiveDbType] ?? effectiveDbType}
                </Badge>
              )}
            </div>
          </RestoreFormSection>
        )}

        {/* Section 2: Connection */}
        <RestoreFormSection
          number={showR2Selector ? 2 : 1}
          title="Conexión destino"
        >
          <div className="space-y-2.5">
            {!hasConnections && !connectionsLoading ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">
                  {effectiveDbType
                    ? `No hay conexiones ${DB_LABELS[effectiveDbType] ?? effectiveDbType} disponibles`
                    : "No hay conexiones disponibles"}
                </span>
                <Link
                  to="/connections"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Crear conexión
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <ConnectionSelector
                connections={compatibleConnections}
                value={targetConnectionId}
                onChange={setTargetConnectionId}
                disabled={connectionsLoading || isLoading}
                loading={connectionsLoading}
              />
            )}

            {selectedConnection && (
              <ConnectionDetails connection={selectedConnection} isActive />
            )}
          </div>
        </RestoreFormSection>

        {/* Section 3: Options */}
        <RestoreFormSection
          number={showR2Selector ? 3 : 2}
          title="Opciones"
        >
          <RestoreOptions
            isDryRun={isDryRun}
            onDryRunChange={setIsDryRun}
            disabled={isLoading}
          />
        </RestoreFormSection>
      </div>

      {/* Sticky actions at bottom */}
      <div className="sticky bottom-0 -mx-0.5 mt-4 bg-background pt-3">
        <RestoreActions
          canSimulate={canSimulate}
          canExecute={!!targetConnectionId}
          isLoading={isLoading}
          onSimulate={handleSimulate}
          onExecute={handleExecute}
        />
      </div>
    </div>
  );
}
