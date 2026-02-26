import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    collection, doc, onSnapshot, getDocs, setDoc,
    query, where, orderBy, limit, startAfter, Timestamp,
    QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { Wallet, WalletTransaction, TopupRequest } from "@/types/firestore";

// ─── useMyWallet (real-time) ────────────────────────────────────────────

export function useMyWallet() {
    const { firebaseUser } = useAuth();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!firebaseUser) return;
        const unsub = onSnapshot(
            doc(db, "wallets", firebaseUser.uid),
            (snap) => {
                if (snap.exists()) setWallet(snap.data() as Wallet);
                else setWallet(null);
                setLoading(false);
            },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsub();
    }, [firebaseUser]);

    return { wallet, loading, error };
}

// ─── useMyTransactions (paginated) ──────────────────────────────────────

const PAGE_SIZE = 20;

export function useMyTransactions() {
    const { firebaseUser } = useAuth();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        if (!firebaseUser) return;
        const fetchFirst = async () => {
            try {
                const q = query(
                    collection(db, "walletTransactions"),
                    where("userId", "==", firebaseUser.uid),
                    orderBy("createdAt", "desc"),
                    limit(PAGE_SIZE)
                );
                const snap = await getDocs(q);
                const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalletTransaction);
                setTransactions(docs);
                setLastDoc(snap.docs[snap.docs.length - 1] || null);
                setHasMore(snap.docs.length === PAGE_SIZE);
            } catch (err: any) { setError(err.message); }
            setLoading(false);
        };
        fetchFirst();
    }, [firebaseUser]);

    const loadMore = useCallback(async () => {
        if (!firebaseUser || !lastDoc || !hasMore) return;
        try {
            const q = query(
                collection(db, "walletTransactions"),
                where("userId", "==", firebaseUser.uid),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(PAGE_SIZE)
            );
            const snap = await getDocs(q);
            const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as WalletTransaction);
            setTransactions((prev) => [...prev, ...docs]);
            setLastDoc(snap.docs[snap.docs.length - 1] || null);
            setHasMore(snap.docs.length === PAGE_SIZE);
        } catch (err: any) { setError(err.message); }
    }, [firebaseUser, lastDoc, hasMore]);

    return { transactions, loadMore, hasMore, loading, error };
}

// ─── useMyTopupRequests ─────────────────────────────────────────────────

export function useMyTopupRequests() {
    const { firebaseUser } = useAuth();
    return useQuery({
        queryKey: ["member", "topupRequests", firebaseUser?.uid],
        queryFn: async () => {
            const snap = await getDocs(
                query(
                    collection(db, "topupRequests"),
                    where("memberId", "==", firebaseUser!.uid),
                    orderBy("requestedAt", "desc")
                )
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TopupRequest);
        },
        enabled: !!firebaseUser,
    });
}

// ─── useMyPendingRequest ────────────────────────────────────────────────

export function useMyPendingRequest() {
    const { firebaseUser } = useAuth();
    const [pendingRequest, setPendingRequest] = useState<TopupRequest | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!firebaseUser) return;
        const q = query(
            collection(db, "topupRequests"),
            where("memberId", "==", firebaseUser.uid),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q, (snap) => {
            setPendingRequest(snap.docs.length > 0 ? ({ id: snap.docs[0].id, ...snap.docs[0].data() } as TopupRequest) : null);
            setLoading(false);
        });
        return () => unsub();
    }, [firebaseUser]);

    return { pendingRequest, hasPending: !!pendingRequest, loading };
}

// ─── useRaiseTopupRequest ───────────────────────────────────────────────

export function useRaiseTopupRequest() {
    const qc = useQueryClient();
    const { firebaseUser, userProfile } = useAuth();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async (amount: number) => {
            if (!firebaseUser || !userProfile || !club) throw new Error("Not ready");
            if (amount <= 0) throw new Error("Amount must be greater than 0");

            // Double-check no pending
            const q = query(
                collection(db, "topupRequests"),
                where("memberId", "==", firebaseUser.uid),
                where("status", "==", "pending")
            );
            const existing = await getDocs(q);
            if (existing.size > 0) throw new Error("You already have a pending request");

            const id = "topup_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
            await setDoc(doc(db, "topupRequests", id), {
                id,
                memberId: firebaseUser.uid,
                memberName: userProfile.name,
                memberPhoto: userProfile.photo || "",
                clubId: club.id,
                requestedAmount: amount,
                approvedAmount: null,
                status: "pending",
                requestedAt: Timestamp.now(),
                resolvedAt: null,
                resolvedBy: null,
            } as TopupRequest);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["member", "topupRequests"] }),
    });
}
