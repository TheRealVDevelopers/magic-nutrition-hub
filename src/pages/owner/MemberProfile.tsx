import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Wallet, ShoppingBag, Activity, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import MemberForm, { type MemberFormValues } from "@/components/owner/MemberForm";
import {
    useMemberById, useUpdateMember, useMemberWallet, useMemberTransactions,
    useMemberOrders, useMemberWeightLog, useAddWeightEntry, useMembershipPlans, useAssignMembership,
} from "@/hooks/useOwner";

export default function OwnerMemberProfile() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { club } = useClubContext();
    const { data: member, isLoading } = useMemberById(id || "");
    const { data: wallet } = useMemberWallet(id || "");
    const { data: transactions } = useMemberTransactions(id || "");
    const { data: orders } = useMemberOrders(id || "");
    const { data: weightLog } = useMemberWeightLog(id || "");
    const { data: plans } = useMembershipPlans();
    const updateMember = useUpdateMember();
    const addWeight = useAddWeightEntry();
    const assignPlan = useAssignMembership();

    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [weightInput, setWeightInput] = useState("");
    const [weightNote, setWeightNote] = useState("");

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
    if (!member) return <div className="text-center py-16 text-muted-foreground">Member not found</div>;

    const handleEdit = async (data: MemberFormValues) => {
        try {
            await updateMember.mutateAsync({
                memberId: member.id, data: {
                    name: data.name, phone: data.phone, email: data.email || "",
                }
            });
            toast({ title: "Profile updated!" });
            setEditOpen(false);
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    };

    const handleAssign = async () => {
        if (!selectedPlan) return;
        try {
            await assignPlan.mutateAsync({ memberId: member.id, planId: selectedPlan });
            toast({ title: "Membership assigned!" });
            setAssignOpen(false);
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    };

    const handleAddWeight = async () => {
        const w = parseFloat(weightInput);
        if (isNaN(w)) return;
        try {
            await addWeight.mutateAsync({ memberId: member.id, weight: w, notes: weightNote });
            toast({ title: "Weight entry added!" });
            setWeightInput(""); setWeightNote("");
        } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <Link to="/owner/members" className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <ArrowLeft className="w-4 h-4" /> Back to Members
            </Link>

            {/* Hero */}
            <div className="bg-white rounded-2xl border p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Avatar className="h-20 w-20">
                        {member.photo ? <AvatarImage src={member.photo} /> : null}
                        <AvatarFallback className="bg-violet-500 text-white font-bold text-2xl">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-center sm:text-left space-y-1">
                        <h2 className="text-2xl font-black text-wellness-forest">{member.name}</h2>
                        <p className="text-sm text-muted-foreground">{member.phone} • {member.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
                            {member.membershipTier && <Badge className="capitalize">{member.membershipTier}</Badge>}
                            <Badge variant={member.status === "active" ? "outline" : "destructive"}>{member.status}</Badge>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(true)}><Edit className="w-4 h-4 mr-2" /> Edit</Button>
                        <Button onClick={() => setAssignOpen(true)}>Assign Plan</Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="wallet">
                <TabsList>
                    <TabsTrigger value="wallet"><Wallet className="w-4 h-4 mr-1" /> Wallet</TabsTrigger>
                    <TabsTrigger value="orders"><ShoppingBag className="w-4 h-4 mr-1" /> Orders</TabsTrigger>
                    <TabsTrigger value="progress"><Activity className="w-4 h-4 mr-1" /> Progress</TabsTrigger>
                    <TabsTrigger value="tree"><Users className="w-4 h-4 mr-1" /> Tree</TabsTrigger>
                </TabsList>

                {/* Wallet */}
                <TabsContent value="wallet" className="mt-6 space-y-4">
                    <div className="bg-gradient-to-r from-violet-600 to-emerald-500 rounded-2xl p-6 text-white">
                        <p className="text-sm opacity-80">Current Balance</p>
                        <p className="text-4xl font-black mt-1">{wallet?.balance ?? 0} <span className="text-lg font-medium">{club?.currencyName}</span></p>
                    </div>
                    <h3 className="text-sm font-bold">Transaction History</h3>
                    {transactions && transactions.length > 0 ? (
                        <div className="space-y-2">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl border bg-white text-sm">
                                    <div>
                                        <p className="font-medium capitalize">{tx.reason}</p>
                                        <p className="text-xs text-muted-foreground">{tx.createdAt?.toDate?.().toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                                            {tx.type === "credit" ? "+" : "-"}{tx.amount}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Bal: {tx.balanceAfter}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
                    )}
                </TabsContent>

                {/* Orders */}
                <TabsContent value="orders" className="mt-6">
                    {orders && orders.length > 0 ? (
                        <div className="space-y-2">
                            {orders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl border bg-white text-sm">
                                    <div>
                                        <p className="font-medium">{o.items.map((i) => i.productName).join(", ")}</p>
                                        <p className="text-xs text-muted-foreground">{o.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{o.totalCost} {club?.currencyName}</p>
                                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
                    )}
                </TabsContent>

                {/* Progress */}
                <TabsContent value="progress" className="mt-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <Input type="number" placeholder="Weight (kg)" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} className="w-32" />
                        <Input placeholder="Notes" value={weightNote} onChange={(e) => setWeightNote(e.target.value)} className="flex-1" />
                        <Button size="sm" onClick={handleAddWeight} disabled={addWeight.isPending}><Plus className="w-4 h-4 mr-1" /> Add</Button>
                    </div>
                    {weightLog && weightLog.length > 0 ? (
                        <div className="space-y-2">
                            {weightLog.map((w: any) => (
                                <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border bg-white text-sm">
                                    <p className="font-medium">{w.weight} kg</p>
                                    <p className="text-xs text-muted-foreground">{w.date?.toDate?.().toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No weight entries yet</p>
                    )}
                </TabsContent>

                {/* Tree */}
                <TabsContent value="tree" className="mt-6">
                    <p className="text-sm text-muted-foreground text-center py-8">
                        MLM tree will be visualized in a future phase. Tree path: {member.treePath}
                    </p>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit Member</DialogTitle></DialogHeader>
                    <MemberForm mode="edit" defaultValues={{ name: member.name, phone: member.phone, email: member.email }} onSubmit={handleEdit} isLoading={updateMember.isPending} />
                </DialogContent>
            </Dialog>

            {/* Assign Membership Dialog */}
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Membership Plan</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Select Plan</Label>
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                                <SelectTrigger><SelectValue placeholder="Choose a plan" /></SelectTrigger>
                                <SelectContent>
                                    {plans?.filter((p) => p.isActive).map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name} — {p.price} {club?.currencyName} / {p.durationDays}d</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">Current balance: {wallet?.balance ?? 0} {club?.currencyName}</p>
                        <Button onClick={handleAssign} disabled={!selectedPlan || assignPlan.isPending} className="w-full">
                            {assignPlan.isPending ? "Assigning…" : "Assign & Deduct"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
