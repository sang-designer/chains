"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, ArrowUpDown, Filter as FilterIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OuterJoinRow } from "@/types/chain";
import { AttributeComparePanel } from "./attribute-compare-panel";
import { cn } from "@/lib/utils";

interface OuterJoinTableProps {
  data: OuterJoinRow[];
  selectedRows: Set<string>;
  onRowSelectionChange: (rowId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  columnFilters?: Record<string, string>;
  onColumnFilter?: (field: string, value: string) => void;
}

export function OuterJoinTable({
  data,
  selectedRows,
  onRowSelectionChange,
  onSelectAll,
  onSort,
  sortField = "",
  sortDirection = "asc",
  columnFilters = {},
  onColumnFilter,
}: OuterJoinTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const allSelected =
    data.length > 0 && data.every((row) => selectedRows.has(row.id));
  const someSelected = data.some((row) => selectedRows.has(row.id));

  const getStatusBadge = (status: OuterJoinRow["matchStatus"]) => {
    switch (status) {
      case "matched":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100">Matched</Badge>;
      case "input_only":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100">Input Only</Badge>;
      case "venue_only":
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-100">Venue Only</Badge>;
    }
  };

  const getDisplayName = (row: OuterJoinRow) => {
    const inputName = row.input?.name;
    const venueName = row.venue?.name;
    
    if (inputName && venueName) {
      if (inputName === venueName) {
        return inputName;
      }
      return (
        <div className="space-y-1">
          <div className="font-medium">{inputName}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span>vs</span>
            <span>{venueName}</span>
          </div>
        </div>
      );
    }
    
    if (inputName) return inputName;
    if (venueName) return venueName;
    return "—";
  };

  const getDisplayAddress = (row: OuterJoinRow) => {
    const inputAddr = row.input?.address;
    const inputCity = row.input?.city;
    const venueAddr = row.venue?.address;
    const venueCity = row.venue?.city;
    
    if (inputAddr && venueAddr && inputAddr !== venueAddr) {
      return (
        <div className="space-y-1">
          <div className="text-sm">{inputAddr}{inputCity ? `, ${inputCity}` : ""}</div>
          <div className="text-xs text-muted-foreground">
            {venueAddr}{venueCity ? `, ${venueCity}` : ""}
          </div>
        </div>
      );
    }
    
    if (inputAddr) {
      return `${inputAddr}${inputCity ? ", " + inputCity : ""}`;
    }
    if (venueAddr) {
      return `${venueAddr}${venueCity ? ", " + venueCity : ""}`;
    }
    return "—";
  };

  const FilterableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => {
    const hasFilter = columnFilters[field] && columnFilters[field].length > 0;
    const isCurrentSort = sortField === field;
    const fieldLabel = String(children || field);

    return (
      <TableHead>
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium">{children}</span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
              onClick={() => onSort?.(field)}
            >
              <ArrowUpDown className={cn(
                "h-3.5 w-3.5",
                isCurrentSort ? "text-primary" : "text-muted-foreground"
              )} />
            </Button>
            <Popover open={openPopover === field} onOpenChange={(open) => setOpenPopover(open ? field : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-transparent"
                >
                  <FilterIcon className={cn(
                    "h-3.5 w-3.5",
                    hasFilter ? "text-primary fill-primary" : "text-muted-foreground"
                  )} />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-64" 
                align="start"
                onInteractOutside={(e) => {
                  // Prevent closing when clicking inside the popover
                  const target = e.target as HTMLElement;
                  if (target.closest('[role="dialog"]')) {
                    e.preventDefault();
                  }
                }}
              >
                <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Filter by {fieldLabel}</h4>
                    <Input
                      placeholder={`Search ${fieldLabel.toLowerCase()}...`}
                      value={columnFilters[field] || ""}
                      onChange={(e) => onColumnFilter?.(field, e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                  </div>
                  {hasFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        onColumnFilter?.(field, "");
                        setOpenPopover(null);
                      }}
                    >
                      Clear Filter
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
                aria-label="Select all"
                className={someSelected && !allSelected ? "opacity-50" : ""}
              />
            </TableHead>
            <TableHead className="w-12"></TableHead>
            <FilterableHeader field="name">Name</FilterableHeader>
            <FilterableHeader field="address">Address</FilterableHeader>
            <FilterableHeader field="city">City</FilterableHeader>
            <FilterableHeader field="state">State</FilterableHeader>
            <FilterableHeader field="zip">Zip</FilterableHeader>
            <FilterableHeader field="status">Status</FilterableHeader>
            <TableHead>EPW</TableHead>
            <TableHead>Zyte</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                No data found
              </TableCell>
            </TableRow>
          ) : (
            data.map((row) => {
              const isExpanded = expandedRows.has(row.id);
              const isSelected = selectedRows.has(row.id);

              return (
                <>
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onRowSelectionChange(row.id, !!checked)
                        }
                        aria-label={`Select row ${row.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleRowExpansion(row.id)}
                        className="hover:text-primary"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getDisplayName(row)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getDisplayAddress(row)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.input?.city || row.venue?.city || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.input?.state || row.venue?.state || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.input?.zip || row.venue?.zip || "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(row.matchStatus)}</TableCell>
                    <TableCell>
                      {row.hasPendingEPW && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {row.zyteStatus === "found" && (
                        <span className="text-green-600">✓</span>
                      )}
                      {row.zyteStatus === "not_found" && (
                        <span className="text-amber-600">⚠</span>
                      )}
                      {row.zyteStatus === "closed" && (
                        <span className="text-destructive">✕</span>
                      )}
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-muted/50 p-4">
                        <AttributeComparePanel row={row} />
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
