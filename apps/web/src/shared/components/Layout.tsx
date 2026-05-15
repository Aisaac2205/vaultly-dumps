import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import type { AuthUser } from "../hooks/useAuth";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={onLogout} />
      <main className="ml-[240px] min-h-screen flex-1 bg-bg">
        {children}
      </main>
    </div>
  );
}
