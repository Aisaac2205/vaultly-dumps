import { useTranslation } from "react-i18next";
import type { BackupCategory } from "@/types/backup.types";
import { Tabs, TabsList, TabsTrigger } from "@/shared/ui/tabs";

interface FrequencyTabsProps {
  value: BackupCategory | null;
  onChange: (category: BackupCategory) => void;
  disabled?: boolean;
}

interface TabDef {
  value: BackupCategory;
  label: string;
  shortLabel: string;
}

function getTabDefs(t: (key: string) => string): readonly TabDef[] {
  return [
    { value: "hourly", label: t("freq.hourly"), shortLabel: t("freq.hourShort") },
    { value: "daily", label: t("freq.daily"), shortLabel: t("freq.dayShort") },
    { value: "weekly", label: t("freq.weekly"), shortLabel: t("freq.weekShort") },
    { value: "custom", label: t("freq.custom"), shortLabel: "Custom" },
    { value: "manual", label: t("freq.manual"), shortLabel: "Manual" },
  ] as const;
}

export function FrequencyTabs({
  value,
  onChange,
  disabled = false,
}: FrequencyTabsProps) {
  const { t } = useTranslation("restore");
  const tabs = getTabDefs(t);

  return (
    <Tabs
      value={value ?? ""}
      onValueChange={(next) => onChange(next as BackupCategory)}
      aria-label={t("freq.ariaLabel")}
    >
      <TabsList className="grid h-9 w-full grid-cols-5 gap-1 rounded-md p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={disabled}
            aria-label={tab.label}
            title={tab.label}
            className="rounded-sm px-1.5 py-1 text-[11px] leading-tight"
          >
            {tab.shortLabel}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
