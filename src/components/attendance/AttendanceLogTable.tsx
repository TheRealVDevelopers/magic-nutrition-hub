import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Attendance } from "@/types/firestore";

interface Props {
    records: Attendance[];
    showType?: boolean;
}

export default function AttendanceLogTable({ records, showType }: Props) {
    if (records.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                No attendance records found.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {records.map((rec) => {
                const isVol = rec.type === "volunteer";
                const checkIn = rec.checkInTime?.toDate?.();
                const checkOut = rec.checkOutTime?.toDate?.();

                return (
                    <div key={rec.id} className="flex items-center gap-3 p-3 rounded-xl border bg-white">
                        <Avatar className="h-9 w-9">
                            {rec.userPhoto ? <AvatarImage src={rec.userPhoto} /> : null}
                            <AvatarFallback className="text-xs font-bold bg-violet-100 text-violet-700">
                                {rec.userName?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{rec.userName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{checkIn?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                {isVol && (
                                    <>
                                        <span>→</span>
                                        <span>{checkOut ? checkOut.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Still working"}</span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {showType && (
                                <Badge variant="outline" className={`text-[10px] ${isVol ? "border-blue-200 text-blue-700" : "border-emerald-200 text-emerald-700"}`}>
                                    {isVol ? "Volunteer" : "Member"}
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px]">{rec.checkInMethod}</Badge>
                            {isVol && rec.hoursWorked !== null && (
                                <span className="text-xs font-bold text-violet-600">{rec.hoursWorked}h</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
