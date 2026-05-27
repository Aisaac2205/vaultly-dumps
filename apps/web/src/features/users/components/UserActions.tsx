import { Shield, Trash2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useAuth } from "@/shared/hooks/useAuth";
import { useToggleRole, useDeleteUser } from "../hooks/useUsers";
import { EditUserDialog } from "./EditUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import type { User } from "../types";

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const { user: currentUser } = useAuth();
  const toggleRole = useToggleRole();
  const deleteUser = useDeleteUser();

  const nextRole: "admin" | "user" = user.role === "admin" ? "user" : "admin";
  const isSelf = currentUser?.id === user.id;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        title={`Cambiar a ${nextRole}`}
        onClick={() => toggleRole.mutate({ userId: user.id, role: nextRole })}
        disabled={toggleRole.isPending}
      >
        <Shield className="h-4 w-4" />
      </Button>
      <EditUserDialog userId={user.id} currentName={user.name} />
      <ChangePasswordDialog userId={user.id} userName={user.name} />
      <Button
        variant="ghost"
        size="icon"
        title={isSelf ? "No podés eliminarte a vos mismo" : "Eliminar usuario"}
        onClick={() => {
          if (confirm(`¿Eliminar a "${user.name}"? Esta acción no se puede deshacer.`)) {
            deleteUser.mutate({ userId: user.id });
          }
        }}
        disabled={deleteUser.isPending || isSelf}
        className="text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
