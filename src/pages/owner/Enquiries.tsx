import { useState, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    useEnquiries,
    useUnreadEnquiryCount,
    useUpdateEnquiryStatus,
} from "@/hooks/owner/useEnquiries";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import type { Enquiry } from "@/types/firestore";

type StatusFilter = "all" | Enquiry["status"];

const STATUS_OPTIONS: { value: Enquiry["status"]; label: string }[] = [
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "converted", label: "Converted" },
    { value: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: Enquiry["status"] }) {
    const map: Record<Enquiry["status"], string> = {
        new: "bg-blue-100 text-blue-800",
        contacted: "bg-amber-100 text-amber-800",
        converted: "bg-green-100 text-green-800",
        rejected: "bg-red-100 text-red-800",
    };
    return (
        <Badge variant="secondary" className={map[status]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

export default function Enquiries() {
    const { club } = useClubContext();
    const { toast } = useToast();
    const { data: enquiries, isLoading } = useEnquiries(club?.id ?? null);
    const { data: unreadCount } = useUnreadEnquiryCount(club?.id ?? null);
    const updateStatus = useUpdateEnquiryStatus();
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        if (!enquiries) return [];
        let list = enquiries;
        if (filter !== "all") list = list.filter((e) => e.status === filter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (e) =>
                    e.name.toLowerCase().includes(q) ||
                    e.phone?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [enquiries, filter, search]);

    const handleStatusChange = async (
        enquiryId: string,
        status: Enquiry["status"],
        notesOverride?: string
    ) => {
        const notes = notesOverride ?? notesMap[enquiryId];
        try {
            await updateStatus.mutateAsync({
                enquiryId,
                status,
                ...(notes !== undefined && { notes }),
            });
            toast({ title: "Status updated" });
        } catch {
            toast({ title: "Failed to update", variant: "destructive" });
        }
    };

    const handleConvert = () => {
        toast({ title: "Redirecting to Add Member..." });
    };

    const filters: { value: StatusFilter; label: string }[] = [
        { value: "all", label: "All" },
        ...STATUS_OPTIONS,
    ];

    return (
        <div
            className="px-6 md:px-8 py-8 max-w-[900px] mx-auto"
            style={{ fontFamily: "'Nunito', sans-serif" }}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black" style={{ color: "#1a2e1a" }}>
                        Enquiries
                    </h1>
                    {unreadCount != null && unreadCount > 0 && (
                        <Badge className="bg-blue-500">{unreadCount} new</Badge>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search by name or phone"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {filters.map((f) => (
                        <Button
                            key={f.value}
                            variant={filter === f.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(f.value)}
                            style={
                                filter === f.value
                                    ? { backgroundColor: "#2d9653" }
                                    : undefined
                            }
                        >
                            {f.label}
                        </Button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                </div>
            ) : !filtered.length ? (
                <div className="rounded-2xl border bg-gray-50 p-12 text-center">
                    <p className="text-gray-500 font-semibold">
                        {enquiries?.length
                            ? "No enquiries match your filters"
                            : "No enquiries yet"}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((e) => {
                        const isExpanded = expandedId === e.id;
                        const notes = notesMap[e.id] ?? (e as Enquiry & { notes?: string }).notes ?? "";
                        return (
                            <div
                                key={e.id}
                                className="rounded-2xl border bg-white overflow-hidden"
                            >
                                <div
                                    className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                                    onClick={() =>
                                        setExpandedId(isExpanded ? null : e.id)
                                    }
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-gray-900">
                                                {e.name}
                                            </span>
                                            <StatusBadge status={e.status} />
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            {e.phone}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {e.createdAt?.toDate?.()?.toLocaleDateString?.() ?? "—"}
                                            {e.referredBy && ` • Referred by ${e.referredBy}`}
                                        </p>
                                    </div>
                                    {isExpanded ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                    )}
                                </div>

                                {isExpanded && (
                                    <div
                                        className="px-4 pb-4 pt-0 border-t space-y-4"
                                        onClick={(ev) => ev.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-4">
                                            {e.email && <div><span className="text-gray-500">Email:</span> {e.email}</div>}
                                            {e.address && <div><span className="text-gray-500">Address:</span> {e.address}</div>}
                                            {e.dob && <div><span className="text-gray-500">DOB:</span> {e.dob}</div>}
                                            {e.currentWeight != null && <div><span className="text-gray-500">Weight:</span> {e.currentWeight} kg</div>}
                                            {e.healthConditions && <div className="sm:col-span-2"><span className="text-gray-500">Health:</span> {e.healthConditions}</div>}
                                            {e.referredBy && <div><span className="text-gray-500">Referred by:</span> {e.referredBy}</div>}
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium text-gray-700">
                                                Notes
                                            </label>
                                            <Textarea
                                                value={notes}
                                                onChange={(ev) =>
                                                    setNotesMap((m) => ({
                                                        ...m,
                                                        [e.id]: ev.target.value,
                                                    }))
                                                }
                                                placeholder="Add notes..."
                                                rows={2}
                                                className="mt-1"
                                            />
                                        </div>

                                        <div className="flex flex-wrap gap-2 items-center">
                                            <Select
                                                value={e.status}
                                                onValueChange={(v) =>
                                                    handleStatusChange(e.id, v as Enquiry["status"])
                                                }
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {STATUS_OPTIONS.map((o) => (
                                                        <SelectItem
                                                            key={o.value}
                                                            value={o.value}
                                                        >
                                                            {o.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleStatusChange(e.id, e.status, notes)
                                                }
                                                disabled={updateStatus.isPending}
                                            >
                                                Save notes
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleConvert}
                                                style={{ backgroundColor: "#2d9653" }}
                                                className="text-white"
                                            >
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Convert to Member
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
