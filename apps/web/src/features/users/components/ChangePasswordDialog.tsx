import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

export function ChangePasswordDialog({
  userId,
  userName,
}: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const mutation = useChangePassword();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPassword("");
      setShowPassword(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Cambiar contraseña"
          aria-label={`Cambiar contraseña de ${userName}`}
        >
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>{userName}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(
              { userId, newPassword: password },
              {
                onSuccess: () => {
                  setOpen(false);
                  setPassword("");
                  setShowPassword(false);
                },
              },
            );
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="cp-pass"
              className="text-sm font-medium text-foreground"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <Input
                id="cp-pass"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
                aria-describedby="cp-pass-hint"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p id="cp-pass-hint" className="text-xs text-muted-foreground">
              Mínimo 8 caracteres.
            </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
