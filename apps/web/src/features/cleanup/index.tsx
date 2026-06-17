import { PageHeader } from "@/shared/ui/page-header";
import { FadeIn } from "@/shared/ui/motion/FadeIn";
import { StoragePanel } from "./components/StoragePanel";
import { ConnectionRetentionPanel } from "./components/ConnectionRetentionPanel";
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

      {/* ── Política de retención ────────────────────── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Política de retención
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Configurá por conexión y tipo de dump cuántos días conservar. Con
            vista previa del espacio a liberar y ejecución manual.
          </p>
        </div>
        <ConnectionRetentionPanel />
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
