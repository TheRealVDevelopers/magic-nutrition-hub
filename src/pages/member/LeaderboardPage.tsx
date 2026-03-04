import { useState } from "react";
import { ArrowLeft, Trophy, TrendingDown, Medal } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useClubContext } from "@/lib/clubDetection";
import { useAuth } from "@/lib/auth";
import { useLeaderboard } from "@/hooks/owner/useWeighIns";

/** Formats a name to "First M." */
function formatNamePrivacy(name: string) {
    if (!name) return "Unknown";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export default function MemberLeaderboard() {
    const { club } = useClubContext();
    const { firebaseUser } = useAuth();
    const [tab, setTab] = useState<"month" | "alltime">("month");
    const { data: leaderboard, isLoading } = useLeaderboard(club?.id || null, tab);

    return (
        <div className="space-y-6 animate-fade-in pb-20 pt-4 px-4 md:px-6" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="flex items-center gap-3 mb-2">
                <Link to="/member/progress" className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: "#2d9653" }}>
                        <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Club top performers in weight loss.</p>
                </div>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="month" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">This Month</TabsTrigger>
                    <TabsTrigger value="alltime" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm">All Time</TabsTrigger>
                </TabsList>

                <TabsContent value="month" className="mt-6">
                    <LeaderboardList data={leaderboard || []} isLoading={isLoading} currentUserId={firebaseUser?.uid} />
                </TabsContent>

                <TabsContent value="alltime" className="mt-6">
                    <LeaderboardList data={leaderboard || []} isLoading={isLoading} currentUserId={firebaseUser?.uid} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function LeaderboardList({ data, isLoading, currentUserId }: { data: any[]; isLoading: boolean, currentUserId?: string }) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-3xl" />)}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-16 bg-white border border-dashed rounded-3xl">
                <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900">No Data Yet</h3>
                <p className="text-sm text-slate-500 mt-1">Check back soon for the latest rankings.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {data.map((member, index) => {
                const isMe = member.memberId === currentUserId;
                const isTop3 = index < 3;

                return (
                    <div
                        key={member.memberId}
                        className={`p-4 sm:p-5 flex items-center justify-between rounded-3xl border shadow-sm transition-transform hover:scale-[1.01] ${isMe ? "bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100" :
                            isTop3 ? "bg-white border-amber-100 ring-1 ring-amber-50" :
                                "bg-white"
                            }`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${index === 0 ? "bg-gradient-to-br from-amber-300 to-amber-500 text-white border border-amber-400" :
                                index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white border border-slate-300" :
                                    index === 2 ? "bg-gradient-to-br from-orange-300 to-orange-400 text-white border border-orange-300" :
                                        "bg-slate-100 text-slate-400 font-bold border border-slate-200"
                                }`}>
                                {isTop3 ? <Medal className="w-5 h-5 text-white/90" /> : index + 1}
                            </div>
                            <div className="flexitems-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className={`font-bold text-lg ${isMe ? "text-emerald-900" : "text-slate-900"}`}>
                                            {isMe ? "You" : formatNamePrivacy(member.memberName)}
                                        </p>
                                        {isMe && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Me</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                                        <TrendingDown className="w-3 h-3 text-emerald-500" />
                                        Lost weight
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-black text-2xl text-emerald-700">-{member.weightLost.toFixed(1)} <span className="text-sm opacity-50">kg</span></p>
                            {/* <p className="text-xs font-bold text-slate-500">{member.weighInCount} entries</p> */}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
