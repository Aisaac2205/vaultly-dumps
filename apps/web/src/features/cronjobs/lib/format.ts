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

/**
 * Compact relative time for "next run" stats: a big number + small unit
 * ("2" + "h"), so the value stays punchy and never overflows the card.
 */
export function nextRunParts(
  isoDate: string | null | undefined,
): { value: string; unit: string } {
  if (!isoDate) return { value: "—", unit: "" };
  const diffMs = new Date(isoDate).getTime() - Date.now();
  if (diffMs <= 0) return { value: "ahora", unit: "" };
  const min = Math.round(diffMs / 60_000);
  if (min < 60) return { value: String(min), unit: "min" };
  const h = Math.round(min / 60);
  if (h < 24) return { value: String(h), unit: "h" };
  const d = Math.round(h / 24);
  return { value: String(d), unit: "d" };
}
