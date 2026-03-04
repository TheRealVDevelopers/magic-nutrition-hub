import { useState, useRef, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
    CalendarCheck,
    List,
    Download,
    ChevronLeft,
    ChevronRight,
    Scale,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Attendance } from "@/types/firestore";
import { getNextWeighIn } from "@/utils/getNextWeighIn";
import {
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    format,
    isSameMonth,
    isSameDay,
    parseISO,
} from "date-fns";

const GREEN = "#2d9653";
const BG = "#f8fffe";

function computeStreak(records: Attendance[]): number {
    const dates = [...new Set(records.map((r) => r.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = new Date(today);

    // If today has no attendance, start from yesterday
    if (!dates.includes(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    for (const d of dates) {
        const expected = checkDate.toISOString().split("T")[0];
        if (d === expected) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (d < expected) {
            break;
        }
    }
    return streak;
}

function downloadQRAsPNG(svgRef: React.RefObject<SVGSVGElement | null>) {
    const svg = svgRef.current;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 180;
    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "member-qr-code.png";
        a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function getMethodBadge(method: "qr" | "manual" | "mobile") {
    const labels = { qr: "QR", manual: "Manual", mobile: "Mobile" };
    return labels[method];
}

export default function MemberAttendancePage() {
    const { userProfile } = useAuth();
    const { club } = useClubContext();
    const qrRef = useRef<SVGSVGElement>(null);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
    const [displayMonth, setDisplayMonth] = useState(() => new Date());

    const { data: attendance = [], isLoading } = useQuery({
        queryKey: ["member-attendance", userProfile?.id, club?.id],
        enabled: !!userProfile?.id && !!club?.id,
        queryFn: async () => {
            const q = query(
                collection(db, "attendance"),
                where("userId", "==", userProfile!.id),
                where("clubId", "==", club!.id),
                orderBy("date", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Attendance));
        },
    });

    const attendanceByDate = new Set(attendance.map((a) => a.date));
    const now = new Date();
    const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonthCount = attendance.filter((r) => r.date.startsWith(thisMonthStr)).length;
    const streak = computeStreak(attendance);
    const allTimeCount = attendance.length;

    const monthStart = startOfMonth(displayMonth);
    const monthEnd = endOfMonth(displayMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = monthStart.getDay();
    const paddingDays = Array(firstDayOfWeek).fill(null);
    const today = new Date();

    if (!userProfile || !club) {
        return (
            <div className="min-h-screen p-4" style={{ backgroundColor: BG }}>
                <div className="max-w-lg mx-auto text-center py-12">
                    <p className="text-muted-foreground">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const nextWeighIn = (club as any)?.weighInDays ? getNextWeighIn((club as any).weighInDays) : null;

    return (
        <div
            className="min-h-screen p-4 pb-20"
            style={{ backgroundColor: BG, fontFamily: "Nunito, sans-serif" }}
        >
            <div className="max-w-lg mx-auto space-y-6">

                {/* Banner - Next Weigh-in */}
                {nextWeighIn && (
                    <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <Scale className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-semibold">Next Weigh-in:</span>
                        </div>
                        <span className="text-sm font-bold">
                            {nextWeighIn.daysUntil === 0 ? "Today" : nextWeighIn.daysUntil === 1 ? "Tomorrow" : `${nextWeighIn.dayName}, ${format(nextWeighIn.date, "MMM d")}`}
                        </span>
                    </div>
                )}

                {/* Section 1 - QR Code */}
                <div className="flex flex-col items-center pt-2">
                    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                        <QRCodeSVG
                            ref={qrRef}
                            value={userProfile.id}
                            size={180}
                            level="M"
                            includeMargin={false}
                            bgColor="#ffffff"
                            fgColor={GREEN}
                        />
                    </div>
                    <p className="mt-4 text-sm text-muted-foreground text-center max-w-[240px]">
                        Show this to scan in at the club
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 gap-2 rounded-full border-2"
                        style={{ borderColor: GREEN, color: GREEN }}
                        onClick={() => downloadQRAsPNG(qrRef)}
                    >
                        <Download className="w-4 h-4" />
                        Download QR
                    </Button>
                </div>

                {/* Section 2 - Stats Row */}
                <div className="grid grid-cols-3 gap-3">
                    <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                This Month
                            </CardDescription>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <CardTitle className="text-xl font-bold" style={{ color: GREEN }}>
                                    {thisMonthCount} days
                                </CardTitle>
                            )}
                        </CardHeader>
                    </Card>
                    <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                Current Streak
                            </CardDescription>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <CardTitle className="text-xl font-bold flex items-center gap-1" style={{ color: GREEN }}>
                                    {streak} days 🔥
                                </CardTitle>
                            )}
                        </CardHeader>
                    </Card>
                    <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                        <CardHeader className="pb-1 pt-4 px-4">
                            <CardDescription className="text-xs font-medium text-muted-foreground">
                                All Time
                            </CardDescription>
                            {isLoading ? (
                                <Skeleton className="h-8 w-12 mt-1" />
                            ) : (
                                <CardTitle className="text-xl font-bold" style={{ color: GREEN }}>
                                    {allTimeCount} days
                                </CardTitle>
                            )}
                        </CardHeader>
                    </Card>
                </div>

                {/* Section 3 & 4 - Calendar / List with Toggle */}
                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Attendance</CardTitle>
                            <div className="flex gap-1">
                                <Button
                                    variant={viewMode === "calendar" ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-full h-8"
                                    style={
                                        viewMode === "calendar"
                                            ? { backgroundColor: GREEN }
                                            : undefined
                                    }
                                    onClick={() => setViewMode("calendar")}
                                >
                                    <CalendarCheck className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    className="rounded-full h-8"
                                    style={
                                        viewMode === "list"
                                            ? { backgroundColor: GREEN }
                                            : undefined
                                    }
                                    onClick={() => setViewMode("list")}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {viewMode === "calendar" ? (
                            <>
                                {/* Month navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-9 w-9"
                                        onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                    <span className="font-semibold text-base">
                                        {format(displayMonth, "MMMM yyyy")}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-9 w-9"
                                        onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </div>

                                {/* Day headers */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                                        (d) => (
                                            <div
                                                key={d}
                                                className="text-center text-xs font-medium text-muted-foreground py-1"
                                            >
                                                {d}
                                            </div>
                                        )
                                    )}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {paddingDays.map((_, i) => (
                                        <div key={`pad-${i}`} className="aspect-square" />
                                    ))}
                                    {days.map((day) => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const hasAttendance = attendanceByDate.has(dateStr);
                                        const isToday = isSameDay(day, today);
                                        const isCurrentMonth = isSameMonth(day, displayMonth);

                                        return (
                                            <div
                                                key={dateStr}
                                                className={`
                                                    aspect-square rounded-xl flex flex-col items-center justify-center
                                                    ${!isCurrentMonth ? "opacity-40" : ""}
                                                `}
                                                style={{
                                                    backgroundColor: hasAttendance
                                                        ? `${GREEN}20`
                                                        : "#f1f5f9",
                                                    ...(isToday && {
                                                        boxShadow: `inset 0 0 0 2px ${GREEN}`,
                                                    }),
                                                }}
                                            >
                                                <span
                                                    className={`text-sm font-medium ${isCurrentMonth
                                                            ? "text-foreground"
                                                            : "text-muted-foreground"
                                                        }`}
                                                >
                                                    {format(day, "d")}
                                                </span>
                                                {hasAttendance && (
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full mt-0.5"
                                                        style={{ backgroundColor: GREEN }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="space-y-2 max-h-[320px] overflow-y-auto">
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton
                                            key={i}
                                            className="h-14 w-full rounded-xl"
                                        />
                                    ))
                                ) : attendance.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-8">
                                        No attendance records yet
                                    </p>
                                ) : (
                                    attendance.map((a) => (
                                        <div
                                            key={a.id}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {format(
                                                        parseISO(a.date),
                                                        "EEE, MMM d, yyyy"
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {a.checkInTime?.toDate?.()
                                                        ? format(
                                                            a.checkInTime.toDate(),
                                                            "h:mm a"
                                                        )
                                                        : "—"}
                                                </p>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${GREEN}20`,
                                                    color: GREEN,
                                                    borderColor: "transparent",
                                                }}
                                            >
                                                {getMethodBadge(a.checkInMethod)}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
