import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderItem } from "@/types/firestore";

function todayStr() {
    return new Date().toISOString().split("T")[0];
}

export function useOrders(clubId: string | null, date?: string) {
    const d = date || todayStr();
    return useQuery({
        queryKey: ["owner-orders", clubId, d],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(
                collection(db, "orders"),
                where("clubId", "==", clubId),
                where("date", "==", d),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        },
    });
}

export function useAllOrders(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-all-orders", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(
                collection(db, "orders"),
                where("clubId", "==", clubId),
                orderBy("createdAt", "desc")
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
        },
    });
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
        }) => {
            const now = Timestamp.now();
            const today = todayStr();
            const newBalance = data.currentBalance - data.total;

            // Create order
            const orderRef = await addDoc(collection(db, "orders"), {
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
                createdAt: now,
                servedAt: null,
            });

            // Deduct wallet
            await updateDoc(doc(db, "wallets", data.walletDocId), {
                balance: newBalance,
                lastUpdated: now,
            });

            // Create transaction
            await addDoc(collection(db, "walletTransactions"), {
                userId: data.memberId,
                clubId: data.clubId,
                type: "debit",
                amount: data.total,
                reason: "product",
                addedBy: "owner",
                note: `Order: ${data.items.map(i => i.productName).join(", ")}`,
                createdAt: now,
                balanceAfter: newBalance,
            });

            return orderRef.id;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-orders"] });
            qc.invalidateQueries({ queryKey: ["owner-all-orders"] });
            qc.invalidateQueries({ queryKey: ["owner-wallet"] });
            qc.invalidateQueries({ queryKey: ["owner-wallets"] });
            qc.invalidateQueries({ queryKey: ["owner-transactions"] });
        },
    });
}

export function useUpdateOrderStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: Order["status"] }) => {
            const updates: Record<string, unknown> = { status, updatedAt: Timestamp.now() };
            if (status === "served") updates.servedAt = Timestamp.now();
            await updateDoc(doc(db, "orders", orderId), updates);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["owner-orders"] });
            qc.invalidateQueries({ queryKey: ["owner-all-orders"] });
        },
    });
}
