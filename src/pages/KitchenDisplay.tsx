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
    TrendingUp,
    Star,
} from "lucide-react";
import type { Order, Product } from "@/types/firestore";
import { useCombinedMenu, useToggleGlobalItem, useGlobalMenuItems, useAddGlobalMenuItem, useUpdateGlobalMenuItem } from "@/hooks/useGlobalMenu";
import type { CombinedMenuItem, GlobalMenuItem } from "@/hooks/useGlobalMenu";
import { GlobalMenuDialog } from "@/components/shared/GlobalMenuDialog";
import { useToast } from "@/hooks/use-toast";
import {
    useTodaysSpecials,
    useToggleTodaysSpecial,
    useSetSpecialStockType,
    useSetSpecialQuantity,
    getTodayStr,
    getStockBadgeInfo,
    type TodaysSpecialItem,
} from "@/hooks/useTodaysSpecial";

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
                {tab === "specials" && <SpecialsTab clubId={club?.id ?? ""} />}
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
// TAB 1: ORDERS + DAILY INSIGHTS DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

function OrdersTab({ orders, loading, clubId }: { orders: Order[]; loading: boolean; clubId: string }) {
    const updateStatus = useUpdateOrderStatus();
    const prevCountRef = useRef(orders.length);
    const { summary, orders: allTodayOrders } = useTodayOrdersSummary();
    const { specials } = useTodaysSpecials(clubId || null);

    // Sound on new order arriving
    useEffect(() => {
        if (!loading && orders.length > prevCountRef.current) {
            playNewOrder();
        }
        prevCountRef.current = orders.length;
    }, [orders.length, loading]);

    const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");

    const handleStatus = useCallback((orderId: string, currentStatus: string) => {
        updateStatus.mutate({ clubId, orderId, newStatus: "served" });
        playOrderReady();
    }, [updateStatus, clubId]);

    // Build product sold counts from today's orders
    const productSoldMap: Record<string, { name: string; sold: number; emoji?: string }> = {};
    allTodayOrders.filter(o => o.status === "served").forEach((o) => {
        o.items.forEach((item) => {
            if (!productSoldMap[item.productId]) {
                productSoldMap[item.productId] = { name: item.productName, sold: 0 };
            }
            productSoldMap[item.productId].sold += item.quantity;
        });
    });

    // Merge with specials for remaining stock
    const productRows = Object.entries(productSoldMap).map(([id, info]) => {
        const special = specials[id];
        return { id, ...info, special };
    }).sort((a, b) => b.sold - a.sold).slice(0, 8);

    const maxSold = productRows.length > 0 ? Math.max(...productRows.map(r => r.sold)) : 1;

    return (
        <div className="p-4 space-y-4">
            {/* ─── Daily Insights Dashboard ─── */}
            <div
                style={{
                    background: "linear-gradient(135deg, #f8fffe 0%, #e8f5ee 100%)",
                    borderRadius: 18,
                    border: "2px solid #d8f3dc",
                    padding: "16px 20px",
                    marginBottom: 16,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <TrendingUp style={{ width: 18, height: 18, color: GREEN }} />
                    <span style={{ fontWeight: 800, fontSize: 15, color: GREEN }}>Today's Insights</span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                        {new Date().toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" })}
                    </span>
                </div>

                {/* Stats Row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
                    {[
                        { label: "Orders", value: summary.totalOrders, emoji: "📋" },
                        { label: "Revenue", value: `₹${summary.totalRevenue}`, emoji: "💰" },
                        { label: "Avg Value", value: `₹${summary.avgOrderValue}`, emoji: "📊" },
                        { label: "Pending", value: summary.statusCounts.pending, emoji: "⏳" },
                    ].map((stat) => (
                        <div key={stat.label} style={{
                            background: "white",
                            borderRadius: 12,
                            padding: "10px 12px",
                            textAlign: "center",
                            border: "1.5px solid #e8f5ee",
                        }}>
                            <div style={{ fontSize: 18 }}>{stat.emoji}</div>
                            <div style={{ fontWeight: 900, fontSize: 18, color: "#1a3a2a", lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ fontWeight: 600, fontSize: 11, color: "#6b7280", marginTop: 2 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Product Breakdown */}
                {productRows.length > 0 && (
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            Product Breakdown
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {productRows.map((row) => {
                                const special = row.special;
                                const stockDisplay = (() => {
                                    if (!special) return null;
                                    if (special.stockType === "unlimited") return { text: "∞", color: "#2d9653", bg: "#d8f3dc" };
                                    if ((special.remainingStock ?? 0) <= 0) return { text: "SOLD OUT ⛔", color: "#9ca3af", bg: "#f0f0f0" };
                                    const r = special.remainingStock!;
                                    if (r <= 2) return { text: `${r} left 🟠`, color: "#c0392b", bg: "#fde8e8" };
                                    if (r <= 3) return { text: `${r} left 🟡`, color: "#b45309", bg: "#fef3c7" };
                                    return { text: `${r} left`, color: GREEN, bg: "#d8f3dc" };
                                })();
                                const pct = Math.round((row.sold / maxSold) * 100);
                                return (
                                    <div key={row.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                                        <div style={{ width: 110, fontWeight: 700, color: "#1a3a2a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {row.name}
                                        </div>
                                        <div style={{ flex: 1, height: 8, background: "#e8f5ee", borderRadius: 99, overflow: "hidden" }}>
                                            <div style={{ width: `${pct}%`, height: "100%", background: GREEN, borderRadius: 99, transition: "width 0.3s" }} />
                                        </div>
                                        <div style={{ width: 48, textAlign: "right", fontWeight: 700, color: "#1a3a2a", fontSize: 12 }}>
                                            {row.sold} sold
                                        </div>
                                        {stockDisplay && (
                                            <div style={{
                                                padding: "2px 8px",
                                                borderRadius: 99,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                background: stockDisplay.bg,
                                                color: stockDisplay.color,
                                                whiteSpace: "nowrap",
                                                minWidth: 52,
                                                textAlign: "center",
                                            }}>
                                                {stockDisplay.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {productRows.length === 0 && (
                    <div style={{ textAlign: "center", color: "#9ca3af", fontSize: 13, padding: "8px 0" }}>
                        No orders served yet today
                    </div>
                )}
            </div>

            {/* ─── Active Orders Grid ─── */}
            {loading ? (
                <div className="orders-grid">
                    {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
                </div>
            ) : activeOrders.length === 0 ? (
                <div className="kitchen-empty">
                    <div className="kitchen-empty-icon">✅</div>
                    <h3>All Caught Up</h3>
                    <p>No pending orders right now</p>
                    <p>Kitchen is ready for next order</p>
                </div>
            ) : (
                <div className="orders-grid">
                    {activeOrders.map((o) => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            onAction={() => handleStatus(o.id, o.status)}
                            isUpdating={updateStatus.isPending}
                            specials={specials}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({ order, onAction, isUpdating, specials }: {
    order: Order;
    onAction: () => void;
    isUpdating: boolean;
    specials: Record<string, TodaysSpecialItem>;
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
                {order.items.map((item, i) => {
                    const special = specials[item.productId];
                    const badgeInfo = getStockBadgeInfo(special);
                    return (
                        <div key={i} className="order-item">
                            <span>• {item.productName}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {badgeInfo && special?.stockType === "limited" && (
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "2px 6px",
                                        borderRadius: 99,
                                        background: badgeInfo.cls === "sold-out" ? "#f0f0f0" : badgeInfo.cls === "low-stock" ? "#fde8e8" : "#d8f3dc",
                                        color: badgeInfo.cls === "sold-out" ? "#9ca3af" : badgeInfo.cls === "low-stock" ? "#c0392b" : "#2d6a4f",
                                    }}>
                                        {badgeInfo.label}
                                    </span>
                                )}
                                <span>x{item.quantity}</span>
                            </div>
                        </div>
                    );
                })}
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
// TAB 2: TODAY'S SPECIAL — full rebuild with stock controls
// ═══════════════════════════════════════════════════════════════════════════

function SpecialsTab({ clubId }: { clubId: string }) {
    const { data: products = [], isLoading: loading } = useCombinedMenu(clubId || null);
    const { specials, loading: specialsLoading } = useTodaysSpecials(clubId || null);
    const toggleSpecial = useToggleTodaysSpecial();
    const setStockType = useSetSpecialStockType();
    const setQuantity = useSetSpecialQuantity();

    const todayStr = getTodayStr();
    const activeCount = Object.values(specials).filter(s => s.isActive).length;

    const dateDisplay = new Date().toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

    if (loading || specialsLoading) {
        return (
            <div className="p-4 space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
            </div>
        );
    }

    const handleToggle = async (product: CombinedMenuItem) => {
        if (!clubId) return;
        // Get raw itemId (strip global_ prefix if needed)
        const rawId = product.id.startsWith("global_") ? product.id.replace("global_", "") : product.id;
        const currentData = specials[rawId] ?? null;
        const emoji = (product as any).emoji || (product.category === "tea" ? "🍵" : product.category === "shake" || product.category === "drink" ? "🥤" : "🍽️");
        await toggleSpecial.mutateAsync({
            clubId,
            item: { id: rawId, name: product.name, category: product.category, imageUrl: product.imageUrl ?? null, emoji },
            currentData,
        });
    };

    const handleStockType = async (product: CombinedMenuItem, type: "unlimited" | "limited") => {
        if (!clubId) return;
        const rawId = product.id.startsWith("global_") ? product.id.replace("global_", "") : product.id;
        await setStockType.mutateAsync({ clubId, itemId: rawId, stockType: type, quantity: 10 });
    };

    const handleSetQuantity = async (product: CombinedMenuItem, qty: number) => {
        if (!clubId) return;
        const rawId = product.id.startsWith("global_") ? product.id.replace("global_", "") : product.id;
        await setQuantity.mutateAsync({ clubId, itemId: rawId, quantity: Math.max(1, qty) });
    };

    return (
        <div className="p-4 space-y-4" style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <div style={{ fontWeight: 900, fontSize: 17, color: GREEN }}>TODAY'S SPECIAL</div>
                    <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{dateDisplay} · {activeCount} items active</div>
                </div>
                <Badge style={{ background: "#e6f7ed", color: GREEN }} className="text-xs font-bold">
                    {activeCount} / {products.length} active
                </Badge>
            </div>

            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                Toggle items on/off and set stock for today. Resets automatically tomorrow.
            </p>

            {/* Item list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {products.map((product) => {
                    const rawId = product.id.startsWith("global_") ? product.id.replace("global_", "") : product.id;
                    const specialData = specials[rawId] ?? null;
                    const isOn = specialData?.isActive ?? false;
                    const stockType = specialData?.stockType ?? "unlimited";
                    const remaining = specialData?.remainingStock ?? null;
                    const total = specialData?.totalStock ?? null;

                    return (
                        <div
                            key={product.id}
                            style={{
                                background: isOn ? "#f8fffe" : "white",
                                borderRadius: 14,
                                padding: "14px 16px",
                                border: `2px solid ${isOn ? GREEN : "#f0f0f0"}`,
                                transition: "border-color 0.2s, background 0.2s",
                            }}
                        >
                            {/* Item header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: "#e8f5ee",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 18, flexShrink: 0,
                                        overflow: "hidden",
                                    }}>
                                        {product.imageUrl
                                            ? <img src={product.imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : (product.category === "tea" ? "🍵" : product.category === "shake" || product.category === "drink" ? "🥤" : "🍽️")}
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a3a2a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {product.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>
                                            {product.category}
                                            {(product as any).price ? ` · ₹${(product as any).price}` : ""}
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle */}
                                <button
                                    onClick={() => handleToggle(product)}
                                    style={{
                                        width: 52,
                                        height: 28,
                                        borderRadius: 99,
                                        background: isOn ? GREEN : "#e5e7eb",
                                        position: "relative",
                                        border: "none",
                                        cursor: "pointer",
                                        flexShrink: 0,
                                        transition: "background 0.2s",
                                        padding: 0,
                                    }}
                                >
                                    <div style={{
                                        position: "absolute",
                                        top: 3,
                                        left: isOn ? 26 : 3,
                                        width: 22,
                                        height: 22,
                                        borderRadius: "50%",
                                        background: "white",
                                        transition: "left 0.2s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }} />
                                    <span style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: isOn ? 6 : "unset",
                                        right: isOn ? "unset" : 6,
                                        transform: "translateY(-50%)",
                                        fontSize: 9,
                                        fontWeight: 900,
                                        color: isOn ? "rgba(255,255,255,0.9)" : "#9ca3af",
                                    }}>
                                        {isOn ? "ON" : "OFF"}
                                    </span>
                                </button>
                            </div>

                            {/* Stock settings (visible when ON) */}
                            {isOn && (
                                <div style={{
                                    marginTop: 12,
                                    paddingTop: 12,
                                    borderTop: "1px solid #e8f5ee",
                                }}>
                                    {/* Stock type radio */}
                                    <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
                                        {(["unlimited", "limited"] as const).map((type) => (
                                            <label key={type} style={{
                                                display: "flex", alignItems: "center", gap: 6,
                                                cursor: "pointer", fontSize: 13, fontWeight: 700,
                                                color: stockType === type ? GREEN : "#6b7280",
                                            }}>
                                                <input
                                                    type="radio"
                                                    name={`stock-${rawId}`}
                                                    value={type}
                                                    checked={stockType === type}
                                                    onChange={() => handleStockType(product, type)}
                                                    style={{ accentColor: GREEN }}
                                                />
                                                {type === "unlimited" ? "∞ Unlimited" : "🔢 Limited"}
                                            </label>
                                        ))}
                                    </div>

                                    {/* Quantity input + remaining (only for limited) */}
                                    {stockType === "limited" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                            <span style={{ fontSize: 13, fontWeight: 700, color: "#3d405b" }}>Qty today:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                defaultValue={total ?? 10}
                                                key={`qty-${rawId}-${total}`}
                                                onBlur={(e) => handleSetQuantity(product, Number(e.target.value))}
                                                style={{
                                                    width: 72,
                                                    padding: "6px 10px",
                                                    border: `1.5px solid #d8f3dc`,
                                                    borderRadius: 8,
                                                    fontSize: 15,
                                                    fontWeight: 700,
                                                    textAlign: "center",
                                                    color: "#1a3a2a",
                                                    fontFamily: FONT,
                                                }}
                                            />
                                            {remaining !== null && total !== null && (
                                                <div style={{
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    color: (remaining <= 3 && remaining > 0) ? "#c0392b" : remaining === 0 ? "#9ca3af" : GREEN,
                                                    background: (remaining <= 3 && remaining > 0) ? "#fde8e8" : remaining === 0 ? "#f0f0f0" : "#d8f3dc",
                                                    padding: "4px 10px",
                                                    borderRadius: 99,
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 4,
                                                    animation: remaining > 0 && remaining <= 3 ? "pulse 1.5s infinite" : "none",
                                                }}>
                                                    {remaining} / {total} remaining
                                                    {remaining === 0 && " · SOLD OUT ⛔"}
                                                    {remaining > 0 && remaining <= 3 && ` · Only ${remaining} left! 🔴`}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Stock badge for unlimited */}
                                    {stockType === "unlimited" && (
                                        <span style={{
                                            fontSize: 12, fontWeight: 700, color: GREEN,
                                            background: "#d8f3dc", padding: "3px 10px", borderRadius: 99,
                                        }}>
                                            ∞ Unlimited stock today
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {products.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
                        <CookingPot style={{ width: 40, height: 40, margin: "0 auto 12px", opacity: 0.4 }} />
                        <p style={{ fontWeight: 700, fontSize: 14 }}>No menu items yet</p>
                        <p style={{ fontSize: 12, marginTop: 4 }}>Add items in the Inventory tab first</p>
                    </div>
                )}
            </div>
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
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}`;
if (!document.querySelector("[data-kitchen-animations]")) {
    styleSheet.setAttribute("data-kitchen-animations", "");
    document.head.appendChild(styleSheet);
}
