import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getVenuesCollection,
  getExternalPlaceWoesCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  verifyAdminToken,
} from "@/lib/api-helpers";
import { Venue, DupeDetectionResult } from "@/types/chain";

/**
 * Simple dupe detection based on name + address similarity
 * In production, this would use more sophisticated algorithms
 */
function detectDuplicates(venues: Venue[]): DupeDetectionResult[] {
  const results: DupeDetectionResult[] = [];
  const processed = new Set<string>();

  for (let i = 0; i < venues.length; i++) {
    const venueA = venues[i];
    const idA = venueA._id.toString();

    if (processed.has(idA)) continue;

    for (let j = i + 1; j < venues.length; j++) {
      const venueB = venues[j];
      const idB = venueB._id.toString();

      if (processed.has(idB)) continue;

      // Check name similarity
      const nameA = (venueA.name || "").toLowerCase().trim();
      const nameB = (venueB.name || "").toLowerCase().trim();

      if (!nameA || !nameB) continue;

      let confidence = 0;
      let reason = "";

      // Exact name match
      if (nameA === nameB) {
        confidence += 0.5;
        reason = "Exact name match";

        // Check address similarity
        const addrA = (venueA.address || "").toLowerCase().trim();
        const addrB = (venueB.address || "").toLowerCase().trim();

        if (addrA && addrB && addrA === addrB) {
          confidence += 0.3;
          reason += " + exact address match";
        }

        // Check coordinates proximity
        if (
          venueA.latitude &&
          venueA.longitude &&
          venueB.latitude &&
          venueB.longitude
        ) {
          const distance = Math.sqrt(
            Math.pow(venueA.latitude - venueB.latitude, 2) +
              Math.pow(venueA.longitude - venueB.longitude, 2)
          );

          if (distance < 0.001) {
            // ~100m
            confidence += 0.2;
            reason += " + close proximity";
          }
        }
      }

      // Report if confidence is high enough
      if (confidence >= 0.5) {
        results.push({
          rowId: `venue_${idB}`,
          duplicateOf: `venue_${idA}`,
          confidence,
          reason,
        });

        processed.add(idB);
      }
    }
  }

  return results;
}

/**
 * GET /api/chains/[chainId]/dupes
 * Fetch or run dupe detection results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "US";

    const venuesCol = await getVenuesCollection<Venue>();

    const chainObjectId = ObjectId.isValid(chainId)
      ? new ObjectId(chainId)
      : chainId;

    // Fetch all venues in the chain
    const venues = await venuesCol
      .find({
        vcids: { $in: [chainObjectId as any] },
        cc: country,
        closed: { $ne: true },
      })
      .toArray();

    // Run dupe detection
    const duplicates = detectDuplicates(venues);

    return successResponse({
      data: duplicates,
      total: duplicates.length,
      analyzed: venues.length,
    });
  } catch (error: any) {
    console.error("Error in dupes GET API:", error);
    return errorResponse(error.message || "Failed to detect duplicates");
  }
}

/**
 * POST /api/chains/[chainId]/dupes
 * Trigger dupe detection job and optionally propose WOEs
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
    const { country = "US", proposeWoes = false } = body;

    const venuesCol = await getVenuesCollection<Venue>();
    const epwCol = await getExternalPlaceWoesCollection();

    const chainObjectId = ObjectId.isValid(chainId)
      ? new ObjectId(chainId)
      : chainId;

    // Fetch venues
    const venues = await venuesCol
      .find({
        vcids: { $in: [chainObjectId as any] },
        cc: country,
        closed: { $ne: true },
      })
      .toArray();

    // Run detection
    const duplicates = detectDuplicates(venues);

    // Optionally create WOEs for merges
    if (proposeWoes && duplicates.length > 0) {
      const woes = duplicates.map((dupe) => ({
        _id: new ObjectId(),
        proposalType: "merge" as const,
        venueId: dupe.duplicateOf.replace("venue_", ""),
        status: "pending" as const,
        createdAt: new Date(),
        createdBy: request.headers.get("x-admin-token") || "unknown",
        metadata: {
          duplicateVenueId: dupe.rowId.replace("venue_", ""),
          confidence: dupe.confidence,
          reason: dupe.reason,
        },
      }));

      await epwCol.insertMany(woes as any);
    }

    return successResponse({
      success: true,
      duplicates: duplicates.length,
      analyzed: venues.length,
      woesCreated: proposeWoes ? duplicates.length : 0,
      data: duplicates,
    });
  } catch (error: any) {
    console.error("Error in dupes POST API:", error);
    return errorResponse(error.message || "Failed to run dupe detection");
  }
}
