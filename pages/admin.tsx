import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Admin() {
  const { data: matches, mutate } = useSWR<any[]>("/api/matches", fetcher);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    await fetch("/api/generateSchedule", { method: "POST" });
    await mutate();
    setGenerating(false);
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Badminton Round-Robin Scheduler</h1>
      <button onClick={handleGenerate} disabled={generating}>
        {generating ? "Generating…" : "Generate Schedule"}
      </button>

      {matches && matches.length > 0 && (
        <table style={{ marginTop: 24, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: 4 }}>Match #</th>
              <th style={{ border: "1px solid #ccc", padding: 4 }}>Player A</th>
              <th style={{ border: "1px solid #ccc", padding: 4 }}>Player B</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((m, index) => (
              <tr key={m._id}>
                <td style={{ border: "1px solid #ccc", padding: 4 }}>{m.matchNo ?? (index + 1)}</td>
                <td style={{ border: "1px solid #ccc", padding: 4 }}>{m.playerA}</td>
                <td style={{ border: "1px solid #ccc", padding: 4 }}>{m.playerB}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
