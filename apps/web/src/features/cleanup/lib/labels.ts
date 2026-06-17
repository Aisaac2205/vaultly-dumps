import type { BackupCategory } from "@/types/backup.types";

export const CATEGORY_LABELS: Record<BackupCategory, string> = {
  manual: "Manuales",
  hourly: "Por hora",
  daily: "Diarios",
  weekly: "Semanales",
  custom: "Personalizados",
};
