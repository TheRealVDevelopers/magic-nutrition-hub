import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

interface Props {
    defaultValues?: { name: string; price: number; durationDays: number; benefits: string[]; color: string; isActive: boolean };
    onSubmit: (data: { name: string; price: number; durationDays: number; benefits: string[]; color: string; isActive: boolean }) => void;
    isLoading: boolean;
}

export default function PlanForm({ defaultValues, onSubmit, isLoading }: Props) {
    const [name, setName] = useState(defaultValues?.name || "");
    const [price, setPrice] = useState(defaultValues?.price || 0);
    const [days, setDays] = useState(defaultValues?.durationDays || 30);
    const [benefits, setBenefits] = useState<string[]>(defaultValues?.benefits || [""]);
    const [color, setColor] = useState(defaultValues?.color || "#8B5CF6");
    const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, price, durationDays: days, benefits: benefits.filter(Boolean), color, isActive });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Gold" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Price *</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} min={0} required />
                </div>
                <div className="space-y-2">
                    <Label>Duration (days) *</Label>
                    <Input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min={1} required />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Benefits</Label>
                {benefits.map((b, i) => (
                    <div key={i} className="flex gap-2">
                        <Input value={b} onChange={(e) => { const copy = [...benefits]; copy[i] = e.target.value; setBenefits(copy); }} placeholder={`Benefit ${i + 1}`} />
                        {benefits.length > 1 && (
                            <Button type="button" size="icon" variant="ghost" onClick={() => setBenefits(benefits.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                        )}
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setBenefits([...benefits, ""])} className="text-xs"><Plus className="w-3 h-3 mr-1" /> Add Benefit</Button>
            </div>
            <div className="flex items-center gap-3">
                <Label>Color</Label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            </div>
            <div className="flex items-center gap-3">
                <Label>Active</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <Button type="submit" disabled={isLoading || !name} className="w-full">{isLoading ? "Saving…" : "Save Plan"}</Button>
        </form>
    );
}
