import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/lib/auth-client";
import { toast } from "sonner";
import type { User } from "../types";

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      if (error) throw new Error(error.message);
      return (data?.users ?? []) as unknown as User[];
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      name: string;
      role: "user" | "admin";
    }) => {
      const { error } = await authClient.admin.createUser(body);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Usuario creado");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "admin" | "user";
    }) => {
      const { error } = await authClient.admin.setRole({ userId, role });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      toast.success(`Rol cambiado a ${variables.role}`);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await authClient.admin.removeUser({ userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Usuario eliminado");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: { name: string };
    }) => {
      const { error } = await authClient.admin.updateUser({ userId, data });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Usuario actualizado");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      newPassword,
    }: {
      userId: string;
      newPassword: string;
    }) => {
      const { error } = await authClient.admin.setUserPassword({
        userId,
        newPassword,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
