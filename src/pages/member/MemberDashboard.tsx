import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
} from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Wallet, CalendarCheck, Flame, Scale, Megaphone, ChevronRight, HandHeart, X, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import { db } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyAttendance, computeAttendanceStats } from "@/hooks/member/useMemberAttendance";
import { useMyWallet } from "@/hooks/useMemberWallet";
import { useWeightLogs } from "@/hooks/useMemberFeatures";
import { useCreateVolunteerSession } from "@/hooks/useVolunteers";
import { useMyAnnouncements } from "@/hooks/member/useMemberAnnouncements";
import { useToast } from "@/hooks/use-toast";
import type { User, Attendance, Announcement, Order } from "@/types/firestore";
import { getNextWeighIn } from "@/utils/getNextWeighIn";

const GREEN = "#2d9653";
const BG = "#f8fffe";

function getGreeting(): { text: string; emoji: string } {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { text: "Good morning", emoji: "☀️" };
    if (hour >= 12 && hour < 17) return { text: "Good afternoon", emoji: "👋" };
    if (hour >= 17 && hour < 21) return { text: "Good evening", emoji: "🌙" };
    return { text: "Good night", emoji: "✨" };
}

function getFirstName(name: string): string {
    return name?.trim().split(/\s+/)[0] || "Member";
}

function formatMembershipEnd(me: User["membershipEnd"]): string {
    if (!me) return "—";
    const m = me as { toDate?: () => Date; seconds?: number };
    const d = m.toDate ? m.toDate() : "seconds" in m ? new Date((m as any).seconds * 1000) : null;
    return d ? format(d, "MMM d, yyyy") : "—";
}

function getMembershipStatus(user: User): {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
} {
    if (!user.membershipEnd) {
        return { label: "Active", variant: "default", className: "bg-green-600 text-white border-green-700" };
    }
    const me = user.membershipEnd as { toDate?: () => Date; seconds?: number } | null;
    const end = me?.toDate ? me.toDate() : me && "seconds" in me ? new Date((me as any).seconds * 1000) : new Date(0);
    const now = new Date();
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return { label: "Expired", variant: "destructive", className: "bg-red-600 text-white border-red-700" };
    if (daysLeft <= 30) return { label: "Expiring Soon", variant: "secondary", className: "bg-amber-500 text-white border-amber-600" };
    return { label: "Active", variant: "default", className: "bg-green-600 text-white border-green-700" };
}

function StatCardSkeleton() {
    return (
        <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

export default function MemberDashboard() {
    const { userProfile } = useAuth();
    const { club } = useClubContext();
    const { text: greetingText, emoji } = getGreeting();
    const firstName = userProfile ? getFirstName(userProfile.name) : "";
    // Use actual memberId field if present, otherwise fall back to derived ID display
    const memberIdDisplay = (userProfile as any)?.memberId
        ? String((userProfile as any).memberId)
        : userProfile ? `MNC-${userProfile.id.substring(0, 6).toUpperCase()}` : "";
    const { toast } = useToast();
    const [showVolunteerModal, setShowVolunteerModal] = useState(false);
    const createVolunteerSession = useCreateVolunteerSession();

    const handleVolunteerScan = useCallback(async (qrContent: string) => {
        if (!userProfile || !club) return;
        try {
            const parsed = JSON.parse(qrContent);
            if (parsed.type === "volunteer-login" && parsed.clubId === club.id) {
                await createVolunteerSession.mutateAsync({
                    memberId: userProfile.id,
                    memberName: userProfile.name,
                    memberPhoto: userProfile.photo ?? "",
                    clubId: club.id,
                });
                toast({ title: "✅ Volunteer session started! Thank you for helping out." });
                setShowVolunteerModal(false);
            } else {
                toast({ title: "Invalid QR code", variant: "destructive" });
            }
        } catch {
            toast({ title: "Invalid QR code", variant: "destructive" });
        }
    }, [userProfile, club, createVolunteerSession, toast]);

    // Wallet - real-time via onSnapshot
    const { wallet: walletData, loading: walletLoading } = useMyWallet();

    // Attendance - for this month count and streak
    const { data: attendanceList = [], isLoading: attendanceLoading } = useMyAttendance(
        userProfile?.id ?? null,
        club?.id ?? null
    );
    const attendanceStats = useMemo(
        () => (attendanceList.length > 0 ? computeAttendanceStats(attendanceList) : { thisMonthCount: 0, streak: 0 }),
        [attendanceList]
    );

    // Weight logs
    const { data: weightLogs = [], isLoading: weightLoading } = useWeightLogs();
    const weightProgress = useMemo(() => {
        if (!weightLogs || weightLogs.length === 0) return null;
        const sorted = [...weightLogs].sort(
            (a, b) => (a.date?.toDate?.()?.getTime() ?? 0) - (b.date?.toDate?.()?.getTime() ?? 0)
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const firstWeight = first?.weight ?? 0;
        const lastWeight = last?.weight ?? 0;
        const diff = lastWeight - firstWeight;
        return { first: firstWeight, last: lastWeight, diff };
    }, [weightLogs]);

    // Announcements (latest 2 using centralized hook)
    const { announcements: allAnnouncements, loading: announcementsLoading } = useMyAnnouncements(
        club?.id ?? null,
        userProfile?.id ?? null,
        userProfile?.memberType,
        userProfile?.membershipTier
    );
    const announcements = useMemo(() => allAnnouncements?.slice(0, 2) || [], [allAnnouncements]);

    // Recent orders (last 3)
    const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
        queryKey: ["member-dashboard-orders", userProfile?.id],
        enabled: !!userProfile?.id,
        queryFn: async () => {
            const q = query(
                collection(db, "orders"),
                where("memberId", "==", userProfile!.id),
                orderBy("createdAt", "desc"),
                limit(3)
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
        },
    });

    const membershipStatus = userProfile ? getMembershipStatus(userProfile) : null;
    const nextWeighIn = useMemo(() => {
        if (!club || !(club as any).weighInDays) return null;
        return getNextWeighIn((club as any).weighInDays);
    }, [club]);

    if (!userProfile) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center" style={{ background: BG }}>
                <Skeleton className="h-12 w-48" />
            </div>
        );
    }

    return (
        <>
            <div
                className="min-h-screen pb-24 px-4 pt-6 font-[Nunito,sans-serif]"
                style={{ background: BG }}
            >

                <div className="max-w-lg mx-auto space-y-6">
                    {/* Greeting */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {greetingText}, {firstName} {emoji}
                        </h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                                {memberIdDisplay}
                            </Badge>
                            {membershipStatus && (
                                <Badge
                                    variant={membershipStatus.variant}
                                    className={membershipStatus.className}
                                >
                                    {membershipStatus.label}
                                </Badge>
                            )}
                            {membershipStatus && membershipStatus.label !== "Active" && (
                                <Link to="/member/profile">
                                    <Badge className="gap-1 cursor-pointer bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200">
                                        <RefreshCw className="w-3 h-3" /> Renew
                                    </Badge>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Volunteer Button */}
                    <button
                        onClick={() => setShowVolunteerModal(true)}
                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed text-left hover:bg-green-50 transition-colors"
                        style={{ borderColor: "#2d9653" }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#2d9653" }}>
                                <HandHeart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">🙋 Volunteer Today</p>
                                <p className="text-xs text-gray-500">Scan the reception QR to log your session</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>

                    {/* Next Weigh-in Card */}
                    {nextWeighIn && (
                        <div
                            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-colors relative overflow-hidden"
                            style={{
                                borderColor: nextWeighIn.daysUntil === 0 ? "#2d9653" : nextWeighIn.daysUntil === 1 ? "#f59e0b" : "#e5e7eb",
                                backgroundColor: nextWeighIn.daysUntil === 0 ? "#ecfdf5" : nextWeighIn.daysUntil === 1 ? "#fffbeb" : "#f9fafb"
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                    style={{
                                        backgroundColor: nextWeighIn.daysUntil === 0 ? "#2d9653" : nextWeighIn.daysUntil === 1 ? "#f59e0b" : "#9ca3af"
                                    }}
                                >
                                    <Scale className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-bold" style={{ color: nextWeighIn.daysUntil === 0 ? "#065f46" : nextWeighIn.daysUntil === 1 ? "#92400e" : "#374151" }}>
                                        {nextWeighIn.daysUntil === 0 ? "⚖️ Weigh-in is Today!" :
                                            nextWeighIn.daysUntil === 1 ? "⚖️ Weigh-in is Tomorrow!" :
                                                "⚖️ Next Weigh-in"}
                                    </p>
                                    <p className="text-xs" style={{ color: nextWeighIn.daysUntil === 0 ? "#047857" : nextWeighIn.daysUntil === 1 ? "#b45309" : "#6b7280" }}>
                                        {nextWeighIn.dayName}, {format(nextWeighIn.date, "MMM d")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4 Stat Cards */}

                    <div className="grid grid-cols-2 gap-3">
                        {/* Wallet */}
                        <Link to="/member/wallet" className="block">
                            {walletLoading ? (
                                <StatCardSkeleton />
                            ) : (
                                <div
                                    className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                    style={{ borderColor: `${GREEN}20` }}
                                >
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Wallet className="w-4 h-4" style={{ color: GREEN }} />
                                        <span className="text-sm font-medium">Wallet</span>
                                    </div>
                                    <p className="text-xl font-bold" style={{ color: GREEN }}>
                                        {walletData?.balance?.toLocaleString() ?? 0}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {club?.currencyName ?? "Coins"}
                                    </p>
                                </div>
                            )}
                        </Link>

                        {/* Attendance */}
                        <Link to="/member/checkin" className="block">
                            {attendanceLoading ? (
                                <StatCardSkeleton />
                            ) : (
                                <div
                                    className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                    style={{ borderColor: `${GREEN}20` }}
                                >
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <CalendarCheck className="w-4 h-4" style={{ color: GREEN }} />
                                        <span className="text-sm font-medium">This Month</span>
                                    </div>
                                    <p className="text-xl font-bold" style={{ color: GREEN }}>
                                        {attendanceStats.thisMonthCount}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">Check-ins</p>
                                </div>
                            )}
                        </Link>

                        {/* Streak */}
                        <Link to="/member/checkin" className="block">
                            {attendanceLoading ? (
                                <StatCardSkeleton />
                            ) : (
                                <div
                                    className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                    style={{ borderColor: `${GREEN}20` }}
                                >
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Flame className="w-4 h-4" style={{ color: GREEN }} />
                                        <span className="text-sm font-medium">Streak</span>
                                    </div>
                                    <p className="text-xl font-bold" style={{ color: GREEN }}>
                                        {attendanceStats.streak}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">Days</p>
                                </div>
                            )}
                        </Link>

                        {/* Weight */}
                        <Link to="/member/progress" className="block">
                            {weightLoading ? (
                                <StatCardSkeleton />
                            ) : (
                                <div
                                    className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                    style={{ borderColor: `${GREEN}20` }}
                                >
                                    <div className="flex items-center gap-2 text-slate-600 mb-1">
                                        <Scale className="w-4 h-4" style={{ color: GREEN }} />
                                        <span className="text-sm font-medium">Weight</span>
                                    </div>
                                    {weightProgress ? (
                                        <>
                                            <p className="text-xl font-bold" style={{ color: GREEN }}>
                                                {weightProgress.diff >= 0 ? "+" : ""}
                                                {weightProgress.diff.toFixed(1)} kg
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">vs start</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-slate-500">Start tracking</p>
                                            <p className="text-xs text-slate-400 mt-0.5">Tap to add</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </Link>
                    </div>

                    {/* Recent Announcements */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <Megaphone className="w-5 h-5" style={{ color: GREEN }} />
                                Announcements
                            </h2>
                            <Link
                                to="/member/announcements"
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: GREEN }}
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {announcementsLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-20 rounded-xl" />
                                <Skeleton className="h-20 rounded-xl" />
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="rounded-xl border border-green-100 bg-white p-6 text-center text-slate-500 text-sm">
                                No announcements
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {announcements.map((a) => {
                                    const isNew =
                                        a.createdAt?.toDate?.() &&
                                        (Date.now() - a.createdAt.toDate().getTime()) / (1000 * 60 * 60 * 24) < 7;
                                    return (
                                        <div
                                            key={a.id}
                                            className="rounded-xl border border-green-100 bg-white p-4 shadow-sm"
                                            style={{ borderColor: `${GREEN}20` }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{a.title}</h3>
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                                                        {a.message}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        {a.createdAt?.toDate?.()
                                                            ? format(a.createdAt.toDate(), "MMM d, yyyy")
                                                            : ""}
                                                    </p>
                                                </div>
                                                {isNew && (
                                                    <Badge
                                                        className="shrink-0"
                                                        style={{ backgroundColor: GREEN, color: "white" }}
                                                    >
                                                        New
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* Recent Orders */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-800">Recent Orders</h2>
                            <Link
                                to="/member/orders"
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: GREEN }}
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        {ordersLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                                <Skeleton className="h-16 rounded-xl" />
                            </div>
                        ) : recentOrders.length === 0 ? (
                            <div className="rounded-xl border border-green-100 bg-white p-6 text-center text-slate-500 text-sm">
                                No orders yet
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentOrders.map((o) => (
                                    <Link
                                        key={o.id}
                                        to="/member/orders"
                                        className="block rounded-xl border border-green-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                                        style={{ borderColor: `${GREEN}20` }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-slate-800">
                                                    {o.items?.length ?? 0} item(s)
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {o.date} • {o.status}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold" style={{ color: GREEN }}>
                                                    {o.totalCost?.toLocaleString() ?? 0}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {club?.currencyName ?? "Coins"}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Membership Card */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-800">Membership Card</h2>
                            <Link
                                to="/member/card"
                                className="text-sm font-medium flex items-center gap-1"
                                style={{ color: GREEN }}
                            >
                                Full Card <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <Link to="/member/card" className="block">
                            <div
                                className="rounded-2xl overflow-hidden shadow-lg border border-green-200"
                                style={{
                                    background: `linear-gradient(135deg, ${GREEN} 0%, #1e6b3a 100%)`,
                                    minHeight: 140,
                                }}
                            >
                                <div className="p-5 text-white flex flex-col h-full">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs font-medium opacity-90 uppercase tracking-wider">
                                                {club?.name ?? "Club"}
                                            </p>
                                            <h3 className="text-lg font-bold mt-1">{userProfile.name}</h3>
                                            <p className="font-mono text-sm opacity-90 mt-0.5">
                                                {memberIdDisplay}
                                            </p>
                                        </div>
                                        <div className="bg-white p-1.5 rounded-lg">
                                            <QRCodeSVG value={userProfile.id} size={56} />
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-4 flex justify-between items-end">
                                        <span className="text-xs opacity-90">Expires</span>
                                        <span className="font-semibold">
                                            {formatMembershipEnd(userProfile.membershipEnd)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </section>
                </div>
            </div>

            {/* Volunteer Scan Modal */}
            {
                showVolunteerModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4"
                            style={{ fontFamily: "Nunito, sans-serif" }}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-black text-gray-800">🙋 Volunteer Login</h2>
                                <button onClick={() => setShowVolunteerModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                                <p className="font-bold text-green-800 text-sm">How to volunteer:</p>
                                <ol className="text-sm text-green-700 space-y-1 list-decimal list-inside">
                                    <li>Go to the reception display screen</li>
                                    <li>Tap "🙋 Volunteer Login/Logout"</li>
                                    <li>Switch to the Login tab</li>
                                    <li>Scan the QR code shown on the screen</li>
                                </ol>
                            </div>
                            <p className="text-xs text-gray-400 text-center">
                                You'll appear as active in today's volunteer log
                            </p>
                            <Button
                                variant="outline"
                                className="w-full rounded-xl"
                                onClick={() => setShowVolunteerModal(false)}
                            >
                                Got it
                            </Button>
                        </div>
                    </div>
                )}
        </>
    );
}
