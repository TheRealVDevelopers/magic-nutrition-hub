import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Search, UserCheck, Users, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAttendanceByDate, useMarkAttendance } from "@/hooks/owner/useAttendance";
import { useMembers } from "@/hooks/owner/useMembers";
import { useClubContext } from "@/lib/clubDetection";
import type { User } from "@/types/firestore";

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

export default function Attendance() {
    const { club } = useClubContext();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [search, setSearch] = useState("");
    const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

    const { data: members = [], isLoading: membersLoading } = useMembers(club?.id ?? null);
    const { data: attendance = [], isLoading: attendanceLoading } = useAttendanceByDate(club?.id ?? null, selectedDate);
    const markAttendance = useMarkAttendance();

    const presentUserIds = useMemo(() => new Set(attendance.map((a) => a.userId)), [attendance]);
    const absentMembers = useMemo(
        () => members.filter((m) => !presentUserIds.has(m.id)),
        [members, presentUserIds]
    );
    const filteredMembers = useMemo(() => {
        if (!search.trim()) return members;
        const q = search.toLowerCase();
        return members.filter((m) => m.name.toLowerCase().includes(q) || (m.phone || "").includes(q));
    }, [members, search]);

    const presentCount = presentUserIds.size;
    const absentCount = members.length - presentCount;

    const handleMarkPresent = (member: User) => {
        if (!club) return;
        markAttendance.mutate(
            {
                clubId: club.id,
                userId: member.id,
                userName: member.name,
                userPhoto: member.photo || "",
                method: "manual",
                date: selectedDate,
            },
            {
                onSuccess: () => toast({ title: `${member.name} marked present` }),
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            }
        );
    };

    const handleMarkAllPresent = async () => {
        if (!club || absentMembers.length === 0) return;
        const toMark = [...absentMembers];
        setBulkConfirmOpen(false);
        try {
            await Promise.all(
                toMark.map((m) =>
                    markAttendance.mutateAsync({
                        clubId: club.id,
                        userId: m.id,
                        userName: m.name,
                        userPhoto: m.photo || "",
                        method: "manual",
                        date: selectedDate,
                    })
                )
            );
            toast({ title: `${toMark.length} members marked present` });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const isLoading = membersLoading || attendanceLoading;

    return (
        <div className="min-h-screen bg-[#f8fffe] p-4 sm:p-6 animate-fade-in">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-wellness-forest flex items-center gap-2">
                        <CalendarCheck className="w-6 h-6" style={{ color: "#2d9653" }} />
                        Attendance
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{formatDateDisplay(selectedDate)}</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white p-5 shadow-soft border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                            <UserCheck className="w-4 h-4" style={{ color: "#2d9653" }} /> Present
                        </div>
                        <p className="text-2xl font-black mt-1" style={{ color: "#2d9653" }}>{presentCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-soft border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                            <Users className="w-4 h-4" /> Absent
                        </div>
                        <p className="text-2xl font-black mt-1 text-muted-foreground">{absentCount}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-5 shadow-soft border border-border">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase">
                            <Users className="w-4 h-4" /> Total
                        </div>
                        <p className="text-2xl font-black mt-1 text-wellness-forest">{members.length}</p>
                    </div>
                </div>

                {/* Date picker */}
                <div className="rounded-2xl bg-white p-5 shadow-soft border border-border">
                    <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">View date</label>
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="min-h-[48px] text-base"
                    />
                </div>

                {/* Search + Bulk */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or phone…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 min-h-[48px]"
                        />
                    </div>
                    {absentMembers.length > 0 && (
                        <Button
                            onClick={() => setBulkConfirmOpen(true)}
                            className="min-h-[48px] gap-2"
                            style={{ backgroundColor: "#2d9653" }}
                        >
                            <QrCode className="w-4 h-4" /> Mark All Present
                        </Button>
                    )}
                </div>

                {/* Member list */}
                <div className="rounded-2xl bg-white p-5 shadow-soft border border-border space-y-3">
                    <h3 className="text-sm font-bold text-wellness-forest flex items-center gap-2">
                        <Users className="w-4 h-4" /> Members
                    </h3>

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Skeleton key={i} className="h-16 rounded-xl" />
                            ))}
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground text-sm mb-2">No members yet</p>
                            <Link to="/owner/members">
                                <Button variant="outline" size="sm" className="min-h-[48px]">
                                    Add members
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredMembers.map((m) => {
                                const isPresent = presentUserIds.has(m.id);
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center gap-4 p-3 rounded-xl border bg-white/50 hover:bg-muted/30 transition-colors min-h-[56px]"
                                    >
                                        <Avatar className="h-10 w-10 flex-shrink-0">
                                            {m.photo ? <AvatarImage src={m.photo} /> : null}
                                            <AvatarFallback className="bg-wellness-mint text-wellness-forest font-bold text-sm">
                                                {m.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold truncate">{m.name}</p>
                                            <p className="text-xs text-muted-foreground">{m.phone || "—"}</p>
                                        </div>
                                        <div className="flex-shrink-0 min-w-[100px]">
                                            {isPresent ? (
                                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 min-h-[48px] min-w-[48px] flex items-center justify-center">
                                                    Present
                                                </Badge>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="min-h-[48px] min-w-[48px]"
                                                    onClick={() => handleMarkPresent(m)}
                                                    disabled={markAttendance.isPending}
                                                >
                                                    Absent
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk confirm dialog */}
            <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mark all present?</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted-foreground">
                        This will mark {absentMembers.length} member{absentMembers.length !== 1 ? "s" : ""} as present for {formatDateDisplay(selectedDate)}.
                    </p>
                    <div className="flex gap-2 justify-end mt-4">
                        <Button variant="outline" onClick={() => setBulkConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleMarkAllPresent} style={{ backgroundColor: "#2d9653" }}>
                            Mark All Present
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
