import { MongoClient, ServerApiVersion } from "mongodb"
import { loadConfig } from "./secure-storage"

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

async function getMongoUri(): Promise<string | null> {
  const config = await loadConfig()
  return config?.mongodbUri || null
}

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

async function createClient(): Promise<MongoClient> {
  const uri = await getMongoUri()
  if (!uri) {
    throw new Error("MongoDB URI not configured. Please set up your configuration first.")
  }
  return new MongoClient(uri, options)
}

async function getClient(): Promise<MongoClient> {
  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = await createClient()
      globalWithMongo._mongoClientPromise = client.connect()
    }
    return globalWithMongo._mongoClientPromise
  } else {
    // In production mode, it's best to not use a global variable.
    if (!client) {
      client = await createClient()
    }
    if (!clientPromise) {
      clientPromise = client.connect()
    }
    return clientPromise
  }
}

// Export a function that returns the client promise
export default async function getMongoClient(): Promise<MongoClient | null> {
  try {
    return await getClient()
  } catch (error) {
    // If there's an error (like missing config), return null
    console.error("Failed to connect to MongoDB:", error)
    return null
  }
}

