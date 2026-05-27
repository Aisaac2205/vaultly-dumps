import { useState } from "react";
import { UserPlus } from "lucide-react";
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
import { useCreateUser } from "../hooks/useUsers";

export function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  const mutation = useCreateUser();

  function handleSuccess() {
    setOpen(false);
    setEmail("");
    setName("");
    setPassword("");
    setRole("user");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4" />
          Agregar usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(
              { email, password, name, role },
              { onSuccess: handleSuccess }
            );
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="cu-name" className="text-sm font-medium text-muted-foreground">
              Nombre
            </label>
            <input
              id="cu-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cu-email" className="text-sm font-medium text-muted-foreground">
              Correo electrónico
            </label>
            <input
              id="cu-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cu-pass" className="text-sm font-medium text-muted-foreground">
              Contraseña
            </label>
            <input
              id="cu-pass"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cu-role" className="text-sm font-medium text-muted-foreground">
              Rol
            </label>
            <select
              id="cu-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "user" | "admin")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
