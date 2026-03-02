import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    collection, doc, getDoc, getDocs, setDoc, updateDoc,
    query, where, writeBatch, Timestamp, onSnapshot, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useClubContext } from "@/lib/clubDetection";
import { generateMemberId, generatePrefixFromName } from "@/utils/generateMemberId";
import type {
    User, Wallet, WalletTransaction, TopupRequest, MembershipPlan,
    Attendance, Order, Product, Announcement, Club, Referral
} from "@/types/firestore";

// ─── helpers ────────────────────────────────────────────────────────────

function today() {
    return new Date().toISOString().slice(0, 10);
}

// ─── useClubMembers ─────────────────────────────────────────────────────

export function useClubMembers() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "members", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "users"), where("clubId", "==", club!.id), where("role", "==", "member"))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
        },
        enabled: !!club,
    });
}

// ─── useClubVolunteers ──────────────────────────────────────────────────

export function useClubVolunteers() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "volunteers", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "users"), where("clubId", "==", club!.id), where("role", "==", "staff"))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as User);
        },
        enabled: !!club,
    });
}

// ─── useMemberById ──────────────────────────────────────────────────────

export function useMemberById(memberId: string) {
    return useQuery({
        queryKey: ["owner", "member", memberId],
        queryFn: async () => {
            const snap = await getDoc(doc(db, "users", memberId));
            if (!snap.exists()) throw new Error("Member not found");
            return { id: snap.id, ...snap.data() } as User;
        },
        enabled: !!memberId,
    });
}

// ─── useAddMember ───────────────────────────────────────────────────────

export function useAddMember() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async (input: {
            name: string; phone: string; email?: string;
            dob?: Date | null; anniversary?: Date | null;
            photo?: string; referredBy?: string | null;
            referredByMemberId?: string | null;
            memberType?: string;
        }) => {
            if (!club) throw new Error("Club not loaded");
            const batch = writeBatch(db);
            const now = Timestamp.now();
            const memberId = "member_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

            // Generate member ID (PREFIX-LETTER-NUMBER)
            const prefix = club.memberIdPrefix || generatePrefixFromName(club.name);
            const generatedMemberId = await generateMemberId(club.id, prefix);

            // Determine treePath from referrer
            let treePath = memberId;
            let parentUserId: string | null = input.referredBy || null;
            if (parentUserId) {
                const parentSnap = await getDoc(doc(db, "users", parentUserId));
                if (parentSnap.exists()) {
                    treePath = (parentSnap.data() as User).treePath + "/" + memberId;
                }
            }

            const userData: any = {
                id: memberId, name: input.name, phone: input.phone,
                email: input.email || "", photo: input.photo || "",
                role: "member", clubId: club.id,
                parentUserId, treePath,
                membershipTier: null, membershipStart: null, membershipEnd: null, membershipPlanId: null,
                status: "active",
                dob: input.dob ? Timestamp.fromDate(input.dob) : null,
                anniversary: input.anniversary ? Timestamp.fromDate(input.anniversary) : null,
                qrCode: "", isClubOwner: false, ownedClubId: null,
                originalClubId: club.id, referredBy: parentUserId,
                referredByMemberId: input.referredByMemberId || null,
                memberType: input.memberType || null,
                memberId: generatedMemberId,
                createdAt: now, updatedAt: now,
            };
            batch.set(doc(db, "users", memberId), userData);

            // Create wallet
            batch.set(doc(db, "wallets", memberId), {
                userId: memberId, clubId: club.id,
                currencyName: club.currencyName, balance: 0, lastUpdated: now,
            } as Wallet);

            // Create referral record & award bonus
            if (parentUserId) {
                const bonusCoins = club.referralBonusCoins ?? 50;

                const refId = "ref_" + Date.now();
                batch.set(doc(db, "referrals", refId), {
                    id: refId, referrerId: parentUserId, referredId: memberId,
                    clubId: club.id, bonusCoinsAwarded: bonusCoins,
                    status: "rewarded", createdAt: now, rewardedAt: now,
                });

                // Reward referrer wallet natively inside batch
                const referrerWalletSnap = await getDoc(doc(db, "wallets", parentUserId));
                if (referrerWalletSnap.exists()) {
                    const referrerWallet = referrerWalletSnap.data() as Wallet;
                    const newBalance = referrerWallet.balance + bonusCoins;
                    batch.update(doc(db, "wallets", parentUserId), { balance: newBalance, lastUpdated: now });

                    const txId = "tx_" + Date.now() + "_ref";
                    batch.set(doc(db, "walletTransactions", txId), {
                        id: txId, userId: parentUserId, clubId: club.id,
                        type: "credit", amount: bonusCoins, reason: "referral_bonus",
                        addedBy: "system", note: `Referral bonus for ${input.name}`,
                        createdAt: now, balanceAfter: newBalance,
                    } as WalletTransaction);
                }
            }

            await batch.commit();
            return { memberId, generatedMemberId };
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "members"] }),
    });
}


// ─── useUpdateMember ────────────────────────────────────────────────────


export function useUpdateMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ memberId, data }: { memberId: string; data: Partial<User> }) => {
            await updateDoc(doc(db, "users", memberId), { ...data, updatedAt: Timestamp.now() } as any);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useDeactivateMember ────────────────────────────────────────────────

export function useDeactivateMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (memberId: string) => {
            await updateDoc(doc(db, "users", memberId), { status: "paused", updatedAt: Timestamp.now() });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useMembershipPlans ─────────────────────────────────────────────────

export function useMembershipPlans() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "plans", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "memberships"), where("clubId", "==", club!.id))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MembershipPlan);
        },
        enabled: !!club,
    });
}

// ─── useCreateMembershipPlan ────────────────────────────────────────────

export function useCreateMembershipPlan() {
    const qc = useQueryClient();
    const { club } = useClubContext();
    return useMutation({
        mutationFn: async (plan: Omit<MembershipPlan, "id" | "clubId" | "createdAt">) => {
            if (!club) throw new Error("Club not loaded");
            const planId = "plan_" + Date.now();
            await setDoc(doc(db, "memberships", planId), {
                ...plan, id: planId, clubId: club.id, createdAt: Timestamp.now(),
            });
            return planId;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "plans"] }),
    });
}

// ─── useUpdateMembershipPlan ────────────────────────────────────────────

export function useUpdateMembershipPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ planId, data }: { planId: string; data: Partial<MembershipPlan> }) => {
            await updateDoc(doc(db, "memberships", planId), data as any);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "plans"] }),
    });
}

// ─── useAssignMembership ────────────────────────────────────────────────

export function useAssignMembership() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ memberId, planId }: { memberId: string; planId: string }) => {
            if (!club) throw new Error("Club not loaded");
            const planSnap = await getDoc(doc(db, "memberships", planId));
            if (!planSnap.exists()) throw new Error("Plan not found");
            const plan = planSnap.data() as MembershipPlan;

            const walletSnap = await getDoc(doc(db, "wallets", memberId));
            if (!walletSnap.exists()) throw new Error("Wallet not found");
            const wallet = walletSnap.data() as Wallet;

            if (wallet.balance < plan.price) {
                throw new Error(`Insufficient balance. Need ${plan.price} ${club.currencyName}, have ${wallet.balance}.`);
            }

            const batch = writeBatch(db);
            const now = Timestamp.now();
            const newBalance = wallet.balance - plan.price;
            const start = new Date();
            const end = new Date(start.getTime() + (plan.durationDays ?? 0) * 86400000);

            // Deduct wallet
            batch.update(doc(db, "wallets", memberId), { balance: newBalance, lastUpdated: now });

            // Create transaction
            const txId = "tx_" + Date.now();
            batch.set(doc(db, "walletTransactions", txId), {
                id: txId, userId: memberId, clubId: club.id,
                type: "debit", amount: plan.price, reason: "membership",
                addedBy: null, note: `${plan.name} membership`, createdAt: now, balanceAfter: newBalance,
            } as WalletTransaction);

            // Update user membership
            batch.update(doc(db, "users", memberId), {
                membershipTier: plan.name.toLowerCase() as any,
                membershipPlanId: planId,
                membershipStart: Timestamp.fromDate(start),
                membershipEnd: Timestamp.fromDate(end),
                updatedAt: now,
            });

            await batch.commit();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── usePendingTopupRequests (real-time) ─────────────────────────────────

export function usePendingTopupRequests() {
    const { club } = useClubContext();
    const [requests, setRequests] = useState<TopupRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!club) return;
        const q = query(
            collection(db, "topupRequests"),
            where("clubId", "==", club.id),
            where("status", "==", "pending")
        );
        const unsub = onSnapshot(q,
            (snap) => {
                setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TopupRequest));
                setLoading(false);
            },
            (err) => { setError(err.message); setLoading(false); }
        );
        return () => unsub();
    }, [club]);

    return { requests, loading, error };
}

// ─── useApproveTopup ────────────────────────────────────────────────────

export function useApproveTopup() {
    const qc = useQueryClient();
    const { club } = useClubContext();

    return useMutation({
        mutationFn: async ({ requestId, approvedAmount, resolvedBy }: {
            requestId: string; approvedAmount: number; resolvedBy: string;
        }) => {
            if (!club) throw new Error("Club not loaded");
            const reqSnap = await getDoc(doc(db, "topupRequests", requestId));
            if (!reqSnap.exists()) throw new Error("Request not found");
            const req = reqSnap.data() as TopupRequest;

            const walletSnap = await getDoc(doc(db, "wallets", req.memberId));
            if (!walletSnap.exists()) throw new Error("Wallet not found");
            const wallet = walletSnap.data() as Wallet;

            const batch = writeBatch(db);
            const now = Timestamp.now();
            const newBalance = wallet.balance + approvedAmount;

            batch.update(doc(db, "topupRequests", requestId), {
                status: "approved", approvedAmount, resolvedAt: now, resolvedBy,
            });
            batch.update(doc(db, "wallets", req.memberId), { balance: newBalance, lastUpdated: now });

            const txId = "tx_" + Date.now();
            batch.set(doc(db, "walletTransactions", txId), {
                id: txId, userId: req.memberId, clubId: club.id,
                type: "credit", amount: approvedAmount, reason: "topup",
                addedBy: resolvedBy, note: "Wallet topup", createdAt: now, balanceAfter: newBalance,
            } as WalletTransaction);

            await batch.commit();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useRejectTopup ─────────────────────────────────────────────────────

export function useRejectTopup() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ requestId, resolvedBy }: { requestId: string; resolvedBy: string }) => {
            await updateDoc(doc(db, "topupRequests", requestId), {
                status: "rejected", resolvedAt: Timestamp.now(), resolvedBy,
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useTopupHistory ────────────────────────────────────────────────────

export function useTopupHistory() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "topupHistory", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "topupRequests"), where("clubId", "==", club!.id))
            );
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as TopupRequest)
                .filter((r) => r.status !== "pending")
                .sort((a, b) => (b.resolvedAt?.toMillis?.() || 0) - (a.resolvedAt?.toMillis?.() || 0));
        },
        enabled: !!club,
    });
}

// ─── useDailyStats ──────────────────────────────────────────────────────

export function useDailyStats() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "dailyStats", club?.id, today()],
        queryFn: async () => {
            const [attendSnap, ordersSnap, membersSnap, productsSnap] = await Promise.all([
                getDocs(query(collection(db, "attendance"), where("clubId", "==", club!.id), where("date", "==", today()))),
                getDocs(query(collection(db, "orders"), where("clubId", "==", club!.id), where("date", "==", today()))),
                getDocs(query(collection(db, "users"), where("clubId", "==", club!.id), where("role", "==", "member"), where("status", "==", "active"))),
                getDocs(query(collection(db, "products"), where("clubId", "==", club!.id))),
            ]);
            const todayRevenue = ordersSnap.docs.reduce((sum, d) => sum + ((d.data() as Order).totalCost || 0), 0);
            const lowStock = productsSnap.docs.filter((d) => {
                const p = d.data() as Product;
                return p.stock <= p.lowStockThreshold;
            }).length;

            return {
                todayAttendance: attendSnap.size,
                todayRevenue,
                totalActiveMembers: membersSnap.size,
                lowStockCount: lowStock,
            };
        },
        enabled: !!club,
    });
}

// ─── useDownlineClubs ───────────────────────────────────────────────────

export function useDownlineClubs() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "downline", club?.id],
        queryFn: async () => {
            const snap = await getDocs(collection(db, "clubs"));
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Club)
                .filter((c) => c.id !== club!.id && c.treePath.startsWith(club!.treePath + "/"));
        },
        enabled: !!club,
    });
}

// ─── useAnnouncements ───────────────────────────────────────────────────

export function useAnnouncements() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "announcements", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "announcements"), where("clubId", "==", club!.id), orderBy("createdAt", "desc"))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Announcement);
        },
        enabled: !!club,
    });
}

// ─── useCreateAnnouncement ──────────────────────────────────────────────

export function useCreateAnnouncement() {
    const qc = useQueryClient();
    const { club } = useClubContext();
    return useMutation({
        mutationFn: async ({ title, message, expiresAt, postedBy }: {
            title: string; message: string; expiresAt?: Date | null; postedBy: string;
        }) => {
            if (!club) throw new Error("Club not loaded");
            const id = "ann_" + Date.now();
            await setDoc(doc(db, "announcements", id), {
                id, clubId: club.id, title, message, postedBy,
                createdAt: Timestamp.now(),
                expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
                isActive: true,
            } as Announcement);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "announcements"] }),
    });
}

// ─── useDeleteAnnouncement ──────────────────────────────────────────────

export function useDeleteAnnouncement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (annId: string) => {
            await updateDoc(doc(db, "announcements", annId), { isActive: false });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "announcements"] }),
    });
}

// ─── useTodaysSpecial ───────────────────────────────────────────────────

export function useTodaysSpecial() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "todaysSpecial", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id), where("isAvailableToday", "==", true))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
        },
        enabled: !!club,
    });
}

// ─── useAllProducts ─────────────────────────────────────────────────────

export function useAllProducts() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "products", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product);
        },
        enabled: !!club,
    });
}

// ─── useSetTodaysSpecial ────────────────────────────────────────────────

export function useSetTodaysSpecial() {
    const qc = useQueryClient();
    const { club } = useClubContext();
    return useMutation({
        mutationFn: async (selectedIds: string[]) => {
            if (!club) throw new Error("Club not loaded");
            const allSnap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club.id))
            );
            const batch = writeBatch(db);
            allSnap.docs.forEach((d) => {
                batch.update(doc(db, "products", d.id), {
                    isAvailableToday: selectedIds.includes(d.id),
                });
            });
            await batch.commit();
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useMemberWallet ────────────────────────────────────────────────────

export function useMemberWallet(memberId: string) {
    return useQuery({
        queryKey: ["owner", "wallet", memberId],
        queryFn: async () => {
            const snap = await getDoc(doc(db, "wallets", memberId));
            if (!snap.exists()) return null;
            return snap.data() as Wallet;
        },
        enabled: !!memberId,
    });
}

// ─── useMemberTransactions ──────────────────────────────────────────────

export function useMemberTransactions(memberId: string) {
    return useQuery({
        queryKey: ["owner", "transactions", memberId],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "walletTransactions"), where("userId", "==", memberId))
            );
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as WalletTransaction)
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        },
        enabled: !!memberId,
    });
}

// ─── useMemberOrders ────────────────────────────────────────────────────

export function useMemberOrders(memberId: string) {
    return useQuery({
        queryKey: ["owner", "orders", memberId],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "orders"), where("memberId", "==", memberId))
            );
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Order)
                .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        },
        enabled: !!memberId,
    });
}

// ─── useMemberWeightLog ─────────────────────────────────────────────────

export function useMemberWeightLog(memberId: string) {
    return useQuery({
        queryKey: ["owner", "weightLog", memberId],
        queryFn: async () => {
            const snap = await getDocs(collection(db, "users", memberId, "weightLog"));
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (a.date?.toMillis?.() || 0) - (b.date?.toMillis?.() || 0));
        },
        enabled: !!memberId,
    });
}

// ─── useAddWeightEntry ──────────────────────────────────────────────────

export function useAddWeightEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ memberId, weight, notes }: { memberId: string; weight: number; notes?: string }) => {
            const id = "wl_" + Date.now();
            await setDoc(doc(db, "users", memberId, "weightLog", id), {
                id, weight, date: Timestamp.now(), notes: notes || "",
            });
        },
        onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["owner", "weightLog", vars.memberId] }),
    });
}

// ─── useTodayAttendance ─────────────────────────────────────────────────

export function useTodayAttendance() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "todayAttendance", club?.id, today()],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "attendance"), where("clubId", "==", club!.id), where("date", "==", today()))
            );
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance);
        },
        enabled: !!club,
    });
}

// ─── useMemberReferrals ───────────────────────────────────────────────────

export function useMemberReferrals(memberId: string) {
    return useQuery({
        queryKey: ["owner", "referrals", memberId],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "referrals"), where("referrerId", "==", memberId))
            );
            const refs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Referral));

            const detailed = [];
            for (const r of refs) {
                const uSnap = await getDoc(doc(db, "users", r.referredId || ""));
                if (uSnap.exists()) {
                    detailed.push({
                        ...r,
                        referredUser: { id: uSnap.id, ...uSnap.data() } as User
                    });
                }
            }
            return detailed;
        },
        enabled: !!memberId,
    });
}

// ─── useRecentOrders ────────────────────────────────────────────────────

export function useRecentOrders() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "recentOrders", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "orders"), where("clubId", "==", club!.id), orderBy("createdAt", "desc"))
            );
            return snap.docs.slice(0, 5).map((d) => ({ id: d.id, ...d.data() }) as Order);
        },
        enabled: !!club,
    });
}

// ─── useAddVolunteer ────────────────────────────────────────────────────

export function useAddVolunteer() {
    const qc = useQueryClient();
    const { club } = useClubContext();
    return useMutation({
        mutationFn: async (input: { name: string; phone: string; email?: string; photo?: string }) => {
            if (!club) throw new Error("Club not loaded");
            const id = "staff_" + Date.now();
            const now = Timestamp.now();
            await setDoc(doc(db, "users", id), {
                id, name: input.name, phone: input.phone,
                email: input.email || "", photo: input.photo || "",
                role: "staff", clubId: club.id,
                parentUserId: null, treePath: id,
                membershipTier: null, membershipStart: null, membershipEnd: null, membershipPlanId: null,
                status: "active", dob: null, anniversary: null,
                qrCode: "", isClubOwner: false, ownedClubId: null,
                originalClubId: club.id, referredBy: null,
                createdAt: now, updatedAt: now,
            });
            return id;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner", "volunteers"] }),
    });
}

// ─── useUpdateClubSettings ──────────────────────────────────────────────

export function useUpdateClubSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ clubId, data }: { clubId: string; data: Record<string, any> }) => {
            await updateDoc(doc(db, "clubs", clubId), data);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["owner"] }),
    });
}

// ─── useExpiringMembers ─────────────────────────────────────────────────

export function useExpiringMembers() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "expiring", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "users"), where("clubId", "==", club!.id), where("role", "==", "member"))
            );
            const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000);
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as User)
                .filter((u) => u.membershipEnd && u.membershipEnd.toDate() <= sevenDaysFromNow && u.membershipEnd.toDate() >= new Date());
        },
        enabled: !!club,
    });
}

// ─── useLowStockProducts ───────────────────────────────────────────────

export function useLowStockProducts() {
    const { club } = useClubContext();
    return useQuery({
        queryKey: ["owner", "lowStock", club?.id],
        queryFn: async () => {
            const snap = await getDocs(
                query(collection(db, "products"), where("clubId", "==", club!.id))
            );
            return snap.docs
                .map((d) => ({ id: d.id, ...d.data() }) as Product)
                .filter((p) => p.stock <= p.lowStockThreshold);
        },
        enabled: !!club,
    });
}
