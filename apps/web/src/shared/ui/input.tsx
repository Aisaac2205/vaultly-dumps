import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Adds destructive border + ring styling. Mirrors `aria-invalid="true"`. */
  invalid?: boolean;
}

/**
 * Shared text input primitive.
 *
 * Used by form dialogs across the app. Forwards refs so consumers can
 * focus the input programmatically (e.g. autoFocus on dialog open).
 *
 * Companion utility: pair with a `<label htmlFor>` element. Never use
 * placeholder as a label.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          invalid &&
            "border-destructive focus-visible:ring-destructive aria-[invalid=true]:border-destructive",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
