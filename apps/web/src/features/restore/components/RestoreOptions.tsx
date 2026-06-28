import { Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LeverSwitch } from "@/shared/ui/lever-switch";

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
            className="cursor-pointer select-none text-sm font-medium"
          >
            Dry Run
          </label>
          <p className="text-xs text-muted-foreground">
            {t("dryRun.description")}
          </p>
        </div>

        <LeverSwitch
          id="dry-run"
          checked={isDryRun}
          onChange={onDryRunChange}
          disabled={disabled}
        />
      </div>

      {!isDryRun && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-600 dark:text-red-400">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{t("dryRun.warningText")}</p>
        </div>
      )}
    </div>
  );
}
