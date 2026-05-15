export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
