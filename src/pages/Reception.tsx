import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, addDoc, updateDoc, doc, Timestamp, limit, getDoc, setDoc } from "firebase/firestore";
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
import { useTodaysSpecials, getStockBadgeInfo, getTodayStr, type TodaysSpecialItem } from "@/hooks/useTodaysSpecial";

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
                    collection(db, `clubs/${clubId}/announcements`),
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
                    collection(db, `clubs/${clubId}/menu`),
                    where("isAvailableToday", "==", true)
                )
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        },
        refetchInterval: 120000,
    });

    const { specials } = useTodaysSpecials(clubId);

    return (
        <div className="reception-card">
            <h2 className="reception-card-title">
                <div className="reception-card-title-icon">🥤</div>
                Today's Menu
            </h2>
            {isLoading ? (
                <div className="text-gray-400 py-4">Loading...</div>
            ) : items.length === 0 ? (
                <div className="py-4 text-gray-400">
                    Menu not set yet for today
                </div>
            ) : (
                <div className="flex flex-col">
                    {items.map((item) => {
                        const special = specials[item.id];
                        const badge = getStockBadgeInfo(special);
                        const isSoldOut = special?.stockType === "limited" && (special?.remainingStock ?? 0) <= 0;
                        return (
                            <div key={item.id} className="menu-item-row" style={{ opacity: isSoldOut ? 0.5 : 1 }}>
                                <span className="menu-item-name" style={{ textDecoration: isSoldOut ? "line-through" : "none" }}>
                                    • {item.name}
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {badge && (
                                        <span style={{
                                            display: "inline-block",
                                            padding: "2px 8px",
                                            borderRadius: 99,
                                            fontSize: 11,
                                            fontWeight: 700,
                                            background: badge.cls === "sold-out" ? "#f0f0f0" : badge.cls === "low-stock" ? "#fde8e8" : "#d8f3dc",
                                            color: badge.cls === "sold-out" ? "#9ca3af" : badge.cls === "low-stock" ? "#c0392b" : "#2d6a4f",
                                        }}>
                                            {badge.label}
                                        </span>
                                    )}
                                    <span className="menu-item-price">₹{item.price}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
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
            <div className="weighin-card">
                <div className="weighin-icon text-white">⚖️</div>
                <div className="flex-1">
                    <h3 className="weighin-title">Today is Weigh-in Day!</h3>
                    <p className="weighin-sub">Ask staff to record your weight</p>
                </div>
                <Button
                    onClick={() => setModalOpen(true)}
                    className="rounded-xl text-white font-bold px-6"
                    style={{ backgroundColor: GREEN }}
                >
                    Start
                </Button>
                {modalOpen && (
                    <WeighInModal clubId={clubId} onClose={() => setModalOpen(false)} />
                )}
            </div>
        );
    }

    // Not a weigh-in day — show motivational card
    const next = getNextWeighInDate(weighInDays);
    const nextDateStr = next
        ? next.date.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
        : "—";

    return (
        <div className="weighin-card">
            <div className="weighin-icon text-white">💪</div>
            <div>
                <h3 className="weighin-title">Next Weigh-in: {next.dayName}</h3>
                <p className="weighin-sub">Keep going! Results are coming</p>
            </div>
        </div>
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
                    collection(db, `clubs/${clubId}/members`),
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
            await setDoc(doc(db, `clubs/${clubId}/members/${selectedMember.id}/weighIns`, "wl_" + Date.now()), {
                memberId: selectedMember.id,
                memberName: selectedMember.name,
                clubId,
                weight: newWeight,
                date: Timestamp.now(),  // use Timestamp for consistency
                previousWeight,
                change,
                notes,
                recordedBy: "owner",
                createdAt: Timestamp.now(),
            });

            // Update member's currentWeight
            await updateDoc(doc(db, `clubs/${clubId}/members`, selectedMember.id), {
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
    { id: "visitor" as ModalType, emoji: "📝", label: "Check In Member", sub: "New Visitor Enrollment" },
    { id: "volunteer" as ModalType, emoji: "🙋", label: "Volunteer Login", sub: "Staff Attendance" },
    { id: "feedback" as ModalType, emoji: "💬", label: "Leave Feedback", sub: "Tell us how we did" },
    { id: "about" as ModalType, emoji: "ℹ️", label: "About Club", sub: "Club Info & Hours" },
];

export default function Reception() {
    const { club } = useClubContext();
    const [activeModal, setActiveModal] = useState<ModalType>(null);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const dateStr = clock.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" });
    const timeStr = clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    return (
        <div className="reception-landscape-root">
            {/* Rotate prompt — shown via CSS media query when device is portrait */}
            <div className="landscape-rotate-prompt">
                <div style={{ fontSize: 72, marginBottom: 24, transform: "rotate(90deg)", display: "inline-block" }}>&#x21bb;</div>
                <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Please Rotate Your Device</div>
                <div style={{ fontSize: 15, opacity: 0.7 }}>Reception display works in landscape mode</div>
            </div>

            <div className="reception-page">
                {club?.id && <AnnouncementBanner clubId={club.id} />}

                <div className="reception-header">
                    <div className="reception-header-left">
                        <div className="reception-logo">
                            {club?.logo ? <img src={club.logo} alt={club.name} className="w-full h-full object-cover rounded-xl" /> : "🌿"}
                        </div>
                        <div>
                            <div className="reception-club-name">{club?.name || "Magic Nutrition Club"}</div>
                            <div className="reception-subtitle">Reception</div>
                        </div>
                    </div>
                    <div className="reception-time">
                        <div className="reception-clock">{timeStr}</div>
                        <div className="reception-date">{dateStr}</div>
                    </div>
                </div>

                <div className="reception-body">
                    <div className="reception-main">
                        {club?.id && <TodaysShakes clubId={club.id} />}
                        {club?.id && <WeighInSection clubId={club.id} />}
                    </div>

                    <div className="reception-sidebar">
                        <div className="reception-card">
                            <h2 className="reception-card-title">
                                <div className="reception-card-title-icon">⚡</div>
                                Quick Actions
                            </h2>
                            {ACTION_BUTTONS.map((btn) => (
                                <button
                                    key={btn.id}
                                    onClick={() => setActiveModal(btn.id)}
                                    className={`quick-action-btn ${btn.id === 'visitor' ? 'primary' : ''}`}
                                >
                                    <div className="quick-action-icon">{btn.emoji}</div>
                                    <div>
                                        <div className="quick-action-text">{btn.label}</div>
                                        <div className="quick-action-sub">{btn.sub}</div>
                                    </div>
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
        </div>
    );
}



