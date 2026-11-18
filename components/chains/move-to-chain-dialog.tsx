"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, MoveRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MOCK_CHAINS } from "@/lib/mock-chains";
import { OuterJoinRow } from "@/types/chain";

interface MoveToChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentChainId: string;
  currentChainName: string;
  /** Rows the user selected before choosing Move. */
  selectedRows: OuterJoinRow[];
  onConfirm: (targetChainId: string) => void;
}

const PREVIEW_LIMIT = 5;

export function MoveToChainDialog({
  open,
  onOpenChange,
  currentChainId,
  currentChainName,
  selectedRows,
  onConfirm,
}: MoveToChainDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [targetChainId, setTargetChainId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setTargetChainId("");
      setPickerOpen(false);
    }
  }, [open]);

  const chains = useMemo(
    () =>
      MOCK_CHAINS.filter((c) => c.id !== currentChainId).sort((a, b) =>
        (a.n || "").localeCompare(b.n || "")
      ),
    [currentChainId]
  );
  const target = chains.find((c) => c.id === targetChainId);

  // Only rows with a venue can move; inputs belong to their source, not a chain.
  const venueRows = selectedRows.filter((row) => row.venue);
  const skipped = selectedRows.length - venueRows.length;
  const count = venueRows.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Move to a different chain</DialogTitle>
          <DialogDescription>
            {count === 0
              ? "None of the selected rows has a venue, so there is nothing to move."
              : `Move ${count} venue${count === 1 ? "" : "s"} out of ${currentChainName} and into another chain.`}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="move-target-chain">Destination chain</Label>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="move-target-chain"
                  variant="outline"
                  role="combobox"
                  aria-expanded={pickerOpen}
                  disabled={count === 0}
                  className="w-full justify-between font-normal"
                >
                  {target ? (
                    <span className="truncate">{target.n}</span>
                  ) : (
                    <span className="text-muted-foreground">Select a chain…</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command
                  // Plain substring match on name + ID; cmdk's default fuzzy match
                  // pulls in unrelated chains (e.g. "taco" → "Starbucks Coffee").
                  filter={(value, search) =>
                    value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
                  }
                >
                  <CommandInput placeholder="Search chains by name or ID…" />
                  <CommandList className="max-h-64">
                    <CommandEmpty>No chain found.</CommandEmpty>
                    <CommandGroup>
                      {chains.map((chain) => (
                        <CommandItem
                          key={chain.id}
                          value={`${chain.n} ${chain.id}`}
                          onSelect={() => {
                            setTargetChainId(chain.id);
                            setPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              targetChainId === chain.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate">{chain.n}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              <span className="font-mono">{chain.id}</span>
                              {" · "}
                              {chain.venueCount.toLocaleString()} venues
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {count > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Venues to move
              </div>
              <ul className="space-y-1 rounded-md border p-3 text-sm">
                {venueRows.slice(0, PREVIEW_LIMIT).map((row) => (
                  <li key={row.id} className="truncate">
                    <span className="font-medium">{row.venue!.name}</span>
                    <span className="text-muted-foreground">
                      {" — "}
                      {[row.venue!.address, row.venue!.city].filter(Boolean).join(", ")}
                    </span>
                  </li>
                ))}
                {count > PREVIEW_LIMIT && (
                  <li className="text-muted-foreground">and {count - PREVIEW_LIMIT} more</li>
                )}
              </ul>
              {skipped > 0 && (
                <p className="text-xs text-muted-foreground">
                  {skipped} selected row{skipped === 1 ? " has" : "s have"} no venue and
                  will be skipped.
                </p>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={count === 0 || !target}
            onClick={() => target && onConfirm(target.id)}
          >
            <MoveRight className="mr-2 h-4 w-4" />
            {target
              ? `Move ${count} venue${count === 1 ? "" : "s"} to ${target.n}`
              : "Move venues"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
