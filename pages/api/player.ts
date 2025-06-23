import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();
  const col = db.collection('players');

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const result = await col.insertOne({ name });
    return res.json({ _id: result.insertedId, name });
  }

  // GET – list players
  const players = await col.find().toArray();
  res.json(players);
}