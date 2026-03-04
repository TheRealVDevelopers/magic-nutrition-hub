import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, X, Check, ArrowDown, ArrowUp, Minus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useClubContext } from "@/lib/clubDetection";
import { useMembers } from "@/hooks/owner/useMembers";
import { useRecordWeighIn } from "@/hooks/owner/useWeighIns";

interface BulkWeighInProps {
    open: boolean;
    onClose: () => void;
}

export default function BulkWeighIn({ open, onClose }: BulkWeighInProps) {
    const { club } = useClubContext();
    const { data: members = [] } = useMembers(club?.id || null);
    const { toast } = useToast();
    const recordWeighIn = useRecordWeighIn();

    const [searchTerm, setSearchTerm] = useState("");
    const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, { change: number | null, badges: string[] }>>({});

    // Filter to active members
    const activeMembers = useMemo(() => {
        return members.filter(m => m.status === "active").sort((a, b) => {
            const dateA = a.lastWeighIn?.toDate?.()?.getTime() || 0;
            const dateB = b.lastWeighIn?.toDate?.()?.getTime() || 0;
            // Sort by least recently weighed in first
            return dateA - dateB;
        });
    }, [members]);

    const filteredMembers = useMemo(() => {
        if (!searchTerm) return activeMembers;
        const low = searchTerm.toLowerCase();
        return activeMembers.filter(m =>
            m.name.toLowerCase().includes(low) ||
            m.phone.includes(low) ||
            m.memberId?.toLowerCase().includes(low)
        );
    }, [activeMembers, searchTerm]);

    const handleSave = async (member: any) => {
        const inputVal = weightInputs[member.id];
        if (!inputVal) return;
        const weight = parseFloat(inputVal);
        if (isNaN(weight) || weight <= 0) {
            toast({ title: "Invalid weight", variant: "destructive" });
            return;
        }

        setSubmittingId(member.id);
        try {
            const res = await recordWeighIn.mutateAsync({
                memberId: member.id,
                clubId: club!.id,
                weight,
                notes: "Bulk entry",
                recordedBy: "owner",
                previousWeight: member.currentWeight ?? null,
                startingWeight: member.startingWeight ?? 0,
                targetWeight: member.targetWeight ?? 0,
                existingBadges: member.badges || [],
                totalWeighIns: member.totalWeighIns || 0,
            });

            setResults(prev => ({ ...prev, [member.id]: res }));

            // Clear input after a short delay
            setTimeout(() => {
                setWeightInputs(prev => {
                    const next = { ...prev };
                    delete next[member.id];
                    return next;
                });
            }, 3000);

            if (res.newBadges.length > 0) {
                toast({ title: `🎉 ${member.name} earned new milestone badges!` });
            }
        } catch (err: any) {
            toast({ title: "Error saving", description: err.message, variant: "destructive" });
        } finally {
            setSubmittingId(null);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white md:bg-black/50 md:flex flex-col md:items-end">
            <div className="w-full h-full md:w-[600px] bg-white md:h-screen md:shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Scale className="w-5 h-5 text-emerald-600" />
                            Record Weigh-Ins
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">Today: {format(new Date(), "MMM d, yyyy")}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5 text-slate-500" />
                    </Button>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-slate-50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search active members..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                    {filteredMembers.map((m) => {
                        const loading = submittingId === m.id;
                        const result = results[m.id];
                        const showResult = !!result;

                        return (
                            <div key={m.id} className="bg-white border rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3 flex-1">
                                    {m.photo ? (
                                        <img src={m.photo} alt={m.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-bold text-sm text-slate-800">{m.name}</p>
                                        <p className="text-xs text-slate-500">
                                            Last: {m.currentWeight ? `${m.currentWeight} kg` : "N/A"}
                                            <span className="mx-1">•</span>
                                            {m.lastWeighIn?.toDate() ? format(m.lastWeighIn.toDate(), "MMM d") : "Never"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                                    {showResult ? (
                                        <div className="flex items-center gap-3 text-sm font-semibold animate-fade-in py-2 px-1">
                                            <Check className="w-4 h-4 text-emerald-600" /> Saved
                                            {result.change !== null && (
                                                <span className={`px-2 py-1 rounded border flex items-center gap-1 ${result.change > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : result.change < 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                                    {result.change > 0 ? <ArrowDown className="w-3 h-3" /> : result.change < 0 ? <ArrowUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                                                    {Math.abs(result.change)} kg
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    placeholder="Weight"
                                                    className="w-24 pr-6"
                                                    value={weightInputs[m.id] || ""}
                                                    onChange={(e) => setWeightInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                                                    disabled={loading}
                                                    step="0.1"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(m)}
                                                disabled={loading || !weightInputs[m.id]}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                {loading ? "..." : "Save"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-12 text-slate-500 text-sm">
                            No members found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
