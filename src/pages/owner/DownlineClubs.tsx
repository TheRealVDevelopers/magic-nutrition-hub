import { GitBranch, Users, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDownlineClubs } from "@/hooks/useOwner";
import type { Club } from "@/types/firestore";

export default function DownlineClubs() {
    const { data: downline, isLoading } = useDownlineClubs();

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-black text-wellness-forest flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-violet-500" /> My Network
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {downline?.length || 0} clubs in your downline (read-only)
                </p>
            </div>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : downline && downline.length > 0 ? (
                <div className="space-y-3">
                    {downline.map((club) => (
                        <DownlineCard key={club.id} club={club} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border border-dashed rounded-2xl bg-white">
                    <p className="text-muted-foreground text-sm">No clubs in your downline yet</p>
                </div>
            )}
        </div>
    );
}

function DownlineCard({ club }: { club: Club }) {
    const depth = club.treePath.split("/").length - 1;
    const initials = club.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl border bg-white hover:shadow-md transition-shadow" style={{ marginLeft: `${depth * 20}px` }}>
            <Avatar className="h-10 w-10 rounded-xl">
                <AvatarFallback className="rounded-xl text-white font-bold text-sm" style={{ backgroundColor: club.primaryColor || "#8B5CF6" }}>
                    {initials}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{club.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {club.domain}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {club.ownerName}</span>
                </div>
            </div>
            <Badge variant={club.status === "active" ? "outline" : "destructive"} className={club.status === "active" ? "border-emerald-200 bg-emerald-50 text-emerald-700 text-xs" : "text-xs"}>
                {club.status}
            </Badge>
        </div>
    );
}
