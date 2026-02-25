import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PlatformStats from "@/components/superadmin/PlatformStats";
import ClubCard from "@/components/superadmin/ClubCard";
import { useAllClubs, useToggleMaintenancePaid } from "@/hooks/useSuperAdmin";

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { data: clubs, isLoading } = useAllClubs();
    const toggleMaintenance = useToggleMaintenancePaid();

    const maintenanceDueClubs = clubs?.filter((c) => !c.maintenancePaid) || [];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage all clubs from one place
                    </p>
                </div>
                <Button onClick={() => navigate("/superadmin/clubs/new")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Club
                </Button>
            </div>

            {/* Stats */}
            <PlatformStats />

            {/* Maintenance Alerts */}
            {maintenanceDueClubs.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Clubs Requiring Attention
                    </h2>
                    <div className="space-y-2">
                        {maintenanceDueClubs.map((club) => (
                            <div
                                key={club.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-orange-200 bg-orange-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: club.primaryColor || "#F59E0B" }}
                                    >
                                        {club.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{club.name}</p>
                                        <p className="text-xs text-muted-foreground">{club.domain}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                    disabled={toggleMaintenance.isPending}
                                    onClick={() =>
                                        toggleMaintenance.mutate({
                                            clubId: club.id,
                                            currentPaid: club.maintenancePaid,
                                        })
                                    }
                                >
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    Mark Paid
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Clubs */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">All Clubs</h2>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-64 rounded-2xl" />
                        ))}
                    </div>
                ) : clubs && clubs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clubs.map((club) => (
                            <ClubCard key={club.id} club={club} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-gray-300 bg-white">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-50 flex items-center justify-center">
                            <Plus className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="font-semibold text-lg">No clubs yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                            Create your first club to get started
                        </p>
                        <Button onClick={() => navigate("/superadmin/clubs/new")}>
                            Create First Club
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
