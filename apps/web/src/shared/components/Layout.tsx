import { useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarRoot } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { AuthUser } from "../hooks/useAuth";
import { Sheet, SheetContent } from "../ui/sheet";
import { Menu } from "lucide-react";
import { Toaster } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import logoSidebar from "@/shared/assets/logo_sidebar.png";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={onLogout} />

      {/* Mobile sidebar (Sheet drawer) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[240px] bg-sidebar p-0 border-r-0"
        >
          <SidebarRoot onNavigate={() => setSidebarOpen(false)}>
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

      {/* Main content area */}
      <div className="flex min-h-screen flex-1 flex-col pt-14 md:ml-[240px] md:pt-0">
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
