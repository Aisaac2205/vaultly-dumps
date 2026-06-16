/**
 * Better Auth admin client returns users as ISO-string timestamps, not Date.
 * Mirrors the `authClient.admin.listUsers` response shape.
 */
export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  /** `null` means the user is not banned. `true` means currently banned. */
  banned: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  /** ISO 8601 timestamp from Better Auth. */
  createdAt: string;
  /** ISO 8601 timestamp from Better Auth. */
  updatedAt: string;
  emailVerified: boolean;
  image?: string | null;
}
