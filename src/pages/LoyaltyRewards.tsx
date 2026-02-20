import { Star, Trophy, Crown } from "lucide-react";
import { loyaltyConfig, members } from "@/data/mockData";

export default function LoyaltyRewards() {
  const leaderboard = [...members].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);
  const starMember = leaderboard[0];

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Loyalty & Rewards</h2>
        <p className="text-sm text-muted-foreground">Automated Loyalty Engine</p>
      </div>

      {/* Star Member */}
      {starMember && (
        <div className="stat-card bg-gradient-to-r from-primary/5 to-secondary border-l-4 border-l-accent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-accent-foreground">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-wide">⭐ Monthly Star Member</p>
              <h3 className="font-heading text-xl font-bold text-foreground">{starMember.name}</h3>
              <p className="text-sm text-muted-foreground">{starMember.totalPoints} points • {starMember.package} Member</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Points Configuration */}
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Points Configuration</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Activity</th><th className="pb-2 text-right">Points</th></tr></thead>
            <tbody>
              {loyaltyConfig.map((l, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2.5">{l.activity}</td>
                  <td className="py-2.5 text-right"><span className="inline-flex items-center gap-1 text-primary font-semibold"><Star className="w-3 h-3" /> +{l.points}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leaderboard */}
        <div className="stat-card">
          <h3 className="font-heading font-semibold text-foreground mb-3">Top 10 Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${i === 0 ? "bg-accent/10" : "bg-muted/30"}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? "bg-accent text-accent-foreground" : i === 1 ? "bg-muted-foreground/20 text-foreground" : i === 2 ? "bg-amber-200 text-amber-900" : "bg-muted text-muted-foreground"
                }`}>
                  {i < 3 ? <Trophy className="w-3.5 h-3.5" /> : i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.package}</p>
                </div>
                <span className="font-heading font-bold text-primary">{m.totalPoints}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
