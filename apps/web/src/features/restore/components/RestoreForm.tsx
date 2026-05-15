import { useState, useMemo } from "react";
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
import { FileText } from "lucide-react";

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

  const canSimulate = targetConnectionId !== "";
  const hasConnections = compatibleConnections.length > 0;
  const selectedConnection = useMemo(
    () => compatibleConnections.find((c) => c.id === targetConnectionId),
    [compatibleConnections, targetConnectionId],
  );

  function handleSimulate() {
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
    if (!targetConnectionId) return;
    const confirmed = window.confirm(
      "¿Estás seguro de que querés ejecutar un restore REAL? Esta operación modificará los datos en la base de datos destino.",
    );
    if (!confirmed) return;
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
            description="Filtrá por base de datos y frecuencia para encontrar el volcado"
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
            title="Dump de R2"
            description="Selecciona el dump que deseas restaurar"
            icon={<img src={cloudflareSvg} alt="Cloudflare R2" className="h-4 w-4" />}
          >
            <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-2.5">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {backupInfo?.connectionName ?? "Backup"}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {backupInfo?.date && <span>{backupInfo.date}</span>}
                  {backupInfo?.fileSizeMb != null && (
                    <span>• {backupInfo.fileSizeMb.toFixed(1)} MB</span>
                  )}
                </div>
              </div>
              {effectiveDbType && (
                <Badge variant="outline" className="shrink-0 rounded-full text-[10px] uppercase">
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
          description="Selecciona la conexión donde se restaurará el backup"
        >
          <div className="space-y-2.5">
            {!hasConnections && !connectionsLoading ? (
              <div className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                {effectiveDbType
                  ? `No hay conexiones ${DB_LABELS[effectiveDbType] ?? effectiveDbType} disponibles`
                  : "No hay conexiones disponibles"}
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
