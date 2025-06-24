import type { NextApiRequest, NextApiResponse } from "next";
import { getDb } from "../../lib/db";
import { ObjectId } from "mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await getDb();

  switch (req.method) {
    case "GET":
      // Get all players
      const players = await db.collection("players").find().toArray();
      res.json(players);
      break;

    case "POST":
      // Add a new player
      const { name } = req.body;
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ error: "Player name is required" });
      }

      const trimmedName = name.trim();
      
      // Check if player already exists
      const existingPlayer = await db.collection("players").findOne({ name: trimmedName });
      if (existingPlayer) {
        return res.status(400).json({ error: "Player already exists" });
      }

      const newPlayer = await db.collection("players").insertOne({ name: trimmedName });
      res.status(201).json({ _id: newPlayer.insertedId, name: trimmedName });
      break;

    case "DELETE":
      // Delete a player
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).json({ error: "Player ID is required" });
      }

      try {
        const objectId = new ObjectId(id);
        
        // First get the player name before deleting
        const playerToDelete = await db.collection("players").findOne({ _id: objectId });
        if (!playerToDelete) {
          return res.status(404).json({ error: "Player not found" });
        }

        const deleteResult = await db.collection("players").deleteOne({ _id: objectId });
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: "Player not found" });
        }

        // Also delete any matches involving this player's name
        await db.collection("matches").deleteMany({
          $or: [
            { playerA: playerToDelete.name },
            { playerB: playerToDelete.name }
          ]
        });

        res.json({ success: true });
      } catch (error) {
        return res.status(400).json({ error: "Invalid player ID" });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST", "DELETE"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}