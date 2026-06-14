import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Skeleton } from "@/shared/ui/skeleton";
import { type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface Column<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
  /** Slot rendered below the table for pagination or other footer controls. */
  pagination?: ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No hay datos",
  className,
  compact = false,
  pagination,
}: DataTableProps<T>) {
  const headPadding = compact ? "px-3 py-2" : "px-6 py-4";
  const cellPadding = compact ? "px-3 py-2" : "px-6 py-5";
  const wrapperClass = className ?? "rounded-xl bg-card shadow-sm overflow-hidden";
  const minWidth = compact ? "" : "min-w-[360px]";

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className="overflow-x-auto">
          <Table className={minWidth}>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={cn(headPadding, "text-sm font-medium truncate", col.headerClassName)}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: 5 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <TableCell
                      key={colIdx}
                      className={cn(cellPadding, col.className)}
                    >
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="flex items-center justify-end border-t px-4 py-3">
            {pagination}
          </div>
        )}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        wrapperClass,
        "[&_tbody]:[[data-loaded]_&]:opacity-100 @starting-style:[&_tbody]:[[data-loaded]_&]:opacity-0",
        "[&_tbody]:transition-opacity [&_tbody]:duration-[var(--duration-normal)]",
      )}
      data-loaded=""
    >
      <div className="overflow-x-auto">
        <Table className={minWidth}>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={cn(headPadding, "text-sm font-medium text-muted-foreground truncate", col.headerClassName)}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.map((item, rowIdx) => (
              <TableRow
                key={rowIdx}
                className="transition-colors hover:bg-muted/30"
              >
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    className={cn(cellPadding, "align-middle", col.className)}
                  >
                    {col.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && (
        <div className="flex items-center justify-end border-t px-4 py-3">
          {pagination}
        </div>
      )}
    </div>
  );
}