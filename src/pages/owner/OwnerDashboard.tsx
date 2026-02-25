import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import DailyStatsBar from "@/components/owner/DailyStatsBar";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import {
    usePendingTopupRequests,
    useExpiringMembers,
    useLowStockProducts,
    useTodayAttendance,
    useRecentOrders,
} from "@/hooks/useOwner";

export default function OwnerDashboard() {
    const navigate = useNavigate();
    const { userProfile } = useAuth();
    const { club } = useClubContext();
    const { requests: pendingTopups } = usePendingTopupRequests();
    const { data: expiring, isLoading: expiringLoading } = useExpiringMembers();
    const { data: lowStock, isLoading: lowStockLoading } = useLowStockProducts();
    const { data: todayAttendance, isLoading: attendLoading } = useTodayAttendance();
    const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();

    const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black text-wellness-forest tracking-tight">
                    {greeting}, {userProfile?.name || "Owner"} 👋
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {club?.name} • {club?.currencyName}
                </p>
            </div>

            {/* Stats */}
            <DailyStatsBar />

            {/* Pending Topups Alert */}
            {pendingTopups.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">{pendingTopups.length} members waiting for wallet topup</p>
                            <p className="text-xs text-amber-600">Review and approve pending requests</p>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-amber-300 text-amber-700" onClick={() => navigate("/owner/wallet-approvals")}>
                        Review Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Expiring Memberships */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" /> Membership Expiring Soon
                    </h3>
                    {expiringLoading ? (
                        <Skeleton className="h-20" />
                    ) : expiring && expiring.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {expiring.map((m) => {
                                const daysLeft = Math.ceil((m.membershipEnd!.toDate().getTime() - Date.now()) / 86400000);
                                return (
                                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{m.name}</span>
                                            <Badge variant="outline" className="text-xs">{m.membershipTier}</Badge>
                                        </div>
                                        <span className="text-xs text-orange-600 font-semibold">{daysLeft}d left</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No expiring memberships</p>
                    )}
                </div>

                {/* Low Stock */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="text-sm font-bold flex items-center gap-2">
                        <Package className="w-4 h-4 text-red-500" /> Low Stock Alert
                    </h3>
                    {lowStockLoading ? (
                        <Skeleton className="h-20" />
                    ) : lowStock && lowStock.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {lowStock.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50 text-sm">
                                    <span className="font-medium">{p.name}</span>
                                    <span className="text-xs text-red-600 font-semibold">{p.stock} / {p.lowStockThreshold}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">All stock levels healthy ✅</p>
                    )}
                </div>

                {/* Today's Attendance */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="text-sm font-bold">Today's Attendance</h3>
                    {attendLoading ? (
                        <Skeleton className="h-20" />
                    ) : todayAttendance && todayAttendance.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {todayAttendance.map((a) => (
                                <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 text-sm">
                                    <Avatar className="h-7 w-7">
                                        {a.userPhoto ? <AvatarImage src={a.userPhoto} /> : null}
                                        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">{a.userName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 font-medium truncate">{a.userName}</span>
                                    <span className="text-xs text-muted-foreground">{a.checkInTime?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No check-ins yet today</p>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border p-5 space-y-3">
                    <h3 className="text-sm font-bold">Recent Orders</h3>
                    {ordersLoading ? (
                        <Skeleton className="h-20" />
                    ) : recentOrders && recentOrders.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {recentOrders.map((o) => (
                                <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 text-sm">
                                    <div>
                                        <p className="font-medium">{o.memberName}</p>
                                        <p className="text-xs text-muted-foreground">{o.items.length} items</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{o.totalCost} {club?.currencyName}</p>
                                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground py-4 text-center">No orders yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
