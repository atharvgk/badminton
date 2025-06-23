import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../lib/db";
import { generateMatches } from "../../lib/roundrobin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const db = await getDb();
  const players = await db.collection("players").find().toArray();
  const names = players.map((p: any) => p.name as string);

  const docs = generateMatches(names);
  await db.collection("matches").deleteMany({});
  if (docs.length) await db.collection("matches").insertMany(docs);

  res.json({ matches: docs });
}
