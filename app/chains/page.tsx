"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Search, ArrowUpDown, Store, SearchX, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  TableSkeletonRows,
  TableStateRow,
} from "@/components/states";
import { fetchChains } from "@/lib/mock-api";

const ITEMS_PER_PAGE = 10;

export default function ChainsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "venueCount">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const {
    data: chains,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR("chains", fetchChains, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });
  const loadFailed = !!error && !chains;
  const noChains = !!chains && chains.length === 0;
  const query = searchQuery.trim();
  const totalVenues = (chains ?? []).reduce((sum, chain) => sum + chain.venueCount, 0);

  const clearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Filter chains based on search
  const filteredChains = (chains ?? []).filter((chain) => {
    const searchLower = query.toLowerCase();
    return (
      chain.n?.toLowerCase().includes(searchLower) ||
      chain.d?.toLowerCase().includes(searchLower) ||
      chain.tcs?.some((cat) => cat.toLowerCase().includes(searchLower))
    );
  });

  // Sort chains
  const sortedChains = [...filteredChains].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === "name") {
      comparison = (a.n || "").localeCompare(b.n || "");
    } else if (sortField === "venueCount") {
      comparison = a.venueCount - b.venueCount;
    }
    
    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Paginate
  const totalPages = Math.ceil(sortedChains.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedChains = sortedChains.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: "name" | "venueCount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold">Chains Management</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage all venue chains
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{loadFailed ? "—" : formatNumber(chains?.length ?? 0)}</div>
              )}
              <p className="text-xs text-muted-foreground">Total Chains</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{loadFailed ? "—" : formatNumber(totalVenues)}</div>
              )}
              <p className="text-xs text-muted-foreground">Total Venues</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Chains</CardTitle>
                <CardDescription>
                  Click on a chain to view details and manage venues
                </CardDescription>
              </div>
              <div className="w-72">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chains..."
                    aria-label="Search chains"
                    value={searchQuery}
                    disabled={loadFailed || noChains}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && searchQuery) clearSearch();
                    }}
                    className="pl-8 pr-8"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8"
                        disabled={!chains?.length}
                        onClick={() => handleSort("name")}
                      >
                        Chain Name
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Countries</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        disabled={!chains?.length}
                        onClick={() => handleSort("venueCount")}
                      >
                        Venues
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Inputs</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeletonRows
                      rows={8}
                      columns={["w-40", "w-28", "w-20", "ml-auto w-14", "ml-auto w-14", "w-20"]}
                    />
                  ) : loadFailed ? (
                    <TableStateRow colSpan={6}>
                      <ErrorState
                        title="Couldn't load chains"
                        error={error}
                        onRetry={() => mutate()}
                        retrying={isValidating}
                      />
                    </TableStateRow>
                  ) : noChains ? (
                    <TableStateRow colSpan={6}>
                      <EmptyState
                        icon={Store}
                        title="No chains yet"
                        description="Chains will show up here once they exist in the venue database."
                      />
                    </TableStateRow>
                  ) : paginatedChains.length === 0 ? (
                    <TableStateRow colSpan={6}>
                      <EmptyState
                        icon={SearchX}
                        title="No matching chains"
                        description={
                          <>
                            Nothing matches &ldquo;{query}&rdquo; in chain names, descriptions or
                            categories. Check the spelling or try a shorter search.
                          </>
                        }
                      >
                        <Button variant="outline" onClick={clearSearch}>
                          Clear search
                        </Button>
                      </EmptyState>
                    </TableStateRow>
                  ) : (
                    paginatedChains.map((chain) => (
                      <TableRow
                        key={chain.id}
                        className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        tabIndex={0}
                        aria-label={`Open ${chain.n}`}
                        onClick={() => router.push(`/chains/${chain.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") router.push(`/chains/${chain.id}`);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{chain.n}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {chain.d}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {chain.tcs?.slice(0, 2).map((cat, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {chain.countries.slice(0, 3).map((country, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {country}
                              </Badge>
                            ))}
                            {chain.countries.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{chain.countries.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(chain.venueCount)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatNumber(chain.inputCount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(chain.lastUpdated)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Result count + pagination */}
            {sortedChains.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground" aria-live="polite">
                  {totalPages > 1
                    ? `Showing ${startIndex + 1}-${Math.min(startIndex + ITEMS_PER_PAGE, sortedChains.length)} of `
                    : "Showing "}
                  {sortedChains.length} {sortedChains.length === 1 ? "chain" : "chains"}
                  {query && ` matching “${query}”`}
                </div>
                {totalPages > 1 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
