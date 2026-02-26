import { Coffee, Edit, PackagePlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/types/firestore";

interface Props {
    products: Product[];
    currencyName: string;
    onEdit: (product: Product) => void;
    onRestock: (product: Product) => void;
    onToggleToday: (product: Product, checked: boolean) => void;
}

export default function ProductTable({ products, currencyName, onEdit, onRestock, onToggleToday }: Props) {
    if (products.length === 0) {
        return <p className="text-sm text-center text-muted-foreground py-8">No products found.</p>;
    }

    const getStockColor = (p: Product) => {
        if (p.stock === 0) return "text-red-600 font-black";
        if (p.stock <= p.lowStockThreshold) return "text-orange-600 font-bold";
        return "text-emerald-600 font-medium";
    };

    const getExpWarning = (p: Product) => {
        if (!p.expiryDate) return null;
        const d = p.expiryDate.toDate();
        const now = new Date();
        const in7Days = new Date(); in7Days.setDate(in7Days.getDate() + 7);
        if (d < now) return <span className="text-red-600 font-bold ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Expired</span>;
        if (d < in7Days) return <span className="text-orange-600 font-medium ml-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Soon</span>;
        return null;
    };

    return (
        <div className="overflow-x-auto border rounded-xl bg-white">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                    <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 text-center">Stock</th>
                        <th className="px-4 py-3">Expiry</th>
                        <th className="px-4 py-3 text-center">Today's Special</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {products.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border">
                                    {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <Coffee className="w-5 h-5 text-gray-400" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold truncate max-w-[150px]">{p.name}</p>
                                    <Badge variant="outline" className="text-[10px] py-0">{p.category}</Badge>
                                </div>
                            </td>
                            <td className="px-4 py-3 font-medium">{p.price} <span className="text-xs text-muted-foreground">{currencyName}</span></td>
                            <td className="px-4 py-3 text-center">
                                <span className={getStockColor(p)}>{p.stock}</span>
                                <span className="text-[10px] text-muted-foreground block">Min: {p.lowStockThreshold}</span>
                            </td>
                            <td className="px-4 py-3 text-xs">
                                {p.expiryDate ? p.expiryDate.toDate().toLocaleDateString() : "—"}
                                <div className="mt-0.5">{getExpWarning(p)}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                                <Switch checked={p.isAvailableToday} onCheckedChange={(c) => onToggleToday(p, c)} />
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => onRestock(p)}>
                                        <PackagePlus className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8 text-gray-600 hover:bg-gray-100" onClick={() => onEdit(p)}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
