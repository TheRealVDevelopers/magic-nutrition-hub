import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import { useClubProducts, useAddProduct, useUpdateProduct, useRestockProduct, useToggleTodaysSpecial, useLowStockProducts, useExpiringProducts } from "@/hooks/useInventory";
import ProductTable from "@/components/inventory/ProductTable";
import ProductForm from "@/components/inventory/ProductForm";
import StockAdjustmentForm from "@/components/inventory/StockAdjustmentForm";
import type { Product } from "@/types/firestore";

export default function InventoryPage() {
    const [searchParams] = useSearchParams();
    const initFilter = searchParams.get("filter") || "all";

    const { toast } = useToast();
    const { club } = useClubContext();
    const { data: products = [], isLoading } = useClubProducts();
    const { products: lowStock } = useLowStockProducts();
    const { data: expiring = [] } = useExpiringProducts();

    const addProduct = useAddProduct();
    const updateProduct = useUpdateProduct();
    const restockProduct = useRestockProduct();
    const toggleToday = useToggleTodaysSpecial();

    const [filter, setFilter] = useState(initFilter);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [restockProductObj, setRestockProductObj] = useState<Product | null>(null);

    useEffect(() => {
        if (initFilter && initFilter !== filter) setFilter(initFilter);
    }, [initFilter]);

    const filteredProducts = useMemo(() => {
        if (filter === "all") return products;
        if (filter === "low") return products.filter((p) => p.stock <= p.lowStockThreshold);
        if (filter === "expiring") {
            const ids = new Set(expiring.map((p) => p.id));
            return products.filter((p) => ids.has(p.id));
        }
        return products.filter((p) => p.category === filter);
    }, [products, filter, expiring]);

    const handleAddSubmit = async (data: any) => {
        try {
            await addProduct.mutateAsync(data);
            setIsAddOpen(false);
            toast({ title: "Product added" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleEditSubmit = async (data: any) => {
        if (!editingProduct) return;
        try {
            await updateProduct.mutateAsync({ productId: editingProduct.id, data });
            setEditingProduct(null);
            toast({ title: "Product updated" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleRestock = async (qty: number, note: string) => {
        if (!restockProductObj) return;
        try {
            await restockProduct.mutateAsync({
                productId: restockProductObj.id,
                currentStock: restockProductObj.stock,
                addedQty: qty,
                note,
            });
            setRestockProductObj(null);
            toast({ title: "Stock updated" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleToggle = (p: Product, checked: boolean) => {
        toggleToday.mutate({ productId: p.id, isActive: checked });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-wellness-forest flex items-center gap-2">
                    <Package className="w-6 h-6" /> Inventory
                </h1>
                <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
                    <Plus className="w-4 h-4" /> Add Product
                </Button>
            </div>

            {/* Alerts */}
            <div className="space-y-2">
                {lowStock.length > 0 && (
                    <div className="bg-orange-50 text-orange-800 p-3 rounded-lg border border-orange-200 text-sm font-bold flex justify-between items-center cursor-pointer" onClick={() => setFilter("low")}>
                        <span>{lowStock.length} items are running low on stock</span>
                        <span className="text-orange-600 text-xs">View</span>
                    </div>
                )}
                {expiring.length > 0 && (
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-sm font-medium flex justify-between items-center cursor-pointer" onClick={() => setFilter("expiring")}>
                        <span>{expiring.length} items expire within 7 days</span>
                        <span className="text-amber-600 text-xs">View</span>
                    </div>
                )}
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full max-w-2xl h-auto">
                        <TabsTrigger value="all" className="py-2">All</TabsTrigger>
                        <TabsTrigger value="shake" className="py-2">Shakes</TabsTrigger>
                        <TabsTrigger value="supplement" className="py-2">Supplements</TabsTrigger>
                        <TabsTrigger value="snack" className="py-2">Snacks</TabsTrigger>
                        <TabsTrigger value="low" className="py-2 text-orange-600 data-[state=active]:text-orange-700">Low Stock</TabsTrigger>
                        <TabsTrigger value="expiring" className="py-2 text-amber-600 data-[state=active]:text-amber-700">Expiring</TabsTrigger>
                    </TabsList>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" /></div>
                ) : (
                    <ProductTable
                        products={filteredProducts}
                        currencyName={club?.currencyName || "Coins"}
                        onEdit={setEditingProduct}
                        onRestock={setRestockProductObj}
                        onToggleToday={handleToggle}
                    />
                )}
            </Tabs>

            {/* Modals */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none"><ProductForm mode="add" onSubmit={handleAddSubmit} onClose={() => setIsAddOpen(false)} isLoading={addProduct.isPending} /></DialogContent>
            </Dialog>

            <Dialog open={!!editingProduct} onOpenChange={(o) => { if (!o) setEditingProduct(null); }}>
                <DialogContent className="max-w-2xl p-0 border-none bg-transparent shadow-none"><ProductForm mode="edit" defaultValues={editingProduct || undefined} onSubmit={handleEditSubmit} onClose={() => setEditingProduct(null)} isLoading={updateProduct.isPending} /></DialogContent>
            </Dialog>

            <Dialog open={!!restockProductObj} onOpenChange={(o) => { if (!o) setRestockProductObj(null); }}>
                <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none"><StockAdjustmentForm productName={restockProductObj?.name || ""} currentStock={restockProductObj?.stock || 0} onSubmit={handleRestock} onClose={() => setRestockProductObj(null)} isLoading={restockProduct.isPending} /></DialogContent>
            </Dialog>
        </div>
    );
}
