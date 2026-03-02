import { useState, useEffect, useRef, useCallback } from "react";
import { useClubContext } from "@/lib/clubDetection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import PinGate from "@/components/PinGate";
import { usePinAccess } from "@/hooks/usePinAccess";
import {
    useKitchenOrders,
    useUpdateOrderStatus,
    useTodayOrdersSummary,
} from "@/hooks/useOrders";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Lock,
    ChefHat,
    CookingPot,
    Plus,
    Minus,
    Pencil,
    Trash2,
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import type { Order, Product } from "@/types/firestore";

const GREEN = "#2d9653";
const FONT = "'Nunito', sans-serif";

// ─── Sound helpers ───────────────────────────────────────────────────────

function playTone(freq: number, duration = 0.4) {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch {
        /* AudioContext not available */
    }
}
const playNewOrder = () => playTone(600, 0.35);
const playOrderReady = () => playTone(900, 0.5);

// ─── Time helpers ────────────────────────────────────────────────────────

function minutesAgo(ts: any): number {
    if (!ts?.toDate) return 0;
    return Math.floor((Date.now() - ts.toDate().getTime()) / 60000);
}

function elapsedBadge(mins: number) {
    if (mins < 5) return { text: `${mins}m`, cls: "bg-green-100 text-green-700" };
    if (mins < 10) return { text: `${mins}m`, cls: "bg-amber-100 text-amber-700" };
    return { text: `${mins}m`, cls: "bg-red-100 text-red-700" };
}

// ─── Inventory type ──────────────────────────────────────────────────────

interface InventoryItem {
    id: string;
    clubId: string;
    name: string;
    unit: string;
    currentStock: number;
    minThreshold: number;
    notes: string;
    lastUpdated: Timestamp;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT — PIN gate wrapper
// ═══════════════════════════════════════════════════════════════════════════

export default function KitchenDisplay() {
    const { isVerified, isLoading, clubName, clubLogo, verify, logout } = usePinAccess("kitchen");

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fffe" }}>
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: GREEN }} />
            </div>
        );
    }

    if (!isVerified) {
        return <PinGate type="kitchen" clubName={clubName} clubLogo={clubLogo} pinLength={6} isLoading={false} onVerify={verify} />;
    }

    return <KitchenApp onLock={logout} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN KITCHEN APP
// ═══════════════════════════════════════════════════════════════════════════

type Tab = "orders" | "specials" | "inventory";

function KitchenApp({ onLock }: { onLock: () => void }) {
    const { club } = useClubContext();
    const [tab, setTab] = useState<Tab>("orders");
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const tabs: { key: Tab; label: string }[] = [
        { key: "orders", label: "Orders" },
        { key: "specials", label: "Today's Special" },
        { key: "inventory", label: "Inventory" },
    ];

    return (
        <div className="min-h-screen flex flex-col" style={{ fontFamily: FONT, background: "#f8fffe" }}>
            {/* Tab bar */}
            <div className="flex-shrink-0 bg-white border-b" style={{ borderColor: "#e0f0e9" }}>
                <div className="flex">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className="flex-1 py-3.5 text-center text-sm font-bold transition-colors relative"
                            style={{
                                color: tab === t.key ? GREEN : "#9ca3af",
                                background: tab === t.key ? "#f0faf4" : "transparent",
                            }}
                        >
                            {t.label}
                            {tab === t.key && (
                                <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t" style={{ background: GREEN }} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {tab === "orders" && <OrdersTab clock={clock} clubName={club?.name ?? ""} />}
                {tab === "specials" && <SpecialsTab />}
                {tab === "inventory" && <InventoryTab />}
            </div>

            {/* Lock button */}
            <button
                onClick={onLock}
                className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 backdrop-blur border text-xs font-bold text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
                style={{ borderColor: "#e0f0e9" }}
            >
                <Lock className="w-3.5 h-3.5" /> Lock
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: ORDERS
// ═══════════════════════════════════════════════════════════════════════════

function OrdersTab({ clock, clubName }: { clock: Date; clubName: string }) {
    const { orders, loading } = useKitchenOrders();
    const { summary } = useTodayOrdersSummary();
    const updateStatus = useUpdateOrderStatus();
    const [summaryOpen, setSummaryOpen] = useState(false);
    const [recentlyReady, setRecentlyReady] = useState<Set<string>>(new Set());
    const prevCountRef = useRef(orders.length);

    // Sound on new order arriving
    useEffect(() => {
        if (!loading && orders.length > prevCountRef.current) {
            playNewOrder();
        }
        prevCountRef.current = orders.length;
    }, [orders.length, loading]);

    const pending = orders.filter((o) => o.status === "pending");
    const preparing = orders.filter((o) => o.status === "preparing");
    const completedCount = (summary?.statusCounts?.served ?? 0);

    const handleStatus = useCallback((orderId: string, newStatus: "preparing" | "served") => {
        updateStatus.mutate({ orderId, newStatus });
        if (newStatus === "served") {
            playOrderReady();
            setRecentlyReady((prev) => new Set(prev).add(orderId));
            setTimeout(() => setRecentlyReady((prev) => { const s = new Set(prev); s.delete(orderId); return s; }), 30000);
        }
    }, [updateStatus]);

    const dateStr = clock.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    const timeStr = clock.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b" style={{ borderColor: "#e0f0e9" }}>
                <div className="min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: GREEN }}>{clubName}</p>
                    <p className="text-xs text-gray-400">{dateStr} &middot; <span className="font-mono">{timeStr}</span></p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-xl" style={{ background: "#f0faf4" }}>
                        <span className="text-2xl font-black" style={{ color: GREEN }}>{completedCount}</span>
                        <span className="text-xs font-bold text-gray-500 ml-1.5">shakes today</span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="font-bold text-xs"
                        style={{ borderColor: "#d0e8d8", color: GREEN }}
                        onClick={() => setSummaryOpen(true)}
                    >
                        Summary <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </div>
            </div>

            {/* Orders grid */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4 p-4">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
            ) : pending.length === 0 && preparing.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: "#e6f7ed" }}>
                        <ChefHat className="w-10 h-10" style={{ color: GREEN }} />
                    </div>
                    <p className="text-xl font-black text-gray-800">All caught up!</p>
                    <p className="text-sm text-gray-400 mt-1">No pending orders right now</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 flex-1">
                    {/* Pending column */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <h2 className="text-sm font-black text-amber-700">PENDING ({pending.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {pending.map((o) => (
                                <OrderCard
                                    key={o.id}
                                    order={o}
                                    onAction={() => handleStatus(o.id, "preparing")}
                                    actionLabel="Start Preparing"
                                    isUpdating={updateStatus.isPending}
                                />
                            ))}
                            {pending.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No pending orders</p>}
                        </div>
                    </div>

                    {/* Preparing column */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                            <h2 className="text-sm font-black text-blue-700">PREPARING ({preparing.length})</h2>
                        </div>
                        <div className="space-y-3">
                            {preparing.map((o) => (
                                <OrderCard
                                    key={o.id}
                                    order={o}
                                    onAction={() => handleStatus(o.id, "served")}
                                    actionLabel="Mark Ready"
                                    isUpdating={updateStatus.isPending}
                                    flash={recentlyReady.has(o.id)}
                                />
                            ))}
                            {preparing.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Nothing preparing</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Summary panel */}
            <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Daily Summary</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <Row label="Total Orders" value={String(summary?.totalOrders ?? 0)} />
                        <Row label="Shakes Done" value={String(completedCount)} />
                        <Row label="Revenue" value={`₹${summary?.totalRevenue ?? 0}`} />
                        <Row label="Most Ordered" value={summary?.mostPopular ?? "—"} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "#e0f0e9" }}>
            <span className="text-sm text-gray-500 font-medium">{label}</span>
            <span className="text-sm font-black">{value}</span>
        </div>
    );
}

function OrderCard({ order, onAction, actionLabel, isUpdating, flash }: {
    order: Order;
    onAction: () => void;
    actionLabel: string;
    isUpdating: boolean;
    flash?: boolean;
}) {
    const mins = minutesAgo(order.createdAt);
    const badge = elapsedBadge(mins);
    const initials = (order.memberName || "?")[0].toUpperCase();

    return (
        <div
            className={`bg-white rounded-2xl border p-4 space-y-3 transition-all duration-300 ${flash ? "ring-2 ring-green-400 bg-green-50" : ""}`}
            style={{ borderColor: "#e0f0e9", animation: "slideIn 0.3s ease-out" }}
        >
            <div className="flex items-center gap-3">
                {order.memberPhoto ? (
                    <img src={order.memberPhoto} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0 border" />
                ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm" style={{ background: GREEN }}>
                        {initials}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate" style={{ fontSize: 16 }}>{order.memberName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-400">#{order.id.slice(-4)}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 font-bold ${badge.cls}`}>{badge.text}</Badge>
                    </div>
                </div>
            </div>

            <ul className="space-y-1">
                {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.productName}</span>
                        <span className="text-gray-400 font-bold">x{item.quantity}</span>
                    </li>
                ))}
            </ul>

            <Button
                onClick={onAction}
                disabled={isUpdating}
                className="w-full font-bold text-white"
                style={{ background: GREEN, minHeight: 44 }}
            >
                {isUpdating ? "Updating…" : actionLabel}
            </Button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: TODAY'S SPECIAL
// ═══════════════════════════════════════════════════════════════════════════

function useClubProducts() {
    const { club } = useClubContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club) return;
        const q = query(collection(db, "products"), where("clubId", "==", club.id));
        const unsub = onSnapshot(q, (snap) => {
            setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [club]);

    return { products, loading };
}

function SpecialsTab() {
    const { products, loading } = useClubProducts();
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];
    const availableCount = products.filter((p) => p.isAvailableToday).length;

    const handleToggle = async (product: Product) => {
        setTogglingId(product.id);
        try {
            await updateDoc(doc(db, "products", product.id), { isAvailableToday: !product.isAvailableToday });
        } catch { /* ignore */ }
        setTogglingId(null);
    };

    const handleBulk = async (available: boolean) => {
        await Promise.all(products.map((p) => updateDoc(doc(db, "products", p.id), { isAvailableToday: available })));
    };

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div>
                <h2 className="text-lg font-black" style={{ color: GREEN }}>Today's Menu — {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Toggle items to mark available today</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="text-xs font-bold" style={{ borderColor: "#d0e8d8", color: GREEN }} onClick={() => handleBulk(true)}>
                    Mark All Available
                </Button>
                <Button size="sm" variant="outline" className="text-xs font-bold text-gray-500" onClick={() => handleBulk(false)}>
                    Mark All Unavailable
                </Button>
                <Badge className="ml-auto text-xs font-bold" style={{ background: "#e6f7ed", color: GREEN }}>
                    {availableCount} / {products.length} available
                </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p) => {
                    const available = p.isAvailableToday;
                    return (
                        <button
                            key={p.id}
                            onClick={() => handleToggle(p)}
                            disabled={togglingId === p.id}
                            className={`text-left rounded-2xl border-2 p-4 transition-all ${available ? "bg-white" : "bg-gray-50 opacity-60"}`}
                            style={{ borderColor: available ? GREEN : "#e5e7eb", minHeight: 48 }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="font-bold text-sm text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-400">₹{p.price}</p>
                                </div>
                                <Badge className={`text-[10px] font-bold flex-shrink-0 ${available ? "text-white" : "bg-gray-200 text-gray-500"}`}
                                    style={available ? { background: GREEN } : {}}>
                                    {available ? "ON" : "OFF"}
                                </Badge>
                            </div>
                        </button>
                    );
                })}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <CookingPot className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold">No menu items yet</p>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: INVENTORY
// ═══════════════════════════════════════════════════════════════════════════

function useInventory(clubId: string | null) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clubId) { setLoading(false); return; }
        const q = query(collection(db, "inventory"), where("clubId", "==", clubId));
        const unsub = onSnapshot(q, (snap) => {
            setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem)));
            setLoading(false);
        }, () => setLoading(false));
        return () => unsub();
    }, [clubId]);

    return { items, loading };
}

function InventoryTab() {
    const { club } = useClubContext();
    const { items, loading } = useInventory(club?.id ?? null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [form, setForm] = useState({ name: "", unit: "packets", currentStock: 0, minThreshold: 5, notes: "" });
    const [saving, setSaving] = useState(false);

    const lowStock = items.filter((i) => i.currentStock <= i.minThreshold && i.currentStock > 0);
    const outOfStock = items.filter((i) => i.currentStock <= 0);

    const openAdd = () => {
        setEditItem(null);
        setForm({ name: "", unit: "packets", currentStock: 0, minThreshold: 5, notes: "" });
        setDialogOpen(true);
    };

    const openEdit = (item: InventoryItem) => {
        setEditItem(item);
        setForm({ name: item.name, unit: item.unit, currentStock: item.currentStock, minThreshold: item.minThreshold, notes: item.notes });
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!club?.id || !form.name.trim()) return;
        setSaving(true);
        try {
            const data = { ...form, name: form.name.trim(), clubId: club.id, lastUpdated: Timestamp.now() };
            if (editItem) {
                await updateDoc(doc(db, "inventory", editItem.id), data);
            } else {
                await addDoc(collection(db, "inventory"), data);
            }
            setDialogOpen(false);
        } catch { /* ignore */ }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this item?")) return;
        await deleteDoc(doc(db, "inventory", id));
    };

    const adjustStock = async (item: InventoryItem, delta: number) => {
        const newVal = Math.max(0, item.currentStock + delta);
        await updateDoc(doc(db, "inventory", item.id), { currentStock: newVal, lastUpdated: Timestamp.now() });
    };

    if (loading) {
        return (
            <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-black" style={{ color: GREEN }}>Inventory</h2>
                <Button size="sm" className="font-bold text-white text-xs" style={{ background: GREEN }} onClick={openAdd}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
            </div>

            {/* Low stock alerts */}
            {(lowStock.length > 0 || outOfStock.length > 0) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle className="w-4 h-4" />
                        {lowStock.length + outOfStock.length} item{lowStock.length + outOfStock.length > 1 ? "s" : ""} need attention
                    </div>
                    <p className="text-xs text-amber-600 mt-0.5">
                        {[...outOfStock.map((i) => `${i.name} (OUT)`), ...lowStock.map((i) => `${i.name} (low)`)].join(", ")}
                    </p>
                </div>
            )}

            {/* Items list */}
            <div className="space-y-3">
                {items.map((item) => {
                    const pct = item.minThreshold > 0 ? Math.min(100, Math.round((item.currentStock / (item.minThreshold * 2)) * 100)) : 100;
                    const isLow = item.currentStock > 0 && item.currentStock <= item.minThreshold;
                    const isOut = item.currentStock <= 0;
                    const barColor = isOut ? "#ef4444" : isLow ? "#f59e0b" : GREEN;
                    return (
                        <div key={item.id} className="bg-white rounded-2xl border p-4" style={{ borderColor: "#e0f0e9" }}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-gray-900 truncate">{item.name}</p>
                                        {isOut && <Badge className="bg-red-100 text-red-700 text-[10px] font-bold">OUT OF STOCK</Badge>}
                                        {isLow && !isOut && <Badge className="bg-amber-100 text-amber-700 text-[10px] font-bold">LOW</Badge>}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.currentStock} / {item.minThreshold * 2} {item.unit}</p>
                                    <div className="w-full h-1.5 rounded-full bg-gray-100 mt-2">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => adjustStock(item, -1)} disabled={item.currentStock <= 0}>
                                        <Minus className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => adjustStock(item, 1)}>
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-gray-400" onClick={() => openEdit(item)}>
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-red-400" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-bold">No inventory items yet</p>
                    <p className="text-xs mt-1">Tap "Add Item" to track stock</p>
                </div>
            )}

            {/* Add/Edit dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>{editItem ? "Edit Item" : "Add Item"}</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div><Label className="text-xs">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Formula 1 Chocolate" /></div>
                        <div><Label className="text-xs">Unit</Label>
                            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {["kg", "L", "packets", "bottles", "scoops", "pieces", "other"].map((u) => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div><Label className="text-xs">Stock</Label><Input type="number" min={0} value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) || 0 })} /></div>
                            <div><Label className="text-xs">Min Threshold</Label><Input type="number" min={0} value={form.minThreshold} onChange={(e) => setForm({ ...form, minThreshold: Number(e.target.value) || 0 })} /></div>
                        </div>
                        <div><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" /></div>
                        <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full font-bold text-white" style={{ background: GREEN }}>
                            {saving ? "Saving…" : editItem ? "Update" : "Add Item"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Global animation ────────────────────────────────────────────────────

const styleSheet = document.createElement("style");
styleSheet.textContent = `
@keyframes slideIn {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}`;
if (!document.querySelector("[data-kitchen-animations]")) {
    styleSheet.setAttribute("data-kitchen-animations", "");
    document.head.appendChild(styleSheet);
}
