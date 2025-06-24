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
  // Winner state: { [matchId]: winnerName }
  const [winners, setWinners] = useState<{ [matchId: string]: string }>({});
  const [showFinals, setShowFinals] = useState(false);
  const [quarterFinals, setQuarterFinals] = useState<{ player1: string; player2: string }[]>([]);
  const [semiFinals, setSemiFinals] = useState<{ player1: string; player2: string }[]>([]);
  const [topTeams, setTopTeams] = useState<string[]>([]);

  async function handleGenerate() {
    setGenerating(true);
    await fetch("/api/generateSchedule", { method: "POST" });
    await mutateMatches();
    setWinners({});
    setShowFinals(false);
    setQuarterFinals([]);
    setSemiFinals([]);
    setTopTeams([]);
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
      setWinners({});
      setShowFinals(false);
      setQuarterFinals([]);
      setSemiFinals([]);
      setTopTeams([]);
    } catch (err) {
      setError("Failed to delete player");
    } finally {
      setDeletingPlayer(null);
    }
  }

  // Handle winner selection for a match
  function handleWinnerSelect(matchId: string, winnerName: string) {
    setWinners((prev) => ({ ...prev, [matchId]: winnerName }));
    setShowFinals(false);
    setQuarterFinals([]);
    setSemiFinals([]);
    setTopTeams([]);
  }

  // Calculate wins for each player
  let winCount: { [player: string]: number } = {};
  if (matches && matches.length > 0) {
    matches.forEach((m: any) => {
      const winner = winners[m._id];
      if (winner) {
        winCount[winner] = (winCount[winner] || 0) + 1;
      }
    });
  }

  // Button handler to show finals
  function handleShowFinals() {
    if (!players) return;
    const sorted = players
      .map((p) => ({ name: p.name, wins: winCount[p.name] || 0 }))
      .sort((a, b) => b.wins - a.wins)
      .map((p) => p.name);
    setTopTeams(sorted);
    if (sorted.length >= 9) {
      setQuarterFinals([
        { player1: sorted[0], player2: sorted[7] },
        { player1: sorted[1], player2: sorted[6] },
        { player1: sorted[2], player2: sorted[5] },
        { player1: sorted[3], player2: sorted[4] },
      ]);
      setSemiFinals([]);
      setShowFinals(true);
    } else if (sorted.length >= 4) {
      setQuarterFinals([]);
      setSemiFinals([
        { player1: sorted[0], player2: sorted[3] },
        { player1: sorted[1], player2: sorted[2] },
      ]);
      setShowFinals(true);
    } else {
      setQuarterFinals([]);
      setSemiFinals([]);
      setShowFinals(false);
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
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m, index) => (
                <tr key={m._id}>
                  <td>{m.matchNo ?? (index + 1)}</td>
                  <td>{m.playerA}</td>
                  <td>{m.playerB}</td>
                  <td>
                    <label>
                      <input
                        type="radio"
                        name={`winner-${m._id}`}
                        checked={winners[m._id] === m.playerA}
                        onChange={() => handleWinnerSelect(m._id, m.playerA)}
                      />
                      {" "}A
                    </label>
                    <label style={{ marginLeft: 8 }}>
                      <input
                        type="radio"
                        name={`winner-${m._id}`}
                        checked={winners[m._id] === m.playerB}
                        onChange={() => handleWinnerSelect(m._id, m.playerB)}
                      />
                      {" "}B
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleShowFinals} style={{ marginTop: 10 }}>
            Show {topTeams.length<9 ? "Semi" : "Quarter"} Finals
          </button>
        </div>
      )}

      {matches && matches.length === 0 && players && players.length >= 2 && (
        <p>No matches generated yet. Click "Generate Schedule" to create matches.</p>
      )}

      {showFinals && quarterFinals.length === 4 && (
        <div>
          <h2>Quarter Final Fixtures</h2>
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Player 1</th>
                <th>Player 2</th>
              </tr>
            </thead>
            <tbody>
              {quarterFinals.map((qf, idx) => (
                <tr key={idx}>
                  <td>{`QF${idx + 1}`}</td>
                  <td>{qf.player1}</td>
                  <td>{qf.player2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFinals && semiFinals.length === 2 && (
        <div>
          <h2>Semi Final Fixtures</h2>
          <table>
            <thead>
              <tr>
                <th>Match</th>
                <th>Player 1</th>
                <th>Player 2</th>
              </tr>
            </thead>
            <tbody>
              {semiFinals.map((sf, idx) => (
                <tr key={idx}>
                  <td>{`SF${idx + 1}`}</td>
                  <td>{sf.player1}</td>
                  <td>{sf.player2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
