import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    collection, doc, getDocs, updateDoc, writeBatch,
    query, where, orderBy, limit, startAfter, onSnapshot,
    Timestamp, QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { Order, Product, WalletTransaction } from "@/types/firestore";

function today() { return new Date().toISOString().slice(0, 10); }

// ─── useTodaysSpecialProducts (real-time) ───────────────────────────────

export function useTodaysSpecialProducts() {
    const { club } = useClubContext();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!club) return;
        const q = query(
            collection(db, "products"),
            where("clubId", "==", club.id),
            where("isAvailableToday", "==", true)
        );
        const unsub = onSnapshot(q,
            (snap) => { setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product)); setLoading(false); },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsub();
    }, [club]);

    return { products, loading, error };
}

// ─── useAllClubProducts ─────────────────────────────────────────────────

export function useAllClubProducts() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["orders", "products", club?.id],
        queryFn: async () => {
            const snap = await getDocs(query(collection(db, "products"), where("clubId", "==", club!.id)));
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
        },
        enabled: !!club,
    });
}

// ─── usePlaceOrder (batch write: order + wallet debit) ──────────────────

export function usePlaceOrder() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ memberId, memberName, memberPhoto, staffId, items, totalCost }: {
            memberId: string; memberName: string; memberPhoto: string;
            staffId: string;
            items: { productId: string; productName: string; quantity: number; pricePerUnit: number; notes: string }[];
            totalCost: number;
        }) => {
            if (!club) throw new Error("Club not loaded");

            // Read wallet
            const walletSnap = await getDocs(query(collection(db, "wallets"), where("userId", "==", memberId)));
            if (walletSnap.empty) throw new Error("Wallet not found");
            const walletDoc = walletSnap.docs[0];
            const currentBalance = walletDoc.data().balance as number;
            if (currentBalance < totalCost) throw new Error(`Insufficient ${club.currencyName} balance`);

            // Read product stocks for deduction
            const productsToUpdate = [];
            for (const item of items) {
                const prodSnap = await getDocs(query(collection(db, "products"), where("id", "==", item.productId)));
                if (!prodSnap.empty) {
                    const pDoc = prodSnap.docs[0];
                    const currentStock = pDoc.data().stock as number;
                    productsToUpdate.push({
                        docRef: doc(db, "products", pDoc.id),
                        newStock: Math.max(0, currentStock - item.quantity),
                    });
                }
            }

            const batch = writeBatch(db);
            const orderId = "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            const txId = "wtx_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
            const newBalance = currentBalance - totalCost;

            // 1. Create order
            batch.set(doc(db, "orders", orderId), {
                id: orderId, memberId, memberName, memberPhoto,
                clubId: club.id, staffId, items, totalCost,
                status: "pending", rating: null, ratingNote: null,
                date: today(), createdAt: Timestamp.now(), servedAt: null,
            } as Order);

            // 2. Deduct wallet
            batch.update(doc(db, "wallets", walletDoc.id), {
                balance: newBalance,
                lastUpdated: Timestamp.now(),
            });

            // 3. Create wallet transaction
            batch.set(doc(db, "walletTransactions", txId), {
                id: txId, userId: memberId, clubId: club.id,
                type: "debit", amount: totalCost,
                reason: "shake_order", addedBy: staffId,
                note: `Order #${orderId.slice(-6)}`,
                createdAt: Timestamp.now(), balanceAfter: newBalance,
            } as WalletTransaction);

            // 4. Deduct inventory stock
            for (const p of productsToUpdate) {
                batch.update(p.docRef, { stock: p.newStock, updatedAt: Timestamp.now() });
            }

            await batch.commit();
            return orderId;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["member", "topupRequests"] });
            qc.invalidateQueries({ queryKey: ["inventory"] });
        },
    });
}

// ─── useUpdateOrderStatus ───────────────────────────────────────────────

export function useUpdateOrderStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: "preparing" | "served" }) => {
            const updates: Record<string, unknown> = { status: newStatus };
            if (newStatus === "served") updates.servedAt = Timestamp.now();
            await updateDoc(doc(db, "orders", orderId), updates);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    });
}

// ─── useSubmitRating ────────────────────────────────────────────────────

export function useSubmitRating() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, rating, ratingNote }: { orderId: string; rating: number; ratingNote: string }) => {
            await updateDoc(doc(db, "orders", orderId), { rating, ratingNote });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    });
}

// ─── useMyOrders (paginated) ────────────────────────────────────────────

const PAGE_SIZE = 20;

export function useMyOrders() {
    const { firebaseUser } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;
        const fetchFirst = async () => {
            try {
                const q = query(
                    collection(db, "orders"),
                    where("memberId", "==", firebaseUser.uid),
                    orderBy("createdAt", "desc"),
                    limit(PAGE_SIZE)
                );
                const snap = await getDocs(q);
                setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
                setLastDoc(snap.docs[snap.docs.length - 1] || null);
                setHasMore(snap.docs.length === PAGE_SIZE);
            } catch (err: any) { setError(err.message); }
            setLoading(false);
        };
        fetchFirst();
    }, [firebaseUser]);

    const loadMore = useCallback(async () => {
        if (!firebaseUser || !lastDoc || !hasMore) return;
        const q = query(
            collection(db, "orders"),
            where("memberId", "==", firebaseUser.uid),
            orderBy("createdAt", "desc"),
            startAfter(lastDoc),
            limit(PAGE_SIZE)
        );
        const snap = await getDocs(q);
        setOrders((prev) => [...prev, ...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)]);
        setLastDoc(snap.docs[snap.docs.length - 1] || null);
        setHasMore(snap.docs.length === PAGE_SIZE);
    }, [firebaseUser, lastDoc, hasMore]);

    return { orders, loadMore, hasMore, loading, error };
}

// ─── useMyUnratedOrders ─────────────────────────────────────────────────

export function useMyUnratedOrders() {
    const { firebaseUser } = useAuth();
    return useQuery({
        queryKey: ["orders", "unrated", firebaseUser?.uid],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "orders"),
                    where("memberId", "==", firebaseUser!.uid),
                    where("status", "==", "served"),
                    where("rating", "==", null)
                )
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
        },
        enabled: !!firebaseUser,
    });
}

// ─── useKitchenOrders (real-time) ───────────────────────────────────────

export function useKitchenOrders() {
    const { club } = useClubContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!club) return;
        const q = query(
            collection(db, "orders"),
            where("clubId", "==", club.id),
            where("date", "==", today()),
            where("status", "in", ["pending", "preparing"]),
            orderBy("createdAt", "asc")
        );
        const unsub = onSnapshot(q,
            (snap) => { setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)); setLoading(false); },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsub();
    }, [club]);

    return { orders, loading, error };
}

// ─── useTodayOrdersSummary ──────────────────────────────────────────────

export function useTodayOrdersSummary() {
    const { club } = useClubContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!club) return;
        const q = query(
            collection(db, "orders"),
            where("clubId", "==", club.id),
            where("date", "==", today())
        );
        const unsub = onSnapshot(q,
            (snap) => { setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)); setLoading(false); },
            () => setLoading(false)
        );
        return () => unsub();
    }, [club]);

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.totalCost, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Most popular product
    const productCounts: Record<string, { name: string; count: number }> = {};
    orders.forEach((o) => o.items.forEach((item) => {
        if (!productCounts[item.productId]) productCounts[item.productId] = { name: item.productName, count: 0 };
        productCounts[item.productId].count += item.quantity;
    }));
    const mostPopular = Object.values(productCounts).sort((a, b) => b.count - a.count)[0]?.name || "—";

    const statusCounts = { pending: 0, preparing: 0, served: 0 };
    orders.forEach((o) => { if (o.status in statusCounts) statusCounts[o.status as keyof typeof statusCounts]++; });

    return { summary: { totalOrders, totalRevenue, avgOrderValue, mostPopular, statusCounts }, orders, loading };
}

// ─── useAllTodayOrders ──────────────────────────────────────────────────

export function useAllTodayOrders() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["orders", "today", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "orders"), where("clubId", "==", club!.id), where("date", "==", today()), orderBy("createdAt", "desc"))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
        },
        enabled: !!club,
    });
}
