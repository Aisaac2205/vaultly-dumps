import { cn } from "@/shared/lib/cn";

interface RestoreFormSectionProps {
  number: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  isLast?: boolean;
}

export function RestoreFormSection({
  number,
  title,
  description,
  icon,
  children,
  className,
  isLast = false,
}: RestoreFormSectionProps) {
  return (
    <div className={cn("relative pl-8", className)}>
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-3 top-8 bottom-0 w-px bg-border/60" />
      )}
      
      {/* Number badge */}
      <div className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-[11px] font-semibold text-text-primary shadow-xs ring-2 ring-background transition-colors">
        {number}
      </div>

      <div className="space-y-2 pb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-text-primary">{title}</h3>
          {icon && <span className="flex items-center text-muted-foreground">{icon}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
        <div className="pt-1">{children}</div>
      </div>
    </div>
  );
}
