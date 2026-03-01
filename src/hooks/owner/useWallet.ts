import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, getDocs, doc, addDoc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Wallet, WalletTransaction } from "@/types/firestore";

export function useWallets(clubId: string | null) {
    return useQuery({
        queryKey: ["owner-wallets", clubId],
        enabled: !!clubId,
        queryFn: async () => {
            const q = query(collection(db, "wallets"), where("clubId", "==", clubId));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as Wallet & { id: string }));
        },
    });
}

export function useWallet(memberId: string | null) {
    return useQuery({
        queryKey: ["owner-wallet", memberId],
        enabled: !!memberId,
        queryFn: async () => {
            const q = query(collection(db, "wallets"), where("userId", "==", memberId));
            const snap = await getDocs(q);
            if (snap.empty) return null;
            return { ...snap.docs[0].data(), id: snap.docs[0].id } as Wallet & { id: string };
        },
    });
}

export function useTransactions(clubId: string | null, memberId?: string) {
    return useQuery({
        queryKey: ["owner-transactions", clubId, memberId],
        enabled: !!clubId,
        queryFn: async () => {
            let q;
            if (memberId) {
                q = query(collection(db, "walletTransactions"), where("userId", "==", memberId), where("clubId", "==", clubId), orderBy("createdAt", "desc"));
            } else {
                q = query(collection(db, "walletTransactions"), where("clubId", "==", clubId), orderBy("createdAt", "desc"));
            }
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() } as WalletTransaction));
        },
    });
}

export function useTopUp() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            memberId: string;
            walletDocId: string;
            clubId: string;
            amount: number;
            paymentMethod: string;
            reference?: string;
            notes?: string;
            currentBalance: number;
        }) => {
            const now = Timestamp.now();
            const newBalance = data.currentBalance + data.amount;
            
            // Update wallet balance
            await updateDoc(doc(db, "wallets", data.walletDocId), {
                balance: newBalance,
                lastUpdated: now,
            });
            
            // Create transaction record
            await addDoc(collection(db, "walletTransactions"), {
                userId: data.memberId,
                clubId: data.clubId,
                type: "credit",
                amount: data.amount,
                reason: "topup",
                addedBy: "owner",
                note: [data.paymentMethod, data.reference, data.notes].filter(Boolean).join(" | "),
                createdAt: now,
                balanceAfter: newBalance,
            });
            
            return newBalance;
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ["owner-wallet", vars.memberId] });
            qc.invalidateQueries({ queryKey: ["owner-wallets", vars.clubId] });
            qc.invalidateQueries({ queryKey: ["owner-transactions"] });
        },
    });
}
