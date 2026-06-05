import { cn } from "@/shared/lib/cn";

interface EnvironmentBadgeProps {
  env: string;
  /** "xs" for inline tags next to a name, "sm" for table cells. */
  size?: "xs" | "sm";
  className?: string;
}

/**
 * Monochrome environment tag with a single sharp accent: production stands out
 * in destructive red (border + dot), every other environment stays neutral.
 * Keeps the safety-critical "prod" label instantly scannable without painting
 * the whole UI with saturated category colors.
 */
export function EnvironmentBadge({ env, size = "sm", className }: EnvironmentBadgeProps) {
  const isProd = env.toLowerCase() === "prod";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border font-mono font-semibold uppercase tracking-wider",
        size === "xs" ? "px-1.5 py-0 text-[9px]" : "px-1.5 py-0.5 text-[10px]",
        isProd
          ? "border-destructive/40 text-destructive"
          : "border-border text-muted-foreground",
        className,
      )}
    >
      {isProd && (
        <span
          className="inline-block h-1 w-1 shrink-0 rounded-full bg-destructive"
          aria-hidden="true"
        />
      )}
      {env}
    </span>
  );
}
