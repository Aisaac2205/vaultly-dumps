import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/shared/ui/dialog";
import { useChangePassword } from "../hooks/useUsers";

interface ChangePasswordDialogProps {
  userId: string;
  userName: string;
}

export function ChangePasswordDialog({ userId, userName }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const mutation = useChangePassword();

  function handleSuccess() {
    setPassword("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Cambiar contraseña">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <p className="text-sm text-muted-foreground">{userName}</p>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(
              { userId, newPassword: password },
              { onSuccess: handleSuccess }
            );
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="cp-pass" className="text-sm font-medium text-muted-foreground">
              Nueva contraseña
            </label>
            <input
              id="cp-pass"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
