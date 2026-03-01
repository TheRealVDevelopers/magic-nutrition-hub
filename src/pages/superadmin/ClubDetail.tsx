import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Power,
    CheckCircle,
    AlertTriangle,
    Users,
    Globe,
    Phone,
    Mail,
    Upload,
    Trash2,
    Copy,
    Check,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ImageLabelSelect } from "@/components/ui/ImageLabelSelect";
import { useToast } from "@/hooks/use-toast";
import ClubForm, { type ClubFormValues } from "@/components/superadmin/ClubForm";
import MaintenanceBadge from "@/components/superadmin/MaintenanceBadge";
import {
    useClubById,
    useUpdateClub,
    useToggleClubStatus,
    useToggleMaintenancePaid,
    useMemberCountByClub,
} from "@/hooks/useSuperAdmin";
import {
    useUploadLandingImage,
    useDeleteLandingImage,
    useUploadLandingHTML,
} from "@/hooks/useLandingImages";
import type { LandingImage } from "@/types/firestore";

export default function ClubDetail() {
    const { clubId } = useParams<{ clubId: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { data: club, isLoading } = useClubById(clubId || "");
    const { data: memberCount } = useMemberCountByClub(clubId || "");
    const updateClub = useUpdateClub();
    const toggleStatus = useToggleClubStatus();
    const toggleMaintenance = useToggleMaintenancePaid();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 rounded-2xl" />
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

    const initials = club.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const handleEdit = async (data: ClubFormValues) => {
        try {
            await updateClub.mutateAsync({
                clubId: club.id,
                data: {
                    name: data.name,
                    currencyName: data.currencyName,
                    domain: data.domain,
                    ownerName: data.ownerName,
                    ownerPhone: data.ownerPhone,
                    tagline: data.tagline || "",
                    kitchenPin: data.kitchenPin,
                    parentClubId: data.parentClubId || null,
                    primaryColor: data.primaryColor,
                    secondaryColor: data.secondaryColor,
                    tertiaryColor: data.tertiaryColor,
                },
            });
            toast({ title: "Club updated!", description: "Changes saved successfully." });
        } catch (err: any) {
            toast({
                title: "Update failed",
                description: err.message,
                variant: "destructive",
            });
        }
    };

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
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="landing">Landing Page</TabsTrigger>
                    <TabsTrigger value="edit">Edit Branding</TabsTrigger>
                    <TabsTrigger value="danger">Danger Zone</TabsTrigger>
                </TabsList>

                {/* Tab 1: Overview */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Club Info Card */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border p-6 space-y-4">
                            <div className="flex items-start gap-4">
                                <Avatar className="h-16 w-16 rounded-2xl">
                                    {club.logo ? <AvatarImage src={club.logo} /> : null}
                                    <AvatarFallback
                                        className="rounded-2xl text-white font-bold text-lg"
                                        style={{ backgroundColor: club.primaryColor || "#8B5CF6" }}
                                    >
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-1">
                                    <h2 className="text-lg font-bold">{club.name}</h2>
                                    <p className="text-sm text-muted-foreground">{club.tagline || "No tagline"}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge
                                            variant={club.status === "active" ? "outline" : "destructive"}
                                            className={
                                                club.status === "active"
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : ""
                                            }
                                        >
                                            {club.status}
                                        </Badge>
                                        <MaintenanceBadge
                                            maintenancePaid={club.maintenancePaid}
                                            maintenanceDueDate={club.maintenanceDueDate}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4 border-t text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Globe className="w-4 h-4" />
                                    <span>{club.domain}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{memberCount ?? 0} members</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="w-4 h-4" />
                                    <span>{club.ownerPhone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail className="w-4 h-4" />
                                    <span>{club.ownerName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="bg-white rounded-2xl border p-6 space-y-3">
                            <h3 className="font-semibold text-sm">Quick Actions</h3>
                            <Button
                                variant={club.status === "active" ? "destructive" : "default"}
                                className="w-full justify-start gap-2"
                                disabled={toggleStatus.isPending}
                                onClick={() =>
                                    toggleStatus.mutate({ clubId: club.id, currentStatus: club.status })
                                }
                            >
                                <Power className="w-4 h-4" />
                                {club.status === "active" ? "Disable Club" : "Enable Club"}
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2"
                                disabled={toggleMaintenance.isPending}
                                onClick={() =>
                                    toggleMaintenance.mutate({
                                        clubId: club.id,
                                        currentPaid: club.maintenancePaid,
                                    })
                                }
                            >
                                <CheckCircle className="w-4 h-4" />
                                {club.maintenancePaid ? "Mark Maintenance Unpaid" : "Mark Maintenance Paid"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* Tab 2: Landing Page */}
                <TabsContent value="landing" className="mt-6">
                    <LandingPageTab clubId={club.id} club={club} />
                </TabsContent>

                {/* Tab 3: Edit */}
                <TabsContent value="edit" className="mt-6">
                    <div className="max-w-2xl bg-white rounded-2xl border p-6">
                        <ClubForm
                            mode="edit"
                            defaultValues={{
                                name: club.name,
                                currencyName: club.currencyName,
                                domain: club.domain,
                                ownerName: club.ownerName,
                                ownerPhone: club.ownerPhone,
                                tagline: club.tagline,
                                kitchenPin: club.kitchenPin,
                                parentClubId: club.parentClubId || "",
                                primaryColor: club.primaryColor,
                                secondaryColor: club.secondaryColor || "#10B981",
                                tertiaryColor: club.tertiaryColor || "#F59E0B",
                            }}
                            onSubmit={handleEdit}
                            isLoading={updateClub.isPending}
                        />
                    </div>
                </TabsContent>

                {/* Tab 4: Danger Zone */}
                <TabsContent value="danger" className="mt-6">
                    <div className="max-w-lg space-y-4">
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <h3 className="font-semibold text-red-700">Danger Zone</h3>
                            </div>

                            {/* Disable */}
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        className="w-full"
                                        disabled={club.status === "disabled"}
                                    >
                                        {club.status === "disabled" ? "Club Already Disabled" : "Disable Club"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Disable {club.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will prevent all users from accessing this club. Members
                                            will see a "Club disabled" message. You can re-enable it later.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() =>
                                                toggleStatus.mutate({ clubId: club.id, currentStatus: club.status })
                                            }
                                        >
                                            Disable
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {/* Convert Member */}
                            <Button
                                variant="outline"
                                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                                onClick={() => navigate(`/superadmin/clubs/${club.id}/convert`)}
                            >
                                Convert Member to Club Owner
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ─── Landing Page Tab ────────────────────────────────────────────────────

function LandingPageTab({ clubId, club }: { clubId: string; club: import("@/types/firestore").Club }) {
    const { toast } = useToast();
    const images = club.landingPageImages ?? [];

    // Image upload state
    const [imageLabel, setImageLabel] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { upload, uploading: imageUploading, progress: imageProgress } = useUploadLandingImage(clubId);
    const { deleteImage, deleting } = useDeleteLandingImage(clubId);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // HTML upload state
    const [htmlContent, setHtmlContent] = useState("");
    const { uploadHTML, uploading: htmlUploading } = useUploadLandingHTML(clubId);

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

    async function handlePublishHTML() {
        if (!htmlContent.trim()) return;
        try {
            await uploadHTML(htmlContent);
            toast({ title: "Landing page published successfully!" });
        } catch {
            toast({ title: "Publish failed", variant: "destructive" });
        }
    }

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Section 1 — Current Status */}
            <div className="bg-white rounded-2xl border p-6 space-y-3">
                <h3 className="font-semibold text-sm">Current Status</h3>
                {club.landingPageUrl ? (
                    <div className="flex items-center gap-3">
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Live</Badge>
                        <a
                            href={club.landingPageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-violet-600 hover:underline flex items-center gap-1"
                        >
                            View Live Page <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Badge className="border-orange-200 bg-orange-50 text-orange-700">No Landing Page</Badge>
                        <p className="text-sm text-muted-foreground">Upload an HTML file to publish this club's landing page</p>
                    </div>
                )}
            </div>

            {/* Section 2 — Images */}
            <div className="bg-white rounded-2xl border p-6 space-y-5">
                <div>
                    <h3 className="font-semibold text-sm">Images</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Upload images for the landing page. Generate links to use in your HTML.</p>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ImageLabelSelect
                            existingImages={images}
                            value={imageLabel}
                            onChange={setImageLabel}
                        />
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
                </div>

                {imageUploading && <Progress value={imageProgress} className="h-2" />}

                {images.length > 0 ? (
                    <div className="space-y-2">
                        {images.map((img) => (
                            <div key={img.id} className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50">
                                <img src={img.url} alt={img.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{img.name}</p>
                                    <input
                                        readOnly
                                        value={img.url}
                                        className="w-full text-[10px] text-muted-foreground bg-transparent outline-none truncate"
                                    />
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 flex-shrink-0"
                                    onClick={() => copyUrl(img.id, img.url)}
                                    title="Copy URL"
                                >
                                    {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                                {deleteConfirmId === img.id ? (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs flex-shrink-0"
                                        disabled={deleting}
                                        onClick={() => handleDeleteImage(img)}
                                    >
                                        {deleting ? "…" : "Confirm"}
                                    </Button>
                                ) : (
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-red-500 flex-shrink-0"
                                        onClick={() => setDeleteConfirmId(img.id)}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground py-6">
                        No images uploaded yet. Upload images above to get their Storage URLs.
                    </p>
                )}
            </div>

            {/* Section 3 — Update HTML */}
            <div className="bg-white rounded-2xl border p-6 space-y-4">
                <div>
                    <h3 className="font-semibold text-sm">Update Landing Page HTML</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Paste your complete HTML for this club's landing page.</p>
                </div>

                <textarea
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    placeholder="Paste your complete HTML here..."
                    className="w-full min-h-[400px] font-mono text-sm border rounded-xl p-4 resize-y focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{htmlContent.length.toLocaleString()} characters</p>
                    <div className="bg-violet-50 text-violet-700 text-xs px-3 py-1.5 rounded-lg">
                        Use the image URLs from the Images section wherever images are needed in your HTML.
                    </div>
                </div>

                <Button
                    disabled={!htmlContent.trim() || htmlUploading}
                    onClick={handlePublishHTML}
                    className="gap-2"
                >
                    <Upload className="w-4 h-4" />
                    {htmlUploading ? "Publishing…" : "Update Landing Page"}
                </Button>
            </div>
        </div>
    );
}
