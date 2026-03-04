import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, writeBatch, Timestamp, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderItem } from "@/types/firestore";

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

export function useTodayOrders(clubId: string | null) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!clubId) {
            setOrders([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const today = todayStr();
        const q = query(
            collection(db, "orders"),
            where("clubId", "==", clubId),
            where("date", "==", today),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
            setOrders(data);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching today's orders:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [clubId]);

    return { data: orders, isLoading };
}

export function usePlaceOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            clubId: string;
            memberId: string;
            memberName: string;
            memberPhoto: string;
            items: OrderItem[];
            total: number;
            walletDocId: string;
            currentBalance: number;
            notes?: string;
        }) => {
            const now = Timestamp.now();
            const today = todayStr();
            const newBalance = data.currentBalance - data.total;

            const batch = writeBatch(db);

            // 1. Create Order
            const orderRef = doc(collection(db, "orders"));
            batch.set(orderRef, {
                clubId: data.clubId,
                memberId: data.memberId,
                memberName: data.memberName,
                memberPhoto: data.memberPhoto || "",
                staffId: "owner",
                items: data.items,
                totalCost: data.total,
                status: "pending",
                rating: null,
                ratingNote: null,
                date: today,
                notes: data.notes || "",
                walletDeducted: true,
                createdAt: now,
                servedAt: null,
            });

            // 2. Deduct Wallet
            const walletRef = doc(db, "wallets", data.walletDocId);
            batch.update(walletRef, {
                balance: newBalance,
                lastUpdated: now,
            });

            // 3. Create Transaction
            const transactionRef = doc(collection(db, "walletTransactions"));
            batch.set(transactionRef, {
                userId: data.memberId,
                clubId: data.clubId,
                type: "debit",
                amount: data.total,
                reason: "product",
                addedBy: "owner",
                note: `Order: ${data.items.map(i => i.productName).join(", ")}`,
                orderId: orderRef.id,
                createdAt: now,
                balanceBefore: data.currentBalance,
                balanceAfter: newBalance,
            });

            await batch.commit();
            return orderRef.id;
        },
        onSuccess: () => {
            // we don't invalidate today's orders query because it's realtime,
            // but we invalidate others
            qc.invalidateQueries({ queryKey: ["owner-all-orders"] });
            qc.invalidateQueries({ queryKey: ["owner-wallet"] });
            qc.invalidateQueries({ queryKey: ["owner-wallets"] });
            qc.invalidateQueries({ queryKey: ["owner-transactions"] });
            qc.invalidateQueries({ queryKey: ["member-dashboard-orders"] });
        },
    });
}

export function useUpdateOrderStatus() {
    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
            const updates: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
            if (status === "served") updates.servedAt = Timestamp.now();

            const batch = writeBatch(db);
            batch.update(doc(db, "orders", orderId), updates);
            await batch.commit();
        },
    });
}

export function useCancelOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            orderId,
            memberId,
            clubId,
            refundAmount,
            walletDocId,
            currentBalance
        }: {
            orderId: string;
            memberId: string;
            clubId: string;
            refundAmount: number;
            walletDocId: string;
            currentBalance: number;
        }) => {
            const now = Timestamp.now();
            const newBalance = currentBalance + refundAmount;

            const batch = writeBatch(db);

            // 1. Update order status
            const orderRef = doc(db, "orders", orderId);
            batch.update(orderRef, {
                status: "cancelled",
                updatedAt: now
            });

            // 2. Refund wallet
            const walletRef = doc(db, "wallets", walletDocId);
            batch.update(walletRef, {
                balance: newBalance,
                lastUpdated: now
            });

            // 3. Create refund transaction
            const transactionRef = doc(collection(db, "walletTransactions"));
            batch.set(transactionRef, {
                userId: memberId,
                clubId: clubId,
                type: "credit",
                amount: refundAmount,
                reason: "adjustment",
                addedBy: "owner",
                note: `Refund for Cancelled Order #${orderId.slice(-6)}`,
                orderId: orderId,
                createdAt: now,
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
            });

            await batch.commit();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-wallet"] });
            qc.invalidateQueries({ queryKey: ["owner-wallets"] });
            qc.invalidateQueries({ queryKey: ["owner-transactions"] });
            qc.invalidateQueries({ queryKey: ["member-dashboard-orders"] });
        }
    });
}
