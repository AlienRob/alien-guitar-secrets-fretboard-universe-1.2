import React from "react";
import { useListAchievements } from "@workspace/api-client-react";
import { Lock, Unlock } from "lucide-react";

export default function Achievements() {
  const { data: achievements, isLoading } = useListAchievements();

  if (isLoading) {
    return <div className="text-accent animate-pulse">SCANNING ACHIEVEMENTS...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-sans font-bold text-accent">ACHIEVEMENTS</h1>
        <p className="text-muted-foreground">Your galactic commendations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements?.map((ach) => (
          <div 
            key={ach.id} 
            className={`p-6 rounded-lg border flex items-start gap-4 transition-all duration-300 ${
              ach.unlockedAt 
                ? "bg-primary/20 border-primary alien-glow" 
                : "bg-card/30 border-muted/50 opacity-60 grayscale"
            }`}
          >
            <div className={`p-3 rounded-full ${ach.unlockedAt ? 'bg-primary/30 text-accent' : 'bg-muted text-muted-foreground'}`}>
              {ach.unlockedAt ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="font-sans font-bold text-lg mb-1">{ach.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{ach.description}</p>
              <div className="text-xs font-mono text-secondary">Reward: {ach.xpReward} XP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
