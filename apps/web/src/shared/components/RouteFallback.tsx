import { motion } from "motion/react";
import { TetrominoLoader } from "@/shared/ui/TetrominoLoader";
import { useTranslation } from "react-i18next";

export function RouteFallback() {
  const { t } = useTranslation("common");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-[calc(100vh-9rem)] w-full flex-col items-center justify-center p-8"
    >
      <TetrominoLoader
        size="md"
        label={t("route.loading", { defaultValue: "Cargando..." })}
      />
    </motion.div>
  );
}
