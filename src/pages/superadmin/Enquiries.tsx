import { useState, useMemo } from "react";
import {
    Search,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    CheckSquare,
    Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useEnquiries, useUpdateEnquiryStatus, exportEnquiriesToCSV } from "@/hooks/superadmin/useEnquiries";
import { useAllClubs } from "@/hooks/useSuperAdmin";
import type { Enquiry } from "@/types/firestore";
import { Timestamp } from "firebase/firestore";

// ─── Status badge colors ──────────────────────────────────────────────────

const statusColors: Record<Enquiry["status"], string> = {
    new: "border-blue-200 bg-blue-50 text-blue-700",
    contacted: "border-yellow-200 bg-yellow-50 text-yellow-700",
    converted: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(ts: { toDate?: () => Date } | null | undefined) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Global Enquiries Page ────────────────────────────────────────────────

export default function Enquiries() {
    const { toast } = useToast();
    const { data: enquiries, isLoading } = useEnquiries();
    const { data: clubs } = useAllClubs();
    const updateStatus = useUpdateEnquiryStatus();

    const [search, setSearch] = useState("");
    const [filterClub, setFilterClub] = useState("all");
    const [filterStatus, setFilterStatus] = useState<Enquiry["status"] | "all">("all");
    const [filterFrom, setFilterFrom] = useState("");
    const [filterTo, setFilterTo] = useState("");
    const [filterReferredBy, setFilterReferredBy] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const clubMap = useMemo(() => {
        const m: Record<string, string> = {};
        clubs?.forEach((c) => { m[c.id] = c.name; });
        return m;
    }, [clubs]);

    const filtered = useMemo(() => {
        if (!enquiries) return [];
        let list = [...enquiries];

        if (filterClub !== "all") list = list.filter((e) => e.clubId === filterClub);
        if (filterStatus !== "all") list = list.filter((e) => e.status === filterStatus);
        if (filterReferredBy.trim()) {
            const q = filterReferredBy.toLowerCase();
            list = list.filter((e) => e.referredBy?.toLowerCase().includes(q));
        }
        if (filterFrom) {
            const from = new Date(filterFrom);
            list = list.filter((e) => e.createdAt instanceof Timestamp && e.createdAt.toDate() >= from);
        }
        if (filterTo) {
            const to = new Date(filterTo);
            to.setHours(23, 59, 59, 999);
            list = list.filter((e) => e.createdAt instanceof Timestamp && e.createdAt.toDate() <= to);
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                (e) =>
                    e.name.toLowerCase().includes(q) ||
                    e.phone.includes(q) ||
                    e.email?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [enquiries, filterClub, filterStatus, filterFrom, filterTo, filterReferredBy, search]);

    function toggleSelect(id: string) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filtered.map((e) => e.id)));
        }
    }

    async function bulkMarkContacted() {
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((id) => updateStatus.mutateAsync({ enquiryId: id, status: "contacted" })));
        setSelectedIds(new Set());
        toast({ title: `${ids.length} enquiries marked as contacted.` });
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">All Enquiries</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {filtered.length} enquiries
                        {enquiries && filtered.length !== enquiries.length ? ` (filtered from ${enquiries.length})` : ""}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => exportEnquiriesToCSV(filtered, "all-enquiries.csv")}
                    disabled={!filtered.length}
                >
                    Export CSV
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search name, phone, email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={filterClub} onValueChange={setFilterClub}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Clubs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Clubs</SelectItem>
                            {clubs?.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as Enquiry["status"] | "all")}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Referred by…"
                        value={filterReferredBy}
                        onChange={(e) => setFilterReferredBy(e.target.value)}
                    />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex items-center gap-2">
                        <Label>From</Label>
                        <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="w-40" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>To</Label>
                        <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="w-40" />
                    </div>
                    {(filterFrom || filterTo || filterClub !== "all" || filterStatus !== "all" || filterReferredBy || search) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearch(""); setFilterClub("all"); setFilterStatus("all");
                                setFilterFrom(""); setFilterTo(""); setFilterReferredBy("");
                            }}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200">
                    <span className="text-sm font-medium text-violet-700">{selectedIds.size} selected</span>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs border-violet-300 text-violet-700 hover:bg-violet-100"
                        onClick={bulkMarkContacted}
                        disabled={updateStatus.isPending}
                    >
                        Mark as Contacted
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-violet-600"
                        onClick={() => setSelectedIds(new Set())}
                    >
                        Clear selection
                    </Button>
                </div>
            )}

            {/* Table */}
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No enquiries match your filters.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border overflow-hidden">
                    {/* Header row */}
                    <div className="hidden lg:grid lg:grid-cols-[32px_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-3 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <button onClick={toggleSelectAll} className="flex items-center">
                            {selectedIds.size === filtered.length && filtered.length > 0
                                ? <CheckSquare className="w-4 h-4 text-violet-600" />
                                : <Square className="w-4 h-4" />}
                        </button>
                        <span>Name</span>
                        <span>Club</span>
                        <span>Phone</span>
                        <span>WhatsApp</span>
                        <span>Date</span>
                        <span>Status</span>
                        <span></span>
                    </div>

                    <div className="divide-y">
                        {filtered.map((e) => (
                            <div key={e.id}>
                                <div
                                    className="grid grid-cols-1 lg:grid-cols-[32px_1.5fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 lg:gap-3 px-4 py-3 items-center hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
                                >
                                    <button
                                        className="hidden lg:flex items-center"
                                        onClick={(ev) => { ev.stopPropagation(); toggleSelect(e.id); }}
                                    >
                                        {selectedIds.has(e.id)
                                            ? <CheckSquare className="w-4 h-4 text-violet-600" />
                                            : <Square className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                    <div>
                                        <p className="text-sm font-medium">{e.name}</p>
                                        {e.referredBy && <p className="text-xs text-muted-foreground">via {e.referredBy}</p>}
                                    </div>
                                    <span className="text-xs text-muted-foreground truncate hidden lg:block">{clubMap[e.clubId] ?? e.clubId}</span>
                                    <span className="text-sm hidden lg:block">{e.phone}</span>
                                    <span className="text-sm text-muted-foreground hidden lg:block">{e.whatsapp ?? "—"}</span>
                                    <span className="text-xs text-muted-foreground hidden lg:block">{formatDate(e.createdAt as { toDate?: () => Date })}</span>
                                    <div onClick={(ev) => ev.stopPropagation()}>
                                        <Select
                                            value={e.status}
                                            onValueChange={(v) => updateStatus.mutate({ enquiryId: e.id, status: v as Enquiry["status"] })}
                                        >
                                            <SelectTrigger className="h-7 text-xs w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {(["new", "contacted", "converted", "rejected"] as const).map((s) => (
                                                    <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(ev) => { ev.stopPropagation(); setExpandedId(expandedId === e.id ? null : e.id); }}>
                                        {expandedId === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </div>

                                {expandedId === e.id && (
                                    <div className="px-4 pb-4 bg-gray-50 border-t">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
                                            {[
                                                ["Club", clubMap[e.clubId] ?? e.clubId],
                                                ["Phone", e.phone],
                                                ["WhatsApp", e.whatsapp],
                                                ["Email", e.email],
                                                ["Address", e.address],
                                                ["Date of Birth", e.dob],
                                                ["Current Weight", e.currentWeight ? `${e.currentWeight} kg` : undefined],
                                                ["Target Weight", e.targetWeight ? `${e.targetWeight} kg` : undefined],
                                                ["Health Conditions", e.healthConditions],
                                                ["Referred By", e.referredBy],
                                                ["Status", e.status],
                                                ["Date", formatDate(e.createdAt as { toDate?: () => Date })],
                                            ]
                                                .filter(([, v]) => v)
                                                .map(([label, value]) => (
                                                    <div key={String(label)}>
                                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                                                        <p className="text-sm mt-0.5 capitalize">{String(value)}</p>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// Small Label helper used in filter row
function Label({ children }: { children: React.ReactNode }) {
    return <span className="text-sm text-muted-foreground whitespace-nowrap">{children}</span>;
}
