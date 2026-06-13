import { ChevronDown } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { StoragePanel } from "./components/StoragePanel";
import { CleanupForm } from "./components/CleanupForm";
import { ManualRetentionSettings } from "./components/ManualRetentionSettings";
import { DbHygienePanel } from "./components/DbHygienePanel";
import { ReconcilePanel } from "./components/ReconcilePanel";

export default function CleanupPage() {
  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Limpieza"
        subtitle="Mirá cuánto ocupás y mantené la Base de Datos y el Almacenamiento R2 sin dumps viejos ni restos."
      />

      <StoragePanel />

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

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">
            Borrar algo ahora
          </h2>
          <p className="max-w-2xl text-xs text-muted-foreground">
            Borrado puntual de una conexión y tipo, con vista previa del espacio
            a liberar.
          </p>
        </div>
        <CleanupForm />
      </section>

      <details className="group rounded-lg border border-border">
        <summary className="flex cursor-pointer items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-text-primary marker:content-none">
          <span>Mantenimiento avanzado</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-4 border-t border-border p-4">
          <p className="max-w-2xl text-xs text-muted-foreground">
            Tareas de fondo para mantener la Base de Datos y el Almacenamiento R2
            ordenados. Rara vez vas a necesitarlas.
          </p>
          <DbHygienePanel />
          <ReconcilePanel />
        </div>
      </details>
    </div>
  );
}
