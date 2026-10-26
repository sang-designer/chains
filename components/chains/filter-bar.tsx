"use client";

import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { ChainFilters, MatchStatus } from "@/types/chain";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: ChainFilters;
  onFiltersChange: (filters: ChainFilters) => void;
  sources?: string[];
}

type DateRangePreset = "7days" | "30days" | "all" | "custom";

export function FilterBar({
  filters,
  onFiltersChange,
  sources = [],
}: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const updateFilter = <K extends keyof ChainFilters>(
    key: K,
    value: ChainFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setDateRangePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const activeFilterCount = Object.keys(filters).filter(
    (key) => filters[key as keyof ChainFilters] !== undefined
  ).length;

  const matchStatusOptions: { value: MatchStatus; label: string }[] = [
    { value: "matched", label: "Matched" },
    { value: "input_only", label: "Input Only" },
    { value: "venue_only", label: "Venue Only" },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Source Filter */}
      {sources.length > 0 && (
        <Select
          value={filters.source}
          onValueChange={(value) =>
            updateFilter("source", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Advanced Filters Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
            <SheetDescription>
              Refine your results using the filters below
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Match Status Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Match Status</Label>
                {filters.matchStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => updateFilter("matchStatus", undefined)}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {matchStatusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-center text-xs",
                      filters.matchStatus?.includes(option.value) && "border-2 border-foreground"
                    )}
                    onClick={() =>
                      updateFilter(
                        "matchStatus",
                        filters.matchStatus?.includes(option.value)
                          ? undefined
                          : [option.value]
                      )
                    }
                  >
                    {filters.matchStatus?.includes(option.value) && (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Address & EPW Quick Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Quick Filters</Label>
              <div className="space-y-2">
                {/* Address Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.hasAddress === true && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "hasAddress",
                          filters.hasAddress === true ? undefined : true
                        )
                      }
                    >
                      {filters.hasAddress === true && <Check className="mr-1 h-3 w-3" />}
                      Has
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.hasAddress === false && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "hasAddress",
                          filters.hasAddress === false ? undefined : false
                        )
                      }
                    >
                      {filters.hasAddress === false && <Check className="mr-1 h-3 w-3" />}
                      Empty
                    </Button>
                  </div>
                </div>

                {/* EPW Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">EPW</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.hasPendingEPW === true && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "hasPendingEPW",
                          filters.hasPendingEPW === true ? undefined : true
                        )
                      }
                    >
                      {filters.hasPendingEPW === true && <Check className="mr-1 h-3 w-3" />}
                      Pending
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.hasPendingEPW === false && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "hasPendingEPW",
                          filters.hasPendingEPW === false ? undefined : false
                        )
                      }
                    >
                      {filters.hasPendingEPW === false && <Check className="mr-1 h-3 w-3" />}
                      None
                    </Button>
                  </div>
                </div>

                {/* Duplicate Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duplicates</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.isDuplicate === true && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "isDuplicate",
                          filters.isDuplicate === true ? undefined : true
                        )
                      }
                    >
                      {filters.isDuplicate === true && <Check className="mr-1 h-3 w-3" />}
                      Only
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-7 px-2 text-xs",
                        filters.isDuplicate === false && "border-2 border-foreground"
                      )}
                      onClick={() =>
                        updateFilter(
                          "isDuplicate",
                          filters.isDuplicate === false ? undefined : false
                        )
                      }
                    >
                      {filters.isDuplicate === false && <Check className="mr-1 h-3 w-3" />}
                      Exclude
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Date Range */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Date Range</Label>
                {filters.dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      updateFilter("dateRange", undefined);
                      setDateRangePreset("all");
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-xs",
                    dateRangePreset === "7days" && "border-2 border-foreground"
                  )}
                  onClick={() => {
                    setDateRangePreset("7days");
                    updateFilter("dateRange", {
                      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      end: new Date(),
                    });
                  }}
                >
                  {dateRangePreset === "7days" && <Check className="mr-1 h-3 w-3" />}
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "justify-start text-xs",
                    dateRangePreset === "30days" && "border-2 border-foreground"
                  )}
                  onClick={() => {
                    setDateRangePreset("30days");
                    updateFilter("dateRange", {
                      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                      end: new Date(),
                    });
                  }}
                >
                  {dateRangePreset === "30days" && <Check className="mr-1 h-3 w-3" />}
                  Last 30 Days
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-full justify-start text-xs",
                  dateRangePreset === "all" && "border-2 border-foreground"
                )}
                onClick={() => {
                  setDateRangePreset("all");
                  updateFilter("dateRange", undefined);
                  setCustomStartDate("");
                  setCustomEndDate("");
                }}
              >
                {dateRangePreset === "all" && <Check className="mr-1 h-3 w-3" />}
                All Time
              </Button>

              {/* Custom Range */}
              <div className="space-y-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "w-full justify-start text-xs",
                    dateRangePreset === "custom" && "border-2 border-foreground"
                  )}
                  onClick={() => setDateRangePreset("custom")}
                >
                  {dateRangePreset === "custom" && <Check className="mr-1 h-3 w-3" />}
                  Custom Range
                </Button>

                {dateRangePreset === "custom" && (
                  <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          if (e.target.value && customEndDate) {
                            updateFilter("dateRange", {
                              start: new Date(e.target.value),
                              end: new Date(customEndDate),
                            });
                          }
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          if (customStartDate && e.target.value) {
                            updateFilter("dateRange", {
                              start: new Date(customStartDate),
                              end: new Date(e.target.value),
                            });
                          }
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
              >
                Clear All
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
