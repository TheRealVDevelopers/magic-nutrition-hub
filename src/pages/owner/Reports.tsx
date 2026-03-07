import { useState } from "react";
import { format, subDays } from "date-fns";
import { BarChart3, Users, CalendarCheck, Download, Printer } from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    useRevenueReport,
    useAttendanceReport,
    useMemberReport,
} from "@/hooks/owner/useReports";
import { useClubContext } from "@/lib/clubDetection";
import { printViaRawBT } from "@/utils/printReceipt";
import { buildDailySalesReceipt, buildTierBreakdownReceipt, type ClubPrintData } from "@/utils/receiptBuilder";

const GREEN = "#2d9653";

function exportCSV(headers: string[], rows: (string | number)[][], filename: string) {
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function Reports() {
    const { club } = useClubContext();
    const clubId = club?.id ?? null;
    const [tab, setTab] = useState<"revenue" | "attendance" | "members">("revenue");
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [printDate, setPrintDate] = useState(format(new Date(), "yyyy-MM-dd"));

    const revReport = useRevenueReport(clubId, startDate, endDate);
    const attReport = useAttendanceReport(clubId, startDate, endDate);
    const memReport = useMemberReport(clubId);
    // Single-day reports for the daily summary receipt
    const dayRevReport = useRevenueReport(clubId, printDate, printDate);
    const dayAttReport = useAttendanceReport(clubId, printDate, printDate);

    const currency = club?.currencyName || "Coins";

    const handleExportRevenue = () => {
        const d = revReport.data;
        if (!d) return;
        exportCSV(
            ["Date", "Revenue"],
            d.dailyRevenue.map((r) => [r.date, r.revenue]),
            `revenue-${startDate}-${endDate}.csv`
        );
    };

    const handleExportAttendance = () => {
        const d = attReport.data;
        if (!d) return;
        exportCSV(
            ["Date", "Count"],
            d.dailyAttendance.map((r) => [r.date, r.count]),
            `attendance-${startDate}-${endDate}.csv`
        );
    };

    const handleExportMembers = () => {
        const d = memReport.data;
        if (!d) return;
        exportCSV(
            ["Metric", "Value"],
            [
                ["Total Members", d.totalMembers],
                ["Active", d.activeMembers],
                ["New This Month", d.newThisMonth],
                ["Expiring This Month", d.expiringThisMonth],
            ],
            `members-${format(new Date(), "yyyy-MM-dd")}.csv`
        );
    };

    return (
        <div className="space-y-6 pb-12" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <h1 className="text-2xl font-bold" style={{ color: GREEN }}>Reports</h1>

            <div className="flex flex-wrap gap-2">
                {(["revenue", "attendance", "members"] as const).map((t) => (
                    <Button
                        key={t}
                        variant={tab === t ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTab(t)}
                        style={tab === t ? { backgroundColor: GREEN } : {}}
                    >
                        {t === "revenue" && <BarChart3 className="w-4 h-4 mr-1" />}
                        {t === "attendance" && <CalendarCheck className="w-4 h-4 mr-1" />}
                        {t === "members" && <Users className="w-4 h-4 mr-1" />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                ))}
            </div>

            {(tab === "revenue" || tab === "attendance") && (
                <div className="flex items-center gap-2 flex-wrap">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-[140px]" />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-[140px]" />
                </div>
            )}

            {tab === "revenue" && (
                <div className="space-y-4">
                    {revReport.isLoading ? (
                        <Skeleton className="h-64 w-full rounded-xl" />
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold" style={{ color: GREEN }}>
                                        {revReport.data?.totalRevenue?.toLocaleString() ?? 0} {currency}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">{revReport.data?.totalOrders ?? 0} orders</p>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Print Daily Summary */}
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="date"
                                            value={printDate}
                                            onChange={(e) => setPrintDate(e.target.value)}
                                            className="w-[130px] h-8 text-xs"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 h-8 text-xs"
                                            disabled={dayRevReport.isLoading || dayAttReport.isLoading}
                                            onClick={() => {
                                                const clubData: ClubPrintData = {
                                                    name: club?.name ?? "Magic Nutrition Club",
                                                    address: (club as any)?.address ?? "",
                                                    phone: club?.phone ?? club?.ownerPhone ?? "",
                                                    gstNumber: (club as any)?.gstNumber ?? "",
                                                };
                                                const lines = buildDailySalesReceipt({
                                                    club: clubData,
                                                    date: printDate,
                                                    totalRevenue: dayRevReport.data?.totalRevenue ?? 0,
                                                    totalOrders: dayRevReport.data?.totalOrders ?? 0,
                                                    completedOrders: dayRevReport.data?.totalOrders ?? 0,
                                                    cancelledOrders: 0,
                                                    topProducts: (dayRevReport.data?.topItems ?? []).map(item => ({
                                                        name: item.name,
                                                        count: item.count ?? (item as any).quantity ?? 0,
                                                    })),
                                                    topMembers: [],
                                                });
                                                printViaRawBT(lines);
                                            }}
                                        >
                                            <Printer className="w-3.5 h-3.5" /> Print Summary
                                        </Button>
                                    </div>
                                    <Button size="sm" onClick={handleExportRevenue} disabled={!revReport.data} style={{ backgroundColor: GREEN }}>
                                        <Download className="w-4 h-4 mr-1" /> Export CSV
                                    </Button>
                                </div>
                            </div>
                            <div className="h-64 rounded-xl border bg-white p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revReport.data?.dailyRevenue ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="revenue" fill={GREEN} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Top 5 Items</p>
                                <ul className="space-y-1">
                                    {(revReport.data?.topItems ?? []).map((item, i) => (
                                        <li key={i} className="flex justify-between text-sm">
                                            <span>{item.name}</span>
                                            <Badge variant="secondary">{item.revenue} {currency}</Badge>
                                        </li>
                                    ))}
                                    {(!revReport.data?.topItems?.length) && <li className="text-muted-foreground text-sm">No items</li>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}

            {tab === "attendance" && (
                <div className="space-y-4">
                    {attReport.isLoading ? (
                        <Skeleton className="h-64 w-full rounded-xl" />
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Attendance</p>
                                    <p className="text-2xl font-bold" style={{ color: GREEN }}>{attReport.data?.totalRecords ?? 0}</p>
                                </div>
                                <Button size="sm" onClick={handleExportAttendance} disabled={!attReport.data} style={{ backgroundColor: GREEN }}>
                                    <Download className="w-4 h-4 mr-1" /> Export CSV
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    disabled={!attReport.data}
                                    onClick={() => {
                                        const clubData: ClubPrintData = {
                                            name: club?.name ?? "Magic Nutrition Club",
                                            address: (club as any)?.address ?? "",
                                            phone: club?.phone ?? club?.ownerPhone ?? "",
                                            gstNumber: (club as any)?.gstNumber ?? "",
                                        };
                                        const lines = buildDailySalesReceipt({
                                            club: clubData,
                                            date: `${startDate} to ${endDate}`,
                                            totalRevenue: 0,
                                            totalOrders: 0,
                                            completedOrders: 0,
                                            cancelledOrders: 0,
                                            topProducts: [],
                                            topMembers: (attReport.data?.topMembers ?? []).map(m => ({
                                                name: m.name,
                                                count: m.count,
                                            })),
                                        });
                                        printViaRawBT(lines);
                                    }}
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </Button>
                            </div>
                            <div className="h-64 rounded-xl border bg-white p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={attReport.data?.dailyAttendance ?? []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke={GREEN} strokeWidth={2} dot={{ fill: GREEN }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <p className="text-sm font-medium mb-2">Top 10 Consistent Members</p>
                                <ul className="space-y-1">
                                    {(attReport.data?.topMembers ?? []).map((m, i) => (
                                        <li key={i} className="flex justify-between text-sm">
                                            <span>{m.name}</span>
                                            <Badge variant="secondary">{m.count} visits</Badge>
                                        </li>
                                    ))}
                                    {(!attReport.data?.topMembers?.length) && <li className="text-muted-foreground text-sm">No data</li>}
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            )}

            {tab === "members" && (
                <div className="space-y-4">
                    {memReport.isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center flex-wrap gap-2">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                                    <div className="rounded-xl border p-4 bg-white">
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="text-xl font-bold" style={{ color: GREEN }}>{memReport.data?.totalMembers ?? 0}</p>
                                    </div>
                                    <div className="rounded-xl border p-4 bg-white">
                                        <p className="text-xs text-muted-foreground">Active</p>
                                        <p className="text-xl font-bold" style={{ color: GREEN }}>{memReport.data?.activeMembers ?? 0}</p>
                                    </div>
                                    <div className="rounded-xl border p-4 bg-white">
                                        <p className="text-xs text-muted-foreground">New This Month</p>
                                        <p className="text-xl font-bold" style={{ color: GREEN }}>{memReport.data?.newThisMonth ?? 0}</p>
                                    </div>
                                    <div className="rounded-xl border p-4 bg-white">
                                        <p className="text-xs text-muted-foreground">Expiring</p>
                                        <p className="text-xl font-bold" style={{ color: GREEN }}>{memReport.data?.expiringThisMonth ?? 0}</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={handleExportMembers} disabled={!memReport.data} style={{ backgroundColor: GREEN }}>
                                    <Download className="w-4 h-4 mr-1" /> Export CSV
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    disabled={!memReport.data}
                                    onClick={() => {
                                        const clubData: ClubPrintData = {
                                            name: club?.name ?? "Magic Nutrition Club",
                                            address: (club as any)?.address ?? "",
                                            phone: club?.phone ?? club?.ownerPhone ?? "",
                                            gstNumber: (club as any)?.gstNumber ?? "",
                                        };
                                        const lines = buildTierBreakdownReceipt({
                                            club: clubData,
                                            date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                                            gold: 0,
                                            silver: 0,
                                            bronze: 0,
                                            totalActive: memReport.data?.activeMembers ?? 0,
                                            totalExpired: (memReport.data?.totalMembers ?? 0) - (memReport.data?.activeMembers ?? 0),
                                            totalPending: memReport.data?.newThisMonth ?? 0,
                                        });
                                        printViaRawBT(lines);
                                    }}
                                >
                                    <Printer className="w-4 h-4" /> Print
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}


        </div>
    );
}
