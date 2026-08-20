import { createContext, useContext, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { lazyRoutes, type RouteKey } from "@/shared/lib/lazy-routes";
import { cn } from "@/shared/lib/cn";
import { useSidebar } from "./SidebarProvider";


interface SidebarContextValue {
  onNavigate?: () => void;
  collapsed?: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({});

function useSidebarNavContext(): SidebarContextValue {
  return useContext(SidebarContext);
}

interface NavItemConfig {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  routeKey: RouteKey;
  adminOnly?: boolean;
  end?: boolean;
}

const NAV_ITEM_DEFS: Omit<NavItemConfig, 'label'>[] = [
  { path: "/", icon: LayoutDashboard, routeKey: "dashboard", end: true },
  { path: "/dumps", icon: Database, routeKey: "dumps", adminOnly: true },
  { path: "/cleanup", icon: Trash2, routeKey: "cleanup", adminOnly: true },
  { path: "/restore", icon: RotateCcw, routeKey: "restore" },
  { path: "/cronjobs", icon: Clock, routeKey: "cronjobs" },
  { path: "/connections", icon: Link2, routeKey: "connections", adminOnly: true },
  { path: "/users", icon: Users, routeKey: "users", adminOnly: true },
  { path: "/audit", icon: FileText, routeKey: "audit" },
];


interface SidebarRootProps {
  children: ReactNode;
  onNavigate?: () => void;
  collapsible?: "icon" | "offcanvas" | "none";
}

function SidebarRoot({ children, onNavigate, collapsible = "none" }: SidebarRootProps) {
  const sidebarState = useSidebar();
  const collapsed = collapsible === "icon" && sidebarState.state === "collapsed";

  return (
    <SidebarContext.Provider value={{ onNavigate, collapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

function SidebarHeader({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebarNavContext();

  return (
    <div
      className={cn(
        "flex h-16 items-center transition-all duration-200",
        collapsed ? "justify-center px-2" : "px-4",
      )}
    >
      {children}
    </div>
  );
}

function SidebarNav({ children }: { children: ReactNode }) {
  return <nav className="flex-1 overflow-y-auto px-1 py-2 space-y-0.5">{children}</nav>;
}

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
          "flex items-center gap-3 mx-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all",
          "focus-visible:ring-2 focus-visible:ring-sidebar-indicator focus-visible:ring-inset focus-visible:outline-none",
          isActive
            ? "border-sidebar-indicator bg-sidebar-active text-sidebar-text shadow-xs font-semibold"
            : "text-sidebar-text/70 hover:bg-sidebar-hover hover:text-sidebar-text",
          collapsed && "justify-center mx-1 px-2",
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden={collapsed ? true : undefined} />
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function SidebarUser({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}) {
  const { collapsed } = useSidebarNavContext();
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col gap-2 border-t border-sidebar-border/70 p-3">
      {!collapsed && user && (
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-sidebar-text/80">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shadow-xs">
            {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-sidebar-text text-xs">{user.name ?? user.email}</div>
            <div className="truncate text-[10px] text-sidebar-text/60">{user.email}</div>
          </div>
        </div>
      )}
      <button
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium text-sidebar-text/60 transition-colors hover:bg-sidebar-hover hover:text-sidebar-text",
          collapsed && "justify-center",
        )}
        onClick={() => void onLogout()}
        type="button"
        aria-label={t('action.logout')}
      >
        <LogOut className="h-3.5 w-3.5" />
        {!collapsed && <span>{t('action.logout')}</span>}
      </button>
    </div>
  );
}

const NAV_LABEL_KEYS: Record<string, string> = {
  "/": "nav.dashboard",
  "/dumps": "nav.dumps",
  "/cleanup": "nav.cleanup",
  "/restore": "nav.restore",
  "/cronjobs": "nav.cronjobs",
  "/connections": "nav.connections",
  "/users": "nav.users",
  "/audit": "nav.audit",
};

export function SidebarContent({
  user,
  onLogout,
}: {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}) {
  const { t } = useTranslation('common')
  const visibleDefs = NAV_ITEM_DEFS.filter(
    (item) => !item.adminOnly || user?.role === "admin",
  );
  const visibleItems: NavItemConfig[] = visibleDefs.map((def) => ({
    ...def,
    label: t(NAV_LABEL_KEYS[def.path] ?? def.path),
  }));

  return (
    <>
      <SidebarHeader>
        <img
          src="/logo.png"
          alt="Vaultly"
          className="h-10 w-auto max-w-[40px] object-contain invert dark:invert-0 transition-[filter] duration-200"
        />
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


interface SidebarProps {
  user: AuthUser | null;
  onLogout: () => Promise<void>;
  collapsible?: "icon" | "offcanvas" | "none";
}

export function Sidebar({ user, onLogout, collapsible = "none" }: SidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = collapsible === "icon" && state === "collapsed";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen flex-col bg-sidebar font-medium transition-[width] duration-200 ease-out md:flex",
        isCollapsed ? "w-[56px]" : "w-[216px]",
      )}
    >
      <SidebarRoot collapsible={collapsible}>
        <SidebarContent user={user} onLogout={onLogout} />
      </SidebarRoot>
    </aside>
  );
}


export { SidebarRoot, SidebarHeader, SidebarNav, SidebarItem, SidebarUser };
