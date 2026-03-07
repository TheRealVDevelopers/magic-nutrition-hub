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
import { useDrasticChanges } from "@/hooks/owner/useWeighIns";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "Good morning";
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
    const { data: drasticChanges } = useDrasticChanges(club?.id || null);

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
                <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm animate-pulse-fade">
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
                        className="border-amber-300 text-amber-700 flex-shrink-0 bg-white"
                        onClick={() => navigate("/owner/wallet-approvals")}
                    >
                        Review Now <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                </div>
            )}

            {/* Drastic Change Alerts */}
            {drasticChanges && drasticChanges.length > 0 && (
                <div className="flex flex-col gap-2">
                    {drasticChanges.map((alert, i) => (
                        <div key={`${alert.memberId}-${i}`} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${alert.type === 'gained' ? 'bg-orange-50 border-orange-200' : 'bg-rose-50 border-rose-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold shadow-sm ${alert.type === 'gained' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
                                    !
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${alert.type === 'gained' ? 'text-orange-900' : 'text-rose-900'}`}>
                                        {alert.memberName} {alert.type === 'gained' ? 'gained weight rapidly' : 'lost weight too fast'}
                                    </p>
                                    <p className={`text-xs ${alert.type === 'gained' ? 'text-orange-700' : 'text-rose-700'}`}>
                                        Weight changed by {Math.abs(alert.change)} kg in the last 7 days.
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className={`flex-shrink-0 bg-white ${alert.type === 'gained' ? 'border-orange-300 text-orange-700' : 'border-rose-300 text-rose-700'}`}
                                onClick={() => navigate(`/owner/members/${alert.memberId}`)}
                            >
                                View Profile
                            </Button>
                        </div>
                    ))}
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

                {/* Active Announcements */}
                <ActiveAnnouncementsWidget clubId={club?.id} />
            </div>
        </div>
    );
}

// Widget to fetch and display active announcements
import { useAnnouncements } from "@/hooks/owner/useAnnouncements";
import { Megaphone } from "lucide-react";

function ActiveAnnouncementsWidget({ clubId }: { clubId?: string }) {
    const { announcements, loading } = useAnnouncements(clubId ?? null);

    const recent = announcements?.slice(0, 5) || [];

    return (
        <div className="bg-white rounded-2xl border p-5 space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-600" /> Recent Announcements
            </h3>
            {loading ? (
                <Skeleton className="h-20" />
            ) : recent.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {recent.map((a) => (
                        <div key={a.id} className="flex flex-col p-2 rounded-lg bg-emerald-50/50 border border-emerald-100/50 text-sm gap-1">
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-gray-900 truncate">{a.title}</span>
                                <Badge variant="outline" className={`text-[10px] h-4 px-1 rounded-sm border-0 ${a.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                    a.priority === 'important' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                    {a.priority}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                                <span>{a.readBy?.length || 0} reads</span>
                                <span>{a.createdAt?.toDate?.()?.toLocaleDateString?.([], { month: 'short', day: 'numeric' }) ?? ""}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-400 py-4 text-center font-medium">No active announcements</p>
            )}
        </div>
    );
}
