"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowLeft, Database, FilterX, Inbox, MapPinOff, RotateCw, SearchX } from "lucide-react";
import { OuterJoinTable } from "@/components/chains/outer-join-table";
import { BulkActionsMenu } from "@/components/chains/bulk-actions-menu";
import { ChainHeader } from "@/components/chains/chain-header";
import {
  MergeDuplicatesDialog,
  MergeSelection,
} from "@/components/chains/merge-duplicates-dialog";
import { MoveToChainDialog } from "@/components/chains/move-to-chain-dialog";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, errorMessage } from "@/components/states";
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
} from "@/types/chain";
import { getChainName } from "@/lib/mock-chains";
import { ChainData, fetchChain, runChainAction } from "@/lib/mock-api";

const SWR_OPTIONS = { revalidateOnFocus: false, shouldRetryOnError: false } as const;

/** Bulk actions that change or remove venues ask for confirmation first. */
const CONFIRM_ACTIONS = {
  close_venues: {
    title: (n: number) => `Close ${n} venue${n === 1 ? "" : "s"}?`,
    description:
      "Closed venues stop appearing as open places. Any inputs linked to them are kept.",
    confirm: "Close venues",
    destructive: true,
  },
  remove_from_chain: {
    title: (n: number) => `Remove ${n} venue${n === 1 ? "" : "s"} from this chain?`,
    description:
      "The venues stay in the database but no longer belong to this chain. Matched inputs become input-only rows.",
    confirm: "Remove from chain",
    destructive: true,
  },
} as const;
type ConfirmableAction = keyof typeof CONFIRM_ACTIONS;

const ACTION_LABELS: Partial<Record<BulkOperationType, string>> = {
  close_venues: "Closing venues",
  remove_from_chain: "Removing from chain",
  propose_woe: "Proposing edits",
  merge: "Merging venues",
  move_to_chain: "Moving venues",
};

export default function ChainPage() {
  const params = useParams();
  const chainId = params.chainId as string;
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    ["chain", chainId],
    () => fetchChain(chainId),
    SWR_OPTIONS
  );

  if (isLoading) return <ChainPageSkeleton />;

  if (error && data === undefined) {
    return (
      <PageShell>
        <ChainHeader chainId={chainId} chainName="Chain" />
        <Card>
          <ErrorState
            title="Couldn't load this chain"
            error={error}
            onRetry={() => mutate()}
            retrying={isValidating}
          >
            <Button variant="outline" asChild>
              <Link href="/chains">
                <ArrowLeft aria-hidden="true" />
                All chains
              </Link>
            </Button>
          </ErrorState>
        </Card>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <ChainHeader chainId={chainId} chainName="Chain not found" />
        <Card>
          <EmptyState
            icon={MapPinOff}
            title="Chain not found"
            description={
              <>
                No chain has the ID <span className="font-mono">{chainId}</span>. It may have been
                deleted or merged into another chain, or the link may be wrong.
              </>
            }
            size="lg"
          >
            <Button asChild>
              <Link href="/chains">
                <ArrowLeft aria-hidden="true" />
                Browse all chains
              </Link>
            </Button>
          </EmptyState>
        </Card>
      </PageShell>
    );
  }

  return <ChainWorkspace key={chainId} initialData={data} />;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">{children}</div>
    </div>
  );
}

function ChainPageSkeleton() {
  return (
    <PageShell>
      <div className="space-y-4" aria-busy="true" aria-label="Loading chain">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-9 w-[300px]" />
        </CardContent>
      </Card>
    </PageShell>
  );
}

function ChainWorkspace({ initialData }: { initialData: ChainData }) {
  const { chainId, name: chainName } = initialData;
  const [data, setData] = useState<ChainData>(initialData);

  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  /** Label of the write in flight; the table stays visible but inert. */
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<ConfirmableAction | null>(null);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  const [rows, setRows] = useState<OuterJoinRow[]>(initialData.rows);
  const [epws, setEpws] = useState<EPW[]>(initialData.epws);
  const selectedMergeRows = useMemo(
    () => rows.filter((row) => selectedRows.has(row.id)),
    [rows, selectedRows]
  );

  // Filter by selected source
  const sourceFilteredRows = selectedSource
    ? rows.filter((row) => row.input?.sourceId === selectedSource)
    : [];

  // Apply column filters
  const columnFilteredRows = sourceFilteredRows.filter((row) => {
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
          // Match the badge text people see ("Input Only") as well as the raw value
          fieldValue = `${row.matchStatus} ${row.matchStatus.replace("_", " ")}`;
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

  // Bulk actions should only touch rows the user can see: when a filter,
  // search or source change hides a selected row, drop it from the selection.
  const visibleKey = sortedRows.map((row) => row.id).join("|");
  useEffect(() => {
    const visible = new Set(visibleKey ? visibleKey.split("|") : []);
    setSelectedRows((prev) => {
      const next = new Set([...prev].filter((id) => visible.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [visibleKey]);

  const hasActiveFilters = Object.values(columnFilters).some(Boolean);

  const clearAllFilters = () => {
    setColumnFilters({});
  };

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

  /**
   * Runs a write with one consistent UX: the table stays visible but inert,
   * the Actions button shows progress, success applies the change and clears
   * the selection, and failure keeps everything as it was and offers Retry.
   */
  const perform = async (
    label: string,
    failureTitle: string,
    apply: () => string
  ): Promise<void> => {
    setBusy(label);
    try {
      await runChainAction();
      const message = apply();
      setSelectedRows(new Set());
      toast.success(message);
    } catch (err) {
      toast.error(failureTitle, {
        description: errorMessage(err),
        action: { label: "Retry", onClick: () => perform(label, failureTitle, apply) },
        duration: 10000,
      });
    } finally {
      setBusy(null);
    }
  };

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  const runBulkAction = (action: BulkOperationType, options?: { field?: string }) => {
    const ids = new Set(selectedRows);
    const venueIds = new Set(selectedMergeRows.filter((r) => r.venue).map((r) => r.id));
    const label = ACTION_LABELS[action] ?? "Working";

    if (action === "close_venues") {
      return perform(label, `Couldn't close ${plural(venueIds.size, "venue")}`, () => {
        setRows((prev) =>
          prev.map((row) =>
            venueIds.has(row.id) && row.venue
              ? { ...row, venue: { ...row.venue, closed: true } }
              : row
          )
        );
        return `Closed ${plural(venueIds.size, "venue")}`;
      });
    }

    if (action === "remove_from_chain") {
      return perform(label, `Couldn't remove ${plural(venueIds.size, "venue")}`, () => {
        setRows((prev) => detachVenues(prev, venueIds));
        return `Removed ${plural(venueIds.size, "venue")} from ${chainName}`;
      });
    }

    if (action === "propose_woe") {
      const field = options?.field ?? "field";
      return perform(label, `Couldn't propose ${field} edits`, () => {
        setRows((prev) =>
          prev.map((row) => (ids.has(row.id) ? { ...row, hasPendingEPW: true } : row))
        );
        return `Proposed ${field} edits for ${plural(ids.size, "location")}`;
      });
    }
  };

  const handleBulkAction = (action: BulkOperationType, options?: any) => {
    // Merge first asks which selected venues are actually duplicates.
    if (action === "merge") {
      setMergeDialogOpen(true);
      return;
    }
    // Move first asks which chain the venues should go to.
    if (action === "move_to_chain") {
      setMoveDialogOpen(true);
      return;
    }
    // Destructive actions are confirmed first.
    if (action in CONFIRM_ACTIONS) {
      setPendingConfirm(action as ConfirmableAction);
      return;
    }
    runBulkAction(action, options);
  };

  const handleMergeConfirm = ({ primaryRowId, duplicateRowIds }: MergeSelection) => {
    setMergeDialogOpen(false);
    const primary = rows.find((row) => row.id === primaryRowId);
    const dupes = new Set(duplicateRowIds);

    return perform(ACTION_LABELS.merge!, `Couldn't merge ${plural(dupes.size + 1, "venue")}`, () => {
      // Merged-away venues disappear; their inputs stay, now pointing at the kept venue.
      setRows((prevRows) =>
        prevRows.flatMap((row) => {
          if (!dupes.has(row.id)) return [row];
          if (!row.input || !primary?.venue) return [];
          return [{ ...row, venue: primary.venue, venueId: primary.venueId }];
        })
      );
      return `Merged ${plural(dupes.size, "venue")} into ${primary?.venue?.name || "the kept venue"}`;
    });
  };

  const handleMoveConfirm = (targetChainId: string) => {
    setMoveDialogOpen(false);
    const moving = new Set(selectedMergeRows.filter((row) => row.venue).map((row) => row.id));
    const target = getChainName(targetChainId);

    return perform(
      ACTION_LABELS.move_to_chain!,
      `Couldn't move ${plural(moving.size, "venue")} to ${target}`,
      () => {
        setRows((prev) => detachVenues(prev, moving));
        return `Moved ${plural(moving.size, "venue")} to ${target}`;
      }
    );
  };

  const handleEPWResolve = (epwId: string, action: "approve" | "reject") =>
    perform("Updating proposal", `Couldn't ${action} the proposal`, () => {
      setEpws((prev) => prev.filter((epw) => epw._id.toString() !== epwId));
      return action === "approve" ? "Proposal approved" : "Proposal rejected";
    });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchChain(chainId);
      if (!fresh) {
        toast.error("This chain no longer exists", {
          description: "It may have been deleted or merged while you were working.",
        });
        return;
      }
      setData(fresh);
      setRows(fresh.rows);
      setEpws(fresh.epws);
      setSelectedRows(new Set());
      toast.success("Data refreshed");
    } catch (err) {
      toast.error("Couldn't refresh data", {
        description: `${errorMessage(err)} You're still seeing the previous data.`,
        action: { label: "Retry", onClick: handleRefresh },
      });
    } finally {
      setRefreshing(false);
    }
  };

  const confirmSpec = pendingConfirm ? CONFIRM_ACTIONS[pendingConfirm] : null;
  const selectedVenueCount = selectedMergeRows.filter((r) => r.venue).length;
  const hasSources = data.sources.length > 0;
  const isWorking = !!busy || refreshing;

  const sourceLabel = (source: string) => source.charAt(0).toUpperCase() + source.slice(1);
  const sourceHasRows = sourceFilteredRows.length > 0;

  return (
    <PageShell>
      <ChainHeader chainId={chainId} chainName={chainName} />

      {/* Source Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Data Source</CardTitle>
          <CardDescription>
            Choose a source to view and manage location data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasSources ? (
            <div className="flex items-center gap-4">
              <Select
                value={selectedSource}
                onValueChange={(value) => {
                  setSelectedSource(value);
                  setColumnFilters({});
                }}
                disabled={isWorking}
              >
                <SelectTrigger className="w-[300px]" aria-label="Data source">
                  <SelectValue placeholder="Select a source..." />
                </SelectTrigger>
                <SelectContent>
                  {data.sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {sourceLabel(source)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSource && (
                <Button
                  variant="outline"
                  disabled={isWorking}
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
          ) : (
            <EmptyState
              icon={Database}
              title="No data sources yet"
              description="No source has sent locations for this chain, so there's nothing to compare with its venues yet."
              size="sm"
            >
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? <Loader size="sm" className="text-current" /> : <RotateCw />}
                {refreshing ? "Checking…" : "Check again"}
              </Button>
            </EmptyState>
          )}
        </CardContent>
      </Card>

      {/* Nothing picked yet: say what to do instead of showing a blank page */}
      {hasSources && !selectedSource && (
        <Card>
          <EmptyState
            icon={Inbox}
            title="Choose a data source"
            description="Pick a source above to compare its locations with this chain's venues."
          />
        </Card>
      )}

      {/* Data Table - Only shown when source is selected */}
      {selectedSource && (
        <Card className="p-6 space-y-4">
          {sourceHasRows ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground" aria-live="polite">
                  Showing {sortedRows.length} of {sourceFilteredRows.length}{" "}
                  {sourceFilteredRows.length === 1 ? "location" : "locations"} from{" "}
                  <span className="font-semibold">{sourceLabel(selectedSource)}</span>
                  {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
                  {hasActiveFilters && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-2 h-auto p-0"
                      onClick={clearAllFilters}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>

                <BulkActionsMenu
                  selectedCount={selectedRows.size}
                  venueCount={selectedVenueCount}
                  onAction={handleBulkAction}
                  disabled={refreshing}
                  busyLabel={busy}
                />
              </div>

              <div
                aria-busy={isWorking}
                className={isWorking ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}
              >
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
                  emptyState={
                    <EmptyState
                      icon={SearchX}
                      title="No locations match your filters"
                      description={`None of the ${sourceFilteredRows.length} ${sourceLabel(selectedSource)} locations match. Loosen or clear the filters to see them again.`}
                      size="sm"
                    >
                      <Button variant="outline" onClick={clearAllFilters}>
                        <FilterX aria-hidden="true" />
                        Clear filters
                      </Button>
                    </EmptyState>
                  }
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={Inbox}
              title={`No locations from ${sourceLabel(selectedSource)}`}
              description={`${sourceLabel(selectedSource)} hasn't sent any locations for ${chainName} yet. Try another source, or check again later.`}
            />
          )}

          <div className="flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isWorking}
            >
              {refreshing ? <Loader size="sm" className="text-current" /> : <RotateCw />}
              {refreshing ? "Refreshing…" : "Refresh Data"}
            </Button>
          </div>
        </Card>
      )}

      <MergeDuplicatesDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        selectedRows={selectedMergeRows}
        candidatePool={rows}
        onConfirm={handleMergeConfirm}
      />

      <MoveToChainDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        currentChainId={chainId}
        currentChainName={chainName}
        selectedRows={selectedMergeRows}
        onConfirm={handleMoveConfirm}
      />

      <AlertDialog
        open={!!pendingConfirm}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
      >
        {confirmSpec && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmSpec.title(selectedVenueCount)}</AlertDialogTitle>
              <AlertDialogDescription>
                {confirmSpec.description}
                {selectedRows.size > selectedVenueCount &&
                  ` ${plural(selectedRows.size - selectedVenueCount, "selected row")} without a venue will be skipped.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant={confirmSpec.destructive ? "destructive" : "default"}
                onClick={() => {
                  const action = pendingConfirm!;
                  setPendingConfirm(null);
                  runBulkAction(action);
                }}
              >
                {confirmSpec.confirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </PageShell>
  );
}

/** Takes venues out of this chain: venue-only rows go, matched inputs stay without a venue. */
function detachVenues(rows: OuterJoinRow[], ids: Set<string>): OuterJoinRow[] {
  return rows.flatMap((row): OuterJoinRow[] => {
    if (!ids.has(row.id)) return [row];
    if (!row.input) return [];
    return [{ ...row, matchStatus: "input_only", venue: undefined, venueId: undefined }];
  });
}
