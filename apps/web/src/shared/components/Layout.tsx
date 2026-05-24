import { useState, type ReactNode } from "react";
import { Sidebar, SidebarContent } from "./Sidebar";
import type { AuthUser } from "../hooks/useAuth";
import { Sheet, SheetContent } from "../ui/sheet";
import { Menu } from "lucide-react";
import logoSidebar from "@/shared/assets/logo_sidebar.png";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser | null;
  onLogout: () => Promise<void>;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <Sidebar user={user} onLogout={onLogout} />

      {/* Mobile sidebar (Sheet drawer) */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[240px] bg-black p-0 border-r-0"
        >
          <SidebarContent
            user={user}
            onLogout={onLogout}
            onNavigate={() => setSidebarOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-black px-4 md:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="text-white/70 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img src={logoSidebar} alt="Vaultly" className="h-7 w-7" />
        <span className="text-sm font-bold tracking-wide text-white">
          Vaultly
        </span>
      </header>

      <main className="min-h-screen flex-1 bg-bg pt-14 md:ml-[240px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
