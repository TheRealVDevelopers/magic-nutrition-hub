import { useState } from "react";
import { Plus, Edit, PackagePlus } from "lucide-react";
import { products } from "@/data/mockData";
import { Button } from "@/components/ui/button";

export default function Inventory() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Inventory</h2>
          <p className="text-sm text-muted-foreground">{products.length} products tracked</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
          <Button variant="outline" className="gap-2"><PackagePlus className="w-4 h-4" /> Add Stock</Button>
        </div>
      </div>

      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-3 font-medium">Product</th><th className="pb-3 font-medium">Category</th><th className="pb-3 font-medium text-center">Stock</th><th className="pb-3 font-medium text-center">Reorder</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium"></th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="py-3 font-medium text-foreground">{p.name}</td>
                <td className="py-3 text-muted-foreground">{p.category}</td>
                <td className={`py-3 text-center font-semibold ${p.status === "Critical" ? "text-destructive" : p.status === "Low" ? "text-accent" : "text-foreground"}`}>{p.stock}</td>
                <td className="py-3 text-center text-muted-foreground">{p.reorderLevel}</td>
                <td className="py-3">
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    p.status === "OK" ? "bg-emerald-100 text-emerald-700" : p.status === "Low" ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"
                  }`}>{p.status}</span>
                </td>
                <td className="py-3"><Button variant="ghost" size="sm" className="gap-1 text-xs"><Edit className="w-3.5 h-3.5" /> Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
