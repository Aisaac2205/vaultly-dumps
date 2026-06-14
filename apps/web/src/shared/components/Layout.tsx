import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarRoot } from "./Sidebar";
import { SidebarProvider, useSidebar } from "./SidebarProvider";
import { Topbar } from "./Topbar";
import type { AuthUser } from "../hooks/useAuth";
import { Sheet, SheetContent } from "../ui/sheet";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { cn } from "@/shared/lib/cn";
import logoSidebar from "@/shared/assets/logo_sidebar.png";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

/**
 * Layout root. Wraps the entire shell in `<SidebarProvider>` so both the
 * desktop sidebar and mobile sheet can access collapse state via context.
 *
 * Actual hook consumption happens in `<LayoutInner>` — a child component
 * rendered inside the provider boundary.
 */
export function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner user={user} onLogout={onLogout}>{children}</LayoutInner>
    </SidebarProvider>
  );
}

function LayoutInner({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeMobileSidebar = () => setSidebarOpen(false);
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();
  const { state } = useSidebar();
  const sidebarCollapsed = state === "collapsed";

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — icon-rail collapsible */}
      <Sidebar user={user} onLogout={onLogout} collapsible="icon" />

      {/* Mobile sidebar (Sheet drawer) — NOT affected by collapse state */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[240px] bg-sidebar p-0 border-r-0"
        >
          <SidebarRoot onNavigate={closeMobileSidebar}>
            <SidebarContent user={user} onLogout={onLogout} />
          </SidebarRoot>
        </SheetContent>
      </Sheet>

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="text-sidebar-text/70 hover:text-sidebar-text"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={logoSidebar} alt="Vaultly" className="h-7 w-7" />
        <span className="text-sm font-bold tracking-wide text-sidebar-text">
          Vaultly
        </span>
      </header>

      {/* Main content area — margin adapts to sidebar width, content uses full width */}
      <div
        className={cn(
          "flex min-h-screen w-full flex-1 flex-col pt-14 md:pt-0 transition-[margin] duration-200 ease-out",
          sidebarCollapsed ? "md:ml-[56px]" : "md:ml-[240px]",
        )}
      >
        {/* Desktop topbar */}
        <Topbar />

        {/* Page content with transition slot */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            className="min-h-0 flex-1 bg-bg"
            initial={reducedMotion ? {} : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? {} : { opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
