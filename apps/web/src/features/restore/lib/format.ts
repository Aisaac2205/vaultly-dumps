export function formatNumber(n: number): string {
  return n.toLocaleString("es-AR");
}

export function formatTimestamp(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
