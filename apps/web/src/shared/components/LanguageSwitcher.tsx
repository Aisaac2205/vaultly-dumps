import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { Languages } from "lucide-react";
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
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "group flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring select-none cursor-pointer",
        className
      )}
      aria-label={currentLang === "es" ? "Cambiar idioma (actual: ES)" : "Change language (current: EN)"}
      title={currentLang === "es" ? "Cambiar a EN" : "Switch to ES"}
    >
      <Languages className="size-4 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
      <span className="uppercase tracking-wider font-mono text-[11px] font-semibold">
        {currentLang}
      </span>
    </motion.button>
  );
}
