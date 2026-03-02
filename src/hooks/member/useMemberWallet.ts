import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, addDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Wallet, WalletTransaction } from "@/types/firestore";

export function useMyWallet(memberId: string | null) {
    return useQuery({
        queryKey: ["member-wallet", memberId],
        enabled: !!memberId,
        queryFn: async () => {
            const q = query(collection(db, "wallets"), where("userId", "==", memberId));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            return { id: snap.docs[0].id, ...snap.docs[0].data() } as Wallet & { id: string };
        },
    });
}

export function useMyTransactions(memberId: string | null) {
    return useQuery({
        queryKey: ["member-transactions", memberId],
        enabled: !!memberId,
        queryFn: async () => {
            const q = query(collection(db, "walletTransactions"), where("userId", "==", memberId), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
        },
    });
}

export function useRequestTopUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: { memberId: string; memberName: string; memberPhoto: string; clubId: string; amount: number; paymentMethod?: string; reference?: string; notes?: string }) => {
            await addDoc(collection(db, "topupRequests"), {
                memberId: data.memberId,
                memberName: data.memberName,
                memberPhoto: data.memberPhoto || "",
                clubId: data.clubId,
                requestedAmount: data.amount,
                approvedAmount: null,
                status: "pending",
                requestedAt: Timestamp.now(),
                resolvedAt: null,
                resolvedBy: null,
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["member-wallet"] }),
    });
}
