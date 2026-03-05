import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Copy,
    Check,
    Eye,
    EyeOff,
    Plus,
    Trash2,
    Upload,
    ExternalLink,
    AlertTriangle,
    DollarSign,
    MessageSquare,
    Flame,
    ChevronDown,
    ChevronUp,
    History,
    RotateCcw,
    HardDrive,
    Pencil,
    X,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
    useClubById,
    useUpdateClub,
    useToggleClubStatus,
    useMemberCountByClub,
} from "@/hooks/useSuperAdmin";
import {
    useUploadLandingImage,
    useDeleteLandingImage,
    useUploadLandingHTML,
} from "@/hooks/useLandingImages";
import { useClubPayments, useAddPayment } from "@/hooks/superadmin/useClubPayments";
import { useEnquiries, useUpdateEnquiryStatus } from "@/hooks/owner/useEnquiries";
import { useClubCostEstimate } from "@/hooks/superadmin/useFirebaseUsage";
import { ref, uploadString, getDownloadURL, getBytes } from "firebase/storage";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import type { Club, LandingImage, Enquiry } from "@/types/firestore";
import { ImageLabelSelect } from "@/components/ui/ImageLabelSelect";

// ─── Helpers ─────────────────────────────────────────────────────────────

function formatDate(ts: { toDate?: () => Date } | null | undefined) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
                navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }}
        >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
    );
}

// ─── Main ClubDetail ─────────────────────────────────────────────────────

export default function ClubDetail() {
    const { clubId } = useParams<{ clubId: string }>();
    const navigate = useNavigate();
    const { data: club, isLoading } = useClubById(clubId ?? "");
    const { data: memberCount } = useMemberCountByClub(clubId ?? "");

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        );
    }

    if (!club) {
        return (
            <div className="text-center py-16">
                <p className="text-muted-foreground">Club not found.</p>
                <Button variant="link" onClick={() => navigate("/superadmin/clubs")}>
                    Back to clubs
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/clubs")}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight truncate">{club.name}</h1>
                    <p className="text-sm text-muted-foreground">{club.domain}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                        variant={club.status === "active" ? "outline" : "destructive"}
                        className={club.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                    >
                        {club.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                        {memberCount ?? 0} members
                    </Badge>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="info">
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="info">Club Info</TabsTrigger>
                    <TabsTrigger value="landing">Landing Page</TabsTrigger>
                    <TabsTrigger value="payments">
                        <DollarSign className="w-3.5 h-3.5 mr-1" />
                        Payments
                    </TabsTrigger>
                    <TabsTrigger value="enquiries">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        Enquiries
                    </TabsTrigger>
                    <TabsTrigger value="firebase">
                        <Flame className="w-3.5 h-3.5 mr-1" />
                        Firebase Usage
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6">
                    <ClubInfoTab club={club} />
                </TabsContent>
                <TabsContent value="landing" className="mt-6">
                    <LandingPageTab clubId={club.id} club={club} />
                </TabsContent>
                <TabsContent value="payments" className="mt-6">
                    <PaymentsTab club={club} />
                </TabsContent>
                <TabsContent value="enquiries" className="mt-6">
                    <EnquiriesTab clubId={club.id} clubName={club.name} />
                </TabsContent>
                <TabsContent value="firebase" className="mt-6">
                    <FirebaseUsageTab clubId={club.id} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Tab 1: Club Info ─────────────────────────────────────────────────────

function ClubInfoTab({ club }: { club: Club }) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const updateClub = useUpdateClub();
    const toggleStatus = useToggleClubStatus();

    const [form, setForm] = useState({
        name: club.name,
        ownerName: club.ownerName,
        ownerEmail: club.ownerEmail ?? "",
        ownerPhone: club.ownerPhone,
        address: club.address ?? "",
        kitchenPin: club.kitchenPin ?? "",
        adminPin: club.adminPin ?? "",
        monthlyFee: String(club.monthlyFee ?? 20000),
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor || "#10B981",
        tertiaryColor: club.tertiaryColor || "#F59E0B",
    });

    const [domains, setDomains] = useState<string[]>(
        club.domains?.length ? club.domains : [club.domain]
    );
    const [newDomain, setNewDomain] = useState("");
    const [showKitchenPin, setShowKitchenPin] = useState(false);
    const [showAdminPin, setShowAdminPin] = useState(false);
    const [genKitchenConfirm, setGenKitchenConfirm] = useState(false);
    const [genAdminConfirm, setGenAdminConfirm] = useState(false);
    const [genSaving, setGenSaving] = useState(false);

    async function generateAndSavePin(type: "kitchen" | "admin") {
        const length = type === "kitchen" ? 6 : 8;
        const min = Math.pow(10, length - 1);
        const max = Math.pow(10, length) - 1;
        const newPin = String(Math.floor(min + Math.random() * (max - min + 1)));
        setGenSaving(true);
        try {
            const field = type === "kitchen" ? "kitchenPin" : "adminPin";
            await updateDoc(doc(db, "clubs", club.id), { [field]: newPin });
            handleChange(field as keyof typeof form, newPin);
            toast({ title: `${type === "kitchen" ? "Kitchen" : "Admin"} PIN updated`, description: `New PIN saved to Firestore.` });
        } catch (err: unknown) {
            toast({
                title: "Failed to update PIN",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setGenSaving(false);
            if (type === "kitchen") setGenKitchenConfirm(false);
            else setGenAdminConfirm(false);
        }
    }

    function handleChange(field: keyof typeof form, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    function addDomain() {
        const d = newDomain.trim();
        if (!d || domains.includes(d)) return;
        setDomains((prev) => [...prev, d]);
        setNewDomain("");
    }

    function removeDomain(domain: string) {
        if (domains.length <= 1) {
            toast({ title: "At least one domain is required.", variant: "destructive" });
            return;
        }
        setDomains((prev) => prev.filter((d) => d !== domain));
    }

    async function handleSave() {
        try {
            await updateClub.mutateAsync({
                clubId: club.id,
                data: {
                    name: form.name,
                    ownerName: form.ownerName,
                    ownerEmail: form.ownerEmail,
                    ownerPhone: form.ownerPhone,
                    address: form.address,
                    kitchenPin: form.kitchenPin,
                    adminPin: form.adminPin,
                    monthlyFee: Number(form.monthlyFee),
                    primaryColor: form.primaryColor,
                    secondaryColor: form.secondaryColor,
                    tertiaryColor: form.tertiaryColor,
                    domain: domains[0],
                    domains,
                },
            });
            toast({ title: "Club updated!", description: "Changes saved successfully." });
        } catch (err: unknown) {
            toast({
                title: "Update failed",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Club Info */}
                <div className="bg-white rounded-2xl border p-6 space-y-5">
                    <h3 className="font-semibold">Club Information</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Club Name</Label>
                            <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Monthly Fee (₹)</Label>
                            <Input
                                type="number"
                                value={form.monthlyFee}
                                onChange={(e) => handleChange("monthlyFee", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Owner Name</Label>
                            <Input value={form.ownerName} onChange={(e) => handleChange("ownerName", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Owner Email</Label>
                            <Input value={form.ownerEmail} onChange={(e) => handleChange("ownerEmail", e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Owner Phone</Label>
                            <Input value={form.ownerPhone} onChange={(e) => handleChange("ownerPhone", e.target.value)} />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label>Address</Label>
                            <Input value={form.address} onChange={(e) => handleChange("address", e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Access PINs */}
                <div className="bg-white rounded-2xl border p-6 space-y-5">
                    <h3 className="font-semibold">Access PINs</h3>

                    {/* Kitchen PIN */}
                    <div className="space-y-1.5">
                        <Label>Kitchen PIN (6 digits)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type={showKitchenPin ? "text" : "password"}
                                value={form.kitchenPin}
                                onChange={(e) => handleChange("kitchenPin", e.target.value.replace(/\D/g, "").slice(0, 6))}
                                maxLength={6}
                                className="w-40 font-mono tracking-widest"
                                placeholder="------"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowKitchenPin((p) => !p)}>
                                {showKitchenPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {genKitchenConfirm ? (
                                <>
                                    <Button type="button" variant="destructive" size="sm" disabled={genSaving}
                                        onClick={() => generateAndSavePin("kitchen")}>
                                        {genSaving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving…</> : "Confirm"}
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" disabled={genSaving} onClick={() => setGenKitchenConfirm(false)}>Cancel</Button>
                                </>
                            ) : (
                                <Button type="button" variant="outline" size="sm" onClick={() => setGenKitchenConfirm(true)}>Generate</Button>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Used by kitchen staff to access the Kitchen Display at <code>/kitchen</code></p>
                    </div>

                    {/* Admin PIN */}
                    <div className="space-y-1.5">
                        <Label>Admin PIN (8 digits)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                type={showAdminPin ? "text" : "password"}
                                value={form.adminPin}
                                onChange={(e) => handleChange("adminPin", e.target.value.replace(/\D/g, "").slice(0, 8))}
                                maxLength={8}
                                className="w-48 font-mono tracking-widest"
                                placeholder="--------"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowAdminPin((p) => !p)}>
                                {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {genAdminConfirm ? (
                                <>
                                    <Button type="button" variant="destructive" size="sm" disabled={genSaving}
                                        onClick={() => generateAndSavePin("admin")}>
                                        {genSaving ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Saving…</> : "Confirm"}
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" disabled={genSaving} onClick={() => setGenAdminConfirm(false)}>Cancel</Button>
                                </>
                            ) : (
                                <Button type="button" variant="outline" size="sm" onClick={() => setGenAdminConfirm(true)}>Generate</Button>
                            )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">Used by club owners to access the Admin Dashboard at <code>/admin</code> without Firebase Auth</p>
                    </div>
                </div>

                {/* Domains */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <h3 className="font-semibold">Domains</h3>
                    <div className="space-y-2">
                        {domains.map((domain) => (
                            <div key={domain} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border">
                                <span className="flex-1 text-sm font-mono truncate">{domain}</span>
                                <CopyButton text={domain} />
                                {domains.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-red-400 hover:text-red-600"
                                        onClick={() => removeDomain(domain)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add domain…"
                            value={newDomain}
                            onChange={(e) => setNewDomain(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addDomain()}
                            className="flex-1"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={addDomain} className="gap-1">
                            <Plus className="w-3.5 h-3.5" />
                            Add
                        </Button>
                    </div>
                </div>

                {/* Colors */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <h3 className="font-semibold">Club Colors</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {(["primaryColor", "secondaryColor", "tertiaryColor"] as const).map((field) => (
                            <div key={field} className="space-y-1.5">
                                <Label className="text-xs capitalize">{field.replace("Color", "")}</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={form[field]}
                                        onChange={(e) => handleChange(field, e.target.value)}
                                        className="h-9 w-9 rounded-lg border cursor-pointer p-0.5"
                                    />
                                    <Input
                                        value={form[field]}
                                        onChange={(e) => handleChange(field, e.target.value)}
                                        className="font-mono text-xs"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <Button onClick={handleSave} disabled={updateClub.isPending} className="w-full sm:w-auto">
                    {updateClub.isPending ? "Saving…" : "Save Changes"}
                </Button>
            </div>

            {/* Right column */}
            <div className="space-y-4">
                {/* Club ID */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="font-semibold text-sm">Club ID</h3>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 border">
                        <span className="flex-1 text-xs font-mono text-muted-foreground truncate">{club.id}</span>
                        <CopyButton text={club.id} />
                    </div>
                </div>

                {/* Status toggle */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="font-semibold text-sm">Club Status</h3>
                    <div className="flex items-center gap-3">
                        <Badge
                            variant={club.status === "active" ? "outline" : "destructive"}
                            className={`${club.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}`}
                        >
                            {club.status === "active" ? "Active" : "Suspended"}
                        </Badge>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant={club.status === "active" ? "destructive" : "default"}
                                size="sm"
                                className="w-full"
                                disabled={toggleStatus.isPending}
                            >
                                {club.status === "active" ? "Suspend Club" : "Activate Club"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    {club.status === "active" ? `Suspend ${club.name}?` : `Activate ${club.name}?`}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    {club.status === "active"
                                        ? "Members will be unable to access this club. You can reactivate it at any time."
                                        : "All club members and staff will regain access immediately."}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={() => toggleStatus.mutate({ clubId: club.id, currentStatus: club.status })}
                                    className={club.status === "active" ? "bg-destructive hover:bg-destructive/90" : ""}
                                >
                                    {club.status === "active" ? "Suspend" : "Activate"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>

                {/* Danger zone */}
                <div className="bg-white rounded-2xl border border-red-200 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <h3 className="font-semibold text-sm">Danger Zone</h3>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => navigate(`/superadmin/clubs/${club.id}/convert`)}
                    >
                        Convert Member → Club Owner
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Tab 2: Landing Page ──────────────────────────────────────────────────

// Reads a file from Firebase Storage using the SDK — avoids CORS entirely.
// Works for both authenticated and public Storage URLs.
async function readStorageUrl(url: string): Promise<string> {
    const match = url.match(/\/o\/([^?#]+)/);
    if (!match) throw new Error("Cannot parse Storage URL: " + url);
    const storagePath = decodeURIComponent(match[1]);
    const fileRef = ref(storage, storagePath);
    const bytes = await getBytes(fileRef);
    return new TextDecoder("utf-8").decode(bytes);
}

// Dialog step: null = closed, "first" = first confirm, "second" = final confirm
type PublishStep = null | "first" | "second";
// Restore state per-version
interface RestoreTarget { url: string; version: number }

function LandingPageTab({ clubId, club }: { clubId: string; club: Club }) {
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const images = club.landingPageImages ?? [];
    const history = club.landingPageHistory ?? [];

    // ── HTML editor state ──────────────────────────────────────────────
    const [htmlContent, setHtmlContent] = useState("");
    const [savedHtml, setSavedHtml] = useState("");   // last fetched/published value
    const [fetchingHtml, setFetchingHtml] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishStep, setPublishStep] = useState<PublishStep>(null);

    // ── Preview modals ─────────────────────────────────────────────────
    const [livePreviewOpen, setLivePreviewOpen] = useState(false);
    const [versionPreviewUrl, setVersionPreviewUrl] = useState<string | null>(null);

    // ── Restore state ──────────────────────────────────────────────────
    const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(null);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [restoring, setRestoring] = useState(false);

    // ── Image state ────────────────────────────────────────────────────
    const [imageLabel, setImageLabel] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, uploading: imageUploading, progress: imageProgress } = useUploadLandingImage(clubId);
    const { deleteImage, deleting } = useDeleteLandingImage(clubId);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // ── useUploadLandingHTML kept for compatibility (not used for upload path below) ──
    useUploadLandingHTML(clubId); // keeps the hook alive; we do the upload manually

    // ── Auto-load current HTML whenever the landing page URL changes ──
    useEffect(() => {
        let cancelled = false;

        if (!club.landingPageUrl) {
            setHtmlContent("");
            setSavedHtml("");
            setFetchingHtml(false);
            return;
        }

        setFetchingHtml(true);

        readStorageUrl(club.landingPageUrl)
            .then((text) => {
                if (cancelled) return;
                setHtmlContent(text);
                setSavedHtml(text);
            })
            .catch(() => {
                if (cancelled) return;
                toast({ title: "Could not load current HTML", variant: "destructive" });
            })
            .finally(() => {
                if (!cancelled) setFetchingHtml(false);
            });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [club.landingPageUrl]);

    // ── Helpers ────────────────────────────────────────────────────────
    function enterEditMode() { setEditMode(true); }
    function cancelEdit() { setHtmlContent(savedHtml); setEditMode(false); }

    // Step 1 of publish flow
    function requestPublish() {
        if (!htmlContent.trim()) return;
        setPublishStep("first");
    }

    // Step 2 — user clicked "Yes, Review"
    function advanceToSecondConfirm() { setPublishStep("second"); }

    // Actual publish — called only after both confirmations
    async function executePublish() {
        setPublishStep(null);
        setPublishing(true);
        try {
            // a) Save current live URL to history first
            if (club.landingPageUrl) {
                const nextVer = (history.length ?? 0) + 1;
                await updateDoc(doc(db, "clubs", clubId), {
                    landingPageHistory: arrayUnion({
                        version: nextVer,
                        url: club.landingPageUrl,
                        publishedAt: Timestamp.now(),
                        publishedBy: userProfile?.name ?? "Unknown",
                        label: `Version ${nextVer}`,
                    }),
                });
            }

            // b) Upload with timestamped filename so old files are NOT overwritten
            const ts = Date.now();
            const htmlRef = ref(storage, `clubs/${clubId}/landing/landing_${ts}.html`);
            // Replace {{CLUB_ID}} placeholder with the real club ID before uploading
            const finalHtml = htmlContent.replace(/\{\{CLUB_ID\}\}/g, clubId);
            await uploadString(htmlRef, finalHtml, "raw", { contentType: "text/html" });
            const newUrl = await getDownloadURL(htmlRef);

            // c) Update Firestore with new URL
            await updateDoc(doc(db, "clubs", clubId), { landingPageUrl: newUrl });

            // d) Keep textarea content (do NOT clear it)
            setSavedHtml(finalHtml);

            // e) Back to read-only
            setEditMode(false);

            toast({ title: "✅ Published successfully" });
        } catch (err: unknown) {
            toast({
                title: "Publish failed — your HTML was not cleared",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setPublishing(false);
        }
    }

    // ── Restore ────────────────────────────────────────────────────────
    function openRestoreConfirm(target: RestoreTarget) {
        setRestoreTarget(target);
        setRestoreConfirmOpen(true);
    }

    async function executeRestore() {
        if (!restoreTarget) return;
        setRestoreConfirmOpen(false);
        setRestoring(true);
        try {
            // Save current live URL to history
            if (club.landingPageUrl) {
                const nextVer = (history.length ?? 0) + 1;
                await updateDoc(doc(db, "clubs", clubId), {
                    landingPageHistory: arrayUnion({
                        version: nextVer,
                        url: club.landingPageUrl,
                        publishedAt: Timestamp.now(),
                        publishedBy: userProfile?.name ?? "Unknown",
                        label: `Version ${nextVer}`,
                    }),
                });
            }

            // Set the restored URL as the new live URL
            await updateDoc(doc(db, "clubs", clubId), {
                landingPageUrl: restoreTarget.url,
            });

            // Load restored HTML into textarea via Storage SDK (no CORS)
            const html = await readStorageUrl(restoreTarget.url);
            setHtmlContent(html);
            setSavedHtml(html);
            setEditMode(false);

            toast({ title: `✅ Restored to Version ${restoreTarget.version}` });
        } catch (err: unknown) {
            toast({
                title: "Restore failed",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        } finally {
            setRestoring(false);
            setRestoreTarget(null);
        }
    }

    // ── Image helpers ──────────────────────────────────────────────────
    async function handleImageUpload() {
        if (!imageFile || !imageLabel) return;
        try {
            await upload(imageFile, imageLabel);
            setImageLabel("");
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast({ title: "Image uploaded!" });
        } catch {
            toast({ title: "Upload failed", variant: "destructive" });
        }
    }

    async function handleDeleteImage(img: LandingImage) {
        try {
            await deleteImage(img);
            setDeleteConfirmId(null);
            toast({ title: "Image deleted" });
        } catch {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    }

    function copyUrl(id: string, url: string) {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    // ── Format timestamp for version history ──────────────────────────
    function formatVersionDate(ts: { toDate?: () => Date } | null | undefined) {
        if (!ts?.toDate) return "—";
        const d = ts.toDate();
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            + " · "
            + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }

    // ── Render ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-3xl">

            {/* ── Status bar ─────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border p-5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    {club.landingPageUrl ? (
                        <>
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Live</Badge>
                            <a
                                href={club.landingPageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-violet-600 hover:underline flex items-center gap-1"
                            >
                                Open URL <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </>
                    ) : (
                        <>
                            <Badge className="border-orange-200 bg-orange-50 text-orange-700">No Page</Badge>
                            <p className="text-sm text-muted-foreground">No landing page yet — paste HTML below and publish.</p>
                        </>
                    )}
                </div>
                {club.landingPageUrl && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => setLivePreviewOpen(true)}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview Live Page
                    </Button>
                )}
            </div>

            {/* ── HTML Editor card ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                    <div>
                        <h3 className="font-semibold text-sm">HTML Editor</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {editMode
                                ? "Edit mode — make changes then click Publish"
                                : "Read-only — click Edit to make changes"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!editMode && !fetchingHtml && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-xs"
                                onClick={enterEditMode}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                            </Button>
                        )}
                        {editMode && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1.5 text-xs"
                                    onClick={cancelEdit}
                                    disabled={publishing}
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={requestPublish}
                                    disabled={!htmlContent.trim() || publishing}
                                >
                                    {publishing
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing…</>
                                        : <><Upload className="w-3.5 h-3.5" /> Publish</>}
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Textarea body */}
                <div className="p-5 space-y-3">
                    {fetchingHtml ? (
                        <div className="flex items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm">Loading current HTML…</span>
                        </div>
                    ) : (
                        <textarea
                            value={htmlContent}
                            onChange={(e) => editMode && setHtmlContent(e.target.value)}
                            readOnly={!editMode}
                            placeholder={club.landingPageUrl
                                ? "Loading HTML…"
                                : "No landing page yet. Click Edit and paste your complete HTML here to publish."}
                            className={[
                                "w-full min-h-[480px] font-mono text-sm p-4 rounded-xl border resize-y",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors",
                                editMode
                                    ? "bg-white cursor-text"
                                    : "bg-gray-50 text-gray-600 cursor-default select-text",
                            ].join(" ")}
                        />
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{htmlContent.length.toLocaleString()} characters</span>
                        {editMode && htmlContent !== savedHtml && (
                            <span className="text-orange-500 font-medium">Unsaved changes</span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Version History ─────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b bg-gray-50">
                    <History className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">Version History</h3>
                    {history.length > 0 && (
                        <Badge variant="outline" className="text-xs ml-1">{history.length}</Badge>
                    )}
                </div>
                <div className="p-4">
                    {history.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No previous versions yet.<br />
                            <span className="text-xs">Previous versions will appear here after each publish.</span>
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {[...history].reverse().map((v, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border hover:bg-gray-100 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium">Version {v.version}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatVersionDate(v.publishedAt as { toDate?: () => Date })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="gap-1 text-xs h-8"
                                            onClick={() => setVersionPreviewUrl(v.url)}
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            Preview
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs h-8"
                                            disabled={restoring}
                                            onClick={() => openRestoreConfirm({ url: v.url, version: v.version })}
                                        >
                                            {restoring && restoreTarget?.version === v.version
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : <RotateCcw className="w-3 h-3" />}
                                            Restore
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Image Manager ───────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border p-5 space-y-4">
                <h3 className="font-semibold text-sm">Image Manager</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageLabelSelect existingImages={images} value={imageLabel} onChange={setImageLabel} />
                    <div>
                        <Label className="text-xs">File</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                            className="mt-1 block w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 file:font-medium file:text-xs hover:file:bg-violet-100"
                        />
                    </div>
                </div>
                <Button
                    size="sm"
                    disabled={!imageFile || !imageLabel || imageUploading}
                    onClick={handleImageUpload}
                    className="gap-1.5"
                >
                    <Upload className="w-3.5 h-3.5" />
                    {imageUploading ? "Uploading…" : "Upload Image"}
                </Button>
                {imageUploading && <Progress value={imageProgress} className="h-2" />}
                {images.length > 0 ? (
                    <div className="space-y-2">
                        {images.map((img) => (
                            <div key={img.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                                <img src={img.url} alt={img.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{img.name}</p>
                                    <input readOnly value={img.url} className="w-full text-[10px] text-muted-foreground bg-transparent outline-none truncate" />
                                </div>
                                <Button size="icon" variant="ghost" className="h-8 w-8 flex-shrink-0" onClick={() => copyUrl(img.id, img.url)} title="Copy URL">
                                    {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                                {deleteConfirmId === img.id ? (
                                    <Button size="sm" variant="destructive" className="text-xs flex-shrink-0" disabled={deleting} onClick={() => handleDeleteImage(img)}>
                                        {deleting ? "…" : "Confirm"}
                                    </Button>
                                ) : (
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 flex-shrink-0" onClick={() => setDeleteConfirmId(img.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">No images uploaded yet.</p>
                )}
            </div>

            {/* ════════════════════════════════════════════════════════
                DIALOGS — using Dialog (not AlertDialog) so we control
                close timing ourselves and prevent premature dismissal.
            ════════════════════════════════════════════════════════ */}

            {/* Publish step 1 */}
            <Dialog open={publishStep === "first"} onOpenChange={(o) => { if (!o) setPublishStep(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Are you sure you want to publish?</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            This will update the live landing page for <strong>{club.name}</strong>.
                            The current version will be saved to history before updating.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setPublishStep(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                                // explicitly advance — do NOT let Dialog close first
                                setPublishStep("second");
                            }}
                        >
                            Yes, Review →
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Publish step 2 — final confirmation */}
            <Dialog open={publishStep === "second"} onOpenChange={(o) => { if (!o) setPublishStep(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Final confirmation — publish now?</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            Current live version will be saved to history first, then the new HTML will go live.
                            This cannot be automatically undone (you can restore from history).
                        </p>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => setPublishStep("first")}>
                            ← Go Back
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={publishing}
                            onClick={() => {
                                setPublishStep(null);
                                executePublish();
                            }}
                        >
                            {publishing
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Publishing…</>
                                : "Publish Now"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Restore confirmation */}
            <Dialog open={restoreConfirmOpen} onOpenChange={(o) => { if (!o) { setRestoreConfirmOpen(false); setRestoreTarget(null); } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Restore Version {restoreTarget?.version}?</DialogTitle>
                        <p className="text-sm text-muted-foreground pt-1">
                            The current live version will be saved to history before restoring.
                            Version {restoreTarget?.version} will become the new live landing page.
                        </p>
                    </DialogHeader>
                    <DialogFooter className="gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setRestoreConfirmOpen(false); setRestoreTarget(null); }}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={restoring}
                            onClick={() => {
                                setRestoreConfirmOpen(false);
                                executeRestore();
                            }}
                        >
                            {restoring
                                ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Restoring…</>
                                : `Restore Version ${restoreTarget?.version}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Live page preview modal */}
            <Dialog open={livePreviewOpen} onOpenChange={setLivePreviewOpen}>
                <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-5 py-4 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-sm">Live Page Preview — {club.name}</DialogTitle>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setLivePreviewOpen(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        {club.landingPageUrl && (
                            <iframe
                                src={club.landingPageUrl}
                                title="Live Landing Page Preview"
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Version preview modal */}
            <Dialog open={!!versionPreviewUrl} onOpenChange={(o) => !o && setVersionPreviewUrl(null)}>
                <DialogContent className="max-w-5xl w-full h-[90vh] flex flex-col p-0">
                    <DialogHeader className="px-5 py-4 border-b flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-sm">Version Preview</DialogTitle>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setVersionPreviewUrl(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        {versionPreviewUrl && (
                            <iframe
                                src={versionPreviewUrl}
                                title="Version Preview"
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Tab 3: Payments ──────────────────────────────────────────────────────

function PaymentsTab({ club }: { club: Club }) {
    const { toast } = useToast();
    const { userProfile } = useAuth();
    const { data: payments, isLoading } = useClubPayments(club.id);
    const addPayment = useAddPayment();
    const [showModal, setShowModal] = useState(false);
    const [payForm, setPayForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });

    const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
    const lastPayment = payments?.[0];
    const nextDue = lastPayment
        ? new Date(lastPayment.date.toDate().getTime() + 30 * 86_400_000)
        : club.maintenanceDueDate?.toDate?.();

    async function handleAddPayment() {
        if (!payForm.amount) return;
        try {
            await addPayment.mutateAsync({
                clubId: club.id,
                amount: Number(payForm.amount),
                date: Timestamp.fromDate(new Date(payForm.date)),
                notes: payForm.notes,
                recordedBy: userProfile?.name ?? "Super Admin",
            });
            setShowModal(false);
            setPayForm({ amount: "", date: new Date().toISOString().slice(0, 10), notes: "" });
            toast({ title: "Payment recorded!" });
        } catch (err: unknown) {
            toast({
                title: "Failed to add payment",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
            });
        }
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <p className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Paid (all time)</p>
                </div>
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <p className="text-2xl font-bold">₹{(club.monthlyFee ?? 20000).toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground mt-1">Monthly Fee</p>
                </div>
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <p className="text-2xl font-bold text-orange-500">
                        {nextDue ? nextDue.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Next Due</p>
                </div>
            </div>

            {/* Add payment */}
            <div className="flex justify-end">
                <Button onClick={() => setShowModal(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Record Payment
                </Button>
            </div>

            {/* Payment history */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                    <h3 className="font-semibold text-sm">Payment History</h3>
                </div>
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                    </div>
                ) : !payments?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No payments recorded yet.</p>
                ) : (
                    <div className="divide-y">
                        <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-gray-50">
                            <span>Date</span><span>Amount</span><span>Notes</span><span>Recorded By</span>
                        </div>
                        {payments.map((p) => (
                            <div key={p.id} className="grid grid-cols-4 px-4 py-3 text-sm items-center">
                                <span>{formatDate(p.date as { toDate?: () => Date })}</span>
                                <span className="font-semibold text-emerald-600">₹{p.amount.toLocaleString("en-IN")}</span>
                                <span className="text-muted-foreground truncate">{p.notes || "—"}</span>
                                <span className="text-muted-foreground truncate">{p.recordedBy}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Payment Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Amount (₹)</Label>
                            <Input
                                type="number"
                                placeholder={String(club.monthlyFee ?? 20000)}
                                value={payForm.amount}
                                onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={payForm.date}
                                onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Input
                                placeholder="e.g. March 2026 maintenance"
                                value={payForm.notes}
                                onChange={(e) => setPayForm((p) => ({ ...p, notes: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleAddPayment} disabled={!payForm.amount || addPayment.isPending}>
                            {addPayment.isPending ? "Saving…" : "Save Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Tab 4: Enquiries ─────────────────────────────────────────────────────

function EnquiriesTab({ clubId, clubName }: { clubId: string; clubName: string }) {
    const { data: enquiries, isLoading } = useEnquiries(clubId);
    const updateStatus = useUpdateEnquiryStatus();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const statusColors: Record<Enquiry["status"], string> = {
        new: "border-blue-200 bg-blue-50 text-blue-700",
        contacted: "border-yellow-200 bg-yellow-50 text-yellow-700",
        converted: "border-emerald-200 bg-emerald-50 text-emerald-700",
        rejected: "border-red-200 bg-red-50 text-red-700",
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">{enquiries?.length ?? 0} Enquiries</h3>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => enquiries && exportEnquiriesToCSV(enquiries, `${clubName}-enquiries.csv`)}
                    disabled={!enquiries?.length}
                >
                    Export CSV
                </Button>
            </div>

            {isLoading ? (
                <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
            ) : !enquiries?.length ? (
                <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No enquiries yet for this club.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border overflow-hidden">
                    <div className="hidden sm:grid sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <span>Name</span><span>Phone</span><span>WhatsApp</span><span>Date</span><span>Status</span><span></span>
                    </div>
                    <div className="divide-y">
                        {enquiries.map((e) => (
                            <div key={e.id}>
                                <div
                                    className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 sm:gap-3 px-4 py-3 items-center cursor-pointer hover:bg-gray-50"
                                    onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                                >
                                    <span className="text-sm font-medium">{e.name}</span>
                                    <span className="text-sm text-muted-foreground">{e.phone}</span>
                                    <span className="text-sm text-muted-foreground">{e.whatsapp || "—"}</span>
                                    <span className="text-xs text-muted-foreground">{formatDate(e.createdAt as { toDate?: () => Date })}</span>
                                    <Select
                                        value={e.status}
                                        onValueChange={(v) => {
                                            updateStatus.mutate({ clubId, enquiryId: e.id, status: v as Enquiry["status"] });
                                        }}
                                    >
                                        <SelectTrigger className="h-7 text-xs w-28" onClick={(ev) => ev.stopPropagation()}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(["new", "contacted", "converted", "rejected"] as const).map((s) => (
                                                <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(ev) => { ev.stopPropagation(); setExpandedId(expandedId === e.id ? null : e.id); }}>
                                        {expandedId === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {expandedId === e.id && (
                                    <div className="px-4 pb-4 bg-gray-50 border-t">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                                            {[
                                                ["Email", e.email],
                                                ["Address", e.address],
                                                ["Date of Birth", e.dob],
                                                ["Current Weight", e.currentWeight ? `${e.currentWeight} kg` : null],
                                                ["Target Weight", e.targetWeight ? `${e.targetWeight} kg` : null],
                                                ["Health Conditions", e.healthConditions],
                                                ["Referred By", e.referredBy],
                                            ].map(([label, value]) => value ? (
                                                <div key={String(label)}>
                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                                                    <p className="text-sm mt-0.5">{String(value)}</p>
                                                </div>
                                            ) : null)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tab 5: Firebase Usage ────────────────────────────────────────────────

function FirebaseUsageTab({ clubId }: { clubId: string }) {
    const {
        storageMB,
        storageGB,
        reads,
        writes,
        storageCostINR,
        readsCostINR,
        writesCostINR,
        totalCostINR,
        isLoading,
        constants,
    } = useClubCostEstimate(clubId);

    const [showExplainer, setShowExplainer] = useState(false);

    if (isLoading) {
        return (
            <div className="space-y-4 max-w-2xl">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Usage stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <HardDrive className="w-6 h-6 mx-auto mb-2 text-violet-500" />
                    <p className="text-xl font-bold">{storageMB.toFixed(2)} MB</p>
                    <p className="text-xs text-muted-foreground mt-1">Storage Used</p>
                </div>
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <p className="text-xl font-bold">{reads.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Firestore Reads</p>
                </div>
                <div className="bg-white rounded-2xl border p-5 text-center">
                    <p className="text-xl font-bold">{writes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Firestore Writes</p>
                </div>
            </div>

            {/* Cost breakdown */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <h3 className="font-semibold">Estimated Monthly Cost</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm py-2 border-b">
                        <span className="text-muted-foreground">Storage ({storageGB.toFixed(4)} GB × ₹{(constants.STORAGE_COST_PER_GB * constants.USD_TO_INR).toFixed(2)}/GB)</span>
                        <span className="font-medium">₹{storageCostINR.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b">
                        <span className="text-muted-foreground">Reads ({reads.toLocaleString()} reads)</span>
                        <span className="font-medium">₹{readsCostINR.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-2 border-b">
                        <span className="text-muted-foreground">Writes ({writes.toLocaleString()} writes)</span>
                        <span className="font-medium">₹{writesCostINR.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold py-2">
                        <span>Total Estimated Cost</span>
                        <span className="text-violet-600">₹{totalCostINR.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Explainer */}
            <div className="bg-white rounded-2xl border overflow-hidden">
                <button
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => setShowExplainer((p) => !p)}
                >
                    <span>How is this calculated?</span>
                    {showExplainer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showExplainer && (
                    <div className="px-5 pb-5 space-y-3 text-sm text-muted-foreground border-t">
                        <p className="pt-3">Firebase costs are estimated using the following rates:</p>
                        <ul className="space-y-2 list-disc pl-5">
                            <li><strong>Storage:</strong> ${constants.STORAGE_COST_PER_GB}/GB/month = ₹{(constants.STORAGE_COST_PER_GB * constants.USD_TO_INR).toFixed(2)}/GB/month</li>
                            <li><strong>Firestore Reads:</strong> ${constants.READS_COST_PER_100K} per 100,000 reads = ₹{(constants.READS_COST_PER_100K * constants.USD_TO_INR).toFixed(2)} per 100k</li>
                            <li><strong>Firestore Writes:</strong> ${constants.WRITES_COST_PER_100K} per 100,000 writes = ₹{(constants.WRITES_COST_PER_100K * constants.USD_TO_INR).toFixed(2)} per 100k</li>
                        </ul>
                        <p>USD → INR conversion rate: 1 USD = ₹{constants.USD_TO_INR}</p>
                        <p className="text-xs">
                            Read/write counts are stored in <code className="bg-gray-100 px-1 rounded">clubs/{clubId}/usageStats/counters</code> and incremented automatically by the platform.
                            Storage is calculated by listing all files under <code className="bg-gray-100 px-1 rounded">clubs/{clubId}/</code> in Firebase Storage.
                        </p>
                        <p className="text-xs font-medium text-orange-600">
                            Note: These are estimates only. Firebase free tier quotas (1 GB storage, 50k reads/day, 20k writes/day) may mean actual cost is $0.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
