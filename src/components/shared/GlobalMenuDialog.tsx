import { useState, useRef, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
    useAddGlobalMenuItem,
    useUpdateGlobalMenuItem,
    type GlobalMenuItem,
} from "@/hooks/useGlobalMenu";

const CATEGORIES = ["shake", "tea", "drink", "other"] as const;
const CAT_LABELS: Record<string, string> = { shake: "Shake", tea: "Tea", drink: "Drink", other: "Other" };

export function GlobalMenuDialog({
    open,
    onOpenChange,
    item,
    addItem,
    updateItem,
    toast,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    item: GlobalMenuItem | null;
    addItem: ReturnType<typeof useAddGlobalMenuItem>;
    updateItem: ReturnType<typeof useUpdateGlobalMenuItem>;
    toast: ReturnType<typeof useToast>["toast"];
}) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState<GlobalMenuItem["category"]>("shake");
    const [description, setDescription] = useState("");
    const [nutritionInfo, setNutritionInfo] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [isVeg, setIsVeg] = useState(true);
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState("99");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);

    const isEdit = !!item;

    const reset = () => {
        setName(""); setCategory("shake"); setDescription(""); setNutritionInfo("");
        setIngredients(""); setIsVeg(true); setIsActive(true); setSortOrder("99");
        setImageFile(null); setImagePreview("");
    };

    useEffect(() => {
        if (open) {
            if (item) {
                setName(item.name);
                setCategory(item.category);
                setDescription(item.description || "");
                setNutritionInfo(item.nutritionInfo || "");
                setIngredients(item.ingredients || "");
                setIsVeg(item.isVeg ?? true);
                setIsActive(item.isActive ?? true);
                setSortOrder(String(item.sortOrder ?? 99));
                setImageFile(null);
                setImagePreview(item.imageUrl || "");
            } else reset();
        }
    }, [open, item]);

    const handleSubmit = () => {
        if (!name.trim()) {
            toast({ title: "Name required", variant: "destructive" });
            return;
        }
        const payload = {
            name: name.trim(),
            category,
            description,
            nutritionInfo,
            ingredients,
            isVeg,
            isActive,
            sortOrder: parseInt(sortOrder) || 99,
            source: "global" as const,
        };

        if (isEdit && item) {
            updateItem.mutate({ itemId: item.id, data: payload, imageFile }, {
                onSuccess: () => { toast({ title: "Item updated" }); onOpenChange(false); },
                onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
            });
        } else {
            addItem.mutate({ item: payload, imageFile }, {
                onSuccess: () => { toast({ title: "Item added" }); onOpenChange(false); reset(); },
                onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Global Item" : "Add Global Menu Item"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[75vh] overflow-y-auto px-1 py-1">
                    {/* Image Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-28 h-28 rounded-2xl border-2 border-dashed overflow-hidden cursor-pointer flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors"
                            onClick={() => fileRef.current?.click()}
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-xs text-gray-400">
                                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                                    Tap to upload
                                </div>
                            )}
                        </div>
                        <input
                            type="file" accept="image/*" ref={fileRef} className="hidden"
                            onChange={e => {
                                const f = e.target.files?.[0];
                                if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                            }}
                        />
                    </div>

                    <div>
                        <Label>Item Name *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Formula 1 Shake — Chocolate" className="mt-1" />
                    </div>

                    <div>
                        <Label>Category *</Label>
                        <Select value={category} onValueChange={v => setCategory(v as any)}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Description *</Label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Short description for this item..."
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            rows={3}
                        />
                    </div>

                    <div>
                        <Label>Nutrition Info</Label>
                        <Input value={nutritionInfo} onChange={e => setNutritionInfo(e.target.value)} placeholder="220 cal | 24g protein" className="mt-1" />
                    </div>

                    <div>
                        <Label>Ingredients</Label>
                        <Input value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="Soy protein, vitamins..." className="mt-1" />
                    </div>

                    <div>
                        <Label>Sort Order</Label>
                        <Input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="1" className="mt-1" />
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch checked={isVeg} onCheckedChange={setIsVeg} />
                            <Label className="cursor-pointer">Veg</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                            <Label className="cursor-pointer">Active</Label>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        style={{ backgroundColor: "#2d9653" }}
                        onClick={handleSubmit}
                        disabled={addItem.isPending || updateItem.isPending}
                    >
                        {isEdit ? "Update Item" : "Add Item"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
