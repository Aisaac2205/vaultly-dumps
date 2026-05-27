import { Badge } from "@/shared/ui/badge";
import { DataTable, type Column } from "@/shared/ui/data-table";
import { UserActions } from "./UserActions";
import type { User } from "../types";

function RoleBadge({ role }: { role: string }) {
  return (
    <Badge
      className={
        role === "admin"
          ? "bg-success-bg text-success"
          : "bg-muted text-muted-foreground"
      }
    >
      {role}
    </Badge>
  );
}

const columns: Column<User>[] = [
  {
    header: "Nombre",
    accessor: (u) => u.name,
  },
  {
    header: "Correo",
    accessor: (u) => <span className="font-mono text-xs">{u.email}</span>,
  },
  {
    header: "Rol",
    accessor: (u) => <RoleBadge role={u.role} />,
  },
  {
    header: "Creado",
    accessor: (u) =>
      new Date(u.createdAt).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
  },
  {
    header: "",
    accessor: (u) => <UserActions user={u} />,
    headerClassName: "w-[132px]",
  },
];

interface UsersTableProps {
  users: User[];
  loading: boolean;
}

export function UsersTable({ users, loading }: UsersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage="No se encontraron usuarios"
    />
  );
}
