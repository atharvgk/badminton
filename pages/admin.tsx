import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Player {
  _id: string;
  name: string;
}

export default function Admin() {
  const { data: matches, mutate: mutateMatches } = useSWR<any[]>("/api/matches", fetcher);
  const { data: players, mutate: mutatePlayers } = useSWR<Player[]>("/api/player", fetcher);
  const [generating, setGenerating] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [deletingPlayer, setDeletingPlayer] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    await fetch("/api/generateSchedule", { method: "POST" });
    await mutateMatches();
    setGenerating(false);
  }

  async function handleAddPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setAddingPlayer(true);
    setError("");

    try {
      const response = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add player");
        return;
      }

      setNewPlayerName("");
      await mutatePlayers();
    } catch (err) {
      setError("Failed to add player");
    } finally {
      setAddingPlayer(false);
    }
  }

  async function handleDeletePlayer(playerId: string) {
    setDeletingPlayer(playerId);
    setError("");

    try {
      const response = await fetch(`/api/player?id=${playerId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete player");
        return;
      }

      await mutatePlayers();
      await mutateMatches();
    } catch (err) {
      setError("Failed to delete player");
    } finally {
      setDeletingPlayer(null);
    }
  }

  return (
    <div>
      <h1>Badminton Round-Robin Scheduler</h1>
      
      <div>
        <h2>Player Management</h2>
        
        <form onSubmit={handleAddPlayer}>
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Enter player name"
            disabled={addingPlayer}
          />
          <button type="submit" disabled={addingPlayer || !newPlayerName.trim()}>
            {addingPlayer ? "Adding..." : "Add Player"}
          </button>
        </form>

        {error && <div>{error}</div>}

        {players && players.length > 0 && (
          <div>
            <h3>Current Players {players.length}</h3>
            <div>
              {players.map((player) => (
                <div key={player._id}>
                  <span>{player.name}</span>
                  <button
                    onClick={() => handleDeletePlayer(player._id)}
                    disabled={deletingPlayer === player._id}
                  >
                    {deletingPlayer === player._id ? "..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {players && players.length === 0 && (
          <p>No players added yet. Add some players to get started!</p>
        )}
      </div>

      <div>
        <h2>Schedule Generation</h2>
        <button 
          onClick={handleGenerate} 
          disabled={generating || !players || players.length < 2}
        >
          {generating ? "Generating…" : `Generate Schedule (${players?.length || 0} players)`}
        </button>
        
        {players && players.length < 2 && (
          <p>Need at least 2 players to generate a schedule.</p>
        )}
      </div>

      {matches && matches.length > 0 && (
        <div>
          <h2>Generated Matches ({matches.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Match No.</th>
                <th>Player A</th>
                <th>Player B</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, index) => (
                <tr key={m._id}>
                  <td>{m.matchNo ?? (index + 1)}</td>
                  <td>{m.playerA}</td>
                  <td>{m.playerB}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {matches && matches.length === 0 && players && players.length >= 2 && (
        <p>No matches generated yet. Click "Generate Schedule" to create matches.</p>
      )}
    </div>
  );
}
