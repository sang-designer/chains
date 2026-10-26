import { ObjectId } from "mongodb";

/**
 * Extracted place from external sources (abbreviated BSON format)
 * Collection: venues_aux.extracted_external_places
 */
export interface ExtractedPlace {
  _id: {
    s: string; // sourceId
    f: string; // foreignId
  };
  cid?: string; // chainId
  cc?: string; // countryCode
  v?: string; // name (venue)
  a?: string; // address line 1
  a2?: string; // address line 2
  c?: string; // city
  s?: string; // state
  z?: string; // zip
  p?: string; // phone
  u?: string; // url
  h?: string; // hours
  lt?: number; // latitude
  lg?: number; // longitude
  cs?: string[]; // categories
  cl?: boolean; // closed
  // Add other abbreviated fields as needed
}

/**
 * Expanded/normalized version for UI display
 */
export interface ExtractedPlaceNormalized {
  sourceId: string;
  foreignId: string;
  chainId?: string;
  countryCode?: string;
  name?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  url?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
  closed?: boolean;
}

/**
 * Canonical venue from hypervenues
 * Collection: hypervenues.venues
 */
export interface Venue {
  _id: ObjectId;
  vcids?: ObjectId[]; // venue chain IDs
  cc?: string; // country code
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  url?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  categories?: string[];
  closed?: boolean;
  // Add other venue fields as needed
}

/**
 * Canonical URL mapping (join key between inputs and venues)
 * Collection: venues_aux.canonicalUrls
 */
export interface CanonicalUrl {
  _id: ObjectId;
  venueId: string; // FSQ venue ID
  provider: string; // sourceId
  id: string; // foreignId
  structured_metadata?: {
    neutronicSourceId?: string;
    inputClass?: string;
    dataset?: string;
  };
}

/**
 * Chain metadata
 * Collection: hypervenues.chains
 */
export interface ChainMetadata {
  _id: ObjectId;
  n?: string; // name
  tcs?: string[]; // top categories
  d?: string; // description
}

/**
 * External Place WOE (Write-Once Edit proposal)
 * Collection: venues_aux.external_place_woes
 */
export interface EPW {
  _id: ObjectId;
  sourceId: string;
  foreignId: string;
  venueId?: string;
  proposalType: "link" | "unlink" | "merge" | "close" | "field_update";
  field?: string; // for field_update type
  proposedValue?: any;
  currentValue?: any;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  createdBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * Match status for outer join results
 */
export type MatchStatus = "matched" | "input_only" | "venue_only";

/**
 * Outer join row combining input and venue data
 */
export interface OuterJoinRow {
  id: string; // unique identifier for the row
  matchStatus: MatchStatus;
  input?: ExtractedPlaceNormalized;
  venue?: Venue;
  venueId?: string;
  hasPendingEPW?: boolean;
  isDuplicate?: boolean;
  zyteStatus?: "found" | "not_found" | "closed" | "unknown";
}

/**
 * Comparison field for attribute diff display
 */
export interface ComparisonField {
  field: string;
  label: string;
  inputValue?: any;
  venueValue?: any;
  isDifferent: boolean;
}

/**
 * Filter options for the chains page
 */
export interface ChainFilters {
  matchStatus?: MatchStatus[];
  source?: string;
  hasAddress?: boolean;
  hasPendingEPW?: boolean;
  isDuplicate?: boolean;
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Bulk operation types
 */
export type BulkOperationType =
  | "merge"
  | "add_to_chain"
  | "remove_from_chain"
  | "move_to_chain"
  | "close_venues"
  | "propose_woe";

/**
 * Bulk operation request payload
 */
export interface BulkOperationRequest {
  operation: BulkOperationType;
  rowIds: string[];
  targetChainId?: string; // for move_to_chain
  field?: string; // for propose_woe
}

/**
 * Audit log entry for tracking all edits
 * Collection: venues_aux.edit_audit_log
 */
export interface AuditLogEntry {
  _id: ObjectId;
  timestamp: Date;
  action: string;
  affectedIds: string[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  token: string; // CHAIN_ADMIN_TOKEN identifier
  user?: string;
  metadata?: Record<string, any>;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Dupe detection result
 */
export interface DupeDetectionResult {
  rowId: string;
  duplicateOf: string;
  confidence: number;
  reason: string;
}
