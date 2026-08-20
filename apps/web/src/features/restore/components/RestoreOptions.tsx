import { useTranslation } from "react-i18next";
import { Switch } from "@/shared/ui/switch";

interface RestoreOptionsProps {
  isDryRun: boolean;
  onDryRunChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function RestoreOptions({
  isDryRun,
  onDryRunChange,
  disabled = false,
}: RestoreOptionsProps) {
  const { t } = useTranslation("restore");
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <label
            htmlFor="dry-run"
            className="cursor-pointer select-none text-sm font-medium text-text-primary"
          >
            Dry Run
          </label>
          <p className="text-xs text-muted-foreground">
            {t("dryRun.description")}
          </p>
        </div>

        <Switch
          id="dry-run"
          checked={isDryRun}
          onCheckedChange={onDryRunChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
