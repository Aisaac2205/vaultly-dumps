import { Sun, User } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";
import { useTheme } from "@/shared/hooks/useTheme";
import { cn } from "@/shared/lib/cn";

interface TopbarProps {
  className?: string;
}

export function Topbar({ className }: TopbarProps) {
  const { toggleTheme } = useTheme();

  return (
    <header
      className={cn(
        "hidden md:flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6",
        className,
      )}
    >
      <Breadcrumbs />

      <div className="flex items-center gap-2">
        {/* Theme toggle slot — no-op button, dark mode deferred (C1) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4" />
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
