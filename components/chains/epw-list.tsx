"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EPW } from "@/types/chain";

interface EPWListProps {
  epws: EPW[];
  onResolve: (epwId: string, action: "approve" | "reject") => void;
}

export function EPWList({ epws, onResolve }: EPWListProps) {
  const [open, setOpen] = useState(false);

  const groupedEPWs = epws.reduce((acc, epw) => {
    const type = epw.proposalType || "unknown";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(epw);
    return acc;
  }, {} as Record<string, EPW[]>);

  const getProposalTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      link: "Link Input to Venue",
      unlink: "Unlink Input from Venue",
      merge: "Merge Venues",
      close: "Close Venue",
      field_update: "Update Field",
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          Pending EPWs ({epws.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Proposal Workflows</DialogTitle>
          <DialogDescription>
            Review and approve or reject pending edit proposals for this chain.
          </DialogDescription>
        </DialogHeader>

        {epws.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No pending EPWs
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEPWs).map(([type, typeEPWs]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold mb-2">
                  {getProposalTypeLabel(type)} ({typeEPWs.length})
                </h3>
                <div className="space-y-2">
                  {typeEPWs.map((epw) => (
                    <Card key={epw._id.toString()}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-sm">
                              {epw.field
                                ? `Update ${epw.field}`
                                : getProposalTypeLabel(epw.proposalType)}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {epw.sourceId} / {epw.foreignId}
                              {epw.venueId && ` → ${epw.venueId}`}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              epw.status === "pending"
                                ? "outline"
                                : epw.status === "approved"
                                ? "default"
                                : "outline"
                            }
                            className={
                              epw.status === "pending"
                                ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100"
                                : epw.status === "approved"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-100"
                            }
                          >
                            {epw.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      {(epw.proposedValue !== undefined ||
                        epw.currentValue !== undefined) && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Current Value
                              </div>
                              <div className="font-mono text-xs">
                                {epw.currentValue !== undefined
                                  ? JSON.stringify(epw.currentValue)
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">
                                Proposed Value
                              </div>
                              <div className="font-mono text-xs">
                                {epw.proposedValue !== undefined
                                  ? JSON.stringify(epw.proposedValue)
                                  : "—"}
                              </div>
                            </div>
                          </div>
                          {epw.status === "pending" && (
                            <>
                              <Separator className="my-3" />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() =>
                                    onResolve(epw._id.toString(), "approve")
                                  }
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    onResolve(epw._id.toString(), "reject")
                                  }
                                >
                                  <XCircle className="mr-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            </>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
