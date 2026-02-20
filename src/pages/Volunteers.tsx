import { useState } from "react";
import { Eye, UserPlus, ArrowLeft, Fingerprint } from "lucide-react";
import { volunteers, Volunteer } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Volunteers() {
  const [selectedVol, setSelectedVol] = useState<Volunteer | null>(null);
  const [showBio, setShowBio] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      {!selectedVol ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Volunteers</h2>
              <p className="text-sm text-muted-foreground">{volunteers.length} registered volunteers</p>
            </div>
            <Button className="gap-2"><UserPlus className="w-4 h-4" /> Add Volunteer</Button>
          </div>
          <div className="stat-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-left">
                <th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Phone</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium text-center">Days Worked</th><th className="pb-3 font-medium text-center">Hours (Month)</th><th className="pb-3 font-medium"></th>
              </tr></thead>
              <tbody>
                {volunteers.map(v => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 font-medium text-foreground">{v.name}</td>
                    <td className="py-3">{v.phone}</td>
                    <td className="py-3"><span className="bg-secondary text-secondary-foreground text-xs px-2.5 py-0.5 rounded-full">{v.role}</span></td>
                    <td className="py-3 text-center">{v.totalDaysWorked}</td>
                    <td className="py-3 text-center font-semibold">{v.totalHoursThisMonth}</td>
                    <td className="py-3"><Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setSelectedVol(v)}><Eye className="w-3.5 h-3.5" /> View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setSelectedVol(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Volunteers
          </button>
          <div className="stat-card flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-heading text-lg font-bold">
              {selectedVol.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground">{selectedVol.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedVol.role} • {selectedVol.phone}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="stat-card text-center"><p className="text-2xl font-heading font-bold text-primary">{selectedVol.totalDaysWorked}</p><p className="text-xs text-muted-foreground">Total Days</p></div>
            <div className="stat-card text-center"><p className="text-2xl font-heading font-bold text-primary">{selectedVol.totalHoursThisMonth}</p><p className="text-xs text-muted-foreground">Hours This Month</p></div>
            <div className="stat-card flex gap-2 items-center justify-center">
              <Button size="sm">Mark Attendance</Button>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowBio(true)}><Fingerprint className="w-4 h-4" /> Biometric</Button>
            </div>
          </div>
          <div className="stat-card">
            <h3 className="font-heading font-semibold text-foreground mb-3">Attendance Table</h3>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-left"><th className="pb-2">Date</th><th className="pb-2">In Time</th><th className="pb-2">Out Time</th><th className="pb-2 text-right">Hours</th></tr></thead>
              <tbody>
                {selectedVol.attendance.map((a, i) => (
                  <tr key={i} className="border-b border-border/50"><td className="py-2">{a.date}</td><td className="py-2">{a.inTime}</td><td className="py-2">{a.outTime}</td><td className="py-2 text-right font-semibold">{a.totalHours}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Dialog open={showBio} onOpenChange={setShowBio}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle className="font-heading">Biometric Scan</DialogTitle></DialogHeader>
          <div className="py-6">
            <Fingerprint className="w-16 h-16 mx-auto text-primary mb-3 animate-pulse" />
            <p className="text-sm text-muted-foreground">Place your finger on the scanner...</p>
            <p className="text-xs text-muted-foreground mt-2">(Demo Mode)</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
