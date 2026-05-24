import type { Connection, ConnectionTestResult } from "../types";
import { ConnectionStateBadge } from "@/shared/components/ConnectionStateBadge";
import { Button } from "@/shared/ui/button";
import TestConnectionBadge from "./TestConnectionBadge";
import PostgresSQL from "@/shared/assets/PostgresSQL.svg";
import MySQL from "@/shared/assets/MySQL.svg";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/shared/ui/table";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { Ellipsis } from "lucide-react";

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
  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead className="hidden sm:table-cell">Tipo</TableHead>
            <TableHead className="hidden sm:table-cell">Host</TableHead>
            <TableHead className="hidden sm:table-cell">Puerto</TableHead>
            <TableHead className="hidden sm:table-cell">BD</TableHead>
            <TableHead>Estado</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">No hay conexiones configuradas</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
      <Table className="min-w-[360px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead className="hidden sm:table-cell">Tipo</TableHead>
            <TableHead className="hidden sm:table-cell">Host</TableHead>
            <TableHead className="hidden sm:table-cell">Puerto</TableHead>
            <TableHead className="hidden sm:table-cell">BD</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map((conn) => {
            const isTesting = testLoading[conn.id] ?? false;
            const testResult = testResults[conn.id] ?? null;

            return (
              <TableRow key={conn.id}>
                <TableCell className="font-medium">{conn.name}</TableCell>
                <TableCell>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase">
                    {conn.environment}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1.5">
                    <img
                      src={DB_ICONS[conn.dbType]}
                      alt={conn.dbType}
                      className="h-5 w-5"
                    />
                    <span className="text-xs text-muted-foreground capitalize">
                      {conn.dbType}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="truncate font-mono text-xs">{conn.host}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="font-mono text-xs">{conn.port}</span>
                </TableCell>
                <TableCell className="hidden sm:table-cell truncate">{conn.database}</TableCell>
                <TableCell>
                  <ConnectionStateBadge isActive={conn.isActive} />
                </TableCell>
                <TableCell>
                  {/* Desktop: full button row */}
                  <div className="hidden sm:flex items-center justify-center gap-2 whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(conn)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(conn.id)}
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onTest(conn.id)}
                      disabled={isTesting}
                    >
                      {isTesting ? "Testeando..." : "Test"}
                    </Button>
                    <TestConnectionBadge
                      result={testResult}
                      isLoading={isTesting}
                    />
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
                            onSelect={() => onEdit(conn)}
                          >
                            Editar
                          </DropdownMenuPrimitive.Item>
                          <DropdownMenuPrimitive.Item
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                            onSelect={() => onDelete(conn.id)}
                          >
                            Eliminar
                          </DropdownMenuPrimitive.Item>
                          <DropdownMenuPrimitive.Item
                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                            onSelect={() => onTest(conn.id)}
                            disabled={isTesting}
                          >
                            {isTesting ? "Testeando..." : "Test"}
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
