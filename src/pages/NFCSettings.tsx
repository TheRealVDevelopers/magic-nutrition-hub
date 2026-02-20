import { Wifi, WifiOff, Fingerprint, RefreshCw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NFCSettings() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">NFC & Device Settings</h2>
        <p className="text-sm text-muted-foreground">Manage connected hardware devices</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* NFC Reader */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Wifi className="w-6 h-6 text-primary" /></div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">NFC Reader</h3>
              <span className="badge-active">Connected</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Last Scan Time</span><span className="font-medium">Today 07:45 AM</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Scans Today</span><span className="font-medium">23</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Device Model</span><span className="font-medium">ACR122U</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="gap-1"><Play className="w-3.5 h-3.5" /> Test Device</Button>
            <Button size="sm" variant="outline" className="gap-1"><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
          </div>
        </div>

        {/* Biometric */}
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center"><Fingerprint className="w-6 h-6 text-accent" /></div>
            <div>
              <h3 className="font-heading font-semibold text-foreground">Biometric Device</h3>
              <span className="badge-expiring">Standby</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Last Authentication</span><span className="font-medium">Today 07:30 AM</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Auth Today</span><span className="font-medium">18</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Device Model</span><span className="font-medium">MFS100 v2</span></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button size="sm" className="gap-1"><Play className="w-3.5 h-3.5" /> Test Device</Button>
            <Button size="sm" variant="outline" className="gap-1"><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
