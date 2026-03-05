import { useState, useMemo, useCallback } from "react";
import {
    Search, ChevronDown, ChevronUp, UserPlus, UserCheck, X,
    Download, Star, Filter, AlertTriangle
} from "lucide-react";
import { collection, addDoc, getDocs, query, where, Timestamp, updateDoc, doc, deleteField } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    useEnquiries, useUnreadEnquiryCount, useUpdateEnquiryStatus,
} from "@/hooks/owner/useEnquiries";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { generateMemberId, generatePrefixFromName } from "@/utils/generateMemberId";
import { useClubFeedback } from "@/hooks/useFeedback";
import type { Enquiry, Feedback } from "@/types/firestore";

type StatusFilter = "all" | Enquiry["status"];
type TabType = "enquiries" | "feedback";

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

// ─── Feedback Tab ────────────────────────────────────────────────────────────

function StarDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <Star
                    key={s}
                    className="w-4 h-4"
                    fill={s <= rating ? "#f59e0b" : "none"}
                    stroke={s <= rating ? "#f59e0b" : "#d1d5db"}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}

function FeedbackTab() {
    const { data: feedbackList = [], isLoading } = useClubFeedback();
    const [ratingFilter, setRatingFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const filtered = useMemo(() => {
        let list = feedbackList;
        if (ratingFilter !== "all") list = list.filter((f) => f.rating === parseInt(ratingFilter));
        if (categoryFilter !== "all") list = list.filter((f) => f.category === categoryFilter);
        return list;
    }, [feedbackList, ratingFilter, categoryFilter]);

    const avgRating = feedbackList.length
        ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
        : null;

    const exportCSV = () => {
        const rows = [
            ["Name", "Member ID", "Rating", "Category", "Message", "Date"],
            ...filtered.map((f) => [
                f.name ?? "",
                f.memberId ?? "",
                f.rating,
                f.category,
                f.message ?? "",
                f.createdAt?.toDate?.()?.toLocaleString() ?? "",
            ]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "feedback.csv";
        a.click();
    };

    if (isLoading) return (
        <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Summary */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                    {avgRating && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                            <Star className="w-5 h-5 fill-amber-400 stroke-amber-400" />
                            <span className="font-black text-lg text-amber-700">{avgRating}</span>
                            <span className="text-sm text-amber-600">avg ({feedbackList.length})</span>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger className="w-[120px] rounded-xl">
                            <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            {[5, 4, 3, 2, 1].map((r) => (
                                <SelectItem key={r} value={String(r)}>{r} ⭐</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[140px] rounded-xl">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {["Service", "Shakes", "Cleanliness", "Staff", "Timing", "Other"].map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={exportCSV} className="rounded-xl">
                        <Download className="w-4 h-4 mr-1" />CSV
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-2xl border bg-gray-50 p-12 text-center">
                    <p className="text-gray-500 font-semibold">No feedback yet</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((f) => (
                        <div key={f.id} className="rounded-2xl border bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-800">
                                            {f.name || "Anonymous"}
                                        </span>
                                        {f.memberId && (
                                            <Badge variant="outline" className="text-xs">{f.memberId}</Badge>
                                        )}
                                        <Badge variant="secondary" className="text-xs bg-gray-100">
                                            {f.category}
                                        </Badge>
                                    </div>
                                    <StarDisplay rating={f.rating} />
                                    {f.message && (
                                        <p className="text-sm text-gray-600 mt-1">{f.message}</p>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 whitespace-nowrap">
                                    {f.createdAt?.toDate?.()?.toLocaleDateString() ?? "—"}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Accept as Visiting Member modal ────────────────────────────────────────

interface AcceptModalProps {
    enquiry: Enquiry;
    onClose: () => void;
    onDone: (whatsappUrl: string) => void;
}

function AcceptVisitingModal({ enquiry, onClose, onDone }: AcceptModalProps) {
    const { club } = useClubContext();
    const { toast } = useToast();
    const updateStatus = useUpdateEnquiryStatus();
    const [loading, setLoading] = useState(false);

    const handleAccept = useCallback(async () => {
        if (!club) return;
        setLoading(true);
        try {
            const prefix = club.memberIdPrefix || generatePrefixFromName(club.name);
            const generatedMemberId = await generateMemberId(club.id, prefix);
            const newDocId = "member_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            const now = Timestamp.now();

            // Build treePath
            let treePath = newDocId;
            if (enquiry.referredByMemberId) {
                const snap = await getDocs(
                    query(collection(db, "users"), where("memberId", "==", enquiry.referredByMemberId))
                );
                if (!snap.empty) {
                    const parentData = snap.docs[0].data();
                    treePath = (parentData.treePath ?? snap.docs[0].id) + "/" + newDocId;
                }
            }

            // Create Firebase Auth account if email + password available
            const enquiryPassword = (enquiry as any).password;
            if (enquiry.email && enquiryPassword) {
                try {
                    await createUserWithEmailAndPassword(auth, enquiry.email, enquiryPassword);
                } catch (authErr: any) {
                    // If email already exists in auth, continue with member creation
                    if (authErr.code !== 'auth/email-already-in-use') {
                        throw authErr;
                    }
                }
            } else if (!enquiry.email) {
                toast({
                    title: "⚠️ No email provided",
                    description: "Member cannot log in until email is added to their profile.",
                    variant: "destructive",
                });
            }

            // Create user doc with ALL enquiry fields
            await addDoc(collection(db, "users"), {
                id: newDocId,
                name: enquiry.name,
                phone: enquiry.phone,
                whatsapp: enquiry.whatsapp ?? "",
                email: enquiry.email ?? "",
                address: enquiry.address ?? "",
                photo: "",
                role: "member",
                clubId: club.id,
                parentUserId: null,
                treePath,
                membershipTier: null,
                membershipStart: null,
                membershipEnd: null,
                membershipPlanId: null,
                status: "active",
                dob: enquiry.dob ? Timestamp.fromDate(new Date(enquiry.dob)) : null,
                anniversary: null,
                qrCode: "",
                isClubOwner: false,
                ownedClubId: null,
                originalClubId: club.id,
                referredBy: enquiry.referredBy ?? null,
                referredByMemberId: enquiry.referredByMemberId ?? null,
                memberType: "visiting",
                memberId: generatedMemberId,
                currentWeight: enquiry.currentWeight ?? null,
                targetWeight: enquiry.targetWeight ?? null,
                healthConditions: enquiry.healthConditions ?? "",
                passwordChanged: false,
                createdAt: now,
                updatedAt: now,
            });

            // Create wallet
            await addDoc(collection(db, "wallets"), {
                userId: newDocId,
                clubId: club.id,
                currencyName: club.currencyName,
                balance: 0,
                lastUpdated: now,
            });

            // Remove password from enquiry doc (don't store password in Firestore)
            if (enquiryPassword) {
                try {
                    await updateDoc(doc(db, "enquiries", enquiry.id), {
                        password: deleteField(),
                    });
                } catch {
                    // Non-critical — continue even if password removal fails
                }
            }

            // Update enquiry status
            await updateStatus.mutateAsync({ enquiryId: enquiry.id, status: "converted" });

            // WhatsApp URL
            const msg = encodeURIComponent(
                `🌿 Welcome to ${club.name}!\n\nHi ${enquiry.name}, you've been registered as a *Visiting Member*.\n\n*Your Member ID:* ${generatedMemberId}\n\nWe're excited to have you with us! Come visit us soon. 💚`
            );
            const phone = (enquiry.whatsapp ?? enquiry.phone ?? "").replace(/\D/g, "");
            const waUrl = `https://wa.me/${phone}?text=${msg}`;
            onDone(waUrl);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [club, enquiry, updateStatus, onDone, toast]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-black text-gray-800">Accept as Visiting Member</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                    <p className="font-bold text-gray-800">{enquiry.name}</p>
                    <p className="text-sm text-gray-600">📞 {enquiry.phone}</p>
                    {enquiry.referredByMemberId && (
                        <p className="text-sm text-gray-600">🔗 Referred by: <strong>{enquiry.referredByMemberId}</strong></p>
                    )}
                </div>
                <p className="text-sm text-gray-500">
                    This will create a <strong>Visiting Member</strong> account with an auto-generated Member ID, and open a WhatsApp welcome message.
                </p>
                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
                    <Button
                        onClick={handleAccept}
                        disabled={loading}
                        className="flex-1 rounded-xl text-white"
                        style={{ backgroundColor: "#2d9653" }}
                    >
                        <UserCheck className="w-4 h-4 mr-2" />
                        {loading ? "Creating..." : "✅ Accept"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Enquiries Page ─────────────────────────────────────────────────────

export default function Enquiries() {
    const { club } = useClubContext();
    const { toast } = useToast();
    const { data: enquiries, isLoading } = useEnquiries(club?.id ?? null);
    const { data: unreadCount } = useUnreadEnquiryCount(club?.id ?? null);
    const updateStatus = useUpdateEnquiryStatus();
    const [tab, setTab] = useState<TabType>("enquiries");
    const [filter, setFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});
    const [acceptingEnquiry, setAcceptingEnquiry] = useState<Enquiry | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        if (!enquiries) return [];
        let list = enquiries;
        if (filter !== "all") list = list.filter((e) => e.status === filter);
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter(
                (e) => e.name.toLowerCase().includes(q) || e.phone?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [enquiries, filter, search]);

    const handleStatusChange = async (enquiryId: string, status: Enquiry["status"], notesOverride?: string) => {
        const notes = notesOverride ?? notesMap[enquiryId];
        try {
            await updateStatus.mutateAsync({ enquiryId, status, ...(notes !== undefined && { notes }) });
            toast({ title: "Status updated" });
        } catch {
            toast({ title: "Failed to update", variant: "destructive" });
        }
    };

    const handleReject = async () => {
        if (!rejectingId) return;
        try {
            await updateStatus.mutateAsync({ enquiryId: rejectingId, status: "rejected" });
            toast({ title: "Enquiry rejected" });
        } catch {
            toast({ title: "Failed to reject", variant: "destructive" });
        } finally {
            setRejectingId(null);
        }
    };

    const handleAcceptDone = (waUrl: string) => {
        setAcceptingEnquiry(null);
        toast({ title: "Visiting member created! Opening WhatsApp..." });
        window.open(waUrl, "_blank");
    };

    const handleExpand = async (e: Enquiry, isExpanded: boolean) => {
        setExpandedId(isExpanded ? null : e.id);
        if (!isExpanded && e.clubId === "{{CLUB_ID}}" && club) {
            try {
                // Silently auto-correct bad data
                await updateDoc(doc(db, "enquiries", e.id), { clubId: club.id });
                updateStatus.mutate({ enquiryId: e.id, status: e.status }); // Triggers a cache invalidate
            } catch (err) {
                console.error("Auto-fix failed:", err);
            }
        }
    };

    const filters: { value: StatusFilter; label: string }[] = [
        { value: "all", label: "All" },
        ...STATUS_OPTIONS,
    ];

    return (
        <div className="px-6 md:px-8 py-8 max-w-[900px] mx-auto" style={{ fontFamily: "'Nunito', sans-serif" }}>
            {/* Header & tabs */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black" style={{ color: "#1a2e1a" }}>
                        {tab === "enquiries" ? "Enquiries" : "Feedback"}
                    </h1>
                    {tab === "enquiries" && unreadCount != null && unreadCount > 0 && (
                        <Badge className="bg-blue-500">{unreadCount} new</Badge>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1 w-fit">
                {([{ value: "enquiries", label: "📋 Enquiries" }, { value: "feedback", label: "💬 Feedback" }] as const).map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${tab === t.value ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "feedback" ? (
                <FeedbackTab />
            ) : (
                <>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or phone"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 rounded-xl"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {filters.map((f) => (
                                <Button
                                    key={f.value}
                                    variant={filter === f.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setFilter(f.value)}
                                    className="rounded-xl"
                                    style={filter === f.value ? { backgroundColor: "#2d9653" } : undefined}
                                >
                                    {f.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
                        </div>
                    ) : !filtered.length ? (
                        <div className="rounded-2xl border bg-gray-50 p-12 text-center">
                            <p className="text-gray-500 font-semibold">
                                {enquiries?.length ? "No enquiries match your filters" : "No enquiries yet"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map((e) => {
                                const isExpanded = expandedId === e.id;
                                const notes = notesMap[e.id] ?? (e as Enquiry & { notes?: string }).notes ?? "";
                                return (
                                    <div key={e.id} className="rounded-2xl border bg-white overflow-hidden">
                                        <div
                                            className="p-4 flex items-center justify-between gap-3 cursor-pointer"
                                            onClick={() => handleExpand(e, isExpanded)}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-900">{e.name}</span>
                                                    <StatusBadge status={e.status} />
                                                    {e.referredByMemberId && (
                                                        <Badge variant="outline" className="text-xs text-purple-700 border-purple-300">
                                                            🔗 {e.referredByMemberId}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">{e.phone}</p>
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
                                            <div className="px-4 pb-4 pt-0 border-t space-y-4" onClick={(ev) => ev.stopPropagation()}>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-4">
                                                    {e.email && <div><span className="text-gray-500">Email:</span> {e.email}</div>}
                                                    {e.address && <div><span className="text-gray-500">Address:</span> {e.address}</div>}
                                                    {e.dob && <div><span className="text-gray-500">DOB:</span> {e.dob}</div>}
                                                    {e.currentWeight != null && <div><span className="text-gray-500">Weight:</span> {e.currentWeight} kg</div>}
                                                    {e.healthConditions && <div className="sm:col-span-2"><span className="text-gray-500">Health:</span> {e.healthConditions}</div>}
                                                    {e.referredBy && <div><span className="text-gray-500">Referred by:</span> {e.referredBy}</div>}
                                                    {e.referredByMemberId && <div><span className="text-gray-500">Referrer ID:</span> <strong className="text-purple-700">{e.referredByMemberId}</strong></div>}
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Notes</label>
                                                    <Textarea
                                                        value={notes}
                                                        onChange={(ev) => setNotesMap((m) => ({ ...m, [e.id]: ev.target.value }))}
                                                        placeholder="Add notes..."
                                                        rows={2}
                                                        className="mt-1 rounded-xl"
                                                    />
                                                </div>

                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <Select
                                                        value={e.status}
                                                        onValueChange={(v) => handleStatusChange(e.id, v as Enquiry["status"])}
                                                    >
                                                        <SelectTrigger className="w-[140px] rounded-xl">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_OPTIONS.map((o) => (
                                                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleStatusChange(e.id, e.status, notes)}
                                                        disabled={updateStatus.isPending}
                                                        className="rounded-xl"
                                                    >
                                                        Save notes
                                                    </Button>

                                                    {/* Accept enquiry → creates Visiting Member */}
                                                    {e.status !== "converted" && e.status !== "rejected" && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setAcceptingEnquiry(e)}
                                                            className="rounded-xl text-white"
                                                            style={{ backgroundColor: "#2d9653" }}
                                                        >
                                                            <UserCheck className="w-4 h-4 mr-1" />
                                                            ✅ Accept
                                                        </Button>
                                                    )}

                                                    {/* Reject */}
                                                    {e.status !== "rejected" && e.status !== "converted" && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => setRejectingId(e.id)}
                                                            className="rounded-xl"
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            ❌ Reject
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Accept Modal */}
            {acceptingEnquiry && (
                <AcceptVisitingModal
                    enquiry={acceptingEnquiry}
                    onClose={() => setAcceptingEnquiry(null)}
                    onDone={handleAcceptDone}
                />
            )}

            {/* Reject confirmation */}
            <AlertDialog open={!!rejectingId} onOpenChange={(o) => !o && setRejectingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject this enquiry?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the enquiry as rejected. You can always change it back later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} className="bg-red-500 hover:bg-red-600">
                            Reject
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
