import { useUsers, type UseUsersFilters } from "./hooks/useUsers";
import { UsersStats } from "./components/UsersStats";
import { UsersFilters, useUserFilters } from "./components/UsersFilters";
import { UsersTable } from "./components/UsersTable";
import { CreateUserDialog } from "./components/CreateUserDialog";
import { PageHeader } from "@/shared/ui/page-header";
import { FadeIn } from "@/shared/ui/motion/FadeIn";

function toQueryFilters(filters: { search: string; role: "" | "admin" | "user" }): UseUsersFilters {
  return {
    search: filters.search || undefined,
    role: filters.role || undefined,
  };
}

export default function UsersPage() {
  const { filters, setFilters } = useUserFilters();
  const queryFilters = toQueryFilters(filters);
  const { data, isLoading } = useUsers(queryFilters);
  const users = data?.users ?? [];
  const hasActiveFilters = filters.search !== "" || filters.role !== "";

  return (
    <FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de usuarios y roles"
        actions={<CreateUserDialog />}
      />
      <UsersStats users={users} loading={isLoading} />
      <UsersFilters filters={filters} onChange={setFilters} />
      <UsersTable
        users={users}
        loading={isLoading}
        filtered={hasActiveFilters}
      />
    </FadeIn>
  );
}
