import { Children, createContext, useContext, type ReactNode } from "react";
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
import { useSidebar } from "./SidebarProvider";

/* -------------------------------------------------------------------------- */
/*  Sidebar context (compound component foundation)                           */
/* -------------------------------------------------------------------------- */

interface SidebarContextValue {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({});

function useSidebarNavContext(): SidebarContextValue {
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

interface SidebarRootProps {
  children: ReactNode;
  onNavigate?: () => void;
  /** Collapse mode. Defaults to `"none"` (always expanded with labels). */
  collapsible?: "icon" | "offcanvas" | "none";
}

/** Provides `onNavigate` and `collapsed` to all descendant compound components. */
function SidebarRoot({ children, onNavigate, collapsible = "none" }: SidebarRootProps) {
  const sidebarState = useSidebar();
  const collapsed = collapsible === "icon" && sidebarState.state === "collapsed";

  return (
    <SidebarContext.Provider value={{ onNavigate, collapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

/** Logo / branding section. In collapsed mode only the first child (logo) is rendered. */
function SidebarHeader({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarNavContext();
  const childArray = Children.toArray(children);

  return (
    <div
      className={cn(
        "flex items-center gap-3 border-b border-sidebar-border transition-all duration-200",
        collapsed ? "justify-center px-2 py-5" : "px-4 py-5",
      )}
    >
      {collapsed ? childArray.slice(0, 1) : children}
    </div>
  );
}

/** Scrollable navigation wrapper. */
function SidebarNav({ children }: { children: ReactNode }) {
  return <nav className="flex-1 overflow-y-auto py-3">{children}</nav>;
}

/** Single navigation link with token-based active state. Collapse-aware. */
function SidebarItem({ path, label, icon: Icon, routeKey, end }: NavItemConfig) {
  const { onNavigate, collapsed } = useSidebarNavContext();

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
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
          "focus-visible:ring-2 focus-visible:ring-sidebar-indicator focus-visible:ring-inset focus-visible:outline-none",
          isActive
            ? "border-l-2 border-sidebar-indicator bg-sidebar-active text-sidebar-text"
            : "text-sidebar-text/70 hover:bg-sidebar-hover hover:text-sidebar-text",
          collapsed && "justify-center px-2",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden={collapsed ? true : undefined} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

/** User info + logout in the sidebar footer. Collapse-aware. */
function SidebarUser({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}) {
  const { collapsed } = useSidebarNavContext();

  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border p-4">
      {!collapsed && user && (
        <span className="truncate font-mono text-xs text-sidebar-text/60">
          {user.email}
        </span>
      )}
      <button
        className={cn(
          "flex items-center gap-2 text-left text-xs text-sidebar-text/50 transition-colors hover:text-sidebar-text",
          collapsed && "justify-center",
        )}
        onClick={() => void onLogout()}
        type="button"
        aria-label="Cerrar Sesión"
      >
        <LogOut className="h-3.5 w-3.5" />
        {!collapsed && "Cerrar Sesión"}
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
  /** Collapse mode. Defaults to `"none"` (always expanded with labels). */
  collapsible?: "icon" | "offcanvas" | "none";
}

export function Sidebar({ user, onLogout, collapsible = "none" }: SidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = collapsible === "icon" && state === "collapsed";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 hidden h-screen flex-col bg-sidebar font-medium md:flex",
        "relative transition-[width] duration-200 ease-out",
        isCollapsed ? "w-[56px]" : "w-[240px]",
      )}
    >
      <SidebarRoot collapsible={collapsible}>
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
