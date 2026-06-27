import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("en") ? "en" : "es";

  const handleChange = (lang: "es" | "en") => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
      <button
        type="button"
        onClick={() => handleChange("es")}
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium transition-colors",
          currentLang === "es"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={currentLang === "es"}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={cn(
          "rounded px-2 py-0.5 text-xs font-medium transition-colors",
          currentLang === "en"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={currentLang === "en"}
      >
        EN
      </button>
    </div>
  );
}
