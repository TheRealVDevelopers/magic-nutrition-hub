import { Users, DollarSign, CalendarCheck, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyStats } from "@/hooks/useOwner";
import { useClubContext } from "@/lib/clubDetection";

export default function DailyStatsBar() {
    const { data, isLoading } = useDailyStats();
    const { club } = useClubContext();

    const stats = [
        { key: "todayAttendance", label: "Today's Check-ins", icon: CalendarCheck, color: "text-violet-600", bg: "bg-violet-50" },
        { key: "todayRevenue", label: `Today's Revenue`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50", suffix: ` ${club?.currencyName || ""}` },
        { key: "totalActiveMembers", label: "Active Members", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
        { key: "lowStockCount", label: "Low Stock Items", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
    ] as const;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => {
                const Icon = s.icon;
                const val = data?.[s.key as keyof typeof data] ?? 0;
                const isDanger = s.key === "lowStockCount" && (val as number) > 0;
                return (
                    <div
                        key={s.key}
                        className={`rounded-2xl border p-5 transition-all hover:shadow-md ${isDanger ? "border-orange-200 bg-orange-50/50" : "border-border bg-white"}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`rounded-xl p-2.5 ${s.bg}`}>
                                <Icon className={`w-5 h-5 ${s.color}`} />
                            </div>
                            <div>
                                {isLoading ? (
                                    <><Skeleton className="h-7 w-12 mb-1" /><Skeleton className="h-3 w-20" /></>
                                ) : (
                                    <>
                                        <p className={`text-2xl font-bold ${isDanger ? "text-orange-600" : "text-foreground"}`}>
                                            {val}{"suffix" in s ? s.suffix : ""}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
