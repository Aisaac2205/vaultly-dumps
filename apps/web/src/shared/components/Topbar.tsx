import { Sun, Moon, User, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTheme } from "@/shared/hooks/useTheme";
import { useSidebar } from "./SidebarProvider";
import { cn } from "@/shared/lib/cn";

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { state, toggle } = useSidebar();
  const sidebarExpanded = state === "expanded";
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

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
          aria-label={sidebarExpanded ? "Colapsar sidebar" : "Expandir sidebar"}
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
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          <ThemeIcon className="h-4 w-4" />
        </button>

        {/* User menu placeholder */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <User className="h-4 w-4" />
          <span>Account</span>
        </button>
      </div>
    </header>
  );
}
