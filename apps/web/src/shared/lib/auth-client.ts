import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { APP_CONFIG } from "@/config";

export const authClient = createAuthClient({
  baseURL: APP_CONFIG.apiUrl,
  plugins: [adminClient()],
});
