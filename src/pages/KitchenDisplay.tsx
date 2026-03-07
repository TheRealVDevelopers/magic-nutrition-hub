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
import { useCombinedMenu, useToggleGlobalItem, useGlobalMenuItems, useAddGlobalMenuItem, useUpdateGlobalMenuItem } from "@/hooks/useGlobalMenu";
import type { CombinedMenuItem, GlobalMenuItem } from "@/hooks/useGlobalMenu";
import { GlobalMenuDialog } from "@/components/shared/GlobalMenuDialog";
import { useToast } from "@/hooks/use-toast";

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

// Rotate prompt — shown via CSS when device is in portrait mode
function RotatePrompt() {
    return (
        <div className="landscape-rotate-prompt">
            <div style={{ fontSize: 72, marginBottom: 24, transform: "rotate(90deg)", display: "inline-block" }}>↻</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Please Rotate Your Device</div>
            <div style={{ fontSize: 15, opacity: 0.7 }}>Kitchen display works in landscape mode</div>
        </div>
    );
}

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

    return (
        <div className="kitchen-landscape-root">
            <RotatePrompt />
            <KitchenApp onLock={logout} />
        </div>
    );
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

    const { orders, loading } = useKitchenOrders();
    const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "preparing").length;

    const dateStr = clock.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
    const timeStr = clock.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const tabs: { key: Tab; label: string }[] = [
        { key: "orders", label: "ORDERS" },
        { key: "specials", label: "TODAY'S SPECIAL" },
        { key: "inventory", label: "INV" },
    ];

    return (
        <div className="min-h-screen flex flex-col font-sans" style={{ minHeight: '100svh' }}>
            <div className="kitchen-header">
                <div className="flex items-center gap-3">
                    <span className="text-3xl">🍳</span>
                    <div className="kitchen-header-title">{club?.name || "Kitchen"}</div>
                </div>
                <div className="kitchen-clock">{timeStr}</div>
            </div>
            <div className="kitchen-stats-bar">
                <div>{dateStr}</div>
                <div>{pendingCount} pending orders</div>
            </div>

            <div className="kitchen-body flex-1">
                <div className="kitchen-tabs">
                    {tabs.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`kitchen-tab ${tab === t.key ? "active" : ""}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === "orders" && <OrdersTab orders={orders} loading={loading} clubId={club?.id ?? ""} />}
                {tab === "specials" && <SpecialsTab />}
                {tab === "inventory" && <InventoryTab />}
            </div>

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

function OrdersTab({ orders, loading, clubId }: { orders: Order[]; loading: boolean; clubId: string }) {
    const updateStatus = useUpdateOrderStatus();
    const prevCountRef = useRef(orders.length);

    // Sound on new order arriving
    useEffect(() => {
        if (!loading && orders.length > prevCountRef.current) {
            playNewOrder();
        }
        prevCountRef.current = orders.length;
    }, [orders.length, loading]);

    // Include both pending and preparing in the main orders list for kitchen workers to mark.
    const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");

    const handleStatus = useCallback((orderId: string, currentStatus: string) => {
        // If it's pending, jump straight to prepared since they just have one "Mark Ready" button
        updateStatus.mutate({ clubId, orderId, newStatus: "served" });
        playOrderReady();
    }, [updateStatus, clubId]);

    if (loading) {
        return (
            <div className="orders-grid">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
            </div>
        );
    }

    if (activeOrders.length === 0) {
        return (
            <div className="kitchen-empty">
                <div className="kitchen-empty-icon">✅</div>
                <h3>All Caught Up</h3>
                <p>No pending orders right now</p>
                <p>Kitchen is ready for next order</p>
            </div>
        );
    }

    return (
        <div className="orders-grid">
            {activeOrders.map((o) => (
                <OrderCard
                    key={o.id}
                    order={o}
                    onAction={() => handleStatus(o.id, o.status)}
                    isUpdating={updateStatus.isPending}
                />
            ))}
        </div>
    );
}

function OrderCard({ order, onAction, isUpdating }: {
    order: Order;
    onAction: () => void;
    isUpdating: boolean;
}) {
    const timeStr = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "";
    return (
        <div className="order-card">
            <div className="order-card-header">
                <div>
                    <div className="order-number">#{order.id.slice(-3).toUpperCase()}</div>
                    <div className="order-member">{order.memberName}</div>
                </div>
                <div className="order-time">{timeStr}</div>
            </div>

            <div className="order-items">
                {order.items.map((item, i) => (
                    <div key={i} className="order-item">
                        <span>• {item.productName}</span>
                        <span>x{item.quantity}</span>
                    </div>
                ))}
            </div>

            <div className="order-card-footer">
                <button
                    className="btn-mark-ready"
                    onClick={onAction}
                    disabled={isUpdating}
                >
                    {isUpdating ? "UPDATING…" : "✓ MARK READY"}
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: TODAY'S SPECIAL
// ═══════════════════════════════════════════════════════════════════════════

function SpecialsTab() {
    const { club } = useClubContext();
    const { data: products = [], isLoading: loading } = useCombinedMenu(club?.id ?? null);
    const toggleGlobal = useToggleGlobalItem();
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];
    const availableCount = products.filter((p) => p.isAvailableToday).length;

    const handleToggle = async (product: CombinedMenuItem) => {
        setTogglingId(product.id);
        try {
            if (product.source === "global") {
                await toggleGlobal.mutateAsync({ clubId: club!.id, itemId: product.id, isAvailableToday: !product.isAvailableToday });
            } else {
                await updateDoc(doc(db, `clubs/${club!.id}/menu`, product.id), { isAvailableToday: !product.isAvailableToday });
            }
        } catch { /* ignore */ }
        setTogglingId(null);
    };

    const handleBulk = async (available: boolean) => {
        const promises: Promise<any>[] = [];
        for (const p of products) {
            if (p.source === "global") {
                promises.push(toggleGlobal.mutateAsync({ clubId: club!.id, itemId: p.id, isAvailableToday: available }));
            } else {
                promises.push(updateDoc(doc(db, `clubs/${club!.id}/menu`, p.id), { isAvailableToday: available }));
            }
        }
        await Promise.allSettled(promises);
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
                                    <p className="text-xs text-gray-400">{p.price ? `₹${p.price}` : "—"}</p>
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

function InventoryTab() {
    const { club } = useClubContext();
    const { data: globalMenu = [], isLoading } = useGlobalMenuItems();
    const { toast } = useToast();

    // Global Menu edit state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<GlobalMenuItem | null>(null);

    const addItem = useAddGlobalMenuItem();
    const updateItem = useUpdateGlobalMenuItem();

    const openAdd = () => {
        setEditItem(null);
        setDialogOpen(true);
    };

    const openEdit = (item: GlobalMenuItem) => {
        setEditItem(item);
        setDialogOpen(true);
    };

    if (isLoading) {
        return (
            <div className="p-4 space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-black" style={{ color: GREEN }}>Global Inventory</h2>
                    <p className="text-xs text-gray-500">Shared product catalog for all clubs</p>
                </div>
                <Button size="sm" className="font-bold text-white text-xs" style={{ background: GREEN }} onClick={openAdd}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
            </div>

            {/* Items list */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {globalMenu.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border p-3 flex flex-col items-center text-center shadow-sm">
                        <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mb-2 overflow-hidden border">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                                <CookingPot className="w-8 h-8 text-gray-300" />
                            )}
                        </div>
                        <h3 className="font-bold text-sm text-gray-800 leading-tight mb-1">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide bg-gray-100 px-2 py-0.5 rounded-full mb-3">
                            {item.category}
                        </p>

                        <div className="mt-auto w-full pt-2 border-t flex justify-center">
                            <Button size="sm" variant="ghost" className="h-8 w-full text-xs font-bold text-gray-500 hover:text-gray-900" onClick={() => openEdit(item)}>
                                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {globalMenu.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="text-sm font-bold">No global inventory items yet</p>
                    <p className="text-xs mt-1">Tap "Add Item" to create the first one</p>
                </div>
            )}

            <GlobalMenuDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                item={editItem}
                addItem={addItem}
                updateItem={updateItem}
                toast={toast}
            />
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
