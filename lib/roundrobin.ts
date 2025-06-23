export interface Match {
  matchNo: number;
  playerA: string;
  playerB: string;
}

export function generateMatches(players: string[]): Match[] {
  const list = [...players];
  if (list.length < 2) return [];

  const matches: Match[] = [];
  let matchNo = 1;

  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      matches.push({ 
        matchNo: matchNo++, 
        playerA: list[i], 
        playerB: list[j] 
      });
    }
  }
  return matches;
}
