import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import {
  getExtractedPlacesCollection,
  getVenuesCollection,
  getCanonicalUrlsCollection,
  getExternalPlaceWoesCollection,
} from "@/lib/mongodb";
import {
  errorResponse,
  successResponse,
  parsePagination,
} from "@/lib/api-helpers";
import {
  ExtractedPlace,
  ExtractedPlaceNormalized,
  Venue,
  CanonicalUrl,
  OuterJoinRow,
  MatchStatus,
} from "@/types/chain";

/**
 * Normalize abbreviated BSON fields to readable format
 */
function normalizeExtractedPlace(
  place: ExtractedPlace
): ExtractedPlaceNormalized {
  return {
    sourceId: place._id.s,
    foreignId: place._id.f,
    chainId: place.cid,
    countryCode: place.cc,
    name: place.v,
    address: place.a,
    address2: place.a2,
    city: place.c,
    state: place.s,
    zip: place.z,
    phone: place.p,
    url: place.u,
    hours: place.h,
    latitude: place.lt,
    longitude: place.lg,
    categories: place.cs,
    closed: place.cl,
  };
}

/**
 * GET /api/chains/[chainId]/outer-join
 * Fetch outer join of inputs vs venues for a chain
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chainId: string }> }
) {
  try {
    const { chainId } = await params;
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country") || "US";
    const source = searchParams.get("source") || undefined;
    const matchStatusFilter = searchParams.get("matchStatus") as
      | MatchStatus
      | undefined;

    const { page, limit, skip } = parsePagination(searchParams);

    // Step 1: Fetch inputs from extracted_external_places
    const extractedPlacesCol = await getExtractedPlacesCollection<ExtractedPlace>();
    
    const inputsQuery: any = {
      cid: chainId,
      cc: country,
    };

    if (source) {
      inputsQuery["_id.s"] = source;
    }

    const inputs = await extractedPlacesCol
      .find(inputsQuery)
      .limit(limit)
      .skip(skip)
      .toArray();

    const totalInputs = await extractedPlacesCol.countDocuments(inputsQuery);

    // Step 2: Fetch venues from hypervenues.venues
    const venuesCol = await getVenuesCollection<Venue>();
    
    const chainObjectId = ObjectId.isValid(chainId) ? new ObjectId(chainId) : chainId;
    
    const venues = await venuesCol
      .find({
        vcids: { $in: [chainObjectId as any] },
        cc: country,
      })
      .toArray();

    // Step 3: Fetch canonical URLs for the venues
    const venueIds = venues.map((v) => v._id.toString());
    const canonicalUrlsCol = await getCanonicalUrlsCollection<CanonicalUrl>();
    
    const canonicalUrls = await canonicalUrlsCol
      .find({
        venueId: { $in: venueIds },
      })
      .toArray();

    // Build lookup map: sourceId_foreignId -> venueId
    const inputToVenueMap = new Map<string, string>();
    canonicalUrls.forEach((cu) => {
      const key = `${cu.provider}_${cu.id}`;
      inputToVenueMap.set(key, cu.venueId);
    });

    // Build venue lookup map
    const venueMap = new Map<string, Venue>();
    venues.forEach((v) => {
      venueMap.set(v._id.toString(), v);
    });

    // Step 4: Check for pending EPWs
    const epwCol = await getExternalPlaceWoesCollection();
    const pendingEPWs = await epwCol
      .find({
        status: "pending",
        $or: [
          { sourceId: { $in: inputs.map((i) => i._id.s) } },
          { venueId: { $in: venueIds } },
        ],
      })
      .toArray();

    const epwByInput = new Map<string, boolean>();
    const epwByVenue = new Map<string, boolean>();
    pendingEPWs.forEach((epw: any) => {
      if (epw.sourceId && epw.foreignId) {
        epwByInput.set(`${epw.sourceId}_${epw.foreignId}`, true);
      }
      if (epw.venueId) {
        epwByVenue.set(epw.venueId, true);
      }
    });

    // Step 5: Perform outer join
    const rows: OuterJoinRow[] = [];
    const matchedVenueIds = new Set<string>();

    // Process inputs (matched or input_only)
    inputs.forEach((input) => {
      const normalizedInput = normalizeExtractedPlace(input);
      const inputKey = `${input._id.s}_${input._id.f}`;
      const venueId = inputToVenueMap.get(inputKey);

      if (venueId) {
        // Matched
        const venue = venueMap.get(venueId);
        matchedVenueIds.add(venueId);

        rows.push({
          id: `${inputKey}_${venueId}`,
          matchStatus: "matched",
          input: normalizedInput,
          venue,
          venueId,
          hasPendingEPW:
            epwByInput.get(inputKey) || epwByVenue.get(venueId) || false,
          isDuplicate: false, // Will be populated by dupe detection
          zyteStatus: "unknown",
        });
      } else {
        // Input only
        rows.push({
          id: inputKey,
          matchStatus: "input_only",
          input: normalizedInput,
          hasPendingEPW: epwByInput.get(inputKey) || false,
          isDuplicate: false,
          zyteStatus: "unknown",
        });
      }
    });

    // Process venue_only (venues not matched to any input)
    venues.forEach((venue) => {
      const venueId = venue._id.toString();
      if (!matchedVenueIds.has(venueId)) {
        rows.push({
          id: `venue_${venueId}`,
          matchStatus: "venue_only",
          venue,
          venueId,
          hasPendingEPW: epwByVenue.get(venueId) || false,
          isDuplicate: false,
          zyteStatus: "unknown",
        });
      }
    });

    // Apply match status filter if specified
    let filteredRows = rows;
    if (matchStatusFilter) {
      filteredRows = rows.filter((row) => row.matchStatus === matchStatusFilter);
    }

    return successResponse({
      data: filteredRows,
      pagination: {
        page,
        limit,
        total: totalInputs + venues.length,
        hasMore: skip + limit < totalInputs + venues.length,
      },
    });
  } catch (error: any) {
    console.error("Error in outer-join API:", error);
    return errorResponse(error.message || "Failed to fetch outer join data");
  }
}
