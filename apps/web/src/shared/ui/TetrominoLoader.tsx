import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/shared/lib/cn";

export type TetrominoSize = "sm" | "md" | "lg";

export interface TetrominoLoaderProps {
  label?: string;
  sublabel?: string;
  className?: string;
  size?: TetrominoSize;
}

const sizeConfig: Record<TetrominoSize, { scale: string; containerHeight: string }> = {
  sm: { scale: "scale-[0.5]", containerHeight: "h-24" },
  md: { scale: "scale-[0.68]", containerHeight: "h-34" },
  lg: { scale: "scale-100", containerHeight: "h-48" },
};

export function TetrominoLoader({
  label,
  sublabel,
  className,
  size = "md",
}: TetrominoLoaderProps) {
  const currentConfig = sizeConfig[size] ?? sizeConfig.md;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label ?? "Cargando..."}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center select-none py-4",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center overflow-visible",
          currentConfig.containerHeight,
        )}
      >
        <div
          className={cn(
            "tetrominos-container origin-center transition-transform",
            currentConfig.scale,
          )}
        >
          <div className="tetromino box1" />
          <div className="tetromino box2" />
          <div className="tetromino box3" />
          <div className="tetromino box4" />
        </div>
      </div>

      {label && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-3 text-sm font-medium text-text-primary tracking-tight"
        >
          {label}
        </motion.p>
      )}

      {sublabel && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.06 }}
          className="mt-1 max-w-xs text-xs text-muted-foreground leading-relaxed"
        >
          {sublabel}
        </motion.p>
      )}
    </motion.div>
  );
}

export interface GlobalLoadingOverlayProps {
  open: boolean;
  label?: string;
  sublabel?: string;
  size?: TetrominoSize;
}

export function GlobalLoadingOverlay({
  open,
  label,
  sublabel,
  size = "md",
}: GlobalLoadingOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/15 dark:bg-black/40 backdrop-blur-[2px] p-4 select-none pointer-events-auto"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center justify-center"
          >
            <TetrominoLoader label={label} sublabel={sublabel} size={size} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
