"use client";

import { useState } from "react";
import { MoreHorizontal, Merge, Plus, Minus, MoveRight, XCircle, FileEdit } from "lucide-react";
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
import { BulkOperationType } from "@/types/chain";

interface BulkActionsMenuProps {
  selectedCount: number;
  onAction: (action: BulkOperationType, options?: any) => void;
  disabled?: boolean;
}

export function BulkActionsMenu({
  selectedCount,
  onAction,
  disabled = false,
}: BulkActionsMenuProps) {
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
        <Button variant="outline" disabled={disabled || selectedCount === 0}>
          <MoreHorizontal className="mr-2 h-4 w-4" />
          Actions ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => handleAction("merge")}
          disabled={selectedCount < 2}
        >
          <Merge className="mr-2 h-4 w-4" />
          Merge Selected Venues
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction("add_to_chain")}>
          <Plus className="mr-2 h-4 w-4" />
          Add to Chain
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleAction("remove_from_chain")}>
          <Minus className="mr-2 h-4 w-4" />
          Remove from Chain
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            // This would open a dialog to select target chain
            const targetChainId = prompt("Enter target chain ID:");
            if (targetChainId) {
              handleAction("move_to_chain", { targetChainId });
            }
          }}
        >
          <MoveRight className="mr-2 h-4 w-4" />
          Move to Different Chain
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
        >
          <XCircle className="mr-2 h-4 w-4" />
          Close Venues
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
