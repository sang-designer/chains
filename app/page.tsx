import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Table2, Filter, GitMerge, FileEdit, AlertTriangle, History } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-4xl">Chains Admin</CardTitle>
          <CardDescription>
            Professional chain management and harmonization tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            Manage venue chains, compare input sources with canonical venues, and perform bulk operations on chain data with full audit logging.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Table2 className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Outer Join View</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare inputs vs venues with match status indicators
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Advanced Filtering</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Filter by status, source, EPW, duplicates, and more
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Bulk Operations</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Merge, move, close venues and manage chains in bulk
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileEdit className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">EPW Management</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Review and approve/reject edit proposals
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Dupe Detection</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Identify and merge duplicate venues
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Audit Logging</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Full audit trail with rollback capability
              </p>
            </div>
          </div>

          <div className="pt-4">
            <Link href="/chains" className="w-full">
              <Button className="w-full" size="lg">
                Browse All Chains
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

