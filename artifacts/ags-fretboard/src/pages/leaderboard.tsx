import React from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading) {
    return <div className="text-accent animate-pulse">ACCESSING GALACTIC RECORDS...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-sans font-bold text-accent flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[#FFD700]" />
          LEADERBOARD
        </h1>
        <p className="text-muted-foreground">Top commanders in the sector.</p>
      </div>

      <div className="bg-card/50 border border-primary/30 rounded-lg alien-glow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-primary/30 bg-primary/10">
              <th className="p-4 text-primary font-sans">RANK</th>
              <th className="p-4 text-primary font-sans">COMMANDER</th>
              <th className="p-4 text-primary font-sans">LEVEL</th>
              <th className="p-4 text-primary font-sans">BELT</th>
              <th className="p-4 text-primary font-sans text-right">XP</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard?.map((entry) => (
              <tr key={entry.userId} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                <td className="p-4 font-mono text-accent">#{entry.rank}</td>
                <td className="p-4 font-bold">{entry.username}</td>
                <td className="p-4 text-secondary">{entry.level}</td>
                <td className="p-4 capitalize text-muted-foreground">{entry.belt.replace('_', ' ')}</td>
                <td className="p-4 text-right font-mono text-primary">{entry.xp.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
