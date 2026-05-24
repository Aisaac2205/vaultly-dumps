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
}

export function DataTable<T>({
  columns,
  data,
  loading,
  emptyMessage = "No hay datos",
  className,
  compact = false,
}: DataTableProps<T>) {
  const headPadding = compact ? "px-3 py-2" : "px-6 py-4";
  const cellPadding = compact ? "px-3 py-2" : "px-6 py-5";
  const wrapperClass = className ?? "rounded-xl bg-card shadow-sm overflow-hidden";
  const minWidth = compact ? "" : "min-w-[640px]";

  if (loading) {
    return (
      <div className={wrapperClass}>
        <div className="overflow-x-auto">
          <Table className={`${compact ? "" : "table-fixed"} ${minWidth}`}>
            <TableHeader>
              <TableRow>
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={`${headPadding} text-sm font-medium ${col.headerClassName ?? ""}`}
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
                      className={`${cellPadding} ${col.className ?? ""}`}
                    >
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
    <div className={wrapperClass}>
      <div className="overflow-x-auto">
        <Table className={`${compact ? "" : "table-fixed"} ${minWidth}`}>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`${headPadding} text-sm font-medium text-muted-foreground ${col.headerClassName ?? ""}`}
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
                    className={`${cellPadding} align-middle ${col.className ?? ""}`}
                  >
                    {col.accessor(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}