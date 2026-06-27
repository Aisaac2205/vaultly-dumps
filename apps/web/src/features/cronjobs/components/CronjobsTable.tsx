import type { Cronjob } from "../types";
import { formatDateTimeShort as formatDate } from "@/lib/format";
import { useTranslation } from "react-i18next";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import { useConnections } from "@/features/connections/hooks/useConnections";
import { DataTable, type Column } from "@/shared/ui/data-table";
import { ToggleLeft, ToggleRight, Ellipsis, Clock } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

interface CronjobsTableProps {
  cronjobs: Cronjob[];
  isLoading: boolean;
  onEdit: (cronjob: Cronjob) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  toggleLoading: Record<string, boolean>;
}

function CronjobsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Clock className="h-8 w-8 mb-3 text-muted-foreground/50" />
      <p className="text-sm font-medium text-foreground">
        No hay cronjobs configurados
      </p>
      <p className="text-xs mt-1">
        Creá tu primer cronjob para programar respaldos automáticos.
      </p>
    </div>
  );
}

export default function CronjobsTable({
  cronjobs,
  isLoading,
  onEdit,
  onDelete,
  onToggle,
  toggleLoading,
}: CronjobsTableProps) {
  const { t } = useTranslation('cronjobs')
  const { data: connections } = useConnections();
  const resolveEnv = (connectionId: string): string | undefined =>
    connections?.find((c) => c.id === connectionId)?.environment;

  const columns: Column<Cronjob>[] = [
    {
      header: t('column.name'),
      accessor: (cronjob) => (
        <span className="font-medium">{cronjob.name}</span>
      ),
    },
    {
      header: t('column.connection'),
      accessor: (cronjob) => (
        <ConnectionLabel
          id={cronjob.connectionId}
          name={cronjob.connectionName}
        />
      ),
    },
    {
      header: t('column.environment'),
      accessor: (cronjob) => {
        const env = resolveEnv(cronjob.connectionId);
        return env ? (
          <span className="text-muted-foreground font-mono text-xs uppercase">
            {env}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      header: t('column.cronExpression'),
      accessor: (cronjob) => (
        <span className="font-mono text-xs whitespace-nowrap">
          {cronjob.cronExpression}
        </span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: t('column.nextRun'),
      accessor: (cronjob) => (
        <span className="font-mono text-xs whitespace-nowrap">
          {formatDate(cronjob.nextRunAt)}
        </span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: t('column.lastStatus'),
      accessor: (cronjob) =>
        cronjob.lastStatus ? (
          <StatusBadge status={cronjob.lastStatus} />
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        ),
    },
    {
      header: t('column.active'),
      accessor: (cronjob) => {
        const isToggling = toggleLoading[cronjob.id] ?? false;
        return (
          <button
            type="button"
            role="switch"
            aria-checked={cronjob.isActive}
            aria-label={
              cronjob.isActive ? t('toggle.deactivate') : t('toggle.activate')
            }
            disabled={isToggling}
            onClick={() => onToggle(cronjob.id)}
            className="rounded-md text-muted-foreground transition-transform duration-[160ms] ease-out active:scale-[0.97] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cronjob.isActive ? (
              <ToggleRight className="h-5 w-5 text-primary" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
        );
      },
    },
    {
      header: t('column.actions'),
      accessor: (cronjob) => (
        <>
          {/* Desktop: full button row */}
          <div className="hidden sm:flex items-center justify-center gap-2 whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(cronjob)}
            >
              {t('action.edit')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(cronjob.id)}
            >
              {t('action.delete')}
            </Button>
          </div>

          {/* Mobile: dropdown menu */}
          <div className="sm:hidden flex items-center justify-center">
            <DropdownMenuPrimitive.Root>
              <DropdownMenuPrimitive.Trigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t('column.actions')}
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
              </DropdownMenuPrimitive.Trigger>
              <DropdownMenuPrimitive.Portal>
                <DropdownMenuPrimitive.Content
                  className="z-50 min-w-[8rem] rounded-md border bg-background p-1 shadow-md"
                  align="end"
                >
                  <DropdownMenuPrimitive.Item
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    onSelect={() => onEdit(cronjob)}
                  >
                    {t('action.edit')}
                  </DropdownMenuPrimitive.Item>
                  <DropdownMenuPrimitive.Item
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                    onSelect={() => onDelete(cronjob.id)}
                  >
                    {t('action.delete')}
                  </DropdownMenuPrimitive.Item>
                </DropdownMenuPrimitive.Content>
              </DropdownMenuPrimitive.Portal>
            </DropdownMenuPrimitive.Root>
          </div>
        </>
      ),
    },
  ];

  if (!isLoading && cronjobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-8 w-8 mb-3 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">{t('empty.title')}</p>
        <p className="text-xs mt-1">{t('empty.description')}</p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={cronjobs}
      loading={isLoading}
      className="rounded-xl bg-card shadow-sm overflow-hidden"
    />
  );
}
