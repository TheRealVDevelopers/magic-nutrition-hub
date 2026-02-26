import { useState } from "react";
import { Eye, EyeOff, Save, Trash2, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import { useAuth } from "@/lib/auth";
import AnnouncementForm from "@/components/owner/AnnouncementForm";
import {
    useAllProducts, useSetTodaysSpecial,
    useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement,
    useUpdateClubSettings,
} from "@/hooks/useOwner";

export default function ClubSettingsPage() {
    const { toast } = useToast();
    const { club } = useClubContext();
    const { firebaseUser } = useAuth();

    // Today's special
    const { data: products, isLoading: productsLoading } = useAllProducts();
    const setSpecial = useSetTodaysSpecial();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [specialInit, setSpecialInit] = useState(false);
    if (products && !specialInit) {
        setSelectedIds(products.filter((p) => p.isAvailableToday).map((p) => p.id));
        setSpecialInit(true);
    }

    // Announcements
    const { data: announcements, isLoading: annLoading } = useAnnouncements();
    const createAnn = useCreateAnnouncement();
    const deleteAnn = useDeleteAnnouncement();
    const [annOpen, setAnnOpen] = useState(false);
    const [deleteAnnId, setDeleteAnnId] = useState<string | null>(null);

    // Kitchen PIN
    const [showPin, setShowPin] = useState(false);
    const [newPin, setNewPin] = useState("");
    const updateSettings = useUpdateClubSettings();

    // Club profile
    const [clubName, setClubName] = useState(club?.name || "");
    const [tagline, setTagline] = useState(club?.tagline || "");
    const [primaryColor, setPrimaryColor] = useState(club?.primaryColor || "#8B5CF6");

    // Referral Settings
    const [referralBonusCoins, setReferralBonusCoins] = useState(club?.referralBonusCoins ?? 50);

    const handleToggleProduct = (productId: string) => {
        const updated = selectedIds.includes(productId)
            ? selectedIds.filter((id) => id !== productId)
            : [...selectedIds, productId];
        setSelectedIds(updated);
        setSpecial.mutate(updated, {
            onSuccess: () => toast({ title: "Today's special updated!" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    };

    const handleSavePin = () => {
        if (!club || newPin.length !== 4) return;
        updateSettings.mutate({ clubId: club.id, data: { kitchenPin: newPin } }, {
            onSuccess: () => { toast({ title: "Kitchen PIN updated!" }); setNewPin(""); },
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    };

    const handleSaveProfile = () => {
        if (!club) return;
        updateSettings.mutate({ clubId: club.id, data: { name: clubName, tagline, primaryColor } }, {
            onSuccess: () => toast({ title: "Club profile updated!" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    };

    const handleSaveReferralSettings = () => {
        if (!club) return;
        updateSettings.mutate({ clubId: club.id, data: { referralBonusCoins } }, {
            onSuccess: () => toast({ title: "Referral settings updated!" }),
            onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
        });
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <h1 className="text-2xl font-black text-wellness-forest">Club Settings</h1>

            <Tabs defaultValue="special">
                <TabsList>
                    <TabsTrigger value="special">Today's Special</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="kitchen">Kitchen PIN</TabsTrigger>
                    <TabsTrigger value="profile">Club Profile</TabsTrigger>
                    <TabsTrigger value="referrals">Referrals</TabsTrigger>
                </TabsList>

                {/* Today's Special */}
                <TabsContent value="special" className="mt-6 space-y-3">
                    {productsLoading ? (
                        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    ) : products && products.length > 0 ? (
                        products.map((p) => (
                            <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${selectedIds.includes(p.id) ? "bg-emerald-50 border-emerald-200" : "bg-white"}`}>
                                <div>
                                    <p className="text-sm font-semibold">{p.name}</p>
                                    <p className="text-xs text-muted-foreground">{p.price} • Stock: {p.stock}</p>
                                </div>
                                <Switch
                                    checked={selectedIds.includes(p.id)}
                                    onCheckedChange={() => handleToggleProduct(p.id)}
                                    disabled={setSpecial.isPending}
                                />
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground text-sm py-8">No products in this club</p>
                    )}
                </TabsContent>

                {/* Announcements */}
                <TabsContent value="announcements" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setAnnOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> New Announcement</Button>
                    </div>
                    {annLoading ? (
                        <Skeleton className="h-24 rounded-xl" />
                    ) : announcements && announcements.filter((a) => a.isActive).length > 0 ? (
                        <div className="space-y-2">
                            {announcements.filter((a) => a.isActive).map((a) => (
                                <div key={a.id} className="flex items-start justify-between p-4 rounded-xl border bg-white">
                                    <div className="flex items-start gap-3">
                                        <Megaphone className="w-5 h-5 text-violet-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold">{a.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{a.message}</p>
                                            <p className="text-xs text-muted-foreground mt-2">{a.createdAt?.toDate?.().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button size="icon" variant="ghost" className="text-red-500 h-8 w-8" onClick={() => setDeleteAnnId(a.id)}><Trash2 className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground text-sm py-8">No announcements</p>
                    )}

                    <Dialog open={annOpen} onOpenChange={setAnnOpen}>
                        <DialogContent><DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
                            <AnnouncementForm
                                onSubmit={(data) => {
                                    createAnn.mutate({ ...data, postedBy: firebaseUser?.uid || "" }, {
                                        onSuccess: () => { toast({ title: "Announcement posted!" }); setAnnOpen(false); },
                                        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                                    });
                                }}
                                isLoading={createAnn.isPending}
                            />
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={!!deleteAnnId} onOpenChange={() => setDeleteAnnId(null)}>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete announcement?</AlertDialogTitle>
                            <AlertDialogDescription>This will hide the announcement from all users.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { if (deleteAnnId) { deleteAnn.mutate(deleteAnnId); setDeleteAnnId(null); } }}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TabsContent>

                {/* Kitchen PIN */}
                <TabsContent value="kitchen" className="mt-6">
                    <div className="max-w-sm bg-white rounded-2xl border p-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Current Kitchen PIN</Label>
                            <div className="flex items-center gap-2">
                                <Input value={showPin ? (club?.kitchenPin || "—") : "••••"} readOnly className="text-center text-lg font-mono tracking-widest" />
                                <Button size="icon" variant="ghost" onClick={() => setShowPin(!showPin)}>{showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Change PIN</Label>
                            <Input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="New 4-digit PIN" className="text-center" maxLength={4} />
                        </div>
                        <Button onClick={handleSavePin} disabled={newPin.length !== 4 || updateSettings.isPending} className="w-full">
                            <Save className="w-4 h-4 mr-2" /> {updateSettings.isPending ? "Saving…" : "Save PIN"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Club Profile */}
                <TabsContent value="profile" className="mt-6">
                    <div className="max-w-lg bg-white rounded-2xl border p-6 space-y-4">
                        <div className="space-y-2"><Label>Club Name</Label><Input value={clubName} onChange={(e) => setClubName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Tagline</Label><Input value={tagline} onChange={(e) => setTagline(e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Domain (read-only)</Label>
                            <Input value={club?.domain || ""} readOnly className="bg-gray-50" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Label>Primary Color</Label>
                            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
                        </div>
                        <Button onClick={handleSaveProfile} disabled={updateSettings.isPending} className="w-full">
                            <Save className="w-4 h-4 mr-2" /> {updateSettings.isPending ? "Saving…" : "Save Profile"}
                        </Button>
                    </div>
                </TabsContent>

                {/* Referral Settings */}
                <TabsContent value="referrals" className="mt-6">
                    <div className="max-w-lg bg-white rounded-2xl border p-6 space-y-4">
                        <div className="space-y-2">
                            <Label>Referral Bonus Coins</Label>
                            <Input
                                type="number"
                                value={referralBonusCoins}
                                onChange={(e) => setReferralBonusCoins(Number(e.target.value))}
                                min={0}
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Members currently earn {referralBonusCoins} {club?.currencyName || "coins"} for each successful referral.
                            </p>
                        </div>
                        <Button onClick={handleSaveReferralSettings} disabled={updateSettings.isPending} className="w-full">
                            <Save className="w-4 h-4 mr-2" /> {updateSettings.isPending ? "Saving…" : "Save Settings"}
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
