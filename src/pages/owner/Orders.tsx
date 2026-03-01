import { useState, useMemo } from "react";
import { ShoppingCart, Plus, Search, ChevronRight, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useOrders, usePlaceOrder, useUpdateOrderStatus } from "@/hooks/owner/useOrders";
import { useMenuItems } from "@/hooks/owner/useMenu";
import { useMembers } from "@/hooks/owner/useMembers";
import { useWallets } from "@/hooks/owner/useWallet";
import { useClubContext } from "@/lib/clubDetection";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@/types/firestore";

const STATUS_COLORS: Record<Order["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    preparing: "bg-blue-100 text-blue-800 border-blue-200",
    served: "bg-green-100 text-green-800 border-green-200",
};

export default function Orders() {
    const { club } = useClubContext();
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [newOrderOpen, setNewOrderOpen] = useState(false);
    const { toast } = useToast();

    const { data: orders, isLoading } = useOrders(club?.id ?? null, date);
    const { data: members } = useMembers(club?.id ?? null);
    const { data: menuItems } = useMenuItems(club?.id ?? null);
    const { data: wallets } = useWallets(club?.id ?? null);
    const placeOrder = usePlaceOrder();
    const updateStatus = useUpdateOrderStatus();

    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = date === todayStr;
    const todayOrders = isToday ? orders : [];
    const todayRevenue = todayOrders?.reduce((s, o) => s + o.totalCost, 0) ?? 0;

    const handleStatusUpdate = (orderId: string, status: Order["status"]) => {
        updateStatus.mutate(
            { orderId, status },
            {
                onSuccess: () => toast({ title: "Status updated" }),
                onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
            }
        );
    };

    return (
        <div className="space-y-6 p-5" style={{ fontFamily: "'Nunito', sans-serif" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl font-bold" style={{ color: "#2d9653" }}>Orders</h1>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-12 min-h-[48px] rounded-xl border px-4 text-sm"
                    />
                    <Button size="lg" className="min-h-[48px] gap-2" style={{ backgroundColor: "#2d9653" }} onClick={() => setNewOrderOpen(true)}>
                        <Plus className="w-5 h-5" /> New Order
                    </Button>
                </div>
            </div>

            {isToday && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-2xl p-5 border shadow-sm">
                        <p className="text-sm text-muted-foreground">Today&apos;s Orders</p>
                        <p className="text-2xl font-bold" style={{ color: "#2d9653" }}>{todayOrders?.length ?? 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border shadow-sm">
                        <p className="text-sm text-muted-foreground">Revenue Today</p>
                        <p className="text-2xl font-bold" style={{ color: "#2d9653" }}>₹{todayRevenue}</p>
                    </div>
                </div>
            )}

            <div className="space-y-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
                ) : orders && orders.length > 0 ? (
                    orders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onStatusUpdate={handleStatusUpdate}
                            isUpdating={updateStatus.isPending}
                        />
                    ))
                ) : (
                    <div className="bg-white rounded-2xl p-12 text-center text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No orders for this date.</p>
                    </div>
                )}
            </div>

            <NewOrderDialog
                open={newOrderOpen}
                onOpenChange={setNewOrderOpen}
                clubId={club?.id ?? ""}
                members={members ?? []}
                menuItems={menuItems ?? []}
                wallets={wallets ?? []}
                placeOrder={placeOrder}
                toast={toast}
            />
        </div>
    );
}

function OrderCard({
    order,
    onStatusUpdate,
    isUpdating,
}: {
    order: Order;
    onStatusUpdate: (id: string, status: Order["status"]) => void;
    isUpdating: boolean;
}) {
    const itemsSummary = order.items.map((i) => `${i.productName}×${i.quantity}`).join(", ");
    const time = order.createdAt?.toDate?.()?.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) ?? "";

    return (
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-sm text-muted-foreground">#{order.id.slice(-6)}</p>
                    <p className="font-bold flex items-center gap-2">
                        <User className="w-4 h-4" /> {order.memberName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{itemsSummary}</p>
                    <p className="text-sm font-semibold mt-1">₹{order.totalCost}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Badge className={STATUS_COLORS[order.status]}>{order.status}</Badge>
                    <p className="text-xs text-muted-foreground">{time}</p>
                    {order.status === "pending" && (
                        <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => onStatusUpdate(order.id, "preparing")}>
                            → Preparing
                        </Button>
                    )}
                    {order.status === "preparing" && (
                        <Button size="sm" style={{ backgroundColor: "#2d9653" }} disabled={isUpdating} onClick={() => onStatusUpdate(order.id, "served")}>
                            → Served
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function NewOrderDialog({
    open,
    onOpenChange,
    clubId,
    members,
    menuItems,
    wallets,
    placeOrder,
    toast,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    clubId: string;
    members: { id: string; name: string; photo?: string }[];
    menuItems: { id: string; name: string; price: number; category: string; isAvailableToday?: boolean }[];
    wallets: { id: string; userId: string; balance: number }[];
    placeOrder: ReturnType<typeof usePlaceOrder>;
    toast: ReturnType<typeof useToast>["toast"];
}) {
    const [step, setStep] = useState(1);
    const [memberSearch, setMemberSearch] = useState("");
    const [selectedMember, setSelectedMember] = useState<{ id: string; name: string; photo?: string } | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const filteredMembers = useMemo(() => {
        if (!memberSearch.trim()) return members;
        const q = memberSearch.toLowerCase();
        return members.filter((m) => m.name.toLowerCase().includes(q));
    }, [members, memberSearch]);

    const wallet = selectedMember ? wallets.find((w) => w.userId === selectedMember.id) : null;
    const cartItems = useMemo(() => {
        return menuItems
            .filter((m) => m.isAvailableToday !== false && (quantities[m.id] ?? 0) > 0)
            .map((m) => ({
                productId: m.id,
                productName: m.name,
                quantity: quantities[m.id] ?? 0,
                pricePerUnit: m.price,
                notes: "",
            }));
    }, [menuItems, quantities]);

    const total = cartItems.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

    const reset = () => {
        setStep(1);
        setMemberSearch("");
        setSelectedMember(null);
        setQuantities({});
    };

    const handleClose = (v: boolean) => {
        if (!v) reset();
        onOpenChange(v);
    };

    const handleSubmit = () => {
        if (!selectedMember || cartItems.length === 0 || !wallet) {
            toast({ title: "Select member and add items", variant: "destructive" });
            return;
        }
        if (wallet.balance < total) {
            toast({ title: "Insufficient balance", variant: "destructive" });
            return;
        }
        placeOrder.mutate(
            {
                clubId,
                memberId: selectedMember.id,
                memberName: selectedMember.name,
                memberPhoto: selectedMember.photo ?? "",
                items: cartItems,
                total,
                walletDocId: wallet.id,
                currentBalance: wallet.balance,
            },
            {
                onSuccess: () => {
                    toast({ title: "Order placed!" });
                    handleClose(false);
                },
                onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Order</DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4">
                        <Label>Select Member</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Search member..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} className="pl-9 min-h-[48px]" />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-2">
                            {filteredMembers.map((m) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 min-h-[48px] text-left"
                                    onClick={() => {
                                        setSelectedMember(m);
                                        setStep(2);
                                    }}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">{m.name}</span>
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </button>
                            ))}
                            {filteredMembers.length === 0 && <p className="text-sm text-muted-foreground py-4">No members found.</p>}
                        </div>
                    </div>
                )}

                {step === 2 && selectedMember && (
                    <div className="space-y-4">
                        <p className="text-sm font-medium">Member: {selectedMember.name}</p>
                        <Label>Menu Items</Label>
                        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto">
                            {menuItems.filter((m) => m.isAvailableToday !== false).map((item) => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(0, (q[item.id] ?? 0) - 1) }))}>
                                            −
                                        </Button>
                                        <span className="w-8 text-center font-medium">{quantities[item.id] ?? 0}</span>
                                        <Button size="icon" variant="outline" className="h-10 w-10" onClick={() => setQuantities((q) => ({ ...q, [item.id]: (q[item.id] ?? 0) + 1 }))}>
                                            +
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4 space-y-2">
                            <p className="font-semibold">Total: ₹{total}</p>
                            <p className="text-sm text-muted-foreground">Wallet: ₹{wallet?.balance ?? 0}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button style={{ backgroundColor: "#2d9653" }} onClick={handleSubmit} disabled={placeOrder.isPending || total === 0 || (wallet?.balance ?? 0) < total}>
                                    Confirm Order
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
