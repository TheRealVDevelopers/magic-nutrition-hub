import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import DailyStatsBar from "@/components/owner/DailyStatsBar";
import { useClubContext } from "@/lib/clubDetection";
import {
    usePendingTopupRequests,
    useExpiringMembers,
    useLowStockProducts,
    useTodayAttendance,
    useRecentOrders,
} from "@/hooks/useOwner";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return "Good morning";
    if (h >= 12 && h < 17) return "Good afternoon";
    if (h >= 17 && h < 21) return "Good evening";
    return "Good night";
}

export default function OwnerDashboard() {
    const navigate = useNavigate();
    const { club } = useClubContext();
    const { requests: pendingTopups } = usePendingTopupRequests();
    const { data: expiring, isLoading: expiringLoading } = useExpiringMembers();
    const { data: lowStock, isLoading: lowStockLoading } = useLowStockProducts();
    const { data: todayAttendance, isLoading: attendLoading } = useTodayAttendance();
    const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();

    const greeting = getGreeting();
    const clubName = club?.name ?? "Club";

    return (
        <div className="px-6 md:px-8 py-8 space-y-8 pb-12 max-w-[1200px] mx-auto"
            style={{ fontFamily: "'Nunito', sans-serif" }}>

            {/* Welcome header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight"
                    style={{ color: "#1a2e1a" }}>
                    {greeting}, {clubName} 👋
                </h1>
                <p className="text-sm text-gray-500 mt-1 font-semibold">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {/* Stats grid — 4 col desktop, 2 tablet, 1 mobile */}
            <DailyStatsBar />

            {/* Pending Topups Alert */}
            {pendingTopups.length > 0 && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-amber-800">
                                {pendingTopups.length} member{pendingTopups.length > 1 ? "s" : ""} waiting for wallet topup
                            </p>
                            <p className="text-xs text-amber-600">Review and approve pending requests</p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-700 flex-shrink-0"
                        onClick={() => navigate("/wallet")}
                    >
                        Review Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Info grid — 2 col */}
            <div className="grid sm:grid-cols-2 gap-6">
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
                                const daysLeft = Math.ceil(
                                    (m.membershipEnd!.toDate().getTime() - Date.now()) / 86400000
                                );
                                return (
                                    <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 text-sm">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-semibold truncate">{m.name}</span>
                                            <Badge variant="outline" className="text-xs flex-shrink-0">{m.membershipTier}</Badge>
                                        </div>
                                        <span className="text-xs text-orange-600 font-bold flex-shrink-0 ml-2">{daysLeft}d left</span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-4 text-center font-medium">No expiring memberships ✅</p>
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
                                    <span className="font-semibold truncate">{p.name}</span>
                                    <span className="text-xs text-red-600 font-bold flex-shrink-0 ml-2">
                                        {p.stock} / {p.lowStockThreshold}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-4 text-center font-medium">All stock levels healthy ✅</p>
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
                                    <Avatar className="h-7 w-7 flex-shrink-0">
                                        {a.userPhoto ? <AvatarImage src={a.userPhoto} /> : null}
                                        <AvatarFallback className="text-[10px] bg-violet-100 text-violet-700">
                                            {a.userName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 font-semibold truncate">{a.userName}</span>
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                        {a.checkInTime?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-4 text-center font-medium">No check-ins yet today</p>
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
                                    <div className="min-w-0">
                                        <p className="font-semibold truncate">{o.memberName}</p>
                                        <p className="text-xs text-gray-400">{o.items.length} item{o.items.length > 1 ? "s" : ""}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <p className="font-bold">₹{o.totalCost}</p>
                                        <Badge variant="outline" className="text-xs">{o.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 py-4 text-center font-medium">No orders yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}
