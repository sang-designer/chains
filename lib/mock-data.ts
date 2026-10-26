import { OuterJoinRow, EPW, ChainMetadata, Venue } from "@/types/chain";
import { MOCK_CHAINS, getChainName } from "./mock-chains";

// Helper to create mock ObjectId
const mockObjectId = () => ({
  toString: () => Math.random().toString(36).substring(2, 15),
  toHexString: () => Math.random().toString(36).substring(2, 15),
} as any);

// Generate chain-specific mock data
export function generateMockDataForChain(chainId: string): {
  chain: ChainMetadata;
  rows: OuterJoinRow[];
  epws: EPW[];
  sources: string[];
} {
  const chain = MOCK_CHAINS.find(c => c.id === chainId);
  if (!chain) {
    // Return default if chain not found
    return {
      chain: MOCK_CHAIN,
      rows: MOCK_OUTER_JOIN_ROWS,
      epws: MOCK_EPWS,
      sources: MOCK_SOURCES,
    };
  }

  const chainName = chain.n;
  const categories = chain.tcs || ["Restaurant"];
  
  // Generate 15 sample locations for this chain with varied countries
  const cities = [
    { city: "New York", state: "NY", zip: "10001", lat: 40.7589, lng: -73.9851, country: "US" },
    { city: "Los Angeles", state: "CA", zip: "90001", lat: 34.0522, lng: -118.2437, country: "US" },
    { city: "Chicago", state: "IL", zip: "60601", lat: 41.8781, lng: -87.6298, country: "US" },
    { city: "Toronto", state: "ON", zip: "M5H 2N2", lat: 43.6532, lng: -79.3832, country: "CA" },
    { city: "Phoenix", state: "AZ", zip: "85001", lat: 33.4484, lng: -112.0740, country: "US" },
    { city: "London", state: "England", zip: "SW1A 1AA", lat: 51.5074, lng: -0.1278, country: "GB" },
    { city: "Vancouver", state: "BC", zip: "V6B 1A9", lat: 49.2827, lng: -123.1207, country: "CA" },
    { city: "San Diego", state: "CA", zip: "92101", lat: 32.7157, lng: -117.1611, country: "US" },
    { city: "Dallas", state: "TX", zip: "75201", lat: 32.7767, lng: -96.7970, country: "US" },
    { city: "Sydney", state: "NSW", zip: "2000", lat: -33.8688, lng: 151.2093, country: "AU" },
    { city: "Manchester", state: "England", zip: "M1 1AD", lat: 53.4808, lng: -2.2426, country: "GB" },
    { city: "Montreal", state: "QC", zip: "H3A 1A3", lat: 45.5017, lng: -73.5673, country: "CA" },
    { city: "San Francisco", state: "CA", zip: "94102", lat: 37.7749, lng: -122.4194, country: "US" },
    { city: "Melbourne", state: "VIC", zip: "3000", lat: -37.8136, lng: 144.9631, country: "AU" },
    { city: "Seattle", state: "WA", zip: "98101", lat: 47.6062, lng: -122.3321, country: "US" },
  ];

  const addresses = [
    "Main St", "Broadway", "Oak Ave", "Elm Street", "Washington Blvd",
    "Market Street", "Park Avenue", "Center Drive", "1st Avenue", "Highway 1"
  ];

  const rows: OuterJoinRow[] = cities.map((location, idx) => {
    const streetNum = 100 + (idx * 50);
    const address = `${streetNum} ${addresses[idx % addresses.length]}`;
    const matchStatus: OuterJoinRow["matchStatus"] = 
      idx < 10 ? "matched" : idx < 13 ? "input_only" : "venue_only";
    
    const hasInput = matchStatus !== "venue_only";
    const hasVenue = matchStatus !== "input_only";
    
    // Vary match quality for matched rows
    const matchQuality = idx % 6; // 0-5 for different match qualities
    let inputAddress = address;
    let inputPhone = `+1-${location.zip.substring(0, 3)}-555-${String(idx).padStart(4, '0')}`;
    let inputName = chainName;
    let inputCity = location.city;
    let inputState = location.state;
    let inputZip = location.zip;
    let inputLat = location.lat;
    let inputLng = location.lng;
    
    if (matchStatus === "matched") {
      // Create different match quality levels
      switch (matchQuality) {
        case 0: // Perfect match (100%)
          // Everything matches
          break;
        case 1: // Strong match (~95%) - minor phone difference
          inputPhone = `+1-${location.zip.substring(0, 3)}-555-${String(idx + 1000).padStart(4, '0')}`;
          break;
        case 2: // Good match (~85%) - address variation
          inputAddress = `${streetNum}${['A', 'B', ''][idx % 3]} ${addresses[idx % addresses.length]}`;
          inputPhone = `+1-${location.zip.substring(0, 3)}-555-${String(idx + 1000).padStart(4, '0')}`;
          break;
        case 3: // Moderate match (~75%) - multiple small differences
          inputAddress = `${streetNum} ${addresses[(idx + 1) % addresses.length]}`;
          inputPhone = `+1-${location.zip.substring(0, 3)}-444-${String(idx).padStart(4, '0')}`;
          inputZip = String(Number(location.zip) + 1);
          break;
        case 4: // Partial match (~60%) - significant differences
          inputName = `${chainName} #${idx + 1}`;
          inputAddress = `${streetNum - 5} ${addresses[(idx + 1) % addresses.length]}`;
          inputPhone = `+1-${location.zip.substring(0, 3)}-444-${String(idx).padStart(4, '0')}`;
          inputLat = location.lat + 0.002;
          inputLng = location.lng - 0.003;
          break;
        case 5: // Weak match (~45%) - many differences
          inputName = `${chainName} - ${location.city}`;
          inputAddress = `${streetNum + 10} ${addresses[(idx + 2) % addresses.length]}`;
          inputCity = `${location.city} North`;
          inputPhone = `+1-${location.zip.substring(0, 3)}-333-${String(idx).padStart(4, '0')}`;
          inputLat = location.lat + 0.005;
          inputLng = location.lng - 0.004;
          break;
      }
    }
    
    return {
      id: `${chainId}_${idx}_${location.city.toLowerCase()}`,
      matchStatus,
      input: hasInput ? {
        sourceId: idx % 3 === 0 ? "google" : idx % 3 === 1 ? "yelp" : "facebook",
        foreignId: `${chainId}_${Math.random().toString(36).substring(2, 10)}`,
        chainId: chainId,
        countryCode: location.country,
        name: inputName,
        address: inputAddress,
        city: inputCity,
        state: inputState,
        zip: inputZip,
        phone: inputPhone,
        url: `https://${chainId}.com/locations/${location.state.toLowerCase()}-${String(idx).padStart(3, '0')}`,
        latitude: inputLat + (matchStatus === "matched" ? 0 : Math.random() * 0.01),
        longitude: inputLng + (matchStatus === "matched" ? 0 : Math.random() * 0.01),
        categories: categories,
        closed: false,
      } : undefined,
      venue: hasVenue ? {
        _id: mockObjectId(),
        name: chainName,
        address: address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        phone: `+1-${location.zip.substring(0, 3)}-555-${String(idx).padStart(4, '0')}`,
        url: `https://${chainId}.com/locations/${location.state.toLowerCase()}-${String(idx).padStart(3, '0')}`,
        latitude: location.lat,
        longitude: location.lng,
        categories: categories,
        closed: idx === 14, // Last one is closed
        cc: location.country,
      } : undefined,
      hasPendingEPW: matchStatus === "input_only", // Input only = pending EPW, Matched = no EPW
      zyteStatus: idx < 10 ? "found" : idx < 13 ? "not_found" : undefined,
    };
  });

  // Generate EPWs for all input_only rows
  const epws: EPW[] = rows
    .filter(row => row.matchStatus === "input_only" && row.input)
    .map((row, epwIdx) => ({
      _id: mockObjectId(),
      sourceId: row.input!.sourceId,
      foreignId: row.input!.foreignId,
      proposalType: "link" as const,
      status: "pending" as const,
      createdAt: new Date(Date.now() - epwIdx * 86400000), // Stagger dates
      createdBy: "user@example.com",
    }));

  return {
    chain: {
      _id: chain._id,
      n: chain.n,
      tcs: chain.tcs,
      d: chain.d,
    },
    rows,
    epws,
    sources: ["google", "yelp", "facebook"],
  };
}

// Default mock chain metadata (for backwards compatibility)
export const MOCK_CHAIN: ChainMetadata = {
  _id: mockObjectId(),
  n: "Starbucks Coffee",
  tcs: ["Coffee Shop", "Cafe"],
  d: "Global coffee chain",
};

// Mock outer join data
export const MOCK_OUTER_JOIN_ROWS: OuterJoinRow[] = [
  {
    id: "google_12345_venue_001",
    matchStatus: "matched",
    input: {
      sourceId: "google",
      foreignId: "12345",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks",
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      phone: "+1-212-555-0100",
      url: "https://starbucks.com/locations/ny-001",
      latitude: 40.7589,
      longitude: -73.9851,
      categories: ["Coffee Shop", "Cafe"],
      closed: false,
    },
    venue: {
      _id: mockObjectId(),
      name: "Starbucks",
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
      phone: "+1-212-555-0100",
      url: "https://starbucks.com/locations/ny-001",
      latitude: 40.7589,
      longitude: -73.9851,
      categories: ["Coffee Shop", "Cafe"],
      closed: false,
      cc: "US",
      vcids: [mockObjectId()],
    },
    venueId: "507f1f77bcf86cd799439011",
    hasPendingEPW: false, // Matched = no EPW
    isDuplicate: false,
    zyteStatus: "found",
  },
  {
    id: "yelp_67890_venue_002",
    matchStatus: "matched",
    input: {
      sourceId: "yelp",
      foreignId: "67890",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks Coffee",
      address: "456 Broadway",
      city: "New York",
      state: "NY",
      zip: "10012",
      phone: "+1-212-555-0200",
      url: "https://yelp.com/biz/starbucks-broadway",
      latitude: 40.7234,
      longitude: -73.9967,
      categories: ["Coffee", "Breakfast"],
      closed: false,
    },
    venue: {
      _id: mockObjectId(),
      name: "Starbucks",
      address: "456 Broadway Ave",
      city: "New York",
      state: "NY",
      zip: "10012",
      phone: "+1-212-555-0201",
      url: "https://starbucks.com/locations/ny-002",
      latitude: 40.7234,
      longitude: -73.9967,
      categories: ["Coffee Shop"],
      closed: false,
      cc: "US",
      vcids: [mockObjectId()],
    },
    venueId: "507f1f77bcf86cd799439012",
    hasPendingEPW: false, // Matched = no EPW
    isDuplicate: false,
    zyteStatus: "found",
  },
  {
    id: "google_11111",
    matchStatus: "input_only",
    input: {
      sourceId: "google",
      foreignId: "11111",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks Reserve",
      address: "789 5th Ave",
      city: "New York",
      state: "NY",
      zip: "10022",
      phone: "+1-212-555-0300",
      url: "https://starbucks.com/reserve",
      latitude: 40.7614,
      longitude: -73.9776,
      categories: ["Coffee Shop", "Premium Cafe"],
      closed: false,
    },
    hasPendingEPW: true, // Input only = pending EPW
    isDuplicate: false,
    zyteStatus: "not_found",
  },
  {
    id: "venue_507f1f77bcf86cd799439013",
    matchStatus: "venue_only",
    venue: {
      _id: mockObjectId(),
      name: "Starbucks",
      address: "321 Park Ave",
      city: "New York",
      state: "NY",
      zip: "10016",
      phone: "+1-212-555-0400",
      latitude: 40.7489,
      longitude: -73.9680,
      categories: ["Coffee Shop"],
      closed: false,
      cc: "US",
      vcids: [mockObjectId()],
    },
    venueId: "507f1f77bcf86cd799439013",
    hasPendingEPW: false,
    isDuplicate: false,
    zyteStatus: "unknown",
  },
  {
    id: "google_22222",
    matchStatus: "input_only",
    input: {
      sourceId: "google",
      foreignId: "22222",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks",
      address: "555 Madison Ave",
      city: "New York",
      state: "NY",
      phone: "+1-212-555-0500",
      latitude: 40.7580,
      longitude: -73.9749,
      categories: ["Coffee Shop"],
      closed: false,
    },
    hasPendingEPW: true, // Input only = pending EPW
    isDuplicate: false,
    zyteStatus: "unknown",
  },
  {
    id: "yelp_33333_venue_004",
    matchStatus: "matched",
    input: {
      sourceId: "yelp",
      foreignId: "33333",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks Coffee Shop",
      address: "100 Wall St",
      city: "New York",
      state: "NY",
      zip: "10005",
      phone: "+1-212-555-0600",
      latitude: 40.7074,
      longitude: -74.0113,
      categories: ["Coffee", "Wifi"],
      closed: true,
    },
    venue: {
      _id: mockObjectId(),
      name: "Starbucks",
      address: "100 Wall Street",
      city: "New York",
      state: "NY",
      zip: "10005",
      phone: "+1-212-555-0600",
      latitude: 40.7074,
      longitude: -74.0113,
      categories: ["Coffee Shop"],
      closed: true,
      cc: "US",
      vcids: [mockObjectId()],
    },
    venueId: "507f1f77bcf86cd799439014",
    hasPendingEPW: false,
    isDuplicate: false,
    zyteStatus: "closed",
  },
  {
    id: "google_44444_venue_005",
    matchStatus: "matched",
    input: {
      sourceId: "google",
      foreignId: "44444",
      chainId: "starbucks-chain",
      countryCode: "US",
      name: "Starbucks",
      address: "200 Broadway",
      city: "New York",
      state: "NY",
      zip: "10038",
      phone: "+1-212-555-0700",
      latitude: 40.7128,
      longitude: -74.0060,
      categories: ["Coffee Shop"],
      closed: false,
    },
    venue: {
      _id: mockObjectId(),
      name: "Starbucks Coffee",
      address: "200 Broadway",
      city: "New York",
      state: "NY",
      zip: "10038",
      phone: "+1-212-555-0700",
      latitude: 40.7128,
      longitude: -74.0060,
      categories: ["Coffee Shop"],
      closed: false,
      cc: "US",
      vcids: [mockObjectId()],
    },
    venueId: "507f1f77bcf86cd799439015",
    hasPendingEPW: false,
    isDuplicate: true,
    zyteStatus: "found",
  },
];

// Mock EPWs - generated for input_only rows
export const MOCK_EPWS: EPW[] = [
  {
    _id: mockObjectId(),
    sourceId: "google",
    foreignId: "11111",
    proposalType: "link",
    status: "pending",
    createdAt: new Date("2024-10-12"),
    createdBy: "admin-token-123",
  },
  {
    _id: mockObjectId(),
    sourceId: "google",
    foreignId: "22222",
    proposalType: "link",
    status: "pending",
    createdAt: new Date("2024-10-13"),
    createdBy: "admin-token-123",
  },
];

// Mock dupe detection results
export const MOCK_DUPES = [
  {
    rowId: "google_44444_venue_005",
    duplicateOf: "google_12345_venue_001",
    confidence: 0.85,
    reason: "Exact name match + close proximity",
  },
];

// Mock sources
export const MOCK_SOURCES = ["google", "yelp", "foursquare", "tripadvisor"];
