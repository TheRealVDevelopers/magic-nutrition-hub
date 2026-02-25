import { useState } from "react";
import { Plus, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useClubVolunteers, useAddVolunteer, useDeactivateMember } from "@/hooks/useOwner";

export default function VolunteersPage() {
    const { toast } = useToast();
    const { data: volunteers, isLoading } = useClubVolunteers();
    const addVolunteer = useAddVolunteer();
    const deactivate = useDeactivateMember();
    const [sheetOpen, setSheetOpen] = useState(false);
    const [deactivateId, setDeactivateId] = useState<string | null>(null);

    // Simple form state
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;
        try {
            await addVolunteer.mutateAsync({ name, phone, email });
            toast({ title: "Volunteer added!", description: `${name} is now part of the team.` });
            setSheetOpen(false);
            setName(""); setPhone(""); setEmail("");
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-wellness-forest">Volunteers</h1>
                    <Badge variant="secondary">{volunteers?.length || 0}</Badge>
                </div>
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Volunteer</Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md">
                        <SheetHeader><SheetTitle>Add Volunteer</SheetTitle></SheetHeader>
                        <form onSubmit={handleAdd} className="mt-6 space-y-4">
                            <div className="space-y-2"><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required /></div>
                            <div className="space-y-2"><Label>Phone *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" required /></div>
                            <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" /></div>
                            <Button type="submit" disabled={addVolunteer.isPending} className="w-full">{addVolunteer.isPending ? "Adding…" : "Add Volunteer"}</Button>
                        </form>
                    </SheetContent>
                </Sheet>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}</div>
            ) : volunteers && volunteers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {volunteers.map((v) => (
                        <div key={v.id} className="bg-white rounded-2xl border p-5 space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <Avatar className="h-12 w-12">
                                    {v.photo ? <AvatarImage src={v.photo} /> : null}
                                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">{v.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-bold">{v.name}</p>
                                    <p className="text-xs text-muted-foreground">{v.phone}</p>
                                </div>
                                <Badge variant={v.status === "active" ? "outline" : "destructive"} className="text-xs">{v.status}</Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="flex-1 text-xs" disabled>View Log</Button>
                                <Button size="sm" variant="ghost" className="text-red-500 text-xs" onClick={() => setDeactivateId(v.id)}><UserX className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border border-dashed rounded-2xl bg-white">
                    <p className="text-muted-foreground text-sm mb-4">No volunteers yet</p>
                    <Button onClick={() => setSheetOpen(true)}>Add First Volunteer</Button>
                </div>
            )}

            <AlertDialog open={!!deactivateId} onOpenChange={() => setDeactivateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Deactivate volunteer?</AlertDialogTitle>
                        <AlertDialogDescription>They will no longer have access to the club system.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { if (deactivateId) { deactivate.mutate(deactivateId); setDeactivateId(null); } }}>Deactivate</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
