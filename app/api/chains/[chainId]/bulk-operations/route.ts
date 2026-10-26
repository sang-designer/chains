import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getVenuesCollection,
  getExternalPlaceWoesCollection,
  getEditAuditLogCollection,
  getCanonicalUrlsCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  verifyAdminToken,
} from "@/lib/api-helpers";
import { BulkOperationRequest, Venue, AuditLogEntry } from "@/types/chain";

/**
 * POST /api/chains/[chainId]/bulk-operations
 * Handle multi-select bulk operations
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request.headers)) {
      return errorResponse("Unauthorized", 401);
    }

    const { chainId } = await params;
    const body: BulkOperationRequest = await request.json();
    const { operation, rowIds, targetChainId, field } = body;

    if (!rowIds || rowIds.length === 0) {
      return errorResponse("No rows selected");
    }

    const venuesCol = await getVenuesCollection<Venue>();
    const epwCol = await getExternalPlaceWoesCollection();
    const auditCol = await getEditAuditLogCollection<AuditLogEntry>();
    const canonicalUrlsCol = await getCanonicalUrlsCollection();

    let result: any = null;
    const auditEntry: Partial<AuditLogEntry> = {
      timestamp: new Date(),
      action: `bulk_${operation}`,
      affectedIds: rowIds,
      token: request.headers.get("x-admin-token") || "unknown",
      metadata: {
        chainId,
        operation,
        count: rowIds.length,
      },
    };

    // Extract venue IDs from row IDs
    const venueIds = rowIds
      .filter((id) => id.startsWith("venue_") || id.includes("_"))
      .map((id) => {
        if (id.startsWith("venue_")) {
          return id.replace("venue_", "");
        }
        // For matched rows: sourceId_foreignId_venueId
        const parts = id.split("_");
        return parts[parts.length - 1];
      })
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    switch (operation) {
      case "merge":
        // Merge multiple venues into one
        if (venueIds.length < 2) {
          return errorResponse("At least 2 venues required for merge");
        }

        const primaryVenueId = venueIds[0];
        const mergeVenueIds = venueIds.slice(1);

        // Fetch all venues
        const venuesToMerge = await venuesCol
          .find({ _id: { $in: venueIds } })
          .toArray();

        auditEntry.oldValues = { venues: venuesToMerge };

        // Merge logic: update canonical URLs to point to primary venue
        const mergeResult = await canonicalUrlsCol.updateMany(
          { venueId: { $in: mergeVenueIds.map((id) => id.toString()) } },
          { $set: { venueId: primaryVenueId.toString() } }
        );

        // Mark merged venues as closed
        await venuesCol.updateMany(
          { _id: { $in: mergeVenueIds } },
          { $set: { closed: true, mergedInto: primaryVenueId.toString() } }
        );

        result = { merged: mergeResult.modifiedCount };
        break;

      case "add_to_chain":
        // Add venues to the chain
        const chainObjectIdAdd = ObjectId.isValid(chainId)
          ? new ObjectId(chainId)
          : null;

        if (!chainObjectIdAdd) {
          return errorResponse("Invalid chain ID");
        }

        result = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $addToSet: { vcids: chainObjectIdAdd } }
        );

        auditEntry.newValues = { addedToChain: chainId };
        break;

      case "remove_from_chain":
        // Remove venues from the chain
        const chainObjectIdRemove = ObjectId.isValid(chainId)
          ? new ObjectId(chainId)
          : null;

        if (!chainObjectIdRemove) {
          return errorResponse("Invalid chain ID");
        }

        result = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $pull: { vcids: chainObjectIdRemove } }
        );

        auditEntry.newValues = { removedFromChain: chainId };
        break;

      case "move_to_chain":
        // Move venues to a different chain
        if (!targetChainId) {
          return errorResponse("Target chain ID required");
        }

        const sourceChainObjId = ObjectId.isValid(chainId)
          ? new ObjectId(chainId)
          : null;
        const targetChainObjId = ObjectId.isValid(targetChainId)
          ? new ObjectId(targetChainId)
          : null;

        if (!sourceChainObjId || !targetChainObjId) {
          return errorResponse("Invalid chain IDs");
        }

        // Remove from current chain and add to target chain
        result = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          {
            $pull: { vcids: sourceChainObjId },
            $addToSet: { vcids: targetChainObjId },
          }
        );

        auditEntry.oldValues = { chainId };
        auditEntry.newValues = { chainId: targetChainId };
        break;

      case "close_venues":
        // Mark venues as closed
        result = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $set: { closed: true, closedAt: new Date() } }
        );

        auditEntry.newValues = { closed: true };
        break;

      case "propose_woe":
        // Create EPWs for selected rows
        if (!field) {
          return errorResponse("Field required for propose_woe");
        }

        const epws = rowIds.map((rowId) => {
          const [sourceId, foreignId] = rowId.split("_");
          return {
            _id: new ObjectId(),
            sourceId,
            foreignId,
            proposalType: "field_update" as const,
            field,
            status: "pending" as const,
            createdAt: new Date(),
            createdBy: request.headers.get("x-admin-token") || "unknown",
          };
        });

        result = await epwCol.insertMany(epws);
        auditEntry.newValues = { epwCount: epws.length, field };
        break;

      default:
        return errorResponse("Invalid operation");
    }

    // Log to audit
    await auditCol.insertOne(auditEntry as AuditLogEntry);

    return successResponse({
      success: true,
      operation,
      affected: rowIds.length,
      result,
    });
  } catch (error: any) {
    console.error("Error in bulk-operations API:", error);
    return errorResponse(error.message || "Failed to perform bulk operation");
  }
}
