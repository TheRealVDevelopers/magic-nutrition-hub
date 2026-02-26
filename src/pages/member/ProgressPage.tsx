import { useState } from "react";
import { Activity, Plus, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWeightLogs, useAddWeightLog } from "@/hooks/useMemberFeatures";
import WeightChart from "@/components/member/WeightChart";
import WeightLogForm from "@/components/member/WeightLogForm";

export default function ProgressPage() {
    const { toast } = useToast();
    const { data: logs = [], isLoading } = useWeightLogs();
    const addLog = useAddWeightLog();

    const [isAddOpen, setIsAddOpen] = useState(false);
    const targetWeight = 65; // Keeping this static as Phase 9 specs don't strictly require defining a complete profile management tab for targets, simulating generic value

    const handleAddSubmit = async (weight: number, date: string, notes: string) => {
        try {
            await addLog.mutateAsync({ weight, date, notes });
            setIsAddOpen(false);
            toast({ title: "Progress recorded! 💪" });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    // Stats calculation
    const startWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
    const currentWeight = logs.length > 0 ? logs[0].weight : null;
    const change = startWeight && currentWeight ? currentWeight - startWeight : 0;
    const isLoss = change < 0;

    return (
        <div className="space-y-6 animate-fade-in px-4 md:px-6 pb-20 pt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-violet-600" /> My Progress
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Track your fitness journey.</p>
                </div>
                <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700">
                    <Plus className="w-4 h-4" /> Log
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border flex flex-col justify-center shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Starting</p>
                    <p className="text-xl font-black mt-1">{startWeight || "—"} <span className="text-sm font-medium text-slate-400">kg</span></p>
                </div>
                <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 flex flex-col justify-center shadow-sm">
                    <p className="text-xs font-bold text-violet-600 uppercase">Current</p>
                    <p className="text-2xl font-black text-violet-900 mt-0.5">{currentWeight || "—"} <span className="text-sm font-medium opacity-50">kg</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-center shadow-sm">
                    <p className="text-xs font-bold text-slate-500 uppercase">Target</p>
                    <p className="text-xl font-black text-slate-700 mt-1">{targetWeight} <span className="text-sm font-medium text-slate-400">kg</span></p>
                </div>
                <div className={`p-4 rounded-2xl border flex flex-col justify-center shadow-sm ${change !== 0 ? (isLoss ? "bg-emerald-50 border-emerald-100" : "bg-orange-50 border-orange-100") : "bg-white"}`}>
                    <p className={`text-xs font-bold uppercase ${change !== 0 ? (isLoss ? "text-emerald-700" : "text-orange-700") : "text-slate-500"}`}>Change</p>
                    <div className="flex items-center gap-1 mt-1">
                        {change !== 0 && (isLoss ? <TrendingDown className="w-4 h-4 text-emerald-600" /> : <TrendingUp className="w-4 h-4 text-orange-600" />)}
                        <p className={`text-xl font-black ${change !== 0 ? (isLoss ? "text-emerald-800" : "text-orange-800") : "text-slate-900"}`}>
                            {Math.abs(change).toFixed(1)} <span className="text-sm font-medium opacity-50">kg</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-4 md:p-6 rounded-3xl border shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4">Weight History</h2>
                <WeightChart logs={logs} targetWeight={targetWeight} />
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                <div className="p-4 md:p-6 border-b">
                    <h2 className="text-sm font-bold text-slate-900">Log Entries</h2>
                </div>
                <div className="divide-y">
                    {logs.length === 0 ? (
                        <p className="p-6 text-center text-sm text-slate-500">No logs to display.</p>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="p-4 md:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div>
                                    <p className="font-bold text-slate-900">{log.weight} kg</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{log.date.toDate().toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    {log.notes && <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded-full">{log.notes}</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="max-w-sm p-0 border-none bg-transparent shadow-none">
                    <WeightLogForm isLoading={addLog.isPending} onClose={() => setIsAddOpen(false)} onSubmit={handleAddSubmit} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
