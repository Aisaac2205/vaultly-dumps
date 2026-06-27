import { PageHeader } from "@/shared/ui/page-header";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { useTranslation } from "react-i18next";
import { StoragePanel } from "./components/StoragePanel";
import { ConnectionRetentionPanel } from "./components/ConnectionRetentionPanel";
import { DbHygienePanel } from "./components/DbHygienePanel";
import { ReconcilePanel } from "./components/ReconcilePanel";

export default function CleanupPage() {
  const { t } = useTranslation('cleanup')
  return (
    <FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title={t('page.title')}
        subtitle={t('page.subtitle')}
      />

      {/* ── Stats ────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            {t('section.storage.title')}
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            {t('section.storage.description')}
          </p>
        </div>
        <StoragePanel />
      </section>

      {/* ── Política de retención ────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            {t('section.retention.title')}
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            {t('section.retention.description')}
          </p>
        </div>
        <ConnectionRetentionPanel />
      </section>

      {/* ── Salud del sistema ────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            {t('section.health.title')}
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            {t('section.health.description')}
          </p>
        </div>
        <DbHygienePanel />
        <ReconcilePanel />
      </section>
    </FadeIn>
  );
}
