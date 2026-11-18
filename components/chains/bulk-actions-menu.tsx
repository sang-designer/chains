"use client";

import { useState } from "react";
import { MoreHorizontal, Merge, Minus, MoveRight, XCircle, FileEdit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { BulkOperationType } from "@/types/chain";

interface BulkActionsMenuProps {
  selectedCount: number;
  /** How many selected rows have a venue; venue actions need at least one. */
  venueCount: number;
  onAction: (action: BulkOperationType, options?: any) => void;
  disabled?: boolean;
  /** Set while an action runs: the button shows progress and is disabled. */
  busyLabel?: string | null;
}

/** Second line under a disabled item, saying why it can't be used. */
function Reason({ children }: { children: string }) {
  return <span className="block text-xs text-muted-foreground">{children}</span>;
}

export function BulkActionsMenu({
  selectedCount,
  venueCount,
  onAction,
  disabled = false,
  busyLabel = null,
}: BulkActionsMenuProps) {
  const noVenues = venueCount === 0;
  const noVenuesReason = "Selected rows have no venue";
  const [open, setOpen] = useState(false);

  const handleAction = (action: BulkOperationType, options?: any) => {
    onAction(action, options);
    setOpen(false);
  };

  const fields = [
    { value: "name", label: "Name" },
    { value: "address", label: "Address" },
    { value: "city", label: "City" },
    { value: "state", label: "State" },
    { value: "zip", label: "Zip" },
    { value: "url", label: "URL" },
    { value: "phone", label: "Phone" },
    { value: "hours", label: "Hours" },
    { value: "coordinates", label: "Lat/Lng" },
    { value: "category", label: "Category" },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || !!busyLabel || selectedCount === 0}
          title={selectedCount === 0 ? "Select rows to act on them" : undefined}
        >
          {busyLabel ? (
            <>
              <Loader size="sm" className="text-current" aria-hidden="true" />
              {busyLabel}…
            </>
          ) : (
            <>
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Actions ({selectedCount})
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleAction("merge")}
          disabled={venueCount < 2}
        >
          <Merge className="mr-2 h-4 w-4" />
          <span>
            Merge Selected Venues…
            {venueCount < 2 && <Reason>Select at least 2 venues</Reason>}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction("remove_from_chain")} disabled={noVenues}>
          <Minus className="mr-2 h-4 w-4" />
          <span>
            Remove from Chain…
            {noVenues && <Reason>{noVenuesReason}</Reason>}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction("move_to_chain")} disabled={noVenues}>
          <MoveRight className="mr-2 h-4 w-4" />
          <span>
            Move to Different Chain…
            {noVenues && <Reason>{noVenuesReason}</Reason>}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <FileEdit className="mr-2 h-4 w-4" />
            Propose WOE by Field
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            {fields.map((field) => (
              <DropdownMenuItem
                key={field.value}
                onClick={() => handleAction("propose_woe", { field: field.value })}
              >
                {field.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handleAction("close_venues")}
          className="text-destructive"
          disabled={noVenues}
        >
          <XCircle className="mr-2 h-4 w-4" />
          <span>
            Close Venues…
            {noVenues && <Reason>{noVenuesReason}</Reason>}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
