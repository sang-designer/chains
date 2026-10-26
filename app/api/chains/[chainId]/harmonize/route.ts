import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getCanonicalUrlsCollection,
  getExternalPlaceWoesCollection,
  getEditAuditLogCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  verifyAdminToken,
} from "@/lib/api-helpers";
import { CanonicalUrl, EPW, AuditLogEntry } from "@/types/chain";

interface HarmonizeRequest {
  inputId: string; // format: sourceId_foreignId
  venueId?: string;
  action: "link" | "unlink" | "propose_woe";
  field?: string; // for propose_woe
  proposedValue?: any;
}

/**
 * POST /api/chains/[chainId]/harmonize
 * Update harmonization between inputs and venues
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
    const body: HarmonizeRequest = await request.json();
    const { inputId, venueId, action, field, proposedValue } = body;

    // Parse inputId
    const [sourceId, foreignId] = inputId.split("_");
    if (!sourceId || !foreignId) {
      return errorResponse("Invalid inputId format");
    }

    const canonicalUrlsCol = await getCanonicalUrlsCollection<CanonicalUrl>();
    const epwCol = await getExternalPlaceWoesCollection();
    const auditCol = await getEditAuditLogCollection<AuditLogEntry>();

    let result: any = null;
    let auditEntry: Partial<AuditLogEntry> = {
      timestamp: new Date(),
      action: `harmonize_${action}`,
      affectedIds: [inputId, venueId].filter(Boolean) as string[],
      token: request.headers.get("x-admin-token") || "unknown",
      metadata: {
        chainId,
        sourceId,
        foreignId,
        venueId,
      },
    };

    switch (action) {
      case "link":
        if (!venueId) {
          return errorResponse("venueId required for link action");
        }

        // Check if canonical URL already exists
        const existing = await canonicalUrlsCol.findOne({
          provider: sourceId,
          id: foreignId,
        });

        if (existing) {
          // Update existing
          result = await canonicalUrlsCol.updateOne(
            { _id: existing._id },
            {
              $set: {
                venueId,
                structured_metadata: {
                  neutronicSourceId: sourceId,
                  inputClass: "external",
                  dataset: "fsqPlaces",
                },
              },
            }
          );
          auditEntry.oldValues = { venueId: existing.venueId };
          auditEntry.newValues = { venueId };
        } else {
          // Create new canonical URL
          result = await canonicalUrlsCol.insertOne({
            _id: new ObjectId(),
            venueId,
            provider: sourceId,
            id: foreignId,
            structured_metadata: {
              neutronicSourceId: sourceId,
              inputClass: "external",
              dataset: "fsqPlaces",
            },
          } as CanonicalUrl);
          auditEntry.newValues = { venueId, created: true };
        }
        break;

      case "unlink":
        // Remove canonical URL
        const toDelete = await canonicalUrlsCol.findOne({
          provider: sourceId,
          id: foreignId,
        });

        if (toDelete) {
          result = await canonicalUrlsCol.deleteOne({ _id: toDelete._id });
          auditEntry.oldValues = { venueId: toDelete.venueId };
        }
        break;

      case "propose_woe":
        if (!field) {
          return errorResponse("field required for propose_woe action");
        }

        // Create EPW
        const epw: Partial<EPW> = {
          _id: new ObjectId(),
          sourceId,
          foreignId,
          venueId,
          proposalType: "field_update",
          field,
          proposedValue,
          status: "pending",
          createdAt: new Date(),
          createdBy: request.headers.get("x-admin-token") || "unknown",
        };

        result = await epwCol.insertOne(epw);
        auditEntry.newValues = { epwId: epw._id?.toString(), field, proposedValue };
        break;

      default:
        return errorResponse("Invalid action");
    }

    // Log to audit
    await auditCol.insertOne(auditEntry as AuditLogEntry);

    return successResponse({
      success: true,
      action,
      result,
    });
  } catch (error: any) {
    console.error("Error in harmonize API:", error);
    return errorResponse(error.message || "Failed to harmonize");
  }
}
