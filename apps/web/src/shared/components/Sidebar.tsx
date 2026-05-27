import { NavLink } from "react-router-dom";
import type { AuthUser } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Database,
  RotateCcw,
  Clock,
  Link2,
  FileText,
  Users,
  LogOut,
} from "lucide-react";
import logoSidebar from "@/shared/assets/logo_sidebar.png";
import { lazyRoutes, type RouteKey } from "@/shared/lib/lazy-routes";

interface SidebarProps {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

export interface SidebarContentProps {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
  onNavigate?: () => void;
}

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  routeKey: RouteKey;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, routeKey: "dashboard" },
  { path: "/dumps", label: "Dumps", icon: Database, routeKey: "dumps", adminOnly: true },
  { path: "/restore", label: "Restaurar", icon: RotateCcw, routeKey: "restore" },
  { path: "/cronjobs", label: "Cronjobs", icon: Clock, routeKey: "cronjobs" },
  { path: "/connections", label: "Conexiones", icon: Link2, routeKey: "connections", adminOnly: true },
  { path: "/users", label: "Usuarios", icon: Users, routeKey: "users", adminOnly: true },
  { path: "/audit", label: "Auditoría", icon: FileText, routeKey: "audit" },
];

function NavItem({ path, label, icon: Icon, routeKey, onNavigate }: NavItemConfig & { onNavigate?: () => void }) {
  const prefetch = () => {
    void lazyRoutes[routeKey]();
  };
  return (
    <NavLink
      to={path}
      end={path === "/"}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
          isActive
            ? "border-r-2 border-white bg-white/10 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

export function SidebarContent({ user, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
        <img
          src={logoSidebar}
          alt="Vaultly"
          className="h-8 w-8"
        />
        <span className="text-lg font-bold tracking-wide text-white">
          Vaultly
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map((item) => (
            <NavItem key={item.path} {...item} onNavigate={onNavigate} />
          ))}
      </nav>

      {/* User & Logout */}
      <div className="flex flex-col gap-2 border-t border-white/10 p-4">
        {user && (
          <span className="truncate font-mono text-xs text-white/60">
            {user.email}
          </span>
        )}
        <button
          className="flex items-center gap-2 text-left text-xs text-white/50 transition-colors hover:text-white"
          onClick={() => void onLogout()}
          type="button"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </>
  );
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[240px] flex-col bg-black font-medium md:flex">
      <SidebarContent user={user} onLogout={onLogout} />
    </aside>
  );
}
