import { PageHeader } from "@/shared/ui/page-header";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { useTranslation } from "react-i18next";
import { StoragePanel } from "./components/StoragePanel";
import { ConnectionRetentionPanel } from "./components/ConnectionRetentionPanel";
import { DbHygienePanel } from "./components/DbHygienePanel";
import { ReconcilePanel } from "./components/ReconcilePanel";

export default function CleanupPage() {
  const { t } = useTranslation('cleanup');
  return (
    <FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
      />

      {/* ── Storage Overview & Connection Breakdown ── */}
      <section>
        <StoragePanel />
      </section>

      {/* ── Retention & System Maintenance 2-Column Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectionRetentionPanel />

        <div className="space-y-6">
          <DbHygienePanel />
          <ReconcilePanel />
        </div>
      </div>
    </FadeIn>
  );
}
