import { useState } from "react";
import {
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider,
    signOut,
} from "firebase/auth";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Pencil, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useClubContext, invalidateClubCache } from "@/lib/clubDetection";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/types/firestore";

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
            const userRef = doc(db, "users", profile.id);
            await updateDoc(userRef, { name: editName, phone: editPhone });
            setProfileOverride({ name: editName, phone: editPhone });
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
                                <Label>Email</Label>
                                <Input
                                    value={profile.email}
                                    disabled
                                    className="bg-muted text-muted-foreground"
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
                            <div>
                                <p className="text-xs text-muted-foreground">Email</p>
                                <p className="font-medium text-base text-muted-foreground">
                                    {profile.email}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Date of birth</p>
                                <p className="font-medium text-base">
                                    {formatTimestamp(profile.dob)}
                                </p>
                            </div>
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

                {/* Membership section */}
                <div className="rounded-2xl bg-white border border-border shadow-soft p-5 space-y-4">
                    <h2 className="text-sm font-bold" style={{ color: GREEN }}>
                        Membership
                    </h2>
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Plan</p>
                            <p className="font-medium capitalize">
                                {profile.membershipTier || "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Start date</p>
                            <p className="font-medium">
                                {formatTimestamp(profile.membershipStart)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Expiry date</p>
                            <p className="font-medium">
                                {formatTimestamp(profile.membershipEnd)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Referred by</p>
                            <p className="font-medium">
                                {profile.referredBy || "—"}
                            </p>
                        </div>
                    </div>
                </div>

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
