import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import { doc, updateDoc, getDocs, addDoc, deleteDoc, collection, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MembershipPlan } from "@/types/firestore";
import { Timestamp } from "firebase/firestore";

const GREEN = "#2d9653";

export default function Settings() {
    const { toast } = useToast();
    const { club } = useClubContext();
    const clubId = club?.id ?? null;

    const [clubName, setClubName] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [lowBalanceThreshold, setLowBalanceThreshold] = useState(100);
    const [weighInDays, setWeighInDays] = useState<number[]>([]);
    const [plans, setPlans] = useState<(MembershipPlan & { id: string })[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [profileSaving, setProfileSaving] = useState(false);
    const [walletSaving, setWalletSaving] = useState(false);
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [newPlanName, setNewPlanName] = useState("");
    const [newPlanDuration, setNewPlanDuration] = useState(30);
    const [newPlanPrice, setNewPlanPrice] = useState(0);
    const [newPlanBenefits, setNewPlanBenefits] = useState("");
    const [planSaving, setPlanSaving] = useState(false);

    useEffect(() => {
        if (club) {
            setClubName(club.name || "");
            setAddress(club.address || "");
            setPhone(club.ownerPhone || "");
            setEmail(club.ownerEmail || "");
            setLowBalanceThreshold((club as any).lowBalanceThreshold ?? 100);
            setWeighInDays((club as any).weighInDays ?? []);
        }
    }, [club]);

    useEffect(() => {
        if (!clubId) return;
        (async () => {
            setPlansLoading(true);
            try {
                const q = query(collection(db, `clubs/${clubId}/memberships`));
                const snap = await getDocs(q);
                setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MembershipPlan & { id: string })));
            } catch {
                setPlans([]);
            } finally {
                setPlansLoading(false);
            }
        })();
    }, [clubId]);

    const handleSaveProfile = async () => {
        if (!clubId) return;
        setProfileSaving(true);
        try {
            await updateDoc(doc(db, "clubs", clubId), {
                name: clubName,
                address,
                ownerPhone: phone,
                ownerEmail: email,
            });
            toast({ title: "Club profile saved!" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setProfileSaving(false);
        }
    };

    const handleSaveWallet = async () => {
        if (!clubId) return;
        setWalletSaving(true);
        try {
            await updateDoc(doc(db, "clubs", clubId), { lowBalanceThreshold, weighInDays });
            toast({ title: "Settings saved!" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setWalletSaving(false);
        }
    };

    const handleAddPlan = async () => {
        if (!clubId || !newPlanName.trim()) return;
        setPlanSaving(true);
        try {
            await addDoc(collection(db, `clubs/${clubId}/memberships`), {
                name: newPlanName.trim(),
                durationDays: newPlanDuration,
                price: newPlanPrice,
                benefits: newPlanBenefits.split("\n").filter(Boolean),
                color: GREEN,
                isActive: true,
                createdAt: Timestamp.now(),
            });
            toast({ title: "Plan added!" });
            setPlanDialogOpen(false);
            setNewPlanName("");
            setNewPlanDuration(30);
            setNewPlanPrice(0);
            setNewPlanBenefits("");
            const q = query(collection(db, `clubs/${clubId}/memberships`));
            const snap = await getDocs(q);
            setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MembershipPlan & { id: string })));
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setPlanSaving(false);
        }
    };

    const handleTogglePlan = async (plan: MembershipPlan & { id: string }) => {
        try {
            await updateDoc(doc(db, `clubs/${clubId}/memberships`, plan.id), { isActive: !plan.isActive });
            toast({ title: plan.isActive ? "Plan deactivated" : "Plan activated" });
            setPlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)));
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleDeletePlan = async (planId: string) => {
        try {
            await deleteDoc(doc(db, `clubs/${clubId}/memberships`, planId));
            toast({ title: "Plan deleted" });
            setPlans((prev) => prev.filter((p) => p.id !== planId));
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    return (
        <div className="space-y-8 pb-12" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: GREEN }}>
                <SettingsIcon className="w-6 h-6" /> Settings
            </h1>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Club Profile</h2>
                <div className="grid gap-4 max-w-md">
                    <div><Label>Club Name</Label><Input value={clubName} onChange={(e) => setClubName(e.target.value)} /></div>
                    <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                    <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                    <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <Button onClick={handleSaveProfile} disabled={profileSaving} style={{ backgroundColor: GREEN }}>
                        <Save className="w-4 h-4 mr-2" /> {profileSaving ? "Saving…" : "Save"}
                    </Button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Membership Plans</h2>
                    <Button size="sm" onClick={() => setPlanDialogOpen(true)} style={{ backgroundColor: GREEN }}>
                        <Plus className="w-4 h-4 mr-1" /> Add Plan
                    </Button>
                </div>
                {plansLoading ? (
                    <p className="text-muted-foreground text-sm">Loading…</p>
                ) : plans.length > 0 ? (
                    <ul className="space-y-2">
                        {plans.map((p) => (
                            <li key={p.id} className="flex items-center justify-between p-4 rounded-xl border bg-white">
                                <div>
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-muted-foreground text-sm ml-2">
                                        {p.durationDays} days • ₹{p.price}
                                    </span>
                                    {!p.isActive && <Badge variant="secondary" className="ml-2">Inactive</Badge>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Switch checked={p.isActive} onCheckedChange={() => handleTogglePlan(p)} />
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleDeletePlan(p.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-sm">No plans yet.</p>
                )}
            </section>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">Other Settings</h2>
                <div className="grid gap-6">
                    <div className="flex flex-col gap-2 max-w-xs">
                        <Label>Low balance threshold (₹)</Label>
                        <Input
                            type="number"
                            value={lowBalanceThreshold}
                            onChange={(e) => setLowBalanceThreshold(Number(e.target.value) || 0)}
                            min={0}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Weigh-in Schedule</Label>
                        <p className="text-xs text-muted-foreground mb-1">Select the days of the week when members should weigh in.</p>
                        <div className="flex flex-wrap gap-4">
                            {[
                                { label: "Sun", value: 0 },
                                { label: "Mon", value: 1 },
                                { label: "Tue", value: 2 },
                                { label: "Wed", value: 3 },
                                { label: "Thu", value: 4 },
                                { label: "Fri", value: 5 },
                                { label: "Sat", value: 6 },
                            ].map((day) => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={weighInDays.includes(day.value)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setWeighInDays([...weighInDays, day.value]);
                                            } else {
                                                setWeighInDays(weighInDays.filter(d => d !== day.value));
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor={`day-${day.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <Button onClick={handleSaveWallet} disabled={walletSaving} style={{ backgroundColor: GREEN }} className="mt-4">
                    <Save className="w-4 h-4 mr-2" /> {walletSaving ? "Saving…" : "Save Settings"}
                </Button>
            </section>

            <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Add Plan</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Name</Label><Input value={newPlanName} onChange={(e) => setNewPlanName(e.target.value)} placeholder="Gold" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Duration (days)</Label><Input type="number" value={newPlanDuration} onChange={(e) => setNewPlanDuration(Number(e.target.value))} min={1} /></div>
                            <div><Label>Price (₹)</Label><Input type="number" value={newPlanPrice} onChange={(e) => setNewPlanPrice(Number(e.target.value))} min={0} /></div>
                        </div>
                        <div><Label>Benefits (one per line)</Label><textarea className="w-full min-h-[80px] rounded-md border px-3 py-2 text-sm" value={newPlanBenefits} onChange={(e) => setNewPlanBenefits(e.target.value)} placeholder="One benefit per line" /></div>
                        <Button onClick={handleAddPlan} disabled={planSaving || !newPlanName.trim()} className="w-full" style={{ backgroundColor: GREEN }}>
                            <Save className="w-4 h-4 mr-2" /> {planSaving ? "Saving…" : "Add Plan"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
