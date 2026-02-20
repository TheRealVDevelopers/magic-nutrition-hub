import { useState } from "react";
import { members } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, MessageSquare } from "lucide-react";

type FilterType = "all" | "3days" | "7days" | "expired";

export default function ExpiryManagement() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [showBulk, setShowBulk] = useState(false);

  const filtered = members.filter(m => {
    if (filter === "3days") return m.daysLeft > 0 && m.daysLeft <= 3;
    if (filter === "7days") return m.daysLeft > 0 && m.daysLeft <= 7;
    if (filter === "expired") return m.daysLeft <= 0;
    return true;
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Expiry Management</h2>
          <p className="text-sm text-muted-foreground">Monitor and manage membership expirations</p>
        </div>
        <Button className="gap-2" onClick={() => setShowBulk(true)}><Send className="w-4 h-4" /> Send Bulk Reminder</Button>
      </div>

      <div className="flex gap-1.5">
        {([["all", "All"], ["3days", "Expiring in 3 Days"], ["7days", "Expiring in 7 Days"], ["expired", "Expired"]] as const).map(([key, label]) => (
          <Button key={key} size="sm" variant={filter === key ? "default" : "outline"} onClick={() => setFilter(key)}>{label}</Button>
        ))}
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-3 font-medium">Member</th><th className="pb-3 font-medium">Package</th><th className="pb-3 font-medium">Expiry Date</th><th className="pb-3 font-medium text-center">Days Left</th><th className="pb-3 font-medium">Action</th>
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 font-medium text-foreground">{m.name}</td>
                <td className="py-3"><span className={`badge-${m.package.toLowerCase()}`}>{m.package}</span></td>
                <td className="py-3">{m.expiryDate}</td>
                <td className={`py-3 text-center font-semibold ${m.daysLeft <= 0 ? "text-destructive" : m.daysLeft <= 3 ? "text-accent" : "text-foreground"}`}>
                  {m.daysLeft <= 0 ? "Expired" : m.daysLeft}
                </td>
                <td className="py-3">
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="text-xs h-7"><MessageSquare className="w-3 h-3 mr-1" /> Remind</Button>
                    <Button size="sm" className="text-xs h-7">Renew</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={showBulk} onOpenChange={setShowBulk}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader><DialogTitle className="font-heading">Bulk SMS Reminder</DialogTitle></DialogHeader>
          <div className="py-4">
            <Send className="w-12 h-12 mx-auto text-primary mb-3" />
            <p className="text-sm text-foreground font-medium">Ready to send reminders to {filtered.length} member(s)</p>
            <p className="text-xs text-muted-foreground mt-1">(Demo Mode – No SMS will be sent)</p>
            <Button className="mt-4 w-full">Send Now</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
