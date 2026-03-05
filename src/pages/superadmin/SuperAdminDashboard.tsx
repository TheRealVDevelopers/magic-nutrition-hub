import { useNavigate } from "react-router-dom";
import {
    Plus,
    Building2,
    Users,
    TrendingUp,
    MessageSquare,
    AlertTriangle,
    Clock,
    ChevronRight,
    Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllClubs, usePlatformStats } from "@/hooks/useSuperAdmin";
import { useUnreadClubFeedbackCount } from "@/hooks/superadmin/useEnquiries";
import { usePaymentStatus } from "@/hooks/superadmin/useClubPayments";
import type { Club } from "@/types/firestore";

// ─── Payment status badge helper ────────────────────────────────────────

function PaymentStatusBadge({ club }: { club: Club }) {
    const status = usePaymentStatus(club);
    if (status === "paid") {
        return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">Paid</Badge>;
    }
    if (status === "due-soon") {
        return <Badge className="border-yellow-200 bg-yellow-50 text-yellow-700 text-xs">Due Soon</Badge>;
    }
    return <Badge className="border-red-200 bg-red-50 text-red-700 text-xs">Overdue</Badge>;
}

// ─── Stat card ───────────────────────────────────────────────────────────

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    badge?: number;
    onClick?: () => void;
}

function StatCard({ label, value, icon: Icon, color, badge, onClick }: StatCardProps) {
    return (
        <button
            onClick={onClick}
            className={`bg-white rounded-2xl border p-5 flex items-start gap-4 hover:shadow-md transition-shadow text-left w-full ${onClick ? "cursor-pointer" : "cursor-default"}`}
        >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </div>
            {badge !== undefined && badge > 0 && (
                <span className="flex-shrink-0 min-w-[22px] h-[22px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                    {badge > 99 ? "99+" : badge}
                </span>
            )}
        </button>
    );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const { data: clubs, isLoading: clubsLoading } = useAllClubs();
    const { data: stats, isLoading: statsLoading } = usePlatformStats();
    const { data: unreadFeedback = 0 } = useUnreadClubFeedbackCount();

    const isLoading = clubsLoading || statsLoading;

    // Payment-status derived lists
    const overdueClubs = clubs?.filter((c) => {
        const due = c.maintenanceDueDate?.toDate?.();
        return due && due < new Date();
    }) ?? [];

    const dueSoonClubs = clubs?.filter((c) => {
        const due = c.maintenanceDueDate?.toDate?.();
        if (!due) return false;
        const diffDays = (due.getTime() - Date.now()) / 86_400_000;
        return diffDays >= 0 && diffDays <= 7;
    }) ?? [];

    // Most active clubs by member count approximation (sort by treePath depth as proxy)
    const topClubs = [...(clubs ?? [])]
        .sort((a, b) => (b.treePath?.split("/").length ?? 0) - (a.treePath?.split("/").length ?? 0))
        .slice(0, 5);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Platform Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage all clubs and track performance</p>
                </div>
                <Button onClick={() => navigate("/superadmin/clubs/new")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Club
                </Button>
            </div>

            {/* Stat Cards */}
            {isLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Clubs"
                        value={stats?.totalClubs ?? 0}
                        icon={Building2}
                        color="bg-violet-500"
                        onClick={() => navigate("/superadmin/clubs")}
                    />
                    <StatCard
                        label="Total Members"
                        value={stats?.totalMembers ?? 0}
                        icon={Users}
                        color="bg-blue-500"
                    />
                    <StatCard
                        label="Active Clubs"
                        value={stats?.activeClubs ?? 0}
                        icon={TrendingUp}
                        color="bg-emerald-500"
                    />
                    <StatCard
                        label="New Feedback"
                        value={unreadFeedback}
                        icon={MessageSquare}
                        color="bg-orange-500"
                        badge={unreadFeedback}
                        onClick={() => navigate("/superadmin/enquiries")}
                    />
                </div>
            )}

            {/* Alerts */}
            {(overdueClubs.length > 0 || dueSoonClubs.length > 0) && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Payment Alerts
                    </h2>
                    <div className="space-y-2">
                        {overdueClubs.map((club) => (
                            <div
                                key={club.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-red-200 bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
                                onClick={() => navigate(`/superadmin/clubs/${club.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ backgroundColor: club.primaryColor || "#EF4444" }}
                                    >
                                        {club.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{club.name}</p>
                                        <p className="text-xs text-muted-foreground">{club.domain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="border-red-300 bg-red-100 text-red-700 text-xs">Overdue</Badge>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                        {dueSoonClubs.map((club) => (
                            <div
                                key={club.id}
                                className="flex items-center justify-between p-3 rounded-xl border border-yellow-200 bg-yellow-50 cursor-pointer hover:bg-yellow-100 transition-colors"
                                onClick={() => navigate(`/superadmin/clubs/${club.id}`)}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ backgroundColor: club.primaryColor || "#F59E0B" }}
                                    >
                                        {club.name[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{club.name}</p>
                                        <p className="text-xs text-muted-foreground">{club.domain}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="border-yellow-300 bg-yellow-100 text-yellow-700 text-xs">Due Soon</Badge>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Most Active Clubs */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Clubs Overview</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate("/superadmin/clubs")} className="text-xs gap-1">
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                    {clubsLoading ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                        </div>
                    ) : topClubs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No clubs yet</p>
                    ) : (
                        <div className="space-y-2">
                            {topClubs.map((club) => (
                                <div
                                    key={club.id}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => navigate(`/superadmin/clubs/${club.id}`)}
                                >
                                    <div
                                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                        style={{ backgroundColor: club.primaryColor || "#8B5CF6" }}
                                    >
                                        {club.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{club.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{club.domain}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <PaymentStatusBadge club={club} />
                                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Platform Usage Summary */}
                <div className="bg-white rounded-2xl border p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-violet-500" />
                        <h2 className="font-semibold">Platform Summary</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-muted-foreground">Total Clubs</span>
                            <span className="text-sm font-semibold">{stats?.totalClubs ?? "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-muted-foreground">Active Clubs</span>
                            <span className="text-sm font-semibold text-emerald-600">{stats?.activeClubs ?? "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-muted-foreground">Disabled Clubs</span>
                            <span className="text-sm font-semibold text-red-500">{stats?.disabledClubs ?? "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-muted-foreground">Total Members</span>
                            <span className="text-sm font-semibold">{stats?.totalMembers ?? "—"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                            <span className="text-sm text-muted-foreground">Overdue Payments</span>
                            <span className="text-sm font-semibold text-red-500">{overdueClubs.length}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">New Feedback</span>
                            <span className="text-sm font-semibold text-orange-500">{unreadFeedback}</span>
                        </div>
                    </div>
                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Per-club Firebase costs available in Club Details → Firebase Usage tab
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
