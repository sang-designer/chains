import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getEditAuditLogCollection,
  getVenuesCollection,
  getCanonicalUrlsCollection,
  getExternalPlaceWoesCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  verifyAdminToken,
} from "@/lib/api-helpers";
import { AuditLogEntry } from "@/types/chain";

/**
 * GET /api/audit-log
 * Fetch audit log entries
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get("chainId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const auditCol = await getEditAuditLogCollection<AuditLogEntry>();

    const query: any = {};
    if (chainId) {
      query["metadata.chainId"] = chainId;
    }
    if (action) {
      query.action = action;
    }

    const logs = await auditCol
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return successResponse({
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("Error in audit-log GET API:", error);
    return errorResponse(error.message || "Failed to fetch audit logs");
  }
}

/**
 * POST /api/audit-log/rollback
 * Rollback operations based on audit log
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    if (!verifyAdminToken(request.headers)) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await request.json();
    const { auditLogId } = body;

    if (!auditLogId) {
      return errorResponse("auditLogId is required");
    }

    const auditCol = await getEditAuditLogCollection<AuditLogEntry>();
    const venuesCol = await getVenuesCollection();
    const canonicalUrlsCol = await getCanonicalUrlsCollection();
    const epwCol = await getExternalPlaceWoesCollection();

    // Fetch the audit entry
    const auditEntry = await auditCol.findOne({
      _id: new ObjectId(auditLogId),
    });

    if (!auditEntry) {
      return errorResponse("Audit log entry not found", 404);
    }

    // Check if already rolled back
    if ((auditEntry as any).rolledBack) {
      return errorResponse("Already rolled back", 400);
    }

    let rollbackResult: any = null;

    // Perform rollback based on action type
    switch (auditEntry.action) {
      case "harmonize_link":
        // Rollback: remove canonical URL
        if (auditEntry.affectedIds.length > 0) {
          const [inputId, venueId] = auditEntry.affectedIds;
          const [sourceId, foreignId] = inputId.split("_");

          rollbackResult = await canonicalUrlsCol.deleteOne({
            provider: sourceId,
            id: foreignId,
            venueId,
          });
        }
        break;

      case "harmonize_unlink":
        // Rollback: restore canonical URL
        if (auditEntry.oldValues?.venueId && auditEntry.affectedIds[0]) {
          const [inputId] = auditEntry.affectedIds;
          const [sourceId, foreignId] = inputId.split("_");

          rollbackResult = await canonicalUrlsCol.insertOne({
            _id: new ObjectId(),
            venueId: auditEntry.oldValues.venueId,
            provider: sourceId,
            id: foreignId,
            structured_metadata: {
              neutronicSourceId: sourceId,
              inputClass: "external",
              dataset: "fsqPlaces",
            },
          } as any);
        }
        break;

      case "bulk_add_to_chain":
        // Rollback: remove from chain
        const chainIdToRemove = auditEntry.newValues?.addedToChain;
        if (chainIdToRemove) {
          const venueIds = auditEntry.affectedIds
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        rollbackResult = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $pull: { vcids: new ObjectId(chainIdToRemove) } } as any
        );
        }
        break;

      case "bulk_remove_from_chain":
        // Rollback: add back to chain
        const chainIdToAdd = auditEntry.newValues?.removedFromChain;
        if (chainIdToAdd) {
          const venueIds = auditEntry.affectedIds
            .filter((id) => ObjectId.isValid(id))
            .map((id) => new ObjectId(id));

        rollbackResult = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $addToSet: { vcids: new ObjectId(chainIdToAdd) } } as any
        );
        }
        break;

      case "bulk_close_venues":
        // Rollback: reopen venues
        const venueIds = auditEntry.affectedIds
          .filter((id) => ObjectId.isValid(id))
          .map((id) => new ObjectId(id));

        rollbackResult = await venuesCol.updateMany(
          { _id: { $in: venueIds } },
          { $set: { closed: false }, $unset: { closedAt: "" } }
        );
        break;

      case "epw_approve":
      case "epw_reject":
        // Rollback: reset EPW to pending
        if (auditEntry.affectedIds[0]) {
          rollbackResult = await epwCol.updateOne(
            { _id: new ObjectId(auditEntry.affectedIds[0]) },
            {
              $set: { status: "pending" },
              $unset: { resolvedAt: "", resolvedBy: "" },
            }
          );
        }
        break;

      default:
        return errorResponse(
          `Rollback not supported for action: ${auditEntry.action}`
        );
    }

    // Mark as rolled back in audit log
    await auditCol.updateOne(
      { _id: new ObjectId(auditLogId) },
      {
        $set: {
          rolledBack: true,
          rolledBackAt: new Date(),
          rolledBackBy: request.headers.get("x-admin-token") || "unknown",
        },
      }
    );

    // Create a new audit entry for the rollback
    const rollbackAuditEntry: Partial<AuditLogEntry> = {
      timestamp: new Date(),
      action: `rollback_${auditEntry.action}`,
      affectedIds: auditEntry.affectedIds,
      token: request.headers.get("x-admin-token") || "unknown",
      metadata: {
        originalAuditLogId: auditLogId,
        originalAction: auditEntry.action,
      },
      oldValues: auditEntry.newValues,
      newValues: auditEntry.oldValues,
    };

    await auditCol.insertOne(rollbackAuditEntry as AuditLogEntry);

    return successResponse({
      success: true,
      rolledBack: auditEntry.action,
      result: rollbackResult,
    });
  } catch (error: any) {
    console.error("Error in rollback API:", error);
    return errorResponse(error.message || "Failed to rollback");
  }
}
