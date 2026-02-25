import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClubMembers } from "@/hooks/useOwner";

const memberSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().regex(/^\+?\d{10,15}$/, "Valid phone required"),
    email: z.string().email().optional().or(z.literal("")),
    dob: z.string().optional(),
    anniversary: z.string().optional(),
    referredBy: z.string().optional(),
    notes: z.string().optional(),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

interface Props {
    defaultValues?: Partial<MemberFormValues>;
    onSubmit: (data: MemberFormValues) => void;
    isLoading: boolean;
    mode: "add" | "edit";
}

export default function MemberForm({ defaultValues, onSubmit, isLoading, mode }: Props) {
    const { data: existingMembers } = useClubMembers();
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: { name: "", phone: "", email: "", dob: "", anniversary: "", referredBy: "", notes: "", ...defaultValues },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input {...register("name")} placeholder="John Doe" />
                    {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input {...register("phone")} placeholder="+91 9999999999" />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("email")} placeholder="email@example.com" type="email" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input {...register("dob")} type="date" />
                </div>
                <div className="space-y-2">
                    <Label>Anniversary</Label>
                    <Input {...register("anniversary")} type="date" />
                </div>
            </div>
            {mode === "add" && (
                <div className="space-y-2">
                    <Label>Referred By</Label>
                    <Select value={watch("referredBy") || "none"} onValueChange={(v) => setValue("referredBy", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue placeholder="Select referrer" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No referrer</SelectItem>
                            {existingMembers?.map((m) => (
                                <SelectItem key={m.id} value={m.id}>{m.name} — {m.phone}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="space-y-2">
                <Label>Notes / Allergies</Label>
                <Textarea {...register("notes")} placeholder="Any notes…" rows={3} />
            </div>
            <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isLoading} className="px-8">
                    {isLoading ? (mode === "add" ? "Adding…" : "Saving…") : (mode === "add" ? "Add Member" : "Save Changes")}
                </Button>
            </div>
        </form>
    );
}
