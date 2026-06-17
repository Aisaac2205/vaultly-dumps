import { cn } from "@/shared/lib/cn";

interface LeverSwitchProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function LeverSwitch({
  id,
  checked,
  onChange,
  disabled = false,
  className,
}: LeverSwitchProps) {
  return (
    <label className={cn("toggle-container", className)}>
      <input
        id={id}
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="toggle-handle-wrapper">
        <div className="toggle-shaft" />
        <div className="toggle-handle" />
      </div>
      <div className="toggle-base">
        <div className="toggle-base-inside" />
      </div>
    </label>
  );
}
