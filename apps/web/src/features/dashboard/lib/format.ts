export { formatSize } from "@/shared/lib/format";

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function shortId(id: string): string {
  return id.slice(0, 8);
}

export function formatRelativeTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin}m`;
  if (diffHr < 24) return `Hace ${diffHr}h`;
  return `Hace ${diffDay}d`;
}

/**
 * Formats a future timestamp as a human-friendly relative phrase in Spanish.
 * Used for "Próximos Cronjobs" card to show when the next run will happen.
 *
 * - <1 min → "Ahora"
 * - <60 min → "En Xm"
 * - <24 h  → "En Xh"
 * - <7 d   → "Mañana HH:MM" or weekday + "HH:MM"
 * - ≥7 d   → "DD MMM HH:MM"
 */
export function formatUpcomingTime(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);

  if (diffMin <= 0) return "Ahora";
  if (diffMin < 60) return `En ${diffMin}m`;
  if (diffHr < 24) return `En ${diffHr}h`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const time = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDay === 1) return `Mañana ${time}`;
  if (diffDay < 7) {
    const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(date);
    return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${time}`;
  }
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date) + (sameYear ? "" : ` ${date.getFullYear()}`);
}
