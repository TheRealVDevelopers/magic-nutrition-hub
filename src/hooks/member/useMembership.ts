import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
    collection, doc, getDocs, updateDoc, addDoc,
    query, Timestamp, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { useClubContext } from "@/lib/clubDetection";
import type { MembershipPlan } from "@/types/firestore";

// Fallback plans if the club has no sub-collection
const ts0 = null as any;
const FALLBACK_PLANS: MembershipPlan[] = [
    { id: "bronze", name: "Bronze", durationDays: 30, price: 499, benefits: [], color: "#cd7f32", isActive: true, clubId: "", createdAt: ts0 },
    { id: "silver", name: "Silver", durationDays: 30, price: 799, benefits: [], color: "#c0c0c0", isActive: true, clubId: "", createdAt: ts0 },
    { id: "gold", name: "Gold", durationDays: 30, price: 999, benefits: [], color: "#ffd700", isActive: true, clubId: "", createdAt: ts0 },
    { id: "platinum", name: "Platinum", durationDays: 30, price: 1499, benefits: [], color: "#e5e4e2", isActive: true, clubId: "", createdAt: ts0 },
];


// ─── useClubMembershipPlans ───────────────────────────────────────────────────

export function useClubMembershipPlans(clubId: string | null) {
    const [plans, setPlans] = useState<MembershipPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!clubId) { setLoading(false); return; }
        const fetch = async () => {
            try {
                const snap = await getDocs(query(collection(db, "clubs", clubId, "membershipPlans")));
                if (snap.empty) {
                    setPlans(FALLBACK_PLANS);
                } else {
                    const active = snap.docs
                        .map(d => ({ id: d.id, ...d.data() } as MembershipPlan))
                        .filter(p => p.isActive !== false)
                        .sort((a, b) => a.price - b.price);
                    setPlans(active.length ? active : FALLBACK_PLANS);
                }
            } catch {
                setPlans(FALLBACK_PLANS);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [clubId]);

    return { plans, loading };
}

// ─── useRenewMembership ───────────────────────────────────────────────────────

export function useRenewMembership() {
    const { firebaseUser, userProfile } = useAuth();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async (data: {
            plan: MembershipPlan;
            walletDocId: string;
            currentBalance: number;
            currentMembershipEnd: Timestamp | null;
        }) => {
            if (!firebaseUser || !userProfile || !club) throw new Error("Not ready");
            const { plan, walletDocId, currentBalance, currentMembershipEnd } = data;

            if (currentBalance < plan.price) {
                throw new Error(`Insufficient balance. You need ₹${plan.price - currentBalance} more.`);
            }

            const newBalance = currentBalance - plan.price;

            // Membership date calculation
            const now = new Date();
            let startDate: Date;
            if (currentMembershipEnd) {
                const end = currentMembershipEnd.toDate();
                // Extend from current expiry if still active, else from today
                startDate = end > now ? end : now;
            } else {
                startDate = now;
            }
            const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

            const nowTs = Timestamp.now();

            // 1. Deduct wallet
            await updateDoc(doc(db, "wallets", walletDocId), {
                balance: newBalance,
                lastUpdated: serverTimestamp(),
            });

            // 2. Update member profile
            await updateDoc(doc(db, "users", firebaseUser.uid), {
                membershipTier: plan.name.toLowerCase(),
                membershipStart: Timestamp.fromDate(startDate),
                membershipEnd: Timestamp.fromDate(endDate),
            });

            // 3. Write transaction
            await addDoc(collection(db, "walletTransactions"), {
                userId: firebaseUser.uid,
                clubId: club.id,
                type: "debit",
                amount: plan.price,
                reason: "membership",
                description: `${plan.name} Membership Renewal`,
                planName: plan.name,
                membershipFrom: Timestamp.fromDate(startDate),
                membershipTo: Timestamp.fromDate(endDate),
                note: `${plan.name} — ${plan.durationDays} days`,
                addedBy: "member",
                balanceBefore: currentBalance,
                balanceAfter: newBalance,
                createdAt: nowTs,
            });

            return { newBalance, startDate, endDate, plan };
        },
    });
}
