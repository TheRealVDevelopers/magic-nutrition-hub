import { Plus, Package, AlertTriangle, RefreshCw, Search, ChevronRight, Edit3, Trash2 } from "lucide-react";
import { products } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Inventory() {
  const lowStock = products.filter(p => p.status !== "OK");

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-wellness-forest tracking-tight">Product Inventory</h2>
          <p className="text-primary font-black uppercase tracking-widest text-xs mt-1">Resource Management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="btn-premium border-primary/20 text-primary">
            <RefreshCw className="w-4 h-4 mr-2" /> Sync Stock
          </Button>
          <Button className="btn-premium bg-primary text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {/* Quick Status Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="premium-card bg-wellness-forest text-white border-none flex items-center gap-6 group hover:translate-y-[-4px] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-4xl font-black">{products.length}</p>
            <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">Total SKUs</p>
          </div>
        </div>
        <div className="premium-card bg-white border-none shadow-premium flex items-center gap-6 hover:translate-y-[-4px] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-accent" />
          </div>
          <div>
            <p className="text-4xl font-black text-wellness-forest">{lowStock.length}</p>
            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">Low Stock Items</p>
          </div>
        </div>
        <div className="premium-card bg-wellness-mint border-none shadow-soft flex items-center gap-6 hover:translate-y-[-4px] transition-transform">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-black text-wellness-forest">Restock Needed</p>
            <Button variant="link" className="p-0 h-auto text-primary font-black text-xs uppercase tracking-widest">Identify Items <ChevronRight className="w-3 h-3 ml-1" /></Button>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="premium-card p-0 overflow-hidden border-none shadow-premium bg-white">
        <div className="p-6 border-b border-border bg-wellness-cream/30 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search by SKU, Name, or Category..."
              className="w-full bg-white border border-border rounded-2xl py-2.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
            {["All", "Shakes", "Juices", "Supplements"].map(cat => (
              <Button key={cat} variant="ghost" className="text-xs font-black text-wellness-forest hover:bg-wellness-mint hover:text-primary rounded-full px-4">{cat}</Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-wellness-sage/5 border-b border-border text-left">
                <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Category</th>
                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stock Level</th>
                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Price</th>
                <th className="px-6 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-wellness-mint/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform border border-border">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-wellness-forest mb-0.5">{p.name}</p>
                        <p className="text-[10px] font-black text-muted-foreground">{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-3 py-1 rounded-full bg-wellness-sage/10 text-wellness-forest text-[10px] font-black uppercase">{p.category}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2 max-w-[120px]">
                      <div className="flex justify-between items-center text-[10px] font-black text-wellness-forest">
                        <span>{p.stock} Units</span>
                        <span className="text-muted-foreground">/{p.reorderLevel * 5}</span>
                      </div>
                      <Progress value={(p.stock / (p.reorderLevel * 5)) * 100} className={`h-1.5 ${p.status === "OK" ? "bg-primary/20" : "bg-accent/20"}`} />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm font-black text-wellness-forest">₹{p.price}</td>
                  <td className="px-6 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === "OK" ? "bg-primary text-white" :
                      p.status === "Low" ? "bg-accent text-white" :
                        "bg-destructive text-white"
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"><Edit3 className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
