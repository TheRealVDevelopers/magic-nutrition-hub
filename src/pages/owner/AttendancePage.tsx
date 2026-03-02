import { useState, useMemo, useEffect } from "react";
import { CalendarCheck, Users, HeartHandshake, Search, Download, Plus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import AttendanceLogTable from "@/components/attendance/AttendanceLogTable";
import VolunteerHoursCard from "@/components/attendance/VolunteerHoursCard";
import {
    useTodayAttendance,
    useAttendanceHistory,
    useManualCheckIn,
} from "@/hooks/useAttendance";
import { useClubMembers, useClubVolunteers } from "@/hooks/useOwner";
import { useVolunteerLog } from "@/hooks/useVolunteers";
import type { Attendance } from "@/types/firestore";

export default function AttendancePage() {
    const { toast } = useToast();

    // Today tab
    const { records: todayMembers, loading: todayMLoading } = useTodayAttendance("member");
    const { records: todayVols, loading: todayVLoading } = useTodayAttendance("volunteer");

    // Volunteer hours tab
    const { data: volunteers, isLoading: volLoading } = useClubVolunteers();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    const [selectedVol, setSelectedVol] = useState<string | null>(null);

    // Volunteer Log tab
    const [volLogDate, setVolLogDate] = useState(todayStr);
    const { data: volunteerLogSessions = [], isLoading: volLogLoading } = useVolunteerLog(volLogDate);

    // Live timer tick (for active sessions)
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick((n) => n + 1), 10000);
        return () => clearInterval(t);
    }, []);

    const exportVolLogCSV = () => {
        const rows = [["Name", "Login Time", "Logout Time", "Duration (min)", "Status"]];
        volunteerLogSessions.forEach((s: any) => {
            const loginTime = s.loginAt?.toDate?.().toLocaleTimeString() ?? "";
            const logoutTime = s.logoutAt?.toDate?.().toLocaleTimeString() ?? "";
            const mins = s.totalMinutes ? String(s.totalMinutes) : s.status === "active" ? String(Math.floor((Date.now() - (s.loginAt?.toDate?.().getTime() ?? 0)) / 60000)) : "";
            rows.push([s.memberName, loginTime, logoutTime, mins, s.status]);
        });
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `volunteer_log_${volLogDate}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    // History tab
    const [histStart, setHistStart] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
    const [histEnd, setHistEnd] = useState(now.toISOString().slice(0, 10));
    const [histSearch, setHistSearch] = useState("");
    const { records: historyRecords, loading: histLoading } = useAttendanceHistory(histStart, histEnd);

    // Manual check-in
    const { data: allMembers } = useClubMembers();
    const manualCheckIn = useManualCheckIn();
    const [manualOpen, setManualOpen] = useState(false);
    const [manualSearch, setManualSearch] = useState("");

    const filteredHistory = useMemo(() => {
        if (!histSearch.trim()) return historyRecords;
        const q = histSearch.toLowerCase();
        return historyRecords.filter((r) => r.userName.toLowerCase().includes(q));
    }, [historyRecords, histSearch]);

    const handleManualCheckIn = (member: { id: string; name: string; photo: string }) => {
        manualCheckIn.mutate(
            { userId: member.id, userName: member.name, userPhoto: member.photo },
            {
                onSuccess: () => { toast({ title: `${member.name} checked in!` }); setManualOpen(false); },
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            }
        );
    };

    const exportCSV = () => {
        const rows = [["Name", "Type", "Date", "Check-In", "Check-Out", "Hours", "Method"]];
        filteredHistory.forEach((r) => {
            rows.push([
                r.userName, r.type, r.date,
                r.checkInTime?.toDate?.().toLocaleTimeString() || "",
                r.checkOutTime?.toDate?.().toLocaleTimeString() || "",
                String(r.hoursWorked || ""),
                r.checkInMethod,
            ]);
        });
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `attendance_${histStart}_${histEnd}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    // Generate month options
    const monthOptions = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthOptions.push({
            value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        });
    }

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black text-wellness-forest flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6 text-violet-500" /> Attendance
                </h1>
                <Button variant="outline" onClick={() => setManualOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Manual Check-in
                </Button>
            </div>

            <Tabs defaultValue="today">
                <TabsList>
                    <TabsTrigger value="today">
                        Today
                        <Badge variant="secondary" className="ml-1.5 text-[10px]">{todayMembers.length + todayVols.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="hours">Volunteer Hours</TabsTrigger>
                    <TabsTrigger value="vollog">🤝 Volunteer Log</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                {/* Today */}
                <TabsContent value="today" className="mt-6 space-y-6">
                    {/* Members */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-500" /> Members ({todayMembers.length} checked in)
                        </h3>
                        {todayMLoading ? <Skeleton className="h-20 rounded-xl" /> : (
                            <AttendanceLogTable records={todayMembers} />
                        )}
                    </div>

                    {/* Volunteers */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <HeartHandshake className="w-4 h-4 text-blue-500" /> Volunteers ({todayVols.length} working)
                        </h3>
                        {todayVLoading ? <Skeleton className="h-20 rounded-xl" /> : (
                            <AttendanceLogTable records={todayVols} />
                        )}
                    </div>
                </TabsContent>

                {/* Volunteer Hours */}
                <TabsContent value="hours" className="mt-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((m) => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {volLoading ? (
                        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
                    ) : volunteers && volunteers.length > 0 ? (
                        <div className="space-y-3">
                            {volunteers.filter((v) => v.status === "active").map((v) => (
                                <VolunteerHoursCard
                                    key={v.id}
                                    volunteerId={v.id}
                                    volunteerName={v.name}
                                    volunteerPhoto={v.photo || ""}
                                    month={selectedMonth}
                                    onClick={() => setSelectedVol(selectedVol === v.id ? null : v.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">No volunteers found.</p>
                    )}
                </TabsContent>

                {/* Volunteer Log */}
                <TabsContent value="vollog" className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Input type="date" value={volLogDate} onChange={(e) => setVolLogDate(e.target.value)} className="w-44" />
                        <Button variant="outline" size="sm" onClick={exportVolLogCSV} disabled={!volunteerLogSessions.length} className="gap-1">
                            <Download className="w-4 h-4" /> CSV
                        </Button>
                        <span className="text-xs text-muted-foreground ml-auto">{volunteerLogSessions.length} session(s)</span>
                    </div>

                    {volLogLoading ? (
                        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    ) : volunteerLogSessions.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-2xl bg-slate-50">
                            <HeartHandshake className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No volunteer sessions for this date.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border bg-white">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-slate-50 text-xs text-muted-foreground uppercase tracking-wide">
                                        <th className="px-4 py-3 text-left">Volunteer</th>
                                        <th className="px-4 py-3 text-left">Login</th>
                                        <th className="px-4 py-3 text-left">Logout</th>
                                        <th className="px-4 py-3 text-left">Duration</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {volunteerLogSessions.map((s: any) => {
                                        const loginMs = s.loginAt?.toDate?.()?.getTime() ?? 0;
                                        const activeMinutes = s.status === "active"
                                            ? Math.floor((Date.now() - loginMs) / 60000) + (tick * 0)   // tick ref to re-render
                                            : (s.totalMinutes ?? 0);
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8">
                                                            {s.memberPhoto ? <AvatarImage src={s.memberPhoto} /> : null}
                                                            <AvatarFallback className="text-xs bg-green-100 text-green-700">{s.memberName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{s.memberName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {s.loginAt?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {s.logoutAt ? s.logoutAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {s.status === "active" ? (
                                                        <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <Timer className="w-3.5 h-3.5 animate-pulse" />
                                                            {activeMinutes}m
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-600">{activeMinutes}m</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge
                                                        variant="outline"
                                                        className={s.status === "active" ? "border-green-300 text-green-700 bg-green-50 animate-pulse" : "border-slate-200 text-slate-500"}
                                                    >
                                                        {s.status === "active" ? "🟢 Active" : "✓ Done"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                {/* History */}
                <TabsContent value="history" className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Input type="date" value={histStart} onChange={(e) => setHistStart(e.target.value)} className="w-40" />
                        <span className="text-xs text-muted-foreground">to</span>
                        <Input type="date" value={histEnd} onChange={(e) => setHistEnd(e.target.value)} className="w-40" />
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search member…" value={histSearch} onChange={(e) => setHistSearch(e.target.value)} className="pl-9" />
                        </div>
                        <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1">
                            <Download className="w-4 h-4" /> CSV
                        </Button>
                    </div>

                    {histLoading ? (
                        <div className="space-y-2">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
                    ) : (
                        <AttendanceLogTable records={filteredHistory} showType />
                    )}
                </TabsContent>
            </Tabs>

            {/* Manual Check-In Dialog */}
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>Manual Check-In</DialogTitle></DialogHeader>
                    <div className="space-y-3 mt-2">
                        <Input
                            placeholder="Search member by name…"
                            value={manualSearch}
                            onChange={(e) => setManualSearch(e.target.value)}
                        />
                        <div className="max-h-64 overflow-y-auto space-y-1">
                            {allMembers
                                ?.filter((m) => m.status === "active" && m.name.toLowerCase().includes(manualSearch.toLowerCase()))
                                .slice(0, 20)
                                .map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleManualCheckIn({ id: m.id, name: m.name, photo: m.photo || "" })}
                                        disabled={manualCheckIn.isPending}
                                        className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-gray-50 text-left"
                                    >
                                        <Avatar className="h-8 w-8">
                                            {m.photo ? <AvatarImage src={m.photo} /> : null}
                                            <AvatarFallback className="text-xs bg-violet-100 text-violet-700">{m.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{m.name}</p>
                                            <p className="text-xs text-muted-foreground">{m.phone}</p>
                                        </div>
                                    </button>
                                ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
