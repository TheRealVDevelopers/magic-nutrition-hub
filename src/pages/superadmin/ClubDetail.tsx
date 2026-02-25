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
                    theme: data.theme,
                    primaryColor: data.primaryColor,
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

                {/* Tab 2: Edit */}
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
                                theme: club.theme,
                                primaryColor: club.primaryColor,
                            }}
                            onSubmit={handleEdit}
                            isLoading={updateClub.isPending}
                        />
                    </div>
                </TabsContent>

                {/* Tab 3: Danger Zone */}
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
