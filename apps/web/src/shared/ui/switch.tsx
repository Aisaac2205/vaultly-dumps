import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      checked = false,
      onCheckedChange,
      onChange,
      disabled,
      id,
      ...props
    },
    ref,
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      const isChecked = e.target.checked;
      onCheckedChange?.(isChecked);
      onChange?.(isChecked);
    };

    return (
      <label
        htmlFor={id}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors duration-200 ease-in-out focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          checked
            ? "bg-text-primary"
            : "bg-muted-foreground/25 hover:bg-muted-foreground/35",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-card shadow-xs ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </label>
    );
  },
);

Switch.displayName = "Switch";
