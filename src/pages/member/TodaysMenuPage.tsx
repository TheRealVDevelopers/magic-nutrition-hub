import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Wallet as WalletIcon, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import { useMyWallet } from "@/hooks/useMemberWallet";
import { useTodaysSpecialProducts, usePlaceOrder, useMyUnratedOrders, useSubmitRating } from "@/hooks/useOrders";
import ProductCard from "@/components/orders/ProductCard";
import RatingModal from "@/components/orders/RatingModal";
import type { Product, Order } from "@/types/firestore";

interface CartItem {
    product: Product;
    quantity: number;
}

export default function TodaysMenuPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { firebaseUser, userProfile } = useAuth();
    const { club } = useClubContext();
    const { wallet } = useMyWallet();
    const { products, loading } = useTodaysSpecialProducts();
    const placeOrder = usePlaceOrder();
    const { data: unrated } = useMyUnratedOrders();
    const submitRating = useSubmitRating();
    const [cart, setCart] = useState<Record<string, CartItem>>({});
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

    const currencyName = club?.currencyName || "Coins";
    const balance = wallet?.balance ?? 0;

    const totalCost = useMemo(() =>
        Object.values(cart).reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
    const insufficientBalance = totalCost > balance;

    const handleSelect = (product: Product, quantity: number) => {
        setCart((prev) => {
            const next = { ...prev };
            if (quantity <= 0) { delete next[product.id]; return next; }
            next[product.id] = { product, quantity };
            return next;
        });
    };

    const handlePlaceOrder = async () => {
        if (!firebaseUser || !userProfile || insufficientBalance) return;
        const items = Object.values(cart).map((c) => ({
            productId: c.product.id, productName: c.product.name,
            quantity: c.quantity, pricePerUnit: c.product.price, notes: "",
        }));
        try {
            await placeOrder.mutateAsync({
                memberId: firebaseUser.uid, memberName: userProfile.name,
                memberPhoto: userProfile.photo || "", staffId: firebaseUser.uid,
                items, totalCost,
            });
            setOrderPlaced(true);
            setTimeout(() => navigate("/member/orders"), 3000);
        } catch (err: any) {
            toast({ title: "Order failed", description: err.message, variant: "destructive" });
        }
    };

    const handleRate = (rating: number, note: string) => {
        if (!ratingOrder) return;
        submitRating.mutate(
            { clubId: club?.id || "", orderId: ratingOrder.id, rating, ratingNote: note },
            {
                onSuccess: () => { toast({ title: "Thanks for your rating! ⭐" }); setRatingOrder(null); },
                onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
            }
        );
    };

    if (orderPlaced) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in space-y-4">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-emerald-800">Order Placed! ☕</h2>
                <p className="text-sm text-muted-foreground">Your order has been sent to the kitchen</p>
                <p className="text-xs text-muted-foreground">Redirecting to orders…</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-32">
            <div>
                <h1 className="text-2xl font-black text-wellness-forest">Today's Menu</h1>
                <p className="text-sm text-muted-foreground">
                    {club?.name} • {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </p>
            </div>

            {/* Unrated orders banner */}
            {unrated && unrated.length > 0 && (
                <button
                    onClick={() => setRatingOrder(unrated[0])}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-left"
                >
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                    <p className="text-sm font-medium text-yellow-800">
                        You have {unrated.length} order{unrated.length > 1 ? "s" : ""} waiting for your rating ⭐
                    </p>
                </button>
            )}

            {/* Products grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto" />
                    <p className="text-sm text-muted-foreground">No items available today.</p>
                    <p className="text-xs text-muted-foreground">Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {products.map((p) => (
                        <ProductCard
                            key={p.id}
                            product={p}
                            currencyName={currencyName}
                            isSelected={!!cart[p.id]}
                            currentQty={cart[p.id]?.quantity}
                            onSelect={handleSelect}
                        />
                    ))}
                </div>
            )}

            {/* Sticky order summary */}
            {Object.keys(cart).length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl p-4 z-40 animate-in">
                    <div className="max-w-2xl mx-auto space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">
                                    {Object.values(cart).reduce((s, c) => s + c.quantity, 0)} items • {totalCost} {currencyName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <WalletIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Balance: {balance} {currencyName}</span>
                                </div>
                            </div>
                            {insufficientBalance && (
                                <Badge variant="destructive" className="text-[10px] gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Insufficient
                                </Badge>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            disabled={insufficientBalance || placeOrder.isPending}
                            onClick={handlePlaceOrder}
                        >
                            {placeOrder.isPending ? "Placing…" : `Place Order — ${totalCost} ${currencyName}`}
                        </Button>
                    </div>
                </div>
            )}

            {/* Rating modal */}
            {ratingOrder && (
                <RatingModal order={ratingOrder} open onSubmit={handleRate} onClose={() => setRatingOrder(null)} />
            )}
        </div>
    );
}
