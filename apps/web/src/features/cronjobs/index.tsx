import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
import { TetrominoLoader } from "@/shared/ui/TetrominoLoader";
import { useSmoothLoading } from "@/shared/hooks/useSmoothLoading";
import { Clock, Plus } from "lucide-react";
import type { Cronjob, CreateCronjobDto, UpdateCronjobDto } from "./types";

export default function Cronjobs() {
  const { t } = useTranslation('cronjobs')
  const {
    data: cronjobs = [],
    isLoading: rawQueryLoading,
    error: queryError,
  } = useCronjobs();

  const isQueryLoading = useSmoothLoading(rawQueryLoading);

  const {
    data: connections = [],
    isLoading: connectionsLoading,
  } = useCronjobConnections();

  const [editingCronjob, setEditingCronjob] = useState<Cronjob | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<Record<string, boolean>>({});

  const { filters, setFilters, filtered } = useCronjobFilters(cronjobs);

  const createMutation = useCreateCronjob();
  const updateMutation = useUpdateCronjob();
  const toggleMutation = useToggleCronjob();
  const deleteMutation = useDeleteCronjob();

  const formLoading = createMutation.isPending || updateMutation.isPending;

  const handleNewClick = useCallback(() => {
    setEditingCronjob(undefined);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((cronjob: Cronjob) => {
    setEditingCronjob(cronjob);
    setShowForm(true);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingCronjob(undefined);
    setShowForm(false);
  }, []);

  const handleSubmit = useCallback(
    async (data: CreateCronjobDto | UpdateCronjobDto) => {
      try {
        if (editingCronjob) {
          await updateMutation.mutateAsync({
            id: editingCronjob.id,
            dto: data as UpdateCronjobDto,
          });
          toast.success(t('toast.updated'));
        } else {
          await createMutation.mutateAsync(data as CreateCronjobDto);
          toast.success(t('toast.created'));
        }
        setShowForm(false);
        setEditingCronjob(undefined);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('toast.error');
        toast.error(message);
      }
    },
    [editingCronjob, createMutation, updateMutation, t],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success(t('toast.deleted'));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('toast.deleteError');
        toast.error(message);
      }
    },
    [deleteMutation, t],
  );

  const handleToggle = useCallback(
    async (id: string) => {
      const cronjob = cronjobs.find((c) => c.id === id);
      if (!cronjob) return;

      const newActive = !cronjob.isActive;
      setToggleLoading((prev) => ({ ...prev, [id]: true }));

      try {
        await toggleMutation.mutateAsync(id);
        toast.success(
          newActive ? t('toast.activated') : t('toast.paused'),
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('toast.statusError');
        toast.error(message);
      } finally {
        setToggleLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [toggleMutation, cronjobs, t],
  );

  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error ??
    toggleMutation.error;

  return (
    <AnimatePresence mode="wait">
      {isQueryLoading ? (
        <motion.div
          key="cronjobs-loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex min-h-[calc(100vh-9rem)] w-full flex-col items-center justify-center p-8"
        >
          <TetrominoLoader size="md" />
        </motion.div>
      ) : queryError ? (
        <motion.div
          key="cronjobs-error"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-8 p-4 sm:p-6 lg:p-8"
        >
          <PageHeader title="Cronjobs" />
          <Alert variant="destructive">
            <AlertDescription>
              {t('error.load', { message: queryError instanceof Error ? queryError.message : t('error.generic', { ns: 'common' }) })}
            </AlertDescription>
          </Alert>
        </motion.div>
      ) : cronjobs.length === 0 && !showForm ? (
        <motion.div
          key="cronjobs-empty"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 p-4 sm:p-6 lg:p-8"
        >
          <PageHeader title="Cronjobs" />
          <EmptyState
            icon={<Clock className="h-12 w-12" />}
            title={t('empty.title')}
            description={t('empty.description')}
            action={
              <Button onClick={handleNewClick}>
                <Plus className="h-4 w-4" />
                {t('action.new')}
              </Button>
            }
          />
        </motion.div>
      ) : (
        <motion.div
          key="cronjobs-content"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8 p-4 sm:p-6 lg:p-8"
        >
          <PageHeader
            title="Cronjobs"
            actions={
              !showForm ? (
                <Button onClick={handleNewClick}>
                  <Plus className="h-4 w-4" />
                  {t('action.new')}
                </Button>
              ) : undefined
            }
          />

          {mutationError && (
            <Alert variant="destructive">
              <AlertDescription>
                {mutationError instanceof Error
                  ? mutationError.message
                  : t('error.unexpected', { ns: 'common' })}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
