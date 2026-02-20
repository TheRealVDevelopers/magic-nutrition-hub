import { useState } from "react";
import { Scan, Printer, Save, MessageCircle, Trash2 } from "lucide-react";
import { products, CLUB_INFO, members } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CartItem { id: string; name: string; price: number; qty: number }

const categories = ["Shakes", "Healthy Juices", "Sprouts", "Supplements", "Membership Plans"];

export default function Billing() {
  const [selectedCat, setSelectedCat] = useState("Shakes");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [gstRate] = useState(5);
  const [discount, setDiscount] = useState(0);

  const catProducts = products.filter(p => p.category === selectedCat);
  const foundMember = members.find(m => m.id === memberSearch || m.name.toLowerCase().includes(memberSearch.toLowerCase()));

  const addToCart = (p: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === p.id);
      if (existing) return prev.map(c => c.id === p.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };
  const removeFromCart = (id: string) => setCart(prev => prev.filter(c => c.id !== id));
  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const gstAmount = Math.round(subtotal * gstRate / 100);
  const total = subtotal + gstAmount - discount;

  return (
    <div className="animate-fade-in h-full">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Billing (POS)</h2>

      {/* NFC / Member Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Scan NFC / Enter Member ID..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => { if (foundMember) setShowMember(true); }}>Lookup</Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 h-[calc(100vh-220px)]">
        {/* Left: Products */}
        <div className="lg:col-span-3 flex flex-col stat-card overflow-hidden">
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {categories.map(c => (
              <Button key={c} size="sm" variant={selectedCat === c ? "default" : "outline"} onClick={() => setSelectedCat(c)}>
                {c}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto flex-1">
            {catProducts.map(p => (
              <button key={p.id} onClick={() => addToCart(p)} className="text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-secondary transition-colors">
                <p className="font-medium text-foreground text-sm">{p.name}</p>
                <p className="text-primary font-heading font-bold mt-1">₹{p.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="lg:col-span-2 stat-card flex flex-col">
          <h3 className="font-heading font-semibold text-foreground mb-3">Cart</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No items added yet.</p>}
            {cart.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">₹{c.price} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateQty(c.id, c.qty - 1)}>-</Button>
                  <span className="text-sm font-medium w-5 text-center">{c.qty}</span>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0" onClick={() => updateQty(c.id, c.qty + 1)}>+</Button>
                  <span className="text-sm font-semibold w-14 text-right">₹{c.price * c.qty}</span>
                  <button onClick={() => removeFromCart(c.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-border pt-3 mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({gstRate}%)</span><span>₹{gstAmount}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Discount</span>
              <Input className="w-20 h-7 text-right text-sm" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
            <div className="flex justify-between font-heading font-bold text-lg border-t border-border pt-2">
              <span>Total</span><span className="text-primary">₹{total}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1">Cash</Button>
            <Button variant="outline" size="sm" className="flex-1">UPI</Button>
            <Button variant="outline" size="sm" className="flex-1">Card</Button>
          </div>

          <div className="flex gap-2 mt-3">
            <Button className="flex-1 gap-1" onClick={() => setShowInvoice(true)}><Printer className="w-4 h-4" /> Print Bill</Button>
            <Button variant="outline" className="gap-1"><Save className="w-4 h-4" /></Button>
            <Button variant="outline" className="gap-1"><MessageCircle className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Invoice Preview</DialogTitle></DialogHeader>
          <div className="text-sm space-y-3">
            <div className="text-center border-b border-border pb-3">
              <p className="font-heading font-bold text-foreground">{CLUB_INFO.name}</p>
              <p className="text-xs text-muted-foreground">{CLUB_INFO.clubName}</p>
              <p className="text-xs text-muted-foreground">{CLUB_INFO.address}</p>
              <p className="text-xs text-muted-foreground">GSTIN: {CLUB_INFO.gstin}</p>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bill #: B{Math.floor(Math.random() * 9000 + 1000)}</span>
              <span>Date: {new Date().toLocaleDateString()}</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border"><th className="text-left pb-1">Item</th><th className="text-center pb-1">Qty</th><th className="text-right pb-1">Amount</th></tr></thead>
              <tbody>
                {cart.map(c => (
                  <tr key={c.id} className="border-b border-border/50"><td className="py-1">{c.name}</td><td className="text-center py-1">{c.qty}</td><td className="text-right py-1">₹{c.price * c.qty}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-xs border-t border-border pt-2">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
              <div className="flex justify-between"><span>GST ({gstRate}%)</span><span>₹{gstAmount}</span></div>
              {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{discount}</span></div>}
              <div className="flex justify-between font-bold text-sm border-t border-border pt-1"><span>Total</span><span>₹{total}</span></div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">Thank you for visiting Magic Nutrition Club!</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Popup */}
      <Dialog open={showMember} onOpenChange={setShowMember}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Member Profile</DialogTitle></DialogHeader>
          {foundMember && (
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> <strong>{foundMember.name}</strong></p>
              <p><span className="text-muted-foreground">ID:</span> {foundMember.id}</p>
              <p><span className="text-muted-foreground">Package:</span> <span className={`badge-${foundMember.package.toLowerCase()}`}>{foundMember.package}</span></p>
              <p><span className="text-muted-foreground">Status:</span> <span className={`badge-${foundMember.status.toLowerCase()}`}>{foundMember.status}</span></p>
              <p><span className="text-muted-foreground">Points:</span> {foundMember.totalPoints}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
