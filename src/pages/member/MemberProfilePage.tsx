import { useState, useRef } from "react";
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Pencil, LogOut, RefreshCw, CheckCircle, AlertTriangle, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClubContext, invalidateClubCache } from "@/lib/clubDetection";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useMyWallet } from "@/hooks/useMemberWallet";
import { useClubMembershipPlans, useRenewMembership } from "@/hooks/member/useMembership";
import { printReceipt } from "@/utils/printReceipt";
import MembershipReceipt from "@/components/receipts/MembershipReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, MembershipPlan } from "@/types/firestore";

const GREEN = "#2d9653";
const BG = "#f8fffe";

function formatTimestamp(ts: Timestamp | null | undefined): string {
    if (!ts?.toDate) return "—";
    return format(ts.toDate(), "dd MMM yyyy");
}

export default function MemberProfilePage() {
    const { userProfile, firebaseUser, loading } = useAuth();
    const { club } = useClubContext();
    const { toast } = useToast();

    const [isEditMode, setIsEditMode] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhone, setEditPhone] = useState("");
    const [editWhatsapp, setEditWhatsapp] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [editDob, setEditDob] = useState("");
    const [editCurrentWeight, setEditCurrentWeight] = useState("");
    const [editTargetWeight, setEditTargetWeight] = useState("");
    const [editHealthConditions, setEditHealthConditions] = useState("");
    const [saving, setSaving] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    const [profileOverride, setProfileOverride] = useState<Partial<User> | null>(null);

    const profile = profileOverride
        ? { ...userProfile, ...profileOverride }
        : userProfile;

    const handleEnterEdit = () => {
        if (profile) {
            setEditName(profile.name);
            setEditPhone(profile.phone);
            setEditWhatsapp((profile as any).whatsapp ?? "");
            setEditEmail(profile.email ?? "");
            setEditAddress((profile as any).address ?? "");
            const dob = profile.dob;
            if (dob?.toDate) {
                setEditDob(format(dob.toDate(), "yyyy-MM-dd"));
            } else {
                setEditDob("");
            }
            setEditCurrentWeight(String((profile as any).currentWeight ?? ""));
            setEditTargetWeight(String((profile as any).targetWeight ?? ""));
            setEditHealthConditions((profile as any).healthConditions ?? "");
            setIsEditMode(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
    };

    const handleSaveProfile = async () => {
        if (!profile?.id || !firebaseUser) return;
        setSaving(true);
        try {
            const userRef = doc(db, `clubs/${club!.id}/members`, profile.id);
            const updates: Record<string, any> = {
                name: editName,
                phone: editPhone,
                whatsapp: editWhatsapp,
                address: editAddress,
                currentWeight: editCurrentWeight ? parseFloat(editCurrentWeight) : null,
                targetWeight: editTargetWeight ? parseFloat(editTargetWeight) : null,
                healthConditions: editHealthConditions,
            };
            if (editDob) {
                updates.dob = Timestamp.fromDate(new Date(editDob));
            }
            await updateDoc(userRef, updates);
            setProfileOverride(updates);
            setIsEditMode(false);
            toast({ title: "Profile updated!" });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to update profile",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!firebaseUser?.email) return;
        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                variant: "destructive",
            });
            return;
        }
        if (newPassword.length < 6) {
            toast({
                title: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }
        setChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(
                firebaseUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(firebaseUser, credential);
            await updatePassword(firebaseUser, newPassword);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast({ title: "Password changed successfully!" });
        } catch (err: any) {
            const msg =
                err.code === "auth/wrong-password"
                    ? "Current password is incorrect"
                    : err.message || "Failed to change password";
            toast({ title: "Error", description: msg, variant: "destructive" });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            invalidateClubCache();
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to sign out",
                variant: "destructive",
            });
        }
    };

    if (loading || (!userProfile && !firebaseUser)) {
        return (
            <div
                className="min-h-screen p-4 pb-24 animate-fade-in"
                style={{ fontFamily: "'Nunito', sans-serif", background: BG }}
            >
                <div className="max-w-md mx-auto space-y-6">
                    <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                    <Skeleton className="h-8 w-48 mx-auto" />
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div
                className="min-h-screen flex items-center justify-center p-4"
                style={{ fontFamily: "'Nunito', sans-serif", background: BG }}
            >
                <p className="text-muted-foreground">Profile not found.</p>
            </div>
        );
    }

    return (
        <div
            className="min-h-screen p-4 pb-24 animate-fade-in"
            style={{ fontFamily: "'Nunito', sans-serif", background: BG }}
        >
            <div className="max-w-md mx-auto space-y-6">
                {/* Profile photo */}
                <div className="flex justify-center pt-4">
                    <div className="relative">
                        <Avatar className="h-28 w-28 rounded-full border-4 border-white shadow-soft">
                            {profile.photo ? (
                                <AvatarImage src={profile.photo} />
                            ) : null}
                            <AvatarFallback
                                className="text-3xl font-black"
                                style={{ backgroundColor: "#e8f5e9", color: GREEN }}
                            >
                                {profile.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 text-xs text-muted-foreground bg-white/90 px-2 py-0.5 rounded-full shadow-sm">
                            Tap to change
                        </span>
                    </div>
                </div>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-black" style={{ color: GREEN }}>
                        My Profile
                    </h1>
                    {!isEditMode ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleEnterEdit}
                            className="rounded-full"
                            style={{ color: GREEN }}
                        >
                            <Pencil className="w-5 h-5" />
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveProfile}
                                disabled={saving}
                                style={{ backgroundColor: GREEN }}
                            >
                                {saving ? "Saving…" : "Save"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Profile card */}
                <div className="rounded-2xl bg-white border border-border shadow-soft p-5 space-y-4">
                    {isEditMode ? (
                        <>
                            <div className="space-y-2">
                                <Label>Full name</Label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Your name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input
                                    value={editPhone}
                                    onChange={(e) => setEditPhone(e.target.value)}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input
                                    value={editWhatsapp}
                                    onChange={(e) => setEditWhatsapp(e.target.value)}
                                    placeholder="WhatsApp number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input
                                    value={editAddress}
                                    onChange={(e) => setEditAddress(e.target.value)}
                                    placeholder="Your address"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input
                                    type="date"
                                    value={editDob}
                                    onChange={(e) => setEditDob(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>Current Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editCurrentWeight}
                                        onChange={(e) => setEditCurrentWeight(e.target.value)}
                                        placeholder="e.g. 68.5"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Target Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={editTargetWeight}
                                        onChange={(e) => setEditTargetWeight(e.target.value)}
                                        placeholder="e.g. 60"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Health Conditions</Label>
                                <Input
                                    value={editHealthConditions}
                                    onChange={(e) => setEditHealthConditions(e.target.value)}
                                    placeholder="Any health conditions"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <p className="text-xs text-muted-foreground">Name</p>
                                <p className="font-bold text-base">{profile.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Phone</p>
                                <p className="font-bold text-base">{profile.phone}</p>
                            </div>
                            {(profile as any).whatsapp && (
                                <div>
                                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                                    <p className="font-medium text-base">{(profile as any).whatsapp}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium text-base text-muted-foreground">
                                    {profile.email}
                                </p>
                            </div>
                            {(profile as any).address && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Address</p>
                                    <p className="font-medium text-base">{(profile as any).address}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">Date of birth</p>
                                <p className="font-medium text-base">
                                    {formatTimestamp(profile.dob)}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {(profile as any).currentWeight != null && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Current Weight</p>
                                        <p className="font-medium text-base">{(profile as any).currentWeight} kg</p>
                                    </div>
                                )}
                                {(profile as any).targetWeight != null && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Target Weight</p>
                                        <p className="font-medium text-base">{(profile as any).targetWeight} kg</p>
                                    </div>
                                )}
                            </div>
                            {(profile as any).healthConditions && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Health Conditions</p>
                                    <p className="font-medium text-base">{(profile as any).healthConditions}</p>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                                {profile.membershipTier && (
                                    <Badge
                                        className="capitalize"
                                        style={{
                                            backgroundColor: "#e8f5e9",
                                            color: GREEN,
                                            border: "none",
                                        }}
                                    >
                                        {profile.membershipTier}
                                    </Badge>
                                )}
                                <Badge
                                    variant={
                                        profile.status === "active"
                                            ? "outline"
                                            : "destructive"
                                    }
                                >
                                    {profile.status}
                                </Badge>
                            </div>
                        </>
                    )}
                </div>

                {/* Membership Status Card */}
                <MembershipStatusCard profile={profile} club={club} toast={toast} />

                {/* Change password */}
                <div className="rounded-2xl bg-white border border-border shadow-soft p-5 space-y-4">
                    <h2 className="text-sm font-bold" style={{ color: GREEN }}>
                        Change password
                    </h2>
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Label>Current password</Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>New password</Label>
                            <Input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm new password</Label>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleChangePassword}
                            disabled={
                                changingPassword ||
                                !currentPassword ||
                                !newPassword ||
                                !confirmPassword
                            }
                            style={{ backgroundColor: GREEN }}
                        >
                            {changingPassword ? "Updating…" : "Save password"}
                        </Button>
                    </div>
                </div>

                {/* Sign out */}
                <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign out
                </Button>
            </div>
        </div>
    );
}

// ─── Membership Status Card ─────────────────────────────────────────────────

function MembershipStatusCard({ profile, club, toast }: { profile: User; club: any; toast: any }) {
    const { wallet } = useMyWallet();
    const { refreshProfile } = useAuth();
    const { plans, loading: plansLoading } = useClubMembershipPlans(club?.id ?? null);
    const renew = useRenewMembership();
    const [renewOpen, setRenewOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
    const [step, setStep] = useState<"select" | "confirm" | "success">("select");
    const [renewResult, setRenewResult] = useState<{ endDate: Date; startDate: Date; plan: MembershipPlan } | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Calculate days remaining
    const endTs = profile?.membershipEnd as any;
    const endDate = endTs?.toDate ? endTs.toDate() : endTs?.seconds ? new Date(endTs.seconds * 1000) : null;
    const now = new Date();
    const daysLeft = endDate ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const statusColor =
        daysLeft === null ? "#6b7280" :
            daysLeft < 0 ? "#dc2626" :
                daysLeft <= 7 ? "#ea580c" :
                    daysLeft <= 30 ? "#d97706" : GREEN;

    const statusLabel =
        daysLeft === null ? "No membership" :
            daysLeft < 0 ? "Expired" :
                daysLeft <= 7 ? "Expiring soon!" : "Active";

    const walletBalance = wallet?.balance ?? 0;
    const walletDocId = wallet ? (profile.id || "") : "";

    const handleRenew = async () => {
        if (!selectedPlan || !wallet) return;
        try {
            const result = await renew.mutateAsync({
                plan: selectedPlan,
                walletDocId: walletDocId,
                currentBalance: walletBalance,
                currentMembershipEnd: profile.membershipEnd ?? null,
            });
            setRenewResult(result);
            setStep("success");
            toast({ title: "Membership renewed!", description: `${result.plan.name} plan — valid until ${format(result.endDate, "dd MMM yyyy")}` });
            // Refresh auth profile so membership status updates immediately
            await refreshProfile();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const openRenewModal = () => {
        setSelectedPlan(null);
        setStep("select");
        setRenewOpen(true);
    };

    return (
        <>
            <div className="rounded-2xl bg-white border border-border shadow-soft p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold" style={{ color: GREEN }}>Membership</h2>
                    <Badge style={{ backgroundColor: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}30` }}>
                        {statusLabel}
                    </Badge>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground">Plan</p>
                            <p className="font-bold capitalize text-base">{profile.membershipTier || "—"}</p>
                        </div>
                        {daysLeft !== null && (
                            <div className="text-right">
                                <p className="text-3xl font-black" style={{ color: statusColor }}>
                                    {daysLeft < 0 ? 0 : daysLeft}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                    days left
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Start</p>
                            <p className="text-sm font-medium">{formatTimestamp(profile.membershipStart)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Expiry</p>
                            <p className="text-sm font-medium">{formatTimestamp(profile.membershipEnd)}</p>
                        </div>
                    </div>

                    {profile.referredBy && (
                        <div>
                            <p className="text-xs text-muted-foreground">Referred by</p>
                            <p className="text-sm font-medium">{profile.referredBy}</p>
                        </div>
                    )}
                </div>

                <Button className="w-full gap-2 rounded-xl" style={{ backgroundColor: GREEN }} onClick={openRenewModal}>
                    <RefreshCw className="w-4 h-4" /> Renew Membership
                </Button>
            </div>

            {/* Renew Modal */}
            <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {step === "success" ? "Renewal Successful!" : "Renew Membership"}
                        </DialogTitle>
                    </DialogHeader>

                    {step === "select" && (
                        <div className="space-y-3 pt-2">
                            <p className="text-sm text-muted-foreground">Choose a plan:</p>
                            {plansLoading ? (
                                <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                            ) : (
                                <div className="space-y-2">
                                    {plans.map((p) => {
                                        const active = selectedPlan?.id === p.id;
                                        const canAfford = walletBalance >= p.price;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPlan(p)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                                                style={{
                                                    borderColor: active ? GREEN : "#e5e7eb",
                                                    backgroundColor: active ? "#f0fdf4" : "white",
                                                }}
                                            >
                                                <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm text-white"
                                                    style={{ backgroundColor: p.color || GREEN }}>
                                                    {p.name[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm">{p.name}</p>
                                                    <p className="text-xs text-muted-foreground">{p.durationDays} days</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold" style={{ color: canAfford ? GREEN : "#dc2626" }}>₹{p.price}</p>
                                                    {!canAfford && <p className="text-[10px] text-red-500">Low balance</p>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <div className="pt-2 flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Wallet balance:</span>
                                <span className="font-bold ml-auto">₹{walletBalance.toLocaleString()}</span>
                            </div>
                            <Button
                                className="w-full rounded-xl"
                                style={{ backgroundColor: GREEN }}
                                disabled={!selectedPlan || walletBalance < (selectedPlan?.price ?? Infinity)}
                                onClick={() => setStep("confirm")}
                            >
                                {!selectedPlan ? "Select a plan" :
                                    walletBalance < selectedPlan.price ? "Insufficient balance" : "Continue"}
                            </Button>
                        </div>
                    )}

                    {step === "confirm" && selectedPlan && (
                        <div className="space-y-4 pt-2">
                            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-bold">{selectedPlan.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-semibold">{selectedPlan.durationDays} days</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount</span>
                                    <span className="font-bold text-red-600">−₹{selectedPlan.price}</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between text-sm">
                                    <span className="text-muted-foreground">New balance</span>
                                    <span className="font-bold" style={{ color: GREEN }}>
                                        ₹{(walletBalance - selectedPlan.price).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            {walletBalance < selectedPlan.price && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                                    <p className="text-xs text-red-700">
                                        You need ₹{(selectedPlan.price - walletBalance).toLocaleString()} more. Top up your wallet first.
                                    </p>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep("select")}>
                                    Back
                                </Button>
                                <Button
                                    className="flex-1 rounded-xl"
                                    style={{ backgroundColor: GREEN }}
                                    disabled={renew.isPending || walletBalance < selectedPlan.price}
                                    onClick={handleRenew}
                                >
                                    {renew.isPending ? "Processing…" : "Confirm Renewal"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="space-y-4 pt-2 text-center">
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
                            <p className="font-bold text-lg text-emerald-700">Membership Renewed!</p>
                            <p className="text-sm text-muted-foreground">Your {selectedPlan?.name} plan is now active.</p>
                            {renewResult && (
                                <p className="text-xs text-muted-foreground">Valid until {format(renewResult.endDate, "dd MMM yyyy")}</p>
                            )}
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 rounded-xl gap-1" onClick={() => printReceipt()}>
                                    🖨️ Print Receipt
                                </Button>
                                <Button className="flex-1 rounded-xl" style={{ backgroundColor: GREEN }} onClick={() => setRenewOpen(false)}>
                                    Done
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Hidden receipt for printing */}
            <div id="receipt-print-area" ref={receiptRef} style={{ display: "none" }}>
                {renewResult && selectedPlan && (
                    <MembershipReceipt
                        memberName={profile.name}
                        memberId={(profile as any).memberId || profile.id}
                        planName={selectedPlan.name}
                        amount={selectedPlan.price}
                        paymentMethod="Wallet"
                        startDate={renewResult.startDate}
                        endDate={renewResult.endDate}
                        clubName={club?.name ?? "Club"}
                        clubPhone={club?.phone ?? ""}
                        date={new Date()}
                        receiptNumber={`RNW-${Date.now().toString(36).toUpperCase()}`}
                    />
                )}
            </div>
        </>
    );
}
