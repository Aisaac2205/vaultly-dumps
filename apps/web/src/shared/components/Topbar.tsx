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
        "hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={sidebarExpanded ? t('sidebar.collapse') : t('sidebar.expand')}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {sidebarExpanded ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </button>
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <AnimatedThemeToggler />
      </div>
    </header>
  );
}
