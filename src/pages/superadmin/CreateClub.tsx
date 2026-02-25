import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ClubForm, { type ClubFormValues } from "@/components/superadmin/ClubForm";
import { useCreateClub } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/lib/auth";

export default function CreateClub() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const createClub = useCreateClub();
    const { firebaseUser } = useAuth();

    const handleSubmit = async (data: ClubFormValues) => {
        try {
            const newClubId = await createClub.mutateAsync({
                club: {
                    name: data.name,
                    currencyName: data.currencyName,
                    domain: data.domain,
                    parentClubId: data.parentClubId || null,
                    treePath: "", // set by hook
                    theme: data.theme,
                    primaryColor: data.primaryColor,
                    logo: "",
                    heroImage: "",
                    tagline: data.tagline || "",
                    ownerName: data.ownerName,
                    ownerPhone: data.ownerPhone,
                    ownerUserId: "",
                    kitchenPin: data.kitchenPin,
                },
                ownerEmail: data.ownerEmail || "",
                createdBy: firebaseUser?.uid || "superadmin",
            });

            toast({
                title: "Club created!",
                description: `${data.name} is now live.`,
            });

            navigate(`/superadmin/clubs/${newClubId}`);
        } catch (err: any) {
            toast({
                title: "Error creating club",
                description: err.message || "Something went wrong.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/superadmin/clubs")}
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Club</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Set up a new club on the platform
                    </p>
                </div>
            </div>

            <div className="max-w-2xl bg-white rounded-2xl border p-6">
                <ClubForm
                    mode="create"
                    onSubmit={handleSubmit}
                    isLoading={createClub.isPending}
                />
            </div>
        </div>
    );
}
