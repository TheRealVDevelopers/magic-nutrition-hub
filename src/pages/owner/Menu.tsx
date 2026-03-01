import { useState, useMemo, useEffect } from "react";
import { UtensilsCrossed, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    useMenuItems,
    useAddMenuItem,
    useUpdateMenuItem,
    useDeleteMenuItem,
    useToggleAvailability,
} from "@/hooks/owner/useMenu";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/firestore";

const CATEGORIES = ["shake", "supplement", "snack", "other"] as const;
const CAT_LABELS: Record<string, string> = { shake: "Shake", supplement: "Supplement", snack: "Snack", other: "Other" };

export default function Menu() {
    const { club } = useClubContext();
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Product | null>(null);
    const { toast } = useToast();

    const { data: items, isLoading } = useMenuItems(club?.id ?? null);
    const addItem = useAddMenuItem();
    const updateItem = useUpdateMenuItem();
    const deleteItem = useDeleteMenuItem();
    const toggleAvail = useToggleAvailability();

    const filteredItems = useMemo(() => {
        if (!items) return [];
        if (categoryFilter === "all") return items;
        return items.filter((i) => i.category === categoryFilter);
    }, [items, categoryFilter]);

    const handleToggle = (itemId: string, available: boolean) => {
        toggleAvail.mutate(
            { itemId, available },
            {
                onSuccess: () => toast({ title: available ? "Available" : "Unavailable" }),
                onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
            }
        );
    };

    const handleBulkToggle = (available: boolean) => {
        filteredItems.forEach((item) => {
            if (item.isAvailableToday !== available) {
                toggleAvail.mutate({ itemId: item.id, available });
            }
        });
        toast({ title: available ? "All set to available" : "All set to unavailable" });
    };

    const handleDelete = (item: Product) => {
        if (!confirm(`Delete "${item.name}"?`)) return;
        deleteItem.mutate(item.id, {
            onSuccess: () => {
                toast({ title: "Item deleted" });
                setDialogOpen(false);
                setEditingItem(null);
            },
            onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
        });
    };

    const openAdd = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };
    const openEdit = (item: Product) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6 p-5" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold" style={{ color: "#2d9653" }}>Menu Management</h1>
                <Button size="lg" className="min-h-[48px] gap-2" style={{ backgroundColor: "#2d9653" }} onClick={openAdd}>
                    <Plus className="w-5 h-5" /> Add Item
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] min-h-[48px]">Category</SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="min-h-[48px]" onClick={() => handleBulkToggle(true)}>All Available</Button>
                <Button variant="outline" size="sm" className="min-h-[48px]" onClick={() => handleBulkToggle(false)}>All Unavailable</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    [...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
                ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <MenuCard
                            key={item.id}
                            item={item}
                            onToggle={(v) => handleToggle(item.id, v)}
                            onEdit={() => openEdit(item)}
                            onDelete={() => handleDelete(item)}
                        />
                    ))
                ) : (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center text-muted-foreground">
                        <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No menu items. Add one to get started.</p>
                    </div>
                )}
            </div>

            <ItemDialog
                open={dialogOpen}
                onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditingItem(null); }}
                clubId={club?.id ?? ""}
                item={editingItem}
                addItem={addItem}
                updateItem={updateItem}
                toast={toast}
            />
        </div>
    );
}

function MenuCard({
    item,
    onToggle,
    onEdit,
    onDelete,
}: {
    item: Product;
    onToggle: (v: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const initial = item.name.charAt(0).toUpperCase();

    return (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 overflow-hidden" style={{ backgroundColor: "#e8f5e9", color: "#2d9653" }}>
                    {item.photo ? <img src={item.photo} alt="" className="w-full h-full object-cover" /> : initial}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{item.name}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{CAT_LABELS[item.category] ?? item.category}</Badge>
                    <p className="text-sm font-semibold mt-2">₹{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Switch checked={item.isAvailableToday} onCheckedChange={onToggle} />
                        <span className="text-xs">{item.isAvailableToday ? "Available" : "Unavailable"}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline" className="min-h-[40px]" onClick={onEdit}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="min-h-[40px] text-destructive" onClick={onDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ItemDialog({
    open,
    onOpenChange,
    clubId,
    item,
    addItem,
    updateItem,
    toast,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    clubId: string;
    item: Product | null;
    addItem: ReturnType<typeof useAddMenuItem>;
    updateItem: ReturnType<typeof useUpdateMenuItem>;
    toast: ReturnType<typeof useToast>["toast"];
}) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<Product["category"]>("other");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [available, setAvailable] = useState(true);

    const isEdit = !!item;

    const reset = () => {
        setName("");
        setCategory("other");
        setPrice("");
        setDescription("");
        setAvailable(true);
    };

    useEffect(() => {
        if (open) {
            if (item) {
                setName(item.name);
                setCategory(item.category);
                setPrice(String(item.price));
                setAvailable(item.isAvailableToday ?? true);
            } else reset();
        }
    }, [open, item]);

    const handleSubmit = () => {
        const p = parseFloat(price);
        if (!name.trim()) {
            toast({ title: "Name required", variant: "destructive" });
            return;
        }
        if (isNaN(p) || p < 0) {
            toast({ title: "Valid price required", variant: "destructive" });
            return;
        }

        if (isEdit && item) {
            updateItem.mutate(
                { itemId: item.id, data: { name: name.trim(), category, price: p, isAvailableToday: available } },
                {
                    onSuccess: () => {
                        toast({ title: "Item updated" });
                        onOpenChange(false);
                    },
                    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
                }
            );
        } else {
            addItem.mutate(
                { clubId, item: { name: name.trim(), category, price: p, isAvailableToday: available } },
                {
                    onSuccess: () => {
                        toast({ title: "Item added" });
                        onOpenChange(false);
                        reset();
                    },
                    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
                }
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Item" : "Add Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Name *</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" className="min-h-[48px] mt-1" />
                    </div>
                    <div>
                        <Label>Category</Label>
                        <Select value={category} onValueChange={(v) => setCategory(v as Product["category"])}>
                            <SelectTrigger className="min-h-[48px] mt-1">Select category</SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Price (₹) *</Label>
                        <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="min-h-[48px] mt-1" />
                    </div>
                    <div>
                        <Label>Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="min-h-[48px] mt-1" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Switch checked={available} onCheckedChange={setAvailable} />
                        <Label>Available</Label>
                    </div>
                    <Button className="w-full min-h-[48px]" style={{ backgroundColor: "#2d9653" }} onClick={handleSubmit} disabled={addItem.isPending || updateItem.isPending}>
                        {isEdit ? "Update" : "Add"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
