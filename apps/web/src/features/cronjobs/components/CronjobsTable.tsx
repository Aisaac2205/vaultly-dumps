import type { Cronjob } from "../types";
import { formatDate } from "../lib/format";
import { StatusBadge } from "@/shared/ui/status-badge";
import { Button } from "@/shared/ui/button";
import { ConnectionLabel } from "@/shared/components/ConnectionLabel";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Ellipsis } from "lucide-react";

interface CronjobsTableProps {
  cronjobs: Cronjob[];
  isLoading: boolean;
  onEdit: (cronjob: Cronjob) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  toggleLoading: Record<string, boolean>;
}

export default function CronjobsTable({
  cronjobs,
  isLoading,
  onEdit,
  onDelete,
  onToggle,
  toggleLoading,
}: CronjobsTableProps) {
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Conexión</TableHead>
            <TableHead className="hidden sm:table-cell">Expresión Cron</TableHead>
            <TableHead className="hidden sm:table-cell">Próxima Ejecución</TableHead>
            <TableHead>Último Estado</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              <TableCell>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 animate-pulse rounded bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (cronjobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No hay cronjobs configurados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
      <Table className="min-w-[360px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Conexión</TableHead>
            <TableHead className="hidden sm:table-cell">Expresión Cron</TableHead>
            <TableHead className="hidden sm:table-cell">Próxima Ejecución</TableHead>
            <TableHead>Último Estado</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cronjobs.map((cronjob) => {
            const isToggling = toggleLoading[cronjob.id] ?? false;

            return (
              <TableRow key={cronjob.id}>
                <TableCell className="font-medium">{cronjob.name}</TableCell>
                <TableCell>
                  <ConnectionLabel
                    id={cronjob.connectionId}
                    name={cronjob.connectionName}
                    showEnv
                  />
                </TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap font-mono text-xs">
                  {cronjob.cronExpression}
                </TableCell>
                <TableCell className="hidden sm:table-cell whitespace-nowrap font-mono text-xs">
                  {formatDate(cronjob.nextRunAt)}
                </TableCell>
                <TableCell>
                  {cronjob.lastStatus ? (
                    <StatusBadge status={cronjob.lastStatus} />
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={cronjob.isActive}
                    aria-label={
                      cronjob.isActive ? "Desactivar cronjob" : "Activar cronjob"
                    }
                    disabled={isToggling}
                    onClick={() => onToggle(cronjob.id)}
                    className="rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cronjob.isActive ? (
                      <ToggleRight className="h-5 w-5 text-primary" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  {/* Desktop: full button row */}
                  <div className="hidden sm:flex items-center justify-center gap-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(cronjob)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(cronjob.id)}
                    >
                      Eliminar
                    </Button>
                  </div>

                  {/* Mobile: dropdown menu */}
                  <div className="sm:hidden flex items-center justify-center">
                    <DropdownMenuPrimitive.Root>
                      <DropdownMenuPrimitive.Trigger asChild>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Acciones"
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
                            Editar
                          </DropdownMenuPrimitive.Item>
                          <DropdownMenuPrimitive.Item
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                            onSelect={() => onDelete(cronjob.id)}
                          >
                            Eliminar
                          </DropdownMenuPrimitive.Item>
                        </DropdownMenuPrimitive.Content>
                      </DropdownMenuPrimitive.Portal>
                    </DropdownMenuPrimitive.Root>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
