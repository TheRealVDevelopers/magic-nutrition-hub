import { useState } from "react";
import { Activity, Plus, TrendingDown, TrendingUp, Trophy, Scale, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import { useAuth } from "@/lib/auth";
import { useMyWeighIns, useMyBadges, useMyRank } from "@/hooks/member/useWeighIns";
import { MILESTONES } from "@/utils/checkMilestones";
import WeightChart from "@/components/member/WeightChart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecordWeighIn } from "@/hooks/owner/useWeighIns"; // Reusing owner hook for member self-recording if allowed, otherwise we can assume members only view or if we want them to log

export default function ProgressPage() {
    const { toast } = useToast();
    const { club } = useClubContext();
    const { userProfile } = useAuth();

    // Hooks
    const { data: logs = [], isLoading: isLogsLoading } = useMyWeighIns();
    const badges = useMyBadges();
    const { data: rankMonthly } = useMyRank("month");
    const { data: rankAllTime } = useMyRank("alltime");

    // We import this from owner but we use it here for member self-recording if needed (often clubs restrict this, but we'll adapt to existing logic)
    const recordWeighIn = useRecordWeighIn();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [weightInput, setWeightInput] = useState("");
    const [weightNote, setWeightNote] = useState("");

    const targetWeight = userProfile?.targetWeight || undefined;

    const handleAddSubmit = async () => {
        const w = parseFloat(weightInput);
        if (isNaN(w) || !club || !userProfile) return;

        try {
            await recordWeighIn.mutateAsync({
                memberId: userProfile.id,
                clubId: club.id,
                weight: w,
                notes: weightNote,
                recordedBy: "member", // explicit tagging
                previousWeight: userProfile.currentWeight ?? null,
                startingWeight: userProfile.startingWeight ?? w,
                targetWeight: userProfile.targetWeight ?? 0,
                existingBadges: userProfile.badges || [],
                totalWeighIns: userProfile.totalWeighIns || 0,
            });
            setIsAddOpen(false);
            setWeightInput("");
            setWeightNote("");
            toast({ title: "Progress recorded! 💪" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    if (isLogsLoading || !userProfile) {
        return (
            <div className="min-h-screen p-4 flex justify-center py-12 bg-slate-50">
                <p className="text-muted-foreground animate-pulse">Loading progress...</p>
            </div>
        );
    }

    // Stats calculation
    const currentWeight = userProfile?.currentWeight;
    const startWeight = userProfile?.startingWeight;
    const change = startWeight && currentWeight ? currentWeight - startWeight : 0;
    const isLoss = change < 0;

    return (
        <div className="space-y-6 animate-fade-in px-4 md:px-6 pb-20 pt-4" style={{ fontFamily: "'Nunito', sans-serif" }}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2" style={{ color: "#2d9653" }}>
                        <Activity className="w-6 h-6" /> My Progress
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Track your fitness journey.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl text-white" style={{ backgroundColor: "#2d9653" }}>
                    <Plus className="w-4 h-4" /> Log
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Starting</p>
                    <p className="text-xl font-black mt-1 text-slate-800">{startWeight || "—"} <span className="text-sm font-medium text-slate-400">kg</span></p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Current</p>
                    <p className="text-2xl font-black text-emerald-900 mt-0.5">{currentWeight || "—"} <span className="text-sm font-medium opacity-50">kg</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-center shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target</p>
                    <p className="text-xl font-black text-slate-700 mt-1">{targetWeight || "—"} <span className="text-sm font-medium text-slate-400">kg</span></p>
                </div>
                <div className={`p-4 rounded-2xl border flex flex-col justify-center shadow-sm ${change !== 0 ? (isLoss ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100") : "bg-white"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${change !== 0 ? (isLoss ? "text-emerald-700" : "text-orange-700") : "text-slate-500"}`}>Change</p>
                    <div className="flex items-center gap-1 mt-1">
                        {change !== 0 && (isLoss ? <TrendingDown className="w-4 h-4 text-emerald-600" /> : <TrendingUp className="w-4 h-4 text-orange-600" />)}
                        <p className={`text-xl font-black ${change !== 0 ? (isLoss ? "text-emerald-800" : "text-orange-800") : "text-slate-900"}`}>
                            {Math.abs(change).toFixed(1)} <span className="text-sm font-medium opacity-50">kg</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Ranking & Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ranking Card */}
                <div className="bg-white rounded-3xl border p-5 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4 text-amber-600">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            <h2 className="font-bold text-slate-900">Leaderboard Rank</h2>
                        </div>
                        <Link to="/member/leaderboard" className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 hover:bg-amber-100 transition-colors">
                            View all
                        </Link>
                    </div>

                    <div className="flex-1 flex flex-col justify-center space-y-4">
                        <div className="bg-amber-50 rounded-2xl p-4 flex items-center justify-between border border-amber-100">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">This Month</p>
                                <p className="text-sm text-amber-900 font-medium">Rank</p>
                            </div>
                            <div className="text-3xl font-black text-amber-600">
                                {rankMonthly ? `#${rankMonthly}` : "N/A"}
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                            <div>
                                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">All Time</p>
                                <p className="text-sm text-slate-700 font-medium">Rank</p>
                            </div>
                            <div className="text-2xl font-black text-slate-800">
                                {rankAllTime ? `#${rankAllTime}` : "N/A"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Badges Card */}
                {badges.length > 0 && (
                    <div className="bg-white rounded-3xl border p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-emerald-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <h2 className="font-bold text-slate-900">My Milestones</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {badges.map((b) => {
                                const mDef = MILESTONES.find(m => m.id === b);
                                if (!mDef) return null;
                                return (
                                    <div key={b} className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100 group hover:scale-105 transition-transform">
                                        <div className="text-3xl mb-1 group-hover:animate-bounce-short">{mDef.emoji}</div>
                                        <p className="text-[10px] font-bold text-emerald-900 line-clamp-2 leading-tight">{mDef.label}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="bg-white p-4 md:p-6 rounded-3xl border shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Weight History</h2>
                <WeightChart logs={logs as any} targetWeight={targetWeight} />
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b flex items-center gap-2 text-slate-900">
                    <Scale className="w-5 h-5" />
                    <h2 className="text-sm font-bold">Log Entries</h2>
                </div>
                <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500">No logs to display.</p>
                    ) : (
                        logs.map((log: any) => (
                            <div key={log.id} className="p-4 md:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-black text-slate-900">{log.weight} kg</p>
                                        {log.change !== 0 && (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.change > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                {log.change > 0 ? "↓" : "↑"} {Math.abs(log.change)} kg
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">{log.date?.toDate?.().toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    {log.notes && <p className="text-[10px] text-slate-700 mt-1.5 font-bold bg-slate-100 inline-block px-2 py-1 rounded-md">{log.notes}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-sm rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle>Record Weight</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Weight (kg)</Label>
                            <Input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 75.5"
                                value={weightInput}
                                onChange={(e) => setWeightInput(e.target.value)}
                                className="h-12 bg-slate-50 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Notes (optional)</Label>
                            <Input
                                placeholder="How are you feeling?"
                                value={weightNote}
                                onChange={(e) => setWeightNote(e.target.value)}
                                className="bg-slate-50"
                            />
                        </div>
                        <Button
                            className="w-full h-12 text-white font-bold"
                            style={{ backgroundColor: "#2d9653" }}
                            onClick={handleAddSubmit}
                            disabled={!weightInput || recordWeighIn.isPending}
                        >
                            {recordWeighIn.isPending ? "Saving..." : "Save Progress"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
