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

const TABS: readonly TabDef[] = [
  { value: "hourly", label: "Horarios", shortLabel: "Hora" },
  { value: "daily", label: "Diarios", shortLabel: "Día" },
  { value: "weekly", label: "Semanales", shortLabel: "Semana" },
  { value: "custom", label: "Personalizados", shortLabel: "Custom" },
  { value: "manual", label: "Manuales", shortLabel: "Manual" },
] as const;

export function FrequencyTabs({
  value,
  onChange,
  disabled = false,
}: FrequencyTabsProps) {
  return (
    <Tabs
      value={value ?? ""}
      onValueChange={(next) => onChange(next as BackupCategory)}
      aria-label="Frecuencia de backup"
    >
      <TabsList className="grid h-9 w-full grid-cols-5 gap-1 rounded-md p-1">
        {TABS.map((tab) => (
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
