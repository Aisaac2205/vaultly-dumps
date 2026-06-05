import { cn } from "@/shared/lib/cn";
import { type VariantProps, cva } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        // Workhorse enterprise style: hairline border, near-transparent surface,
        // neutral text. Semantics are carried by a colored BadgeDot, not by a
        // saturated fill — keeps the UI calm and monochrome (Vercel/Cloudflare).
        outline: "border-border bg-background text-text-primary",
      },
      size: {
        sm: "px-1.5 py-0 text-[11px] leading-5",
        md: "px-2 py-0.5 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

const DOT_TONES = {
  neutral: "bg-muted-foreground",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  error: "bg-error",
} as const;

export type BadgeDotTone = keyof typeof DOT_TONES;

interface BadgeDotProps {
  tone?: BadgeDotTone;
  /** Adds a soft ping ring — use for live/in-progress states. */
  pulse?: boolean;
  className?: string;
}

/** Small colored status dot, sized to sit inside a Badge. */
export function BadgeDot({ tone = "neutral", pulse = false, className }: BadgeDotProps) {
  const color = DOT_TONES[tone];
  return (
    <span className={cn("relative inline-flex h-1.5 w-1.5 shrink-0", className)} aria-hidden="true">
      {pulse && (
        <span
          className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)}
        />
      )}
      <span className={cn("relative inline-block h-1.5 w-1.5 rounded-full", color)} />
    </span>
  );
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
