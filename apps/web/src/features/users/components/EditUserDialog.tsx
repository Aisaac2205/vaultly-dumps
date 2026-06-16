import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { useUpdateUser } from "../hooks/useUsers";

interface EditUserDialogProps {
  userId: string;
  currentName: string;
}

export function EditUserDialog({ userId, currentName }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  const mutation = useUpdateUser();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setName(currentName);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title="Editar nombre"
          aria-label={`Editar nombre de ${currentName}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>{currentName}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(
              { userId, data: { name } },
              { onSuccess: () => setOpen(false) },
            );
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="eu-name"
              className="text-sm font-medium text-foreground"
            >
              Nombre
            </label>
            <Input
              id="eu-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending || name.trim() === currentName.trim()}
            >
              {mutation.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
