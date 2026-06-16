import { PageHeader } from "@/shared/ui/page-header";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { StoragePanel } from "./components/StoragePanel";
import { CleanupForm } from "./components/CleanupForm";
import { ManualRetentionSettings } from "./components/ManualRetentionSettings";
import { DbHygienePanel } from "./components/DbHygienePanel";
import { ReconcilePanel } from "./components/ReconcilePanel";

export default function CleanupPage() {
  return (
    <FadeIn className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Limpieza"
        subtitle="Mirá cuánto ocupás y mantené la Base de Datos y el Almacenamiento R2 sin dumps viejos ni restos."
      />

      {/* ── Stats ────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Almacenamiento
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Cuánto espacio ocupan tus dumps en R2, agrupado por conexión.
          </p>
        </div>
        <StoragePanel />
      </section>

      {/* ── Limpieza puntual ─────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Limpieza puntual
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Borrado puntual de una conexión y tipo, con vista previa del espacio
            a liberar.
          </p>
        </div>
        <CleanupForm />
      </section>

      {/* ── Limpieza automática ──────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Limpieza automática
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Configurala una vez y se ocupa sola. Los backups programados los
            limpia su cronjob (en Cronjobs → Retención); los manuales, esta
            política.
          </p>
        </div>
        <ManualRetentionSettings />
      </section>

      {/* ── Salud del sistema ────────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Salud del sistema
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Tareas de fondo para mantener la Base de Datos y el Almacenamiento R2
            ordenados. Rara vez vas a necesitarlas.
          </p>
        </div>
        <DbHygienePanel />
        <ReconcilePanel />
      </section>
    </FadeIn>
  );
}
