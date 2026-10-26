"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowUpDown } from "lucide-react";
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
import { MOCK_CHAINS } from "@/lib/mock-chains";

const ITEMS_PER_PAGE = 10;

export default function ChainsListPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"name" | "venueCount">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter chains based on search
  const filteredChains = MOCK_CHAINS.filter((chain) => {
    const searchLower = searchQuery.toLowerCase();
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
              <div className="text-2xl font-bold">4,984</div>
              <p className="text-xs text-muted-foreground">Total Chains</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">456,987</div>
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
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-8"
                  />
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
                  {paginatedChains.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No chains found matching &quot;{searchQuery}&quot;
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedChains.map((chain) => (
                      <TableRow
                        key={chain.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/chains/${chain.id}`)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedChains.length)} of{" "}
                  {sortedChains.length} chains
                </div>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
