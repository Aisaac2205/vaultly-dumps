import { PageHeader } from "@/shared/ui/page-header";
import { AutoRefreshIndicator } from "./AutoRefreshIndicator";

interface DashboardHeaderProps {
  lastUpdated: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  return (
    <PageHeader
      title="Dashboard"
      subtitle="Monitoreo de backups y restores"
      actions={<AutoRefreshIndicator lastUpdated={lastUpdated} />}
    />
  );
}
