import { cn } from "@/shared/lib/cn";

interface RestoreFormSectionProps {
  number: number;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function RestoreFormSection({
  number,
  title,
  description,
  icon,
  children,
  className,
}: RestoreFormSectionProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {number}
        </span>
        <div className="flex items-center gap-1.5 leading-tight">
          <h3 className="text-sm font-semibold">{title}</h3>
          {icon && <span className="flex items-center">{icon}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
