import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { members } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function MemberProfile() {
  const { id } = useParams();
  const member = members.find((m) => m.id === id);

  if (!member) return <div className="p-8 text-center text-muted-foreground">Member not found.</div>;

  const totalDays = Math.max(1, Math.round((new Date(member.expiryDate).getTime() - new Date(member.startDate).getTime()) / 86400000));
  const elapsed = totalDays - member.daysLeft;
  const progress = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <Link to="/members" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Members
      </Link>

      {/* Profile Summary */}
      <div className="stat-card flex flex-wrap gap-6 items-start">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-heading text-xl font-bold">
          {member.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-heading text-xl font-bold text-foreground">{member.name}</h2>
          <p className="text-sm text-muted-foreground">{member.id} • {member.phone}</p>
          <div className="flex gap-2 mt-2">
            <span className={`badge-${member.package.toLowerCase()}`}>{member.package}</span>
            <span className={`badge-${member.status.toLowerCase()}`}>{member.status}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-accent"><Star className="w-4 h-4" /><span className="font-heading font-bold text-lg">{member.totalPoints}</span></div>
          <p className="text-xs text-muted-foreground">Loyalty Points</p>
        </div>
      </div>

      {/* Membership Progress */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-2">Membership Progress</h3>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{member.startDate}</span>
          <span>{member.expiryDate}</span>
        </div>
        <Progress value={progress} className="h-3" />
        <p className="text-sm mt-2 font-medium text-foreground">
          {member.daysLeft > 0 ? `${member.daysLeft} days remaining` : "Membership expired"}
        </p>
        <div className="flex gap-2 mt-3">
          <Button size="sm">Renew Membership</Button>
          <Button size="sm" variant="outline">Upgrade Package</Button>
        </div>
      </div>

      {/* Attendance */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-3">Attendance History</h3>
        {member.attendance.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Date</th><th className="pb-2">In Time</th><th className="pb-2">Out Time</th></tr></thead>
            <tbody>
              {member.attendance.map((a, i) => (
                <tr key={i} className="border-b border-border/50"><td className="py-2">{a.date}</td><td className="py-2">{a.inTime}</td><td className="py-2">{a.outTime}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Billing History */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-3">Billing History</h3>
        {member.billingHistory.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Date</th><th className="pb-2">Bill #</th><th className="pb-2">Items</th><th className="pb-2 text-right">Amount</th></tr></thead>
            <tbody>
              {member.billingHistory.map((b, i) => (
                <tr key={i} className="border-b border-border/50"><td className="py-2">{b.date}</td><td className="py-2 font-mono text-xs">{b.billNo}</td><td className="py-2">{b.items}</td><td className="py-2 text-right font-semibold">₹{b.amount}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Points History */}
      <div className="stat-card">
        <h3 className="font-heading font-semibold text-foreground mb-3">Points History</h3>
        {member.pointsHistory.length === 0 ? <p className="text-sm text-muted-foreground">No records.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Date</th><th className="pb-2">Activity</th><th className="pb-2 text-right">Points</th></tr></thead>
            <tbody>
              {member.pointsHistory.map((p, i) => (
                <tr key={i} className="border-b border-border/50"><td className="py-2">{p.date}</td><td className="py-2">{p.activity}</td><td className="py-2 text-right font-semibold text-primary">+{p.points}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
