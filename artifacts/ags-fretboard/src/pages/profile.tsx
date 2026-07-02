import React, { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, useGetProfileStats } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { getGetProfileQueryKey } from "@workspace/api-client-react";

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const { data: stats } = useGetProfileStats();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");

  useEffect(() => {
    if (profile) setUsername(profile.username);
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate(
      { data: { username } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        }
      }
    );
  };

  if (isLoading || !profile) {
    return <div className="text-accent animate-pulse">DECRYPTING IDENTITY...</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-sans font-bold text-accent">COMMANDER PROFILE</h1>
        <p className="text-muted-foreground">Manage your identity and view statistics.</p>
      </div>

      <div className="bg-card/50 border border-primary/30 p-6 rounded-lg alien-glow space-y-6">
        <div>
          <label className="block text-sm text-primary mb-2 uppercase tracking-widest">Callsign</label>
          <div className="flex gap-4">
            <Input 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="bg-background border-primary/50 text-foreground w-64 focus-visible:ring-accent"
            />
            <Button onClick={handleSave} disabled={updateProfile.isPending} className="bg-primary hover:bg-primary/80 text-primary-foreground alien-border">
              {updateProfile.isPending ? "SAVING..." : "SAVE"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-primary/20">
          <div>
            <div className="text-xs text-muted-foreground uppercase">Level</div>
            <div className="text-2xl text-accent">{profile.level}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Belt</div>
            <div className="text-2xl text-secondary capitalize">{profile.belt.replace('_', ' ')}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Solar System</div>
            <div className="text-2xl text-[#FFD700]">System {profile.solarSystem}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase">Planet</div>
            <div className="text-2xl text-primary">Planet {profile.planet}</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-sans font-bold text-secondary mb-4">COMBAT STATISTICS</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats?.map((stat) => (
            <div key={stat.exerciseType} className="bg-card/30 border border-secondary/30 p-4 rounded-lg alien-glow-cyan">
              <h3 className="font-bold text-lg mb-4 capitalize text-accent">{stat.exerciseType.replace('_', ' ')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Missions</div>
                  <div className="text-xl">{stat.totalChallenges}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Avg Score</div>
                  <div className="text-xl text-primary">{Math.round(stat.averageScore)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Best Score</div>
                  <div className="text-xl text-[#00FF66]">{stat.bestScore}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                  <div className="text-xl text-secondary">
                    {stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
