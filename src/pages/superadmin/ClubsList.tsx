import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Settings, Power, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MaintenanceBadge from "@/components/superadmin/MaintenanceBadge";
import {
    useAllClubs,
    useToggleClubStatus,
    useToggleMaintenancePaid,
} from "@/hooks/useSuperAdmin";

type FilterTab = "all" | "active" | "disabled" | "maintenance";

export default function ClubsList() {
    const navigate = useNavigate();
    const { data: clubs, isLoading } = useAllClubs();
    const toggleStatus = useToggleClubStatus();
    const toggleMaintenance = useToggleMaintenancePaid();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<FilterTab>("all");

    const filtered = useMemo(() => {
        if (!clubs) return [];
        let list = clubs;

        // Filter tab
        if (filter === "active") list = list.filter((c) => c.status === "active");
        else if (filter === "disabled") list = list.filter((c) => c.status === "disabled");
        else if (filter === "maintenance") list = list.filter((c) => !c.maintenancePaid);

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.domain.toLowerCase().includes(q) ||
                    c.ownerName.toLowerCase().includes(q)
            );
        }

        // Sort newest first
        return list.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
        });
    }, [clubs, search, filter]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">All Clubs</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {clubs?.length || 0} clubs on the platform
                    </p>
                </div>
                <Button onClick={() => navigate("/superadmin/clubs/new")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Club
                </Button>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, domain, or owner…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="disabled">Disabled</TabsTrigger>
                        <TabsTrigger value="maintenance">Maint. Due</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">No clubs match your search.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((club) => {
                        const initials = club.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                        return (
                            <div
                                key={club.id}
                                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-white hover:shadow-md transition-shadow"
                            >
                                <Avatar className="h-10 w-10 rounded-xl flex-shrink-0">
                                    {club.logo ? <AvatarImage src={club.logo} /> : null}
                                    <AvatarFallback
                                        className="rounded-xl text-white text-xs font-bold"
                                        style={{ backgroundColor: club.primaryColor || "#8B5CF6" }}
                                    >
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-4 items-center">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{club.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{club.domain}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                                        {club.ownerName}
                                    </p>
                                    <div className="hidden sm:block">
                                        <Badge
                                            variant={club.status === "active" ? "outline" : "destructive"}
                                            className={
                                                club.status === "active"
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-xs"
                                                    : "text-xs"
                                            }
                                        >
                                            {club.status === "active" ? "Active" : "Disabled"}
                                        </Badge>
                                    </div>
                                    <div className="hidden sm:block">
                                        <MaintenanceBadge
                                            maintenancePaid={club.maintenancePaid}
                                            maintenanceDueDate={club.maintenanceDueDate}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        title="Manage"
                                        onClick={() => navigate(`/superadmin/clubs/${club.id}`)}
                                    >
                                        <Settings className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-8 w-8 ${club.status === "active"
                                                ? "text-red-500 hover:text-red-600"
                                                : "text-emerald-500 hover:text-emerald-600"
                                            }`}
                                        title={club.status === "active" ? "Disable" : "Enable"}
                                        disabled={toggleStatus.isPending}
                                        onClick={() =>
                                            toggleStatus.mutate({ clubId: club.id, currentStatus: club.status })
                                        }
                                    >
                                        {club.status === "active" ? (
                                            <XCircle className="w-4 h-4" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        title={club.maintenancePaid ? "Mark Unpaid" : "Mark Paid"}
                                        disabled={toggleMaintenance.isPending}
                                        onClick={() =>
                                            toggleMaintenance.mutate({
                                                clubId: club.id,
                                                currentPaid: club.maintenancePaid,
                                            })
                                        }
                                    >
                                        <Power className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
