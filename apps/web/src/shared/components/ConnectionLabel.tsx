import { useConnections } from "@/features/connections/hooks/useConnections";
import { cn } from "@/shared/lib/cn";
import { EnvironmentBadge } from "@/shared/components/EnvironmentBadge";

interface ConnectionLabelProps {
  id: string;
  name?: string;
  environment?: string;
  className?: string;
  /** Show environment tag next to the name (helps when two connections share a name). */
  showEnv?: boolean;
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

export function ConnectionLabel({
  id,
  name,
  environment,
  className,
  showEnv = false,
}: ConnectionLabelProps) {
  const { data: connections, isLoading } = useConnections();
  const match = connections?.find((c) => c.id === id);

  const resolvedName = name ?? match?.name;
  const resolvedEnv = environment ?? match?.environment;

  if (resolvedName) {
    return (
      <span
        className={cn("inline-flex min-w-0 items-center", className)}
        title={`${resolvedName}${resolvedEnv ? ` · ${resolvedEnv}` : ""} (${id})`}
      >
        <span className="truncate">{resolvedName}</span>
        {showEnv && resolvedEnv && (
          <EnvironmentBadge env={resolvedEnv} size="xs" className="ml-1.5" />
        )}
      </span>
    );
  }

  if (isLoading && !name) {
    return (
      <span
        className={cn("text-muted-foreground italic", className)}
        title={id}
      >
        Cargando…
      </span>
    );
  }

  return (
    <span
      className={cn("text-muted-foreground italic", className)}
      title={`Conexión no disponible (${id})`}
    >
      Conexión eliminada
      <span className="ml-1 font-mono not-italic text-xs opacity-60">
        #{shortId(id)}
      </span>
    </span>
  );
}
