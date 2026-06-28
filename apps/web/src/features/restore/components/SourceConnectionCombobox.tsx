import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Connection } from "../types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import postgresSvg from "@/shared/assets/PostgresSQL.svg";
import mysqlSvg from "@/shared/assets/MySQL.svg";

const DB_LOGOS: Record<string, string> = {
  postgres: postgresSvg as string,
  mysql: mysqlSvg as string,
};

interface SourceConnectionComboboxProps {
  connections: Connection[];
  value: string | null;
  onChange: (slug: string | null) => void;
  disabled?: boolean;
  loading?: boolean;
}

function DbTypeLogo({ dbType }: { dbType: string }) {
  const logo = DB_LOGOS[dbType];
  if (!logo) return null;
  return <img src={logo} alt={dbType} className="size-5 shrink-0" />;
}

export function SourceConnectionCombobox({
  connections,
  value,
  onChange,
  disabled = false,
  loading = false,
}: SourceConnectionComboboxProps) {
  const { t } = useTranslation("restore");
  const [open, setOpen] = useState(false);

  const selected = connections.find((c) => c.slug === value);

  if (loading) {
    return (
      <div className="flex h-10 items-center rounded-xl bg-muted/40 px-3 text-sm text-muted-foreground">
        {t("source.loading")}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label={t("source.ariaSelect")}
          className="h-10 w-full justify-between rounded-xl bg-muted/40 font-normal hover:bg-muted/60"
          disabled={disabled}
        >
          {selected ? (
            <div className="flex min-w-0 items-center gap-2">
              <DbTypeLogo dbType={selected.dbType} />
              <span className="truncate font-medium">{selected.name}</span>
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {selected.environment}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{t("source.placeholder")}</span>
          )}
          <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("source.search")}
            aria-label={t("source.searchAria")}
          />
          <CommandList>
            <CommandEmpty>{t("source.empty")}</CommandEmpty>
            <CommandGroup>
              {connections.map((conn) => {
                const isSelected = value === conn.slug;
                return (
                  <CommandItem
                    key={conn.id}
                    value={`${conn.name} ${conn.slug} ${conn.dbType}`}
                    onSelect={() => {
                      onChange(conn.slug);
                      setOpen(false);
                    }}
                    aria-selected={isSelected}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <DbTypeLogo dbType={conn.dbType} />
                      <span className="truncate font-medium">{conn.name}</span>
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {conn.environment}
                      </span>
                    </div>
                    <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                      {conn.slug}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
