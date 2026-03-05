import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, Timestamp, limit, getDoc } from "firebase/firestore";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { db } from "@/lib/firebase";
import { useClubContext } from "@/lib/clubDetection";
import VolunteerModal from "@/components/reception/VolunteerModal";
import FeedbackModal from "@/components/reception/FeedbackModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import type { Product, Announcement, User } from "@/types/firestore";

const GREEN = "#2d9653";
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function todayStr() {
    return new Date().toISOString().slice(0, 10);
}

function isTodayAnnouncement(ann: Announcement): boolean {
    const created = ann.createdAt?.toDate?.();
    if (!created) return false;
    return created.toISOString().slice(0, 10) === todayStr();
}

function AnnouncementBanner({ clubId }: { clubId: string }) {
    const { data: announcements = [] } = useQuery({
        queryKey: ["reception-announcements", clubId, todayStr()],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "announcements"),
                    where("clubId", "==", clubId),
                    where("isActive", "==", true),
                    orderBy("createdAt", "desc")
                )
            );
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() } as Announcement))
                .filter(isTodayAnnouncement);
        },
        refetchInterval: 60000,
    });

    if (!announcements.length) return null;

    const highestPriority = announcements.reduce((acc, ann) => {
        if (acc === "urgent" || ann.priority === "urgent") return "urgent";
        if (acc === "important" || ann.priority === "important") return "important";
        return "normal";
    }, "normal");

    const priorityStyles: Record<string, string> = {
        normal: "bg-green-600 text-white",
        important: "bg-amber-400 text-amber-900",
        urgent: "bg-red-500 text-white",
    };
    const style = priorityStyles[highestPriority] ?? priorityStyles.normal;

    return (
        <div className={`${style} px-6 py-3 flex items-center gap-3 overflow-hidden`}>
            <span className="text-lg shrink-0">📢</span>
            <div className="overflow-hidden w-full flex">
                <div className="font-black text-sm whitespace-nowrap animate-marquee flex gap-16">
                    {announcements.map(ann => (
                        <div key={ann.id} className="inline-flex items-center">
                            <span className="font-bold mr-2 uppercase tracking-wide opacity-90">
                                {ann.priority === "urgent" ? "🚨 " : ann.priority === "important" ? "⚠️ " : ""}
                                {ann.title}:
                            </span>
                            <span className="font-medium">{ann.message}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function TodaysShakes({ clubId }: { clubId: string }) {
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["reception-shakes", clubId],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "products"),
                    where("clubId", "==", clubId),
                    where("isAvailableToday", "==", true)
                )
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        },
        refetchInterval: 120000,
    });

    const gridClass =
        items.length === 1
            ? "flex justify-center"
            : items.length === 2
                ? "grid grid-cols-2 gap-4"
                : items.length === 3
                    ? "grid grid-cols-3 gap-4"
                    : "grid grid-cols-2 lg:grid-cols-4 gap-4";

    return (
        <section className="px-6 py-5">
            <h2 className="text-2xl font-black mb-4" style={{ color: GREEN }}>
                🥤 Today's Special
            </h2>
            {isLoading ? (
                <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-lg">
                    Menu not set yet for today
                </div>
            ) : (
                <div className={gridClass}>
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-3xl border-2 shadow-lg overflow-hidden flex flex-col items-center"
                            style={{ borderColor: `${GREEN}40` }}
                        >
                            {item.photo ? (
                                <img
                                    src={item.photo}
                                    alt={item.name}
                                    className="w-full object-cover"
                                    style={{ height: items.length === 1 ? 200 : 140 }}
                                />
                            ) : (
                                <div
                                    className="w-full flex items-center justify-center bg-green-50"
                                    style={{
                                        height: items.length === 1 ? 200 : 140,
                                        fontSize: items.length === 1 ? 80 : 56,
                                    }}
                                >
                                    🥤
                                </div>
                            )}
                            <div className="p-4 text-center w-full">
                                <p className="font-black text-gray-800 text-lg leading-tight">{item.name}</p>
                                <p className="font-bold mt-1" style={{ color: GREEN }}>
                                    ₹{item.price}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

// ─── Weigh-in Section ─────────────────────────────────────────────────────

function getNextWeighInDate(weighInDays: string[]): { dayName: string; date: Date } | null {
    if (!weighInDays.length) return null;
    const today = new Date();
    const todayIndex = today.getDay();
    const dayIndices = weighInDays
        .map(d => DAY_NAMES.indexOf(d.toLowerCase()))
        .filter(i => i >= 0)
        .sort((a, b) => a - b);
    if (!dayIndices.length) return null;

    // Find next day after today
    let nextIndex = dayIndices.find(i => i > todayIndex);
    let daysAhead: number;
    if (nextIndex !== undefined) {
        daysAhead = nextIndex - todayIndex;
    } else {
        nextIndex = dayIndices[0];
        daysAhead = 7 - todayIndex + nextIndex;
    }

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysAhead);
    return { dayName: DAY_NAMES[nextIndex], date: nextDate };
}

function WeighInSection({ clubId }: { clubId: string }) {
    const [weighInDays, setWeighInDays] = useState<string[] | null>(null);
    const [loaded, setLoaded] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchDays = async () => {
            try {
                const clubDoc = await getDoc(doc(db, "clubs", clubId));
                if (clubDoc.exists()) {
                    const data = clubDoc.data();
                    setWeighInDays(data.weighInDays ?? []);
                }
            } catch {
                setWeighInDays([]);
            }
            setLoaded(true);
        };
        fetchDays();
    }, [clubId]);

    if (!loaded || !weighInDays || weighInDays.length === 0) return null;

    const todayDay = DAY_NAMES[new Date().getDay()];
    const isWeighInDay = weighInDays.map(d => d.toLowerCase()).includes(todayDay);

    if (isWeighInDay) {
        return (
            <section className="px-6 py-4">
                <div
                    className="rounded-3xl border-2 p-6"
                    style={{ backgroundColor: "#f0fdf4", borderColor: `${GREEN}40` }}
                >
                    <h3 className="text-xl font-black mb-2" style={{ color: GREEN }}>
                        ⚖️ Today is Weigh-in Day!
                    </h3>
                    <p className="text-gray-600 mb-4">Ask staff to record your weight</p>
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="rounded-xl text-white font-bold px-6"
                        style={{ backgroundColor: GREEN }}
                    >
                        Start Weigh-in
                    </Button>
                </div>
                {modalOpen && (
                    <WeighInModal clubId={clubId} onClose={() => setModalOpen(false)} />
                )}
            </section>
        );
    }

    // Not a weigh-in day — show motivational card
    const next = getNextWeighInDate(weighInDays);
    const nextDateStr = next
        ? next.date.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
        : "—";

    return (
        <section className="px-6 py-4">
            <div
                className="rounded-3xl border-2 p-6 text-center"
                style={{ backgroundColor: "#f0fdf4", borderColor: `${GREEN}40` }}
            >
                <h3 className="text-xl font-black mb-2" style={{ color: GREEN }}>
                    💪 Keep Going!
                </h3>
                <p className="text-gray-600">
                    Next weigh-in is on
                </p>
                <p className="text-lg font-black mt-1" style={{ color: GREEN }}>
                    {nextDateStr}
                </p>
                <p className="text-gray-500 mt-2 text-sm">
                    Stay consistent — results are coming! 🌟
                </p>
            </div>
        </section>
    );
}

function WeighInModal({ clubId, onClose }: { clubId: string; onClose: () => void }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [members, setMembers] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [weight, setWeight] = useState("");
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState<{ change: number; name: string } | null>(null);

    const searchMembers = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            // Search by name (case-insensitive client-side filtering)
            const snap = await getDocs(
                query(
                    collection(db, "users"),
                    where("clubId", "==", clubId),
                    where("role", "==", "member"),
                    limit(50)
                )
            );
            const q = searchQuery.trim().toLowerCase();
            const results = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as User))
                .filter(m => m.name.toLowerCase().includes(q) || (m.memberId ?? "").toLowerCase().includes(q));
            setMembers(results);
        } catch {
            setMembers([]);
        }
        setSearching(false);
    };

    const handleSave = async () => {
        if (!selectedMember || !weight) return;
        setSaving(true);
        try {
            const newWeight = parseFloat(weight);
            const previousWeight = (selectedMember as any).currentWeight ?? null;
            const change = previousWeight != null ? previousWeight - newWeight : null;

            // Save to weighIns collection
            await addDoc(collection(db, "weighIns"), {
                memberId: selectedMember.id,
                memberName: selectedMember.name,
                clubId,
                weight: newWeight,
                date: todayStr(),
                previousWeight,
                change,
                notes,
                recordedBy: "owner",
                createdAt: Timestamp.now(),
            });

            // Update member's currentWeight
            await updateDoc(doc(db, "users", selectedMember.id), {
                currentWeight: newWeight,
                lastWeighIn: Timestamp.now(),
            });

            setResult({ change: change ?? 0, name: selectedMember.name });

            // Auto close after 3 seconds
            setTimeout(() => {
                setResult(null);
                setSelectedMember(null);
                setWeight("");
                setNotes("");
            }, 3000);
        } catch (err) {
            console.error("Weigh-in error:", err);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div className="flex justify-between items-start">
                    <h2 className="text-xl font-black text-gray-800">⚖️ Weigh-in</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
                </div>

                {result ? (
                    <div className="text-center py-6 space-y-3">
                        <div className="text-5xl">
                            {result.change > 0 ? "🎉" : result.change < 0 ? "💪" : "⚖️"}
                        </div>
                        <p className="font-black text-xl text-gray-800">{result.name}</p>
                        <p className="text-lg font-bold" style={{ color: result.change > 0 ? GREEN : result.change < 0 ? "#dc2626" : "#6b7280" }}>
                            {result.change > 0 ? `Lost ${result.change.toFixed(1)}kg 🎉` :
                                result.change < 0 ? `Gained ${Math.abs(result.change).toFixed(1)}kg` :
                                    "No change"}
                        </p>
                        <p className="text-xs text-gray-400">Auto-closing in 3 seconds...</p>
                    </div>
                ) : selectedMember ? (
                    <div className="space-y-4">
                        {/* Selected member card */}
                        <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3 border border-green-200">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ backgroundColor: GREEN }}>
                                {selectedMember.name[0]?.toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{selectedMember.name}</p>
                                <p className="text-xs text-gray-500">{(selectedMember as any).memberId ?? "—"}</p>
                                {(selectedMember as any).currentWeight != null && (
                                    <p className="text-xs text-gray-500">
                                        Last weight: {(selectedMember as any).currentWeight}kg
                                        {selectedMember.lastWeighIn && ` • ${selectedMember.lastWeighIn?.toDate?.()?.toLocaleDateString() ?? ""}`}
                                    </p>
                                )}
                            </div>
                            <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Weight (kg)</label>
                            <Input
                                type="number"
                                step="0.1"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                placeholder="e.g. 68.5"
                                className="h-12 text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Notes (optional)</label>
                            <Input
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Any notes..."
                            />
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={!weight || saving}
                            className="w-full rounded-xl text-white font-bold h-12"
                            style={{ backgroundColor: GREEN }}
                        >
                            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : "💾 Save Weigh-in"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">Search for a member by name or member ID</p>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && searchMembers()}
                                    placeholder="Name or member ID..."
                                    className="pl-9"
                                />
                            </div>
                            <Button onClick={searchMembers} disabled={searching} variant="outline" className="rounded-xl">
                                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                            </Button>
                        </div>
                        {members.length > 0 && (
                            <div className="max-h-60 overflow-y-auto space-y-2">
                                {members.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMember(m)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-green-50 transition-colors text-left"
                                    >
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: GREEN }}>
                                            {m.name[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-gray-800 truncate">{m.name}</p>
                                            <p className="text-xs text-gray-400">{(m as any).memberId ?? "—"}</p>
                                        </div>
                                        {(m as any).currentWeight != null && (
                                            <span className="text-xs text-gray-400">{(m as any).currentWeight}kg</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                        {members.length === 0 && searchQuery && !searching && (
                            <p className="text-center text-sm text-gray-400 py-4">No members found</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Existing Modals ──────────────────────────────────────────────────────

interface AboutModalProps {
    onClose: () => void;
}

function AboutModal({ onClose }: AboutModalProps) {
    const { club } = useClubContext();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-4" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div className="flex justify-between items-start">
                    <h2 className="text-2xl font-black text-gray-800">ℹ️ About Us</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
                </div>
                <div className="space-y-3 text-gray-700">
                    {club?.logo && <img src={club.logo} alt={club.name} className="h-16 object-contain rounded-xl" />}
                    <h3 className="text-xl font-black" style={{ color: GREEN }}>{club?.name}</h3>
                    {club?.address && <p className="text-sm">📍 {club.address}</p>}
                    {(club as any)?.phone && <p className="text-sm">📞 {(club as any).phone}</p>}
                    {(club as any)?.hours && <p className="text-sm">🕐 {(club as any).hours}</p>}
                    {club?.tagline && <p className="text-sm italic text-gray-500">"{club.tagline}"</p>}
                </div>
            </div>
        </div>
    );
}

function VisitorQRModal({ onClose }: { onClose: () => void }) {
    const { club } = useClubContext();
    const joinUrl = `${window.location.origin}/join?clubId=${club?.id ?? ""}`;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center space-y-5" style={{ fontFamily: "Nunito, sans-serif" }}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-gray-800">📝 New Visitor</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">✕</button>
                </div>
                <p className="text-gray-500 text-sm">Ask the visitor to scan this QR with their phone</p>
                <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-green-200">
                        <QRCodeSVG value={joinUrl} size={200} />
                    </div>
                </div>
                <p className="text-xs text-gray-400 break-all">{joinUrl}</p>
                <p className="font-medium text-gray-700">They'll fill out an enquiry form on their phone 📱</p>
            </div>
        </div>
    );
}

type ModalType = "volunteer" | "visitor" | "feedback" | "about" | null;

const ACTION_BUTTONS = [
    { id: "volunteer" as ModalType, emoji: "🙋", label: "Volunteer Login/Logout", bg: "#2d9653" },
    { id: "visitor" as ModalType, emoji: "📝", label: "New Visitor", bg: "#3b82f6" },
    { id: "feedback" as ModalType, emoji: "💬", label: "Feedback", bg: "#f59e0b" },
    { id: "about" as ModalType, emoji: "ℹ️", label: "About Club", bg: "#64748b" },
];

export default function Reception() {
    const { club } = useClubContext();
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    return (
        <div
            className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-white"
            style={{ fontFamily: "Nunito, sans-serif" }}
        >
            {/* Announcement banner */}
            {club?.id && <AnnouncementBanner clubId={club.id} />}

            {/* Club header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white border-b shadow-sm">
                {club?.logo && <img src={club.logo} alt={club.name} className="h-12 object-contain rounded-xl" />}
                <div>
                    <h1 className="text-2xl font-black" style={{ color: GREEN }}>{club?.name ?? "Club"}</h1>
                    <p className="text-sm text-gray-500">Reception Display</p>
                </div>
            </div>

            {/* Main content - fills remaining height */}
            <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
                {/* Today's Shakes + Weigh-in - left/top */}
                <div className="flex-1 overflow-y-auto">
                    {club?.id && <TodaysShakes clubId={club.id} />}
                    {club?.id && <WeighInSection clubId={club.id} />}
                </div>

                {/* Action buttons - right/bottom */}
                <div className="lg:w-[340px] p-6 border-l bg-white flex flex-col justify-center">
                    <h2 className="text-lg font-black text-gray-700 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {ACTION_BUTTONS.map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => setActiveModal(btn.id)}
                                className="flex flex-col items-center justify-center gap-2 rounded-3xl text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                                style={{
                                    backgroundColor: btn.bg,
                                    minHeight: 130,
                                    padding: "1.25rem",
                                }}
                            >
                                <span className="text-4xl">{btn.emoji}</span>
                                <span className="text-sm text-center leading-tight">{btn.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {activeModal === "volunteer" && <VolunteerModal onClose={() => setActiveModal(null)} />}
            {activeModal === "visitor" && <VisitorQRModal onClose={() => setActiveModal(null)} />}
            {activeModal === "feedback" && <FeedbackModal onClose={() => setActiveModal(null)} />}
            {activeModal === "about" && <AboutModal onClose={() => setActiveModal(null)} />}
        </div>
    );
}

