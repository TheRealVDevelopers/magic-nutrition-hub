import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Edit, Wallet, ShoppingBag, Activity, Users, Plus, GitBranch, ArrowUpCircle, X, Scale } from "lucide-react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
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
import { db } from "@/lib/firebase";
import MemberForm, { type MemberFormValues } from "@/components/owner/MemberForm";
import {
    useMemberById, useUpdateMember, useMemberWallet, useMemberTransactions,
    useMemberOrders, useMembershipPlans, useAssignMembership,
    useMemberReferrals
} from "@/hooks/useOwner";
import { useWeighIns, useRecordWeighIn } from "@/hooks/owner/useWeighIns";
import type { MemberType } from "@/types/firestore";

const UPGRADE_TIERS: { value: MemberType; label: string; color: string }[] = [
    { value: "bronze", label: "🥉 Bronze", color: "#cd7f32" },
    { value: "silver", label: "🥈 Silver", color: "#9ca3af" },
    { value: "gold", label: "🥇 Gold", color: "#d97706" },
    { value: "platinum", label: "💎 Platinum", color: "#6366f1" },
];

interface UpgradeModalProps {
    memberName: string;
    memberPhone: string;
    memberId: string;
    whatsappPhone: string;
    clubName: string;
    clubId: string;
    onClose: () => void;
    onDone: () => void;
}

function UpgradeMemberModal({ memberName, memberPhone, memberId, whatsappPhone, clubName, clubId, onClose, onDone }: UpgradeModalProps) {
    const { toast } = useToast();
    const [tier, setTier] = useState<MemberType>("bronze");
    const [amount, setAmount] = useState("");
    const [method, setMethod] = useState("Cash");
    const [reference, setReference] = useState("");
    const [loading, setLoading] = useState(false);

    const handleUpgrade = useCallback(async () => {
        if (!tier || !amount) return;
        setLoading(true);
        try {
            await updateDoc(doc(db, `clubs/${clubId}/members`, memberId), {
                memberType: tier,
                updatedAt: Timestamp.now(),
            });
            toast({ title: `✅ ${memberName} upgraded to ${tier}!` });
            const msg = encodeURIComponent(
                `🎉 Congratulations ${memberName}!\n\nYou've been upgraded to *${tier.toUpperCase()}* membership at *${clubName}*!\n\nPayment: ₹${amount} via ${method}${reference ? ` (Ref: ${reference})` : ""}.\n\nWelcome to the club! 💪🌿`
            );
            const phone = whatsappPhone.replace(/\D/g, "");
            window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
            onDone();
        } catch (err: any) {
            toast({ title: "Upgrade failed", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [tier, amount, method, reference, memberId, clubId, memberName, whatsappPhone, clubName, toast, onDone]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-black text-gray-800">⬆️ Upgrade to Member</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="font-bold text-gray-800">{memberName}</p>
                    <p className="text-sm text-gray-500">{memberPhone}</p>
                </div>

                <div className="space-y-3">
                    <div>
                        <Label className="font-semibold">Membership Tier</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {UPGRADE_TIERS.map((t) => (
                                <button
                                    key={t.value}
                                    onClick={() => setTier(t.value)}
                                    className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${tier === t.value ? "border-current shadow-md" : "border-gray-200 text-gray-500"
                                        }`}
                                    style={{ color: tier === t.value ? t.color : undefined, borderColor: tier === t.value ? t.color : undefined }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="font-semibold">Payment Amount (₹)</Label>
                        <Input className="mt-1 rounded-xl" type="number" placeholder="e.g. 1500" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>

                    <div>
                        <Label className="font-semibold">Payment Method</Label>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {["Cash", "UPI", "Card", "Bank Transfer", "Other"].map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="font-semibold">Reference No. <span className="font-normal text-gray-400">(optional)</span></Label>
                        <Input className="mt-1 rounded-xl" placeholder="UPI/Transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
                        <Button
                            onClick={handleUpgrade}
                            disabled={!amount || loading}
                            className="flex-1 rounded-xl text-white"
                            style={{ backgroundColor: "#2d9653" }}
                        >
                            {loading ? "Upgrading..." : "✅ Confirm Upgrade"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OwnerMemberProfile() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const { club } = useClubContext();
    const { data: member, isLoading } = useMemberById(id || "");
    const { data: wallet } = useMemberWallet(id || "");
    const { data: transactions } = useMemberTransactions(id || "");
    const { data: orders } = useMemberOrders(id || "");
    const { data: weightLog } = useWeighIns(club?.id || null, id || "");
    const { data: referrals } = useMemberReferrals(id || "");
    const { data: plans } = useMembershipPlans();
    const updateMember = useUpdateMember();
    const recordWeighIn = useRecordWeighIn();
    const assignPlan = useAssignMembership();

    const [editOpen, setEditOpen] = useState(false);
    const [assignOpen, setAssignOpen] = useState(false);
    const [upgradeOpen, setUpgradeOpen] = useState(false);
    const [weighInOpen, setWeighInOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState("");
    const [weightInput, setWeightInput] = useState("");
    const [weightNote, setWeightNote] = useState("");

    const isVisiting = (member as any)?.memberType === "visiting";

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
        if (isNaN(w) || !club) return;
        try {
            await recordWeighIn.mutateAsync({
                memberId: member.id,
                clubId: club.id,
                weight: w,
                notes: weightNote,
                recordedBy: "owner",
                previousWeight: member.currentWeight ?? null,
                startingWeight: member.startingWeight ?? 0,
                targetWeight: member.targetWeight ?? 0,
                existingBadges: member.badges || [],
                totalWeighIns: member.totalWeighIns || 0,
            });
            toast({ title: "Weight entry added!" });
            setWeightInput(""); setWeightNote("");
            setWeighInOpen(false);
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
                            {(member as any).memberType && (
                                <Badge
                                    className="capitalize"
                                    style={(member as any).memberType === "visiting" ? { backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d" } : {}}
                                >
                                    {(member as any).memberType}
                                </Badge>
                            )}
                            {member.membershipTier && <Badge className="capitalize">{member.membershipTier}</Badge>}
                            <Badge variant={member.status === "active" ? "outline" : "destructive"}>{member.status}</Badge>
                            {(member as any).memberId && (
                                <Badge variant="outline" className="font-mono text-xs">{(member as any).memberId}</Badge>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                        {isVisiting && (
                            <Button
                                onClick={() => setUpgradeOpen(true)}
                                className="text-white font-bold"
                                style={{ backgroundColor: "#d97706" }}
                            >
                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Upgrade to Member
                            </Button>
                        )}
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
                    <TabsTrigger value="referrals"><GitBranch className="w-4 h-4 mr-1" /> Referrals</TabsTrigger>
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
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg">Weigh-In History</h3>
                        <Button size="sm" onClick={() => setWeighInOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                            <Scale className="w-4 h-4 mr-1" /> Record Weight
                        </Button>
                    </div>

                    {weightLog && weightLog.length > 0 ? (
                        <div className="space-y-2">
                            {weightLog.map((w: any) => (
                                <div key={w.id} className="flex flex-col p-4 rounded-xl border bg-white shadow-sm space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-2">
                                            <p className="font-bold text-lg text-slate-800">{w.weight} kg</p>
                                            {w.change !== 0 && (
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${w.change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                    {w.change > 0 ? "↓" : "↑"} {Math.abs(w.change)} kg
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">{w.date?.toDate?.().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                    </div>
                                    {w.notes && (
                                        <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">{w.notes}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 border border-dashed rounded-2xl bg-white">
                            <Scale className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-slate-900">No Weigh-Ins</h3>
                            <p className="text-xs text-slate-500 mt-1">Record the first weigh-in to start tracking progress.</p>
                        </div>
                    )}
                </TabsContent>

                {/* Tree */}
                <TabsContent value="tree" className="mt-6">
                    <p className="text-sm text-muted-foreground text-center py-8">
                        MLM tree will be visualized in a future phase. Tree path: {member.treePath}
                    </p>
                </TabsContent>

                {/* Referrals */}
                <TabsContent value="referrals" className="mt-6">
                    {referrals && referrals.length > 0 ? (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider">Total Referrals</p>
                                    <p className="text-2xl font-black mt-1">{referrals.length}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold uppercase tracking-wider">Total Bonus Coins</p>
                                    <p className="text-2xl font-black mt-1">{referrals.reduce((sum, r) => sum + (r.bonusCoinsAwarded ?? 0), 0)}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {referrals.map((r: any) => (
                                    <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                                        <Avatar className="h-10 w-10 border shadow-sm">
                                            {r.referredUser?.photo ? <AvatarImage src={r.referredUser.photo} /> : <AvatarFallback>{r.referredUser?.name?.[0]}</AvatarFallback>}
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-slate-900">{r.referredUser?.name}</p>
                                            <p className="text-xs text-muted-foreground">Joined {r.createdAt?.toDate?.().toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="bg-slate-50 border-emerald-200 text-emerald-700">+{r.bonusCoinsAwarded} {club?.currencyName}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4 border border-dashed rounded-2xl bg-slate-50">
                            <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-sm font-bold text-slate-900">No Referrals Yet</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">This member hasn't referred anyone yet.</p>
                        </div>
                    )}
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

            {/* Upgrade Status Modal */}
            {upgradeOpen && (
                <UpgradeMemberModal
                    clubName={club?.name || ""}
                    clubId={club?.id || ""}
                    whatsappPhone={member.phone}
                    memberName={member.name}
                    memberPhone={member.phone}
                    memberId={member.id}
                    onClose={() => setUpgradeOpen(false)}
                    onDone={() => setUpgradeOpen(false)}
                />
            )}

            {/* Weigh-In Dialog */}
            <Dialog open={weighInOpen} onOpenChange={setWeighInOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Record Today's Weight</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input type="number" step="0.1" placeholder="e.g. 75.5" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input placeholder="How are you feeling?" value={weightNote} onChange={(e) => setWeightNote(e.target.value)} />
                        </div>
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAddWeight}
                            disabled={!weightInput || recordWeighIn.isPending}
                        >
                            {recordWeighIn.isPending ? "Saving..." : "Save Weigh-in"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
