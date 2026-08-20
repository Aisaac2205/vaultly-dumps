import { Switch } from "./switch";

export interface LeverSwitchProps {
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
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      className={className}
    />
  );
}

export { Switch };
