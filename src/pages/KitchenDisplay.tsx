import { useState, useEffect } from "react";
import { useClubContext } from "@/lib/clubDetection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKitchenOrders, useUpdateOrderStatus, useTodayOrdersSummary } from "@/hooks/useOrders";
import KitchenOrderCard from "@/components/orders/KitchenOrderCard";

export default function KitchenDisplay() {
    const { club, loading: clubLoading } = useClubContext();
    const [pin, setPin] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [kitchenPin, setKitchenPin] = useState<string | null>(null);
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        if (club?.kitchenPin) setKitchenPin(club.kitchenPin);
    }, [club]);

    useEffect(() => {
        if (!authenticated) return;
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, [authenticated]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!kitchenPin) { setError("Kitchen display is not configured for this club."); return; }
        if (pin === kitchenPin) setAuthenticated(true);
        else { setError("Invalid PIN. Please try again."); setPin(""); }
    };

    if (clubLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-4">
                <div className="w-full max-w-sm">
                    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="h-14 w-14 mx-auto rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                                <span className="text-white text-2xl">🍳</span>
                            </div>
                            <h1 className="text-2xl font-bold">Kitchen Display</h1>
                            <p className="text-sm text-muted-foreground">{club?.name || "Magic Nutrition Club"}</p>
                            <p className="text-xs text-muted-foreground">Enter the 4-digit kitchen PIN</p>
                        </div>
                        <form onSubmit={handlePinSubmit} className="space-y-4">
                            <Input type="password" inputMode="numeric" maxLength={4} placeholder="• • • •" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-[0.5em] font-mono" autoFocus />
                            {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 text-center">{error}</div>}
                            <Button type="submit" className="w-full" disabled={pin.length !== 4}>Enter Kitchen</Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return <KitchenScreen club={club} clock={clock} onLock={() => { setAuthenticated(false); setPin(""); }} />;
}

function KitchenScreen({ club, clock, onLock }: { club: any; clock: Date; onLock: () => void }) {
    const { orders, loading } = useKitchenOrders();
    const { summary } = useTodayOrdersSummary();
    const updateStatus = useUpdateOrderStatus();

    const pending = orders.filter((o) => o.status === "pending");
    const preparing = orders.filter((o) => o.status === "preparing");

    const handleStatusUpdate = (orderId: string, newStatus: "preparing" | "served") => {
        updateStatus.mutate({ orderId, newStatus });
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-black">🍳 Kitchen</h1>
                    <span className="text-sm text-gray-400">{club?.name}</span>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-400">{summary?.totalOrders || 0} orders today</span>
                    <span className="text-xl font-mono font-bold text-gray-300">
                        {clock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <Button variant="outline" size="sm" onClick={onLock} className="text-gray-400 border-gray-700 hover:bg-gray-800">
                        Lock
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                    <span className="text-6xl mb-4">☕</span>
                    <p className="text-xl font-bold">No active orders</p>
                    <p className="text-sm">Orders will appear here in real-time</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 p-4">
                    {/* Preparing */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-blue-400">
                            🔵 Preparing ({preparing.length})
                        </h2>
                        <div className="space-y-4">
                            {preparing.map((o) => (
                                <KitchenOrderCard key={o.id} order={o} onStatusUpdate={handleStatusUpdate} isUpdating={updateStatus.isPending} />
                            ))}
                            {preparing.length === 0 && <p className="text-sm text-gray-600 text-center py-8">Nothing preparing</p>}
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-yellow-400">
                            🟡 Pending ({pending.length})
                        </h2>
                        <div className="space-y-4">
                            {pending.map((o) => (
                                <KitchenOrderCard key={o.id} order={o} onStatusUpdate={handleStatusUpdate} isUpdating={updateStatus.isPending} />
                            ))}
                            {pending.length === 0 && <p className="text-sm text-gray-600 text-center py-8">No pending orders</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

