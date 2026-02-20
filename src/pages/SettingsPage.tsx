import { useState } from "react";
import { CLUB_INFO, loyaltyConfig } from "@/data/mockData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [gst, setGst] = useState(5);
  const [bronze, setBronze] = useState(1500);
  const [silver, setSilver] = useState(2500);
  const [gold, setGold] = useState(4000);
  const [cash, setCash] = useState(true);
  const [upi, setUpi] = useState(true);
  const [card, setCard] = useState(true);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your club preferences</p>
      </div>

      {/* Club Details */}
      <div className="stat-card space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Club Details</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">Club Name</Label><Input defaultValue={CLUB_INFO.name} /></div>
          <div><Label className="text-xs text-muted-foreground">Sub Name</Label><Input defaultValue={CLUB_INFO.clubName} /></div>
          <div><Label className="text-xs text-muted-foreground">Address</Label><Input defaultValue={CLUB_INFO.address} /></div>
          <div><Label className="text-xs text-muted-foreground">GSTIN</Label><Input defaultValue={CLUB_INFO.gstin} /></div>
          <div><Label className="text-xs text-muted-foreground">Phone</Label><Input defaultValue={CLUB_INFO.phone} /></div>
        </div>
      </div>

      {/* GST */}
      <div className="stat-card space-y-3">
        <h3 className="font-heading font-semibold text-foreground">GST Configuration</h3>
        <div className="flex items-center gap-3">
          <Label className="text-sm">GST Percentage</Label>
          <Input className="w-24" type="number" value={gst} onChange={(e) => setGst(Number(e.target.value))} />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      </div>

      {/* Package Pricing */}
      <div className="stat-card space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Package Pricing</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label className="text-xs text-muted-foreground">Bronze (₹)</Label><Input type="number" value={bronze} onChange={(e) => setBronze(Number(e.target.value))} /></div>
          <div><Label className="text-xs text-muted-foreground">Silver (₹)</Label><Input type="number" value={silver} onChange={(e) => setSilver(Number(e.target.value))} /></div>
          <div><Label className="text-xs text-muted-foreground">Gold (₹)</Label><Input type="number" value={gold} onChange={(e) => setGold(Number(e.target.value))} /></div>
        </div>
      </div>

      {/* Loyalty */}
      <div className="stat-card space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Loyalty Points Editor</h3>
        <div className="space-y-2">
          {loyaltyConfig.map((l, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
              <span className="text-sm">{l.activity}</span>
              <Input className="w-20 h-7 text-center text-sm" type="number" defaultValue={l.points} />
            </div>
          ))}
        </div>
      </div>

      {/* Payment Modes */}
      <div className="stat-card space-y-3">
        <h3 className="font-heading font-semibold text-foreground">Payment Modes</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><Label>Cash</Label><Switch checked={cash} onCheckedChange={setCash} /></div>
          <div className="flex items-center justify-between"><Label>UPI</Label><Switch checked={upi} onCheckedChange={setUpi} /></div>
          <div className="flex items-center justify-between"><Label>Card</Label><Switch checked={card} onCheckedChange={setCard} /></div>
        </div>
      </div>

      <Button className="w-full">Save Settings</Button>
    </div>
  );
}
