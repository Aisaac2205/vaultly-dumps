import { useState, useCallback } from "react";
import {
  useConnections,
  useCreateConnection,
  useUpdateConnection,
  useDeleteConnection,
  useTestConnection,
  useTestRawConnection,
} from "./hooks/useConnections";
import ConnectionsTable from "./components/ConnectionsTable";
import ConnectionForm from "./components/ConnectionForm";
import { ConnectionsStats } from "./components/ConnectionsStats";
import {
  ConnectionFilters,
  useConnectionFilters,
} from "./components/ConnectionFilters";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { EmptyState } from "@/shared/ui/empty-state";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { Database } from "lucide-react";
import type {
  Connection,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionTestResult,
  TestRawConnectionDto,
} from "./types";

export default function Connections() {
  const {
    data: connections = [],
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useConnections();

  const createMutation = useCreateConnection();
  const updateMutation = useUpdateConnection();
  const deleteMutation = useDeleteConnection();
  const testMutation = useTestConnection();
  const testRawMutation = useTestRawConnection();

  const [showForm, setShowForm] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});

  const { filters, setFilters, filtered } = useConnectionFilters(connections);

  const handleNewClick = () => {
    setEditingConnection(undefined);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConnection(undefined);
  };

  const handleSubmit = useCallback(
    async (dto: CreateConnectionDto | UpdateConnectionDto) => {
      setFormLoading(true);
      try {
        if (editingConnection) {
          await updateMutation.mutateAsync({
            id: editingConnection.id,
            dto: dto as UpdateConnectionDto,
          });
        } else {
          await createMutation.mutateAsync(dto as CreateConnectionDto);
        }
        setShowForm(false);
        setEditingConnection(undefined);
      } catch {
        // Error surfaced via mutation state
      } finally {
        setFormLoading(false);
      }
    },
    [editingConnection, createMutation, updateMutation],
  );

  const handleEdit = useCallback((connection: Connection) => {
    setEditingConnection(connection);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "¿Estás seguro de que querés eliminar esta conexión?",
      );
      if (!confirmed) return;

      try {
        await deleteMutation.mutateAsync(id);
        setTestResults((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        setTestLoading((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      } catch {
        // Error surfaced via mutation state
      }
    },
    [deleteMutation],
  );

  const handleTest = useCallback(
    async (id: string) => {
      setTestLoading((prev) => ({ ...prev, [id]: true }));
      setTestResults((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      try {
        const result = await testMutation.mutateAsync(id);
        setTestResults((prev) => ({ ...prev, [id]: result }));
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [id]: {
            success: false,
            latencyMs: 0,
            error: "Error al ejecutar el test",
          },
        }));
      } finally {
        setTestLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [testMutation],
  );

  const testRaw = useCallback(
    async (dto: TestRawConnectionDto): Promise<ConnectionTestResult> => {
      return testRawMutation.mutateAsync(dto);
    },
    [testRawMutation],
  );

  // ─── Loading state ──────────────────────────────────────

  if (isQueryLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} columns={8} />
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────

  if (queryError) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <PageHeader title="Conexiones" />
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar conexiones:{" "}
            {queryError instanceof Error
              ? queryError.message
              : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────

  if (connections.length === 0 && !showForm) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Conexiones"
        />
        <EmptyState
          icon={<Database className="h-12 w-12" />}
          title="No hay conexiones"
          description="Creá tu primera conexión para empezar a gestionar bases de datos."
          action={
            <Button onClick={handleNewClick}>Nueva conexión</Button>
          }
        />
      </div>
    );
  }

  // ─── Normal state ───────────────────────────────────────

  const mutationError =
    createMutation.error ?? updateMutation.error ?? deleteMutation.error;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <PageHeader
        title="Conexiones"
        actions={
          !showForm ? (
            <Button onClick={handleNewClick}>Nueva conexión</Button>
          ) : undefined
        }
      />

      {mutationError && (
        <Alert variant="destructive">
          <AlertDescription>
            {mutationError instanceof Error
              ? mutationError.message
              : "Error inesperado"}
          </AlertDescription>
        </Alert>
      )}

      <ConnectionsStats
        connections={connections}
        loading={isQueryLoading}
      />

      {showForm && (
        <ConnectionForm
          connection={editingConnection}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={formLoading}
          testRaw={testRaw}
        />
      )}

      {connections.length > 0 && (
        <ConnectionFilters filters={filters} onChange={setFilters} />
      )}

      <ConnectionsTable
        connections={filtered}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={(id) => void handleDelete(id)}
        onTest={(id) => void handleTest(id)}
        testResults={testResults}
        testLoading={testLoading}
      />
    </div>
  );
}
