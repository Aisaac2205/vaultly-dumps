import type { Connection, ConnectionTestResult } from "../types";
import { ConnectionStateBadge } from "@/shared/components/ConnectionStateBadge";
import { Button } from "@/shared/ui/button";
import { DataTable, type Column } from "@/shared/ui/data-table";
import TestConnectionBadge from "./TestConnectionBadge";
import PostgresSQL from "@/shared/assets/PostgresSQL.svg";
import MySQL from "@/shared/assets/MySQL.svg";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Ellipsis, ClipboardList } from "lucide-react";

interface ConnectionsTableProps {
  connections: Connection[];
  isLoading: boolean;
  onEdit: (connection: Connection) => void;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  testResults: Record<string, ConnectionTestResult>;
  testLoading: Record<string, boolean>;
}

const DB_ICONS: Record<string, string> = {
  postgres: PostgresSQL,
  mysql: MySQL,
};

export default function ConnectionsTable({
  connections,
  isLoading,
  onEdit,
  onDelete,
  onTest,
  testResults,
  testLoading,
}: ConnectionsTableProps) {
  const columns: Column<Connection>[] = [
    {
      header: "Nombre",
      accessor: (c) => c.name,
      className: "font-medium",
    },
    {
      header: "Ambiente",
      accessor: (c) => (
        <span className="text-muted-foreground font-mono text-xs uppercase">
          {c.environment}
        </span>
      ),
    },
    {
      header: "Tipo",
      accessor: (c) => (
        <div className="flex items-center justify-center gap-1.5">
          <img
            src={DB_ICONS[c.dbType]}
            alt={c.dbType}
            className="h-5 w-5"
          />
          <span className="text-xs text-muted-foreground capitalize">
            {c.dbType}
          </span>
        </div>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "Host",
      accessor: (c) => (
        <span className="truncate font-mono text-xs">{c.host}</span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "Puerto",
      accessor: (c) => (
        <span className="font-mono text-xs">{c.port}</span>
      ),
      className: "hidden sm:table-cell",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "BD",
      accessor: (c) => c.database,
      className: "hidden sm:table-cell truncate",
      headerClassName: "hidden sm:table-cell",
    },
    {
      header: "Estado",
      accessor: (c) => <ConnectionStateBadge isActive={c.isActive} />,
    },
    {
      header: "Acciones",
      accessor: (c) => {
        const isTesting = testLoading[c.id] ?? false;
        const testResult = testResults[c.id] ?? null;

        return (
          <>
            {/* Desktop: full button row */}
            <div className="hidden sm:flex items-center justify-center gap-2 whitespace-nowrap">
              <Button variant="outline" size="sm" onClick={() => onEdit(c)}>
                Editar
              </Button>
              <Button variant="outline" size="sm" onClick={() => onDelete(c.id)}>
                Eliminar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTest(c.id)}
                disabled={isTesting}
              >
                {isTesting ? "Testeando..." : "Test"}
              </Button>
              <TestConnectionBadge result={testResult} isLoading={isTesting} />
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
                      onSelect={() => onEdit(c)}
                    >
                      Editar
                    </DropdownMenuPrimitive.Item>
                    <DropdownMenuPrimitive.Item
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                      onSelect={() => onDelete(c.id)}
                    >
                      Eliminar
                    </DropdownMenuPrimitive.Item>
                    <DropdownMenuPrimitive.Item
                      className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                      onSelect={() => onTest(c.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? "Testeando..." : "Test"}
                    </DropdownMenuPrimitive.Item>
                  </DropdownMenuPrimitive.Content>
                </DropdownMenuPrimitive.Portal>
              </DropdownMenuPrimitive.Root>
            </div>
          </>
        );
      },
    },
  ];

  // ─── Empty state ────────────────────────────────────────

  if (!isLoading && connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ClipboardList className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-medium text-text-primary">
          No hay conexiones configuradas
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Los resultados de búsqueda o filtros no devolvieron conexiones.
        </p>
      </div>
    );
  }

  // ─── Data / Loading ─────────────────────────────────────

  return (
    <DataTable
      columns={columns}
      data={connections}
      loading={isLoading}
      emptyMessage="No hay conexiones configuradas"
    />
  );
}
