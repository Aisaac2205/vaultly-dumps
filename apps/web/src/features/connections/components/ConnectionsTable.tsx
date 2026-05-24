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
            <TableHead>Tipo</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Puerto</TableHead>
            <TableHead>BD</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {Array.from({ length: 8 }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <div className="h-4 animate-pulse rounded bg-muted" />
                </TableCell>
              ))}
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
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ambiente</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Puerto</TableHead>
            <TableHead>BD</TableHead>
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
                <TableCell>
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
                <TableCell>
                  <span className="truncate font-mono text-xs">{conn.host}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{conn.port}</span>
                </TableCell>
                <TableCell className="truncate">{conn.database}</TableCell>
                <TableCell>
                  <ConnectionStateBadge isActive={conn.isActive} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
