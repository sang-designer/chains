import { MongoClient, Db, Collection, Document } from "mongodb";

const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "foursquare";

// MongoDB connection URIs - will be validated when accessed
const getVenuesAuxUri = () => {
  if (!process.env.MONGODB_VENUES_AUX_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_VENUES_AUX_URI"');
  }
  return process.env.MONGODB_VENUES_AUX_URI;
};

const getHypervenuesUri = () => {
  if (!process.env.MONGODB_HYPERVENUES_URI) {
    throw new Error('Invalid/Missing environment variable: "MONGODB_HYPERVENUES_URI"');
  }
  return process.env.MONGODB_HYPERVENUES_URI;
};

// Global clients for connection pooling
let venuesAuxClient: MongoClient | null = null;
let hypervenuesClient: MongoClient | null = null;
let venuesAuxDb: Db | null = null;
let hypervenuesDb: Db | null = null;

/**
 * Connect to the venues_aux cluster
 */
async function connectVenuesAux(): Promise<MongoClient> {
  if (venuesAuxClient) {
    return venuesAuxClient;
  }

  try {
    venuesAuxClient = new MongoClient(getVenuesAuxUri(), {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    await venuesAuxClient.connect();
    venuesAuxDb = venuesAuxClient.db(MONGODB_DB_NAME);
    console.log("Connected to venues_aux cluster");
    return venuesAuxClient;
  } catch (error) {
    console.error("Failed to connect to venues_aux cluster:", error);
    throw error;
  }
}

/**
 * Connect to the hypervenues cluster
 */
async function connectHypervenues(): Promise<MongoClient> {
  if (hypervenuesClient) {
    return hypervenuesClient;
  }

  try {
    hypervenuesClient = new MongoClient(getHypervenuesUri(), {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    await hypervenuesClient.connect();
    hypervenuesDb = hypervenuesClient.db(MONGODB_DB_NAME);
    console.log("Connected to hypervenues cluster");
    return hypervenuesClient;
  } catch (error) {
    console.error("Failed to connect to hypervenues cluster:", error);
    throw error;
  }
}

/**
 * Get the venues_aux database
 */
export async function getVenuesAuxDb(): Promise<Db> {
  if (!venuesAuxDb) {
    await connectVenuesAux();
  }
  if (!venuesAuxDb) {
    throw new Error("Failed to initialize venues_aux database");
  }
  return venuesAuxDb;
}

/**
 * Get the hypervenues database
 */
export async function getHypervenuesDb(): Promise<Db> {
  if (!hypervenuesDb) {
    await connectHypervenues();
  }
  if (!hypervenuesDb) {
    throw new Error("Failed to initialize hypervenues database");
  }
  return hypervenuesDb;
}

/**
 * Type-safe collection accessors for venues_aux cluster
 */
export async function getExtractedPlacesCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("extracted_external_places");
}

export async function getCanonicalUrlsCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("canonicalUrls");
}

export async function getExternalPlaceWoesCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("external_place_woes");
}

export async function getPlaceSourcesCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("place_sources");
}

export async function getVenueWoesCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("venuewoes");
}

export async function getEditAuditLogCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getVenuesAuxDb();
  return db.collection<T>("edit_audit_log");
}

/**
 * Type-safe collection accessors for hypervenues cluster
 */
export async function getVenuesCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getHypervenuesDb();
  return db.collection<T>("venues");
}

export async function getChainsCollection<T extends Document = Document>(): Promise<Collection<T>> {
  const db = await getHypervenuesDb();
  return db.collection<T>("chains");
}

/**
 * Close all database connections (for cleanup)
 */
export async function closeConnections(): Promise<void> {
  const closePromises: Promise<void>[] = [];

  if (venuesAuxClient) {
    closePromises.push(venuesAuxClient.close());
    venuesAuxClient = null;
    venuesAuxDb = null;
  }

  if (hypervenuesClient) {
    closePromises.push(hypervenuesClient.close());
    hypervenuesClient = null;
    hypervenuesDb = null;
  }

  await Promise.all(closePromises);
  console.log("All database connections closed");
}

/**
 * Health check - ping all databases
 */
export async function healthCheck(): Promise<{
  venuesAux: boolean;
  hypervenues: boolean;
}> {
  const results = {
    venuesAux: false,
    hypervenues: false,
  };

  try {
    const venuesAuxDb = await getVenuesAuxDb();
    await venuesAuxDb.command({ ping: 1 });
    results.venuesAux = true;
  } catch (error) {
    console.error("venues_aux health check failed:", error);
  }

  try {
    const hypervenuesDb = await getHypervenuesDb();
    await hypervenuesDb.command({ ping: 1 });
    results.hypervenues = true;
  } catch (error) {
    console.error("hypervenues health check failed:", error);
  }

  return results;
}
