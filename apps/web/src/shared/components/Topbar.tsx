import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "./Breadcrumbs";
import { useSidebar } from "./SidebarProvider";
import { AnimatedThemeToggler } from "@/shared/ui/animated-theme-toggler";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { cn } from "@/shared/lib/cn";

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const { state, toggle } = useSidebar();
  const { t } = useTranslation('common');
  const sidebarExpanded = state === "expanded";

  return (
    <header
      className={cn(
        "hidden md:flex h-12 shrink-0 items-center justify-between bg-sidebar text-sidebar-text px-4 md:px-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={sidebarExpanded ? t('sidebar.collapse') : t('sidebar.expand')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-text/70 transition-colors hover:bg-sidebar-hover hover:text-sidebar-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-indicator"
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <div className="text-sidebar-text">
          <Breadcrumbs />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
