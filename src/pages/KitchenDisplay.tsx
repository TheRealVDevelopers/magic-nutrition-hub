import { useState, useEffect } from "react";
import { useClubContext } from "@/lib/clubDetection";
import { Button } from "@/components/ui/button";
import { useKitchenOrders, useUpdateOrderStatus, useTodayOrdersSummary } from "@/hooks/useOrders";
import KitchenOrderCard from "@/components/orders/KitchenOrderCard";
import PinGate from "@/components/PinGate";
import { usePinAccess } from "@/hooks/usePinAccess";

export default function KitchenDisplay() {
    const { isVerified, isLoading, clubName, clubLogo, verify, logout } = usePinAccess("kitchen");
    const [clock, setClock] = useState(new Date());

    useEffect(() => {
        if (!isVerified) return;
        const t = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(t);
    }, [isVerified]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isVerified) {
        return (
            <PinGate
                type="kitchen"
                clubName={clubName}
                clubLogo={clubLogo}
                pinLength={6}
                isLoading={false}
                onVerify={verify}
            />
        );
    }

    return <KitchenScreen clubName={clubName} clock={clock} onLock={logout} />;
}

function KitchenScreen({ clubName, clock, onLock }: { clubName: string; clock: Date; onLock: () => void }) {
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
                    <span className="text-sm text-gray-400">{clubName}</span>
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
