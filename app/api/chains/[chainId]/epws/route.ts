import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getExternalPlaceWoesCollection,
  getEditAuditLogCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  verifyAdminToken,
} from "@/lib/api-helpers";
import { EPW, AuditLogEntry } from "@/types/chain";

/**
 * GET /api/chains/[chainId]/epws
 * List pending EPWs for a chain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";

    const epwCol = await getExternalPlaceWoesCollection();

    // Fetch EPWs for this chain
    // Note: We'll need to join with extracted_places to filter by chain
    // For now, just fetch all pending EPWs
    const epws = await epwCol
      .find({
        status,
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return successResponse({
      data: epws,
      total: epws.length,
    });
  } catch (error: any) {
    console.error("Error in EPWs GET API:", error);
    return errorResponse(error.message || "Failed to fetch EPWs");
  }
}

/**
 * POST /api/chains/[chainId]/epws
 * Resolve EPW (approve/reject)
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
    const body = await request.json();
    const { epwId, action } = body; // action: 'approve' | 'reject'

    if (!epwId || !action) {
      return errorResponse("epwId and action are required");
    }

    if (!["approve", "reject"].includes(action)) {
      return errorResponse("Invalid action. Must be 'approve' or 'reject'");
    }

    const epwCol = await getExternalPlaceWoesCollection();
    const auditCol = await getEditAuditLogCollection<AuditLogEntry>();

    // Fetch the EPW
    const epw = await epwCol.findOne({
      _id: new ObjectId(epwId),
    });

    if (!epw) {
      return errorResponse("EPW not found", 404);
    }

    if ((epw as any).status !== "pending") {
      return errorResponse("EPW is not pending", 400);
    }

    // Update EPW status
    const result = await epwCol.updateOne(
      { _id: new ObjectId(epwId) },
      {
        $set: {
          status: action === "approve" ? "approved" : "rejected",
          resolvedAt: new Date(),
          resolvedBy: request.headers.get("x-admin-token") || "unknown",
        },
      }
    );

    // Log to audit
    const auditEntry: Partial<AuditLogEntry> = {
      timestamp: new Date(),
      action: `epw_${action}`,
      affectedIds: [epwId],
      token: request.headers.get("x-admin-token") || "unknown",
      metadata: {
        chainId,
        epw: {
          sourceId: (epw as any).sourceId,
          foreignId: (epw as any).foreignId,
          proposalType: (epw as any).proposalType,
          field: (epw as any).field,
        },
      },
      oldValues: { status: "pending" },
      newValues: { status: action === "approve" ? "approved" : "rejected" },
    };

    await auditCol.insertOne(auditEntry as AuditLogEntry);

    return successResponse({
      success: true,
      epwId,
      action,
      result,
    });
  } catch (error: any) {
    console.error("Error in EPWs POST API:", error);
    return errorResponse(error.message || "Failed to resolve EPW");
  }
}
