import { PageHeader } from "@/shared/ui/page-header";
import { CleanupForm } from "./components/CleanupForm";

export default function CleanupPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Limpieza"
        subtitle="Eliminá dumps viejos de R2 y la base de datos, por conexión y tipo."
      />
      <CleanupForm />
    </div>
  );
}
