import { useState } from "react";
import { Pencil } from "lucide-react";
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
import { useUpdateUser } from "../hooks/useUsers";

interface EditUserDialogProps {
  userId: string;
  currentName: string;
}

export function EditUserDialog({ userId, currentName }: EditUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  const mutation = useUpdateUser();

  function handleOpenChange(value: boolean) {
    setOpen(value);
    if (value) setName(currentName);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Editar usuario">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <p className="text-sm text-muted-foreground">{currentName}</p>
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
            <label htmlFor="eu-name" className="text-sm font-medium text-muted-foreground">
              Nombre
            </label>
            <input
              id="eu-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending || name === currentName}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
