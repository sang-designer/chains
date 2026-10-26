"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { OuterJoinTable } from "@/components/chains/outer-join-table";
import { FilterBar } from "@/components/chains/filter-bar";
import { BulkActionsMenu } from "@/components/chains/bulk-actions-menu";
import { ChainHeader } from "@/components/chains/chain-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  OuterJoinRow,
  BulkOperationType,
  EPW,
  ChainFilters,
} from "@/types/chain";
import {
  generateMockDataForChain,
} from "@/lib/mock-data";
import { getChainName } from "@/lib/mock-chains";

export default function ChainPage() {
  const params = useParams();

  const chainId = params.chainId as string;
  const chainName = getChainName(chainId);

  // Generate chain-specific mock data
  const mockData = generateMockDataForChain(chainId);

  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ChainFilters>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  
  // Use chain-specific mock data
  const [rows, setRows] = useState<OuterJoinRow[]>(mockData.rows);
  const [epws, setEpws] = useState<EPW[]>(mockData.epws);

  // Filter by selected source
  const sourceFilteredRows = selectedSource
    ? rows.filter((row) => row.input?.sourceId === selectedSource)
    : [];

  // Apply column filters
  const columnFilteredRows = sourceFilteredRows.filter((row) => {
    // Search filter from FilterBar
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const name = (row.input?.name || row.venue?.name || "").toLowerCase();
      const address = (row.input?.address || row.venue?.address || "").toLowerCase();
      if (!name.includes(searchLower) && !address.includes(searchLower)) {
        return false;
      }
    }

    // Match status filter
    if (filters.matchStatus && filters.matchStatus.length > 0) {
      if (!filters.matchStatus.includes(row.matchStatus)) {
        return false;
      }
    }

    // Has address filter
    if (filters.hasAddress !== undefined) {
      const hasAddr = !!(row.input?.address || row.venue?.address);
      if (filters.hasAddress !== hasAddr) return false;
    }

    // Pending EPW filter
    if (filters.hasPendingEPW !== undefined) {
      if (filters.hasPendingEPW !== row.hasPendingEPW) return false;
    }

    // Column-specific filters
    for (const [field, value] of Object.entries(columnFilters)) {
      if (!value) continue;
      
      const searchLower = value.toLowerCase();
      let fieldValue = "";
      
      switch (field) {
        case "name":
          fieldValue = (row.input?.name || row.venue?.name || "").toLowerCase();
          break;
        case "address":
          fieldValue = (row.input?.address || row.venue?.address || "").toLowerCase();
          break;
        case "city":
          fieldValue = (row.input?.city || row.venue?.city || "").toLowerCase();
          break;
        case "state":
          fieldValue = (row.input?.state || row.venue?.state || "").toLowerCase();
          break;
        case "zip":
          fieldValue = (row.input?.zip || row.venue?.zip || "").toLowerCase();
          break;
        case "country":
          fieldValue = (row.input?.countryCode || row.venue?.cc || "").toLowerCase();
          break;
        case "status":
          fieldValue = row.matchStatus.toLowerCase();
          break;
      }
      
      if (!fieldValue.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });

  // Apply sorting
  const sortedRows = [...columnFilteredRows].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case "name":
        aVal = a.input?.name || a.venue?.name || "";
        bVal = b.input?.name || b.venue?.name || "";
        break;
      case "address":
        aVal = a.input?.address || a.venue?.address || "";
        bVal = b.input?.address || b.venue?.address || "";
        break;
      case "city":
        aVal = a.input?.city || a.venue?.city || "";
        bVal = b.input?.city || b.venue?.city || "";
        break;
      case "state":
        aVal = a.input?.state || a.venue?.state || "";
        bVal = b.input?.state || b.venue?.state || "";
        break;
      case "zip":
        aVal = a.input?.zip || a.venue?.zip || "";
        bVal = b.input?.zip || b.venue?.zip || "";
        break;
      case "country":
        aVal = a.input?.countryCode || a.venue?.cc || "";
        bVal = b.input?.countryCode || b.venue?.cc || "";
        break;
      case "status":
        aVal = a.matchStatus || "";
        bVal = b.matchStatus || "";
        break;
      default:
        return 0;
    }

    if (typeof aVal === "string" && typeof bVal === "string") {
      const comparison = aVal.localeCompare(bVal);
      return sortDirection === "asc" ? comparison : -comparison;
    }

    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleColumnFilter = (field: string, value: string) => {
    setColumnFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRowSelectionChange = (rowId: string, selected: boolean) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedRows(new Set(sortedRows.map((row) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkAction = async (
    action: BulkOperationType,
    options?: any
  ) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success(`Successfully executed ${action} on ${selectedRows.size} items`);
    setSelectedRows(new Set());
    setIsLoading(false);

    // Simulate data update based on action
    if (action === "close_venues") {
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (selectedRows.has(row.id) && row.venue) {
            return {
              ...row,
              venue: { ...row.venue, closed: true },
            };
          }
          return row;
        })
      );
    }
  };

  const handleEPWResolve = async (epwId: string, action: "approve" | "reject") => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    toast.success(`EPW ${action}ed successfully`);
    
    // Remove resolved EPW
    setEpws((prevEpws) => prevEpws.filter((epw) => epw._id.toString() !== epwId));
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        <ChainHeader
          chainId={chainId}
          chainName={chainName}
        />

        {/* Source Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Data Source</CardTitle>
            <CardDescription>
              Choose a source to view and manage location data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a source..." />
                </SelectTrigger>
                <SelectContent>
                  {mockData.sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.charAt(0).toUpperCase() + source.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSource && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedSource("");
                    setColumnFilters({});
                    setSelectedRows(new Set());
                  }}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Table - Only shown when source is selected */}
        {selectedSource && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                sources={[]}
              />

              <div className="flex gap-2">
                <BulkActionsMenu
                  selectedCount={selectedRows.size}
                  onAction={handleBulkAction}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Showing {sortedRows.length} locations from <span className="font-semibold">{selectedSource}</span>
              {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                Loading...
              </div>
            ) : (
              <OuterJoinTable
                data={sortedRows}
                selectedRows={selectedRows}
                onRowSelectionChange={handleRowSelectionChange}
                onSelectAll={handleSelectAll}
                onSort={handleSort}
                sortField={sortField}
                sortDirection={sortDirection}
                columnFilters={columnFilters}
                onColumnFilter={handleColumnFilter}
              />
            )}

            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const refreshedData = generateMockDataForChain(chainId);
                  setRows(refreshedData.rows);
                  setColumnFilters({});
                  setFilters({});
                  toast.info("Data refreshed");
                }}
              >
                Refresh Data
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
