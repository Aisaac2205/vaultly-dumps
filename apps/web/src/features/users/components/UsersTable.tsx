import { UserX, ShieldOff } from "lucide-react";
import { Badge, BadgeDot } from "@/shared/ui/badge";
import { DataTable, type Column } from "@/shared/ui/data-table";
import { UserActions } from "./UserActions";
import type { User } from "../types";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-AR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function RoleBadge({ role }: { role: User["role"] }) {
  const isAdmin = role === "admin";
  return (
    <Badge variant="outline">
      <BadgeDot tone={isAdmin ? "success" : "neutral"} />
      {isAdmin ? "Administrador" : "Usuario"}
    </Badge>
  );
}

function BannedBadge() {
  return (
    <Badge variant="outline" className="ml-2">
      <BadgeDot tone="error" />
      Baneado
    </Badge>
  );
}

const columns: Column<User>[] = [
  {
    header: "Nombre",
    accessor: (u) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{u.name}</span>
        {u.banned && <BannedBadge />}
      </div>
    ),
  },
  {
    header: "Correo",
    accessor: (u) => (
      <span
        className="font-mono text-xs text-muted-foreground"
        title={u.email}
      >
        {u.email}
      </span>
    ),
  },
  {
    header: "Rol",
    accessor: (u) => <RoleBadge role={u.role} />,
  },
  {
    header: "Creado",
    accessor: (u) => (
      <span className="text-sm text-muted-foreground">
        {DATE_FORMATTER.format(new Date(u.createdAt))}
      </span>
    ),
  },
  {
    header: <span className="sr-only">Acciones</span>,
    accessor: (u) => <UserActions user={u} />,
    headerClassName: "w-[160px]",
  },
];

function UsersEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">
        <UserX className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-medium text-foreground">
        No hay usuarios
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Creá el primer usuario para empezar a gestionar el acceso al sistema.
      </p>
    </div>
  );
}

function BannedOnlyEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">
        <ShieldOff className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-medium text-foreground">
        No se encontraron usuarios
      </h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Probá ajustar la búsqueda o quitar el filtro de rol.
      </p>
    </div>
  );
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  /** When true, shows a different empty state (used when filters are active). */
  filtered?: boolean;
}

export function UsersTable({ users, loading, filtered = false }: UsersTableProps) {
  if (!loading && users.length === 0) {
    return filtered ? <BannedOnlyEmptyState /> : <UsersEmptyState />;
  }

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No se encontraron usuarios"
    />
  );
}
