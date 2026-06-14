import * as React from "react";
import { X, Filter } from "lucide-react";
import { Popover as PopoverPrimitive, Select as SelectPrimitive } from "radix-ui";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { BadgeDot, type BadgeDotTone } from "@/shared/ui/badge";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "search" | "select" | "dateRange";
  options?: FilterOption[];
}

interface FiltersContextValue {
  filters: Record<string, string>;
  pendingFilters: Record<string, string>;
  setFilter: (key: string, value: string | undefined) => void;
  removeFilter: (key: string) => void;
  clearAll: () => void;
  applyPending: () => void;
  activeCount: number;
  registerConfig: (config: FilterConfig) => void;
  configs: Map<string, FilterConfig>;
  getFilterValue: (key: string) => string;
}

const FiltersContext = React.createContext<FiltersContextValue | null>(null);

function useFiltersContext() {
  const ctx = React.useContext(FiltersContext);
  if (!ctx) {
    throw new Error("Filters compound components must be used within <Filters.Root>");
  }
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Filters.Root                                                              */
/* -------------------------------------------------------------------------- */

export interface FiltersRootProps {
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
  children: React.ReactNode;
}

function FiltersRoot({ filters, onFiltersChange, children }: FiltersRootProps) {
  const [configMap, setConfigMap] = React.useState<Map<string, FilterConfig>>(new Map());
  const [pendingFilters, setPendingFilters] = React.useState<Record<string, string>>({});

  const activeCount = Object.keys(filters).filter(
    (k) => filters[k] !== undefined && filters[k] !== "",
  ).length;

  const getFilterValue = React.useCallback(
    (key: string): string => {
      return pendingFilters[key] ?? filters[key] ?? "";
    },
    [pendingFilters, filters],
  );

  const setFilter = React.useCallback(
    (key: string, value: string | undefined) => {
      const next = { ...filters };
      if (value === undefined || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      setPendingFilters((prev) => {
        const nextPending = { ...prev };
        delete nextPending[key];
        return nextPending;
      });
      onFiltersChange(next);
    },
    [filters, onFiltersChange],
  );

  const removeFilter = React.useCallback(
    (key: string) => {
      setFilter(key, undefined);
    },
    [setFilter],
  );

  const clearAll = React.useCallback(() => {
    setPendingFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const applyPending = React.useCallback(() => {
    const merged = { ...filters, ...pendingFilters };
    Object.keys(merged).forEach((k) => {
      if (merged[k] === "" || merged[k] === undefined) {
        delete merged[k];
      }
    });
    onFiltersChange(merged);
    setPendingFilters({});
  }, [filters, pendingFilters, onFiltersChange]);

  const registerConfig = React.useCallback(
    (config: FilterConfig) => {
      setConfigMap((prev) => {
        const next = new Map(prev);
        next.set(config.key, config);
        return next;
      });
    },
    [],
  );

  const ctxValue = React.useMemo<FiltersContextValue>(
    () => ({
      filters,
      pendingFilters,
      setFilter,
      removeFilter,
      clearAll,
      applyPending,
      activeCount,
      registerConfig,
      configs: configMap,
      getFilterValue,
    }),
    [
      filters,
      pendingFilters,
      setFilter,
      removeFilter,
      clearAll,
      applyPending,
      activeCount,
      registerConfig,
      configMap,
      getFilterValue,
    ],
  );

  return (
    <FiltersContext.Provider value={ctxValue}>
      <PopoverPrimitive.Root>{children}</PopoverPrimitive.Root>
    </FiltersContext.Provider>
  );
}
FiltersRoot.displayName = "Filters.Root";

/* -------------------------------------------------------------------------- */
/*  Filters.Trigger                                                           */
/* -------------------------------------------------------------------------- */

export interface FiltersTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

function FiltersTrigger({ className, children, ...props }: FiltersTriggerProps) {
  const { activeCount } = useFiltersContext();

  return (
    <PopoverPrimitive.Trigger asChild>
      <button
        className={cn(
          "inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors",
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            <Filter className="h-4 w-4" />
            Filtros
          </>
        )}
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-accent-foreground min-w-[20px] h-5">
            {activeCount}
          </span>
        )}
      </button>
    </PopoverPrimitive.Trigger>
  );
}
FiltersTrigger.displayName = "Filters.Trigger";

/* -------------------------------------------------------------------------- */
/*  Filters.Popover                                                           */
/* -------------------------------------------------------------------------- */

export interface FiltersPopoverProps
  extends React.ComponentProps<typeof PopoverPrimitive.Content> {
  children: React.ReactNode;
}

function FiltersPopover({ className, children, ...props }: FiltersPopoverProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align="start"
        sideOffset={8}
        className={cn(
          "z-50 w-80 origin-(--radix-popover-content-transform-origin) rounded-xl bg-popover p-4 text-popover-foreground shadow-lg outline-hidden duration-200 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        <div className="flex flex-col gap-4">{children}</div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
FiltersPopover.displayName = "Filters.Popover";

/* -------------------------------------------------------------------------- */
/*  Filters.Search                                                            */
/* -------------------------------------------------------------------------- */

export interface FiltersSearchProps {
  filterKey: string;
  label?: string;
  placeholder?: string;
}

function FiltersSearch({ filterKey, label, placeholder = "Buscar..." }: FiltersSearchProps) {
  const { setFilter, getFilterValue, registerConfig } = useFiltersContext();
  const initialValue = getFilterValue(filterKey);
  const [localValue, setLocalValue] = React.useState(initialValue);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  React.useEffect(() => {
    registerConfig({ key: filterKey, label: label ?? filterKey, type: "search" });
    // Only run on mount / filterKey change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, label]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setFilter(filterKey, value || undefined);
    }, 300);
  };

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-medium text-muted-foreground">{label}</span>}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
FiltersSearch.displayName = "Filters.Search";

/* -------------------------------------------------------------------------- */
/*  Filters.Select                                                            */
/* -------------------------------------------------------------------------- */

export interface FiltersSelectProps {
  filterKey: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
}

function FiltersSelect({ filterKey, label, options, placeholder = "Seleccionar..." }: FiltersSelectProps) {
  const { setFilter, getFilterValue, registerConfig } = useFiltersContext();

  React.useEffect(() => {
    registerConfig({ key: filterKey, label, type: "select", options });
    // Only run on mount / filterKey change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, label]);

  const currentValue = getFilterValue(filterKey);

  const handleValueChange = (value: string) => {
    setFilter(filterKey, value || undefined);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <SelectPrimitive.Root value={currentValue} onValueChange={handleValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
            "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            !currentValue && "text-muted-foreground",
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon className="ml-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-muted-foreground"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className="z-50 min-w-[var(--radix-select-trigger-width)] max-h-60 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md"
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((opt) => (
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <SelectPrimitive.ItemIndicator className="absolute left-2 inline-flex items-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </SelectPrimitive.ItemIndicator>
                  <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}
FiltersSelect.displayName = "Filters.Select";

/* -------------------------------------------------------------------------- */
/*  Filters.DateRange                                                         */
/* -------------------------------------------------------------------------- */

export interface FiltersDateRangeProps {
  filterKey: string;
  label: string;
}

function FiltersDateRange({ filterKey, label }: FiltersDateRangeProps) {
  const { setFilter, getFilterValue, registerConfig } = useFiltersContext();

  React.useEffect(() => {
    registerConfig({ key: filterKey, label, type: "dateRange" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, label]);

  const currentValue = getFilterValue(filterKey);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(filterKey, e.target.value || undefined);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type="date"
        value={currentValue}
        onChange={handleChange}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  );
}
FiltersDateRange.displayName = "Filters.DateRange";

/* -------------------------------------------------------------------------- */
/*  Filters.ActiveChips                                                       */
/* -------------------------------------------------------------------------- */

export interface FiltersActiveChipsProps {
  className?: string;
  tone?: BadgeDotTone;
}

function FiltersActiveChips({ className, tone = "info" }: FiltersActiveChipsProps) {
  const { filters, removeFilter, configs } = useFiltersContext();

  const activeEntries = Object.entries(filters).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (activeEntries.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {activeEntries.map(([key, value]) => {
        const config = configs.get(key);
        const displayLabel = config?.label ?? key;
        const displayValue =
          config?.type === "select"
            ? config.options?.find((o) => o.value === value)?.label ?? value
            : value;

        return (
          <Badge key={key} variant="outline" size="sm" className="gap-1.5">
            <BadgeDot tone={tone} />
            <span className="max-w-[120px] truncate">
              {displayLabel}: {displayValue}
            </span>
            <button
              type="button"
              onClick={() => removeFilter(key)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted transition-colors"
              aria-label={`Eliminar filtro ${displayLabel}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
FiltersActiveChips.displayName = "Filters.ActiveChips";

/* -------------------------------------------------------------------------- */
/*  Filters.Apply                                                             */
/* -------------------------------------------------------------------------- */

export interface FiltersApplyProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

function FiltersApply({ className, children = "Apply", ...props }: FiltersApplyProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
FiltersApply.displayName = "Filters.Apply";

/* -------------------------------------------------------------------------- */
/*  Exports                                                                   */
/* -------------------------------------------------------------------------- */

export const Filters = {
  Root: FiltersRoot,
  Trigger: FiltersTrigger,
  Popover: FiltersPopover,
  Search: FiltersSearch,
  Select: FiltersSelect,
  DateRange: FiltersDateRange,
  ActiveChips: FiltersActiveChips,
  Apply: FiltersApply,
};
