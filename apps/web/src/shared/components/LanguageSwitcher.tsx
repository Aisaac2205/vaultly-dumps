import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import translateIcon from "@/shared/assets/traslate.png";
import { cn } from "@/shared/lib/cn";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "es";
  const nextLang = currentLang === "es" ? "en" : "es";

  const toggleLanguage = () => {
    void i18n.changeLanguage(nextLang);
  };

  return (
    <motion.button
      type="button"
      onClick={toggleLanguage}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group flex h-8 items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 text-xs font-semibold text-muted-foreground shadow-xs transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={`Cambiar idioma (actual: ${currentLang.toUpperCase()})`}
      title={`Cambiar a ${nextLang.toUpperCase()}`}
    >
      <img
        src={translateIcon}
        alt=""
        className="h-4 w-4 object-contain opacity-70 transition-opacity group-hover:opacity-100 dark:invert"
      />
      <span className="uppercase tracking-wider font-mono text-[11px] font-bold">
        {currentLang}
      </span>
    </motion.button>
  );
}

