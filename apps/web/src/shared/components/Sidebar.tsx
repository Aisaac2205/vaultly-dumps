import { createContext, useContext, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import type { AuthUser } from "../hooks/useAuth";
import {
  LayoutDashboard,
  Database,
  Trash2,
  RotateCcw,
  Clock,
  Link2,
  FileText,
  Users,
  LogOut,
} from "lucide-react";
import logoSidebar from "@/shared/assets/logo_sidebar.png";
import { lazyRoutes, type RouteKey } from "@/shared/lib/lazy-routes";
import { cn } from "@/shared/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Sidebar context (compound component foundation)                           */
/* -------------------------------------------------------------------------- */

interface SidebarContextValue {
  onNavigate?: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({});

function useSidebarContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

/* -------------------------------------------------------------------------- */
/*  Navigation item config                                                    */
/* -------------------------------------------------------------------------- */

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  routeKey: RouteKey;
  adminOnly?: boolean;
  end?: boolean;
}

const NAV_ITEMS: NavItemConfig[] = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, routeKey: "dashboard", end: true },
  { path: "/dumps", label: "Dumps", icon: Database, routeKey: "dumps", adminOnly: true },
  { path: "/cleanup", label: "Limpieza", icon: Trash2, routeKey: "cleanup", adminOnly: true },
  { path: "/restore", label: "Restaurar", icon: RotateCcw, routeKey: "restore" },
  { path: "/cronjobs", label: "Cronjobs", icon: Clock, routeKey: "cronjobs" },
  { path: "/connections", label: "Conexiones", icon: Link2, routeKey: "connections", adminOnly: true },
  { path: "/users", label: "Usuarios", icon: Users, routeKey: "users", adminOnly: true },
  { path: "/audit", label: "Auditoría", icon: FileText, routeKey: "audit" },
];

/* -------------------------------------------------------------------------- */
/*  Compound sub-components                                                   */
/* -------------------------------------------------------------------------- */

/** Provides `onNavigate` to all descendant `<SidebarItem>` elements. */
function SidebarRoot({
  children,
  onNavigate,
}: {
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <SidebarContext.Provider value={{ onNavigate }}>
      {children}
    </SidebarContext.Provider>
  );
}

/** Logo / branding section. */
function SidebarHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-4 py-5">
      {children}
    </div>
  );
}

/** Scrollable navigation wrapper. */
function SidebarNav({ children }: { children: ReactNode }) {
  return <nav className="flex-1 overflow-y-auto py-3">{children}</nav>;
}

/** Single navigation link with token-based active state. */
function SidebarItem({ path, label, icon: Icon, routeKey, end }: NavItemConfig) {
  const { onNavigate } = useSidebarContext();

  const prefetch = () => {
    void lazyRoutes[routeKey]();
  };

  return (
    <NavLink
      to={path}
      end={end}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
          "focus-visible:ring-2 focus-visible:ring-sidebar-indicator focus-visible:ring-inset focus-visible:outline-none",
          isActive
            ? "border-l-2 border-sidebar-indicator bg-sidebar-active text-sidebar-text"
            : "text-sidebar-text/70 hover:bg-sidebar-hover hover:text-sidebar-text",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

/** User info + logout in the sidebar footer. */
function SidebarUser({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border p-4">
      {user && (
        <span className="truncate font-mono text-xs text-sidebar-text/60">
          {user.email}
        </span>
      )}
      <button
        className="flex items-center gap-2 text-left text-xs text-sidebar-text/50 transition-colors hover:text-sidebar-text"
        onClick={() => void onLogout()}
        type="button"
      >
        <LogOut className="h-3.5 w-3.5" />
        Cerrar Sesión
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Convenience composition (used by both desktop sidebar and mobile sheet)    */
/* -------------------------------------------------------------------------- */

export function SidebarContent({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );

  return (
    <>
      <SidebarHeader>
        <img src={logoSidebar} alt="Vaultly" className="h-8 w-8" />
        <span className="text-lg font-bold tracking-wide text-sidebar-text">
          Vaultly
        </span>
      </SidebarHeader>

      <SidebarNav>
        {visibleItems.map((item) => (
          <SidebarItem key={item.path} {...item} />
        ))}
      </SidebarNav>

      <SidebarUser user={user} onLogout={onLogout} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Desktop sidebar wrapper                                                   */
/* -------------------------------------------------------------------------- */

interface SidebarProps {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[240px] flex-col bg-sidebar font-medium md:flex">
      <SidebarRoot>
        <SidebarContent user={user} onLogout={onLogout} />
      </SidebarRoot>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/*  Compound exports                                                          */
/* -------------------------------------------------------------------------- */

export { SidebarRoot, SidebarHeader, SidebarNav, SidebarItem, SidebarUser };
export { NAV_ITEMS };
