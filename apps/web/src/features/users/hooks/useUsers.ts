import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/shared/lib/auth-client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { User, UserRole } from "../types";

export interface UseUsersFilters {
  /** Free-text search applied server-side via Better Auth `searchValue`. */
  search?: string;
  /** Role filter applied client-side. */
  role?: "" | UserRole;
}

export interface UsersResult {
  users: User[];
  total: number;
}

const USERS_QUERY_KEY = ["users"] as const;

function filtersKey(filters: UseUsersFilters) {
  return [...USERS_QUERY_KEY, filters] as const;
}

export function useUsers(filters: UseUsersFilters = {}) {
  return useQuery<UsersResult>({
    queryKey: filtersKey(filters),
    queryFn: async () => {
      const query: Parameters<typeof authClient.admin.listUsers>[0]["query"] = {
        limit: 100,
        sortBy: "createdAt",
        sortDirection: "desc",
      };
      if (filters.search && filters.search.trim()) {
        query.searchValue = filters.search.trim();
        query.searchField = "name";
        query.searchOperator = "contains";
      }

      const { data, error } = await authClient.admin.listUsers({ query });
      if (error) throw new Error(error.message);
      const all = (data?.users ?? []) as unknown as User[];

      const filtered =
        filters.role === "admin" || filters.role === "user"
          ? all.filter((u) => u.role === filters.role)
          : all;

      return { users: filtered, total: data?.total ?? filtered.length };
    },
  });
}

export function useCreateUser() {
  const { t } = useTranslation("users");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      email: string;
      password: string;
      name: string;
      role: UserRole;
    }) => {
      const { error } = await authClient.admin.createUser(body);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(t("toast.userCreated"));
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleRole() {
  const { t } = useTranslation("users");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: UserRole;
    }) => {
      const { error } = await authClient.admin.setRole({ userId, role });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      toast.success(t("toast.roleChanged", { role: variables.role }));
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteUser() {
  const { t } = useTranslation("users");
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await authClient.admin.removeUser({ userId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(t("toast.userDeleted"));
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateUser() {
  const { t } = useTranslation("users");
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
      toast.success(t("toast.userUpdated"));
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useChangePassword() {
  const { t } = useTranslation("users");
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
      toast.success(t("toast.passwordChanged"));
      void queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
