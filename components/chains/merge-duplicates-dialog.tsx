"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Merge } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { OuterJoinRow, Venue } from "@/types/chain";

export interface MergeSelection {
  primaryRowId: string;
  duplicateRowIds: string[];
}

interface MergeDuplicatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Rows the user selected before choosing Merge. */
  selectedRows: OuterJoinRow[];
  /** All rows in the chain, searched for look-alikes of the selection. */
  candidatePool: OuterJoinRow[];
  onConfirm: (selection: MergeSelection) => void;
}

type Step = "review_candidates" | "pick_primary";

interface Candidate {
  row: OuterJoinRow;
  similarTo: OuterJoinRow;
  reasons: string[];
}

// A pair scoring at or above this is offered as a possible duplicate.
const SUGGEST_THRESHOLD = 0.6;

const normalize = (s?: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\bstreet\b/g, "st")
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function distanceMeters(a: Venue, b: Venue): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function scorePair(a: Venue, b: Venue): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const nameA = normalize(a.name);
  const nameB = normalize(b.name);
  if (nameA && nameA === nameB) {
    score += 0.4;
    reasons.push("Same name");
  } else if (nameA && nameB && (nameA.includes(nameB) || nameB.includes(nameA))) {
    score += 0.25;
    reasons.push("Similar name");
  }

  const addrA = normalize(a.address);
  const addrB = normalize(b.address);
  if (addrA && addrA === addrB) {
    score += 0.3;
    reasons.push("Same address");
  } else if (a.zip && a.zip === b.zip) {
    score += 0.1;
    reasons.push("Same zip");
  }

  const dist = distanceMeters(a, b);
  if (dist != null && dist < 150) {
    score += 0.3;
    reasons.push(`${Math.round(dist)}m apart`);
  } else if (dist != null && dist < 500) {
    score += 0.15;
    reasons.push(`${Math.round(dist)}m apart`);
  }

  return { score, reasons };
}

/** Unselected venues in the chain that look like one of the selected venues. */
function findCandidates(selected: OuterJoinRow[], pool: OuterJoinRow[]): Candidate[] {
  const selectedIds = new Set(selected.map((r) => r.id));
  const selectedVenueIds = new Set(selected.map((r) => r.venueId).filter(Boolean));
  const seenVenueIds = new Set<string>();
  const candidates: Candidate[] = [];

  for (const row of pool) {
    if (!row.venue || row.venue.closed || selectedIds.has(row.id)) continue;
    // Several inputs can share one venue: skip ones already selected or listed.
    if (row.venueId && (selectedVenueIds.has(row.venueId) || seenVenueIds.has(row.venueId))) {
      continue;
    }

    let best: Candidate | null = null;
    let bestScore = 0;
    for (const sel of selected) {
      if (!sel.venue) continue;
      const { score, reasons } = scorePair(row.venue, sel.venue);
      if (score > bestScore) {
        bestScore = score;
        best = { row, similarTo: sel, reasons };
      }
    }
    if (best && bestScore >= SUGGEST_THRESHOLD) {
      candidates.push(best);
      if (row.venueId) seenVenueIds.add(row.venueId);
    }
  }
  return candidates;
}

/** Count of filled-in fields, used to default the venue to keep. */
function completeness(v?: Venue): number {
  if (!v) return 0;
  return [v.name, v.address, v.city, v.state, v.zip, v.phone, v.url, v.hours, v.latitude]
    .filter((x) => x != null && x !== "").length;
}

const venueLine = (row: OuterJoinRow) => {
  const v = row.venue;
  const locality = [v?.city, v?.state, v?.zip].filter(Boolean).join(", ");
  return [v?.address, locality].filter(Boolean).join(" · ") || "No address";
};

function VenueSummary({ row }: { row: OuterJoinRow }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="font-medium truncate">{row.venue?.name || "Unnamed"}</div>
      <div className="text-sm text-muted-foreground truncate">{venueLine(row)}</div>
      {row.venueId && (
        <div className="text-xs text-muted-foreground font-mono truncate">{row.venueId}</div>
      )}
    </div>
  );
}

function InputOnlyNote({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
      <span>
        {count} selected row{count > 1 ? "s have" : " has"} no venue (input only) and won&apos;t
        be merged.
      </span>
    </div>
  );
}

export function MergeDuplicatesDialog({
  open,
  onOpenChange,
  selectedRows,
  candidatePool,
  onConfirm,
}: MergeDuplicatesDialogProps) {
  const [step, setStep] = useState<Step>("pick_primary");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [primaryId, setPrimaryId] = useState<string>("");

  const selectedVenues = useMemo(() => selectedRows.filter((r) => r.venue), [selectedRows]);
  const inputOnlyCount = selectedRows.length - selectedVenues.length;
  const candidates = useMemo(
    () => findCandidates(selectedVenues, candidatePool),
    [selectedVenues, candidatePool]
  );

  const mergeRows = [
    ...selectedVenues,
    ...candidates.filter((c) => added.has(c.row.id)).map((c) => c.row),
  ];

  const mostComplete = (rows: OuterJoinRow[]) =>
    [...rows].sort((a, b) => completeness(b.venue) - completeness(a.venue))[0]?.id ?? "";

  // Reset each time the dialog opens. Only ask about look-alikes when there are any;
  // otherwise the user's selection is the answer, so go straight to picking the keeper.
  useEffect(() => {
    if (!open) return;
    setAdded(new Set());
    setStep(candidates.length > 0 ? "review_candidates" : "pick_primary");
    setPrimaryId(mostComplete(selectedVenues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (id: string, on: boolean) =>
    setAdded((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const goToPrimary = () => {
    if (!mergeRows.some((r) => r.id === primaryId)) setPrimaryId(mostComplete(mergeRows));
    setStep("pick_primary");
  };

  const confirm = () =>
    onConfirm({
      primaryRowId: primaryId,
      duplicateRowIds: mergeRows.map((r) => r.id).filter((id) => id !== primaryId),
    });

  const canMerge = mergeRows.length >= 2 && mergeRows.some((r) => r.id === primaryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {step === "review_candidates" ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {candidates.length === 1
                  ? "1 more possible duplicate found"
                  : `${candidates.length} more possible duplicates found`}
              </DialogTitle>
              <DialogDescription>
                {candidates.length === 1 ? "This venue looks" : "These venues look"} like one you
                selected. Check any that are the same place to merge {candidates.length === 1 ? "it" : "them"}{" "}
                too.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[50vh] overflow-y-auto space-y-2 py-2">
              {candidates.map(({ row, similarTo, reasons }) => (
                <label
                  key={row.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50",
                    added.has(row.id) && "border-primary bg-muted/30"
                  )}
                >
                  <Checkbox
                    className="mt-1"
                    checked={added.has(row.id)}
                    onCheckedChange={(v) => toggle(row.id, v === true)}
                  />
                  <div className="min-w-0 flex-1">
                    <VenueSummary row={row} />
                    <div className="mt-1 text-xs text-muted-foreground truncate">
                      Similar to selected: {venueLine(similarTo)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground text-right">
                    {reasons.join(" · ")}
                  </span>
                </label>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              Already selected: {selectedVenues.length} venue{selectedVenues.length === 1 ? "" : "s"}
            </div>
            <InputOnlyNote count={inputOnlyCount} />

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={goToPrimary} disabled={mergeRows.length < 2}>
                {added.size > 0 ? `Add ${added.size} and continue` : "Skip"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Which venue should be kept?</DialogTitle>
              <DialogDescription>
                {mergeRows.length > 2
                  ? `The other ${mergeRows.length - 1} venues will be merged into it.`
                  : "The other venue will be merged into it."}{" "}
                The most complete venue is selected by default.
              </DialogDescription>
            </DialogHeader>

            <div role="radiogroup" className="max-h-[50vh] overflow-y-auto space-y-2 py-2">
              {mergeRows.map((row) => {
                const selected = row.id === primaryId;
                return (
                  <button
                    key={row.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPrimaryId(row.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border p-3 text-left hover:bg-muted/50",
                      selected && "border-primary bg-muted/30"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 rounded-full border border-primary",
                        selected && "border-[5px]"
                      )}
                    />
                    <VenueSummary row={row} />
                    <Badge variant={selected ? "default" : "outline"} className="shrink-0">
                      {selected ? "Keep" : "Merge into kept"}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {candidates.length === 0 && <InputOnlyNote count={inputOnlyCount} />}
            {mergeRows.length < 2 && (
              <div className="text-sm text-destructive">
                Select at least two venues to merge.
              </div>
            )}

            <DialogFooter>
              {candidates.length > 0 ? (
                <Button variant="outline" onClick={() => setStep("review_candidates")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              )}
              <Button onClick={confirm} disabled={!canMerge}>
                <Merge className="mr-2 h-4 w-4" />
                Merge {mergeRows.length} venues
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
