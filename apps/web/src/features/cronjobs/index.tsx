import { useState, useCallback } from "react";
import {
  useCronjobs,
  useCronjobConnections,
  useCreateCronjob,
  useUpdateCronjob,
  useToggleCronjob,
  useDeleteCronjob,
} from "./hooks/useCronjobs";
import CronjobsTable from "./components/CronjobsTable";
import CronjobForm from "./components/CronjobForm";
import { CronjobsStats } from "./components/CronjobsStats";
import {
  CronjobFilters,
  useCronjobFilters,
} from "./components/CronjobFilters";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { EmptyState } from "@/shared/ui/empty-state";
import { CardSkeleton, TableSkeleton } from "@/shared/ui/loading-skeleton";
import { Clock, Plus } from "lucide-react";
import type { Cronjob, CreateCronjobDto, UpdateCronjobDto } from "./types";

export default function Cronjobs() {
  const {
    data: cronjobs = [],
    isLoading: isQueryLoading,
    error: queryError,
  } = useCronjobs();

  const {
    data: connections = [],
    isLoading: connectionsLoading,
  } = useCronjobConnections();

  const createMutation = useCreateCronjob();
  const updateMutation = useUpdateCronjob();
  const toggleMutation = useToggleCronjob();
  const deleteMutation = useDeleteCronjob();

  const [showForm, setShowForm] = useState(false);
  const [editingCronjob, setEditingCronjob] = useState<Cronjob | undefined>(
    undefined,
  );
  const [formLoading, setFormLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<
    Record<string, boolean>
  >({});

  const { filters, setFilters, filtered } = useCronjobFilters(cronjobs);

  const handleNewClick = () => {
    setEditingCronjob(undefined);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCronjob(undefined);
  };

  const handleSubmit = useCallback(
    async (dto: CreateCronjobDto | UpdateCronjobDto) => {
      setFormLoading(true);
      try {
        if (editingCronjob) {
          await updateMutation.mutateAsync({
            id: editingCronjob.id,
            dto: dto as UpdateCronjobDto,
          });
        } else {
          await createMutation.mutateAsync(dto as CreateCronjobDto);
        }
        setShowForm(false);
        setEditingCronjob(undefined);
      } catch {
        // Error surfaced via mutation state
      } finally {
        setFormLoading(false);
      }
    },
    [editingCronjob, createMutation, updateMutation],
  );

  const handleEdit = useCallback((cronjob: Cronjob) => {
    setEditingCronjob(cronjob);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      const confirmed = window.confirm(
        "¿Estás seguro de que querés eliminar este cronjob?",
      );
      if (!confirmed) return;

      try {
        await deleteMutation.mutateAsync(id);
      } catch {
        // Error surfaced via mutation state
      }
    },
    [deleteMutation],
  );

  const handleToggle = useCallback(
    async (id: string) => {
      setToggleLoading((prev) => ({ ...prev, [id]: true }));
      try {
        await toggleMutation.mutateAsync(id);
      } catch {
        // Error surfaced via mutation state
      } finally {
        setToggleLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [toggleMutation],
  );

  // ─── Loading state ──────────────────────────────────────

  if (isQueryLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} columns={7} />
      </div>
    );
  }

  // ─── Error state ────────────────────────────────────────

  if (queryError) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <PageHeader title="Cronjobs" />
        <Alert variant="destructive">
          <AlertDescription>
            Error al cargar cronjobs:{" "}
            {queryError instanceof Error
              ? queryError.message
              : "Error desconocido"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ─── Empty state ────────────────────────────────────────

  if (cronjobs.length === 0 && !showForm) {
    return (
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        <PageHeader
          title="Cronjobs"
        />
        <EmptyState
          icon={<Clock className="h-12 w-12" />}
          title="No hay cronjobs configurados"
          description="Creá tu primer cronjob para programar respaldos automáticos."
          action={
            <Button onClick={handleNewClick}>
              <Plus className="h-4 w-4" />
              Nuevo cronjob
            </Button>
          }
        />
      </div>
    );
  }

  // ─── Normal state ───────────────────────────────────────

  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    toggleMutation.error;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-8">
      <PageHeader
        title="Cronjobs"
        actions={
          !showForm ? (
            <Button onClick={handleNewClick}>
              <Plus className="h-4 w-4" />
              Nuevo cronjob
            </Button>
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

      <CronjobsStats
        cronjobs={cronjobs}
        loading={isQueryLoading}
      />

      {showForm && (
        <CronjobForm
          cronjob={editingCronjob}
          connections={connections}
          connectionsLoading={connectionsLoading}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={formLoading}
        />
      )}

      {cronjobs.length > 0 && (
        <CronjobFilters filters={filters} onChange={setFilters} />
      )}

      <CronjobsTable
        cronjobs={filtered}
        isLoading={false}
        onEdit={handleEdit}
        onDelete={(id) => void handleDelete(id)}
        onToggle={(id) => void handleToggle(id)}
        toggleLoading={toggleLoading}
      />
    </div>
  );
}
