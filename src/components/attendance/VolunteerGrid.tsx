import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClubContext } from "@/lib/clubDetection";
import { useClubVolunteers } from "@/hooks/useOwner";
import { useAllVolunteersStatus, useCheckInVolunteer } from "@/hooks/useAttendance";
import QRDisplayModal from "./QRDisplayModal";
import { useToast } from "@/hooks/use-toast";

export default function VolunteerGrid() {
    const { club } = useClubContext();
    const { toast } = useToast();
    const { data: volunteers, isLoading } = useClubVolunteers();
    const { statusMap, loading: statusLoading } = useAllVolunteersStatus();
    const [selectedVolunteer, setSelectedVolunteer] = useState<{ id: string; name: string } | null>(null);

    const handleTap = (vol: { id: string; name: string }) => {
        const status = statusMap[vol.id];
        if (status) {
            toast({
                title: "Already checked in",
                description: `${vol.name} checked in at ${status.checkInTime?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
            });
        } else {
            setSelectedVolunteer(vol);
        }
    };

    if (isLoading || statusLoading) {
        return (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-6">
                {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
                {volunteers?.filter((v) => v.status === "active").map((vol) => {
                    const status = statusMap[vol.id];
                    const isIn = !!status;

                    return (
                        <button
                            key={vol.id}
                            onClick={() => handleTap(vol)}
                            className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all hover:shadow-lg active:scale-95 ${isIn
                                    ? "border-emerald-300 bg-emerald-50"
                                    : "border-gray-200 bg-white hover:border-violet-300"
                                }`}
                        >
                            <Avatar className="h-20 w-20">
                                {vol.photo ? <AvatarImage src={vol.photo} /> : null}
                                <AvatarFallback className="text-2xl font-bold bg-violet-100 text-violet-700">
                                    {vol.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-bold text-center truncate w-full">{vol.name}</p>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${isIn ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
                                <span className={`text-xs font-medium ${isIn ? "text-emerald-700" : "text-muted-foreground"}`}>
                                    {isIn
                                        ? `In at ${status!.checkInTime?.toDate?.().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                        : "Not In"}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedVolunteer && (
                <QRDisplayModal
                    open
                    userId={selectedVolunteer.id}
                    userName={selectedVolunteer.name}
                    onClose={() => setSelectedVolunteer(null)}
                />
            )}
        </>
    );
}
