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
    <div className={cn("relative pl-7", className)}>
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
      )}
      
      {/* Number badge */}
      <div className="absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground ring-4 ring-background">
        {number}
      </div>

      <div className="space-y-2 pb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{title}</h3>
          {icon && <span className="flex items-center">{icon}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
