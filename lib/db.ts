import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
if (!uri) throw new Error("Missing MONGODB_URI env var");

let cached: { client: MongoClient; db: ReturnType<MongoClient["db"]> } | null = null;

export async function getDb() {
  if (cached) return cached.db;

  const client = new MongoClient(uri);
  await client.connect();
  cached = {
    client,
    db: client.db(process.env.MONGODB_DB || "badminton"),
  };
  return cached.db;
}
