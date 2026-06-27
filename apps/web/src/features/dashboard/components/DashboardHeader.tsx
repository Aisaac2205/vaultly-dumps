import { PageHeader } from "@/shared/ui/page-header";
import { AutoRefreshIndicator } from "./AutoRefreshIndicator";
import { useTranslation } from "react-i18next";

interface DashboardHeaderProps {
  lastUpdated: Date | null;
}

export function DashboardHeader({ lastUpdated }: DashboardHeaderProps) {
  const { t } = useTranslation('dashboard')
  return (
    <PageHeader
      title={t('header.title')}
      subtitle={t('header.subtitle')}
      actions={<AutoRefreshIndicator lastUpdated={lastUpdated} />}
    />
  );
}
