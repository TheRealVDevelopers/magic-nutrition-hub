import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Printer, CheckCircle, Scale, Trophy } from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMembers, useAddMember } from "@/hooks/owner/useMembers";
import { useClubContext } from "@/lib/clubDetection";
import type { User } from "@/types/firestore";
import MembershipReceipt, { type MembershipReceiptProps } from "@/components/receipts/MembershipReceipt";
import { printReceipt } from "@/utils/printReceipt";
import BulkWeighIn from "@/components/owner/BulkWeighIn";

type FilterTab = "all" | "active" | "expired" | "expiring" | "visiting" | "permanent" | "pending";

function getMemberStatus(m: User): "active" | "expired" | "expiring" {
    if (!m.membershipEnd) return "active";
    const end = m.membershipEnd.toDate();
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (end < now) return "expired";
    if (end <= sevenDays) return "expiring";
    return "active";
}

export default function Members() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { club } = useClubContext();
    const { data: members, isLoading } = useMembers(club?.id ?? null);
    const addMember = useAddMember();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterTab>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [weighInOpen, setWeighInOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "", phone: "", email: "", address: "", dob: "",
        currentWeight: "", targetWeight: "", healthConditions: "", membershipTier: "bronze" as "gold" | "silver" | "bronze",
    });
    const [formError, setFormError] = useState("");
    const [membershipSuccess, setMembershipSuccess] = useState<MembershipReceiptProps | null>(null);

    const filtered = useMemo(() => {
        if (!members) return [];
        let list = members;
        if (filter === "active") list = list.filter((m) => getMemberStatus(m) === "active");
        else if (filter === "expired") list = list.filter((m) => getMemberStatus(m) === "expired");
        else if (filter === "expiring") list = list.filter((m) => getMemberStatus(m) === "expiring");
        else if (filter === "visiting") list = list.filter((m) => (m as any).memberType === "visiting");
        else if (filter === "permanent") list = list.filter((m) => (m as any).memberType === "permanent");
        else if (filter === "pending") list = list.filter((m) => (m as any).isPermanent === false);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
        }
        return list;
    }, [members, search, filter]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        if (!formData.name.trim() || !formData.phone.trim()) {
            setFormError("Full Name and Phone are required.");
            return;
        }
        if (!club) return;
        try {
            const now = new Date();
            const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            const result = await addMember.mutateAsync({
                clubId: club.id,
                member: {
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    email: formData.email.trim() || undefined,
                    membershipTier: formData.membershipTier,
                    membershipStart: Timestamp.now(),
                    membershipEnd: Timestamp.fromDate(endDate),
                    dob: formData.dob ? Timestamp.fromDate(new Date(formData.dob)) : null,
                    ...(formData.address && { address: formData.address }),
                    ...(formData.currentWeight && { currentWeight: Number(formData.currentWeight) } as any),
                    ...(formData.targetWeight && { targetWeight: Number(formData.targetWeight) } as any),
                    ...(formData.healthConditions && { healthConditions: formData.healthConditions } as any),
                },
            });
            setDialogOpen(false);
            setFormData({ name: "", phone: "", email: "", address: "", dob: "", currentWeight: "", targetWeight: "", healthConditions: "", membershipTier: "bronze" });
            setMembershipSuccess({
                memberName: formData.name.trim(),
                memberId: (result as any)?.memberId ?? "",
                planName: formData.membershipTier,
                amount: 0,
                paymentMethod: "Registration",
                startDate: now,
                endDate,
                clubName: club.name,
                clubPhone: club.phone ?? club.ownerPhone ?? "",
                date: now,
                receiptNumber: `MBR${Date.now().toString().slice(-6)}`,
            });
        } catch (err: any) {
            setFormError(err.message || "Failed to add member.");
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const tierColor: Record<string, string> = {
        gold: "bg-amber-100 text-amber-800 border-amber-200",
        silver: "bg-slate-100 text-slate-800 border-slate-200",
        bronze: "bg-orange-100 text-orange-800 border-orange-200",
    };
    const statusColor: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-800 border-emerald-200",
        expired: "bg-red-100 text-red-800 border-red-200",
        expiring: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };

    return (
        <div className="space-y-6 animate-fade-in" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-2xl font-black" style={{ color: "#2d9653" }}>Members</h1>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 min-h-[48px] px-4 border-amber-500 text-amber-600 hover:bg-amber-50" onClick={() => navigate("/owner/leaderboard")}>
                        <Trophy className="w-4 h-4" /> Leaderboard
                    </Button>
                    <Button variant="outline" className="gap-2 min-h-[48px] px-4 border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => setWeighInOpen(true)}>
                        <Scale className="w-4 h-4" /> Record Weigh-Ins
                    </Button>
                    <Button className="gap-2 min-h-[48px] px-4" style={{ backgroundColor: "#2d9653" }} onClick={() => setDialogOpen(true)}>
                        <Plus className="w-4 h-4" /> Add Member
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 min-h-[48px]" />
                </div>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
                    <TabsList className="flex-wrap min-h-[48px]">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="visiting">🟡 Visiting</TabsTrigger>
                        <TabsTrigger value="permanent">🟢 Permanent</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="expired">Expired</TabsTrigger>
                        <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="h-48 rounded-2xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border bg-white">
                    <p className="text-muted-foreground mb-4">No members match your criteria.</p>
                    <Button className="min-h-[48px] px-6" style={{ backgroundColor: "#2d9653" }} onClick={() => setDialogOpen(true)}>
                        Add your first member
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((m) => {
                        const status = getMemberStatus(m);
                        return (
                            <div key={m.id} className="p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-12 w-12 shrink-0">
                                        {m.photo ? <AvatarImage src={m.photo} /> : null}
                                        <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: "#e8f5e9", color: "#2d9653" }}>{m.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold truncate">{m.name}</p>
                                        <p className="text-sm text-muted-foreground">{m.phone}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {/* Member Type: Visiting or Permanent */}
                                            {(m as any).memberType === "visiting" && (
                                                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-800 border-amber-300">
                                                    🟡 Visiting
                                                </Badge>
                                            )}
                                            {(m as any).memberType === "permanent" && (
                                                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-300">
                                                    🟢 Permanent
                                                </Badge>
                                            )}
                                            {m.membershipTier && (
                                                <Badge variant="outline" className={`text-xs ${tierColor[m.membershipTier] || ""}`}>{m.membershipTier}</Badge>
                                            )}
                                            <Badge variant="outline" className={`text-xs ${statusColor[status] || ""}`}>
                                                {status === "expiring" ? "Expiring" : status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {m.membershipEnd ? `Exp: ${m.membershipEnd.toDate().toLocaleDateString()}` : "—"}
                                        </p>
                                        <Button size="sm" variant="outline" className="mt-3 min-h-[48px] w-full" onClick={() => navigate(`/owner/members/${m.id}`)}>
                                            <Eye className="w-4 h-4 mr-2" /> View
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Member</DialogTitle>
                        <DialogDescription>Enter details for the new member.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdd} className="space-y-4 mt-4">
                        {formError && <p className="text-sm text-red-500">{formError}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name *</Label>
                                <Input value={formData.name} onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone *</Label>
                                <Input value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 9999999999" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="Address" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={formData.dob} onChange={(e) => setFormData((p) => ({ ...p, dob: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Membership Tier</Label>
                                <Select value={formData.membershipTier} onValueChange={(v) => setFormData((p) => ({ ...p, membershipTier: v as "gold" | "silver" | "bronze" }))}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gold">Gold</SelectItem>
                                        <SelectItem value="silver">Silver</SelectItem>
                                        <SelectItem value="bronze">Bronze</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Current Weight (kg)</Label>
                                <Input type="number" step="0.1" value={formData.currentWeight} onChange={(e) => setFormData((p) => ({ ...p, currentWeight: e.target.value }))} placeholder="70" />
                            </div>
                            <div className="space-y-2">
                                <Label>Target Weight (kg)</Label>
                                <Input type="number" step="0.1" value={formData.targetWeight} onChange={(e) => setFormData((p) => ({ ...p, targetWeight: e.target.value }))} placeholder="65" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Health Conditions</Label>
                            <Input value={formData.healthConditions} onChange={(e) => setFormData((p) => ({ ...p, healthConditions: e.target.value }))} placeholder="e.g. diabetes, allergies" />
                        </div>
                        <Button type="submit" className="w-full min-h-[48px]" style={{ backgroundColor: "#2d9653" }} disabled={addMember.isPending}>
                            {addMember.isPending ? "Adding…" : "Add Member"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Member Added — Success & Print Dialog */}
            <Dialog open={!!membershipSuccess} onOpenChange={() => setMembershipSuccess(null)}>
                <DialogContent className="rounded-2xl max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Member Added!</DialogTitle>
                    </DialogHeader>
                    {membershipSuccess && (
                        <div className="space-y-4 pt-2">
                            <div className="flex flex-col items-center gap-2 py-4">
                                <CheckCircle className="w-12 h-12 text-emerald-500" />
                                <p className="text-lg font-bold">{membershipSuccess.memberName}</p>
                                <p className="text-sm text-muted-foreground capitalize">{membershipSuccess.planName} Membership · 30 days</p>
                            </div>
                            <Button
                                className="w-full rounded-xl gap-2"
                                style={{ backgroundColor: "#2d9653" }}
                                onClick={printReceipt}
                            >
                                <Printer className="w-4 h-4" /> Print Membership Receipt
                            </Button>
                            <Button variant="outline" className="w-full rounded-xl" onClick={() => setMembershipSuccess(null)}>
                                Close
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden receipt area */}
            <div id="receipt-print-area">
                {membershipSuccess && <MembershipReceipt {...membershipSuccess} />}
            </div>

            <BulkWeighIn open={weighInOpen} onClose={() => setWeighInOpen(false)} />
        </div>
    );
}
