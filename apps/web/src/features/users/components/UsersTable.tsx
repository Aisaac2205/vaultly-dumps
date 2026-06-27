import { UserX, ShieldOff } from "lucide-react";
import { Badge, BadgeDot } from "@/shared/ui/badge";
import { DataTable, type Column } from "@/shared/ui/data-table";
import { UserActions } from "./UserActions";
import { useTranslation } from "react-i18next";
import { formatDate } from "@/lib/format";
import type { User } from "../types";

function RoleBadge({ role, t }: { role: User["role"]; t: (key: string) => string }) {
  const isAdmin = role === "admin";
  return (
    <Badge variant="outline">
      <BadgeDot tone={isAdmin ? "success" : "neutral"} />
      {isAdmin ? t('role.admin') : t('role.user')}
    </Badge>
  );
}

function BannedBadge({ t }: { t: (key: string) => string }) {
  return (
    <Badge variant="outline" className="ml-2">
      <BadgeDot tone="error" />
      {t('status.banned')}
    </Badge>
  );
}

interface UsersTableProps {
  users: User[];
  loading: boolean;
  /** When true, shows a different empty state (used when filters are active). */
  filtered?: boolean;
}

export function UsersTable({ users, loading, filtered = false }: UsersTableProps) {
  const { t } = useTranslation('users')

  const columns: Column<User>[] = [
    {
      header: t('column.name'),
      accessor: (u) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{u.name}</span>
          {u.banned && <BannedBadge t={t} />}
        </div>
      ),
    },
    {
      header: t('column.email'),
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
      header: t('column.role'),
      accessor: (u) => <RoleBadge role={u.role} t={t} />,
    },
    {
      header: t('column.createdAt'),
      accessor: (u) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(u.createdAt)}
        </span>
      ),
    },
    {
      header: <span className="sr-only">{t('column.actions')}</span>,
      accessor: (u) => <UserActions user={u} />,
      headerClassName: "w-[160px]",
    },
  ];

  if (!loading && users.length === 0) {
    if (filtered) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-muted-foreground">
            <ShieldOff className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            {t('empty.filtered.title')}
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {t('empty.filtered.description')}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-muted-foreground">
          <UserX className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-medium text-foreground">
          {t('empty.title')}
        </h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {t('empty.description')}
        </p>
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={users}
      loading={loading}
      emptyMessage={t('empty.filtered.title')}
    />
  );
}
