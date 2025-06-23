import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const matches = await db.collection("matches").find().toArray();
  res.json(matches);
}
