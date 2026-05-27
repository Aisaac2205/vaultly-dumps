import { useUsers } from "./hooks/useUsers";
import { UsersTable } from "./components/UsersTable";
import { CreateUserDialog } from "./components/CreateUserDialog";
import { PageHeader } from "@/shared/ui/page-header";

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers();

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de usuarios y roles"
        actions={<CreateUserDialog />}
      />
      <UsersTable users={users} loading={isLoading} />
    </div>
  );
}
